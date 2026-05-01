import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzleServerless } from 'drizzle-orm/neon-serverless';
import { Pool, neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Default local connection URL (for local dev only)
const LOCAL_URL = 'postgresql://gnana:postgres@localhost:5432/api_worker';

let pool: Pool | null = null;

/**
 * getDb handles connection to Neon DB.
 * In Cloudflare Workers, we use @neondatabase/serverless.
 */
export function getDb(databaseUrl?: string, useHttp = false) {
  const url = databaseUrl || LOCAL_URL;

  if (!url || url === LOCAL_URL) {
    // If we are in a worker environment but using local URL, something is wrong
    if (typeof (globalThis as any).WebSocket === 'function') {
       console.warn('Warning: Using fallback LOCAL_URL in a potential worker environment');
    }
  }
  
  if (useHttp) {
    const client = neon(url);
    return drizzleHttp(client, { schema });
  }

  if (!pool) {
    pool = new Pool({
      connectionString: url,
    });
  }
  
  return drizzleServerless(pool, { schema });
}

export type DB = ReturnType<typeof getDb>;
export { schema };
