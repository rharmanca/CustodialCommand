
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import { logger } from './logger';

// Load environment variables from .env file
config();

// Configure Neon for Node.js environment with performance optimizations
neonConfig.fetchConnectionCache = true;
neonConfig.cacheAdapter = {
  get: (key) => Promise.resolve(null), // Implement proper cache if needed
  set: (key, value, ttl) => Promise.resolve(),
};
neonConfig.maxConnections = 20; // Increased connection pool size
neonConfig.idleTimeoutMillis = 30000; // Close idle connections after 30s
neonConfig.connectionTimeoutMillis = 10000; // Connection timeout
// Use ws package for WebSocket support in Node.js
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Check your Replit Secrets tab.");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Create optimized connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections in pool
  min: 5,  // Minimum number of connections to maintain
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
});

// Connection pool monitoring
let connectionPoolErrors = 0;
const MAX_POOL_ERRORS = 5;

pool.on('error', (err) => {
  connectionPoolErrors++;
  logger.error('Database pool error', { error: err.message, errorCount: connectionPoolErrors });

  if (connectionPoolErrors >= MAX_POOL_ERRORS) {
    logger.error('Too many database pool errors, restarting pool may be needed');
  }
});

pool.on('connect', (client) => {
  logger.debug('New database connection established', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

pool.on('remove', (client) => {
  logger.debug('Database connection removed', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount
  });
});

// Test database connection on startup with retry logic
async function initializeDatabase() {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await pool.query('SELECT 1');
      logger.info('Database connection established successfully', {
        poolSize: pool.totalCount,
        attempt
      });
      return;
    } catch (error) {
      logger.error(`Database connection attempt ${attempt} failed`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt,
        maxRetries
      });

      if (attempt === maxRetries) {
        logger.error('Failed to establish database connection after all retries');
        throw error;
      }

      logger.info(`Retrying database connection in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// Initialize database connection
initializeDatabase().catch((error) => {
  logger.error('Fatal: Database initialization failed', { error });
  process.exit(1);
});

// Graceful shutdown for database connections
process.on('SIGTERM', () => {
  logger.info('Closing database connections...');
  pool.end(() => {
    logger.info('Database connections closed');
    process.exit(0);
  });
});
