# Technology Stack

**Analysis Date:** 2026-02-09

## Languages

**Primary:**
- **TypeScript** (strict mode enabled) - Used for all frontend React components, backend Express server, and shared types
- **JavaScript** - Used for test suites (`.cjs` files)

**Secondary:**
- **CSS** - Tailwind CSS for styling with custom CSS variables for theming
- **HTML** - Single-page application entry point with PWA meta tags

## Runtime

**Environment:**
- **Node.js** - ES2020 target with ESNext modules

**Package Manager:**
- **npm** - Standard npm with lockfile present (`package-lock.json`)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- **React 18.3.1** - UI library with hooks-based functional components
- **Express 4.21.2** - Backend HTTP server framework
- **Drizzle ORM 0.39.1** - Type-safe SQL-like ORM for database operations

**UI Components:**
- **Radix UI** - Headless UI primitives (dialog, select, checkbox, etc.)
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **class-variance-authority** - Component variant management
- **tailwind-merge + clsx** - Conditional class merging

**Forms & Validation:**
- **React Hook Form 7.66.0** - Form state management
- **Zod 3.25.76** - Schema validation with TypeScript inference
- **drizzle-zod 0.7.0** - Zod schemas from Drizzle tables

**Build & Dev:**
- **Vite 6.4.1** - Frontend build tool and dev server
- **esbuild 0.25.0** - Server bundling for production
- **tsx 4.19.1** - TypeScript execution for development

**Testing:**
- **Playwright 1.56.1** - E2E testing framework (cross-browser)
- **Node.js test scripts** - Custom test suites for API/performance/security

## Key Dependencies

**Critical:**
- `@neondatabase/serverless 0.10.4` - PostgreSQL connection driver (Neon serverless)
- `pg 8.16.3` - PostgreSQL client with connection pooling
- `drizzle-orm 0.39.1` - Database ORM (core data layer)
- `bcrypt 6.0.0` - Password hashing for admin authentication
- `express-session 1.18.1` - Session management
- `helmet 8.1.0` - Security headers middleware
- `express-rate-limit 8.0.1` - API rate limiting
- `multer 2.0.2` - File upload handling (images, PDFs)

**State & Data:**
- `@tanstack/react-query 5.60.5` - Server state management with caching
- `wouter 3.3.5` - Lightweight routing for React
- `zustand` - Not explicitly listed but React Query handles most state

**Utilities:**
- `date-fns 3.6.0` - Date manipulation
- `uuid 13.0.0` - UUID generation
- `lucide-react 0.453.0` - Icon library

**PDF & Document Processing:**
- `jspdf 3.0.3` + `jspdf-autotable 5.0.2` - PDF generation
- `html2canvas 1.4.1` - HTML to canvas conversion
- `xlsx` (SheetJS) - Excel file processing
- `pdf-parse` - PDF text extraction (dev dependency)

**PWA & Offline:**
- `dexie 4.2.1` - IndexedDB wrapper for offline storage
- Service Worker at `/public/sw.js` - Offline capabilities

**Animation & UX:**
- `framer-motion 11.13.1` - Animations and transitions
- `@use-gesture/react 10.3.1` - Touch gesture handling
- `embla-carousel-react 8.6.0` - Carousels

## Configuration

**TypeScript Configuration:**
- `tsconfig.json` - Frontend/client configuration
- `tsconfig.node.json` - Node.js tooling configuration
- `tsconfig.server.json` - Server-specific configuration

**Path Aliases:**
- `@/*` → `./src/*` (frontend source)
- `@assets/*` → `./src/assets/*` (static assets)
- `@shared/*` → `./shared/*` (shared types/schemas)

**Build:**
- `vite.config.ts` - Vite configuration with React plugin, path aliases, and optimizations
- `drizzle.config.ts` - Database migration configuration
- `tailwind.config.ts` - Tailwind CSS with custom theme colors
- `postcss.config.js` - PostCSS with autoprefixer

**Environment:**
- `.env.example` - Template for required environment variables
- Environment variables loaded via `dotenv` package

## Platform Requirements

**Development:**
- Node.js with ES module support
- PostgreSQL database (Neon recommended)
- Redis (optional, falls back to memory)

**Production:**
- **Railway.app** - Primary deployment platform (configured in `railway.json`)
- Port 5000 (configurable via `PORT` env var)
- Health check endpoint: `/health`

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - 64-character hex secret for sessions
- `ADMIN_USERNAME` - Admin login username
- `ADMIN_PASSWORD_HASH` - bcrypt-hashed admin password
- `PORT` - Server port (default: 5000)

**Optional Environment Variables:**
- `REDIS_URL` - Redis connection for session/cache
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS` - Rate limit max requests
- `LOG_LEVEL` - Logging verbosity

## Scripts

**Development:**
```bash
npm run dev              # Start dev server (frontend + backend on :5000)
npm run dev:server       # Backend only
npm run dev:client       # Frontend only (Vite on :5173)
```

**Build:**
```bash
npm run check            # TypeScript type checking
npm run build            # Production build (runs check first)
```

**Database:**
```bash
npm run db:push          # Push schema changes to database
npm run db:push-safe     # Push with error handling
```

**Testing:**
```bash
npm run test:comprehensive   # Run all test suites
npm run test:e2e            # End-to-end user journey tests
npm run test:performance    # Performance tests
npm run test:security       # Security tests
npm run test:mobile         # Mobile/PWA tests
npm run ui:test             # Playwright UI tests
```

**Monitoring:**
```bash
npm run monitor           # Health monitoring
npm run monitor:watch     # Continuous monitoring
```

---

*Stack analysis: 2026-02-09*
