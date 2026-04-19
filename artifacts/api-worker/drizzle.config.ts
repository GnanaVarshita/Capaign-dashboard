import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://neondb_owner:npg_zA2Hf3LRiTDQ@ep-wild-butterfly-am3ofjd5.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require',
  },
} satisfies Config;
