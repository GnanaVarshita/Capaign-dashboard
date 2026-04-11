import { Hono } from "hono";
import { getUser, requireRoles } from "../middleware/authMiddleware";
import { uid, safeUser, GLOBAL_ROLES } from "../helpers";
import { store } from "../store";

const usersRouter = new Hono();

usersRouter.get("/", (c) => {
  const jwtUser = getUser(c);
  if (GLOBAL_ROLES.includes(jwtUser.role))
    return c.json(store.users.map(safeUser));

  const caller = store.users.find((u) => u.id === jwtUser.id);
  let users: any[] = [];
  if (jwtUser.role === "Regional Manager") {
    users = store.users.filter(
      (u) =>
        u.territory?.region === caller?.territory?.region ||
        u.territory?.assignedRMIds?.includes(caller?.id),
    );
  } else if (jwtUser.role === "Zonal Manager") {
    users = store.users.filter(
      (u) =>
        (u.territory?.zone === caller?.territory?.zone &&
          u.territory?.region === caller?.territory?.region) ||
        u.territory?.assignedZones?.some(
          (z: any) => z.zone === caller?.territory?.zone,
        ),
    );
  } else {
    users = store.users.filter((u) => u.id === jwtUser.id);
  }
  return c.json(users.map(safeUser));
});

usersRouter.get("/:id", (c) => {
  const user = store.users.find((u) => u.id === c.req.param("id"));
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(safeUser(user));
});

usersRouter.post("/", requireRoles("Owner"), async (c) => {
  const data = await c.req.json();
  const newUser = { ...data, id: uid("u"), status: data.status || "active" };
  store.users.push(newUser);
  return c.json(safeUser(newUser), 201);
});

usersRouter.put("/:id", requireRoles("Owner"), async (c) => {
  const idx = store.users.findIndex((u) => u.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "User not found" }, 404);
  const updates = await c.req.json();
  store.users[idx] = { ...store.users[idx], ...updates };
  return c.json(safeUser(store.users[idx]));
});

usersRouter.delete("/:id", requireRoles("Owner"), (c) => {
  const idx = store.users.findIndex((u) => u.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "User not found" }, 404);
  store.users.splice(idx, 1);
  return c.json({ success: true });
});

export default usersRouter;
