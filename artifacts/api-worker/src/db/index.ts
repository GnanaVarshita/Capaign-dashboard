import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

// Neon connection URL — hardcoded so Replit's injected DATABASE_URL doesn't interfere.
// When deploying to Cloudflare Workers, the workers version (neon-http driver) is used instead.
const NEON_URL =
  'postgresql://neondb_owner:npg_zA2Hf3LRiTDQ@ep-wild-butterfly-am3ofjd5.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require';

let _pool: pg.Pool | null = null;

function getPool(databaseUrl?: string): pg.Pool {
  // Prefer explicitly passed URL, then NEON_URL (never use process.env which Replit overrides).
  const url = databaseUrl || NEON_URL;
  if (!_pool) {
    console.log('[db] Creating pool for host:', url.split('@')[1]?.split('/')[0]);
    _pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  }
  return _pool;
}

export function getDb(databaseUrl?: string) {
  const pool = getPool(databaseUrl);
  return drizzle(pool, { schema });
}

export type DB = ReturnType<typeof getDb>;
export { schema };
