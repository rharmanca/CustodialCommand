# External Integrations

**Analysis Date:** 2026-02-16

## APIs & External Services

**No Third-Party APIs:**
This application does not integrate with external APIs such as Stripe, SendGrid, Twilio, AWS SDK, or Supabase. All functionality is self-contained or uses local/self-hosted solutions.

**Docling (PDF Processing):**
- Service: Docling CLI tool
- Purpose: Extract text from PDF files (monthly feedback)
- Integration: Local shell execution via `child_process.exec`
- File: `server/doclingService.ts`
- Command: `docling "<pdf-path>" --output "<output-dir>"`
- Note: Must be installed separately (`pip install docling`)
- Fallback: Returns `null` if Docling unavailable

## Data Storage

**Primary Database - PostgreSQL:**
- Type: PostgreSQL (via node-postgres)
- Connection: `DATABASE_URL` environment variable
- Client: `pg` npm package (8.16.3)
- ORM: Drizzle ORM (0.39.1)
- Schema: `shared/schema.ts`

**Database Configuration:**
```typescript
// server/db.ts
- Pool size: 10 connections (production/Railway)
- Idle timeout: 10 seconds
- Connection timeout: 5 seconds
- SSL: Enabled if `sslmode=require` in URL
```

**Tables:**
- `users` - Admin user accounts
- `inspections` - Custodial inspection records
- `room_inspections` - Individual room inspections (building inspections)
- `custodial_notes` - General custodial notes
- `monthly_feedback` - Monthly PDF feedback uploads
- `inspection_photos` - Photo metadata with location data
- `sync_queue` - Offline sync queue for photos

**Caching - Redis (Optional):**
- Service: Redis
- Connection: `REDIS_URL` environment variable (optional)
- Client: `redis` npm package (5.9.0)
- Fallback: In-memory storage if Redis unavailable

**Cache Usage:**
- API response caching (GET endpoints)
- Session storage (when Redis available)
- Cache TTL: 1-5 minutes depending on endpoint

**File Storage - Local Filesystem:**
- Location: `./uploads/` directory
- Service: Custom `ObjectStorageService`
- File: `server/objectStorage.ts`
- Supported: Image files (inspection photos, monthly feedback)
- Path validation: Prevents directory traversal attacks
- Max file size: 5MB per file, 5 files per upload

## Authentication & Identity

**Session-Based Authentication:**
- Type: Custom session-based (not OAuth/SAML)
- Framework: `express-session` + `passport-local`
- Storage: Redis (production) or MemoryStore (fallback)
- Password Hashing: bcrypt (12 rounds)

**Authentication Flow:**
1. POST `/api/admin/login` - Username/password validation
2. Session created with `SESSION_SECRET`
3. CSRF token generated for state-changing requests
4. Session persisted in Redis or memory

**Admin Credentials:**
- Source: Environment variables
- Username: `ADMIN_USERNAME`
- Password Hash: `ADMIN_PASSWORD_HASH` (bcrypt)

**CSRF Protection:**
- Implementation: Double-submit cookie pattern
- File: `server/csrf.ts`
- Token endpoint: GET `/api/csrf-token`
- Applied to: All state-changing API routes (`POST`, `PUT`, `DELETE`)

## Monitoring & Observability

**Health Checks:**
- Endpoint: `GET /health`
- Checks: Database connectivity, Redis status, memory usage
- Frequency: Every minute (automated)
- Timeout: 5 seconds per check

**Metrics Endpoints:**
- `GET /metrics` - Application metrics
- `GET /health/metrics` - Current health status
- `GET /health/history` - Historical health data
- `GET /health/alerts` - Active alerts

**Automated Monitoring:**
- Implementation: `AutomatedMonitoringService`
- File: `server/automated-monitoring.ts`
- Features:
  - Periodic health checks (1-minute intervals)
  - Performance degradation detection
  - Memory usage alerts (>85% warning, >95% critical)
  - Response time monitoring (>3s warning, >5s critical)
  - Error rate tracking (>5% critical)
  - Automatic recovery attempts (garbage collection)

**Logging:**
- Implementation: Custom `Logger` class
- File: `server/logger.ts`
- Output: JSON (production) or formatted console (development)
- Features: Request correlation IDs, async context tracking
- Level: Configurable via `LOG_LEVEL` env var

**No External Monitoring Services:**
- No Sentry, DataDog, New Relic, or similar services integrated
- All monitoring is self-hosted via the application

## CI/CD & Deployment

**Hosting Platform - Railway:**
- Platform: Railway.app
- Config: `railway.json`
- Builder: Nixpacks
- Build command: `npm run build`
- Start command: `npm run railway:start`

**Deployment Configuration:**
```json
{
  "healthcheckPath": "/health",
  "healthcheckTimeout": 30000,
  "restartPolicyType": "ON_FAILURE",
  "restartPolicyMaxRetries": 10,
  "numReplicas": 1
}
```

**Development Environment - Replit:**
- Configured for Replit hosting (evidenced by `REPL_SLUG` checks)
- Special CSP handling for iframe embedding
- Trust proxy settings for Replit environment

**No CI/CD Pipeline:**
- No GitHub Actions, Jenkins, or similar CI/CD detected
- Deployment appears to be manual or via Railway's git integration

## Environment Configuration

**Required Environment Variables:**
```bash
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=<64-character-hex-string>
PORT=5000  # Optional, defaults to 5000
```

**Production-Required Variables:**
```bash
ADMIN_USERNAME=<admin-username>
ADMIN_PASSWORD_HASH=<bcrypt-hash>
```

**Optional Environment Variables:**
```bash
REDIS_URL=redis://username:password@host:port
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
NODE_ENV=production|development
```

**Railway-Specific Variables:**
```bash
RAILWAY_ENVIRONMENT=production
RAILWAY_SERVICE_ID=<service-id>
RAILWAY_REGION=<region>
RAILWAY_PROJECT_ID=<project-id>
```

**Secrets Location:**
- `.env` file (not committed - in `.gitignore`)
- Railway environment variables (production)
- `.env.example` provides template

## Webhooks & Callbacks

**Incoming:**
None. No webhook endpoints configured for external services.

**Outgoing:**
None. No webhook callbacks to external services.

## Security Integrations

**Security Headers (Helmet):**
- Content Security Policy (CSP) - production only
- HSTS - production only
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

**Rate Limiting:**
- General API: 60 requests per 15 minutes (production: 100)
- Strict (auth): 10-20 requests per 15 minutes
- Health checks: 100 requests per 15 minutes
- Photo uploads: 10 requests per 15 minutes

**CORS:**
- Not explicitly configured
- Same-origin policy enforced by default
- Replit iframe embedding handled specially

---

*Integration audit: 2026-02-16*
