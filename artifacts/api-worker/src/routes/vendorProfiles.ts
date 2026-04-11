import { Hono } from "hono";
import { getUser } from "../middleware/authMiddleware";
import { store } from "../store";

const vendorRouter = new Hono();

vendorRouter.get("/", (c) => {
  const jwtUser = getUser(c);
  if (jwtUser.role === "Vendor") {
    const profile = store.vendorProfiles[jwtUser.id];
    return c.json(profile ? { [jwtUser.id]: profile } : {});
  }
  return c.json(store.vendorProfiles);
});

vendorRouter.get("/:vendorId", (c) => {
  const vid = c.req.param("vendorId");
  const jwtUser = getUser(c);
  if (jwtUser.role === "Vendor" && jwtUser.id !== vid)
    return c.json({ error: "Forbidden" }, 403);
  return c.json(store.vendorProfiles[vid] || {});
});

vendorRouter.put("/:vendorId", async (c) => {
  const vid = c.req.param("vendorId");
  const jwtUser = getUser(c);
  if (jwtUser.role === "Vendor" && jwtUser.id !== vid)
    return c.json({ error: "Forbidden" }, 403);
  const updates = await c.req.json();
  store.vendorProfiles[vid] = {
    ...(store.vendorProfiles[vid] || { vendorId: vid }),
    ...updates,
  };
  return c.json(store.vendorProfiles[vid]);
});

export default vendorRouter;
