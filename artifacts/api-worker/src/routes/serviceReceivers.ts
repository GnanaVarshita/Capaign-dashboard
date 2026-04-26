import { Hono } from 'hono';
import { getUser, requireRoles } from '../middleware/authMiddleware';
import { uid, today } from '../helpers';
import { getDb, schema } from '../db/index';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';

const receiverRouter = new Hono<{ Bindings: Bindings }>();

receiverRouter.get('/', async (c) => {
  const jwtUser = getUser(c);
  const db = getDb(c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL);
  const allReceivers = await db.select().from(schema.serviceReceivers);
  const receivers =
    jwtUser.role === 'Vendor'
      ? allReceivers.filter((r) => r.vendorId === jwtUser.id)
      : allReceivers;
  return c.json(receivers);
});

receiverRouter.post('/', requireRoles('Vendor', 'Owner'), async (c) => {
  const jwtUser = getUser(c);
  const data = await c.req.json();
  const db = getDb(c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL);

  const receiver = {
    id: uid('sr'),
    vendorId: data.vendorId || jwtUser.id,
    companyName: data.companyName || '',
    gst: data.gst || '',
    address: data.address || '',
    phone: data.phone || '',
    email: data.email || '',
    contactPerson: data.contactPerson || '',
    createdAt: today(),
  };

  await db.insert(schema.serviceReceivers).values(receiver);
  return c.json(receiver, 201);
});

receiverRouter.put('/:id', async (c) => {
  const jwtUser = getUser(c);
  const receiverId = c.req.param('id');
  const db = getDb(c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL);

  const [sr] = await db
    .select()
    .from(schema.serviceReceivers)
    .where(eq(schema.serviceReceivers.id, receiverId));
  if (!sr) return c.json({ error: 'Service receiver not found' }, 404);

  if (jwtUser.role === 'Vendor' && sr.vendorId !== jwtUser.id)
    return c.json({ error: 'Forbidden' }, 403);

  const updates = await c.req.json();
  const toUpdate: Record<string, any> = { ...updates };
  delete toUpdate.id;
  delete toUpdate.createdAt;
  delete toUpdate.vendorId;

  const [updated] = await db
    .update(schema.serviceReceivers)
    .set(toUpdate)
    .where(eq(schema.serviceReceivers.id, receiverId))
    .returning();

  return c.json(updated);
});

receiverRouter.delete('/:id', async (c) => {
  const jwtUser = getUser(c);
  const receiverId = c.req.param('id');
  const db = getDb(c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL);

  const [sr] = await db
    .select()
    .from(schema.serviceReceivers)
    .where(eq(schema.serviceReceivers.id, receiverId));
  if (!sr) return c.json({ error: 'Service receiver not found' }, 404);

  if (jwtUser.role === 'Vendor' && sr.vendorId !== jwtUser.id)
    return c.json({ error: 'Forbidden' }, 403);

  await db
    .delete(schema.serviceReceivers)
    .where(eq(schema.serviceReceivers.id, receiverId));
  return c.json({ success: true });
});

export default receiverRouter;
