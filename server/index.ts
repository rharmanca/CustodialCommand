// Environment variables are loaded by Railway automatically
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { randomBytes } from "crypto";
import helmet from "helmet";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders, validateRequest, sanitizeInput, apiRateLimit, strictRateLimit } from "./security";
import { logger, requestIdMiddleware } from "./logger";
import { performanceMonitor, healthCheck, errorHandler, metricsMiddleware, metricsCollector } from "./monitoring";
import {
  cacheMiddleware,
  invalidateCache,
  performanceMiddleware,
  memoryMonitoring,
  requestDeduplication,
  apiCache
} from "./cache";
import { storage } from "./storage";
import {
  performanceErrorHandler,
  asyncErrorHandler,
  errorRecoveryMiddleware,
  gracefulDegradation,
  circuitBreakerMiddleware,
  databaseCircuitBreaker,
  cacheCircuitBreaker,
  fileUploadCircuitBreaker
} from "./performanceErrorHandler";
 


const app = express();

// Core middleware configuration - MUST be before routes
// Configure trust proxy for Replit environment (but not for rate limiting)
if (process.env.REPL_SLUG) {
  app.set('trust proxy', 1); // Trust first proxy only on Replit
} else {
  app.set('trust proxy', false); // Disable in other environments
}

// Performance and monitoring middleware (order matters)
app.use(requestIdMiddleware);
app.use(performanceMiddleware);
app.use(memoryMonitoring);
app.use(metricsMiddleware);

// Graceful degradation and circuit breaker protection
app.use(gracefulDegradation);
app.use(errorRecoveryMiddleware);

// Request deduplication to prevent duplicate requests
app.use(requestDeduplication);
app.use(helmet({
  // Content Security Policy - disabled for development to allow inline styles
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // FIXED: Added 'unsafe-inline' for Vite compatibility
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  // Additional security headers
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  permittedCrossDomainPolicies: false,
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Prevent IE from executing downloads in site context
  ieNoOpen: true,
  // Don't infer MIME type
  noSniff: true,
  // X-Frame-Options - already set in securityHeaders but keeping for consistency
  frameguard: { action: 'deny' },
  // X-XSS-Protection - already set in securityHeaders but keeping for consistency
  xssFilter: true
}));
app.use(compression({
  // Enhanced compression settings
  level: 6, // Compression level (1-9, 6 is default)
  threshold: 1024, // Only compress responses larger than 1KB
  chunkSize: 16 * 1024, // 16KB chunks for better compression
  windowBits: 15,
  memLevel: 8,
  // Compress only these content types
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Don't compress compressed responses
    const type = res.getHeader('Content-Type') as string;
    if (type && (type.includes('image/') || type.includes('video/') || type.includes('application/zip'))) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use(securityHeaders);
app.use(validateRequest);
app.use(sanitizeInput);

// Body parsing middleware - CRITICAL: Must be before routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Performance optimization middleware
app.use(cacheMiddleware); // Add caching for GET requests

// Apply rate limiting to API routes with different limits for different endpoints
app.use('/api/admin/login', strictRateLimit); // Strict rate limiting for auth
app.use('/api/inspections', apiRateLimit); // Rate limiting for inspections with uploads
app.use('/api/custodial-notes', apiRateLimit); // Rate limiting for notes with uploads
app.use('/api/monthly-feedback', apiRateLimit); // Rate limiting for feedback with uploads
app.use('/api', apiRateLimit); // Default rate limiting for other API routes

// Add cache invalidation for mutation routes
app.use('/api/inspections', invalidateCache(['inspections', 'scores']));
app.use('/api/custodial-notes', invalidateCache(['custodialNotes', 'scores']));
app.use('/api/monthly-feedback', invalidateCache(['monthlyFeedback']));

// Add circuit breaker protection to critical routes
app.use('/api/inspections', circuitBreakerMiddleware(databaseCircuitBreaker, 'inspections'));
app.use('/api/custodial-notes', circuitBreakerMiddleware(databaseCircuitBreaker, 'custodial-notes'));
app.use('/api/monthly-feedback', circuitBreakerMiddleware(fileUploadCircuitBreaker, 'monthly-feedback'));
app.use('/api/scores', circuitBreakerMiddleware(cacheCircuitBreaker, 'scores'));

// Debug: Log API requests with headers and body (after parsers)
app.use('/api', (req: any, res: any, next: any) => {
  try {
    const contentType = req.headers['content-type'];
    const accept = req.headers['accept'];
    const contentLength = req.headers['content-length'];
    const path = req.path;
    const method = req.method;

    // Shallow clone body to avoid huge logs
    const bodyPreview = req.body ? JSON.parse(JSON.stringify(req.body)) : undefined;
    // Truncate long strings
    const truncate = (val: any) => {
      if (typeof val === 'string' && val.length > 500) return val.slice(0, 497) + '…';
      return val;
    };
    if (bodyPreview && typeof bodyPreview === 'object') {
      for (const k of Object.keys(bodyPreview)) {
        // Avoid logging massive fields
        bodyPreview[k] = truncate(bodyPreview[k]);
      }
    }

    log(`API REQ ${method} ${path} ct=${contentType || 'n/a'} accept=${accept || 'n/a'} len=${contentLength || 'n/a'} :: ${JSON.stringify(bodyPreview || {})}`);
  } catch {}
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/** ALLOW_IFRAME_FROM_REPLIT (only on Replit) **/
if (process.env.REPL_SLUG) {
  app.use((req: any, res: any, next: any) => {
    try {
      // Only modify headers if they haven't been sent yet
      if (!res.headersSent) {
        // Remove headers that block embedding
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Cross-Origin-Opener-Policy');
        res.removeHeader('Cross-Origin-Embedder-Policy');

        // Ensure CSP allows Replit to embed this app in an iframe
        const fa = "frame-ancestors 'self' https://replit.com https://*.replit.com https://*.replit.dev https://*.replit.app";
        const current = res.getHeader('Content-Security-Policy');
        if (!current) {
          res.setHeader('Content-Security-Policy', fa);
        } else {
          const value = Array.isArray(current) ? current.join('; ') : String(current);
          const re = /frame-ancestors[^;]*/i;
          const newVal = re.test(value) ? value.replace(re, fa) : (value ? value + '; ' + fa : fa);
          res.setHeader('Content-Security-Policy', newVal);
        }
      }
    } catch {}
    next();
  });
}
/** END ALLOW_IFRAME_FROM_REPLIT **/

(async () => {
  try {
    logger.info("Starting server setup...");

    // Log Replit environment info
    if (process.env.REPL_SLUG) {
      logger.info('Running on Replit', {
        slug: process.env.REPL_SLUG,
        owner: process.env.REPL_OWNER
      });
    }

    // Add environment validation and session secret generation
    const requiredEnvVars = ['DATABASE_URL'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingEnvVars.length > 0) {
      logger.error('Missing required environment variables', { missing: missingEnvVars });
      process.exit(1);
    }

    if (!process.env.SESSION_SECRET) {
      process.env.SESSION_SECRET = randomBytes(32).toString('hex');
      logger.warn('Generated temporary session secret');
    }

    // Test database connection
    try {
      const { db } = await import('./db');
      // Use a simple raw SQL query to test connection
      await db.execute('SELECT 1');
      logger.info('Database connection successful');
    } catch (error) {
      logger.error('Database connection failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      process.exit(1);
    }

    // Enhanced health check with Railway-specific optimizations
    app.get("/health", async (req: any, res: any) => {
      try {
        // Add Railway-specific headers BEFORE calling healthCheck
        if (process.env.RAILWAY_SERVICE_ID && !res.headersSent) {
          res.set('X-Railway-Service-ID', process.env.RAILWAY_SERVICE_ID);
          res.set('X-Railway-Environment', process.env.RAILWAY_ENVIRONMENT || 'production');
        }

        // Extended timeout for Railway health checks
        await Promise.race([
          healthCheck(req, res),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), 25000)
          )
        ]);

        // Don't return anything - healthCheck already sent the response
      } catch (error) {
        logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        if (!res.headersSent) {
          res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            error: 'Health check failed'
          });
        }
      }
    });

    app.get("/metrics", (req: any, res: any) => {
      try {
        const metrics = metricsCollector.getMetrics();
        // Add Railway-specific metadata
        metrics.railway = {
          serviceId: process.env.RAILWAY_SERVICE_ID,
          environment: process.env.RAILWAY_ENVIRONMENT,
          region: process.env.RAILWAY_REGION,
          projectId: process.env.RAILWAY_PROJECT_ID
        };
        res.json(metrics);
      } catch (error) {
        logger.error('Metrics endpoint failed', { error });
        res.status(500).json({ error: 'Failed to fetch metrics' });
      }
    });

    // Performance monitoring endpoints
    app.get("/api/performance/stats", (req: any, res: any) => {
      try {
        const storageMetrics = storage.getPerformanceMetrics();
        const cacheStats = apiCache.getStats();
        const memUsage = process.memoryUsage();

        res.json({
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: {
            heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
            heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
            external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
            rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`
          },
          storage: storageMetrics,
          cache: cacheStats,
          database: {
            connected: true // We'll add more detailed DB stats later
          }
        });
      } catch (error) {
        logger.error('Error fetching performance stats', { error });
        res.status(500).json({ error: 'Failed to fetch performance stats' });
      }
    });

    app.post("/api/performance/clear-cache", (req: any, res: any) => {
      try {
        const { pattern } = req.body;
        if (pattern) {
          storage.clearCache(pattern);
          apiCache.invalidate(pattern);
          res.json({ message: `Cache cleared for pattern: ${pattern}` });
        } else {
          storage.clearCache();
          apiCache.clear();
          res.json({ message: 'All caches cleared' });
        }
      } catch (error) {
        logger.error('Error clearing cache', { error });
        res.status(500).json({ error: 'Failed to clear cache' });
      }
    });

    app.post("/api/performance/warm-cache", async (req: any, res: any) => {
      try {
        await storage.warmCache();
        res.json({ message: 'Cache warming completed' });
      } catch (error) {
        logger.error('Error warming cache', { error });
        res.status(500).json({ error: 'Failed to warm cache' });
      }
    });

    logger.info("Health check and performance endpoints configured");

    await registerRoutes(app);
    logger.info("Routes registered successfully");

    // Use static file serving (frontend is already built) - MUST be before error handler
    serveStatic(app);
    logger.info("Static file serving configured");

    // Enhanced error handling middleware (must be last)
    app.use(performanceErrorHandler);

    const server = createServer(app);
    logger.info("HTTP server created");

    // Initialize database safely in production
    async function initializeDatabase() {
      try {
        // Test database connection with a simple raw SQL query
        const { db } = await import('./db');
        await db.execute('SELECT 1');
        logger.info("Database connection successful");
      } catch (error) {
        logger.error("Database connection failed", { error: error instanceof Error ? error.message : 'Unknown error' });
        // In production, we don't want to fail startup if DB is temporarily unavailable
        if (process.env.NODE_ENV === 'production') {
          logger.warn("Continuing startup despite database connection failure (production mode)");
        } else {
          throw error;
        }
      }
    }

    // Initialize database before starting server
    await initializeDatabase();

    // ALWAYS serve app on port specified in environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const PORT = parseInt(process.env.PORT || '5000', 10);
    const HOST = '0.0.0.0';
    logger.info(`About to listen on port ${PORT}...`);
    server.listen(PORT, HOST, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      });
    });

    // Graceful shutdown handling
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error("Error during server startup", { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
})().catch(error => {
  logger.error("Unhandled error in server startup", { error: error instanceof Error ? error.message : 'Unknown error' });
  process.exit(1);
});