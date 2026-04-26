import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Default local connection URL (for local dev only)
const LOCAL_URL = 'postgresql://gnana:postgres@localhost:5432/api_worker';

export function getDb(databaseUrl?: string) {
  // Use Hyperdrive if available, otherwise use the direct URL
  const url = databaseUrl || LOCAL_URL;
  
  // Create the Neon HTTP client
  // Note: Hyperdrive currently works best with TCP (node-postgres), 
  // but if that is hanging, we use the Neon HTTP driver directly for stability.
  const client = neon(url);
  return drizzle(client, { schema });
}

export type DB = ReturnType<typeof getDb>;
export { schema };
