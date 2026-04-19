import { Hono } from 'hono';
import { requireRoles } from '../middleware/authMiddleware';
import { getDb, schema } from '../db/index';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';

const configRouter = new Hono<{ Bindings: Bindings }>();

configRouter.get('/', async (c) => {
  const db = getDb(c.env?.DATABASE_URL);
  const [productRows, cropRows, activityRows] = await Promise.all([
    db.select().from(schema.products),
    db.select().from(schema.crops),
    db.select().from(schema.activities),
  ]);
  return c.json({
    products: productRows.map((p) => p.name),
    crops: cropRows.map((cr) => cr.name),
    activities: activityRows.map((a) => a.name),
  });
});

// --- Products ---
configRouter.post('/products', requireRoles('Owner', 'All India Manager'), async (c) => {
  const { name } = await c.req.json();
  if (!name) return c.json({ error: 'name is required' }, 400);
  const db = getDb(c.env?.DATABASE_URL);
  await db.insert(schema.products).values({ name }).onConflictDoNothing();
  return c.json({ name }, 201);
});

configRouter.put('/products/:name', requireRoles('Owner', 'All India Manager'), async (c) => {
  const oldName = decodeURIComponent(c.req.param('name'));
  const { name: newName } = await c.req.json();
  if (!newName) return c.json({ error: 'name is required' }, 400);
  const db = getDb(c.env?.DATABASE_URL);
  await db.delete(schema.products).where(eq(schema.products.name, oldName));
  await db.insert(schema.products).values({ name: newName }).onConflictDoNothing();
  return c.json({ name: newName });
});

configRouter.delete('/products/:name', requireRoles('Owner', 'All India Manager'), async (c) => {
  const name = decodeURIComponent(c.req.param('name'));
  const db = getDb(c.env?.DATABASE_URL);
  await db.delete(schema.products).where(eq(schema.products.name, name));
  return c.json({ success: true });
});

// --- Activities ---
configRouter.post('/activities', requireRoles('Owner', 'All India Manager'), async (c) => {
  const { name } = await c.req.json();
  if (!name) return c.json({ error: 'name is required' }, 400);
  const db = getDb(c.env?.DATABASE_URL);
  await db.insert(schema.activities).values({ name }).onConflictDoNothing();
  return c.json({ name }, 201);
});

configRouter.put('/activities/:name', requireRoles('Owner', 'All India Manager'), async (c) => {
  const oldName = decodeURIComponent(c.req.param('name'));
  const { name: newName } = await c.req.json();
  if (!newName) return c.json({ error: 'name is required' }, 400);
  const db = getDb(c.env?.DATABASE_URL);
  await db.delete(schema.activities).where(eq(schema.activities.name, oldName));
  await db.insert(schema.activities).values({ name: newName }).onConflictDoNothing();
  return c.json({ name: newName });
});

configRouter.delete('/activities/:name', requireRoles('Owner', 'All India Manager'), async (c) => {
  const name = decodeURIComponent(c.req.param('name'));
  const db = getDb(c.env?.DATABASE_URL);
  await db.delete(schema.activities).where(eq(schema.activities.name, name));
  return c.json({ success: true });
});

// --- Crops ---
configRouter.post('/crops', requireRoles('Owner', 'All India Manager'), async (c) => {
  const { name } = await c.req.json();
  if (!name) return c.json({ error: 'name is required' }, 400);
  const db = getDb(c.env?.DATABASE_URL);
  await db.insert(schema.crops).values({ name }).onConflictDoNothing();
  return c.json({ name }, 201);
});

configRouter.delete('/crops/:name', requireRoles('Owner', 'All India Manager'), async (c) => {
  const name = decodeURIComponent(c.req.param('name'));
  const db = getDb(c.env?.DATABASE_URL);
  await db.delete(schema.crops).where(eq(schema.crops.name, name));
  return c.json({ success: true });
});

export default configRouter;
