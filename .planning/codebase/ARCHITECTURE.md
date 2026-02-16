# Architecture

**Analysis Date:** 2026-02-16

## Pattern Overview

**Overall:** Full-stack TypeScript application with React SPA frontend and Express API backend, following a layered architecture with clear separation of concerns.

**Key Characteristics:**
- **Monolithic Full-Stack**: Single codebase containing both frontend (`src/`) and backend (`server/`)
- **Client-Server Architecture**: React SPA consumes REST API from Express server
- **Component-Based Frontend**: Functional React components with hooks pattern
- **Layered Backend**: Middleware → Routes → Storage → Database flow
- **PWA Support**: Service Worker for offline capabilities
- **Mobile-First**: Extensive mobile optimization and touch-friendly design

## Layers

### Frontend (Presentation Layer)

**Purpose:** React SPA providing user interface and client-side logic

**Location:** `src/`

**Contains:**
- React components (functional with hooks)
- Custom hooks for state and logic
- Page-level route components
- Utility functions and helpers
- Assets and static files

**Depends on:**
- `@tanstack/react-query` - Server state management
- `wouter` - Lightweight routing
- `@radix-ui/*` - Headless UI primitives
- `zod` - Runtime validation
- Tailwind CSS - Styling

**Used by:** Browser via `index.html` entry point

---

### Shared (Domain Layer)

**Purpose:** Shared TypeScript definitions and Zod schemas used by both frontend and backend

**Location:** `shared/`

**Contains:**
- Database schema definitions (Drizzle ORM)
- Zod validation schemas
- TypeScript type definitions
- Domain model definitions

**Depends on:**
- `drizzle-orm/pg-core` - PostgreSQL table definitions
- `drizzle-zod` - Schema-to-Zod conversion
- `zod` - Schema validation

**Used by:** Frontend and Backend layers

---

### Backend (API Layer)

**Purpose:** Express.js REST API providing data persistence and business logic

**Location:** `server/`

**Contains:**
- Route handlers (`routes.ts`)
- Storage abstraction (`storage.ts`)
- Security middleware (`security.ts`, `csrf.ts`)
- Performance monitoring (`monitoring.ts`, `cache.ts`)
- Error handling (`performanceErrorHandler.ts`)
- File upload handling (`objectStorage.ts`)
- Database connection (`db.ts`)

**Depends on:**
- `express` - Web framework
- `drizzle-orm` - Database ORM
- `pg` - PostgreSQL driver
- `multer` - File upload middleware
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting

**Used by:** Frontend via REST API calls

---

### Database (Data Layer)

**Purpose:** PostgreSQL database with Drizzle ORM for data persistence

**Location:** Database connection via `DATABASE_URL` env var

**Contains:**
- Tables: `users`, `inspections`, `roomInspections`, `custodialNotes`, `monthlyFeedback`, `inspectionPhotos`, `syncQueue`
- Indexes for query optimization
- Migrations in `migrations/`

**Depends on:** PostgreSQL instance (via Railway or local)

**Used by:** Backend storage layer

## Data Flow

### Inspection Submission Flow

1. **User Input** → React components capture form data
2. **Validation** → Zod schemas validate client-side
3. **State Management** → React Query manages server state
4. **API Request** → POST `/api/inspections` with FormData
5. **Middleware** → Express validates, sanitizes, rate limits
6. **File Processing** → Multer processes uploads, ObjectStorage saves files
7. **Storage Layer** → `storage.ts` abstracts database operations
8. **Database** → Drizzle ORM persists to PostgreSQL
9. **Response** → JSON response with success/error status
10. **UI Update** → React Query invalidates/refetches cached data

### Data Fetch Flow (Inspection List)

1. **Component Mount** → React Query hook triggers
2. **Cache Check** → React Query checks local cache
3. **API Request** → GET `/api/inspections` or `/api/inspections/summary`
4. **Storage Layer** → Query executes with caching
5. **Database** → Drizzle ORM fetches from PostgreSQL
6. **Response** → JSON array returned
7. **Cache Update** → React Query updates cache
8. **UI Render** → Component displays data

### Offline PWA Flow

1. **Service Worker** → Intercepts network requests (`public/sw.js`)
2. **Network Status** → `useOfflineStatus` hook monitors connectivity
3. **Queue System** → Dexie (IndexedDB) stores pending operations
4. **Sync Queue** → `syncQueue` table tracks server-side sync status
5. **Background Sync** → Service Worker retries when online
6. **Conflict Resolution** → Timestamps and status flags manage conflicts

## Key Abstractions

### Storage Pattern

**Purpose:** Abstract database operations behind a clean interface

**Location:** `server/storage.ts`

**Pattern:** Repository pattern with caching

```typescript
export const storage = {
  // CRUD operations with caching
  getInspections(school, dateRange),
  createInspection(data),
  updateInspection(id, data),
  deleteInspection(id),
  // ...etc
}
```

**Usage:**
```typescript
// In route handler
const inspections = await storage.getInspections(school, { startDate, endDate });
```

### React Query Pattern

**Purpose:** Server state management with caching and synchronization

**Location:** `src/lib/queryClient.ts`

**Pattern:** Query/Mutation with automatic caching

```typescript
// Query for fetching data
const { data, isLoading } = useQuery({
  queryKey: ['/api/inspections', school],
  queryFn: getQueryFn({ on401: 'throw' })
});

// Mutation for updates
const mutation = useMutation({
  mutationFn: (data) => apiRequest('POST', '/api/inspections', data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/inspections'] })
});
```

### Security Middleware Pattern

**Purpose:** Layered security with multiple defense mechanisms

**Location:** `server/security.ts`, `server/csrf.ts`

**Layers (in order):**
1. Helmet (security headers)
2. Rate limiting (per-endpoint)
3. Request validation
4. Input sanitization
5. CSRF protection (state-changing routes)
6. Session authentication (admin routes)

### Circuit Breaker Pattern

**Purpose:** Fail gracefully when services are unavailable

**Location:** `server/performanceErrorHandler.ts`

**Usage:**
```typescript
app.use('/api/inspections', circuitBreakerMiddleware(databaseCircuitBreaker, 'inspections'));
```

## Entry Points

### Frontend Entry

**Location:** `src/main.tsx`

**Responsibilities:**
- Create React root
- Register service worker for PWA
- Mount `<App />` component

**Trigger:** Browser loads `index.html` → script tag executes

---

### App Component

**Location:** `src/App.tsx`

**Responsibilities:**
- Route configuration (wouter)
- Global providers (QueryClient, Router)
- Lazy load page components
- Error boundary wrapper
- Accessibility initialization

**Routes:**
- `/` → Home/dashboard
- `/custodial-inspection` → Single room inspection
- `/whole-building-inspection` → Building inspection with rooms
- `/custodial-notes` → Notes entry
- `/monthly-feedback` → PDF feedback upload
- `/inspection-data` → Data visualization
- `/scores-dashboard` → Score analytics
- `/admin-inspections` → Admin panel
- `/rating-criteria` → Rating reference

---

### Backend Entry

**Location:** `server/index.ts`

**Responsibilities:**
- Configure Express app
- Set up middleware chain (security, parsing, rate limiting)
- Register routes
- Start HTTP server
- Health check endpoints
- Graceful shutdown handling

**Trigger:** `npm run dev` or `node dist/index.js`

---

### API Routes

**Location:** `server/routes.ts`

**Responsibilities:**
- Define all API endpoints
- Route handlers for CRUD operations
- File upload handling
- Authentication endpoints

**Key Routes:**
- `POST /api/inspections` - Create inspection
- `GET /api/inspections` - List inspections
- `GET /api/inspections/summary` - Aggregated data
- `POST /api/custodial-notes` - Create note
- `POST /api/monthly-feedback` - Upload PDF
- `GET /api/health` - Health check
- `GET /api/csrf-token` - CSRF token

## Error Handling

**Strategy:** Layered with graceful degradation

**Patterns:**
1. **Frontend:** React Error Boundaries catch component errors
2. **API Client:** `throwIfResNotOk` wrapper for fetch errors
3. **Backend:** Centralized error handler middleware (last in chain)
4. **Database:** Reconnection logic with retry
5. **Storage:** `asyncErrorHandler` wrapper for route handlers
6. **Circuit Breakers:** Prevent cascade failures

**Response Format:**
```typescript
interface StandardResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  meta?: { total?, page?, pageSize? };
}
```

## Cross-Cutting Concerns

### Logging

**Location:** `server/logger.ts`

**Pattern:** Structured JSON logging with request IDs

**Usage:**
```typescript
logger.info('Operation completed', { userId, duration });
logger.error('Operation failed', { error, context });
```

### Validation

**Location:** `shared/schema.ts` (Zod schemas)

**Pattern:** Runtime validation at API boundaries

**Usage:**
```typescript
const validatedData = insertInspectionSchema.parse(req.body);
```

### Authentication

**Location:** `server/security.ts` (PasswordManager, SessionManager)

**Pattern:** Session-based auth with bcrypt password hashing

**Admin Routes:** Protected by session middleware

### Caching

**Location:** `server/cache.ts`, `server/storage.ts`

**Pattern:** Multi-level caching
- **API Cache:** In-memory request deduplication
- **Data Cache:** Redis/CacheManager for query results
- **Browser Cache:** Service Worker for assets

---

*Architecture analysis: 2026-02-16*
