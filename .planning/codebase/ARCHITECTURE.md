# Architecture

**Analysis Date:** 2025-02-09

## Pattern Overview

**Overall:** Full-Stack Monolithic Application with Separation of Concerns

**Key Characteristics:**
- Client-Server architecture with shared schema definitions
- Layered backend with Express.js middleware pipeline
- Component-based React frontend with code-splitting
- Repository pattern for data access (storage layer)
- Progressive Web App (PWA) capabilities with offline support

## Layers

**Presentation Layer (Frontend):**
- Purpose: UI rendering, user interaction, state management
- Location: `src/`
- Contains: React components, pages, hooks, utilities
- Depends on: `@shared/*` for types/schemas, backend API via TanStack Query
- Used by: Browser clients

**API Layer (Backend Routes):**
- Purpose: HTTP request handling, request validation, response formatting
- Location: `server/routes.ts`, `server/controllers/`
- Contains: Express route handlers, controllers
- Depends on: storage layer, security middleware, validation schemas
- Used by: Frontend via HTTP requests

**Service Layer (Storage/Domain):**
- Purpose: Business logic, data operations, caching
- Location: `server/storage.ts`, `server/utils/`
- Contains: Storage methods, utility functions, scoring logic
- Depends on: database layer, cache manager
- Used by: Route handlers, controllers

**Data Access Layer:**
- Purpose: Database connectivity and ORM operations
- Location: `server/db.ts`
- Contains: Drizzle ORM setup, connection pooling, reconnection logic
- Depends on: PostgreSQL (Neon Database)
- Used by: storage.ts

**Shared Layer:**
- Purpose: Type definitions and validation schemas shared between frontend and backend
- Location: `shared/schema.ts`
- Contains: Zod schemas, Drizzle table definitions, TypeScript types
- Depends on: drizzle-orm, zod
- Used by: Both frontend and backend

**Middleware Layer:**
- Purpose: Cross-cutting concerns (security, logging, caching)
- Location: `server/security.ts`, `server/logger.ts`, `server/cache.ts`, `server/monitoring.ts`
- Contains: Authentication, rate limiting, CSRF protection, request logging
- Depends on: Express, Redis (optional), various security libraries
- Used by: Applied to Express app pipeline

## Data Flow

**Inspection Submission Flow:**

1. User submits inspection form (`src/pages/custodial-inspection.tsx`)
2. Form data validated with Zod schema (`shared/schema.ts`)
3. API request sent to `/api/inspections` (with CSRF token)
4. Express route handler receives request (`server/routes.ts`)
5. Multer middleware processes image uploads
6. Security middleware validates request
7. Storage layer executes database operation (`server/storage.ts`)
8. Drizzle ORM performs INSERT (`server/db.ts`)
9. Response returned to frontend
10. Cache invalidated for related queries

**Data Query Flow:**

1. Component mounts and triggers query (`src/hooks/use-api.tsx`)
2. TanStack Query checks cache
3. If cache miss, API request sent to `/api/inspections` or `/api/scores`
4. Storage layer checks Redis cache (`server/storage.ts`)
5. If cache miss, database query executed via Drizzle
6. Result cached and returned
7. Component receives and displays data

**Offline Support Flow:**

1. Service worker intercepts requests (`public/sw.js`)
2. Network-first strategy attempts live fetch
3. If offline, request queued in IndexedDB (`src/utils/offlineManager.ts`)
4. Photos stored locally (`src/utils/photoStorage.ts`)
5. When online, sync process uploads queued items
6. Cache updated with new data

## Key Abstractions

**Storage Interface:**
- Purpose: Database operations abstraction
- Examples: `server/storage.ts`
- Pattern: Repository pattern with caching wrapper
- Methods: `createInspection()`, `getInspections()`, `updateInspection()`, etc.

**Zod Schema Validation:**
- Purpose: Runtime type safety and validation
- Examples: `shared/schema.ts` - `insertInspectionSchema`, `insertCustodialNoteSchema`
- Pattern: Schema definition → type inference → runtime validation
- Usage: Backend validates incoming data, frontend validates forms

**Query Client:**
- Purpose: Server state management
- Examples: `src/lib/queryClient.ts`
- Pattern: TanStack Query with custom defaults
- Features: Automatic caching, refetching, optimistic updates

**Error Handling:**
- Purpose: Centralized error management
- Examples: `server/performanceErrorHandler.ts`, `server/utils/errorHandler.ts`
- Pattern: Middleware chain with async error wrapping
- Features: Circuit breaker, graceful degradation, structured error responses

## Entry Points

**Application Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loads HTML page
- Responsibilities:
  - Create React root
  - Register service worker for PWA
  - Import global styles
  - Mount App component

**Server Entry:**
- Location: `server/index.ts`
- Triggers: `npm start` or `npm run dev`
- Responsibilities:
  - Configure Express app with middleware
  - Set up security (helmet, rate limiting, CSRF)
  - Initialize database connection
  - Register API routes
  - Start HTTP server
  - Configure graceful shutdown

**Build Entry:**
- Location: `vite.config.ts`
- Triggers: `npm run build`
- Responsibilities:
  - Bundle React application
  - Configure path aliases (@/*)
  - Set up proxy for API during dev
  - Optimize dependencies
  - Output to `dist/public/`

**Database Entry:**
- Location: `server/db.ts`
- Triggers: Imported by storage layer
- Responsibilities:
  - Configure Neon PostgreSQL connection
  - Set up connection pooling
  - Initialize Drizzle ORM
  - Handle reconnection logic

## Error Handling

**Strategy:** Layered error handling with graceful degradation

**Patterns:**
- Express async error handling via wrapper functions
- Circuit breaker pattern for database and external services
- Structured error responses: `{ success: boolean, error: string, details?: any }`
- Client-side error boundaries in React components
- Global error logging to console and monitoring

**Server-Side:**
- `asyncErrorHandler` wraps async route handlers
- `performanceErrorHandler` middleware catches unhandled errors
- Database reconnection with exponential backoff (`withDatabaseReconnection`)

**Client-Side:**
- React Error Boundary in `App.tsx`
- TanStack Query error handling with retries
- Offline queue for failed requests

## Cross-Cutting Concerns

**Logging:**
- Approach: Structured logging with `server/logger.ts`
- Features: Request IDs, timestamps, log levels, JSON output
- Usage: All server operations log context-rich messages

**Validation:**
- Approach: Zod schemas for runtime validation
- Location: `shared/schema.ts`
- Usage: API request validation, form validation

**Authentication:**
- Approach: Session-based with Passport.js (local strategy)
- Location: `server/security.ts`
- Features: Password hashing with bcrypt, session management

**Authorization:**
- Approach: Role-based via session data
- Admin routes protected with middleware checks

**Caching:**
- Approach: Multi-level caching (Redis + in-memory)
- Location: `server/cache.ts`, `server/security.ts` (CacheManager)
- Features: Cache invalidation patterns, TTL management

**Monitoring:**
- Approach: Built-in health checks and metrics
- Location: `server/monitoring.ts`, `server/automated-monitoring.ts`
- Endpoints: `/health`, `/metrics`, `/health/metrics`, `/health/history`

**Security:**
- Approach: Defense in depth
- Features: Helmet headers, rate limiting, CSRF protection, input sanitization, SQL injection prevention via parameterized queries

---

*Architecture analysis: 2025-02-09*
