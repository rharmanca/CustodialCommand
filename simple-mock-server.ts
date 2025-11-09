/**
 * Simple Mock Development Server for Mobile PWA Testing
 * Provides basic endpoints without requiring database setup
 */

import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Basic mock data
const mockInspections = [
    {
        id: 1,
        school: 'Test School',
        date: new Date().toISOString().split('T')[0],
        inspectionType: 'single_room',
        locationDescription: 'Test Room 101',
        floors: 4,
        verticalHorizontalSurfaces: 3,
        ceiling: 4,
        restrooms: 3,
        customerSatisfaction: 4,
        trash: 4,
        projectCleaning: 3,
        activitySupport: 4,
        safetyCompliance: 5,
        equipment: 4,
        monitoring: 4,
        notes: 'Test inspection notes',
        createdAt: new Date().toISOString()
    }
];

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: 'development-mock'
    });
});

// Mock inspection endpoints
app.get('/api/inspections', (req, res) => {
    res.json(mockInspections);
});

app.post('/api/inspections', (req, res) => {
    const newInspection = {
        id: mockInspections.length + 1,
        ...req.body,
        createdAt: new Date().toISOString()
    };
    mockInspections.push(newInspection);

    res.json({
        success: true,
        inspection: newInspection,
        message: 'Inspection created successfully (mock)'
    });
});

// Mock custodial notes endpoints
app.get('/api/custodial-notes', (req, res) => {
    res.json([
        {
            id: 1,
            school: 'Test School',
            date: new Date().toISOString().split('T')[0],
            location: 'Test Location',
            notes: 'Test custodial notes',
            createdAt: new Date().toISOString()
        }
    ]);
});

app.post('/api/custodial-notes', (req, res) => {
    res.json({
        success: true,
        message: 'Custodial note created successfully (mock)',
        id: Date.now()
    });
});

// PWA manifest endpoint
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "Custodial Command",
        "short_name": "Custodial",
        "description": "Mobile custodial inspection and management system",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#3b82f6",
        "orientation": "portrait",
        "icons": [
            {
                "src": "/icon-192x192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "/icon-512x512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    });
});

// Service worker endpoint
app.get('/sw.js', (req, res) => {
    const swContent = `
// Mock Service Worker for Mobile PWA Testing
const CACHE_NAME = 'custodial-command-v1';
const urlsToCache = [
    '/',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
`;
    res.setHeader('Content-Type', 'application/javascript');
    res.send(swContent);
});

// Catch-all handler to serve index.html for SPA routing
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <h1>Custodial Command - Mobile PWA Testing</h1>
            <p>Application not built. Please run npm run build first.</p>
            <p>Current status: Mock server running for mobile testing</p>
            <p>API endpoints available:</p>
            <ul>
                <li>GET /health</li>
                <li>GET /api/inspections</li>
                <li>POST /api/inspections</li>
                <li>GET /api/custodial-notes</li>
                <li>POST /api/custodial-notes</li>
                <li>GET /manifest.json</li>
                <li>GET /sw.js</li>
            </ul>
        `);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Mock development server running on port ${PORT}`);
    console.log(`📱 Mobile PWA testing ready at http://localhost:${PORT}`);
    console.log(`🔧 Mock API endpoints available for testing`);
});

export default app;