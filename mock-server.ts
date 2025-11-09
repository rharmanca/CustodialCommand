/**
 * Mock Development Server for Mobile PWA Testing
 * This server provides mock responses for testing mobile functionality
 * without requiring a full database setup
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Mock data
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

app.get('/api/inspections/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const inspection = mockInspections.find(i => i.id === id);

    if (inspection) {
        res.json(inspection);
    } else {
        res.status(404).json({ error: 'Inspection not found' });
    }
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

// Mock rating criteria
app.get('/api/rating-criteria', (req, res) => {
    res.json([
        {
            id: 1,
            name: 'Floors',
            description: 'Cleanliness of floor surfaces',
            weight: 10
        },
        {
            id: 2,
            name: 'Surfaces',
            description: 'Cleanliness of horizontal and vertical surfaces',
            weight: 10
        }
        // ... more criteria
    ]);
});

// Mock schools data
app.get('/api/schools', (req, res) => {
    res.json([
        { id: 1, name: 'ASA' },
        { id: 2, name: 'LCA' },
        { id: 3, name: 'GWC' },
        { id: 4, name: 'OA' },
        { id: 5, name: 'CBR' },
        { id: 6, name: 'WLC' }
    ]);
});

// Mock monthly feedback
app.get('/api/monthly-feedback', (req, res) => {
    res.json({
        summary: {
            totalInspections: 25,
            averageScore: 4.2,
            issuesFound: 3,
            complianceRate: 92
        },
        data: [
            {
                school: 'ASA',
                date: new Date().toISOString().split('T')[0],
                score: 4.5,
                issues: []
            }
        ]
    });
});

// Mock admin data
app.get('/api/admin/inspections', (req, res) => {
    res.json({
        inspections: mockInspections,
        summary: {
            total: mockInspections.length,
            thisMonth: 5,
            averageScore: 4.2
        }
    });
});

// Handle file uploads (mock)
app.post('/api/upload', (req, res) => {
    res.json({
        success: true,
        message: 'File uploaded successfully (mock)',
        file: {
            id: Date.now(),
            name: 'mock-image.jpg',
            url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A'
        }
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
    '/manifest.json',
    '/index.html'
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
                // Return cached version or fetch from network
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
        res.status(404).send('Application not built. Please run npm run build first.');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Mock development server running on port ${PORT}`);
    console.log(`📱 Mobile PWA testing ready at http://localhost:${PORT}`);
    console.log(`🔧 Mock API endpoints available for testing`);
});

export default app;