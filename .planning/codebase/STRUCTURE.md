# Codebase Structure

**Analysis Date:** 2025-02-09

## Directory Layout

```
[custodial-command]/
├── src/                      # React frontend source
│   ├── components/           # React components
│   │   ├── charts/          # Data visualization components
│   │   ├── data/            # Data display components
│   │   ├── dev/             # Development/debug components
│   │   ├── errors/          # Error handling components
│   │   ├── filters/         # Filter UI components
│   │   ├── performance/     # Performance optimization components
│   │   ├── reports/         # Report generation components
│   │   ├── shared/          # Shared component utilities
│   │   └── ui/              # UI primitive components (shadcn/radix)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Library configuration (TanStack Query, utils)
│   ├── pages/               # Page-level components (routes)
│   ├── schemas/             # Zod schemas (deprecated - use shared/)
│   ├── styles/              # Global styles and CSS
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── server/                   # Express backend
│   ├── config/              # Server configuration constants
│   ├── controllers/         # Route controllers (handlers)
│   ├── types/               # Server-specific TypeScript types
│   └── utils/               # Server utilities (scoring, file upload, etc.)
├── shared/                   # Shared between frontend and backend
│   └── schema.ts            # Zod schemas and Drizzle table definitions
├── client/                   # Client-side utilities (minimal)
│   └── src/                 # Additional client source
├── tests/                    # Test suites
│   ├── performance/         # Performance test results
│   ├── reports/             # Test reports
│   └── screenshots/         # Test screenshots
├── public/                   # Static assets served directly
│   └── fonts/               # Font files
├── scripts/                  # Utility scripts
│   └── qa/                  # QA automation scripts
├── docs/                     # Documentation
│   ├── mobile-efficiency/   # Mobile optimization docs
│   ├── pdca/                # PDCA improvement docs
│   └── security/            # Security documentation
├── migrations/               # Database migrations (Drizzle)
│   └── meta/                # Migration metadata
├── .planning/               # Project planning documents
│   └── codebase/            # Codebase analysis documents
└── dist/                    # Build output (generated)
    └── public/              # Bundled frontend assets
```

## Directory Purposes

**`src/` (Frontend):**
- Purpose: React application source code
- Contains: Components, pages, hooks, utilities, styles
- Key files: `App.tsx`, `main.tsx`

**`src/components/`:**
- Purpose: Reusable React components
- Subdirectories organize by function:
  - `ui/` - shadcn/ui components built on Radix UI primitives
  - `charts/` - Recharts-based data visualizations
  - `filters/` - Advanced filtering UI
  - `dev/` - Development tools and demos

**`src/pages/`:**
- Purpose: Page-level route components
- Pattern: Each file represents a route (e.g., `custodial-inspection.tsx`)
- Lazy-loaded in `App.tsx` for code splitting

**`src/hooks/`:**
- Purpose: Custom React hooks for shared logic
- Examples: `usePhotoCapture.ts`, `useOfflineManager.ts`, `use-toast.ts`

**`src/utils/`:**
- Purpose: Pure utility functions
- Examples: `api.ts` (API client), `photoStorage.ts`, `offlineManager.ts`

**`server/` (Backend):**
- Purpose: Express.js API server
- Contains: Route handlers, middleware, database logic
- Key files: `index.ts` (entry), `routes.ts` (API routes), `storage.ts` (data layer)

**`server/controllers/`:**
- Purpose: Route controller functions (extracted from routes.ts)
- Current: `inspectionController.ts`
- Pattern: Each controller handles a specific resource

**`server/utils/`:**
- Purpose: Server-specific utilities
- Examples: `scoring.ts` (score calculations), `fileUpload.ts`, `pathValidation.ts`

**`shared/`:**
- Purpose: Code shared between frontend and backend
- Critical file: `schema.ts` - single source of truth for data shapes
- Contains: Drizzle table definitions, Zod schemas, derived types

**`public/`:**
- Purpose: Static assets served directly
- Contains: Fonts, service worker (at root), manifest.json

**`migrations/`:**
- Purpose: Database schema migrations
- Tool: Drizzle Kit

**`tests/`:**
- Purpose: Test suites and results
- Types: e2e, performance, security, mobile PWA tests

## Key File Locations

**Entry Points:**
- Frontend: `src/main.tsx` - React app bootstrap
- Backend: `server/index.ts` - Express server startup
- Shared: `shared/schema.ts` - Type/schema definitions

**Configuration:**
- Vite: `vite.config.ts` - Build configuration, aliases, dev server
- TypeScript: `tsconfig.json` - TypeScript compiler settings
- Database: `drizzle.config.ts` - Drizzle ORM configuration
- Tailwind: `tailwind.config.ts` - CSS framework configuration
- Playwright: `playwright.config.ts` - E2E test configuration

**Core Logic:**
- App root: `src/App.tsx` - Main application component with routing
- API routes: `server/routes.ts` - All API endpoint definitions
- Storage layer: `server/storage.ts` - Database operations with caching
- Database: `server/db.ts` - Drizzle ORM and connection pooling

**Security:**
- Security middleware: `server/security.ts` - Authentication, rate limiting
- CSRF protection: `server/csrf.ts` - Token generation and validation
- Error handling: `server/performanceErrorHandler.ts` - Error middleware

**Testing:**
- E2E tests: `tests/e2e-user-journey.test.cjs`
- All tests: `tests/run-all-tests.cjs`

## Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `PhotoCapture.tsx`)
- Pages: `kebab-case.tsx` (e.g., `custodial-inspection.tsx`)
- Utilities/Hooks: `camelCase.ts` (e.g., `usePhotoCapture.ts`)
- Styles: `kebab-case.css` (e.g., `android-fixes.css`)
- Server files: `camelCase.ts` (e.g., `storage.ts`)

**Directories:**
- All lowercase with hyphens: `components/`, `ui/`, `custodial-notes/`

**Path Aliases:**
- `@/*` → `src/*` (frontend)
- `@assets/*` → `src/assets/*`
- `@shared/*` → `shared/*` (both frontend and backend)

## Where to Add New Code

**New Feature:**
- Page component: `src/pages/{feature-name}.tsx`
- API routes: Add to `server/routes.ts` or create controller in `server/controllers/`
- Database operations: Add to `server/storage.ts`
- Types/Schemas: Add to `shared/schema.ts`

**New Component:**
- UI primitive: `src/components/ui/{ComponentName}.tsx`
- Feature component: `src/components/{feature}/{ComponentName}.tsx`
- Page component: `src/pages/{page-name}.tsx`

**New Hook:**
- Location: `src/hooks/use{HookName}.ts`
- Pattern: Follow existing hook patterns with TypeScript types

**New Utility:**
- Frontend: `src/utils/{utilityName}.ts`
- Backend: `server/utils/{utilityName}.ts`

**New API Endpoint:**
- Route definition: `server/routes.ts` (find appropriate section)
- Controller logic: `server/controllers/{resource}Controller.ts` (if complex)
- Storage method: `server/storage.ts` (add corresponding method)

**Database Changes:**
1. Update schema in `shared/schema.ts`
2. Run `npm run db:push` to apply migrations
3. Update storage methods in `server/storage.ts` if needed

## Special Directories

**`dist/`:**
- Purpose: Production build output
- Generated: Yes (by `npm run build`)
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**`.planning/`:**
- Purpose: Project planning and documentation
- Committed: Yes
- Contains: Research, codebase analysis, task tracking

**`migrations/meta/`:**
- Purpose: Drizzle migration state
- Generated: Yes
- Committed: Yes (tracks migration history)

---

*Structure analysis: 2025-02-09*
