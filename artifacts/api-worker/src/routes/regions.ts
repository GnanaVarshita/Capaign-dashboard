import { Hono } from 'hono';
import { requireRoles } from '../middleware/authMiddleware';
import { getDb, schema } from '../db/index';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';

const regionsRouter = new Hono<{ Bindings: Bindings }>();

regionsRouter.get('/', async (c) => {
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const regions = await db.select().from(schema.regions);
  return c.json(regions);
});

regionsRouter.post('/', requireRoles('Owner'), async (c) => {
  const data = await c.req.json();
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const region = {
    name: data.name,
    manager: data.manager || '',
    color: data.color || '#1B4F72',
    states: data.states || [],
    zones: data.zones || [],
  };
  const [inserted] = await db.insert(schema.regions).values(region).onConflictDoNothing().returning();
  return c.json(inserted || region, 201);
});

regionsRouter.put('/:name', requireRoles('Owner'), async (c) => {
  const name = decodeURIComponent(c.req.param('name'));
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);

  const [existing] = await db
    .select()
    .from(schema.regions)
    .where(eq(schema.regions.name, name));
  if (!existing) return c.json({ error: 'Region not found' }, 404);

  const updates = await c.req.json();
  const toUpdate: Record<string, any> = { ...updates };
  delete toUpdate.name;

  const [updated] = await db
    .update(schema.regions)
    .set(toUpdate)
    .where(eq(schema.regions.name, name))
    .returning();

  return c.json(updated);
});

regionsRouter.delete('/:name', requireRoles('Owner'), async (c) => {
  const name = decodeURIComponent(c.req.param('name'));
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  await db.delete(schema.regions).where(eq(schema.regions.name, name));
  return c.json({ success: true });
});

export default regionsRouter;
