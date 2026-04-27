import * as dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../api-worker/src/db/schema';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set in .env file');
  process.exit(1);
}

async function pullData() {
  console.log('Connecting to database via HTTP...');
  
  const sql = neon(DATABASE_URL!);
  const db = drizzle(sql, { schema });

  try {
    console.log('Testing connection...');
    await sql`SELECT 1`;
    console.log('Connection test passed.');
  } catch (err: any) {
    console.error('FAILED to connect to the database via HTTP:');
    console.error(`  Error: ${err.message}`);
    if (err.message.includes('EAI_AGAIN')) {
      console.error('\nTIP: This is a DNS failure. Try using a different DNS (like Google 8.8.8.8) or check your internet connection.');
    }
    process.exit(1);
  }

  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  // Filter only actual Drizzle table objects
  const schemaEntries = Object.entries(schema);
  console.log(`Found ${schemaEntries.length} entries in schema.`);

  for (const [tableName, tableObj] of schemaEntries) {
    // Drizzle tables are objects. We'll skip things that clearly aren't tables.
    if (!tableObj || typeof tableObj !== 'object') {
      continue;
    }

    // Heuristic: check if it has Drizzle-specific properties or at least looks like a table
    // Most Drizzle pgTables have internal properties like "_" or Symbol(drizzle:Name)
    const isTable = ('_' in tableObj) || (Object.getOwnPropertySymbols(tableObj).length > 0);
    
    if (!isTable) {
      // If it doesn't look like a table, skip it (it might be an export of a helper or type)
      continue;
    }
    
    try {
      console.log(`Fetching data from table: ${tableName}...`);
      const result = await db.select().from(tableObj as any);
      
      const filePath = path.join(dataDir, `${tableName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
      console.log(`Successfully saved ${result.length} rows to data/${tableName}.json`);
    } catch (err: any) {
      console.error(`Could not fetch data for ${tableName}: ${err.message}`);
    }
  }

  console.log('\nPull complete. Check the artifacts/db-inspector/data/ directory.');
}

pullData().catch(console.error);
