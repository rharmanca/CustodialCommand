
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Load environment variables from .env file
config();

// Recommended for Node to reuse HTTP connections (now on by default; harmless here)
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Check your Replit Secrets tab.");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
