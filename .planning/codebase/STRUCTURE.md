# Codebase Structure

**Analysis Date:** 2026-02-16

## Directory Layout

```
project-root/
├── .planning/              # GSD planning artifacts
│   ├── codebase/           # Codebase documentation
│   └── phases/           # Phase tracking
├── .github/              # GitHub Actions and workflows
├── client/               # Legacy client folder (minimal use)
├── docs/                 # Documentation
│   ├── mobile-efficiency/
│   ├── monitoring/
│   ├── pdca/
│   ├── plans/
│   └── security/
├── migrations/           # Drizzle ORM database migrations
│   └── meta/
├── public/               # Static assets served directly
│   ├── fonts/
│   ├── icons/
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service Worker for offline
├── scripts/              # Utility scripts
│   └── qa/
├── server/               # Express backend
│   ├── config/
│   ├── controllers/
│   ├── types/
│   └── utils/
├── shared/                 # Shared types and schemas
├── src/                    # React frontend
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── polyfills/
│   ├── schemas/
│   ├── styles/
│   ├── types/
│   └── utils/
├── tests/                  # Test suites
│   ├── admin/
│   ├── form-testing/
│   ├── performance/
│   ├── reports/
│   ├── screenshots/
│   └── test-assets/
└── ui-tests/               # Playwright UI tests
```

## Directory Purposes

### Root Level Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript config (frontend) |
| `tsconfig.server.json` | TypeScript config (backend) |
| `vite.config.ts` | Vite build config |
| `drizzle.config.ts` | Drizzle ORM config |
| `tailwind.config.ts` | Tailwind CSS config |
| `playwright.config.ts` | Playwright test config |
| `index.html` | HTML entry point |
| `railway.json` | Railway deployment config |
| `.env.example` | Environment variable template |

---

### `src/` - Frontend Source

**Purpose:** React application source code

**Subdirectories:**

| Directory | Purpose |
|-----------|---------|
| `src/assets/` | Static images, fonts, icons |
| `src/components/` | React components |
| `src/components/charts/` | Chart/Recharts components |
| `src/components/data/` | Data visualization components |
| `src/components/dev/` | Development/debugging components |
| `src/components/errors/` | Error handling components |
| `src/components/filters/` | Filter UI components |
| `src/components/performance/` | Performance-related components |
| `src/components/reports/` | Report generation components |
| `src/components/shared/` | Shared component utilities |
| `src/components/ui/` | Radix UI component wrappers (shadcn) |
| `src/hooks/` | Custom React hooks |
| `src/lib/` | Library initialization (queryClient, utils) |
| `src/pages/` | Page-level route components |
| `src/polyfills/` | Browser compatibility polyfills |
| `src/schemas/` | Local Zod schemas (extends shared) |
| `src/styles/` | CSS and Tailwind utilities |
| `src/types/` | TypeScript type definitions |
| `src/utils/` | Utility functions |

**Key Files:**
- `src/main.tsx` - React entry point
- `src/App.tsx` - Root component with routing
- `src/index.css` - Global styles

---

### `server/` - Backend Source

**Purpose:** Express.js API server

**Subdirectories:**

| Directory | Purpose |
|-----------|---------|
| `server/config/` | Configuration constants |
| `server/controllers/` | Route controller logic |
| `server/types/` | Express type extensions |
| `server/utils/` | Server utilities (scoring, validation) |

**Key Files:**
- `server/index.ts` - Server entry point
- `server/routes.ts` - Route definitions
- `server/storage.ts` - Database abstraction layer
- `server/db.ts` - Database connection
- `server/security.ts` - Security middleware
- `server/csrf.ts` - CSRF protection
- `server/cache.ts` - Caching middleware
- `server/monitoring.ts` - Health monitoring
- `server/performanceErrorHandler.ts` - Error handling
- `server/objectStorage.ts` - File upload/storage
- `server/logger.ts` - Structured logging
- `server/doclingService.ts` - PDF text extraction

---

### `shared/` - Shared Code

**Purpose:** Code shared between frontend and backend

**Files:**
- `shared/schema.ts` - Database schema + Zod schemas
- `shared/custodial-criteria.ts` - Rating criteria definitions

---

### `tests/` - Test Suites

**Purpose:** Automated testing

**Subdirectories:**

| Directory | Purpose |
|-----------|---------|
| `tests/admin/` | Admin panel tests |
| `tests/form-testing/` | Form validation tests |
| `tests/performance/` | Performance/load tests |
| `tests/reports/` | Report generation tests |
| `tests/screenshots/` | Visual regression test outputs |
| `tests/test-assets/` | Test data and fixtures |

**Key Files:**
- `tests/run-all-tests.cjs` - Test runner
- `tests/e2e-user-journey.test.cjs` - E2E tests
- `tests/comprehensive-form-testing.cjs` - Form tests
- `tests/mobile-pwa.test.cjs` - Mobile/PWA tests

---

### `public/` - Static Assets

**Purpose:** Files served directly without processing

**Contents:**
- `public/fonts/` - Web fonts
- `public/icon-*.svg` - PWA icons
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service Worker

---

### `migrations/` - Database Migrations

**Purpose:** Drizzle ORM migration files

**Structure:**
- `migrations/meta/` - Migration metadata
- `migrations/*.sql` - SQL migration files

---

## Key File Locations

### Entry Points

| Purpose | Location |
|---------|----------|
| Frontend Entry | `src/main.tsx` |
| Backend Entry | `server/index.ts` |
| HTML Entry | `index.html` |
| Service Worker | `public/sw.js` |

---

### Configuration

| Purpose | Location |
|---------|----------|
| Vite Config | `vite.config.ts` |
| Tailwind Config | `tailwind.config.ts` |
| Drizzle Config | `drizzle.config.ts` |
| TypeScript (Frontend) | `tsconfig.json` |
| TypeScript (Backend) | `tsconfig.server.json` |
| Playwright Config | `playwright.config.ts` |
| PostCSS Config | `postcss.config.js` |

---

### Core Logic

| Purpose | Location |
|---------|----------|
| Database Schema | `shared/schema.ts` |
| Storage Layer | `server/storage.ts` |
| Route Handlers | `server/routes.ts` |
| Query Client | `src/lib/queryClient.ts` |
| Security Middleware | `server/security.ts` |
| Scoring Logic | `server/utils/scoring.ts` |

---

### Testing

| Purpose | Location |
|---------|----------|
| Playwright Config | `playwright.config.ts` |
| E2E Tests | `tests/e2e-user-journey.test.cjs` |
| UI Tests | `ui-tests/*.spec.ts` |
| Test Runner | `tests/run-all-tests.cjs` |
| Test Utilities | `tests/comprehensive-test.cjs` |

---

## Naming Conventions

### Files

| Pattern | Example | Usage |
|---------|---------|-------|
| `*.ts` | `utils.ts` | Utilities, types, configs |
| `*.tsx` | `App.tsx` | React components |
| `*.test.ts` | `security.test.cjs` | Test files (Node scripts) |
| `*.spec.ts` | `example.spec.ts` | Playwright UI tests |
| `*.cjs` | `test.cjs` | CommonJS for Node scripts |
| `*.mjs` | `script.mjs` | ES Modules for Node scripts |
| `kebab-case.ts` | `auto-save-indicator.tsx` | Component files |
| `PascalCase.tsx` | `App.tsx` | Component files (main) |
| `camelCase.ts` | `queryClient.ts` | Utilities, configs |
| `SCREAMING_SNAKE.ts` | `CONSTANTS.ts` | Constants (rare) |

### Directories

| Pattern | Example | Usage |
|---------|---------|-------|
| `kebab-case/` | `form-testing/` | Test directories |
| `camelCase/` | `components/` | Source directories |
| `lowercase/` | `server/`, `src/`, `shared/` | Root directories |

---

## Where to Add New Code

### New Feature (Frontend)

| Component | Location |
|-----------|----------|
| Page Component | `src/pages/{feature-name}.tsx` |
| Reusable Components | `src/components/{feature}/` |
| Custom Hooks | `src/hooks/use-{feature}.tsx` |
| Utilities | `src/utils/{feature}.ts` |
| Styles | `src/styles/{feature}.css` |
| Types | `src/types/{feature}.ts` |

### New Feature (Backend)

| Component | Location |
|-----------|----------|
| Route Handlers | `server/routes.ts` (add to registerRoutes) |
| Storage Methods | `server/storage.ts` (add to storage object) |
| Controller Logic | `server/controllers/{feature}Controller.ts` |
| Utilities | `server/utils/{feature}.ts` |
| Middleware | `server/{feature}.ts` |

### New API Endpoint

Add to `server/routes.ts` in `registerRoutes`:

```typescript
// GET /api/{resource}
app.get("/api/{resource}", async (req, res) => {
  const data = await storage.get{Resource}();
  res.json({ success: true, data });
});

// POST /api/{resource}
app.post("/api/{resource}", async (req, res) => {
  const validated = insert{Resource}Schema.parse(req.body);
  const result = await storage.create{Resource}(validated);
  res.json({ success: true, data: result });
});
```

### New Database Table

Add to `shared/schema.ts`:

```typescript
export const {tableName} = pgTable("{table_name}", {
  id: serial("id").primaryKey(),
  // ... columns
}, (table) => ({
  // ... indexes
}));

export const insert{TableName}Schema = createInsertSchema({tableName}).omit({
  id: true,
  createdAt: true,
});

export type Insert{TableName} = z.infer<typeof insert{TableName}Schema>;
export type {TableName} = typeof {tableName}.$inferSelect;
```

### New Component

Create in `src/components/{category}/`:

```typescript
// src/components/{category}/{ComponentName}.tsx
import React from 'react';

export function {ComponentName}({ prop1, prop2 }: { prop1: string; prop2: number }) {
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

### New Hook

Create in `src/hooks/`:

```typescript
// src/hooks/use-{feature}.tsx
import { useState, useEffect } from 'react';

export function use{Feature}() {
  const [state, setState] = useState(null);
  // ... logic
  return { state, setState };
}
```

---

## Special Directories

### `public/`

**Purpose:** Static assets served directly
**Generated:** No (manual)
**Committed:** Yes

**Rules:**
- Files here are copied as-is to `dist/` during build
- Do NOT put source files here (they won't be processed)
- Good for: icons, fonts, service worker, manifest.json

### `dist/`

**Purpose:** Build output directory
**Generated:** Yes (by `npm run build`)
**Committed:** No (in `.gitignore`)

**Structure:**
- `dist/index.js` - Built server
- `dist/public/` - Built frontend assets
- `dist/package.json` - Copied from root

### `migrations/`

**Purpose:** Database migrations
**Generated:** Yes (by `drizzle-kit`)
**Committed:** Yes

**Rules:**
- Generated via `npm run db:push` or `drizzle-kit generate`
- Never edit migration files manually
- Always review before committing

### `.vite/`

**Purpose:** Vite cache
**Generated:** Yes
**Committed:** No

### `node_modules/`

**Purpose:** Dependencies
**Generated:** Yes (by `npm install`)
**Committed:** No

---

## Path Aliases

Configured in `tsconfig.json`:

| Alias | Resolves To |
|-------|-------------|
| `@/*` | `./src/*` |
| `@assets/*` | `./src/assets/*` |
| `@shared/*` | `./shared/*` |

**Usage:**
```typescript
import { Button } from '@/components/ui/button';
import { queryClient } from '@/lib/queryClient';
import { insertInspectionSchema } from '@shared/schema';
```

---

*Structure analysis: 2026-02-16*
