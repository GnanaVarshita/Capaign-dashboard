import { Hono } from "hono";
import { signToken } from "../auth/jwt";
import { safeUser } from "../helpers";
import { store } from "../store";

const authRouter = new Hono();

authRouter.post("/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { loginId, password } = body as { loginId?: string; password?: string };

  if (!loginId || !password)
    return c.json({ error: "loginId and password are required" }, 400);

  const user = store.users.find(
    (u) =>
      u.loginId.toLowerCase() === loginId.toLowerCase() &&
      u.password === password &&
      u.status === "active",
  );
  if (!user)
    return c.json({ error: "Invalid credentials or account inactive" }, 401);

  const token = await signToken({
    id: user.id,
    role: user.role,
    loginId: user.loginId,
  });
  return c.json({ token, user: safeUser(user) });
});

export default authRouter;
