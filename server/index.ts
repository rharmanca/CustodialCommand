// Environment variables are loaded by Railway automatically
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { randomBytes } from "crypto";
import helmet from "helmet";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders, validateRequest, apiRateLimit, sanitizeInput } from "./security";
import { logger, requestIdMiddleware } from "./logger";
import { performanceMonitor, healthCheck, errorHandler, metricsMiddleware, metricsCollector } from "./monitoring";


const app = express();

// Core middleware configuration - MUST be before routes
// Configure trust proxy for Replit environment (but not for rate limiting)
if (process.env.REPL_SLUG) {
  app.set('trust proxy', 1); // Trust first proxy only on Replit
} else {
  app.set('trust proxy', false); // Disable in other environments
}
app.use(requestIdMiddleware);
app.use(performanceMonitor);
app.use(metricsMiddleware);
app.use(helmet({


  contentSecurityPolicy: false, // Allow inline styles for development
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(securityHeaders);
app.use(validateRequest);
app.use(sanitizeInput);

// Body parsing middleware - CRITICAL: Must be before routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Apply rate limiting to API routes
app.use('/api', apiRateLimit);

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

    await registerRoutes(app);
    logger.info("Routes registered successfully");

    const server = createServer(app);
    logger.info("HTTP server created");

    // Health check and monitoring endpoints (MUST be before static serving)
    app.get("/health", healthCheck);
    app.get("/metrics", (req: any, res: any) => {
      res.json(metricsCollector.getMetrics());
    });
    logger.info("Health check endpoints configured");

    // Use static file serving (frontend is already built)
    serveStatic(app);
    logger.info("Static file serving configured");

    // JSON error handler for API routes
    app.use('/api', (err: any, req: any, res: any, next: any) => {
      console.error('API Error:', err);
      const statusCode = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      
      // Always return JSON for API routes
      res.status(statusCode).json({ 
        error: message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    });

    // Add final error handler
    app.use(errorHandler);

    // ALWAYS serve the app on the port specified in the environment variable PORT
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
/** ALLOW_IFRAME_FROM_REPLIT **/
app.use((req: any, res: any, next: any) => {
  try {
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
  } catch {}
  next();
});
/** END ALLOW_IFRAME_FROM_REPLIT **/
