/**
 * Enhanced Mock Development Server for Export Functionality Testing
 * Provides comprehensive data and API endpoints for testing all export features
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { mockInspections, mockCustodialNotes, createTestDataset } from './mock-data-for-testing';

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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: 'development-enhanced-mock',
        features: {
            excel_export: true,
            pdf_export: true,
            csv_export: true,
            data_filtering: true,
            large_datasets: true,
            mobile_reports: true
        }
    });
});

// Enhanced mock inspection endpoints
app.get('/api/inspections', (req, res) => {
    const { school, date, limit, offset, problemsOnly } = req.query;
    let filteredInspections = [...mockInspections];

    // Apply filters for testing
    if (school) {
        filteredInspections = filteredInspections.filter(i => i.school === school);
    }

    if (date) {
        filteredInspections = filteredInspections.filter(i => i.date === date);
    }

    if (problemsOnly === 'true') {
        filteredInspections = filteredInspections.filter(inspection => {
            const categories = ['floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms'];
            const ratings = categories.map(cat => inspection[cat as keyof typeof inspection] as number).filter(r => r !== null);
            const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 5;
            return avgRating < 3.0;
        });
    }

    // Apply pagination
    const limitNum = parseInt(limit as string) || filteredInspections.length;
    const offsetNum = parseInt(offset as string) || 0;
    const paginatedInspections = filteredInspections.slice(offsetNum, offsetNum + limitNum);

    res.json({
        data: paginatedInspections,
        total: filteredInspections.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < filteredInspections.length
    });
});

// Large dataset endpoint for performance testing
app.get('/api/inspections/large-dataset', (req, res) => {
    const size = parseInt(req.query.size as string) || 1000;
    const dataset = createTestDataset(size);

    res.json({
        data: dataset,
        total: dataset.length,
        message: `Generated dataset with ${size} records for performance testing`
    });
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

// Enhanced custodial notes endpoints
app.get('/api/custodial-notes', (req, res) => {
    const { school, urgent, limit, offset } = req.query;
    let filteredNotes = [...mockCustodialNotes];

    if (school) {
        filteredNotes = filteredNotes.filter(n => n.school === school);
    }

    if (urgent === 'true') {
        filteredNotes = filteredNotes.filter(n =>
            n.notes.toLowerCase().includes('urgent') ||
            n.notes.toLowerCase().includes('high priority')
        );
    }

    // Apply pagination
    const limitNum = parseInt(limit as string) || filteredNotes.length;
    const offsetNum = parseInt(offset as string) || 0;
    const paginatedNotes = filteredNotes.slice(offsetNum, offsetNum + limitNum);

    res.json({
        data: paginatedNotes,
        total: filteredNotes.length,
        limit: limitNum,
        offset: offsetNum
    });
});

app.post('/api/custodial-notes', (req, res) => {
    res.json({
        success: true,
        message: 'Custodial note created successfully (mock)',
        id: Date.now()
    });
});

// Export testing endpoints
app.get('/api/export/test-data', (req, res) => {
    const { type, size } = req.query;

    switch (type) {
        case 'critical':
            const criticalIssues = mockInspections.filter(inspection => {
                const categories = ['floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms'];
                const ratings = categories.map(cat => inspection[cat as keyof typeof inspection] as number).filter(r => r !== null);
                const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 5;
                return avgRating < 2.0;
            });
            res.json({ data: criticalIssues, total: criticalIssues.length });
            break;

        case 'needs-attention':
            const needsAttention = mockInspections.filter(inspection => {
                const categories = ['floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms'];
                const ratings = categories.map(cat => inspection[cat as keyof typeof inspection] as number).filter(r => r !== null);
                const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 5;
                return avgRating >= 2.0 && avgRating < 3.0;
            });
            res.json({ data: needsAttention, total: needsAttention.length });
            break;

        case 'large':
            const largeDataset = createTestDataset(parseInt(size as string) || 1000);
            res.json({ data: largeDataset, total: largeDataset.length });
            break;

        default:
            res.json({
                inspections: mockInspections,
                custodialNotes: mockCustodialNotes,
                total: {
                    inspections: mockInspections.length,
                    notes: mockCustodialNotes.length
                }
            });
    }
});

// Export statistics endpoint
app.get('/api/export/stats', (req, res) => {
    const criticalIssues = mockInspections.filter(inspection => {
        const categories = ['floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms'];
        const ratings = categories.map(cat => inspection[cat as keyof typeof inspection] as number).filter(r => r !== null);
        const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 5;
        return avgRating < 2.0;
    });

    const needsAttention = mockInspections.filter(inspection => {
        const categories = ['floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms'];
        const ratings = categories.map(cat => inspection[cat as keyof typeof inspection] as number).filter(r => r !== null);
        const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 5;
        return avgRating >= 2.0 && avgRating < 3.0;
    });

    const urgentNotes = mockCustodialNotes.filter(n =>
        n.notes.toLowerCase().includes('urgent') ||
        n.notes.toLowerCase().includes('high priority')
    );

    const schoolStats = mockInspections.reduce((acc, inspection) => {
        if (!acc[inspection.school]) {
            acc[inspection.school] = { total: 0, inspections: 0 };
        }
        acc[inspection.school].total += 1;
        const categories = ['floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms'];
        const ratings = categories.map(cat => inspection[cat as keyof typeof inspection] as number).filter(r => r !== null);
        const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 5;
        acc[inspection.school].inspections += avgRating;
        return acc;
    }, {} as Record<string, { total: number; inspections: number }>);

    Object.keys(schoolStats).forEach(school => {
        schoolStats[school].inspections = schoolStats[school].inspections / schoolStats[school].total;
    });

    res.json({
        totalInspections: mockInspections.length,
        totalNotes: mockCustodialNotes.length,
        criticalIssues: criticalIssues.length,
        needsAttention: needsAttention.length,
        urgentNotes: urgentNotes.length,
        schools: Object.keys(schoolStats).length,
        schoolPerformance: schoolStats,
        dateRange: {
            earliest: mockInspections[0]?.date,
            latest: mockInspections[mockInspections.length - 1]?.date
        }
    });
});

// PWA manifest endpoint
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "Custodial Command - Export Testing",
        "short_name": "Custodial Test",
        "description": "Mobile custodial inspection and management system with export functionality testing",
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
// Enhanced Service Worker for Export Testing
const CACHE_NAME = 'custodial-command-test-v1';
const urlsToCache = [
    '/',
    '/manifest.json',
    '/api/inspections',
    '/api/custodial-notes'
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
            <h1>🚀 Custodial Command - Export Testing Environment</h1>
            <p>Application not built. Please run npm run build first.</p>
            <p>Current status: Enhanced mock server running for export functionality testing</p>
            <h2>📊 Available API Endpoints:</h2>
            <ul>
                <li><strong>GET /health</strong> - Server health and features</li>
                <li><strong>GET /api/inspections</strong> - All inspections (supports filtering)</li>
                <li><strong>GET /api/inspections/large-dataset?size=1000</strong> - Large dataset for performance testing</li>
                <li><strong>POST /api/inspections</strong> - Create new inspection</li>
                <li><strong>GET /api/custodial-notes</strong> - All custodial notes (supports filtering)</li>
                <li><strong>POST /api/custodial-notes</strong> - Create new custodial note</li>
                <li><strong>GET /api/export/test-data</strong> - Test data for export functionality</li>
                <li><strong>GET /api/export/stats</strong> - Export statistics and metrics</li>
                <li><strong>GET /manifest.json</strong> - PWA manifest</li>
                <li><strong>GET /sw.js</strong> - Service worker</li>
            </ul>
            <h2>🧪 Testing Features:</h2>
            <ul>
                <li>✅ Excel export functionality</li>
                <li>✅ PDF report generation</li>
                <li>✅ CSV export capabilities</li>
                <li>✅ Data filtering and date ranges</li>
                <li>✅ Large dataset performance testing</li>
                <li>✅ Mobile report viewing</li>
                <li>✅ Print functionality</li>
                <li>✅ Problem area analysis</li>
            </ul>
        `);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Enhanced mock development server running on port ${PORT}`);
    console.log(`📱 Mobile PWA testing ready at http://localhost:${PORT}`);
    console.log(`📊 Export functionality testing enabled`);
    console.log(`🧪 Test data: ${mockInspections.length} inspections, ${mockCustodialNotes.length} custodial notes`);
    console.log(`🔧 Enhanced API endpoints available for comprehensive testing`);
});

export default app;