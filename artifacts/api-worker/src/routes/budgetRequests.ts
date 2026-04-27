import { Hono } from 'hono';
import { getUser, requireRoles } from '../middleware/authMiddleware';
import { uid, today, GLOBAL_ROLES, APPROVER_ROLES } from '../helpers';
import { getDb, schema } from '../db/index';
import { eq, and } from 'drizzle-orm';
import type { Bindings } from '../types';

const budgetRouter = new Hono<{ Bindings: Bindings }>();
const groupRouter = new Hono<{ Bindings: Bindings }>();

groupRouter.get('/', async (c) => {
  const jwtUser = getUser(c);
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const allGroups = await db.select().from(schema.budgetRequestGroups);
  const groups =
    jwtUser.role === 'Area Manager' || jwtUser.role === 'Vendor'
      ? allGroups.filter((g) => g.status === 'active')
      : allGroups;
  return c.json(groups);
});

groupRouter.post(
  '/',
  requireRoles('Owner', 'All India Manager'),
  async (c) => {
    const jwtUser = getUser(c);
    const data = await c.req.json();
    const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

    const [caller] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, jwtUser.id));

    const allGroups = await db.select().from(schema.budgetRequestGroups);
    const requestNumber = `BR-${new Date().getFullYear()}-${String(allGroups.length + 1).padStart(3, '0')}`;
    const id = uid('brg');

    const group = {
      id,
      requestNumber,
      aimId: jwtUser.id,
      aimName: caller?.name || '',
      createdAt: today(),
      status: 'active' as const,
      description: data.description || null,
      targetDate: data.targetDate || null,
      selectedRegions: data.selectedRegions || null,
    };

    await db.insert(schema.budgetRequestGroups).values(group);
    return c.json(group, 201);
  },
);

groupRouter.put(
  '/:id/close',
  requireRoles('Owner', 'All India Manager'),
  async (c) => {
    const groupId = c.req.param('id');
    const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

    const [existing] = await db
      .select()
      .from(schema.budgetRequestGroups)
      .where(eq(schema.budgetRequestGroups.id, groupId));
    if (!existing) return c.json({ error: 'Group not found' }, 404);

    const [updated] = await db
      .update(schema.budgetRequestGroups)
      .set({ status: 'closed' })
      .where(eq(schema.budgetRequestGroups.id, groupId))
      .returning();

    return c.json(updated);
  },
);

budgetRouter.get('/', async (c) => {
  const jwtUser = getUser(c);
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const [allRequests, allUsers] = await Promise.all([
    db.select().from(schema.budgetRequests),
    db.select().from(schema.users),
  ]);

  if (GLOBAL_ROLES.includes(jwtUser.role)) return c.json(allRequests);

  const caller = allUsers.find((u) => u.id === jwtUser.id);
  let requests = allRequests;

  if (jwtUser.role === 'Area Manager') {
    requests = requests.filter((r) => r.areaManagerId === jwtUser.id);
  } else if (jwtUser.role === 'Zonal Manager') {
    requests = requests.filter(
      (r) =>
        r.zone === caller?.territory?.zone &&
        r.region === caller?.territory?.region,
    );
  } else if (jwtUser.role === 'Regional Manager') {
    requests = requests.filter((r) => r.region === caller?.territory?.region);
  }

  return c.json(requests);
});

budgetRouter.post('/', requireRoles('Area Manager', 'Owner'), async (c) => {
  const jwtUser = getUser(c);
  const data = await c.req.json();
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

  const [caller] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, jwtUser.id));

  const id = uid('br');
  const request = {
    id,
    requestGroupId: data.requestGroupId || null,
    requestNumber: data.requestNumber || null,
    areaManagerId: data.areaManagerId || jwtUser.id,
    areaManagerName: data.areaManagerName || caller?.name || '',
    area: data.area || '',
    zone: data.zone || '',
    region: data.region || '',
    mdoName: data.mdoName || '',
    crop: data.crop || null,
    product: data.product || '',
    activity: data.activity || '',
    estimatedSales: Number(data.estimatedSales) || 0,
    activityBudgets: data.activityBudgets || {},
    budgetRequired: Number(data.budgetRequired) || 0,
    status: 'submitted' as const,
    createdAt: today(),
    submissionCount: Number(data.submissionCount) || 0,
    zmId: null,
    zmName: null,
    zmApprovedAt: null,
    rmId: null,
    rmName: null,
    rmApprovedAt: null,
    aimId: null,
    aimName: null,
    aimApprovedAt: null,
    remarks: data.remarks || null,
  };

  await db.insert(schema.budgetRequests).values(request);
  return c.json(request, 201);
});

budgetRouter.put('/:id/approve', requireRoles(...APPROVER_ROLES), async (c) => {
  const jwtUser = getUser(c);
  const reqId = c.req.param('id');
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

  const [req] = await db
    .select()
    .from(schema.budgetRequests)
    .where(eq(schema.budgetRequests.id, reqId));
  if (!req) return c.json({ error: 'Budget request not found' }, 404);

  const [caller] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, jwtUser.id));

  let update: Record<string, any> = {};
  if (jwtUser.role === 'Zonal Manager' && req.status === 'submitted') {
    update = {
      status: 'zm-approved',
      zmId: jwtUser.id,
      zmName: caller?.name || '',
      zmApprovedAt: today(),
    };
  } else if (jwtUser.role === 'Regional Manager' && req.status === 'zm-approved') {
    update = {
      status: 'rm-approved',
      rmId: jwtUser.id,
      rmName: caller?.name || '',
      rmApprovedAt: today(),
    };
  } else if (GLOBAL_ROLES.includes(jwtUser.role) && req.status === 'rm-approved') {
    update = {
      status: 'aim-approved',
      aimId: jwtUser.id,
      aimName: caller?.name || '',
      aimApprovedAt: today(),
    };
  } else {
    return c.json(
      { error: 'Cannot approve: incorrect role or request status sequence' },
      400,
    );
  }

  const [updated] = await db
    .update(schema.budgetRequests)
    .set(update)
    .where(eq(schema.budgetRequests.id, reqId))
    .returning();

  return c.json(updated);
});

budgetRouter.put('/:id', async (c) => {
  const reqId = c.req.param('id');
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

  const [existing] = await db
    .select()
    .from(schema.budgetRequests)
    .where(eq(schema.budgetRequests.id, reqId));
  if (!existing) return c.json({ error: 'Budget request not found' }, 404);

  const updates = await c.req.json();
  const toUpdate: Record<string, any> = { ...updates };
  delete toUpdate.id;

  const [updated] = await db
    .update(schema.budgetRequests)
    .set(toUpdate)
    .where(eq(schema.budgetRequests.id, reqId))
    .returning();

  return c.json(updated);
});

export { budgetRouter, groupRouter };
export default budgetRouter;
