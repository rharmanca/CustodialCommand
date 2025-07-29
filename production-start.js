#!/usr/bin/env node

// Production server for Replit Cloud Run deployment
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static file serving
const publicPath = path.join(__dirname, 'server', 'public');
const clientDistPath = path.join(__dirname, 'client', 'dist');

// Use client/dist if server/public doesn't exist
let staticPath = publicPath;
if (!fs.existsSync(publicPath) && fs.existsSync(clientDistPath)) {
  staticPath = clientDistPath;
}

console.log(`Serving static files from: ${staticPath}`);
app.use(express.static(staticPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

const port = parseInt(process.env.PORT || '5000', 10);

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Production server running on port ${port}`);
  console.log(`📁 Static files served from: ${staticPath}`);
  console.log(`🌐 Server bound to 0.0.0.0:${port}`);
});