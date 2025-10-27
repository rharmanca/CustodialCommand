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
  app.use(express.static(staticPath));
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req, res, next) => {
    // Skip API routes and uploads
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/uploads')) {
      return next();
    }
    
    const indexPath = path.join(staticPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        logger.error('Error serving index.html:', err);
        res.status(500).send('Server Error');
      }
    });
  });
  
  logger.info(`Serving static files from: ${staticPath}`);
}

export function log(message: string, type: 'info' | 'error' | 'warn' = 'info') {
  logger[type](message);
}
