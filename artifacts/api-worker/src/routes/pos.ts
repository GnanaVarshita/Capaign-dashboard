import { Hono } from 'hono';
import { getUser, requireRoles } from '../middleware/authMiddleware';
import { uid, today, scopePOs } from '../helpers';
import { getDb, schema } from '../db/index';
import { eq, or } from 'drizzle-orm';
import type { Bindings } from '../types';

const posRouter = new Hono<{ Bindings: Bindings }>();

function mapPO(po: typeof schema.pos.$inferSelect) {
  const { fromDate, toDate, ...rest } = po;
  return { ...rest, from: fromDate, to: toDate };
}

posRouter.get('/', async (c) => {
  const jwtUser = getUser(c);
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const [allPos, allUsers, allEntries] = await Promise.all([
    db.select().from(schema.pos),
    db.select().from(schema.users),
    db.select().from(schema.entries),
  ]);
  const caller = allUsers.find((u) => u.id === jwtUser.id);
  if (!caller) return c.json({ error: 'User not found' }, 404);
  return c.json(scopePOs(allPos.map(mapPO), caller, allEntries));
});

posRouter.get('/:id', async (c) => {
  const idOrNum = c.req.param('id');
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const [po] = await db
    .select()
    .from(schema.pos)
    .where(
      or(eq(schema.pos.id, idOrNum), eq(schema.pos.poNumber, idOrNum)),
    );
  if (!po) return c.json({ error: 'PO not found' }, 404);
  return c.json(mapPO(po));
});

posRouter.post('/', requireRoles('Owner', 'All India Manager'), async (c) => {
  const jwtUser = getUser(c);
  const data = await c.req.json();
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

  const [caller] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, jwtUser.id));

  const id = uid('po');
  const po = {
    id,
    poNumber: data.poNumber || id,
    budget: Number(data.budget) || 0,
    fromDate: data.from || data.fromDate || today(),
    toDate: data.to || data.toDate || today(),
    status: data.status || 'Draft',
    remarks: data.remarks || null,
    createdBy: caller?.name || jwtUser.id,
    createdAt: today(),
    approvalStatus: 'pending',
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    regionBudgets: data.regionBudgets || {},
    allocations: data.allocations || {},
    zoneAllocations: data.zoneAllocations || {},
  };

  await db.insert(schema.pos).values(po);
  return c.json(mapPO(po), 201);
});

posRouter.put('/:id', requireRoles('Owner', 'All India Manager'), async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

  const [existing] = await db
    .select()
    .from(schema.pos)
    .where(eq(schema.pos.id, id));
  if (!existing) return c.json({ error: 'PO not found' }, 404);

  const updates = await c.req.json();
  const toUpdate: Record<string, any> = { ...updates };
  delete toUpdate.id;
  if (toUpdate.from) { toUpdate.fromDate = toUpdate.from; delete toUpdate.from; }
  if (toUpdate.to) { toUpdate.toDate = toUpdate.to; delete toUpdate.to; }

  const [updated] = await db
    .update(schema.pos)
    .set(toUpdate)
    .where(eq(schema.pos.id, id))
    .returning();

  return c.json(mapPO(updated));
});

posRouter.put(
  '/:id/approve',
  requireRoles('Owner', 'All India Manager'),
  async (c) => {
    const jwtUser = getUser(c);
    const id = c.req.param('id');
    const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

    const [existing] = await db
      .select()
      .from(schema.pos)
      .where(eq(schema.pos.id, id));
    if (!existing) return c.json({ error: 'PO not found' }, 404);

    const [caller] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, jwtUser.id));

    const [updated] = await db
      .update(schema.pos)
      .set({
        approvalStatus: 'approved',
        approvedBy: caller?.name || jwtUser.id,
        approvedAt: today(),
        status: 'Active',
      })
      .where(eq(schema.pos.id, id))
      .returning();

    return c.json(mapPO(updated));
  },
);

posRouter.put(
  '/:id/reject',
  requireRoles('Owner', 'All India Manager'),
  async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

    const [existing] = await db
      .select()
      .from(schema.pos)
      .where(eq(schema.pos.id, id));
    if (!existing) return c.json({ error: 'PO not found' }, 404);

    const { reason } = await c.req.json().catch(() => ({ reason: '' }));

    const [updated] = await db
      .update(schema.pos)
      .set({
        approvalStatus: 'rejected',
        rejectionReason: reason || null,
        status: 'Draft',
      })
      .where(eq(schema.pos.id, id))
      .returning();

    return c.json(mapPO(updated));
  },
);

posRouter.put('/:id/lapse', requireRoles('Owner'), async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

  const [existing] = await db
    .select()
    .from(schema.pos)
    .where(eq(schema.pos.id, id));
  if (!existing) return c.json({ error: 'PO not found' }, 404);

  const [updated] = await db
    .update(schema.pos)
    .set({ status: 'Lapsed' })
    .where(eq(schema.pos.id, id))
    .returning();

  return c.json(mapPO(updated));
});

export default posRouter;
