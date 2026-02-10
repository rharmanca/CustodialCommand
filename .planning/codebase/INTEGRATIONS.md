# External Integrations

**Analysis Date:** 2026-02-09

## APIs & External Services

**PDF Processing:**
- **Docling** - Document understanding and PDF text extraction
  - Implementation: `server/doclingService.ts`
  - Usage: Extracts text from uploaded monthly feedback PDFs
  - Command-line tool invoked via `child_process.exec`
  - Output format: Markdown

**No other external APIs detected** - The application is self-contained with no third-party SaaS integrations for:
- No payment processors (Stripe, etc.)
- No email services (SendGrid, AWS SES, etc.)
- No SMS services (Twilio, etc.)
- No analytics (Google Analytics, Mixpanel, etc.)
- No error tracking (Sentry, etc.)

## Data Storage

**Primary Database:**
- **PostgreSQL via Neon** - Serverless PostgreSQL hosting
  - Driver: `@neondatabase/serverless 0.10.4`
  - Connection: `DATABASE_URL` environment variable
  - ORM: Drizzle ORM with connection pooling via `pg` Pool
  - Schema: `shared/schema.ts` defines all tables

**Tables:**
- `users` - Admin authentication
- `inspections` - Building inspection records
- `roomInspections` - Individual room inspections within buildings
- `custodialNotes` - General custodial notes
- `monthlyFeedback` - Monthly feedback PDF uploads with extracted text
- `inspectionPhotos` - Photo metadata with location/exif data
- `syncQueue` - Offline sync queue for pending operations

**File Storage:**
- **Local filesystem via ObjectStorageService** - `server/objectStorage.ts`
  - Location: `uploads/` directory in project root
  - Organized by category: `inspections/`, `custodial-notes/`, `room-inspections/`, `monthly-feedback/`
  - Path validation prevents directory traversal attacks
  - 5MB limit for images, 10MB for PDFs

**No cloud object storage** (S3, Cloudflare R2, etc.) - all files stored locally

**Caching:**
- **Redis** (optional) - Session and cache storage
  - Connection: `REDIS_URL` environment variable
  - Fallback: In-memory Map storage (not recommended for production)
  - Circuit breaker pattern for Redis failures
  - Implementation: `server/security.ts` (CacheManager class)

**Local API Caching:**
- **In-memory APICache** - `server/cache.ts`
  - Per-request caching for GET endpoints
  - TTL varies by endpoint (1-5 minutes)
  - LRU eviction at 1000 entries

## Authentication & Identity

**Auth Provider:**
- **Custom session-based authentication** (no OAuth/SAML)
  - Username/password stored in environment variables
  - Password hashing: bcrypt with 12 salt rounds
  - Session storage: Redis (preferred) or memory fallback
  - Session TTL: 24 hours with 30-minute inactivity timeout
  - CSRF protection enabled on all state-changing routes

**Implementation files:**
- `server/security.ts` - PasswordManager, SessionManager, CSRF protection
- `server/csrf.ts` - CSRF token generation and validation

**Admin Login Endpoint:**
- `POST /api/admin/login` - Returns session token
- `GET /api/csrf-token` - Get CSRF token for forms

**Session Validation Middleware:**
- `validateAdminSession` - Applied to all admin routes
- Token passed via `Authorization: Bearer <token>` header

## Monitoring & Observability

**Error Tracking:**
- **None** - No external error tracking service (Sentry, Rollbar, etc.)
- Errors logged to console via custom logger

**Logging:**
- **Custom logger** - `server/logger.ts`
  - Structured logging with timestamps
  - Request ID tracking via `requestIdMiddleware`
  - Log levels: debug, info, warn, error
  - No external log aggregation (Datadog, LogDNA, etc.)

**Health Monitoring:**
- **Automated monitoring** - `server/automated-monitoring.ts`
  - Tracks request duration and error rates
  - Active alerts stored in memory
  - Health history maintained (configurable limit)

**Metrics Endpoints:**
- `GET /health` - Basic health check with database connectivity
- `GET /health/metrics` - Current health status with alerts
- `GET /health/history` - Historical health data
- `GET /health/alerts` - Active alerts
- `GET /metrics` - Application metrics with Railway metadata
- `GET /api/performance/stats` - Performance statistics

## CI/CD & Deployment

**Hosting:**
- **Railway.app** - Primary deployment platform
  - Configuration: `railway.json`
  - Builder: Nixpacks
  - Build command: `npm run build`
  - Start command: `npm run railway:start`
  - Health check: `/health` endpoint with 30s timeout
  - Restart policy: ON_FAILURE with max 10 retries

**Alternative Platform:**
- **Replit** - Development environment support
  - Environment detection via `REPL_SLUG` variable
  - Special iframe embedding headers for Replit

**CI Pipeline:**
- **None detected** - No GitHub Actions, Travis CI, or similar
- Deployment appears to be manual or via Railway's Git integration

**Testing in CI:**
- Playwright tests can run against deployed URL (`TEST_URL` env var)
- Default test target: `https://cacustodialcommand.up.railway.app`

## Environment Configuration

**Required Environment Variables:**
```bash
DATABASE_URL=postgresql://username:password@hostname:port/database
SESSION_SECRET=your-64-character-session-secret-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$... # bcrypt hash
PORT=5000
```

**Optional Environment Variables:**
```bash
REDIS_URL=redis://username:password@hostname:port
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
NODE_ENV=production
```

**Railway-Specific Variables:**
- `RAILWAY_SERVICE_ID` - Auto-populated
- `RAILWAY_ENVIRONMENT` - Auto-populated
- `RAILWAY_REGION` - Auto-populated
- `RAILWAY_PROJECT_ID` - Auto-populated

**Secrets Location:**
- Environment variables only
- `.env` file for local development (gitignored)
- `.env.example` documents required variables
- No secrets management service (Vault, AWS Secrets Manager, etc.)

## Webhooks & Callbacks

**Incoming Webhooks:**
- **None** - No incoming webhook endpoints

**Outgoing Webhooks:**
- **None** - No outgoing webhook notifications

## Security Integrations

**Security Middleware:**
- **Helmet** - Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **express-rate-limit** - API rate limiting with different tiers
- **CSRF protection** - Double-submit cookie pattern
- **Input sanitization** - XSS protection via `sanitizeInput` middleware

**No external security services:**
- No Web Application Firewall (Cloudflare, AWS WAF)
- No DDoS protection service
- No bot detection (reCAPTCHA, hCaptcha)
- No vulnerability scanning integration

## Offline/PWA Capabilities

**Service Worker:**
- Location: `public/sw.js`
- Provides offline capability for PWA
- Periodic update checks every 5 minutes

**IndexedDB:**
- **Dexie.js** - Wrapper for offline data storage
- Used for offline form persistence and photo queue

**Sync Queue:**
- Database table: `syncQueue`
- Handles offline photo uploads and inspection updates
- Retry mechanism with exponential backoff

## Summary

This is a **self-contained application** with minimal external dependencies:

| Category | Integration | Notes |
|----------|-------------|-------|
| Database | Neon PostgreSQL | Primary data store |
| Cache | Redis (optional) | Sessions and caching |
| File Storage | Local filesystem | No cloud storage |
| Auth | Custom | Environment-based admin only |
| PDF Processing | Docling CLI | Local document extraction |
| Deployment | Railway.app | Primary hosting |
| Monitoring | Custom | No external services |
| Email | None | No email capability |
| Payments | None | No payment processing |

---

*Integration audit: 2026-02-09*
