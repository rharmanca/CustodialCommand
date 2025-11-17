# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Custodial Command is a comprehensive custodial inspection and management system built for educational institutions. This Progressive Web App (PWA) enables custodial staff to conduct inspections, report concerns, and track building cleanliness standards with a mobile-first design.

**Current Version**: 1.0.1
**Architecture**: Full-stack TypeScript with React frontend and Express backend
**Database**: PostgreSQL with Drizzle ORM
**Deployment**: Railway platform with automated CI/CD

## Development Commands

### Core Development
```bash
npm run dev              # Start both frontend and backend in development mode
npm run dev:client       # Start frontend only (Vite dev server on :5173)
npm run dev:server       # Start backend only (Express server on :5000)
```

### Building & Production
```bash
npm run build            # Build for production (runs type check first)
npm run prebuild         # Type check before building
npm run postbuild        # Post-build processing
npm run start            # Start production server (validates env first)
npm run start:clean      # Kill port 5000 and start fresh
npm run railway:start    # Railway deployment start command
npm run preview          # Preview production build locally
```

### Database Operations
```bash
npm run db:push          # Push Drizzle schema changes to database
npm run db:push-safe     # Push schema with error handling
npm run validate-env     # Validate required environment variables
```

### Testing Suite
```bash
npm run test:comprehensive   # Run all tests (comprehensive test runner)
npm run test:health          # Health check tests
npm run test:forms           # Form functionality tests
npm run test:debug           # Debug mode testing with verbose output
npm run test:e2e             # End-to-end user journey tests
npm run test:performance     # Performance and load testing
npm run test:security        # Security vulnerability tests
npm run test:mobile          # Mobile PWA specific tests
```

### UI Testing (Playwright)
```bash
npm run ui:test            # Run Playwright tests
npm run ui:test:headed     # Run Playwright tests with browser UI
npm run ui:test:report     # Show Playwright test report
```

### Analysis & Utilities
```bash
npm run analyze:bundle     # Analyze bundle size and composition
npm run build:analyze      # Build and then analyze bundle
npm run check              # TypeScript type checking
npm run lighthouse         # Lighthouse CI performance audit
npm run lighthouse:local   # Local Lighthouse audit
```

## Architecture Overview

### Full-Stack Structure
- **Frontend**: React 18.3.1 + TypeScript 5.6.3 with Vite 6.4.1 build system
- **Backend**: Express.js 4.21.2 server with MVC architecture pattern
- **Database**: PostgreSQL with Drizzle ORM 0.39.1
- **Deployment**: Railway (primary) with automated CI/CD via GitHub Actions
- **Module System**: ESM (ES Modules) throughout

### Directory Structure

```
/home/user/CustodialCommand/
├── server/                      # Backend Express.js application
│   ├── controllers/             # Business logic controllers (MVC pattern)
│   ├── config/                  # Configuration constants
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utilities (scoring, fileUpload, errorHandler)
│   ├── index.ts                 # Main application entry point
│   ├── routes.ts                # API route definitions (400+ lines)
│   ├── db.ts                    # Database connection (PostgreSQL/Neon)
│   ├── security.ts              # Security middleware (rate limiting, sanitization)
│   ├── monitoring.ts            # Performance monitoring & health checks
│   ├── logger.ts                # Structured logging
│   ├── storage.ts               # Database CRUD operations
│   ├── cache.ts                 # Response caching
│   └── automated-monitoring.ts  # Health monitoring daemon
├── src/                         # Frontend React application (172 files)
│   ├── components/              # React components
│   │   ├── ui/                  # 90+ Radix UI components
│   │   ├── reports/             # PDF/Excel export wizards
│   │   ├── filters/             # Advanced filtering UI
│   │   ├── data/                # Grouped data views
│   │   ├── charts/              # Recharts visualizations
│   │   ├── shared/              # ErrorBoundary, LoadingOverlay
│   │   └── performance/         # Performance optimization components
│   ├── pages/                   # 10 route-level page components
│   ├── hooks/                   # 18 custom React hooks
│   ├── utils/                   # 15 utility modules
│   ├── schemas/                 # Zod validation schemas
│   ├── types/                   # TypeScript type definitions
│   ├── lib/                     # Library configurations
│   ├── App.tsx                  # Main application component
│   └── main.tsx                 # React entry point
├── shared/                      # Shared code between frontend/backend
│   ├── schema.ts                # Drizzle ORM database schema (8 tables)
│   └── custodial-criteria.ts   # Rating criteria definitions
├── tests/                       # Test suites (15 test files)
│   ├── reports/                 # Test report outputs (JSON)
│   └── screenshots/             # Test screenshots (72+ files)
├── ui-tests/                    # Playwright UI tests (5 specs)
├── migrations/                  # Database migrations
├── public/                      # Static assets & PWA files
│   ├── fonts/                   # Custom fonts
│   ├── manifest.json            # PWA manifest
│   └── sw.js                    # Service worker
├── docs/                        # Documentation
│   ├── security/                # Security documentation
│   └── mobile-efficiency/       # Mobile optimization docs
├── dist/                        # Production build output
├── scripts/                     # Utility scripts
│   └── qa/                      # QA automation scripts
└── uploads/                     # File upload directory
```

**Key Statistics**:
- **Total Source Files**: 236 (.ts, .tsx, .js, .jsx)
- **Frontend Components**: 90+ UI components
- **Custom Hooks**: 18 React hooks
- **API Endpoints**: 20+ RESTful endpoints
- **Database Tables**: 8 tables
- **Test Suites**: 15 comprehensive test files
- **Documentation Files**: 80+ Markdown files

### Key Architectural Patterns

**Database Schema Design** (`shared/schema.ts`):

The database consists of 8 tables managed by Drizzle ORM:

1. **users** - Authentication and user management
   - Fields: id, username, password (bcrypt hashed)

2. **inspections** - Main inspection records
   - Supports both single-room and whole-building inspections
   - Fields: id, inspectorName, school, date, inspectionType, locationDescription, roomNumber, buildingName, verifiedRooms[], isCompleted, createdAt
   - 11 rating criteria (1-5 scale): floors, verticalHorizontalSurfaces, ceiling, restrooms, customerSatisfaction, trash, projectCleaning, activitySupport, safetyCompliance, equipment, monitoring
   - Images: JSON array for photo attachments

3. **roomInspections** - Individual rooms within building inspections
   - Links to parent buildingInspectionId
   - Fields: id, buildingInspectionId, roomType, roomIdentifier, images[], responses, createdAt
   - Same 11 rating criteria as inspections table

4. **custodialNotes** - Quick concern reporting
   - Fields: id, inspectorName, school, date, location, locationDescription, notes, images[], createdAt
   - Validation: notes minimum 10 chars, max 5000 chars

5. **monthlyFeedback** - Monthly performance reports with PDF storage
   - Fields: id, school, month, year, pdfUrl, pdfFileName, extractedText, notes, uploadedBy, fileSize, uploadedAt

6. **inspectionPhotos** - Enhanced photo capture with location tracking
   - Location: locationLat, locationLng, locationAccuracy, locationSource
   - Indoor positioning: buildingId, floor, room
   - Metadata: fileSize, imageWidth, imageHeight, compressionRatio, deviceInfo
   - Sync status: pending, synced, failed

7. **syncQueue** - Offline sync management for PWA
   - Types: photo_upload, inspection_update
   - Retry mechanism with exponential backoff
   - Fields: id, entityType, entityId, operation, payload, status, retryCount, lastError

8. **sessions** - User session management
   - Redis-backed sessions with secure cookies
   - Session expiration and cleanup

**Schema Features**:
- Zod validation schemas for all insert operations
- Type inference for TypeScript safety throughout codebase
- Cascade delete relationships
- Default values and timestamps (createdAt, uploadedAt)
- Array fields for images and verifiedRooms
- Coercion for number fields (handles string inputs from forms)

**API Structure** (`/server/routes.ts` - 400+ lines):

The backend follows RESTful conventions with comprehensive middleware:

**Inspections API**:
- `POST /api/inspections` - Create inspection (with image upload, max 5 files @ 5MB each)
- `GET /api/inspections` - List all inspections with filtering support
- `GET /api/inspections/:id` - Get single inspection details
- `PATCH /api/inspections/:id` - Update inspection
- `DELETE /api/inspections/:id` - Delete inspection

**Room Inspections API**:
- `POST /api/room-inspections` - Create room inspection within building
- `GET /api/room-inspections` - List all room inspections
- `GET /api/room-inspections/building/:id` - Get all rooms for a building

**Custodial Notes API**:
- `POST /api/custodial-notes` - Create quick concern note (with images)
- `GET /api/custodial-notes` - List all notes with filtering
- `DELETE /api/custodial-notes/:id` - Delete note

**Monthly Feedback API**:
- `POST /api/monthly-feedback` - Upload PDF feedback report
- `GET /api/monthly-feedback` - List feedback reports
- `DELETE /api/monthly-feedback/:id` - Delete feedback

**Analytics API**:
- `GET /api/building-scores` - Calculate aggregate building scores
- `GET /api/school-scores` - Calculate school-level performance metrics
- `GET /api/compliance-status` - Get compliance percentages

**Utility Endpoints**:
- `GET /health` - Health check endpoint (used by Railway)
- `GET /objects/:filename` - Serve uploaded files

**Middleware Stack**:
- Security: Helmet.js headers, CORS, input sanitization
- Rate limiting: API (100 req/15min), Auth (20 req/15min strict)
- Error handling: Centralized error handler with structured logging
- Monitoring: Request duration tracking, slow request detection (>1000ms)
- Caching: Response caching for frequently accessed data
- File uploads: Multer with memory buffer storage, image compression

**Frontend Architecture** (`/src` - 172 files):

**Page Components** (`/src/pages/` - 10 pages):
- `custodial-inspection.tsx` - Single room inspection form
- `whole-building-inspection.tsx` - Multi-room building inspection
- `whole-building-inspection-refactored.tsx` - Optimized version
- `inspection-data.tsx` - Data viewing and filtering dashboard
- `custodial-notes.tsx` - Quick concern reporting
- `rating-criteria.tsx` - Criteria reference guide
- `admin-inspections.tsx` - Admin management panel
- `monthly-feedback.tsx` - Monthly report uploads
- `scores-dashboard.tsx` - Analytics and performance dashboard
- `not-found.tsx` - 404 error page

**UI Component Library** (`/src/components/ui/` - 90+ components):
Built on Radix UI with custom styling via Tailwind CSS:
- **Form Controls**: Button, Input, Select, Checkbox, Radio, Switch, Slider, Textarea, Label
- **Layout**: Card, Dialog, Sheet, Drawer, Tabs, Accordion, Separator, Sidebar, ScrollArea
- **Navigation**: NavigationMenu, Menubar, Breadcrumb, Pagination
- **Feedback**: Toast, Alert, Progress, LoadingSpinner, Skeleton
- **Data Display**: Table, Badge, Avatar, Tooltip, HoverCard, Calendar
- **Mobile Optimized**: MobileBottomNav, MobileCard, TouchOptimizedButton
- **Accessibility**: AccessibilityEnhancements, AccessibilityTester, SkipLink

**Feature Components**:
- `/components/reports/` - PDF/Excel export wizards (ReportExportWizard, ExcelExportWizard)
- `/components/filters/` - Advanced filtering UI (AdvancedFilters, FilterControls)
- `/components/data/` - GroupedInspections, GroupedRoomInspections, GroupedNotes
- `/components/charts/` - Recharts visualizations (BarChart, LineChart, PieChart, ScoreCard)
- `/components/shared/` - ErrorBoundary, LoadingOverlay
- Specialized: PhotoCapture, LocationTagger, VoiceRatingInput, OfflineQueueStatus

**Custom Hooks** (`/src/hooks/` - 18 hooks):
- `use-mobile.tsx` - Mobile device detection
- `use-building-inspection-form.tsx` - Complex building inspection form state
- `use-room-selection.tsx` - Room type verification logic
- `use-form-persistence.tsx` - LocalStorage form auto-save
- `use-api.tsx` - API call wrapper with error handling
- `use-error-handler.tsx` - Global error handling
- `use-custom-notifications.tsx` - Toast notifications
- `use-offline-status.ts` - Network connectivity monitoring
- `use-photo-capture.ts` - Camera access management
- `use-service-worker.ts` - PWA service worker integration
- `use-touch-friendly.tsx` - Touch interaction optimization
- `use-toast.ts` - Toast UI hook
- `useLocalStorageAvailable.ts` - Storage availability check
- `useLocationServices.ts` - Geolocation API wrapper
- `useOfflineManager.ts` - Offline data synchronization
- `useStorageQuotaMonitor.ts` - Storage quota tracking

**Lazy Loading** (`/src/components/lazy-pages.tsx`):
All route components are lazy-loaded with React.lazy() and Suspense for optimal bundle splitting and performance.

**State Management**:
- **Server State**: React Query (@tanstack/react-query v5.60.5) for API calls, caching, and synchronization
- **Form State**: Custom hooks (use-building-inspection-form, use-room-selection) for complex multi-step forms
- **Persistence**: LocalStorage via use-form-persistence for offline functionality and auto-save
- **Routing**: Wouter v3.3.5 for lightweight client-side routing
- **Global State**: React Context for theme, auth, and offline status

**Frontend Utilities** (`/src/utils/` - 15 modules):
- `api.ts` - Centralized API client with fetch wrappers
- `validation.ts` - Form validation helpers and rules
- `storage.ts` - LocalStorage abstraction layer
- `SafeLocalStorage.ts` - Quota-aware localStorage with error handling
- `offlineManager.ts` - Offline data synchronization and queue management
- `photoStorage.ts` - Photo caching and compression
- `imageCompression.ts` - Client-side image optimization (reduces file size for mobile)
- `excelExporter.ts` - Excel file generation with SheetJS
- `exportHelpers.ts` - Data transformation for exports
- `printReportGenerator.ts` - PDF report generation with jsPDF
- `chartToPDF.ts` - Chart-to-PDF conversion
- `problemAnalysis.ts` - Data analysis and trend detection
- `constants.ts` - Application-wide constants
- `accessibilityValidator.ts` - WCAG compliance validation
- `keyboardNavigationDetector.ts` - Keyboard navigation detection

### Key Business Logic

**Inspection Types**:
1. **Single Room Inspection**:
   - Direct rating of 11 criteria for a specific room
   - Photo capture with location tagging
   - Immediate submission or auto-save draft

2. **Whole Building Inspection**:
   - Multi-step workflow with room type verification
   - Initial building-level assessment
   - Individual room inspections for each verified room type
   - Aggregated scoring at building level

**Rating System**: 1-5 scale across 11 criteria:
1. **Floors** - Cleanliness, debris removal, proper maintenance
2. **Vertical/Horizontal Surfaces** - Walls, desks, counters, furniture
3. **Ceilings** - Cobwebs, stains, fixtures
4. **Restrooms** - Sanitation, supplies, fixtures
5. **Customer Satisfaction** - Overall appearance and experience
6. **Trash** - Removal, container maintenance
7. **Project Cleaning** - Deep cleaning tasks
8. **Activity Support** - Event setup/cleanup
9. **Safety Compliance** - Hazard removal, signage
10. **Equipment** - Proper use and maintenance
11. **Monitoring** - Regular checks and follow-ups

**Scoring Algorithms** (`/server/utils/scoring.ts`):
- `calculateBuildingScore()` - Aggregates individual room scores to building level
- `calculateSchoolScores()` - Computes school-wide performance metrics
- `getComplianceStatus()` - Calculates compliance percentages for each criterion

**Data Flow**:
1. **Frontend Collection**: Forms with Zod validation, auto-save, offline support
2. **API Processing**: Rate limiting, input sanitization, authentication checks
3. **Database Storage**: Drizzle ORM with type-safe operations
4. **State Management**: React Query caching with background refetch
5. **Monitoring**: Structured logging, performance tracking, error reporting

## Configuration Files

### TypeScript Configuration
- **tsconfig.json** - Main frontend config (ES2020, React JSX)
  - Path aliases: `@/*` → `./src/*`, `@shared/*` → `./shared/*`
  - Strict mode enabled, skipLibCheck for faster builds
- **tsconfig.server.json** - Server-specific config (CommonJS compatible)
- **tsconfig.node.json** - Node.js configuration

### Build Configuration
- **vite.config.ts** - Frontend build system
  - Dev server: Port 5173 with WebSocket HMR
  - API proxy: `/api` → `http://localhost:5000`
  - Build optimizations: ESBuild minification, CSS code splitting
  - Chunk size warning: 1000KB threshold
  - Output: `dist/public/`

### ORM Configuration
- **drizzle.config.ts** - Database ORM settings
  - Dialect: PostgreSQL
  - Schema: `./shared/schema.ts`
  - Migrations: `./migrations`

### Styling Configuration
- **tailwind.config.ts** - CSS framework
  - Dark mode: Class-based switching
  - Custom theme with CSS variables
  - Font: Inter with system fallbacks
  - Mobile-first breakpoints

### Testing Configuration
- **playwright.config.ts** - UI/E2E testing
  - Base URL: https://cacustodialcommand.up.railway.app
  - 5 browser configurations: Desktop Chrome/Firefox/Safari, Mobile Chrome (Pixel 7), Mobile Safari (iPhone 14)
  - Timeout: 60s per test, 2 retries in CI
  - Screenshots and videos on failure

### Deployment Configuration
- **railway.json** - Railway platform settings
  - Builder: NIXPACKS
  - Health check: `/health` endpoint (30s timeout)
  - Restart policy: ON_FAILURE (max 10 retries)

## Technology Stack

### Frontend Dependencies
- **Core**: React 18.3.1, TypeScript 5.6.3, Vite 6.4.1
- **UI Library**: 25+ Radix UI packages for accessible components
- **State Management**: @tanstack/react-query 5.60.5, Wouter 3.3.5 (routing)
- **Styling**: Tailwind CSS 3.4.17, Framer Motion 11.13.1 (animations)
- **Data Visualization**: Recharts 2.15.2
- **Export Utilities**: jsPDF 3.0.3, XLSX 0.18.5
- **Forms**: Zod 3.24.1 (validation), @hookform/resolvers

### Backend Dependencies
- **Server**: Express 4.21.2, Node.js (ES modules)
- **Database**: PostgreSQL, Drizzle ORM 0.39.1, drizzle-zod
- **Security**: Bcrypt 6.0.0, Helmet 8.1.0, express-rate-limit 8.0.1
- **File Handling**: Multer 2.0.2, sharp (image processing)
- **Utilities**: Compression 1.8.1, CORS 2.9.0

### Development Tools
- **Testing**: Playwright 1.56.1, Puppeteer 24.29.1, Axe-Playwright 2.2.2
- **Build Tools**: ESBuild 0.25.0, PostCSS 8.4.47
- **Performance**: Lighthouse CI, bundle analyzer
- **CI/CD**: GitHub Actions, Railway deployment

## Recent Updates & Improvements

### Latest Commit (eb4ba1a) - Security & Performance
**MVC Architecture Refactor**:
- Separated business logic into `/server/controllers/`
- Configuration management in `/server/config/constants.ts`
- Enhanced type definitions in `/server/types/`
- Improved error handling in `/server/utils/errorHandler.ts`

**Security Enhancements**:
- Updated input sanitization in `/server/security.ts`
- Comprehensive security audit documentation
- Lessons learned from XLSX vulnerability mitigation

### Recent Features
1. **Advanced Photo Capture System**:
   - GPS and indoor location tagging (`inspectionPhotos` table)
   - Client-side image compression for mobile performance
   - Offline photo queue with retry mechanism
   - Device metadata capture for diagnostics

2. **Progressive Web App Capabilities**:
   - Service worker for offline functionality (`/public/sw.js`)
   - App manifest for iOS/Android installation
   - Offline sync queue with exponential backoff
   - Storage quota monitoring and management

3. **Accessibility Improvements**:
   - WCAG 2.1 AA compliance testing
   - Touch target optimization (44x44px minimum)
   - Screen reader enhancements
   - Keyboard navigation support

4. **Analytics Dashboard**:
   - School-level score aggregation
   - Building performance trends
   - Room-level heatmaps
   - Compliance status tracking

5. **Export Capabilities**:
   - PDF report generation with charts
   - Excel export with formatting and grouping
   - Bulk data export with filtering
   - Print-optimized report layouts

6. **Automated Monitoring**:
   - Health check daemon (`/server/automated-monitoring.ts`)
   - Database retry mechanism (`/server/database-retry.ts`)
   - Performance error handling
   - Structured logging throughout application

## Development Guidelines

### Database Changes
**Schema Workflow**:
1. Modify database schema in `shared/schema.ts`
2. Update Zod validation schemas if needed
3. Run `npm run db:push-safe` to apply changes (safer with error handling)
4. Test changes locally before committing
5. Validate environment with `npm run validate-env`

**Important Notes**:
- Always backup production database before major schema changes
- Use migrations for production deployments (stored in `/migrations`)
- Test with both Supabase and Neon providers if using cloud databases
- Schema changes automatically generate TypeScript types via Drizzle

### Testing Strategy

**Comprehensive Test Suite** (`/tests/` - 15 test files):
The project has extensive automated testing coverage:

**Test Categories**:
- `npm run test:comprehensive` - Master test orchestrator (runs all suites)
- `npm run test:e2e` - End-to-end user journey tests
- `npm run test:performance` - Load testing and response time benchmarks
- `npm run test:security` - Vulnerability scanning and input validation tests
- `npm run test:mobile` - PWA functionality and mobile responsiveness
- `npm run test:forms` - Form validation and submission testing
- `npm run test:health` - Health check and uptime tests

**Playwright UI Tests** (`/ui-tests/`):
- `npm run ui:test` - Run cross-browser UI tests
- `npm run ui:test:headed` - Run with visible browser for debugging
- `npm run ui:test:report` - View detailed test reports

**Test Reports**: Generated in `/tests/reports/` as JSON files
**Screenshots**: Test screenshots captured in `/tests/screenshots/` (72+ files)

**Testing Best Practices**:
- Run `npm run test:comprehensive` before pushing major changes
- Use `npm run test:debug` for verbose output during troubleshooting
- Check test reports for performance regressions
- Ensure all tests pass in CI/CD pipeline before deployment

### Code Organization

**File Structure Conventions**:
- **Shared Code**: `/shared/` - Code used by both frontend and backend
  - `schema.ts` - Database schema (single source of truth)
  - `custodial-criteria.ts` - Business logic constants
- **Server Code**: `/server/` - Backend with MVC pattern
  - `controllers/` - Business logic (new MVC pattern)
  - `routes.ts` - Route definitions and middleware
  - `utils/` - Reusable utilities (scoring, fileUpload, errorHandler)
- **Frontend Code**: `/src/` - React application
  - `pages/` - Route-level components (lazy-loaded)
  - `components/ui/` - Reusable UI components (Radix UI)
  - `components/` (other) - Feature-specific components
  - `hooks/` - Custom React hooks
  - `utils/` - Frontend utilities
  - `schemas/` - Zod validation schemas for forms

**Path Aliases** (configured in tsconfig.json):
- `@/*` → `./src/*` (frontend imports)
- `@shared/*` → `./shared/*` (shared imports)

**Naming Conventions**:
- Components: PascalCase (e.g., `InspectionForm.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `use-mobile.tsx`)
- Utilities: camelCase (e.g., `api.ts`, `validation.ts`)
- Types: PascalCase with descriptive names (e.g., `InspectionData`)

### Performance Considerations

**Frontend Optimizations**:
- **Lazy Loading**: All route components lazy-loaded via `lazy-pages.tsx`
- **Bundle Splitting**: Vendor and UI chunks separated for optimal caching
- **Image Optimization**: Client-side compression in `imageCompression.ts`
- **Code Splitting**: Dynamic imports for large dependencies
- **Tree Shaking**: Unused code eliminated during build

**Backend Optimizations**:
- **Response Caching**: Frequently accessed data cached via `/server/cache.ts`
- **Database Connection Pooling**: Managed by pg/Neon drivers
- **Compression**: Gzip compression for all responses
- **Slow Query Detection**: Requests >1000ms logged in monitoring

**Monitoring**:
- Performance metrics tracked in `/server/monitoring.ts`
- Lighthouse CI integration for automated performance audits
- Bundle size analysis via `npm run analyze:bundle`

**Performance Budgets**:
- Chunk size warning threshold: 1000KB
- Target First Contentful Paint: <2s
- Target Time to Interactive: <3.5s

### Security Implementation

**Security Layers**:

1. **HTTP Security Headers** (`/server/security.ts`):
   - Helmet.js for standard security headers
   - Content Security Policy (CSP)
   - X-Frame-Options, X-Content-Type-Options
   - Strict-Transport-Security (HSTS)

2. **Rate Limiting**:
   - API endpoints: 100 requests per 15 minutes
   - Auth endpoints: 20 requests per 15 minutes (strict)
   - Configurable via environment variables

3. **Input Validation & Sanitization**:
   - XSS protection via input sanitization
   - Script tag removal from user inputs
   - Zod schema validation on frontend and backend
   - Type-safe database operations with Drizzle ORM

4. **Authentication**:
   - Bcrypt password hashing with salt rounds
   - Redis-backed sessions with secure cookies
   - Session expiration and cleanup

5. **CORS Configuration**:
   - Whitelist for localhost and approved domains
   - Credentials support enabled for authenticated requests

6. **File Upload Security**:
   - File type validation (images only)
   - File size limits: 5MB per file, max 5 files
   - Memory buffer storage (no direct disk writes)
   - Multer sanitization of filenames

**Security Best Practices**:
- Never commit sensitive data (use `.env` for secrets)
- Regularly audit dependencies for vulnerabilities
- Review security test results: `npm run test:security`
- Follow OWASP Top 10 guidelines
- Monitor security documentation in `/docs/security/`

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://user:password@host:port/database
# Example formats:
# - Supabase: postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
# - Neon: postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require
# - Local: postgresql://localhost:5432/custodialcommand

# Environment (REQUIRED)
NODE_ENV=development  # or "production"

# Server Configuration (Optional)
PORT=5000  # Default is 5000

# Rate Limiting (Optional - defaults shown)
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window

# Session Security (Optional)
SESSION_SECRET=your-secret-key-here  # Required for production

# File Upload (Optional - defaults shown)
MAX_FILE_SIZE=5242880  # 5MB in bytes
MAX_FILES=5            # Maximum files per upload
```

### Database Provider Support

The application is compatible with multiple PostgreSQL providers:
- **Supabase**: Cloud-hosted PostgreSQL with built-in auth
- **Neon**: Serverless PostgreSQL
- **Local PostgreSQL**: Self-hosted development database
- **Railway PostgreSQL**: Managed database on Railway platform

### Environment Validation

Run `npm run validate-env` before starting the application to ensure all required variables are set correctly. This script checks:
- Database connection string format
- Required variables are present
- Optional variables have valid values
- Database connectivity (attempts connection)

## Mobile PWA Features

The application is designed as a Progressive Web App with extensive mobile optimization:

### PWA Capabilities
- **Service Worker** (`/public/sw.js`): Enables offline functionality and caching
- **App Manifest** (`/public/manifest.json`): Allows installation on iOS and Android
- **Offline Sync Queue** (`syncQueue` table): Queues operations when offline with retry logic
- **Storage Quota Monitoring**: Tracks and manages localStorage/IndexedDB usage

### Mobile Optimizations
- **Touch-Friendly UI**: All interactive elements meet 44x44px minimum touch target size
- **Mobile-First Design**: Tailwind CSS breakpoints start with mobile and scale up
- **Bottom Navigation**: Mobile-optimized navigation bar for thumb-friendly access
- **Touch Gestures**: Swipe, tap, and long-press interactions
- **Responsive Images**: Automatic image compression for mobile bandwidth

### Offline Features
- **Form Auto-Save**: Forms automatically save to localStorage every 30 seconds
- **Draft Recovery**: Automatic recovery of unsaved forms on page reload
- **Photo Queue**: Photos captured offline are queued and uploaded when online
- **Sync Status Indicator**: Visual feedback showing online/offline/syncing status

### Mobile Testing
- **Dedicated Test Suite**: `npm run test:mobile` - PWA-specific functionality tests
- **Cross-Device Testing**: Playwright tests on Pixel 7 (Android) and iPhone 14 (iOS)
- **Performance Metrics**: Mobile-specific Lighthouse audits
- **Touch Target Validation**: Automated testing ensures WCAG touch target compliance

### Installation
Users can install the PWA from:
- **Android**: "Add to Home Screen" prompt or Chrome menu
- **iOS**: Safari "Share" → "Add to Home Screen"
- **Desktop**: Chrome/Edge "Install" button in address bar

## CI/CD Pipeline

### GitHub Actions Workflow
**File**: `.github/workflows/lighthouse-ci.yml`

**Pipeline Steps**:
1. **Checkout Code**: Clones repository on ubuntu-latest runner
2. **Setup Node.js**: Installs Node.js 18.x with npm cache
3. **Install Dependencies**: Runs `npm ci` for clean install
4. **Build Application**: Executes `npm run build`
5. **Start Server**: Launches production server on port 5000
6. **Health Check**: Waits up to 60s for `/health` endpoint to respond
7. **Lighthouse Audit**: Runs performance, accessibility, and PWA tests
8. **Upload Artifacts**: Stores Lighthouse reports for review

**Triggers**:
- Push to `main` branch
- Pull requests targeting `main`
- Manual workflow dispatch

### Railway Deployment
**Platform**: Railway (https://railway.app)
**Configuration**: `railway.json`

**Deployment Process**:
1. **Automatic Deploy**: Triggered on git push to main branch
2. **Build**: Uses Nixpacks builder with `npm run build`
3. **Start**: Executes `npm run railway:start`
4. **Health Check**: Railway pings `/health` endpoint every 30s
5. **Restart Policy**: Restarts on failure (max 10 retries)

**Environment**:
- Database: Railway PostgreSQL or external provider
- Environment variables managed in Railway dashboard
- Automatic HTTPS with Railway domains

### Deployment Checklist
Before deploying to production:
1. ✅ Run `npm run test:comprehensive` - All tests pass
2. ✅ Run `npm run build` - Build succeeds without errors
3. ✅ Run `npm run validate-env` - Environment variables valid
4. ✅ Database migrations applied with `npm run db:push`
5. ✅ Security audit: `npm audit` shows no critical vulnerabilities
6. ✅ Lighthouse scores meet thresholds (Performance >90, A11y >95)
7. ✅ Test deployment in staging environment first

### Monitoring Post-Deployment
- **Health Endpoint**: Monitor `/health` for uptime
- **Error Logs**: Check Railway logs or server logs for errors
- **Performance**: Review Lighthouse CI reports
- **Database**: Monitor connection pool and query performance

## Development Workflow

### Initial Setup
1. **Clone Repository**: `git clone <repository-url>`
2. **Install Dependencies**: `npm install`
3. **Configure Environment**: Create `.env` file with required variables
4. **Validate Environment**: `npm run validate-env`
5. **Initialize Database**: `npm run db:push` (pushes schema to database)
6. **Start Development Server**: `npm run dev`

### Daily Development
1. **Start Development Mode**: `npm run dev`
   - Frontend: http://localhost:5173 (Vite dev server with HMR)
   - Backend: http://localhost:5000 (Express API server)
   - API calls automatically proxied from frontend to backend

2. **Make Changes**:
   - Frontend: Edit files in `/src` - hot module replacement updates instantly
   - Backend: Edit files in `/server` - server auto-restarts on save
   - Shared: Edit `/shared/schema.ts` - restart required

3. **Type Checking**: Run `npm run check` periodically to catch TypeScript errors

4. **Testing During Development**:
   - Run specific test suites as needed (e.g., `npm run test:forms`)
   - Use `npm run test:debug` for verbose output when troubleshooting

### Database Changes Workflow
1. **Modify Schema**: Edit `shared/schema.ts`
2. **Update Validation**: Update Zod schemas if needed
3. **Push Changes**: `npm run db:push-safe`
4. **Verify**: Check database schema was updated correctly
5. **Update TypeScript Types**: Types auto-generated from schema

### Pre-Commit Checklist
Before committing code:
1. ✅ `npm run check` - TypeScript errors resolved
2. ✅ `npm run build` - Build succeeds
3. ✅ `npm run test:comprehensive` - All tests pass (for major changes)
4. ✅ Code formatted and linted
5. ✅ Commit message follows conventional commits format

### Building for Production
1. **Type Check**: `npm run prebuild` (runs automatically before build)
2. **Build**: `npm run build`
   - Compiles TypeScript
   - Bundles frontend with Vite
   - Optimizes and minifies code
   - Output: `dist/public/`
3. **Preview Locally**: `npm run preview` (test production build)
4. **Analyze Bundle**: `npm run build:analyze` (check bundle size)

### Deployment Workflow
1. **Pre-Deployment**:
   - Ensure all tests pass: `npm run test:comprehensive`
   - Review security: `npm audit`
   - Validate environment: `npm run validate-env`

2. **Deploy to Railway**:
   - Push to `main` branch: `git push origin main`
   - Railway automatically builds and deploys
   - Monitor deployment in Railway dashboard

3. **Post-Deployment**:
   - Check health endpoint: `curl https://your-app.railway.app/health`
   - Monitor logs for errors
   - Run smoke tests on production URL
   - Verify Lighthouse CI reports

### Troubleshooting

**Port 5000 Already in Use**:
```bash
npm run start:clean  # Kills process on port 5000 and starts fresh
```

**Database Connection Issues**:
```bash
npm run validate-env  # Verify DATABASE_URL is correct
npm run db:push-safe  # Attempt to reconnect and push schema
```

**Build Failures**:
```bash
npm run check  # Check for TypeScript errors
rm -rf node_modules && npm install  # Clean reinstall
```

**Test Failures**:
```bash
npm run test:debug  # Run tests with verbose output
npm run ui:test:headed  # Run Playwright tests with visible browser
```

## Important File Paths Reference

### Configuration Files
- `/package.json` - Dependencies and npm scripts
- `/tsconfig.json` - TypeScript configuration (frontend)
- `/tsconfig.server.json` - TypeScript configuration (backend)
- `/vite.config.ts` - Vite build configuration
- `/tailwind.config.ts` - Tailwind CSS configuration
- `/drizzle.config.ts` - Database ORM configuration
- `/playwright.config.ts` - Playwright test configuration
- `/railway.json` - Railway deployment configuration
- `/.github/workflows/lighthouse-ci.yml` - CI/CD pipeline

### Core Application Files
- `/server/index.ts` - Main Express server entry point
- `/server/routes.ts` - API route definitions (400+ lines)
- `/server/security.ts` - Security middleware
- `/server/monitoring.ts` - Performance monitoring
- `/src/main.tsx` - React application entry point
- `/src/App.tsx` - Main application component
- `/shared/schema.ts` - Database schema (single source of truth)

### Key Directories
- `/server/` - Backend Express application
- `/src/` - Frontend React application
- `/shared/` - Code shared between frontend/backend
- `/tests/` - Comprehensive test suites
- `/ui-tests/` - Playwright UI tests
- `/public/` - Static assets and PWA files
- `/docs/` - Documentation
- `/migrations/` - Database migrations

### Documentation Files
- `/CLAUDE.md` - This file (AI assistant guidance)
- `/README.md` - Project overview
- `/TESTING_GUIDE.md` - Testing procedures
- `/DEPLOYMENT_COMPLETE.md` - Deployment documentation
- `/docs/security/` - Security documentation

---

## Quick Command Reference

```bash
# Development
npm run dev              # Start full-stack dev environment
npm run dev:client       # Frontend only
npm run dev:server       # Backend only

# Building
npm run build           # Production build
npm run preview         # Preview production build

# Database
npm run db:push         # Push schema to database
npm run validate-env    # Validate environment variables

# Testing
npm run test:comprehensive  # Run all test suites
npm run test:e2e            # End-to-end tests
npm run test:security       # Security tests
npm run ui:test             # Playwright UI tests

# Analysis
npm run check              # TypeScript type checking
npm run analyze:bundle     # Bundle size analysis
npm run lighthouse         # Lighthouse performance audit

# Production
npm run start              # Start production server
npm run railway:start      # Railway deployment start
```

---

**Last Updated**: Based on commit `eb4ba1a` (Security & Performance Improvements)
**Maintainers**: Review and update this file when major architectural changes occur