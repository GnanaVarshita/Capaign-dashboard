import { Hono } from "hono";
import { getUser, requireRoles } from "../middleware/authMiddleware";
import { uid, today, scopePOs } from "../helpers";
import { store } from "../store";

const posRouter = new Hono();

posRouter.get("/", (c) => {
  const jwtUser = getUser(c);
  const caller = store.users.find((u) => u.id === jwtUser.id);
  if (!caller) return c.json({ error: "User not found" }, 404);
  return c.json(scopePOs(store.pos, caller, store.entries));
});

posRouter.get("/:id", (c) => {
  const po = store.pos.find(
    (p) => p.id === c.req.param("id") || p.poNumber === c.req.param("id"),
  );
  if (!po) return c.json({ error: "PO not found" }, 404);
  return c.json(po);
});

posRouter.post("/", requireRoles("Owner", "All India Manager"), async (c) => {
  const jwtUser = getUser(c);
  const caller = store.users.find((u) => u.id === jwtUser.id);
  const data = await c.req.json();
  const po = {
    ...data,
    id: uid("po"),
    approvalStatus: "pending",
    createdBy: caller?.name || jwtUser.id,
    createdAt: today(),
  };
  store.pos.unshift(po);
  return c.json(po, 201);
});

posRouter.put("/:id", requireRoles("Owner", "All India Manager"), async (c) => {
  const idx = store.pos.findIndex((p) => p.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "PO not found" }, 404);
  const updates = await c.req.json();
  store.pos[idx] = { ...store.pos[idx], ...updates };
  return c.json(store.pos[idx]);
});

posRouter.put(
  "/:id/approve",
  requireRoles("Owner", "All India Manager"),
  (c) => {
    const jwtUser = getUser(c);
    const caller = store.users.find((u) => u.id === jwtUser.id);
    const idx = store.pos.findIndex((p) => p.id === c.req.param("id"));
    if (idx === -1) return c.json({ error: "PO not found" }, 404);
    store.pos[idx] = {
      ...store.pos[idx],
      approvalStatus: "approved",
      approvedBy: caller?.name || jwtUser.id,
      approvedAt: today(),
      status: "Active",
    };
    return c.json(store.pos[idx]);
  },
);

posRouter.put(
  "/:id/reject",
  requireRoles("Owner", "All India Manager"),
  async (c) => {
    const idx = store.pos.findIndex((p) => p.id === c.req.param("id"));
    if (idx === -1) return c.json({ error: "PO not found" }, 404);
    const { reason } = await c.req.json().catch(() => ({ reason: "" }));
    store.pos[idx] = {
      ...store.pos[idx],
      approvalStatus: "rejected",
      rejectionReason: reason || "",
      status: "Draft",
    };
    return c.json(store.pos[idx]);
  },
);

posRouter.put("/:id/lapse", requireRoles("Owner"), (c) => {
  const idx = store.pos.findIndex((p) => p.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "PO not found" }, 404);
  store.pos[idx] = { ...store.pos[idx], status: "Lapsed" };
  return c.json(store.pos[idx]);
});

export default posRouter;
