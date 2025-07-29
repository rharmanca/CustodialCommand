// Simple production start script for deployment
import { createServer } from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Import and register API routes
import { registerRoutes } from './server/routes.js';

async function startServer() {
  try {
    // Register API routes
    const server = await registerRoutes(app);

    // Serve static files from server/public in production
    const publicPath = path.join(__dirname, 'server', 'public');
    app.use(express.static(publicPath));

    // Catch-all handler for SPA
    app.use('*', (req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error('Error:', err);
    });

    const port = parseInt(process.env.PORT || '5000', 10);
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`✅ Production server running on port ${port}`);
    });

    server.on('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();