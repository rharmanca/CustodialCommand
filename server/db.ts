<<<<<<< HEAD
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

=======
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

>>>>>>> cadfd26dfb434a576df963764ff632b780371326
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Check your Replit Secrets tab.",
  );
}

<<<<<<< HEAD
// Configure connection pool for Replit
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === 'production' ? 3 : 1,
  idleTimeoutMillis: 60000, // Longer for Replit
  connectionTimeoutMillis: 15000, // Longer timeout for Replit
});

export { pool };
export const db = drizzle({ client: pool, schema });
=======
// Use Neon's serverless driver for better connection handling
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
>>>>>>> cadfd26dfb434a576df963764ff632b780371326
