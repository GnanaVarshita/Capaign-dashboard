import { Hono } from "hono";
import { getUser, requireRoles } from "../middleware/authMiddleware";
import {
  uid,
  today,
  scopeEntries,
  getPendingForApprover,
  APPROVER_ROLES,
} from "../helpers";
import { store } from "../store";

const entriesRouter = new Hono();

entriesRouter.get("/", (c) => {
  const jwtUser = getUser(c);
  const caller = store.users.find((u) => u.id === jwtUser.id);
  if (!caller) return c.json({ error: "User not found" }, 404);
  return c.json(scopeEntries(store.entries, caller, store.users));
});

entriesRouter.get("/pending", (c) => {
  const jwtUser = getUser(c);
  const caller = store.users.find((u) => u.id === jwtUser.id);
  if (!caller) return c.json({ error: "User not found" }, 404);
  return c.json(getPendingForApprover(store.entries, caller, store.users));
});

entriesRouter.get("/mine", (c) => {
  const jwtUser = getUser(c);
  return c.json(store.entries.filter((e) => e.userId === jwtUser.id));
});

entriesRouter.post(
  "/",
  requireRoles("Area Manager", "Vendor", "Owner", "All India Manager"),
  async (c) => {
    const jwtUser = getUser(c);
    const data = await c.req.json();
    const entry = {
      ...data,
      id: uid("e"),
      status: "pending",
      decidedBy: "",
      decidedAt: "",
      userId: data.userId || jwtUser.id,
    };
    store.entries.unshift(entry);
    return c.json(entry, 201);
  },
);

entriesRouter.put("/:id", async (c) => {
  const jwtUser = getUser(c);
  const idx = store.entries.findIndex((e) => e.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "Entry not found" }, 404);
  const entry = store.entries[idx];
  const canEdit =
    store.users.some((u) => ["Owner", "All India Manager"].includes(u.role)) ||
    (entry.userId === jwtUser.id && entry.status === "pending");
  if (!canEdit) return c.json({ error: "Forbidden" }, 403);
  const updates = await c.req.json();
  store.entries[idx] = { ...entry, ...updates };
  return c.json(store.entries[idx]);
});

entriesRouter.put("/:id/status", requireRoles(...APPROVER_ROLES), async (c) => {
  const jwtUser = getUser(c);
  const caller = store.users.find((u) => u.id === jwtUser.id);
  const idx = store.entries.findIndex((e) => e.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "Entry not found" }, 404);
  const { status, remarks } = (await c.req.json()) as {
    status: string;
    remarks?: string;
  };
  if (!["approved", "rejected"].includes(status))
    return c.json({ error: "status must be approved or rejected" }, 400);
  store.entries[idx] = {
    ...store.entries[idx],
    status,
    decidedBy: caller?.name || jwtUser.id,
    decidedByDesignation: caller?.role,
    decidedAt: today(),
    ...(remarks ? { remarks } : {}),
  };
  return c.json(store.entries[idx]);
});

entriesRouter.delete("/:id", async (c) => {
  const jwtUser = getUser(c);
  const idx = store.entries.findIndex((e) => e.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "Entry not found" }, 404);
  const entry = store.entries[idx];
  const canDelete =
    jwtUser.role === "Owner" ||
    (entry.userId === jwtUser.id && entry.status === "pending");
  if (!canDelete)
    return c.json(
      { error: "Forbidden – can only delete your own pending entries" },
      403,
    );
  store.entries.splice(idx, 1);
  return c.json({ success: true });
});

export default entriesRouter;
