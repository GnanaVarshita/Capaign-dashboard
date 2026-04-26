import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

// Default local connection URL
const LOCAL_URL = 'postgresql://gnana:postgres@localhost:5432/api_worker';

let _pool: pg.Pool | null = null;

/**
 * Creates or retrieves a connection pool.
 */
function getPool(databaseUrl: string): pg.Pool {
  const isHyperdrive = databaseUrl.includes('hyperdrive');
  
  if (!_pool) {
    console.log('[db] Creating new pool. Hyperdrive:', isHyperdrive);
    _pool = new Pool({ 
      connectionString: databaseUrl,
      // Hyperdrive handles SSL to the origin; the Worker-to-Hyperdrive connection should be plain
      ssl: (databaseUrl.includes('localhost') || isHyperdrive) ? false : { rejectUnauthorized: false },
      max: 1 // Hyperdrive works best with small pool sizes per worker
    });

    _pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      _pool = null; // Reset pool on error so it can be recreated
    });
  }
  return _pool;
}

export function getDb(databaseUrl?: string) {
  const url = databaseUrl || LOCAL_URL;
  try {
    const pool = getPool(url);
    return drizzle(pool, { schema });
  } catch (err) {
    console.error('[db] Failed to initialize Drizzle:', err);
    throw err;
  }
}

export type DB = ReturnType<typeof getDb>;
export { schema };
