import { Hono } from 'hono';
import { getUser, requireRoles } from '../middleware/authMiddleware';
import { uid, today } from '../helpers';
import { getDb, schema } from '../db/index';
import { eq, like, sql } from 'drizzle-orm';
import type { Bindings } from '../types';

const billsRouter = new Hono<{ Bindings: Bindings }>();

billsRouter.get('/', async (c) => {
  const jwtUser = getUser(c);
  const db = getDb(c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL);
  const allBills = await db.select().from(schema.bills);
  const bills =
    jwtUser.role === 'Vendor'
      ? allBills.filter((b) => b.vendorId === jwtUser.id)
      : allBills;
  return c.json(bills);
});

billsRouter.get('/:id', async (c) => {
  const db = getDb(c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL);
  const [bill] = await db
    .select()
    .from(schema.bills)
    .where(eq(schema.bills.id, c.req.param('id')));
  if (!bill) return c.json({ error: 'Bill not found' }, 404);
  return c.json(bill);
});

billsRouter.post(
  '/',
  requireRoles('Vendor', 'Owner', 'All India Manager'),
  async (c) => {
    const jwtUser = getUser(c);
    const data = await c.req.json();
    const db = getDb(c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL);

    const [caller] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, jwtUser.id));

    const year = new Date().getFullYear();
    const allBills = await db.select().from(schema.bills);
    const yearBills = allBills.filter((b) =>
      b.invoiceNumber?.startsWith(`INV/${year}/`),
    );
    const count = yearBills.length + 1;
    const invoiceNumber =
      data.invoiceNumber || `INV/${year}/${String(count).padStart(3, '0')}`;

    const id = uid('bill');
    const bill = {
      id,
      vendorId: data.vendorId || jwtUser.id,
      vendorName: data.vendorName || caller?.name || '',
      vendorCode: data.vendorCode || null,
      entryIds: data.entryIds || [],
      totalAmount: Number(data.totalAmount) || 0,
      activityAmount: Number(data.activityAmount) || 0,
      serviceChargeAmt: Number(data.serviceChargeAmt) || 0,
      serviceChargePct: data.serviceChargePct ? Number(data.serviceChargePct) : null,
      gstRate: Number(data.gstRate) || 0,
      status: 'draft' as const,
      createdAt: today(),
      date: data.date || null,
      submittedAt: null,
      paidAt: null,
      paymentMode: null,
      paymentRef: null,
      paymentRemarks: null,
      invoiceNumber,
      remarks: data.remarks || null,
      serviceReceiverId: data.serviceReceiverId || null,
      receiverDetails: data.receiverDetails || null,
      spTradeName: data.spTradeName || null,
      spVendorCode: data.spVendorCode || null,
      spGST: data.spGST || null,
      spPAN: data.spPAN || null,
      spAddress: data.spAddress || null,
      spPhone: data.spPhone || null,
      spEmail: data.spEmail || null,
      bankDetails: data.bankDetails || null,
      entryDetails: data.entryDetails || null,
      signatoryName: data.signatoryName || null,
      signatoryDesignation: data.signatoryDesignation || null,
      paymentId: null,
      paymentDate: null,
      modificationRequested: false,
      modificationRequestedAt: null,
      modificationApprovedBy: null,
      modificationApprovedAt: null,
    };

    await db.insert(schema.bills).values(bill);
    return c.json(bill, 201);
  },
);

billsRouter.put('/:id', async (c) => {
  const jwtUser = getUser(c);
  const billId = c.req.param('id');
  const db = getDb(c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL);

  const [bill] = await db
    .select()
    .from(schema.bills)
    .where(eq(schema.bills.id, billId));
  if (!bill) return c.json({ error: 'Bill not found' }, 404);

  const canEdit =
    jwtUser.role === 'Owner' ||
    jwtUser.role === 'All India Manager' ||
    (bill.vendorId === jwtUser.id && bill.status === 'draft');
  if (!canEdit) return c.json({ error: 'Forbidden' }, 403);

  const updates = await c.req.json();
  const toUpdate: Record<string, any> = { ...updates };
  delete toUpdate.id;
  delete toUpdate.createdAt;

  const [updated] = await db
    .update(schema.bills)
    .set(toUpdate)
    .where(eq(schema.bills.id, billId))
    .returning();

  return c.json(updated);
});

billsRouter.put('/:id/submit', requireRoles('Vendor', 'Owner'), async (c) => {
  const jwtUser = getUser(c);
  const billId = c.req.param('id');
  const db = getDb(c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL);

  const [bill] = await db
    .select()
    .from(schema.bills)
    .where(eq(schema.bills.id, billId));
  if (!bill) return c.json({ error: 'Bill not found' }, 404);

  if (jwtUser.role === 'Vendor' && bill.vendorId !== jwtUser.id)
    return c.json({ error: 'Forbidden' }, 403);

  const [updated] = await db
    .update(schema.bills)
    .set({ status: 'submitted', submittedAt: today() })
    .where(eq(schema.bills.id, billId))
    .returning();

  return c.json(updated);
});

billsRouter.put(
  '/:id/pay',
  requireRoles('Owner', 'Finance Administrator', 'All India Manager'),
  async (c) => {
    const billId = c.req.param('id');
    const db = getDb(c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL);

    const [bill] = await db
      .select()
      .from(schema.bills)
      .where(eq(schema.bills.id, billId));
    if (!bill) return c.json({ error: 'Bill not found' }, 404);

    const { paymentId, paymentDate, paymentMode, paymentRef, paymentRemarks } =
      await c.req.json().catch(() => ({}));

    const [updated] = await db
      .update(schema.bills)
      .set({
        status: 'paid',
        paidAt: paymentDate || today(),
        paymentId: paymentId || null,
        paymentDate: paymentDate || null,
        paymentMode: paymentMode || null,
        paymentRef: paymentRef || null,
        paymentRemarks: paymentRemarks || null,
      })
      .where(eq(schema.bills.id, billId))
      .returning();

    return c.json(updated);
  },
);

billsRouter.put('/:id/request-modification', requireRoles('Vendor'), async (c) => {
  const jwtUser = getUser(c);
  const billId = c.req.param('id');
  const db = getDb(c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL);

  const [bill] = await db
    .select()
    .from(schema.bills)
    .where(eq(schema.bills.id, billId));
  if (!bill) return c.json({ error: 'Bill not found' }, 404);
  if (bill.vendorId !== jwtUser.id) return c.json({ error: 'Forbidden' }, 403);

  const [updated] = await db
    .update(schema.bills)
    .set({ modificationRequested: true, modificationRequestedAt: today() })
    .where(eq(schema.bills.id, billId))
    .returning();

  return c.json(updated);
});

billsRouter.put(
  '/:id/approve-modification',
  requireRoles('Owner', 'All India Manager'),
  async (c) => {
    const jwtUser = getUser(c);
    const billId = c.req.param('id');
    const db = getDb(c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL);

    const [bill] = await db
      .select()
      .from(schema.bills)
      .where(eq(schema.bills.id, billId));
    if (!bill) return c.json({ error: 'Bill not found' }, 404);

    const [caller] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, jwtUser.id));

    const [updated] = await db
      .update(schema.bills)
      .set({
        status: 'draft',
        modificationRequested: false,
        modificationApprovedBy: caller?.name || jwtUser.id,
        modificationApprovedAt: today(),
      })
      .where(eq(schema.bills.id, billId))
      .returning();

    return c.json(updated);
  },
);

export default billsRouter;
