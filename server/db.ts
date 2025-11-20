
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import { logger } from './logger';

// Load environment variables from .env file
config();

// Configure Neon for Node.js environment with Railway-specific optimizations
neonConfig.fetchConnectionCache = true;
neonConfig.cacheAdapter = {
  get: (key) => Promise.resolve(null), // Implement proper cache if needed
  set: (key, value, ttl) => Promise.resolve(),
};

// Railway-optimized connection settings
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production' || process.env.RAILWAY_SERVICE_ID;

// Unified connection pool settings based on environment
const POOL_CONFIG = isRailway ? {
  maxConnections: 10,
  minConnections: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 15000,
  createTimeoutMillis: 10000,
} : {
  maxConnections: 20,
  minConnections: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
};

if (isRailway) {
  // Railway-specific optimizations
  neonConfig.maxConnections = POOL_CONFIG.maxConnections;
  neonConfig.idleTimeoutMillis = POOL_CONFIG.idleTimeoutMillis;
  neonConfig.connectionTimeoutMillis = POOL_CONFIG.connectionTimeoutMillis;
  logger.info('Applying Railway-specific database configuration', POOL_CONFIG);
} else {
  // Local development settings
  neonConfig.maxConnections = POOL_CONFIG.maxConnections;
  neonConfig.idleTimeoutMillis = POOL_CONFIG.idleTimeoutMillis;
  neonConfig.connectionTimeoutMillis = POOL_CONFIG.connectionTimeoutMillis;
  logger.info('Applying local development database configuration', POOL_CONFIG);
}
// Use ws package for WebSocket support in Node.js
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Check your Replit Secrets tab.");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Create optimized connection pool with unified configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: POOL_CONFIG.maxConnections,
  min: POOL_CONFIG.minConnections,
  idleTimeoutMillis: POOL_CONFIG.idleTimeoutMillis,
  connectionTimeoutMillis: POOL_CONFIG.connectionTimeoutMillis,
  acquireTimeoutMillis: POOL_CONFIG.acquireTimeoutMillis,
  createTimeoutMillis: POOL_CONFIG.createTimeoutMillis,
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

// Database reconnection wrapper
export async function withDatabaseReconnection<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if error is connection-related
      const isConnectionError =
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("ENOTFOUND") ||
        errorMessage.includes("ETIMEDOUT") ||
        errorMessage.includes("Connection terminated") ||
        errorMessage.includes("connection_lost") ||
        errorMessage.includes("PROTOCOL_CONNECTION_LOST") ||
        errorMessage.includes("ECONNRESET");

      if (!isConnectionError) {
        // Not a connection error, don't retry
        throw error;
      }

      logger.warn(`Database connection error on attempt ${attempt}/${maxRetries}`, {
        operation: operationName,
        error: errorMessage,
        attempt,
      });

      if (attempt === maxRetries) {
        logger.error(`Database operation failed after ${maxRetries} attempts`, {
          operation: operationName,
          error: errorMessage,
        });
        throw error;
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      logger.info(`Retrying database operation`, {
        operation: operationName,
        attempt: attempt + 1,
        delay,
      });
    }
  }

  throw lastError || new Error("Database operation failed");
}

// Graceful shutdown for database connections
process.on('SIGTERM', () => {
  logger.info('Closing database connections...');
  pool.end(() => {
    logger.info('Database connections closed');
    process.exit(0);
  });
});
