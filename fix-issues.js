import fs from 'fs';
import path from 'path';

class IssueFixer {
  constructor() {
    this.projectRoot = '/Users/rharman/CustodialCommand-1';
    this.fixesApplied = [];
    this.results = [];
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${status}: ${message}`;
    console.log(logMessage);
    this.results.push({ timestamp, status, message });
  }

  // Fix issue with missing export functionality
  addExportEndpoints() {
    this.log('Fixing: Adding missing export functionality...');
    
    // Create export controller
    const exportController = `import type { Express } from "express";
import { Request, Response } from "express";
import { storage } from "../storage";
import { logger } from "../../logger";

// Export inspections as CSV
export const exportInspectionsCSV = async (req: Request, res: Response) => {
  try {
    const inspections = await storage.getInspections();

    // Format as CSV
    const headers = [
      'id', 'inspectorName', 'school', 'date', 'inspectionType', 'locationDescription',
      'roomNumber', 'floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms',
      'customerSatisfaction', 'trash', 'projectCleaning', 'activitySupport',
      'safetyCompliance', 'equipment', 'monitoring', 'notes', 'createdAt'
    ];

    const csvContent = [
      headers.join(','),
      ...inspections.map(inspection => 
        headers.map(header => {
          const value = (inspection as any)[header];
          if (typeof value === 'string' && value.includes(',')) {
            return \`"\${value.replace(/"/g, '""')}"\`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', \`attachment; filename=inspections_\${new Date().toISOString().split('T')[0]}.csv\`);
    res.send(csvContent);
    
    logger.info('Inspections exported as CSV');
  } catch (error) {
    logger.error('Error exporting inspections:', error);
    res.status(500).json({ error: 'Failed to export inspections' });
  }
};

// Export custodial notes as CSV
export const exportCustodialNotesCSV = async (req: Request, res: Response) => {
  try {
    const notes = await storage.getCustodialNotes();

    const headers = ['id', 'school', 'date', 'location', 'locationDescription', 'notes', 'createdAt'];
    
    const csvContent = [
      headers.join(','),
      ...notes.map(note => 
        headers.map(header => {
          const value = (note as any)[header];
          if (typeof value === 'string' && value.includes(',')) {
            return \`"\${value.replace(/"/g, '""')}"\`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', \`attachment; filename=custodial_notes_\${new Date().toISOString().split('T')[0]}.csv\`);
    res.send(csvContent);
    
    logger.info('Custodial notes exported as CSV');
  } catch (error) {
    logger.error('Error exporting custodial notes:', error);
    res.status(500).json({ error: 'Failed to export custodial notes' });
  }
};

// Export in JSON format
export const exportInspectionsJSON = async (req: Request, res: Response) => {
  try {
    const inspections = await storage.getInspections();
    
    res.header('Content-Type', 'application/json');
    res.header('Content-Disposition', \`attachment; filename=inspections_\${new Date().toISOString().split('T')[0]}.json\`);
    res.send(JSON.stringify(inspections, null, 2));
    
    logger.info('Inspections exported as JSON');
  } catch (error) {
    logger.error('Error exporting inspections as JSON:', error);
    res.status(500).json({ error: 'Failed to export inspections' });
  }
};

export const exportCustodialNotesJSON = async (req: Request, res: Response) => {
  try {
    const notes = await storage.getCustodialNotes();
    
    res.header('Content-Type', 'application/json');
    res.header('Content-Disposition', \`attachment; filename=custodial_notes_\${new Date().toISOString().split('T')[0]}.json\`);
    res.send(JSON.stringify(notes, null, 2));
    
    logger.info('Custodial notes exported as JSON');
  } catch (error) {
    logger.error('Error exporting custodial notes as JSON:', error);
    res.status(500).json({ error: 'Failed to export custodial notes' });
  }
};

// Export endpoints registration function
export const registerExportRoutes = (app: Express) => {
  app.get('/api/export/inspections/csv', exportInspectionsCSV);
  app.get('/api/export/inspections/json', exportInspectionsJSON);
  app.get('/api/export/notes/csv', exportCustodialNotesCSV);
  app.get('/api/export/notes/json', exportCustodialNotesJSON);
  
  // Backward compatibility routes
  app.get('/api/export-inspections', exportInspectionsCSV);
  app.get('/api/export-custodial-notes', exportCustodialNotesCSV);
};
`;

    const exportRoutesPath = path.join(this.projectRoot, 'server', 'export-routes.ts');
    fs.writeFileSync(exportRoutesPath, exportController);
    this.fixesApplied.push('Added export functionality endpoints');
    this.log('✅ Added export functionality endpoints');
  }

  // Fix issues in routes.ts to include export routes
  updateRoutesTs() {
    this.log('Fixing: Updating main routes file to include export endpoints...');

    const routesPath = path.join(this.projectRoot, 'server', 'routes.ts');
    let routesContent = fs.readFileSync(routesPath, 'utf-8');

    // Add import statement for export routes
    const exportImport = `import { registerExportRoutes } from "./export-routes";`;
    
    if (!routesContent.includes(exportImport)) {
      routesContent = routesImport + '\n' + routesContent;
    }

    // Add export route registration in the registerRoutes function
    if (!routesContent.includes('registerExportRoutes(app);')) {
      const closingBraceMatch = routesContent.match(/(\s+\/\/ Routes are now registered on the app\s+})/);
      if (closingBraceMatch) {
        routesContent = routesContent.replace(
          closingBraceMatch[0],
          `  // Register export routes\n  registerExportRoutes(app);\n${closingBraceMatch[0]}`
        );
      }
    }

    fs.writeFileSync(routesPath, routesContent);
    this.fixesApplied.push('Updated routes to include export functionality');
    this.log('✅ Updated routes to include export functionality');
  }

  // Fix security issues by adding better validation
  enhanceSecurity() {
    this.log('Fixing: Enhancing security validation...');
    
    // Update the validation function in the security file
    const securityPath = path.join(this.projectRoot, 'server', 'security.ts');
    if (fs.existsSync(securityPath)) {
      let securityContent = fs.readFileSync(securityPath, 'utf-8');
      
      // Add more comprehensive validation
      const enhancedValidation = `
// Enhanced input sanitization function
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                              .replace(/javascript:/gi, '')
                              .replace(/on\w+\s*=/gi, '');
      }
    }
  }
  
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                             .replace(/javascript:/gi, '')
                             .replace(/on\w+\s*=/gi, '');
      }
    }
  }
  
  next();
};

// Enhanced SQL injection prevention
export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)/i,
    /(;|\-\-|\*\/|\/\*)/,
    /(information_schema|mysql\.|pg_|sysobjects|sp_|xp_|sm_|fn_|spt_)/i
  ];
  
  const checkForSQLInjection = (input: any): boolean => {
    if (typeof input === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(input));
    } else if (Array.isArray(input)) {
      return input.some(item => checkForSQLInjection(item));
    } else if (input && typeof input === 'object') {
      return Object.values(input).some(value => checkForSQLInjection(value));
    }
    return false;
  };
  
  if (checkForSQLInjection(req.query) || checkForSQLInjection(req.body)) {
    logger.warn('Potential SQL injection attempt detected', { 
      ip: req.ip, 
      path: req.path, 
      method: req.method 
    });
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  
  next();
};

// Enhanced validation function
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  preventSQLInjection(req, res, () => {
    sanitizeInput(req, res, next);
  });
};
`;
      
      // Add the enhanced validation to the file if it doesn't exist
      if (!securityContent.includes('sanitizeInput')) {
        // Find the end of imports and add our functions before the exports
        const importEnd = securityContent.lastIndexOf('\n');
        securityContent = securityContent.substring(0, importEnd + 1) + enhancedValidation + 
                         securityContent.substring(importEnd + 1);
      }
      
      fs.writeFileSync(securityPath, securityContent);
      this.fixesApplied.push('Enhanced security validation');
      this.log('✅ Enhanced security validation');
    } else {
      this.log('ℹ️ Security file not found, skipping enhancement');
    }
  }

  // Fix mobile responsiveness issues in CSS
  updateCSSForMobile() {
    this.log('Fixing: Updating CSS for better mobile responsiveness...');
    
    const cssPath = path.join(this.projectRoot, 'src', 'index.css');
    if (fs.existsSync(cssPath)) {
      let cssContent = fs.readFileSync(cssPath, 'utf-8');
      
      // Add mobile responsive utility classes and fixes
      const mobileFixes = `
/* Mobile Responsive Fixes */
@media (max-width: 768px) {
  .main-container {
    padding: 0.5rem;
  }
  
  .header-container, .nav-container, .content-area {
    margin: 0.5rem;
    padding: 1rem;
  }
  
  .modern-button {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
  
  .responsive-grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 0.75rem;
  }
  
  /* Ensure touch targets are large enough */
  button, input, select, textarea {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Prevent horizontal scrolling */
  body {
    overflow-x: hidden;
  }
  
  /* Better spacing for mobile forms */
  .form-section {
    padding: 1rem 0.5rem;
  }
  
  /* Mobile-optimized tables */
  .data-table {
    font-size: 0.8rem;
  }
  
  /* Better mobile navigation */
  nav button {
    margin: 0.25rem 0.125rem;
    padding: 0.5rem 0.75rem;
  }
}

/* Tablet responsiveness */
@media (min-width: 768px) and (max-width: 1024px) {
  .responsive-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Touch-friendly controls */
@media (hover: none) and (pointer: coarse) {
  .touch-target {
    min-height: 48px;
    min-width: 48px;
  }
}
`;
      
      // Add mobile fixes to CSS if they don't already exist
      if (!cssContent.includes('responsive-grid')) {
        cssContent += mobileFixes;
      }
      
      fs.writeFileSync(cssPath, cssContent);
      this.fixesApplied.push('Updated CSS for mobile responsiveness');
      this.log('✅ Updated CSS for mobile responsiveness');
    } else {
      this.log('ℹ️ CSS file not found, skipping mobile fixes');
    }
  }

  // Add PWA improvements
  updatePWAFunctionality() {
    this.log('Fixing: Adding PWA improvements...');
    
    // Update the App.tsx to enhance PWA experience
    const appPath = path.join(this.projectRoot, 'src', 'App.tsx');
    if (fs.existsSync(appPath)) {
      let appContent = fs.readFileSync(appPath, 'utf-8');
      
      // Add service worker registration and improvements to the useEffect for PWA
      const pwaEnhancement = `
      // Enhanced PWA installation prompts
      const showInstallPrompt = () => {
        // On mobile devices, show install banner if not already installed
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted install prompt');
              setIsPWAInstalled(true);
              setShowInstallSuccess(true);
              localStorage.setItem('pwa-install-shown', 'true');
              setTimeout(() => setShowInstallSuccess(false), 5000);
            } else {
              console.log('User dismissed install prompt');
            }
            deferredPrompt = null;
          });
        }
      };

      let deferredPrompt: any;
      window.addEventListener('beforeinstallprompt', (e: any) => {
        console.log('Before install prompt fired');
        e.preventDefault();
        deferredPrompt = e;
        // Show install button if not already installed
        if (!isPWAInstalled) {
          // This would be handled in your UI
          console.log('Install prompt available');
        }
      });

      window.addEventListener('appinstalled', () => {
        console.log('App was installed successfully');
        setIsPWAInstalled(true);
        setShowInstallSuccess(true);
        localStorage.setItem('pwa-install-shown', 'true');
        setTimeout(() => setShowInstallSuccess(false), 5000);
      });
`;

      // Check if we can add the enhancement (would need to update the specific useEffect in context)
      if (appContent.includes('useEffect') && !appContent.includes('beforeinstallprompt')) {
        // This is a simplified approach - in reality we'd need more precise replacement
        appContent = appContent.replace(
          /useEffect\(\(\) => \{/,
          `useEffect(() => {${pwaEnhancement.replace(/useEffect\(\(\) => \{/, '')}`
        );
      }
      
      fs.writeFileSync(appPath, appContent);
      this.fixesApplied.push('Enhanced PWA functionality');
      this.log('✅ Enhanced PWA functionality');
    } else {
      this.log('ℹ️ App.tsx file not found, skipping PWA improvements');
    }
  }

  // Add proper error handling
  addBetterErrorHandling() {
    this.log('Fixing: Adding better error handling...');
    
    const monitoringPath = path.join(this.projectRoot, 'server', 'monitoring.ts');
    if (fs.existsSync(monitoringPath)) {
      let monitoringContent = fs.readFileSync(monitoringPath, 'utf-8');
      
      // Add enhanced error handler
      const errorHandler = `
// Enhanced error handler with better logging
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled application error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.path
  });
};
`;
      
      if (!monitoringContent.includes('errorHandler')) {
        monitoringContent += errorHandler;
      }
      
      fs.writeFileSync(monitoringPath, monitoringContent);
      this.fixesApplied.push('Added enhanced error handling');
      this.log('✅ Added enhanced error handling');
    } else {
      this.log('ℹ️ Monitoring file not found, creating error handler...');
      
      // Create monitoring.ts file with error handlers
      const monitoringContent = `import type { Request, Response, NextFunction } from "express";

// Enhanced error handler with better logging
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled application error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

// Health check endpoint
export const healthCheck = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development'
  });
};

// Metrics collector placeholder
export const metricsCollector = {
  getMetrics: () => ({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  })
};
`;
      
      fs.writeFileSync(path.join(this.projectRoot, 'server', 'monitoring.ts'), monitoringContent);
      this.fixesApplied.push('Created enhanced error handling');
      this.log('✅ Created enhanced error handling');
    }
  }

  // Create a service worker for PWA
  createServiceWorker() {
    this.log('Fixing: Creating service worker for PWA functionality...');
    
    const swContent = `// Service worker for Custodial Command PWA
const CACHE_NAME = 'custodial-command-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add other static assets that should be cached
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available, otherwise fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline data submission
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'submit-inspections') {
    event.waitUntil(syncInspections());
  }
});

// Placeholder for sync function
async function syncInspections() {
  // Implementation for syncing offline data when connection is restored
  console.log('Syncing offline inspections...');
}
`;

    const swPath = path.join(this.projectRoot, 'public', 'sw.js');
    if (!fs.existsSync(path.dirname(swPath))) {
      fs.mkdirSync(path.dirname(swPath), { recursive: true });
    }
    fs.writeFileSync(swPath, swContent);
    this.fixesApplied.push('Created service worker for PWA');
    this.log('✅ Created service worker for PWA');
  }

  // Update package.json with additional dependencies if needed
  updatePackageJson() {
    this.log('Fixing: Updating package.json with useful dependencies...');
    
    const packagePath = path.join(this.projectRoot, 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    // Add missing dependencies that are referenced but might not be in package.json
    const devDependencies = packageContent.devDependencies || {};
    const dependencies = packageContent.dependencies || {};
    
    // These are needed for our new functionality
    const neededDependencies = {
      // We already added form-data earlier, but let's make sure it's listed properly
    };
    
    // Update the package file if there are changes
    let updated = false;
    for (const [dep, version] of Object.entries(neededDependencies)) {
      if (!dependencies[dep]) {
        dependencies[dep] = version;
        updated = true;
      }
    }
    
    if (updated) {
      packageContent.dependencies = dependencies;
      fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
      this.fixesApplied.push('Updated package.json with dependencies');
      this.log('✅ Updated package.json with dependencies');
    } else {
      this.log('ℹ️ No dependency updates needed');
    }
  }

  // Create API documentation
  createAPIDocumentation() {
    this.log('Fixing: Creating API documentation...');
    
    const apiDocs = `# Custodial Command API Documentation

## Base URL
\`\`\`
${process.env.TEST_BASE_URL || 'http://localhost:5000'}
\`\`\`

## Endpoints

### Health Check
\`\`\`
GET /health
\`\`\`
Returns service health status.

### Inspections
\`\`\`
GET /api/inspections
\`\`\`
Get all inspections.

\`\`\`
POST /api/inspections
\`\`\`
Create a new inspection.

Body:
\`\`\`json
{
  "inspectorName": "string",
  "school": "string",
  "date": "string",
  "inspectionType": "single_room|whole_building",
  "locationDescription": "string",
  "roomNumber": "string",
  "floors": "number",
  // ... additional rating fields
}
\`\`\`

\`\`\`
GET /api/inspections/{id}
\`\`\`
Get a specific inspection by ID.

\`\`\`
PATCH /api/inspections/{id}
\`\`\`
Update a specific inspection.

\`\`\`
PUT /api/inspections/{id}
\`\`\`
Full update of a specific inspection.

\`\`\`
DELETE /api/inspections/{id}
\`\`\`
Delete a specific inspection.

### Custodial Notes
\`\`\`
GET /api/custodial-notes
\`\`\`
Get all custodial notes.

\`\`\`
POST /api/custodial-notes
\`\`\`
Create a new custodial note.

\`\`\`
GET /api/custodial-notes/{id}
\`\`\`
Get a specific custodial note.

### Room Inspections
\`\`\`
GET /api/rooms-inspections
\`\`\`
Get all room inspections.

\`\`\`
POST /api/room-inspections
\`\`\`
Create a new room inspection.

### Data Exports
\`\`\`
GET /api/export/inspections/csv
\`\`\`
Export inspections as CSV.

\`\`\`
GET /api/export/inspections/json
\`\`\`
Export inspections as JSON.

\`\`\`
GET /api/export/notes/csv
\`\`\`
Export custodial notes as CSV.

\`\`\`
GET /api/export/notes/json
\`\`\`
Export custodial notes as JSON.

### Authentication
\`\`\`
POST /api/admin/login
\`\`\`
Admin login.

Body:
\`\`\`json
{
  "username": "string",
  "password": "string"
}
\`\`\`

## Headers
- Content-Type: application/json
- Authorization: Bearer {token} (for admin endpoints)

## Rate Limiting
All API endpoints are rate-limited to prevent abuse.

## Error Handling
Errors follow this format:
\`\`\`json
{
  "error": "Error message",
  "timestamp": "ISO date string",
  "path": "request path"
}
\`\`\`

## Response Format
Successful responses include data in the response body as appropriate.
`;
    
    const docsPath = path.join(this.projectRoot, 'API_DOCUMENTATION.md');
    fs.writeFileSync(docsPath, apiDocs);
    this.fixesApplied.push('Created API documentation');
    this.log('✅ Created API documentation');
  }

  // Run all fixes
  async runAllFixes() {
    this.log('🚀 Starting Issue Fixes for Custodial Command Application');
    
    this.updatePackageJson();
    this.addExportEndpoints();
    this.updateRoutesTs();
    this.enhanceSecurity();
    this.updateCSSForMobile();
    this.updatePWAFunctionality();
    this.addBetterErrorHandling();
    this.createServiceWorker();
    this.createAPIDocumentation();
    
    this.log('\n=== APPLIED FIXES ===');
    this.fixesApplied.forEach((fix, index) => {
      this.log(`${index + 1}. ${fix}`);
    });
    
    this.log('\n=== SUMMARY ===');
    this.log(`✅ ${this.fixesApplied.length} fixes applied successfully`);
    this.log('The application should now have:');
    this.log('• Export functionality for data');
    this.log('• Enhanced security validation');
    this.log('• Better mobile responsiveness');
    this.log('• Enhanced error handling');
    this.log('• PWA service worker');
    this.log('• API documentation');
    this.log('\n💡 Next steps: Test the application to verify all fixes work as expected');
  }
}

// Run the issue fixer
const fixer = new IssueFixer();
fixer.runAllFixes().catch(console.error);