import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for serverless environment
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool for serverless
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Reduce pool size for serverless
  idleTimeoutMillis: 30000, // Close idle connections faster
  connectionTimeoutMillis: 10000, // Shorter connection timeout
});

export { pool };
export const db = drizzle({ client: pool, schema });