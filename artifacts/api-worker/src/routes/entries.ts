import { Hono } from 'hono';
import { getUser, requireRoles } from '../middleware/authMiddleware';
import { uid, today, scopeEntries, getPendingForApprover, APPROVER_ROLES } from '../helpers';
import { getDb, schema } from '../db/index';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';

const entriesRouter = new Hono<{ Bindings: Bindings }>();

entriesRouter.get('/', async (c) => {
  const jwtUser = getUser(c);
  const db = getDb(c.env?.DATABASE_URL);
  const [allEntries, allUsers] = await Promise.all([
    db.select().from(schema.entries),
    db.select().from(schema.users),
  ]);
  const caller = allUsers.find((u) => u.id === jwtUser.id);
  if (!caller) return c.json({ error: 'User not found' }, 404);
  return c.json(scopeEntries(allEntries, caller, allUsers));
});

entriesRouter.get('/pending', async (c) => {
  const jwtUser = getUser(c);
  const db = getDb(c.env?.DATABASE_URL);
  const [allEntries, allUsers] = await Promise.all([
    db.select().from(schema.entries),
    db.select().from(schema.users),
  ]);
  const caller = allUsers.find((u) => u.id === jwtUser.id);
  if (!caller) return c.json({ error: 'User not found' }, 404);
  return c.json(getPendingForApprover(allEntries, caller, allUsers));
});

entriesRouter.get('/mine', async (c) => {
  const jwtUser = getUser(c);
  const db = getDb(c.env?.DATABASE_URL);
  const myEntries = await db
    .select()
    .from(schema.entries)
    .where(eq(schema.entries.userId, jwtUser.id));
  return c.json(myEntries);
});

entriesRouter.post(
  '/',
  requireRoles('Area Manager', 'Vendor', 'Owner', 'All India Manager'),
  async (c) => {
    const jwtUser = getUser(c);
    const data = await c.req.json();
    const db = getDb(c.env?.DATABASE_URL);
    const id = uid('e');
    const entry = {
      id,
      userId: data.userId || jwtUser.id,
      userName: data.userName || '',
      userRole: data.userRole || jwtUser.role,
      po: data.po || '',
      product: data.product || '',
      activity: data.activity || '',
      crop: data.crop || null,
      amount: Number(data.amount) || 0,
      area: data.area || '',
      pin: data.pin || '',
      zmId: data.zmId || '',
      zmName: data.zmName || '',
      rmId: data.rmId || '',
      rmName: data.rmName || '',
      vendorId: data.vendorId || '',
      vendorName: data.vendorName || '',
      vendorCode: data.vendorCode || '',
      description: data.description || null,
      date: data.date || today(),
      remarks: data.remarks || null,
      status: 'pending' as const,
      decidedBy: null,
      decidedByDesignation: null,
      decidedAt: null,
      editedBy: null,
      region: data.region || null,
      zone: data.zone || null,
      campaignPhoto: data.campaignPhoto || null,
      expensePhoto: data.expensePhoto || null,
      otherPhoto: data.otherPhoto || null,
      photoUploadedBy: data.photoUploadedBy || null,
      photoUploadedAt: data.photoUploadedAt || null,
    };
    await db.insert(schema.entries).values(entry);
    return c.json(entry, 201);
  },
);

entriesRouter.put('/:id', async (c) => {
  const jwtUser = getUser(c);
  const entryId = c.req.param('id');
  const db = getDb(c.env?.DATABASE_URL);

  const [entry] = await db
    .select()
    .from(schema.entries)
    .where(eq(schema.entries.id, entryId));
  if (!entry) return c.json({ error: 'Entry not found' }, 404);

  const isGlobal = ['Owner', 'All India Manager'].includes(jwtUser.role);
  const isOwner = entry.userId === jwtUser.id && entry.status === 'pending';
  if (!isGlobal && !isOwner)
    return c.json({ error: 'Forbidden' }, 403);

  const updates = await c.req.json();
  const toUpdate: Record<string, any> = { ...updates };
  delete toUpdate.id;
  delete toUpdate.createdAt;

  const [updated] = await db
    .update(schema.entries)
    .set(toUpdate)
    .where(eq(schema.entries.id, entryId))
    .returning();

  return c.json(updated);
});

entriesRouter.put('/:id/status', requireRoles(...APPROVER_ROLES), async (c) => {
  const jwtUser = getUser(c);
  const entryId = c.req.param('id');
  const db = getDb(c.env?.DATABASE_URL);

  const [entry] = await db
    .select()
    .from(schema.entries)
    .where(eq(schema.entries.id, entryId));
  if (!entry) return c.json({ error: 'Entry not found' }, 404);

  const { status, remarks } = (await c.req.json()) as {
    status: string;
    remarks?: string;
  };
  if (!['approved', 'rejected'].includes(status))
    return c.json({ error: 'status must be approved or rejected' }, 400);

  const [caller] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, jwtUser.id));

  const [updated] = await db
    .update(schema.entries)
    .set({
      status,
      decidedBy: caller?.name || jwtUser.id,
      decidedByDesignation: caller?.role || jwtUser.role,
      decidedAt: today(),
      ...(remarks ? { remarks } : {}),
    })
    .where(eq(schema.entries.id, entryId))
    .returning();

  return c.json(updated);
});

entriesRouter.delete('/:id', async (c) => {
  const jwtUser = getUser(c);
  const entryId = c.req.param('id');
  const db = getDb(c.env?.DATABASE_URL);

  const [entry] = await db
    .select()
    .from(schema.entries)
    .where(eq(schema.entries.id, entryId));
  if (!entry) return c.json({ error: 'Entry not found' }, 404);

  const canDelete =
    jwtUser.role === 'Owner' ||
    (entry.userId === jwtUser.id && entry.status === 'pending');
  if (!canDelete)
    return c.json(
      { error: 'Forbidden – can only delete your own pending entries' },
      403,
    );

  await db.delete(schema.entries).where(eq(schema.entries.id, entryId));
  return c.json({ success: true });
});

export default entriesRouter;
