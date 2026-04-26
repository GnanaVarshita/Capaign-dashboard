import { Hono } from 'hono';
import { getUser, requireRoles } from '../middleware/authMiddleware';
import { uid, safeUser, GLOBAL_ROLES } from '../helpers';
import { hashPassword } from '../auth/password';
import { getDb, schema } from '../db/index';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';

const usersRouter = new Hono<{ Bindings: Bindings }>();

usersRouter.get('/', async (c) => {
  const jwtUser = getUser(c);
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const allUsers = await db.select().from(schema.users);

  if (GLOBAL_ROLES.includes(jwtUser.role))
    return c.json(allUsers.map(safeUser));

  const caller = allUsers.find((u) => u.id === jwtUser.id);
  let users: typeof allUsers = [];

  if (jwtUser.role === 'Regional Manager') {
    users = allUsers.filter(
      (u) =>
        u.territory?.region === caller?.territory?.region ||
        u.territory?.assignedRMIds?.includes(caller?.id),
    );
  } else if (jwtUser.role === 'Zonal Manager') {
    users = allUsers.filter(
      (u) =>
        (u.territory?.zone === caller?.territory?.zone &&
          u.territory?.region === caller?.territory?.region) ||
        u.territory?.assignedZones?.some(
          (z: any) => z.zone === caller?.territory?.zone,
        ),
    );
  } else {
    users = allUsers.filter((u) => u.id === jwtUser.id);
  }

  return c.json(users.map(safeUser));
});

usersRouter.get('/:id', async (c) => {
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, c.req.param('id')));
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(safeUser(user));
});

usersRouter.post('/', requireRoles('Owner'), async (c) => {
  const data = await c.req.json();
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const id = uid('u');
  const hashedPassword = data.password
    ? await hashPassword(data.password)
    : await hashPassword('Welcome@123');

  const newUser = {
    id,
    name: data.name,
    loginId: data.loginId?.toLowerCase() || id,
    password: hashedPassword,
    role: data.role || 'Area Manager',
    status: data.status || 'active',
    phone: data.phone || null,
    email: data.email || null,
    aadhaar: data.aadhaar || null,
    pan: data.pan || null,
    territory: data.territory || {},
    perms: data.perms || {
      view: true,
      enter: false,
      edit: false,
      approve: false,
      manage: false,
    },
    tabPerms: data.tabPerms || null,
  };

  await db.insert(schema.users).values(newUser);
  return c.json(safeUser(newUser), 201);
});

usersRouter.put('/:id', requireRoles('Owner'), async (c) => {
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const id = c.req.param('id');
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id));
  if (!existing) return c.json({ error: 'User not found' }, 404);

  const updates = await c.req.json();

  const toUpdate: Record<string, any> = { ...updates };
  delete toUpdate.id;
  delete toUpdate.createdAt;

  if (updates.password) {
    toUpdate.password = await hashPassword(updates.password);
  } else {
    delete toUpdate.password;
  }
  if (updates.loginId) {
    toUpdate.loginId = updates.loginId.toLowerCase();
  }

  const [updated] = await db
    .update(schema.users)
    .set(toUpdate)
    .where(eq(schema.users.id, id))
    .returning();

  return c.json(safeUser(updated));
});

usersRouter.delete('/:id', requireRoles('Owner'), async (c) => {
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString);
  const id = c.req.param('id');
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id));
  if (!existing) return c.json({ error: 'User not found' }, 404);
  await db.delete(schema.users).where(eq(schema.users.id, id));
  return c.json({ success: true });
});

export default usersRouter;
