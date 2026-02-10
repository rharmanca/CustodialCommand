# Codebase Concerns

**Analysis Date:** 2025-02-09

## Tech Debt

### In-Memory Storage for Critical Security Components
- **Issue:** CSRF tokens, admin sessions, and cache use in-memory Map storage without Redis
- **Files:** `server/csrf.ts` (line 13), `server/security.ts` (line 361), `server/security.ts` (line 684)
- **Impact:** Sessions lost on server restart; not scalable; security risk in production
- **Fix approach:** Implement Redis-backed storage consistently across all security components

### Console Logging in Production Code
- **Issue:** Multiple `console.log/warn/error` statements throughout frontend code
- **Files:** `src/utils/csrf.ts` (lines 37, 41, 72, 97), `src/utils/SafeLocalStorage.ts`, test files
- **Impact:** Information leakage in production builds; debugging noise
- **Fix approach:** Replace with structured logger; strip in production builds

### DangerouslySetInnerHTML Usage
- **Issue:** XSS risk in chart component using `dangerouslySetInnerHTML`
- **Files:** `src/components/ui/chart.tsx` (line 85)
- **Impact:** Potential XSS if chart data is compromised
- **Fix approach:** Sanitize HTML content before injection; use DOMPurify

### Memory-Based Metrics Collection
- **Issue:** MetricsCollector uses in-memory storage that resets daily
- **Files:** `server/monitoring.ts` (lines 167-207)
- **Impact:** Metrics lost on restart; no persistence; 500 key limit
- **Fix approach:** Store metrics in database or external service like Prometheus

## Known Bugs

### Error Handler Not Registered
- **Symptoms:** `server/utils/errorHandler.ts` exists but is not imported/used in main app
- **Files:** `server/utils/errorHandler.ts`, `server/index.ts`
- **Impact:** Unhandled errors may crash server; inconsistent error responses
- **Workaround:** Use `performanceErrorHandler.ts` which is partially integrated

### CSRF Token Store Memory Leak
- **Symptoms:** Token store grows unbounded until cleanup every 15 minutes
- **Files:** `server/csrf.ts` (lines 200-217)
- **Trigger:** High volume of token generation without cleanup
- **Workaround:** Cleanup interval runs every 15 minutes; limit token TTL to 24 hours

### Database Connection Pool Exhaustion Risk
- **Files:** `server/db.ts` (lines 63-74)
- **Cause:** Pool limited to 10 connections on Railway; no connection timeout handling
- **Impact:** Under high load, requests may queue indefinitely
- **Fix approach:** Implement connection timeout and queue limit

## Security Considerations

### Missing Environment Variable Validation on Startup
- **Risk:** App starts without required env vars; crashes later unpredictably
- **Files:** `server/db.ts` (line 56), `server/index.ts`
- **Current mitigation:** Check script `validate-env` exists but not enforced
- **Recommendations:** Add mandatory env validation before server start

### Admin Authentication Uses Environment Variables
- **Risk:** Credentials stored in env vars may be logged or exposed
- **Files:** `server/routes.ts` (lines 1096-1130)
- **Current mitigation:** Uses bcrypt hashing; session management
- **Recommendations:** Move to database-backed user storage with proper password policies

### File Upload Path Traversal Risk
- **Risk:** Although validation exists, custom filename generation could be exploited
- **Files:** `server/routes.ts` (lines 99, 354, 933), `server/objectStorage.ts` (lines 29-51)
- **Current mitigation:** Path validation in `sanitizeFilePath()` and `validateFilePath()`
- **Recommendations:** Additional filename sanitization; stricter mime-type validation

### Rate Limiting Per-IP Can Be Bypassed
- **Risk:** Behind proxy, uses `x-forwarded-for` which can be spoofed
- **Files:** `server/security.ts` (lines 32-39, 96-103)
- **Current mitigation:** `trustProxy: false` setting
- **Recommendations:** Validate proxy headers; implement user-based rate limiting

## Performance Bottlenecks

### Database Query N+1 Pattern in Inspections
- **Problem:** Room inspections fetched separately for each building inspection
- **Files:** `server/routes.ts` (lines 789-805), `server/storage.ts` (lines 97-164)
- **Cause:** No eager loading of related room data
- **Improvement path:** Use Drizzle relations or join queries

### Cache Invalidation Too Aggressive
- **Problem:** Pattern-based cache clearing on every write operation
- **Files:** `server/storage.ts` (lines 107, 181-182, 207-208)
- **Cause:** `clearPattern('inspections:all')` clears all inspection caches
- **Improvement path:** Implement targeted cache invalidation by key

### Image Processing Blocks Event Loop
- **Files:** `server/routes.ts` (lines 97-124, 352-379)
- **Cause:** Synchronous file buffer processing in upload handlers
- **Improvement path:** Use worker threads or external service for image processing

### Large Bundle Size (Vite)
- **Problem:** No code splitting strategy evident; large dependencies (jspdf, xlsx, recharts)
- **Files:** `vite.config.ts`, `package.json`
- **Improvement path:** Implement dynamic imports; lazy load heavy libraries

## Fragile Areas

### Database Reconnection Logic
- **Files:** `server/db.ts` (lines 142-198), `server/database-retry.ts`
- **Why fragile:** Complex retry logic with exponential backoff may conflict with pool management
- **Safe modification:** Test thoroughly under connection failure scenarios
- **Test coverage:** Limited automated tests for connection failures

### Circuit Breaker Implementation
- **Files:** `server/performanceErrorHandler.ts` (lines 296-366), `server/database-retry.ts` (lines 30-44)
- **Why fragile:** Multiple circuit breaker implementations with different thresholds
- **Safe modification:** Consolidate into single circuit breaker service
- **Test coverage:** No dedicated circuit breaker tests

### Object Storage Service
- **Files:** `server/objectStorage.ts`
- **Why fragile:** Local filesystem fallback may not work in containerized environments
- **Safe modification:** Abstract storage interface; add cloud storage adapter
- **Test coverage:** No unit tests for storage service

### Offline Manager (Frontend)
- **Files:** `src/utils/offlineManager.ts`
- **Why fragile:** Complex IndexedDB operations with multiple fallbacks
- **Safe modification:** Add comprehensive error boundaries; test in private browsing mode
- **Test coverage:** Limited e2e coverage for offline scenarios

## Scaling Limits

### Database Connection Pool
- **Current capacity:** 10 connections (Railway), 20 (local)
- **Limit:** ~100 concurrent requests before queue buildup
- **Scaling path:** Increase pool size; implement read replicas; add connection pooling proxy

### Memory Storage for Sessions
- **Current capacity:** Limited by server memory
- **Limit:** ~10,000 concurrent sessions before memory pressure
- **Scaling path:** Migrate to Redis; implement session sharding

### File Upload Size
- **Current capacity:** 5MB per image, 10MB for PDF
- **Limit:** 5 files per upload (25MB total)
- **Scaling path:** Implement chunked uploads; use direct-to-S3 uploads

### Metrics Collection
- **Current capacity:** 500 metric keys
- **Limit:** Daily reset required
- **Scaling path:** External metrics service (Datadog, Prometheus)

## Dependencies at Risk

### multer 2.0.2
- **Risk:** Major version upgrade available; potential breaking changes
- **Impact:** File upload functionality
- **Migration plan:** Test upgrade in staging; review API changes

### @neondatabase/serverless 0.10.4
- **Risk:** Database driver updates may affect connection handling
- **Impact:** All database operations
- **Migration plan:** Monitor for new versions; test connection pooling changes

### xlsx (CDN version)
- **Risk:** Loaded from CDN, not npm; version control issues
- **Files:** `package.json` (line 133)
- **Impact:** Excel export functionality
- **Migration plan:** Pin to specific version; add integrity hash

### Redis Client 5.x
- **Risk:** Fallback to memory storage if Redis unavailable
- **Impact:** Session persistence, caching
- **Migration plan:** Ensure Redis is required in production; remove memory fallback

## Missing Critical Features

### Database Migration Management
- **Problem:** Using `drizzle-kit push` which can cause data loss
- **Files:** `package.json` scripts
- **Blocks:** Safe schema evolution in production
- **Solution:** Implement proper migration system with rollback support

### Input Validation Middleware
- **Problem:** Validation scattered in route handlers; no centralized middleware
- **Files:** `server/routes.ts` throughout
- **Blocks:** Consistent error handling; security audit compliance
- **Solution:** Implement Zod-based validation middleware

### Request ID Tracking
- **Problem:** Partial implementation; not consistent across all routes
- **Files:** `server/routes.ts` (line 710), `server/performanceErrorHandler.ts`
- **Blocks:** Distributed tracing; debugging production issues
- **Solution:** Add request ID middleware at Express app level

### Health Check Database Validation
- **Problem:** Health check only pings database, doesn't validate schema
- **Files:** `server/monitoring.ts` (lines 71-84)
- **Blocks:** Early detection of schema mismatch issues
- **Solution:** Add schema version check to health endpoint

## Test Coverage Gaps

### Database Retry Logic
- **What's not tested:** Circuit breaker behavior; exponential backoff timing
- **Files:** `server/database-retry.ts`
- **Risk:** Retry logic may fail under real failure conditions
- **Priority:** High

### Object Storage Service
- **What's not tested:** Path traversal attacks; file upload edge cases
- **Files:** `server/objectStorage.ts`
- **Risk:** Security vulnerabilities; file corruption
- **Priority:** High

### CSRF Protection
- **What's not tested:** Token expiration; concurrent token generation
- **Files:** `server/csrf.ts`
- **Risk:** Security bypass; session issues
- **Priority:** Critical

### Cache Manager
- **What's not tested:** Circuit breaker state transitions; Redis failover
- **Files:** `server/security.ts` (lines 581-712)
- **Risk:** Cache poisoning; stale data
- **Priority:** Medium

### Offline Manager (Frontend)
- **What's not tested:** Quota exceeded handling; sync conflict resolution
- **Files:** `src/utils/offlineManager.ts`
- **Risk:** Data loss; sync errors
- **Priority:** Medium

### Admin Routes
- **What's not tested:** Authentication bypass attempts; session validation
- **Files:** `server/routes.ts` (lines 1174-1275)
- **Risk:** Unauthorized access
- **Priority:** Critical

### Rate Limiting
- **What's not tested:** IP spoofing scenarios; rate limit bypass
- **Files:** `server/security.ts` (lines 18-111)
- **Risk:** DoS attacks
- **Priority:** High

---

*Concerns audit: 2025-02-09*
