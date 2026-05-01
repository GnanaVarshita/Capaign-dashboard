import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, getUser } from './middleware/authMiddleware';
import { safeUser } from './helpers';
import { getDb, schema } from './db/index';
import { eq } from 'drizzle-orm';
import type { Bindings } from './types';

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import entriesRouter from './routes/entries';
import posRouter from './routes/pos';
import billsRouter from './routes/bills';
import { budgetRouter, groupRouter } from './routes/budgetRequests';
import configRouter from './routes/config';
import regionsRouter from './routes/regions';
import vendorRouter from './routes/vendorProfiles';
import receiverRouter from './routes/serviceReceivers';
import quotationsRouter from './routes/quotations';

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);

// PUBLIC
app.get('/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString() }),
);

app.route('/api/auth', authRouter);

// PROTECTED
app.use('/api/*', authMiddleware);

app.get('/api/me', async (c) => {
  const jwtUser = getUser(c);
  const db = getDb(c.env?.DATABASE_URL || c.env?.HYPERDRIVE?.connectionString, true);
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, jwtUser.id));
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(safeUser(user));
});

// ROUTES
app.route('/api/users', usersRouter);
app.route('/api/entries', entriesRouter);
app.route('/api/pos', posRouter);
app.route('/api/bills', billsRouter);
app.route('/api/budget-requests', budgetRouter);
app.route('/api/budget-request-groups', groupRouter);
app.route('/api/config', configRouter);
app.route('/api/regions', regionsRouter);
app.route('/api/vendor-profiles', vendorRouter);
app.route('/api/service-receivers', receiverRouter);
app.route('/api/quotations', quotationsRouter);

// 404 fallback
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  
  // Ensure CORS is present even on errors
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return c.json({ 
    error: 'Internal server error', 
    message: err.message,
    // stack: err.stack // Consider if we want to expose this
  }, 500);
});

export default app;
