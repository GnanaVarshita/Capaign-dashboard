import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

// Default local connection URL
const LOCAL_URL = 'postgresql://gnana:postgres@localhost:5432/api_worker';

let _pool: pg.Pool | null = null;

/**
 * Creates or retrieves a connection pool.
 * @param databaseUrl The connection string (can be a Hyperdrive connection string)
 */
function getPool(databaseUrl: string): pg.Pool {
  if (!_pool) {
    console.log('[db] Creating pool');
    _pool = new Pool({ 
      connectionString: databaseUrl, 
      ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false } 
    });
  }
  return _pool;
}

/**
 * Returns a Drizzle DB instance.
 * @param databaseUrl The connection string to use.
 */
export function getDb(databaseUrl?: string) {
  // Use provided URL, or fall back to local default
  const url = databaseUrl || LOCAL_URL;
  const pool = getPool(url);
  return drizzle(pool, { schema });
}

export type DB = ReturnType<typeof getDb>;
export { schema };
