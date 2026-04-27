import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Default local connection URL (for local dev only)
const LOCAL_URL = 'postgresql://gnana:postgres@localhost:5432/api_worker';

let pool: Pool | null = null;

export function getDb(databaseUrl?: string) {
  const url = databaseUrl || LOCAL_URL;
  
  if (!pool) {
    pool = new Pool({
      connectionString: url,
    });
  }
  
  return drizzle(pool, { schema });
}

export type DB = ReturnType<typeof getDb>;
export { schema };
