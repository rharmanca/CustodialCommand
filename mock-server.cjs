/**
 * Simple Mock Server for Export Testing (CommonJS)
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Comprehensive mock data
const mockInspections = [
  {
    id: 1,
    school: 'Lincoln Elementary School',
    date: '2025-01-15',
    inspectionType: 'single_room',
    roomNumber: 'Room 101',
    buildingName: 'Main Building',
    locationDescription: 'First floor classroom near main entrance',
    inspectorName: 'John Smith',
    floors: 1,
    verticalHorizontalSurfaces: 2,
    ceiling: 1,
    restrooms: 1,
    customerSatisfaction: 1,
    trash: 2,
    projectCleaning: 1,
    activitySupport: 2,
    safetyCompliance: 1,
    equipment: 1,
    monitoring: 1,
    notes: 'Severe cleaning issues found. Floors have spills, walls have marks, restroom needs deep cleaning.',
    createdAt: '2025-01-15T10:30:00Z'
  },
  {
    id: 2,
    school: 'Washington Middle School',
    date: '2025-01-16',
    inspectionType: 'single_room',
    roomNumber: 'Room 205',
    buildingName: 'North Wing',
    locationDescription: 'Second floor science laboratory',
    inspectorName: 'Sarah Johnson',
    floors: 1,
    verticalHorizontalSurfaces: 1,
    ceiling: 2,
    restrooms: 1,
    customerSatisfaction: 2,
    trash: 1,
    projectCleaning: 1,
    activitySupport: 1,
    safetyCompliance: 2,
    equipment: 1,
    monitoring: 1,
    notes: 'Chemical spills on floors, equipment not properly sanitized, safety concerns.',
    createdAt: '2025-01-16T14:15:00Z'
  },
  {
    id: 3,
    school: 'Lincoln Elementary School',
    date: '2025-01-17',
    inspectionType: 'single_room',
    roomNumber: 'Cafeteria',
    buildingName: 'Main Building',
    locationDescription: 'Ground floor cafeteria area',
    inspectorName: 'Mike Davis',
    floors: 3,
    verticalHorizontalSurfaces: 3,
    ceiling: 4,
    restrooms: 2,
    customerSatisfaction: 3,
    trash: 2,
    projectCleaning: 3,
    activitySupport: 3,
    safetyCompliance: 3,
    equipment: 3,
    monitoring: 3,
    notes: 'General cleaning needs improvement. Tables sticky, floors need mopping.',
    createdAt: '2025-01-17T11:45:00Z'
  },
  {
    id: 4,
    school: 'Jefferson High School',
    date: '2025-01-18',
    inspectionType: 'whole_building',
    roomNumber: '',
    buildingName: 'Athletics Building',
    locationDescription: 'Gymnasium and locker rooms',
    inspectorName: 'Emily Wilson',
    floors: 2,
    verticalHorizontalSurfaces: 3,
    ceiling: 3,
    restrooms: 2,
    customerSatisfaction: 2,
    trash: 3,
    projectCleaning: 2,
    activitySupport: 3,
    safetyCompliance: 3,
    equipment: 2,
    monitoring: 3,
    notes: 'Locker rooms need attention, gym floor has scuff marks, general wear and tear.',
    createdAt: '2025-01-18T09:20:00Z'
  },
  {
    id: 5,
    school: 'Roosevelt Elementary',
    date: '2025-01-19',
    inspectionType: 'single_room',
    roomNumber: 'Library',
    buildingName: 'Main Building',
    locationDescription: 'Second floor library',
    inspectorName: 'Lisa Anderson',
    floors: 4,
    verticalHorizontalSurfaces: 4,
    ceiling: 4,
    restrooms: 4,
    customerSatisfaction: 5,
    trash: 4,
    projectCleaning: 4,
    activitySupport: 4,
    safetyCompliance: 5,
    equipment: 4,
    monitoring: 4,
    notes: 'Excellent condition. Well maintained, clean and organized.',
    createdAt: '2025-01-19T13:30:00Z'
  },
  {
    id: 6,
    school: 'Madison Middle School',
    date: '2025-01-20',
    inspectionType: 'whole_building',
    roomNumber: '',
    buildingName: 'Arts Building',
    locationDescription: 'Music rooms and art studios',
    inspectorName: 'David Brown',
    floors: 4,
    verticalHorizontalSurfaces: 4,
    ceiling: 4,
    restrooms: 4,
    customerSatisfaction: 4,
    trash: 4,
    projectCleaning: 4,
    activitySupport: 4,
    safetyCompliance: 4,
    equipment: 4,
    monitoring: 4,
    notes: 'Good overall condition. Some minor dust in art rooms, generally well maintained.',
    createdAt: '2025-01-20T10:15:00Z'
  }
];

const mockCustodialNotes = [
  {
    id: 1,
    school: 'Lincoln Elementary School',
    date: '2025-01-15',
    location: 'Main Building - Room 101',
    notes: 'URGENT: Broken water pipe causing flooding. Need immediate maintenance attention. Water damage to floors and walls.',
    createdAt: '2025-01-15T10:30:00Z'
  },
  {
    id: 2,
    school: 'Washington Middle School',
    date: '2025-01-16',
    location: 'North Wing - Science Lab 205',
    notes: 'HIGH PRIORITY: Chemical spill in laboratory. Need professional cleanup and safety equipment failure.',
    createdAt: '2025-01-16T14:15:00Z'
  },
  {
    id: 3,
    school: 'Jefferson High School',
    date: '2025-01-17',
    location: 'Athletics Building - Gymnasium',
    notes: 'URGENT: HVAC system failure, no heat in gym. Temperature dropping, affecting student activities.',
    createdAt: '2025-01-17T09:00:00Z'
  },
  {
    id: 4,
    school: 'Roosevelt Elementary',
    date: '2025-01-18',
    location: 'Main Building - Library',
    notes: 'Request: Need additional trash cans in study areas. Current ones overflowing during peak hours.',
    createdAt: '2025-01-18T11:30:00Z'
  },
  {
    id: 5,
    school: 'Madison Middle School',
    date: '2025-01-19',
    location: 'Arts Building - Music Room',
    notes: 'Note: Piano needs tuning and deep cleaning. Dust accumulation on musical equipment.',
    createdAt: '2025-01-19T15:45:00Z'
  }
];

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
app.use(express.static(path.join(process.cwd(), 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: 'development-mock',
        features: {
            excel_export: true,
            pdf_export: true,
            csv_export: true,
            data_filtering: true,
            mobile_reports: true
        },
        testData: {
            inspections: mockInspections.length,
            notes: mockCustodialNotes.length
        }
    });
});

// Mock inspection endpoints
app.get('/api/inspections', (req, res) => {
    const { school, problemsOnly } = req.query;
    let filteredInspections = [...mockInspections];

    if (school) {
        filteredInspections = filteredInspections.filter(i => i.school === school);
    }

    if (problemsOnly === 'true') {
        filteredInspections = filteredInspections.filter(inspection => {
            const categories = ['floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms'];
            const ratings = categories.map(cat => inspection[cat]).filter(r => r !== null);
            const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 5;
            return avgRating < 3.0;
        });
    }

    res.json(filteredInspections);
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
    const { school, urgent } = req.query;
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

    res.json(filteredNotes);
});

app.post('/api/custodial-notes', (req, res) => {
    res.json({
        success: true,
        message: 'Custodial note created successfully (mock)',
        id: Date.now()
    });
});

// Large dataset endpoint for performance testing
app.get('/api/inspections/large-dataset', (req, res) => {
    const size = parseInt(req.query.size) || 1000;
    const schools = ['Lincoln Elementary School', 'Washington Middle School', 'Jefferson High School', 'Roosevelt Elementary', 'Madison Middle School'];
    const buildings = ['Main Building', 'North Wing', 'Athletics Building', 'Arts Building', 'Science Wing'];
    const inspectors = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Wilson', 'Lisa Anderson', 'David Brown'];

    const largeDataset = Array.from({ length: size }, (_, i) => ({
        id: i + 1,
        school: schools[i % schools.length],
        date: new Date(2025, 0, 1 + (i % 365)).toISOString().split('T')[0],
        inspectionType: i % 4 === 0 ? 'whole_building' : 'single_room',
        roomNumber: i % 4 === 0 ? '' : `Room ${100 + (i % 500)}`,
        buildingName: buildings[i % buildings.length],
        locationDescription: `Test location ${i + 1} for performance testing`,
        inspectorName: inspectors[i % inspectors.length],
        floors: Math.floor(Math.random() * 5) + 1,
        verticalHorizontalSurfaces: Math.floor(Math.random() * 5) + 1,
        ceiling: Math.floor(Math.random() * 5) + 1,
        restrooms: Math.floor(Math.random() * 5) + 1,
        customerSatisfaction: Math.floor(Math.random() * 5) + 1,
        trash: Math.floor(Math.random() * 5) + 1,
        projectCleaning: Math.floor(Math.random() * 5) + 1,
        activitySupport: Math.floor(Math.random() * 5) + 1,
        safetyCompliance: Math.floor(Math.random() * 5) + 1,
        equipment: Math.floor(Math.random() * 5) + 1,
        monitoring: Math.floor(Math.random() * 5) + 1,
        notes: `Performance test inspection ${i + 1}. Random data for testing large datasets and export performance.`,
        createdAt: new Date(2025, 0, 1 + (i % 365)).toISOString()
    }));

    res.json({
        data: largeDataset,
        total: largeDataset.length,
        message: `Generated dataset with ${size} records for performance testing`
    });
});

// Export statistics endpoint
app.get('/api/export/stats', (req, res) => {
    const criticalIssues = mockInspections.filter(inspection => {
        const categories = ['floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms'];
        const ratings = categories.map(cat => inspection[cat]).filter(r => r !== null);
        const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 5;
        return avgRating < 2.0;
    });

    const needsAttention = mockInspections.filter(inspection => {
        const categories = ['floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms'];
        const ratings = categories.map(cat => inspection[cat]).filter(r => r !== null);
        const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 5;
        return avgRating >= 2.0 && avgRating < 3.0;
    });

    const urgentNotes = mockCustodialNotes.filter(n =>
        n.notes.toLowerCase().includes('urgent') ||
        n.notes.toLowerCase().includes('high priority')
    );

    res.json({
        totalInspections: mockInspections.length,
        totalNotes: mockCustodialNotes.length,
        criticalIssues: criticalIssues.length,
        needsAttention: needsAttention.length,
        urgentNotes: urgentNotes.length,
        schools: [...new Set(mockInspections.map(i => i.school))].length,
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
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <h1>🚀 Custodial Command - Export Testing Environment</h1>
            <p>Application not built. Please run npm run build first.</p>
            <p>Current status: Mock server running for export functionality testing</p>
            <h2>📊 Available API Endpoints:</h2>
            <ul>
                <li><strong>GET /health</strong> - Server health and features</li>
                <li><strong>GET /api/inspections</strong> - All inspections (supports filtering)</li>
                <li><strong>GET /api/inspections/large-dataset?size=1000</strong> - Large dataset for performance testing</li>
                <li><strong>GET /api/custodial-notes</strong> - All custodial notes (supports filtering)</li>
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
    console.log(`🚀 Mock development server running on port ${PORT}`);
    console.log(`📱 Mobile PWA testing ready at http://localhost:${PORT}`);
    console.log(`📊 Export functionality testing enabled`);
    console.log(`🧪 Test data: ${mockInspections.length} inspections, ${mockCustodialNotes.length} custodial notes`);
    console.log(`🔧 Enhanced API endpoints available for comprehensive testing`);
});

module.exports = app;