# Custodial Command Application Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [API Documentation](#api-documentation)
5. [Database Schema](#database-schema)
6. [Mobile & PWA Features](#mobile--pwa-features)
7. [Export Functionality](#export-functionality)
8. [Security Features](#security-features)
9. [Testing](#testing)
10. [Performance](#performance)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

## Overview

Custodial Command is a comprehensive facility management application designed for educational institutions to track and manage custodial inspections. The application provides tools for creating inspection reports, tracking maintenance issues, and generating reports across multiple schools.

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM with Zod validation
- **UI Components**: Radix UI primitives with Tailwind CSS
- **Build Tool**: Vite
- **Deployment**: Railway

## Features

### Core Features
- **Single Room Inspections**: Detailed room-by-room inspections with rating system
- **Building Inspections**: Multi-room building inspections with progress tracking
- **Custodial Notes**: Issue reporting and tracking system
- **Data Export**: Export all data in CSV and JSON formats
- **Admin Interface**: Administrative tools for data management

### Enhanced Features (Recent Updates)
- **Mobile Responsiveness**: Fully responsive design with touch-optimized UI
- **PWA Support**: Installable application with offline capabilities
- **Improved UX**: Enhanced navigation, loading states, and feedback
- **Progress Indicators**: Multi-step forms with progress tracking
- **Advanced Validation**: Comprehensive form validation with user feedback
- **Accessibility**: Improved accessibility with proper ARIA attributes
- **Performance**: Optimized loading times and resource usage

## Architecture

### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   └── ui/             # Radix-based components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── lib/                # Shared libraries
├── assets/             # Static assets
├── types/              # TypeScript type definitions
└── App.tsx            # Main application component
```

### Backend Structure
```
server/
├── index.ts            # Main server entry point
├── routes.ts           # API route definitions
├── export-routes.ts    # Export functionality routes
├── db.ts               # Database connection
├── storage.ts          # Data access layer
├── security.ts         # Security middleware
├── monitoring.ts       # Error handling and health checks
├── logger.ts           # Logging utilities
└── objectStorage.ts    # Object storage for images
```

### Shared
```
shared/
├── schema.ts          # Database schemas and Zod validations
└── custodial-criteria.ts # Rating criteria definitions
```

## API Documentation

### Base URL
```
https://cacustodialcommand.up.railway.app
```

### Health Check
```
GET /health
```
Returns service health status.

### Inspections
```
GET /api/inspections
```
Get all inspections with optional query parameters:
- `type`: Filter by inspection type (`single_room`, `whole_building`)
- `incomplete`: Filter by completion status (`true`)

```
POST /api/inspections
```
Create a new inspection.

Request Body:
```json
{
  "inspectorName": "string",
  "school": "string",
  "date": "string",
  "inspectionType": "single_room|whole_building",
  "locationDescription": "string",
  "roomNumber": "string",
  "locationCategory": "string",
  "floors": "number|null",
  "verticalHorizontalSurfaces": "number|null",
  "ceiling": "number|null",
  "restrooms": "number|null",
  "customerSatisfaction": "number|null",
  "trash": "number|null",
  "projectCleaning": "number|null",
  "activitySupport": "number|null",
  "safetyCompliance": "number|null",
  "equipment": "number|null",
  "monitoring": "number|null",
  "notes": "string",
  "images": ["string"],
  "isCompleted": "boolean",
  "verifiedRooms": ["string"]
}
```

```
GET /api/inspections/{id}
```
Get a specific inspection by ID.

```
PATCH /api/inspections/{id}
```
Update a specific inspection (partial update).

```
PUT /api/inspections/{id}
```
Full update of a specific inspection.

```
DELETE /api/inspections/{id}
```
Delete a specific inspection.

### Custodial Notes
```
GET /api/custodial-notes
```
Get all custodial notes.

```
POST /api/custodial-notes
```
Create a new custodial note.

Request Body:
```json
{
  "school": "string",
  "date": "string",
  "location": "string",
  "locationDescription": "string",
  "notes": "string",
  "images": ["string"]
}
```

```
GET /api/custodial-notes/{id}
```
Get a specific custodial note.

### Room Inspections
```
GET /api/room-inspections
```
Get all room inspections.

```
POST /api/room-inspections
```
Create a new room inspection.

```
GET /api/room-inspections/{id}
```
Get a specific room inspection.

```
GET /api/inspections/{id}/rooms
```
Get rooms for a specific building inspection.

### Data Exports
```
GET /api/export/inspections/csv
GET /api/export/inspections/json
GET /api/export/notes/csv
GET /api/export/notes/json
```
Export data in various formats.

### Authentication
```
POST /api/admin/login
```
Admin login.

Request Body:
```json
{
  "username": "string",
  "password": "string"
}
```

### Headers
- `Content-Type: application/json`
- `Authorization: Bearer {token}` (for admin endpoints)

### Rate Limiting
All API endpoints are rate-limited to 80 requests per minute.

### Error Handling
Errors follow this format:
```json
{
  "error": "Error message",
  "timestamp": "ISO date string",
  "path": "request path"
}
```

## Database Schema

### Inspections Table
```sql
inspections (
  id: SERIAL PRIMARY KEY,
  inspector_name: TEXT,
  school: TEXT NOT NULL,
  date: TEXT NOT NULL,
  inspection_type: TEXT NOT NULL, -- 'single_room' or 'whole_building'
  location_description: TEXT NOT NULL,
  room_number: TEXT,
  location_category: TEXT,
  floors: INTEGER,
  vertical_horizontal_surfaces: INTEGER,
  ceiling: INTEGER,
  restrooms: INTEGER,
  customer_satisfaction: INTEGER,
  trash: INTEGER,
  project_cleaning: INTEGER,
  activity_support: INTEGER,
  safety_compliance: INTEGER,
  equipment: INTEGER,
  monitoring: INTEGER,
  notes: TEXT,
  images: TEXT[], -- Array of image URLs
  verified_rooms: TEXT[], -- For tracking completed rooms in building inspections
  is_completed: BOOLEAN DEFAULT FALSE,
  created_at: TIMESTAMP DEFAULT NOW()
)
```

### Room Inspections Table
```sql
room_inspections (
  id: SERIAL PRIMARY KEY,
  building_inspection_id: INTEGER NOT NULL,
  room_type: TEXT NOT NULL,
  room_identifier: TEXT,
  floors: INTEGER,
  vertical_horizontal_surfaces: INTEGER,
  ceiling: INTEGER,
  restrooms: INTEGER,
  customer_satisfaction: INTEGER,
  trash: INTEGER,
  project_cleaning: INTEGER,
  activity_support: INTEGER,
  safety_compliance: INTEGER,
  equipment: INTEGER,
  monitoring: INTEGER,
  notes: TEXT,
  images: TEXT[] DEFAULT '{}',
  responses: TEXT, -- JSON string of responses
  created_at: TIMESTAMP DEFAULT NOW()
)
```

### Custodial Notes Table
```sql
custodial_notes (
  id: SERIAL PRIMARY KEY,
  school: TEXT NOT NULL,
  date: TEXT NOT NULL,
  location: TEXT NOT NULL,
  location_description: TEXT NOT NULL,
  notes: TEXT NOT NULL,
  images: TEXT[] DEFAULT '{}',
  created_at: TIMESTAMP DEFAULT NOW()
)
```

## Mobile & PWA Features

### Responsive Design
- Fully responsive layout that adapts to all screen sizes
- Touch-optimized UI elements with minimum 48px touch targets
- Mobile-first approach to design and development

### PWA Capabilities
- Installable on home screen
- Works offline with service worker
- Custom splash screen and icons
- Push notification ready

### Mobile-Specific Components
- `MobileButton`: Enhanced button component with proper touch targets
- `MobileInput`: Optimized input fields for mobile keyboards
- `MobileTextarea`: Properly sized text areas for mobile
- `useEnhancedMobile`: Comprehensive mobile detection hook

### Performance Optimizations
- Reduced bundle size for faster mobile loading
- Optimized images with proper compression
- Efficient data loading and caching

## Export Functionality

### Available Export Formats
- **CSV**: Comma-separated values for spreadsheet applications
- **JSON**: JavaScript Object Notation for data interchange

### Export Endpoints
- `/api/export/inspections/csv` - Export inspections as CSV
- `/api/export/inspections/json` - Export inspections as JSON
- `/api/export/notes/csv` - Export custodial notes as CSV
- `/api/export/notes/json` - Export custodial notes as JSON

### Export Data
Exports include all relevant fields for the respective data types:
- Inspections: All inspection details including ratings and notes
- Custodial Notes: All note details with metadata

## Security Features

### Input Validation
- Comprehensive Zod schema validation for all API inputs
- Server-side validation for all form submissions
- SQL injection prevention
- Cross-site scripting (XSS) protection

### Authentication & Authorization
- Role-based access control for admin endpoints
- Secure session management
- Password hashing and verification
- Rate limiting to prevent abuse

### Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options protection
- X-Content-Type-Options protection

### Data Sanitization
- Input sanitization for all user inputs
- SQL parameterization to prevent injection
- Output encoding where appropriate

## Testing

### Test Coverage
- **API Tests**: Comprehensive testing of all endpoints
- **Database Tests**: CRUD operations validation
- **Form Validation Tests**: Input validation verification
- **Security Tests**: Authentication and authorization validation
- **Performance Tests**: Load and stress testing
- **End-to-End Tests**: Complete workflow validation
- **Mobile Tests**: Responsiveness and UX validation

### Test Files
- `test-complete-api.js` - Comprehensive API endpoint testing
- `test-database-crud.js` - Database operations testing
- `test-form-validation.js` - Form validation testing
- `test-security.js` - Security testing
- `test-e2e-workflows.js` - End-to-end workflow testing
- `test-load-performance.js` - Load and performance testing
- `test-pwa-offline.js` - PWA functionality testing

### Test Data
Comprehensive test data available in `test-data.js` with:
- Valid and invalid test cases
- Different school scenarios
- Various inspection types
- Different rating scenarios

## Performance

### Optimizations Implemented
- Efficient database queries with proper indexing
- Optimized bundle size with code splitting
- Efficient image handling and compression
- Caching strategies for static assets
- Optimized API response times

### Performance Metrics
- Target response times under 500ms for most endpoints
- Optimized for mobile network conditions
- Efficient memory usage
- Proper resource cleanup

### Load Testing Results
- Successfully handles concurrent requests
- Maintains performance under load
- Proper error handling under stress conditions

## Deployment

### Railway Deployment
The application is deployed on Railway with:
- Automatic deployment from GitHub
- Environment variable management
- Database connection management
- Health check monitoring

### Environment Variables Required
- `DATABASE_URL` - Neon database connection string
- `ADMIN_USERNAME` - Admin username (default: admin)
- `ADMIN_PASSWORD` - Admin password
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Environment (production/development)

### Build Process
1. Client build with Vite
2. Server build with esbuild
3. Combined deployment package
4. Automatic environment configuration

## Troubleshooting

### Common Issues

#### Database Connection Issues
**Symptoms**: Application fails to start or database operations fail
**Solutions**:
1. Verify `DATABASE_URL` is correctly set
2. Check database credentials and permissions
3. Ensure database is accessible from deployment environment

#### Build Failures
**Symptoms**: Deployment fails during build phase
**Solutions**:
1. Check dependency versions in `package.json`
2. Verify all required files and dependencies exist
3. Run local build to identify issues before deployment

#### API Errors
**Symptoms**: API requests fail with unexpected errors
**Solutions**:
1. Check server logs for error details
2. Verify request format and required fields
3. Confirm authentication for protected endpoints

#### Mobile Display Issues
**Symptoms**: Interface doesn't display properly on mobile devices
**Solutions**:
1. Check viewport meta tag in `index.html`
2. Verify responsive CSS classes are applied
3. Test with browser dev tools responsive mode

#### PWA Installation Issues
**Symptoms**: Application doesn't install properly as PWA
**Solutions**:
1. Verify service worker registration in `App.tsx`
2. Check manifest file for required fields
3. Ensure proper HTTPS for PWA installation

### Debugging Information

#### Client-Side
- Open browser developer tools (F12)
- Check Console for JavaScript errors
- Check Network tab for API request issues
- Look for validation errors in Form components

#### Server-Side
- Check Railway logs for application errors
- Verify environment variables are set correctly
- Test API endpoints directly with a tool like Postman
- Check database connection status

#### Performance Monitoring
- Use browser dev tools Performance tab
- Monitor API response times
- Check for memory leaks or performance bottlenecks
- Use Lighthouse for PWA and performance scores

## Support

For additional support:
1. Check the server logs in Railway dashboard
2. Verify all environment variables are properly set
3. Test API endpoints directly with Postman or curl
4. Review the troubleshooting section above
5. Contact development team if issues persist

---

This documentation provides a comprehensive overview of the Custodial Command application, its features, architecture, and usage. For questions about specific functionality, refer to the appropriate section above.