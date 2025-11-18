import * as express from 'express';
import { Express } from 'express';
import * as path from 'path';
import { logger } from './logger';

export function setupVite(app: Express) {
  // In production, we serve static files
  // In development, this could be extended to integrate with Vite dev server
  logger.info('Vite setup completed');
}

export function serveStatic(app: Express) {
  // Serve uploaded files from uploads directory
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  logger.info(`Serving uploads from: ${uploadsPath}`);

  // Serve built static files from dist/public
  const staticPath = path.join(process.cwd(), 'dist', 'public');

  // Add cache control middleware for HTML files to prevent edge CDN caching
  app.use((req, res, next) => {
    if (req.path.endsWith('.html') || req.path === '/') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      logger.debug(`Setting no-cache headers for HTML request: ${req.path}`);
    }
    next();
  });

  // Serve static files with aggressive caching for performance
  app.use(express.static(staticPath, {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      // Don't cache HTML files
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        // Aggressive caching for JS, CSS, images, fonts
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req, res, next) => {
    // Skip API routes, health, uploads and static assets
    if (req.path.startsWith('/api') ||
        req.path.startsWith('/health') ||
        req.path.startsWith('/uploads') ||
        req.path.includes('.')) { // Skip files with extensions (static assets)
      return next();
    }

    const indexPath = path.join(staticPath, 'index.html');

    // Check if headers already sent before setting headers
    if (!res.headersSent) {
      // Set no-cache headers for index.html to prevent edge CDN caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    // Check if headers already sent before sending file
    if (!res.headersSent) {
      res.sendFile(indexPath, (err) => {
        if (err) {
          logger.error('Error serving index.html:', err);
          if (!res.headersSent) {
            res.status(500).send('Server Error');
          }
        }
      });
    } else {
      logger.warn('Headers already sent when trying to serve index.html for path:', req.path);
    }
  });

  logger.info(`Serving static files from: ${staticPath}`);
}

export function log(message: string, type: 'info' | 'error' | 'warn' = 'info') {
  logger[type](message);
}
