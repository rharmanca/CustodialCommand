# Technology Stack

**Analysis Date:** 2026-02-16

## Languages

**Primary:**
- TypeScript 5.6.3 - Full-stack application (frontend + backend)
- JavaScript (ES2020) - Build scripts and tests

**Secondary:**
- CSS/Tailwind - Styling
- SQL - Database queries (via Drizzle ORM)

## Runtime

**Environment:**
- Node.js (latest LTS recommended)
- ES Modules (`"type": "module"` in `package.json`)

**Package Manager:**
- npm (lockfile: `package-lock.json` present)
- Dependencies: 134 packages
- DevDependencies: 28 packages

## Frameworks

**Core:**
- React 18.3.1 - Frontend UI library
- Express 4.21.2 - Backend web framework
- Vite 6.4.1 - Build tool and dev server
- Tailwind CSS 3.4.17 - Utility-first CSS framework

**Database:**
- Drizzle ORM 0.39.1 - TypeScript ORM for PostgreSQL
- Drizzle Kit 0.31.4 - Database migrations and schema management
- node-postgres (pg) 8.16.3 - PostgreSQL client

**Testing:**
- Playwright 1.56.1 - E2E testing
- Puppeteer 24.29.1 - Additional browser automation
- Node.js scripts - API/integration tests (`.test.cjs` files)

**Build/Dev:**
- esbuild 0.25.0 - Server bundling
- tsx 4.19.1 - TypeScript execution for dev server
- TypeScript 5.6.3 - Type checking

## Key Dependencies

**Critical:**
- `zod` 3.25.76 - Runtime schema validation (shared across frontend/backend)
- `drizzle-zod` 0.7.0 - Zod schema generation from Drizzle tables
- `bcrypt` 6.0.0 - Password hashing
- `express-session` 1.18.1 + `passport` 0.7.0 - Authentication
- `helmet` 8.1.0 - Security headers
- `express-rate-limit` 8.0.1 - Rate limiting

**Infrastructure:**
- `redis` 5.9.0 - Caching and session storage (optional, falls back to memory)
- `connect-redis` 9.0.0 - Redis session store
- `compression` 1.8.1 - Response compression
- `cookie-parser` 1.4.7 - Cookie parsing
- `multer` 2.0.2 - File upload handling

**Frontend UI:**
- Radix UI primitives - `@radix-ui/react-*` (30+ components)
- `framer-motion` 11.13.1 - Animations
- `react-hook-form` 7.66.0 + `@hookform/resolvers` 3.10.0 - Form handling
- `recharts` 2.15.2 - Data visualization
- `lucide-react` 0.453.0 - Icons
- `date-fns` 3.6.0 - Date utilities
- `react-webcam` 7.2.0 - Camera access

**PDF/Document Processing:**
- `jspdf` 3.0.3 + `jspdf-autotable` 5.0.2 - PDF generation
- `html2canvas` 1.4.1 - HTML to image conversion
- `xlsx` 0.20.3 (SheetJS) - Excel file processing
- Docling (external CLI tool) - PDF text extraction

**Utilities:**
- `class-variance-authority` 0.7.1 - Component variants
- `tailwind-merge` 2.6.0 - Tailwind class merging
- `clsx` 2.1.1 - Conditional class names
- `uuid` 13.0.0 - UUID generation

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Target: ES2020
- Module: ESNext with Bundler resolution
- Path aliases: `@/*` → `./src/*`, `@shared/*` → `./shared/*`
- Strict mode enabled
- JSX: react-jsx transform

**Vite:**
- Config: `vite.config.ts`
- Dev server port: 5173
- API proxy: `/api` → `http://localhost:5000`
- Build output: `dist/public`
- Code splitting enabled
- Target: es2020

**Tailwind:**
- Config: `tailwind.config.ts`
- Content: `./index.html`, `./src/**/*.{js,jsx,ts,tsx}`
- Dark mode: `"class"`
- Custom color scheme with CSS variables
- Plugins: `tailwindcss-animate`, `@tailwindcss/typography`

**PostCSS:**
- Config: `postcss.config.js`
- Plugins: `tailwindcss`, `autoprefixer`

**Database:**
- Config: `drizzle.config.ts`
- Dialect: PostgreSQL
- Schema: `./shared/schema.ts`
- Migrations: `./migrations`

**Testing:**
- Config: `playwright.config.ts`
- Test directory: `./tests`
- Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Timeout: 60s
- Retries: 2 in CI

## Platform Requirements

**Development:**
- Node.js with npm
- PostgreSQL database (local or cloud)
- Optional: Redis (falls back to memory if unavailable)
- Optional: Docling CLI tool for PDF processing

**Production:**
- **Platform:** Railway (configured via `railway.json`)
- **Database:** PostgreSQL (Railway provisioned)
- **Cache:** Redis (optional, recommended)
- **Port:** 5000 (configurable via `PORT` env var)
- **Health checks:** `/health` endpoint with 30s timeout

**Build Process:**
```bash
# Development
npm run dev          # Start dev server (port 5000)
npm run dev:client   # Start Vite dev server (port 5173)

# Production build
npm run build        # Vite build + esbuild for server
npm run start        # Production server (runs db:push first)
```

## Dependency Notes

**ESM Only:**
- All imports use ES module syntax
- `.js` extension required for relative imports (Node ESM requirement)
- `tsx` used for TypeScript execution in dev

**External Tools:**
- Docling must be installed separately for PDF processing
  - Installation: `pip install docling`
  - Used in: `server/doclingService.ts`

**Optional Dependencies:**
- Redis - Falls back to in-memory storage if `REDIS_URL` not set
- PDF tools - Graceful degradation if Docling unavailable

---

*Stack analysis: 2026-02-16*
