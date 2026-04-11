import { Hono } from "hono";
import { requireRoles } from "../middleware/authMiddleware";
import { store } from "../store";

const regionsRouter = new Hono();

regionsRouter.get("/", (c) => c.json(store.regions));

regionsRouter.post("/", requireRoles("Owner"), async (c) => {
  const data = await c.req.json();
  store.regions.push(data);
  return c.json(data, 201);
});

regionsRouter.put("/:name", requireRoles("Owner"), async (c) => {
  const name = decodeURIComponent(c.req.param("name"));
  const idx = store.regions.findIndex((r) => r.name === name);
  if (idx === -1) return c.json({ error: "Region not found" }, 404);
  const updates = await c.req.json();
  store.regions[idx] = { ...store.regions[idx], ...updates };
  return c.json(store.regions[idx]);
});

export default regionsRouter;
