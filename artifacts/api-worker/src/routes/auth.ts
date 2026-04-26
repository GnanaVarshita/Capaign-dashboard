import { Hono } from 'hono';
import { signToken } from '../auth/jwt';
import { verifyPassword } from '../auth/password';
import { safeUser } from '../helpers';
import { getDb, schema } from '../db/index';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';

const DEFAULT_SECRET = 'ad-campaign-jwt-secret-2026';
const authRouter = new Hono<{ Bindings: Bindings }>();

authRouter.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { loginId, password } = body as {
    loginId?: string;
    password?: string;
  };

  if (!loginId || !password)
    return c.json({ error: 'loginId and password are required' }, 400);

  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.loginId, loginId.toLowerCase()));

  if (!user || user.status !== 'active')
    return c.json({ error: 'Invalid credentials or account inactive' }, 401);

  const valid = await verifyPassword(password, user.password);
  if (!valid)
    return c.json({ error: 'Invalid credentials or account inactive' }, 401);

  const secret = c.env.JWT_SECRET || DEFAULT_SECRET;
  const token = await signToken(
    { id: user.id, role: user.role, loginId: user.loginId },
    24,
    secret,
  );

  return c.json({ token, user: safeUser(user) });
});

export default authRouter;
