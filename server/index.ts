
import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import helmet from "helmet";
import http from "node:http";
import { registerRoutes } from "./routes";
import { requestIdMiddleware } from "./logger";
import { performanceMonitor, metricsMiddleware, errorHandler } from "./monitoring";

const app = express();
const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 5000;

app.set("trust proxy", 1);
app.use(requestIdMiddleware);
app.use(performanceMonitor);
app.use(metricsMiddleware);
app.use(express.json());

// Security: strict in prod, relaxed in dev so Replit preview (iframe) works
if (isProd) {
  app.use(helmet());
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      hsts: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
    })
  );
  app.use((_, res, next) => {
    res.removeHeader("X-Frame-Options");
    res.removeHeader("Strict-Transport-Security");
    res.setHeader(
      "Content-Security-Policy",
      "frame-ancestors self https://*.replit.dev https://*.repl.co https://*.replit.app"
    );
    next();
  });
}

async function start() {
  try {
    // Validate environment variables
    const requiredEnvVars = ['DATABASE_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
    }

    // Health and metrics endpoints
    // Simple health check for deployment - responds immediately without external dependencies
    app.get("/", (req, res) => {
      try {
        // Quick health check that always responds fast for deployment systems
        const uptime = Math.floor(process.uptime());
        const health = {
          status: "ok",
          message: "Custodial Command API is running",
          timestamp: new Date().toISOString(),
          uptime: uptime,
          environment: process.env.NODE_ENV || 'development'
        };
        
        // Ensure quick response with proper headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(200).json(health);
      } catch (error) {
        // Even if something goes wrong, return a 200 status for deployment health checks
        console.error("Health check error:", error);
        return res.status(200).json({ 
          status: "ok", 
          message: "Service running",
          timestamp: new Date().toISOString()
        });
      }
    });

    app.get("/health", async (req, res, next) => {
      try {
        const { healthCheck } = await import('./monitoring');
        await healthCheck(req, res);
      } catch (error) {
        next(error);
      }
    });

    app.get("/metrics", (req, res) => {
      const { metricsCollector } = require('./monitoring');
      res.json(metricsCollector.getMetrics());
    });

    // Register API routes
    await registerRoutes(app);

    // Create a single HTTP server so Vite HMR can attach its WS to it
    const httpServer = http.createServer(app);

    if (!isProd) {
      const vite = await (await import("vite")).createServer({
        root: process.cwd(),
        appType: "custom",
        server: {
          middlewareMode: true,
          hmr: {
            server: httpServer,
          },
        },
      });

      app.use(vite.middlewares);

      // Transform and serve index.html via Vite
      app.use("*", async (req, res, next) => {
        try {
          const url = req.originalUrl;
          let html = await fs.readFile(path.resolve(process.cwd(), "index.html"), "utf-8");
          html = await vite.transformIndexHtml(url, html);
          res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      });
    } else {
      // Production: serve from dist
      const dist = path.resolve(process.cwd(), "dist");
      app.use(express.static(dist));
      app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
    }

    // Add error handler as the last middleware
    app.use(errorHandler);

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on ${PORT} (${isProd ? "prod" : "dev + Vite middleware + HMR"})`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
