import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import helmet from "helmet";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders, validateRequest, apiRateLimit, sanitizeInput } from "./security";
import { logger, requestIdMiddleware } from "./logger";
import { performanceMonitor, healthCheck, errorHandler, metricsMiddleware, metricsCollector } from "./monitoring";


const app = express();

// Request tracking and logging
app.use(requestIdMiddleware);
app.use(performanceMonitor);
app.use(metricsMiddleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline styles for development
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(securityHeaders);
app.use(validateRequest);
app.use(sanitizeInput);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Apply rate limiting to API routes
app.use('/api', apiRateLimit);

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
      const { randomBytes } = await import('crypto');
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
        version: process.env.npm_package_version || '1.0.0'
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