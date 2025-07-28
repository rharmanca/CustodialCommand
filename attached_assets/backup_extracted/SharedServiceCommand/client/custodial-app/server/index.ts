import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import routes from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = join(__dirname, '../dist/public');
  app.use(express.static(staticPath));
  
  app.get('*', (req, res) => {
    res.sendFile(join(staticPath, 'index.html'));
  });
} else {
  // Development mode - serve Vite dev server
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: join(__dirname, '../client')
  });
  
  app.use(vite.ssrFixStacktrace);
  app.use('/', vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[express] serving on port ${PORT}`);
});