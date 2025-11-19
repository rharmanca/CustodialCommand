# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Custodial Command is a custodial inspection and management system for educational institutions. This Progressive Web App (PWA) enables mobile-first inspection workflows with offline capabilities.

**Stack**: React 18.3.1 + TypeScript 5.6.3 (frontend) | Express 4.21.2 (backend) | PostgreSQL + Drizzle ORM 0.39.1 | Railway deployment

## Essential Commands

### Development
```bash
npm run dev              # Full-stack dev (frontend :5173, backend :5000)
npm run dev:client       # Frontend only (Vite dev server)
npm run dev:server       # Backend only (Express API)
npm run check            # TypeScript type checking
```

### Database
```bash
npm run db:push          # Push Drizzle schema to database
npm run db:push-safe     # Push with error handling (safer)
npm run validate-env     # Validate DATABASE_URL and env vars
```

### Testing
```bash
npm run test:comprehensive  # Run all test suites
npm run test:e2e            # End-to-end user journeys
npm run test:security       # Security vulnerability tests
npm run test:mobile         # PWA/mobile-specific tests
npm run ui:test             # Playwright UI tests
npm run ui:test:headed      # Playwright with visible browser
```

### Building & Production
```bash
npm run build            # Production build (type checks first)
npm run start            # Start production server
npm run railway:start    # Railway deployment start
npm run start:clean      # Kill port 5000 and start fresh
```

### Analysis
```bash
npm run analyze:bundle   # Bundle size analysis
npm run lighthouse       # Performance audit
```

## Architecture

### High-Level Structure

**Full-Stack TypeScript Application**:
- **Frontend**: React SPA with lazy-loaded routes, Radix UI components, React Query for state
- **Backend**: Express MVC with business logic in `/server/controllers/`
- **Shared**: Database schema and business logic in `/shared/` (imported by both frontend/backend)
- **Module System**: ESM throughout (not CommonJS)

### Critical File Paths

**Entry Points**:
- `/server/index.ts` - Main Express server (400+ line `/server/routes.ts` defines all API endpoints)
- `/src/main.tsx` - React application entry
- `/shared/schema.ts` - **Single source of truth** for database schema (8 tables)

**Key Directories**:
- `/server/controllers/` - Business logic (MVC pattern)
- `/server/utils/` - Scoring algorithms, file upload, error handling
- `/src/pages/` - Route-level components (lazy-loaded via `/src/components/lazy-pages.tsx`)
- `/src/components/ui/` - 90+ Radix UI components
- `/src/hooks/` - 18 custom React hooks
- `/shared/` - Shared types and constants

### Database Architecture

**8 PostgreSQL Tables** (managed via Drizzle ORM in `/shared/schema.ts`):

1. **inspections** - Main inspection records
   - Supports both `single_room` and `whole_building` inspection types
   - 11 rating criteria (1-5 scale): floors, verticalHorizontalSurfaces, ceiling, restrooms, customerSatisfaction, trash, projectCleaning, activitySupport, safetyCompliance, equipment, monitoring
   - `verifiedRooms[]` array tracks completed room types in building inspections
   - `isCompleted` flag for multi-room building inspections

2. **roomInspections** - Individual rooms within building inspections
   - Links via `buildingInspectionId`
   - Same 11 rating criteria as inspections
   - Multiple rooms per building inspection

3. **custodialNotes** - Quick concern reporting
   - Minimum 10 chars, max 5000 chars validation
   - Image attachments supported

4. **monthlyFeedback** - Monthly PDF reports with extracted text

5. **inspectionPhotos** - Enhanced photo capture with GPS/indoor location tracking

6. **syncQueue** - Offline sync management (PWA functionality)
   - Retry mechanism with exponential backoff
   - Status: pending, synced, failed

7. **users** - Authentication (bcrypt password hashing)

8. **sessions** - Redis-backed session management

**Schema Pattern**: All tables use Drizzle ORM with Zod validation schemas. Type inference provides TypeScript safety throughout codebase.

### API Structure (`/server/routes.ts`)

**RESTful Endpoints** (20+ total):
- `POST /api/inspections` - Create inspection (max 5 files @ 5MB each)
- `GET /api/inspections` - List with filtering
- `PATCH /api/inspections/:id` - Update inspection
- `POST /api/room-inspections` - Create room within building inspection
- `GET /api/room-inspections/building/:id` - Get all rooms for a building
- `POST /api/custodial-notes` - Create quick concern note
- `GET /api/building-scores` - Aggregate building performance
- `GET /api/school-scores` - School-level metrics
- `GET /health` - Health check (used by Railway)

**Middleware Stack**:
- Security: Helmet.js, CORS, input sanitization
- Rate limiting: API (100/15min), Auth (20/15min strict)
- File uploads: Multer with memory buffer, image compression
- Error handling: Centralized handler with structured logging

### Frontend Architecture

**Page Components** (`/src/pages/` - 10 pages):
- `custodial-inspection.tsx` - Single room inspection form
- `whole-building-inspection.tsx` - Multi-room building inspection
- `inspection-data.tsx` - Data dashboard with filtering
- `custodial-notes.tsx` - Quick concern reporting
- `admin-inspections.tsx` - Admin management panel
- `scores-dashboard.tsx` - Analytics and performance

**State Management**:
- **Server State**: React Query (@tanstack/react-query) for API calls and caching
- **Form State**: Custom hooks (`use-building-inspection-form`, `use-room-selection`)
- **Persistence**: LocalStorage via `use-form-persistence` for offline support
- **Routing**: Wouter 3.3.5 (lightweight client-side routing)

**Performance**: All route components lazy-loaded with `React.lazy()` and Suspense for optimal bundle splitting.

## Development Patterns

### Path Aliases (tsconfig.json)
- `@/*` → `./src/*` (frontend imports)
- `@shared/*` → `./shared/*` (shared imports between frontend/backend)

### Database Changes Workflow
1. Modify schema in `/shared/schema.ts`
2. Update Zod validation schemas if needed
3. Run `npm run db:push-safe` (safer with error handling)
4. TypeScript types auto-generated from schema
5. **Never commit without testing schema changes locally first**

### Testing Strategy
- Run `npm run test:comprehensive` before major commits
- Use `npm run test:debug` for verbose output during troubleshooting
- Test reports saved to `/tests/reports/` as JSON
- Screenshots captured in `/tests/screenshots/`
- Playwright UI tests support cross-browser (Chrome, Firefox, Safari) and mobile (Pixel 7, iPhone 14)

### File Organization Conventions
- **Components**: PascalCase (e.g., `InspectionForm.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `use-mobile.tsx`)
- **Utilities**: camelCase (e.g., `api.ts`, `validation.ts`)
- **Types**: PascalCase with descriptive names

## Critical Implementation Details

### Inspection Type Logic

**Single Room Inspection**:
- Direct rating of 11 criteria for one room
- Photo capture with location tagging
- Immediate submission or auto-save draft

**Whole Building Inspection**:
- Multi-step workflow:
  1. Initial building-level assessment
  2. Room type verification (select which room types to inspect)
  3. Individual room inspections for each verified room type
  4. Aggregated scoring at building level
- `verifiedRooms[]` array tracks completion status
- `isCompleted` flag indicates all rooms inspected

**Scoring System**: 1-5 scale across 11 criteria (see schema for full list)

### Security Implementation (`/server/security.ts`)
- **Rate Limiting**: API (100 req/15min), Auth (20 req/15min strict)
- **Input Sanitization**: XSS protection, script tag removal
- **File Upload Security**: Type validation (images only), 5MB limit per file, max 5 files
- **Authentication**: Bcrypt password hashing, Redis-backed sessions
- **Headers**: Helmet.js (CSP, HSTS, X-Frame-Options)

### PWA Features
- **Service Worker**: `/public/sw.js` for offline functionality
- **Offline Sync**: `syncQueue` table with retry logic
- **Form Auto-Save**: LocalStorage persistence every 30 seconds
- **Photo Queue**: Offline photos queued and uploaded when online
- **Installation**: iOS/Android home screen installation via manifest.json

## Environment Setup

### Required Environment Variables
Create `.env` file:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=development  # or "production"
PORT=5000             # Optional (default 5000)
SESSION_SECRET=your-secret-key  # Required for production
```

**Database Providers**: Compatible with Supabase, Neon, Railway PostgreSQL, or local PostgreSQL

**Validation**: Run `npm run validate-env` to verify environment setup

## Common Tasks

### Initial Setup
```bash
git clone <repo-url>
npm install
# Create .env file with DATABASE_URL
npm run validate-env
npm run db:push
npm run dev
```

### Add New Database Field
```bash
# 1. Edit shared/schema.ts
# 2. Update Zod schemas if needed
npm run db:push-safe
npm run check  # Verify TypeScript types
```

### Debug Port Conflicts
```bash
npm run start:clean  # Kills port 5000 and restarts
```

### Pre-Deployment Checklist
```bash
npm run check                  # TypeScript validation
npm run build                  # Verify build succeeds
npm run test:comprehensive     # All tests pass
npm run validate-env           # Environment valid
npm run db:push                # Schema up to date
```

## Recent Architecture Changes

### MVC Refactor (Latest)
- Business logic extracted to `/server/controllers/`
- Configuration centralized in `/server/config/constants.ts`
- Enhanced type definitions in `/server/types/`
- Improved error handling in `/server/utils/errorHandler.ts`

### Performance Optimizations
- Lazy loading all route components via `lazy-pages.tsx`
- Client-side image compression (`src/utils/imageCompression.ts`)
- Response caching for frequently accessed data (`/server/cache.ts`)
- Bundle splitting with vendor/UI chunks

## Technology Stack

**Frontend**: React 18.3.1, TypeScript 5.6.3, Vite 6.4.1, Tailwind CSS 3.4.17, 25+ Radix UI packages, React Query 5.60.5, Wouter 3.3.5, Recharts 2.15.2, Zod 3.24.1

**Backend**: Express 4.21.2, Node.js (ESM), Drizzle ORM 0.39.1, PostgreSQL, Bcrypt 6.0.0, Helmet 8.1.0, Multer 2.0.2

**Testing**: Playwright 1.56.1, Puppeteer 24.29.1, Axe-Playwright 2.2.2, Lighthouse CI

**Deployment**: Railway platform with automated CI/CD via GitHub Actions

---

**Version**: 1.0.1
**Last Updated**: Based on commit `eb4ba1a` (MVC Architecture Refactor)
**Maintainers**: Review this file when major architectural changes occur
