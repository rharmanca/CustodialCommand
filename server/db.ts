import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

// Configure WebSocket for serverless environment
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Replit optimization
neonConfig.poolQueryViaFetch = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Check your Replit Secrets tab.",
  );
}

// Configure connection pool for Replit
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === 'production' ? 3 : 1,
  idleTimeoutMillis: 60000, // Longer for Replit
  connectionTimeoutMillis: 15000, // Longer timeout for Replit
});

export { pool };
export const db = drizzle({ client: pool, schema });