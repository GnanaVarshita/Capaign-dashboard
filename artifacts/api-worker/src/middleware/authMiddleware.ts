import { Context, Next } from 'hono';
import { verifyToken, extractToken, JWTPayload } from '../auth/jwt';

export type AuthContext = { user: JWTPayload };

export async function authMiddleware(c: Context, next: Next) {
  const token = extractToken(c.req.header('Authorization') || null);
  if (!token) return c.json({ error: 'Unauthorized – no token provided' }, 401);

  const payload = await verifyToken(token);
  if (!payload) return c.json({ error: 'Unauthorized – invalid or expired token' }, 401);

  c.set('user', payload);
  await next();
}

export function getUser(c: Context): JWTPayload {
  return c.get('user') as JWTPayload;
}

export function requireRoles(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = getUser(c);
    if (!roles.includes(user.role)) {
      return c.json({ error: `Forbidden – requires one of: ${roles.join(', ')}` }, 403);
    }
    await next();
  };
}
