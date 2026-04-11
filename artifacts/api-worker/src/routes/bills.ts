import { Hono } from "hono";
import { getUser, requireRoles } from "../middleware/authMiddleware";
import { uid, today } from "../helpers";
import { store } from "../store";

const billsRouter = new Hono();

billsRouter.get("/", (c) => {
  const jwtUser = getUser(c);
  const bills =
    jwtUser.role === "Vendor"
      ? store.bills.filter((b) => b.vendorId === jwtUser.id)
      : store.bills;
  return c.json(bills);
});

billsRouter.get("/:id", (c) => {
  const bill = store.bills.find((b) => b.id === c.req.param("id"));
  if (!bill) return c.json({ error: "Bill not found" }, 404);
  return c.json(bill);
});

billsRouter.post(
  "/",
  requireRoles("Vendor", "Owner", "All India Manager"),
  async (c) => {
    const jwtUser = getUser(c);
    const caller = store.users.find((u) => u.id === jwtUser.id);
    const data = await c.req.json();
    const year = new Date().getFullYear();
    const count =
      store.bills.filter((b) => b.invoiceNumber?.startsWith(`INV/${year}/`))
        .length + 1;
    const invoiceNumber =
      data.invoiceNumber || `INV/${year}/${String(count).padStart(3, "0")}`;
    const bill = {
      ...data,
      id: uid("bill"),
      status: "draft",
      createdAt: today(),
      invoiceNumber,
      vendorId: data.vendorId || jwtUser.id,
      vendorName: data.vendorName || caller?.name,
    };
    store.bills.unshift(bill);
    return c.json(bill, 201);
  },
);

billsRouter.put("/:id", async (c) => {
  const jwtUser = getUser(c);
  const idx = store.bills.findIndex((b) => b.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "Bill not found" }, 404);
  const bill = store.bills[idx];
  const canEdit =
    jwtUser.role === "Owner" ||
    (bill.vendorId === jwtUser.id && bill.status === "draft");
  if (!canEdit) return c.json({ error: "Forbidden" }, 403);
  const updates = await c.req.json();
  store.bills[idx] = { ...bill, ...updates };
  return c.json(store.bills[idx]);
});

billsRouter.put("/:id/submit", requireRoles("Vendor", "Owner"), async (c) => {
  const jwtUser = getUser(c);
  const idx = store.bills.findIndex((b) => b.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "Bill not found" }, 404);
  if (jwtUser.role === "Vendor" && store.bills[idx].vendorId !== jwtUser.id)
    return c.json({ error: "Forbidden" }, 403);
  store.bills[idx] = {
    ...store.bills[idx],
    status: "submitted",
    submittedAt: today(),
  };
  return c.json(store.bills[idx]);
});

billsRouter.put(
  "/:id/pay",
  requireRoles("Owner", "Finance Administrator"),
  async (c) => {
    const idx = store.bills.findIndex((b) => b.id === c.req.param("id"));
    if (idx === -1) return c.json({ error: "Bill not found" }, 404);
    const { paymentId, paymentDate } = await c.req.json().catch(() => ({}));
    store.bills[idx] = {
      ...store.bills[idx],
      status: "paid",
      paidAt: paymentDate || today(),
      paymentId,
      paymentDate,
    };
    return c.json(store.bills[idx]);
  },
);

export default billsRouter;
