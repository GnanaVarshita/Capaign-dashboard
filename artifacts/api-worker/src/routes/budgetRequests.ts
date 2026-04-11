import { Hono } from "hono";
import { getUser, requireRoles } from "../middleware/authMiddleware";
import { uid, today, GLOBAL_ROLES, APPROVER_ROLES } from "../helpers";
import { store } from "../store";

const budgetRouter = new Hono();

// Budget Request Groups
budgetRouter.get("/groups", (c) => {
  const jwtUser = getUser(c);
  const groups =
    jwtUser.role === "Area Manager" || jwtUser.role === "Vendor"
      ? store.budgetRequestGroups.filter((g) => g.status === "active")
      : store.budgetRequestGroups;
  return c.json(groups);
});

budgetRouter.post(
  "/groups",
  requireRoles("Owner", "All India Manager"),
  async (c) => {
    const jwtUser = getUser(c);
    const caller = store.users.find((u) => u.id === jwtUser.id);
    const data = await c.req.json();
    const requestNumber = `BR-${new Date().getFullYear()}-${String(store.budgetRequestGroups.length + 1).padStart(3, "0")}`;
    const group = {
      ...data,
      id: uid("brg"),
      requestNumber,
      aimId: jwtUser.id,
      aimName: caller?.name || "",
      createdAt: today(),
      status: "active",
    };
    store.budgetRequestGroups.unshift(group);
    return c.json(group, 201);
  },
);

budgetRouter.put(
  "/groups/:id/close",
  requireRoles("Owner", "All India Manager"),
  (c) => {
    const idx = store.budgetRequestGroups.findIndex(
      (g) => g.id === c.req.param("id"),
    );
    if (idx === -1) return c.json({ error: "Group not found" }, 404);
    store.budgetRequestGroups[idx] = {
      ...store.budgetRequestGroups[idx],
      status: "closed",
    };
    return c.json(store.budgetRequestGroups[idx]);
  },
);

// Budget Requests
budgetRouter.get("/", (c) => {
  const jwtUser = getUser(c);
  const caller = store.users.find((u) => u.id === jwtUser.id);
  if (GLOBAL_ROLES.includes(jwtUser.role)) return c.json(store.budgetRequests);
  let requests = store.budgetRequests;
  if (jwtUser.role === "Area Manager")
    requests = requests.filter((r) => r.areaManagerId === jwtUser.id);
  else if (jwtUser.role === "Zonal Manager")
    requests = requests.filter(
      (r) =>
        r.zone === caller?.territory?.zone &&
        r.region === caller?.territory?.region,
    );
  else if (jwtUser.role === "Regional Manager")
    requests = requests.filter((r) => r.region === caller?.territory?.region);
  return c.json(requests);
});

budgetRouter.post("/", requireRoles("Area Manager", "Owner"), async (c) => {
  const jwtUser = getUser(c);
  const caller = store.users.find((u) => u.id === jwtUser.id);
  const data = await c.req.json();
  const request = {
    ...data,
    id: uid("br"),
    status: "submitted",
    createdAt: today(),
    areaManagerId: data.areaManagerId || jwtUser.id,
    areaManagerName: data.areaManagerName || caller?.name,
  };
  store.budgetRequests.unshift(request);
  return c.json(request, 201);
});

budgetRouter.put("/:id/approve", requireRoles(...APPROVER_ROLES), async (c) => {
  const jwtUser = getUser(c);
  const caller = store.users.find((u) => u.id === jwtUser.id);
  const idx = store.budgetRequests.findIndex((r) => r.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "Budget request not found" }, 404);
  const req = store.budgetRequests[idx];
  let update: Record<string, any> = {};
  if (jwtUser.role === "Zonal Manager" && req.status === "submitted") {
    update = {
      status: "zm-approved",
      zmId: jwtUser.id,
      zmName: caller?.name,
      zmApprovedAt: today(),
    };
  } else if (
    jwtUser.role === "Regional Manager" &&
    req.status === "zm-approved"
  ) {
    update = {
      status: "rm-approved",
      rmId: jwtUser.id,
      rmName: caller?.name,
      rmApprovedAt: today(),
    };
  } else if (
    GLOBAL_ROLES.includes(jwtUser.role) &&
    req.status === "rm-approved"
  ) {
    update = {
      status: "aim-approved",
      aimId: jwtUser.id,
      aimName: caller?.name,
      aimApprovedAt: today(),
    };
  } else {
    return c.json(
      { error: "Cannot approve: incorrect role or request status sequence" },
      400,
    );
  }
  store.budgetRequests[idx] = { ...req, ...update };
  return c.json(store.budgetRequests[idx]);
});

budgetRouter.put("/:id", async (c) => {
  const idx = store.budgetRequests.findIndex((r) => r.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "Budget request not found" }, 404);
  const updates = await c.req.json();
  store.budgetRequests[idx] = { ...store.budgetRequests[idx], ...updates };
  return c.json(store.budgetRequests[idx]);
});

export default budgetRouter;
