import { Hono } from 'hono';
import { jwt, sign } from 'hono/jwt';
import { cors } from 'hono/cors';

// Types (simplified for internal use)
type DataStore = {
  users: any[];
  entries: any[];
  pos: any[];
  regions: any[];
  products: string[];
  activities: string[];
  bills: any[];
  serviceReceivers: any[];
  budgetRequests: any[];
  budgetRequestGroups: any[];
};

// Initialize with Mock Data
const store: DataStore = {
  products: ['Product A', 'Product B', 'Product C'],
  activities: ['Field Campaign', 'Harvest', 'Crop Meetings', 'Jeep Campaign'],
  users: [
    { id: 'u0', name: 'System Owner', loginId: 'abc', password: 'Abc@123', role: 'Owner', status: 'active', perms: { view: true, enter: true, edit: true, approve: true, manage: true, settings: true }, territory: {} },
    { id: 'u1', name: 'Arjun Mehta', loginId: 'arjun.aim', password: 'AIM@2026', role: 'All India Manager', status: 'active', perms: { view: true, enter: false, edit: false, approve: true, manage: true, settings: false }, territory: {} }
  ],
  entries: [
    { id: 'e1', userId: 'u5', userName: 'Ravi Singh', userRole: 'Area Manager', po: 'PO-2026-001', product: 'Product A', activity: 'Field Campaign', amount: 15000, area: 'Lucknow', pin: '226001', zmId: 'u4', zmName: 'Amit Verma', rmId: 'u2', rmName: 'Rajesh Kumar', vendorId: 'v1', vendorName: 'Agroworks Pvt. Ltd.', vendorCode: 'VND-2026-001', description: 'Village campaign', date: '2026-02-10', status: 'approved' }
  ],
  pos: [
    { id: 'po-2026-001', poNumber: 'PO-2026-001', budget: 1000000, from: '2026-01-01', to: '2026-03-31', status: 'Active', approvalStatus: 'approved', regionBudgets: { 'North': 400000 } }
  ],
  regions: [],
  bills: [],
  serviceReceivers: [],
  budgetRequests: [],
  budgetRequestGroups: []
};

const app = new Hono();
const JWT_SECRET = 'your-secret-key'; // In production, use environment variables

// Middleware
app.use('*', cors());

// Auth Routes
app.post('/api/auth/login', async (c) => {
  const { loginId, password } = await c.req.json();
  const user = store.users.find(u => u.loginId.toLowerCase() === loginId.toLowerCase() && u.password === password);
  
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);
  
  const token = await sign({ id: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, JWT_SECRET);
  return c.json({ token, user: { ...user, password: minifiedPassword(user.password) } });
});

function minifiedPassword(p: string) { return '***'; }

// Protected Routes (requires JWT)
const auth = jwt({ secret: JWT_SECRET });

// --- USERS ---
app.get('/api/users', auth, (c) => c.json(store.users));
app.post('/api/users', auth, async (c) => {
  const data = await c.req.json();
  const newUser = { ...data, id: `u-${Date.now()}` };
  store.users.push(newUser);
  return c.json(newUser, 201);
});
app.put('/api/users/:id', auth, async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json();
  store.users = store.users.map(u => u.id === id ? { ...u, ...updates } : u);
  return c.json({ success: true });
});
app.delete('/api/users/:id', auth, (c) => {
  const id = c.req.param('id');
  store.users = store.users.filter(u => u.id !== id);
  return c.json({ success: true });
});

// --- ENTRIES ---
app.get('/api/entries', auth, (c) => c.json(store.entries));
app.post('/api/entries', auth, async (c) => {
  const data = await c.req.json();
  const entry = { ...data, id: `e-${Date.now()}`, status: 'pending' };
  store.entries.push(entry);
  return c.json(entry, 201);
});
app.put('/api/entries/:id', auth, async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json();
  store.entries = store.entries.map(e => e.id === id ? { ...e, ...updates } : e);
  return c.json({ success: true });
});
app.delete('/api/entries/:id', auth, (c) => {
  const id = c.req.param('id');
  store.entries = store.entries.filter(e => e.id !== id);
  return c.json({ success: true });
});

// --- POs ---
app.get('/api/pos', auth, (c) => c.json(store.pos));
app.post('/api/pos', auth, async (c) => {
  const data = await c.req.json();
  const po = { ...data, id: `po-${Date.now()}`, approvalStatus: 'pending' };
  store.pos.push(po);
  return c.json(po, 201);
});
app.put('/api/pos/:id', auth, async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json();
  store.pos = store.pos.map(p => p.id === id ? { ...p, ...updates } : p);
  return c.json({ success: true });
});

// --- CONFIG (Products/Activities) ---
app.get('/api/config', auth, (c) => c.json({ products: store.products, activities: store.activities }));
app.post('/api/config/products', auth, async (c) => {
  const { name } = await c.req.json();
  if (!store.products.includes(name)) store.products.push(name);
  return c.json({ success: true });
});

// --- BILLS ---
app.get('/api/bills', auth, (c) => c.json(store.bills));
app.post('/api/bills', auth, async (c) => {
  const data = await c.req.json();
  const bill = { ...data, id: `bill-${Date.now()}`, status: 'draft' };
  store.bills.push(bill);
  return c.json(bill, 201);
});

// Health check
app.get('/health', (c) => c.text('OK'));

export default app;
