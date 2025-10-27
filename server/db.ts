
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import { logger } from './logger';

// Load environment variables from .env file
config();

// Configure Neon for Node.js environment
neonConfig.fetchConnectionCache = true;
// Use ws package for WebSocket support in Node.js
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Check your Replit Secrets tab.");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Create a connection pool for health checks
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Test database connection on startup
pool.query('SELECT 1').then(() => {
  logger.info('Database connection established successfully');
}).catch((error) => {
  logger.error('Database connection failed', { error: error instanceof Error ? error.message : 'Unknown error' });
});
