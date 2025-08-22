import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

export const log = console.log;

export async function setupVite(app: express.Application, server: any) {
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  // Use vite's connect instance as middleware
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
}

export function serveStatic(app: express.Application) {
  const distPath = path.join(process.cwd(), "dist/public");
  app.use(express.static(distPath));
  
  // Handle client-side routing
  // Handle client-side routing (excluding health endpoints)
  app.get("*", (req, res, next) => {
    // Skip health check endpoints
    if (req.path === "/" || req.path === "/health" || req.path === "/metrics") {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}