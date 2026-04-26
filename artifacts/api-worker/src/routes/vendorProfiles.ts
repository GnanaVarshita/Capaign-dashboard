import { Hono } from 'hono';
import { getUser } from '../middleware/authMiddleware';
import { getDb, schema } from '../db/index';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';

const vendorRouter = new Hono<{ Bindings: Bindings }>();

vendorRouter.get('/', async (c) => {
  const jwtUser = getUser(c);
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

  if (jwtUser.role === 'Vendor') {
    const [profile] = await db
      .select()
      .from(schema.vendorProfiles)
      .where(eq(schema.vendorProfiles.vendorId, jwtUser.id));
    return c.json(profile ? { [jwtUser.id]: profile } : {});
  }

  const allProfiles = await db.select().from(schema.vendorProfiles);
  const record = Object.fromEntries(allProfiles.map((p) => [p.vendorId, p]));
  return c.json(record);
});

vendorRouter.get('/:vendorId', async (c) => {
  const vid = c.req.param('vendorId');
  const jwtUser = getUser(c);

  if (jwtUser.role === 'Vendor' && jwtUser.id !== vid)
    return c.json({ error: 'Forbidden' }, 403);

  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const [profile] = await db
    .select()
    .from(schema.vendorProfiles)
    .where(eq(schema.vendorProfiles.vendorId, vid));

  return c.json(profile || {});
});

vendorRouter.put('/:vendorId', async (c) => {
  const vid = c.req.param('vendorId');
  const jwtUser = getUser(c);

  if (jwtUser.role === 'Vendor' && jwtUser.id !== vid)
    return c.json({ error: 'Forbidden' }, 403);

  const updates = await c.req.json();
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

  const [existing] = await db
    .select()
    .from(schema.vendorProfiles)
    .where(eq(schema.vendorProfiles.vendorId, vid));

  if (existing) {
    const toUpdate: Record<string, any> = { ...updates };
    delete toUpdate.vendorId;

    const [updated] = await db
      .update(schema.vendorProfiles)
      .set(toUpdate)
      .where(eq(schema.vendorProfiles.vendorId, vid))
      .returning();

    return c.json(updated);
  } else {
    const profile = {
      vendorId: vid,
      tradeName: updates.tradeName || '',
      vendorCode: updates.vendorCode || '',
      gst: updates.gst || '',
      address: updates.address || '',
      phone: updates.phone || '',
      email: updates.email || '',
      bankName: updates.bankName || null,
      accountNo: updates.accountNo || null,
      ifsc: updates.ifsc || null,
      pan: updates.pan || null,
    };
    await db.insert(schema.vendorProfiles).values(profile);
    return c.json(profile);
  }
});

export default vendorRouter;
