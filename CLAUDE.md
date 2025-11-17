# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Custodial Command v1.0.1** is a comprehensive custodial inspection and management system built for educational institutions. This Progressive Web App (PWA) enables custodial staff to conduct inspections, report concerns, and track building cleanliness standards with a mobile-first design.

- **Type**: Full-stack PWA (Progressive Web App)
- **License**: MIT
- **Code Volume**: ~19,000 lines of TypeScript/TSX
- **Repository**: /home/user/CustodialCommand

## Development Commands

### Core Development
```bash
npm run dev              # Start both frontend (5173) and backend (5000) in development mode
npm run dev:client       # Start frontend only (Vite dev server on :5173)
npm run dev:server       # Start backend only (Express server on :5000)
```

### Building & Production
```bash
npm run prebuild         # Type check before building (tsc --noEmit)
npm run build            # Build for production (frontend + backend)
npm run start            # Start production server (runs db:push first)
npm run railway:start    # Railway deployment start command
npm run preview          # Preview production build locally
npm run start:clean      # Kill existing process & start fresh
```

### Database Operations
```bash
npm run db:push          # Push Drizzle schema changes to database
npm run db:push-safe     # Safe version (ignores errors)
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
npm run ui:test            # Run Playwright tests (headless)
npm run ui:test:headed     # Run Playwright tests with browser UI
npm run ui:test:report     # Show Playwright test report
```

### Analysis & Utilities
```bash
npm run check              # TypeScript type checking
npm run analyze:bundle     # Analyze bundle size and composition
npm run build:analyze      # Build and then analyze bundle
npm run lighthouse         # Lighthouse CI automated audit
npm run lighthouse:local   # Local Lighthouse testing
```

## Architecture Overview

### Full-Stack Structure
- **Frontend**: React 18 + TypeScript with Vite build system
- **Backend**: Express.js server with comprehensive middleware stack
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Railway (primary), Replit (development)
- **PWA**: Service Worker with offline support

### Path Aliases
```typescript
"@/*"        → ./src/*
"@assets/*"  → ./src/assets/*
"@shared/*"  → ./shared/*
```

### Directory Structure
```
CustodialCommand/
├── src/                    # Frontend React application
│   ├── pages/              # 10 page components
│   ├── components/         # 112+ reusable UI components
│   │   ├── ui/             # Radix UI-based primitives
│   │   ├── charts/         # Data visualization
│   │   ├── reports/        # Export & analysis views
│   │   ├── performance/    # Performance optimizations
│   │   ├── errors/         # Error boundary components
│   │   └── dev/            # Development utilities
│   ├── hooks/              # 10+ custom React hooks
│   ├── lib/                # Query client & utilities
│   ├── utils/              # 17 utility modules
│   ├── schemas/            # Form validation schemas
│   └── types/              # TypeScript type definitions
├── server/                 # Backend Express.js server
│   ├── routes.ts           # API endpoint definitions
│   ├── index.ts            # Server initialization
│   ├── security.ts         # Auth, CORS, rate limiting
│   ├── monitoring.ts       # Health checks & metrics
│   ├── cache.ts            # API response caching
│   ├── logger.ts           # Request/error logging
│   └── db.ts               # Database connection
├── shared/                 # Shared frontend & backend
│   ├── schema.ts           # Database schema (Drizzle ORM)
│   └── custodial-criteria.ts  # Inspection criteria
├── public/                 # Static PWA assets
│   ├── manifest.json       # PWA configuration
│   ├── sw.js               # Service Worker
│   └── icon-*.svg          # App icons
├── migrations/             # Database migrations
├── tests/                  # Comprehensive test suite
└── ui-tests/               # Playwright E2E tests
```

## Database Architecture

**Technology**: PostgreSQL with Drizzle ORM

**Tables**:

1. **users** - Authentication
   - `id` (serial, PK), `username` (text, unique), `password` (text, bcrypt hashed)

2. **inspections** - Main inspection records
   - Supports both single-room and whole-building inspections
   - 10 rating criteria fields: `floors`, `surfaces`, `ceilings`, `restrooms`, `customerSatisfaction`, `trash`, `projectCleaning`, `activitySupport`, `safetyCompliance`, `equipmentMonitoring`
   - `buildingInspectionId` - Reference to parent building inspection (nullable)
   - `images` - Array of image URLs
   - `notes`, `inspectorName`, `school`, `location`, `date`
   - `isCompleted` - Status tracking

3. **roomInspections** - Individual room data within building inspections
   - Linked via `buildingInspectionId`
   - `roomType` - Room categorization
   - Same 10 rating criteria as inspections
   - Individual room responses & notes

4. **custodialNotes** - Concern reporting
   - `inspectorName`, `school`, `date`, `location`
   - `notes`, `images` array
   - Location description & tagging

5. **monthlyFeedback** - Monthly report uploads
   - `school`, `month`, `year`
   - `pdfUrl`, `extractedText` (Docling service)
   - File metadata (size, uploader, notes)

6. **inspectionPhotos** - Photo metadata & tracking
   - GPS location data (`latitude`, `longitude`, `accuracy`)
   - Device information, compression ratio
   - Sync status for offline-first support
   - Foreign key to inspections with cascade delete

7. **syncQueue** - Offline sync management
   - Tracks pending operations during offline
   - Retry logic with error tracking
   - Supports multiple record types

**Migration Strategy**: Changes defined in `shared/schema.ts` and applied via `npm run db:push`. Drizzle Kit handles versioning in `/migrations/` directory.

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with HMR (Hot Module Replacement)
- **Router**: Wouter (lightweight client-side routing)
- **State Management**:
  - Server state: @tanstack/react-query
  - Forms: react-hook-form + Zod validation
  - Local storage: SafeLocalStorage wrapper
  - Offline storage: Dexie (IndexedDB)
- **UI Components**: Radix UI (19+ packages) + Tailwind CSS
- **Charts**: Recharts for data visualization
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **PDF Export**: jsPDF + jsPDF-autotable + html2canvas
- **Excel Export**: xlsx
- **Image Handling**: browser-image-compression, react-webcam
- **Theme**: next-themes for light/dark mode

### Page Components (10)
1. `custodial-inspection.tsx` - Single room/area inspection form
2. `whole-building-inspection.tsx` - Multi-step building inspection
3. `custodial-notes.tsx` - Concern reporting form
4. `inspection-data.tsx` - Data viewing & report generation
5. `monthly-feedback.tsx` - PDF upload & monthly reports
6. `scores-dashboard.tsx` - Analytics & KPI visualization
7. `rating-criteria.tsx` - Criteria reference guide
8. `admin-inspections.tsx` - Admin panel with data management
9. `not-found.tsx` - 404 fallback

### Custom Hooks (10+)
- `use-form-persistence.tsx` - LocalStorage form state recovery
- `use-mobile.tsx` - Mobile device detection
- `use-api.tsx` - API communication wrapper
- `use-building-inspection-form.tsx` - Complex form logic
- `use-room-selection.tsx` - Room selection state
- `useOfflineStatus.ts` - Network status tracking
- `usePhotoCapture.ts` - Camera integration
- `useServiceWorker.ts` - SW lifecycle management
- `useStorageQuotaMonitor.ts` - Storage quota tracking
- `useLocationServices.ts` - GPS coordinates capture
- `useMobileOptimizations.tsx` - Performance tweaks
- `useCustomNotifications.tsx` - Toast notifications
- `useErrorHandler.tsx` - Centralized error handling
- `useOfflineManager.ts` - Offline data queue

### Component Organization
```
components/
├── ui/              # Radix-based primitives (buttons, forms, dialogs, etc.)
├── charts/          # Data visualization components
├── reports/         # Export/reporting views
├── performance/     # Optimized components
├── errors/          # Error handling & boundaries
├── filters/         # Filter controls
├── data/            # Data display components
├── shared/          # Shared utilities
└── dev/             # Development-only components
```

### Accessibility Features (WCAG 2.2 AAA Compliant)
- Screen reader support with ARIA live regions
- Keyboard navigation with skip links
- Color contrast validation
- Touch target sizing (48px minimum, 100% compliance)
- Form validation with accessible error messages
- Text size controls (small/normal/large)
- Reduced motion support
- Focus management and visible focus indicators

### Performance Optimizations
- **Note**: Lazy loading removed (caused white screen on slow networks)
- Code splitting with vendor and UI chunks
- Image compression (client-side with quality tuning)
- Service Worker caching (network-first for HTML, cache-first for assets)
- Request deduplication
- API response caching
- CSS minification

## Backend Architecture

### Server Setup (`server/index.ts`)
- Express.js on port 5000 (configurable)
- Environment auto-detection (Replit, Railway, local)
- Trust proxy configuration for deployment environments
- Service Worker for offline PWA support

### Middleware Stack (in order)
1. Request ID assignment (`requestIdMiddleware`)
2. Performance monitoring (`performanceMiddleware`)
3. Memory monitoring (`memoryMonitoring`)
4. Metrics collection (`metricsMiddleware`)
5. Automated monitoring tracking
6. Graceful degradation (`gracefulDegradation`)
7. Error recovery (`errorRecoveryMiddleware`)
8. Request deduplication
9. Helmet.js security headers
10. Input sanitization & validation
11. JSON parsing (10MB limit)
12. API response caching
13. Rate limiting (endpoint-specific limits)
14. Cache invalidation on mutations
15. Circuit breaker protection

### API Routes (`server/routes.ts`)
- **POST /api/inspections** - Submit inspection (supports multi-step building inspections)
- **GET /api/inspections** - Retrieve inspections with filtering
- **PUT /api/inspections/:id** - Update inspection
- **POST /api/room-inspections** - Submit individual room data
- **POST /api/custodial-notes** - Submit concern reports
- **GET /api/custodial-notes** - Retrieve notes
- **POST /api/monthly-feedback** - Upload PDF feedback
- **GET /api/scores** - Calculate & retrieve scores
- **GET /api/schools** - List schools with stats
- **GET /api/health** - Health check endpoint
- **POST /api/admin/login** - Authentication endpoint
- **GET /api/admin/inspections** - Admin data retrieval

### Authentication & Security
- **Strategy**: Passport.js with local strategy
- **Password**: bcrypt hashing (10 salt rounds)
- **Session**: express-session with Redis or memory store
- **Rate Limiting**:
  - Standard API: 100 req/15min
  - Auth endpoints: 20 req/15min
- **CORS**: Environment-aware origin whitelisting
- **Session Secrets**: Auto-generated if not provided

### Performance Features
- Response compression (gzip level 6)
- API caching with TTL-based invalidation
- Request deduplication
- Memory usage monitoring
- Performance metrics collection
- Slow request detection (>1000ms alerts)
- Automated health monitoring

### Error Handling
- Circuit breaker pattern for database, cache, and file operations
- Graceful degradation when services fail
- Error recovery middleware
- Comprehensive logging with context
- Performance error handling
- Async error wrapper for promises

### File Uploads
- Multer for multipart form data
- Limits: 5MB per file, 5 files maximum
- Image validation (MIME type checking)
- Object storage support (via ObjectStorageService)
- File compression on upload

### Monitoring & Logging
- Winston-style logger with levels (debug, info, warn, error)
- Request/response logging with truncation
- Performance metrics collection
- Automated health monitoring with interval checks
- Error tracking and alerting

## Security Implementation

### Security Layers

1. **Transport Security**
   - Helmet.js for security headers
   - HSTS (1-year max age in production)
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection enabled
   - Referrer-Policy: strict-origin-when-cross-origin

2. **Input Validation**
   - Sanitization middleware removes script tags, javascript: URIs, event handlers
   - Zod schema validation for all API inputs
   - Type checking with TypeScript
   - HTML entity encoding

3. **Authentication**
   - Passport.js with local strategy
   - bcrypt password hashing (10 rounds)
   - Session-based auth with secure cookies
   - Optional Redis session store

4. **API Security**
   - Rate limiting: 100 req/15min (standard), 20 req/15min (auth)
   - CORS with environment-aware origin whitelisting
   - Automatic X-Forwarded-For IP detection
   - Request ID tracking for audit trails

5. **Data Protection**
   - PostgreSQL as source of truth
   - Parameterized queries via Drizzle ORM
   - Foreign key constraints for referential integrity
   - Cascade delete rules for data cleanup

6. **Session Management**
   - Session secrets auto-generated if not provided
   - Secure session cookie configuration
   - Session-based CSRF protection
   - Optional Redis persistence (fallback to memory)

7. **File Handling**
   - MIME type validation (images only)
   - File size limits (5MB per file)
   - Secure file upload via Object Storage API
   - No direct filesystem access

## PWA Features & Mobile Optimization

### PWA Configuration (`public/manifest.json`)
- **Display**: Standalone (full-screen app experience)
- **Theme Color**: #2563eb (blue)
- **Background**: #ffffff (white)
- **Shortcuts**: New Inspection, Report Issue, View Data
- **Protocol Handlers**: web+custodial:// support
- **Icons**: 192x192 and 512x512 SVG

### Service Worker (`public/sw.js`)
- **Cache Version**: v9 (as of latest commits)
- **Strategy**: Network-first for HTML, cache-first for assets
- **Offline Fallback**: Dedicated offline page
- **Background Sync**: Queue for offline operations
- **Push Notifications**: Support enabled

### Mobile Optimizations

1. **Touch Interface**
   - 48px+ touch targets (WCAG AAA compliant)
   - Touch-friendly buttons with proper spacing
   - Mobile bottom navigation component
   - Gesture support with @use-gesture/react

2. **Viewport Configuration**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
   ```
   - Prevents zoom (better UX for forms)
   - Safe area support for notch devices
   - 100% viewport coverage

3. **Platform-Specific**
   - Apple touch icon (192x192.svg)
   - Android splash screens
   - iOS status bar styling
   - Android tile color support
   - App installation prompts

4. **Storage & Offline**
   - LocalStorage for preferences & form persistence
   - IndexedDB (Dexie) for large datasets
   - Service Worker cache management
   - Sync queue for offline operations
   - Storage quota monitoring

5. **Performance (Mobile)**
   - Streaming CSS/JS to reduce FCP
   - Network-aware resource loading
   - Memory monitoring
   - WebP fallback support
   - Photo capture with EXIF stripping

## Testing Infrastructure

### Test Categories

1. **E2E Journey Tests** (`tests/e2e-user-journey.test.cjs`)
   - User story simulation
   - Complete inspection workflows
   - Multi-step form validation
   - Data persistence verification

2. **Form Testing** (`tests/comprehensive-form-testing.cjs`)
   - Form field validation
   - Error message accuracy
   - Submit/cancel flows
   - Dirty state tracking

3. **Performance Tests** (`tests/performance.test.cjs`)
   - Load testing (500-1000 records)
   - Response time measurement
   - Bundle size analysis
   - Memory leak detection

4. **Security Tests** (`tests/security.test.cjs`)
   - XSS vulnerability scanning
   - SQL injection testing
   - CSRF protection verification
   - Authentication bypass attempts

5. **Mobile/PWA Tests** (`tests/mobile-pwa.test.cjs`)
   - Offline functionality
   - Service Worker caching
   - Touch interface testing
   - Cross-browser compatibility

6. **Accessibility Tests** (`tests/accessibility.test.cjs`)
   - WCAG 2.2 AA/AAA compliance
   - Color contrast validation
   - Touch target sizing
   - Screen reader compatibility
   - Keyboard navigation

7. **Playwright UI Tests** (`ui-tests/ui.spec.ts`)
   - Browsers: Chromium, Firefox, WebKit
   - Devices: Pixel 7 (mobile), iPhone 14
   - Screenshot/video on failure
   - HTML report generation

### Lighthouse CI (`lighthouserc.js`)
- **Performance**: 90+ threshold
- **Accessibility**: 95+ (AAA compliance)
- **Best Practices**: 90+ (warning)
- **Core Web Vitals**: Monitored
- **CI/CD Integration**: Ready

## Build & Deployment

### Build Process

1. **Frontend (Vite)**
   - TypeScript compilation to ES2020
   - React Fast Refresh for dev HMR
   - CSS minification & code splitting
   - Automatic chunk splitting
   - Asset optimization (4KB inline limit)

2. **Backend (ESBuild)**
   - Standalone Node.js bundle
   - External dependencies marked as external
   - ESM format output

3. **Type Checking**
   - Pre-build validation (`npm run prebuild`)
   - Strict mode TypeScript
   - Source maps (disabled in production)

### Deployment Targets

1. **Railway** (Primary)
   - Configuration: `railway.json`
   - Health check: `/health` endpoint
   - Auto-restart on failure (max 10 retries)
   - Build: Nixpacks
   - Single replica

2. **Replit**
   - Configuration: `.replit`
   - Entrypoint: `server/index.ts`
   - Modules: Node 20, PostgreSQL 16
   - Object Storage support

3. **Local Development**
   - Concurrent dev (client + server)
   - Vite proxy to localhost:5000
   - Hot module replacement
   - Source maps for debugging

### Environment Configuration

**Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - development/production

**Optional**:
- `SESSION_SECRET` - Auto-generated if missing
- `RATE_LIMIT_MAX_REQUESTS` - Configurable rate limit
- `REDIS_URL` - Optional Redis (fallback to memory)
- `REPL_SLUG` / `REPL_OWNER` - Replit environment
- `TEST_URL` - E2E test target URL

## Key Business Logic

### Inspection Types
1. **Single Room**: Direct rating of 10 criteria for a specific room
2. **Whole Building**: Multi-step process with room type verification and individual room inspections

### Rating System
1-5 scale across 10 criteria:
- **Floors**: Cleanliness and condition of floor surfaces
- **Vertical/Horizontal Surfaces**: Desks, tables, walls, etc.
- **Ceilings**: Ceiling tiles, lights, vents
- **Restrooms**: Cleanliness and supplies
- **Customer Satisfaction**: Overall satisfaction
- **Trash**: Trash removal and receptacle condition
- **Project Cleaning**: Deep cleaning projects
- **Activity Support**: Support for school activities
- **Safety Compliance**: Safety standards adherence
- **Equipment Monitoring**: Equipment condition and maintenance

### Data Flow
1. Frontend forms collect inspection data with validation (Zod schemas)
2. API endpoints process and store data with security checks
3. React Query manages state and caching
4. Comprehensive logging and monitoring track all operations
5. Offline queue syncs when connection restored

## Performance Metrics & Targets

### Lighthouse Targets (Production)
- **Performance**: 90+
- **Accessibility**: 95+ (AAA)
- **Best Practices**: 90+
- **SEO**: 90+ (warning level)

### Core Web Vitals
- **First Contentful Paint**: < 1500ms
- **Largest Contentful Paint**: < 2500ms
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3500ms

### Bundle Size
- **Total**: < 512KB (warn at 500KB)
- **DOM Size**: < 1500 elements
- CSS minification enabled
- JS code splitting optimized

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start dev environment (both client + server)
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:5000

# Type checking
npm run check

# Run specific test suite
npm run test:e2e
```

### Database Development
```bash
# Update schema in shared/schema.ts, then:
npm run db:push

# Safe version (continues on error):
npm run db:push-safe
```

### Before Committing
1. Run type checking: `npm run check`
2. Run comprehensive tests: `npm run test:comprehensive`
3. Verify accessibility: `npm run test:mobile`
4. Build locally: `npm run build`

### Deployment to Railway
- Automatic on git push (CI/CD via Railway)
- Build command: `npm run build`
- Start command: `npm run railway:start`
- Health checks: `/health` endpoint
- Database auto-provisioned via Railway

## Code Organization Patterns

### Component Conventions
- Component files use `.tsx` extension
- Components in `src/components/` are reusable
- Page components in `src/pages/` are route-specific
- UI primitives in `src/components/ui/` based on Radix

### Hook Conventions
- `use*` prefix for all hooks
- Custom hooks in `src/hooks/`
- Server-state queries through React Query
- Form state through react-hook-form
- Side effects with useEffect cleanup

### API Integration
- Centralized query client (`src/lib/queryClient.ts`)
- Type-safe endpoints in `server/routes.ts`
- Zod schemas for validation
- Automatic retry/error handling

### Naming Conventions
- Files: kebab-case (e.g., `custodial-inspection.tsx`)
- Components: PascalCase (e.g., `CustodialInspection`)
- Functions/variables: camelCase (e.g., `handleSubmit`)
- Types/Interfaces: PascalCase (e.g., `InspectionData`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

## Recent Improvements

### Latest Commits (Last 5)
1. **eb4ba1a**: Security and performance improvements
2. **74da420**: Security documentation and audit results
3. **6444252**: Test results and reliability verification screenshots
4. **570f723**: Comprehensive reliability improvements (130+ files changed)
5. **6b3b5b3**: Exhaustive production testing suite

### Key Recent Enhancements
- WCAG 2.2 AAA accessibility compliance achieved
- Touch target sizing fixes (100% compliance)
- Service Worker cache versioning updates (v9)
- Performance monitoring improvements
- Security hardening measures
- Comprehensive test coverage expansion
- Circuit breaker middleware implementation
- Performance error handling enhancements
- Accessibility features across all pages
- Exhaustive production testing

## Key File Paths

### Configuration
- `/home/user/CustodialCommand/package.json` - Dependencies & npm scripts
- `/home/user/CustodialCommand/vite.config.ts` - Frontend build configuration
- `/home/user/CustodialCommand/tsconfig.json` - TypeScript config (frontend)
- `/home/user/CustodialCommand/tsconfig.server.json` - TypeScript config (backend)
- `/home/user/CustodialCommand/tailwind.config.ts` - Styling configuration
- `/home/user/CustodialCommand/drizzle.config.ts` - Drizzle ORM config
- `/home/user/CustodialCommand/playwright.config.ts` - E2E test config
- `/home/user/CustodialCommand/lighthouserc.js` - Lighthouse CI config
- `/home/user/CustodialCommand/railway.json` - Railway deployment config

### Core Application
- `/home/user/CustodialCommand/src/App.tsx` - Main application component
- `/home/user/CustodialCommand/src/main.tsx` - Application entry point
- `/home/user/CustodialCommand/server/index.ts` - Server initialization
- `/home/user/CustodialCommand/server/routes.ts` - API endpoint definitions
- `/home/user/CustodialCommand/shared/schema.ts` - Database schema & types

### PWA
- `/home/user/CustodialCommand/public/manifest.json` - PWA configuration
- `/home/user/CustodialCommand/public/sw.js` - Service Worker implementation

## AI Assistant Guidelines

### When Making Changes
1. **Always run type checking** before committing: `npm run check`
2. **Test comprehensively** with `npm run test:comprehensive`
3. **Validate accessibility** with touch target sizing and WCAG compliance
4. **Update database schema** in `shared/schema.ts` and run `npm run db:push`
5. **Follow naming conventions** (kebab-case files, PascalCase components)
6. **Use path aliases** (@/*, @shared/*) for imports
7. **Maintain security** - never skip input validation or sanitization

### Common Pitfalls to Avoid
- ❌ **DON'T** add lazy loading (causes white screen on slow networks)
- ❌ **DON'T** skip type checking before builds
- ❌ **DON'T** modify database schema without running `npm run db:push`
- ❌ **DON'T** ignore accessibility requirements (WCAG 2.2 AAA)
- ❌ **DON'T** bypass security middleware or validation
- ❌ **DON'T** create new files without reading existing ones first
- ❌ **DON'T** use relative imports when path aliases are available

### Best Practices
- ✅ **DO** use existing UI components from `src/components/ui/`
- ✅ **DO** implement proper error boundaries and error handling
- ✅ **DO** add comprehensive logging for debugging
- ✅ **DO** follow mobile-first design principles
- ✅ **DO** ensure 48px+ touch targets for mobile
- ✅ **DO** use React Query for server state management
- ✅ **DO** validate all user inputs with Zod schemas
- ✅ **DO** test offline functionality for PWA features
- ✅ **DO** maintain performance targets (Lighthouse 90+)
- ✅ **DO** use proper TypeScript types (avoid `any`)

### When Debugging
1. Check browser console for errors
2. Review server logs for backend issues
3. Verify database schema is up to date (`npm run db:push`)
4. Test in mobile device emulator for PWA issues
5. Run `npm run test:debug` for verbose test output
6. Check Service Worker cache (v9) for stale assets
7. Verify environment variables are properly set
