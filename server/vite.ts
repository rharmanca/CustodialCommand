import express from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
import { readFile } from "fs/promises";
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

  if (!require('fs').existsSync(distPath)) {
    log.error('Build directory not found. Run "npm run build" first.');
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api") || req.path === "/health" || req.path === "/metrics") {
        return res.status(500).json({ error: "Application not built" });
      }
      res.status(500).send('<h1>Run "npm run build" first</h1>');
    });
    return;
  }

  app.use(express.static(distPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health" || req.path === "/metrics") {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}