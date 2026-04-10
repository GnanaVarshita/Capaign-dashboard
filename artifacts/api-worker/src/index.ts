import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { signToken } from './auth/jwt';
import { authMiddleware, getUser, requireRoles } from './middleware/authMiddleware';
import {
  SEED_USERS, SEED_ENTRIES, SEED_POS, SEED_REGIONS,
  SEED_PRODUCTS, SEED_CROPS, SEED_ACTIVITIES
} from './data/seed';

// ---------- In-memory store (swap with Neon DB calls when ready) ----------
const store = {
  users:               structuredClone(SEED_USERS) as any[],
  entries:             structuredClone(SEED_ENTRIES) as any[],
  pos:                 structuredClone(SEED_POS) as any[],
  regions:             structuredClone(SEED_REGIONS) as any[],
  products:            [...SEED_PRODUCTS] as string[],
  crops:               [...SEED_CROPS] as string[],
  activities:          [...SEED_ACTIVITIES] as string[],
  bills:               [] as any[],
  serviceReceivers:    [] as any[],
  vendorProfiles:      {} as Record<string, any>,
  budgetRequests:      [] as any[],
  budgetRequestGroups: [] as any[],
};

// ---------- Helpers ----------
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const today = () => new Date().toISOString().split('T')[0];
const safeUser = (u: any) => { const { password: _p, ...rest } = u; return rest; };

const GLOBAL_ROLES   = ['Owner', 'All India Manager'];
const APPROVER_ROLES = ['Owner', 'All India Manager', 'Regional Manager', 'Zonal Manager'];

function scopeEntries(entries: any[], user: any, allUsers: any[]) {
  if (GLOBAL_ROLES.includes(user.role)) return entries;
  const userMap = Object.fromEntries(allUsers.map((u: any) => [u.id, u]));
  if (user.role === 'Regional Manager') {
    return entries.filter(e => userMap[e.userId]?.territory?.region === user.territory?.region);
  }
  if (user.role === 'Zonal Manager') {
    return entries.filter(e =>
      userMap[e.userId]?.territory?.zone === user.territory?.zone &&
      userMap[e.userId]?.territory?.region === user.territory?.region
    );
  }
  if (user.role === 'Area Manager') return entries.filter(e => e.userId === user.id);
  if (user.role === 'Vendor') return entries.filter(e => e.vendorId === user.id);
  return [];
}

function scopePOs(pos: any[], user: any, entries: any[]) {
  if (GLOBAL_ROLES.includes(user.role)) return pos;
  if (user.role === 'Vendor') {
    const myRegions = (user.territory?.assignedZones || []).map((z: any) => z.region);
    return pos.filter(po =>
      myRegions.some((r: string) => po.regionBudgets?.[r]) ||
      entries.some(e => e.po === po.poNumber && e.vendorId === user.id)
    );
  }
  const myRegion = user.territory?.region;
  if (!myRegion) return [];
  return pos.filter(po => {
    if (!po.regionBudgets?.[myRegion]) return false;
    if (user.role === 'Zonal Manager') {
      const myZone = user.territory?.zone;
      const za = po.zoneAllocations?.[myRegion] || {};
      if (Object.keys(za).length > 0 && !za[myZone]) return false;
    }
    return true;
  });
}

function getPendingForApprover(entries: any[], user: any, allUsers: any[]) {
  const pending = entries.filter(e => e.status === 'pending');
  if (GLOBAL_ROLES.includes(user.role)) return pending;
  const userMap = Object.fromEntries(allUsers.map((u: any) => [u.id, u]));
  if (user.role === 'Regional Manager') {
    return pending.filter(e => {
      const eu = userMap[e.userId];
      return eu?.territory?.region === user.territory?.region &&
        ['Zonal Manager', 'Area Manager', 'Vendor'].includes(eu?.role);
    });
  }
  if (user.role === 'Zonal Manager') {
    return pending.filter(e => {
      const eu = userMap[e.userId];
      return eu?.territory?.zone === user.territory?.zone &&
        eu?.territory?.region === user.territory?.region &&
        ['Area Manager', 'Vendor'].includes(eu?.role);
    });
  }
  return [];
}

// ---------- App ----------
const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ==================== PUBLIC ====================

app.get('/health', c => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// POST /api/auth/login
app.post('/api/auth/login', async c => {
  const body = await c.req.json().catch(() => ({}));
  const { loginId, password } = body as { loginId?: string; password?: string };

  if (!loginId || !password)
    return c.json({ error: 'loginId and password are required' }, 400);

  const user = store.users.find(
    u => u.loginId.toLowerCase() === loginId.toLowerCase() &&
         u.password === password &&
         u.status === 'active'
  );
  if (!user) return c.json({ error: 'Invalid credentials or account inactive' }, 401);

  const token = await signToken({ id: user.id, role: user.role, loginId: user.loginId });
  return c.json({ token, user: safeUser(user) });
});

// ==================== PROTECTED ====================
app.use('/api/*', authMiddleware);

// GET /api/me
app.get('/api/me', c => {
  const jwtUser = getUser(c);
  const user = store.users.find(u => u.id === jwtUser.id);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(safeUser(user));
});

// ==================== USERS ====================

app.get('/api/users', c => {
  const jwtUser = getUser(c);
  if (GLOBAL_ROLES.includes(jwtUser.role)) return c.json(store.users.map(safeUser));

  const caller = store.users.find(u => u.id === jwtUser.id);
  let users: any[] = [];
  if (jwtUser.role === 'Regional Manager') {
    users = store.users.filter(u =>
      u.territory?.region === caller?.territory?.region ||
      u.territory?.assignedRMIds?.includes(caller?.id)
    );
  } else if (jwtUser.role === 'Zonal Manager') {
    users = store.users.filter(u =>
      (u.territory?.zone === caller?.territory?.zone &&
       u.territory?.region === caller?.territory?.region) ||
      u.territory?.assignedZones?.some((z: any) => z.zone === caller?.territory?.zone)
    );
  } else {
    users = store.users.filter(u => u.id === jwtUser.id);
  }
  return c.json(users.map(safeUser));
});

app.get('/api/users/:id', c => {
  const user = store.users.find(u => u.id === c.req.param('id'));
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(safeUser(user));
});

app.post('/api/users', requireRoles('Owner'), async c => {
  const data = await c.req.json();
  const newUser = { ...data, id: uid('u'), status: data.status || 'active' };
  store.users.push(newUser);
  return c.json(safeUser(newUser), 201);
});

app.put('/api/users/:id', requireRoles('Owner'), async c => {
  const idx = store.users.findIndex(u => u.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'User not found' }, 404);
  const updates = await c.req.json();
  store.users[idx] = { ...store.users[idx], ...updates };
  return c.json(safeUser(store.users[idx]));
});

app.delete('/api/users/:id', requireRoles('Owner'), c => {
  const idx = store.users.findIndex(u => u.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'User not found' }, 404);
  store.users.splice(idx, 1);
  return c.json({ success: true });
});

// ==================== ENTRIES ====================

app.get('/api/entries', c => {
  const jwtUser = getUser(c);
  const caller = store.users.find(u => u.id === jwtUser.id);
  if (!caller) return c.json({ error: 'User not found' }, 404);
  return c.json(scopeEntries(store.entries, caller, store.users));
});

app.get('/api/entries/pending', c => {
  const jwtUser = getUser(c);
  const caller = store.users.find(u => u.id === jwtUser.id);
  if (!caller) return c.json({ error: 'User not found' }, 404);
  return c.json(getPendingForApprover(store.entries, caller, store.users));
});

app.get('/api/entries/mine', c => {
  const jwtUser = getUser(c);
  return c.json(store.entries.filter(e => e.userId === jwtUser.id));
});

app.post('/api/entries', requireRoles('Area Manager', 'Vendor', 'Owner', 'All India Manager'), async c => {
  const jwtUser = getUser(c);
  const data = await c.req.json();
  const entry = { ...data, id: uid('e'), status: 'pending', decidedBy: '', decidedAt: '', userId: data.userId || jwtUser.id };
  store.entries.unshift(entry);
  return c.json(entry, 201);
});

app.put('/api/entries/:id', async c => {
  const jwtUser = getUser(c);
  const idx = store.entries.findIndex(e => e.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'Entry not found' }, 404);
  const entry = store.entries[idx];
  const canEdit = GLOBAL_ROLES.includes(jwtUser.role) ||
    (entry.userId === jwtUser.id && entry.status === 'pending');
  if (!canEdit) return c.json({ error: 'Forbidden' }, 403);
  const updates = await c.req.json();
  store.entries[idx] = { ...entry, ...updates };
  return c.json(store.entries[idx]);
});

app.put('/api/entries/:id/status', requireRoles(...APPROVER_ROLES), async c => {
  const jwtUser = getUser(c);
  const caller = store.users.find(u => u.id === jwtUser.id);
  const idx = store.entries.findIndex(e => e.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'Entry not found' }, 404);
  const { status, remarks } = await c.req.json() as { status: string; remarks?: string };
  if (!['approved', 'rejected'].includes(status))
    return c.json({ error: 'status must be approved or rejected' }, 400);
  store.entries[idx] = {
    ...store.entries[idx], status,
    decidedBy: caller?.name || jwtUser.id,
    decidedByDesignation: caller?.role,
    decidedAt: today(),
    ...(remarks ? { remarks } : {}),
  };
  return c.json(store.entries[idx]);
});

app.delete('/api/entries/:id', async c => {
  const jwtUser = getUser(c);
  const idx = store.entries.findIndex(e => e.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'Entry not found' }, 404);
  const entry = store.entries[idx];
  const canDelete = jwtUser.role === 'Owner' ||
    (entry.userId === jwtUser.id && entry.status === 'pending');
  if (!canDelete) return c.json({ error: 'Forbidden – can only delete your own pending entries' }, 403);
  store.entries.splice(idx, 1);
  return c.json({ success: true });
});

// ==================== PURCHASE ORDERS ====================

app.get('/api/pos', c => {
  const jwtUser = getUser(c);
  const caller = store.users.find(u => u.id === jwtUser.id);
  if (!caller) return c.json({ error: 'User not found' }, 404);
  return c.json(scopePOs(store.pos, caller, store.entries));
});

app.get('/api/pos/:id', c => {
  const po = store.pos.find(p => p.id === c.req.param('id') || p.poNumber === c.req.param('id'));
  if (!po) return c.json({ error: 'PO not found' }, 404);
  return c.json(po);
});

app.post('/api/pos', requireRoles('Owner', 'All India Manager'), async c => {
  const jwtUser = getUser(c);
  const caller = store.users.find(u => u.id === jwtUser.id);
  const data = await c.req.json();
  const po = { ...data, id: uid('po'), approvalStatus: 'pending', createdBy: caller?.name || jwtUser.id, createdAt: today() };
  store.pos.unshift(po);
  return c.json(po, 201);
});

app.put('/api/pos/:id', requireRoles('Owner', 'All India Manager'), async c => {
  const idx = store.pos.findIndex(p => p.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'PO not found' }, 404);
  const updates = await c.req.json();
  store.pos[idx] = { ...store.pos[idx], ...updates };
  return c.json(store.pos[idx]);
});

app.put('/api/pos/:id/approve', requireRoles('Owner', 'All India Manager'), c => {
  const jwtUser = getUser(c);
  const caller = store.users.find(u => u.id === jwtUser.id);
  const idx = store.pos.findIndex(p => p.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'PO not found' }, 404);
  store.pos[idx] = { ...store.pos[idx], approvalStatus: 'approved', approvedBy: caller?.name || jwtUser.id, approvedAt: today(), status: 'Active' };
  return c.json(store.pos[idx]);
});

app.put('/api/pos/:id/reject', requireRoles('Owner', 'All India Manager'), async c => {
  const idx = store.pos.findIndex(p => p.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'PO not found' }, 404);
  const { reason } = await c.req.json().catch(() => ({ reason: '' }));
  store.pos[idx] = { ...store.pos[idx], approvalStatus: 'rejected', rejectionReason: reason || '', status: 'Draft' };
  return c.json(store.pos[idx]);
});

app.put('/api/pos/:id/lapse', requireRoles('Owner'), c => {
  const idx = store.pos.findIndex(p => p.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'PO not found' }, 404);
  store.pos[idx] = { ...store.pos[idx], status: 'Lapsed' };
  return c.json(store.pos[idx]);
});

// ==================== BILLS ====================

app.get('/api/bills', c => {
  const jwtUser = getUser(c);
  const bills = jwtUser.role === 'Vendor'
    ? store.bills.filter(b => b.vendorId === jwtUser.id)
    : store.bills;
  return c.json(bills);
});

app.get('/api/bills/:id', c => {
  const bill = store.bills.find(b => b.id === c.req.param('id'));
  if (!bill) return c.json({ error: 'Bill not found' }, 404);
  return c.json(bill);
});

app.post('/api/bills', requireRoles('Vendor', 'Owner', 'All India Manager'), async c => {
  const jwtUser = getUser(c);
  const caller = store.users.find(u => u.id === jwtUser.id);
  const data = await c.req.json();
  const year = new Date().getFullYear();
  const count = store.bills.filter(b => b.invoiceNumber?.startsWith(`INV/${year}/`)).length + 1;
  const invoiceNumber = data.invoiceNumber || `INV/${year}/${String(count).padStart(3, '0')}`;
  const bill = { ...data, id: uid('bill'), status: 'draft', createdAt: today(), invoiceNumber, vendorId: data.vendorId || jwtUser.id, vendorName: data.vendorName || caller?.name };
  store.bills.unshift(bill);
  return c.json(bill, 201);
});

app.put('/api/bills/:id', async c => {
  const jwtUser = getUser(c);
  const idx = store.bills.findIndex(b => b.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'Bill not found' }, 404);
  const bill = store.bills[idx];
  const canEdit = jwtUser.role === 'Owner' || (bill.vendorId === jwtUser.id && bill.status === 'draft');
  if (!canEdit) return c.json({ error: 'Forbidden' }, 403);
  const updates = await c.req.json();
  store.bills[idx] = { ...bill, ...updates };
  return c.json(store.bills[idx]);
});

app.put('/api/bills/:id/submit', requireRoles('Vendor', 'Owner'), async c => {
  const jwtUser = getUser(c);
  const idx = store.bills.findIndex(b => b.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'Bill not found' }, 404);
  if (jwtUser.role === 'Vendor' && store.bills[idx].vendorId !== jwtUser.id) return c.json({ error: 'Forbidden' }, 403);
  store.bills[idx] = { ...store.bills[idx], status: 'submitted', submittedAt: today() };
  return c.json(store.bills[idx]);
});

app.put('/api/bills/:id/pay', requireRoles('Owner', 'Finance Administrator'), async c => {
  const idx = store.bills.findIndex(b => b.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'Bill not found' }, 404);
  const { paymentId, paymentDate } = await c.req.json().catch(() => ({}));
  store.bills[idx] = { ...store.bills[idx], status: 'paid', paidAt: paymentDate || today(), paymentId, paymentDate };
  return c.json(store.bills[idx]);
});

// ==================== BUDGET REQUEST GROUPS ====================

app.get('/api/budget-request-groups', c => {
  const jwtUser = getUser(c);
  const groups = (jwtUser.role === 'Area Manager' || jwtUser.role === 'Vendor')
    ? store.budgetRequestGroups.filter(g => g.status === 'active')
    : store.budgetRequestGroups;
  return c.json(groups);
});

app.post('/api/budget-request-groups', requireRoles('Owner', 'All India Manager'), async c => {
  const jwtUser = getUser(c);
  const caller = store.users.find(u => u.id === jwtUser.id);
  const data = await c.req.json();
  const requestNumber = `BR-${new Date().getFullYear()}-${String(store.budgetRequestGroups.length + 1).padStart(3, '0')}`;
  const group = { ...data, id: uid('brg'), requestNumber, aimId: jwtUser.id, aimName: caller?.name || '', createdAt: today(), status: 'active' };
  store.budgetRequestGroups.unshift(group);
  return c.json(group, 201);
});

app.put('/api/budget-request-groups/:id/close', requireRoles('Owner', 'All India Manager'), c => {
  const idx = store.budgetRequestGroups.findIndex(g => g.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'Group not found' }, 404);
  store.budgetRequestGroups[idx] = { ...store.budgetRequestGroups[idx], status: 'closed' };
  return c.json(store.budgetRequestGroups[idx]);
});

// ==================== BUDGET REQUESTS ====================

app.get('/api/budget-requests', c => {
  const jwtUser = getUser(c);
  const caller = store.users.find(u => u.id === jwtUser.id);
  if (GLOBAL_ROLES.includes(jwtUser.role)) return c.json(store.budgetRequests);
  let requests = store.budgetRequests;
  if (jwtUser.role === 'Area Manager') requests = requests.filter(r => r.areaManagerId === jwtUser.id);
  else if (jwtUser.role === 'Zonal Manager') requests = requests.filter(r => r.zone === caller?.territory?.zone && r.region === caller?.territory?.region);
  else if (jwtUser.role === 'Regional Manager') requests = requests.filter(r => r.region === caller?.territory?.region);
  return c.json(requests);
});

app.post('/api/budget-requests', requireRoles('Area Manager', 'Owner'), async c => {
  const jwtUser = getUser(c);
  const caller = store.users.find(u => u.id === jwtUser.id);
  const data = await c.req.json();
  const request = { ...data, id: uid('br'), status: 'submitted', createdAt: today(), areaManagerId: data.areaManagerId || jwtUser.id, areaManagerName: data.areaManagerName || caller?.name };
  store.budgetRequests.unshift(request);
  return c.json(request, 201);
});

app.put('/api/budget-requests/:id/approve', requireRoles(...APPROVER_ROLES), async c => {
  const jwtUser = getUser(c);
  const caller = store.users.find(u => u.id === jwtUser.id);
  const idx = store.budgetRequests.findIndex(r => r.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'Budget request not found' }, 404);
  const req = store.budgetRequests[idx];
  let update: Record<string, any> = {};
  if (jwtUser.role === 'Zonal Manager' && req.status === 'submitted') {
    update = { status: 'zm-approved', zmId: jwtUser.id, zmName: caller?.name, zmApprovedAt: today() };
  } else if (jwtUser.role === 'Regional Manager' && req.status === 'zm-approved') {
    update = { status: 'rm-approved', rmId: jwtUser.id, rmName: caller?.name, rmApprovedAt: today() };
  } else if (GLOBAL_ROLES.includes(jwtUser.role) && req.status === 'rm-approved') {
    update = { status: 'aim-approved', aimId: jwtUser.id, aimName: caller?.name, aimApprovedAt: today() };
  } else {
    return c.json({ error: 'Cannot approve: incorrect role or request status sequence' }, 400);
  }
  store.budgetRequests[idx] = { ...req, ...update };
  return c.json(store.budgetRequests[idx]);
});

app.put('/api/budget-requests/:id', async c => {
  const idx = store.budgetRequests.findIndex(r => r.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'Budget request not found' }, 404);
  const updates = await c.req.json();
  store.budgetRequests[idx] = { ...store.budgetRequests[idx], ...updates };
  return c.json(store.budgetRequests[idx]);
});

// ==================== CONFIG ====================

app.get('/api/config', c => c.json({ products: store.products, activities: store.activities, crops: store.crops }));

app.post('/api/config/products', requireRoles('Owner'), async c => {
  const { name } = await c.req.json();
  if (!name) return c.json({ error: 'name required' }, 400);
  if (!store.products.includes(name)) store.products.push(name);
  return c.json({ success: true, products: store.products });
});
app.put('/api/config/products/:name', requireRoles('Owner'), async c => {
  const old = decodeURIComponent(c.req.param('name'));
  const { name } = await c.req.json();
  store.products = store.products.map(p => p === old ? name : p);
  return c.json({ success: true });
});
app.delete('/api/config/products/:name', requireRoles('Owner'), c => {
  store.products = store.products.filter(p => p !== decodeURIComponent(c.req.param('name')));
  return c.json({ success: true });
});

app.post('/api/config/activities', requireRoles('Owner'), async c => {
  const { name } = await c.req.json();
  if (!name) return c.json({ error: 'name required' }, 400);
  if (!store.activities.includes(name)) store.activities.push(name);
  return c.json({ success: true });
});
app.put('/api/config/activities/:name', requireRoles('Owner'), async c => {
  const old = decodeURIComponent(c.req.param('name'));
  const { name } = await c.req.json();
  store.activities = store.activities.map(a => a === old ? name : a);
  return c.json({ success: true });
});
app.delete('/api/config/activities/:name', requireRoles('Owner'), c => {
  store.activities = store.activities.filter(a => a !== decodeURIComponent(c.req.param('name')));
  return c.json({ success: true });
});

app.post('/api/config/crops', requireRoles('Owner'), async c => {
  const { name } = await c.req.json();
  if (!name) return c.json({ error: 'name required' }, 400);
  if (!store.crops.includes(name)) store.crops.push(name);
  return c.json({ success: true });
});
app.delete('/api/config/crops/:name', requireRoles('Owner'), c => {
  store.crops = store.crops.filter(cr => cr !== decodeURIComponent(c.req.param('name')));
  return c.json({ success: true });
});

// ==================== REGIONS ====================

app.get('/api/regions', c => c.json(store.regions));

app.post('/api/regions', requireRoles('Owner'), async c => {
  const data = await c.req.json();
  store.regions.push(data);
  return c.json(data, 201);
});

app.put('/api/regions/:name', requireRoles('Owner'), async c => {
  const name = decodeURIComponent(c.req.param('name'));
  const idx = store.regions.findIndex(r => r.name === name);
  if (idx === -1) return c.json({ error: 'Region not found' }, 404);
  const updates = await c.req.json();
  store.regions[idx] = { ...store.regions[idx], ...updates };
  return c.json(store.regions[idx]);
});

// ==================== VENDOR PROFILES ====================

app.get('/api/vendor-profiles', c => {
  const jwtUser = getUser(c);
  if (jwtUser.role === 'Vendor') {
    const profile = store.vendorProfiles[jwtUser.id];
    return c.json(profile ? { [jwtUser.id]: profile } : {});
  }
  return c.json(store.vendorProfiles);
});

app.get('/api/vendor-profiles/:vendorId', c => {
  const vid = c.req.param('vendorId');
  const jwtUser = getUser(c);
  if (jwtUser.role === 'Vendor' && jwtUser.id !== vid) return c.json({ error: 'Forbidden' }, 403);
  return c.json(store.vendorProfiles[vid] || {});
});

app.put('/api/vendor-profiles/:vendorId', async c => {
  const vid = c.req.param('vendorId');
  const jwtUser = getUser(c);
  if (jwtUser.role === 'Vendor' && jwtUser.id !== vid) return c.json({ error: 'Forbidden' }, 403);
  const updates = await c.req.json();
  store.vendorProfiles[vid] = { ...(store.vendorProfiles[vid] || { vendorId: vid }), ...updates };
  return c.json(store.vendorProfiles[vid]);
});

// ==================== SERVICE RECEIVERS ====================

app.get('/api/service-receivers', c => {
  const jwtUser = getUser(c);
  const receivers = jwtUser.role === 'Vendor'
    ? store.serviceReceivers.filter(r => r.vendorId === jwtUser.id)
    : store.serviceReceivers;
  return c.json(receivers);
});

app.post('/api/service-receivers', requireRoles('Vendor', 'Owner'), async c => {
  const jwtUser = getUser(c);
  const data = await c.req.json();
  const receiver = { ...data, id: uid('sr'), vendorId: data.vendorId || jwtUser.id, createdAt: today() };
  store.serviceReceivers.push(receiver);
  return c.json(receiver, 201);
});

app.put('/api/service-receivers/:id', async c => {
  const jwtUser = getUser(c);
  const idx = store.serviceReceivers.findIndex(r => r.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'Service receiver not found' }, 404);
  const sr = store.serviceReceivers[idx];
  if (jwtUser.role === 'Vendor' && sr.vendorId !== jwtUser.id) return c.json({ error: 'Forbidden' }, 403);
  const updates = await c.req.json();
  store.serviceReceivers[idx] = { ...sr, ...updates };
  return c.json(store.serviceReceivers[idx]);
});

app.delete('/api/service-receivers/:id', async c => {
  const jwtUser = getUser(c);
  const idx = store.serviceReceivers.findIndex(r => r.id === c.req.param('id'));
  if (idx === -1) return c.json({ error: 'Service receiver not found' }, 404);
  if (jwtUser.role === 'Vendor' && store.serviceReceivers[idx].vendorId !== jwtUser.id)
    return c.json({ error: 'Forbidden' }, 403);
  store.serviceReceivers.splice(idx, 1);
  return c.json({ success: true });
});

export default app;
