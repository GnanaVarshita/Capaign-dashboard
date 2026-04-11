import { Hono } from "hono";
import { getUser, requireRoles } from "../middleware/authMiddleware";
import { uid, today } from "../helpers";
import { store } from "../store";

const receiverRouter = new Hono();

receiverRouter.get("/", (c) => {
  const jwtUser = getUser(c);
  const receivers =
    jwtUser.role === "Vendor"
      ? store.serviceReceivers.filter((r) => r.vendorId === jwtUser.id)
      : store.serviceReceivers;
  return c.json(receivers);
});

receiverRouter.post("/", requireRoles("Vendor", "Owner"), async (c) => {
  const jwtUser = getUser(c);
  const data = await c.req.json();
  const receiver = {
    ...data,
    id: uid("sr"),
    vendorId: data.vendorId || jwtUser.id,
    createdAt: today(),
  };
  store.serviceReceivers.push(receiver);
  return c.json(receiver, 201);
});

receiverRouter.put("/:id", async (c) => {
  const jwtUser = getUser(c);
  const idx = store.serviceReceivers.findIndex(
    (r) => r.id === c.req.param("id"),
  );
  if (idx === -1) return c.json({ error: "Service receiver not found" }, 404);
  const sr = store.serviceReceivers[idx];
  if (jwtUser.role === "Vendor" && sr.vendorId !== jwtUser.id)
    return c.json({ error: "Forbidden" }, 403);
  const updates = await c.req.json();
  store.serviceReceivers[idx] = { ...sr, ...updates };
  return c.json(store.serviceReceivers[idx]);
});

receiverRouter.delete("/:id", async (c) => {
  const jwtUser = getUser(c);
  const idx = store.serviceReceivers.findIndex(
    (r) => r.id === c.req.param("id"),
  );
  if (idx === -1) return c.json({ error: "Service receiver not found" }, 404);
  if (
    jwtUser.role === "Vendor" &&
    store.serviceReceivers[idx].vendorId !== jwtUser.id
  )
    return c.json({ error: "Forbidden" }, 403);
  store.serviceReceivers.splice(idx, 1);
  return c.json({ success: true });
});

export default receiverRouter;
