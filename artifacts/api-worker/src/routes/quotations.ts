import { Hono } from 'hono';
import { getDb, schema } from '../db';
import { eq, desc } from 'drizzle-orm';
import type { Bindings } from '../types';

const router = new Hono<{ Bindings: Bindings }>();

// GET /api/quotations
router.get('/', async (c) => {
  const db = getDb(c.env?.DATABASE_URL);
  const quotations = await db.select().from(schema.vendorQuotations).orderBy(desc(schema.vendorQuotations.createdAt));
  return c.json(quotations);
});

// POST /api/quotations
router.post('/', async (c) => {
  const db = getDb(c.env?.DATABASE_URL);
  const body = await c.req.json();
  const [created] = await db.insert(schema.vendorQuotations).values({
    ...body,
    id: body.id || `vq-${Date.now()}`,
    createdAt: body.createdAt || new Date().toISOString().split('T')[0]
  }).returning();
  return c.json(created);
});

// PUT /api/quotations/:id
router.put('/:id', async (c) => {
  const db = getDb(c.env?.DATABASE_URL);
  const id = c.req.param('id');
  const body = await c.req.json();

  const [updated] = await db
    .update(schema.vendorQuotations)
    .set(body)
    .where(eq(schema.vendorQuotations.id, id))
    .returning();

  if (!updated) return c.json({ error: 'Quotation not found' }, 404);
  return c.json(updated);
});

// DELETE /api/quotations/:id
router.delete('/:id', async (c) => {
  const db = getDb(c.env?.DATABASE_URL);
  const id = c.req.param('id');
  await db.delete(schema.vendorQuotations).where(eq(schema.vendorQuotations.id, id));
  return c.json({ success: true });
});

export default router;
