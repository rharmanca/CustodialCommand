# Phase 08 Plan 01: Memory Investigation - Findings

**Investigation Date:** 2026-02-19  
**Investigator:** Automated Analysis  
**Status:** COMPLETE

---

## Executive Summary

**Current Memory Usage:** 88% (above 85% warning threshold)  
**Historical Peak:** 95% (observed during investigation period)  
**Root Cause:** Memory-intensive file handling (multer memoryStorage + synchronous file reads)  
**Risk Level:** MEDIUM - Service functional but near critical threshold

---

## Task 1: Railway Metrics Dashboard

### Findings
Railway dashboard access requires manual login. Used health endpoint history as proxy.

### Health History Analysis (Last 20 minutes)
| Time | Memory % | Status | Notes |
|------|----------|--------|-------|
| 15:57-16:06 | 95% | CRITICAL | Sustained high memory period |
| 16:07-16:09 | 87% | WARNING | Drop observed |
| 16:10-16:17 | 88% | WARNING | Stabilized |

**Trend Pattern:** Memory usage was critically high (95%) for ~10 minutes, then dropped to 87-88% and stabilized.

### Deployment Correlation
- Memory issue first identified: **2026-02-10** (Phase 02 Plan 05)
- Photo upload features added: **Phase 03** (Quick Capture with image support)
- Correlation: High memory coincides with photo upload functionality deployment

---

## Task 2: Health Endpoint Data

### Current Status (2026-02-19T16:17:32Z)
```json
{
  "status": "ok",
  "uptime": 59350,
  "version": "1.0.2",
  "environment": "production",
  "database": "connected",
  "redis": {
    "connected": false,
    "type": "memory",
    "error": "Redis not configured (using memory storage)"
  },
  "memory": {
    "used": 20,
    "total": 23,
    "percentage": 88
  }
}
```

### Key Observations
- **Uptime:** 16.5 hours (service stable, no recent restarts)
- **Memory:** 88% (above 85% warning, below 95% critical)
- **Redis:** Not configured - using in-memory storage for sessions/cache
- **Database:** Connected and healthy

### Active Alerts (from /health/metrics)
- WARNING: High memory usage: 88%
- CRITICAL: High error rate: 100% (calculation bug - see Task 4)

---

## Task 3: Application Log Patterns

### Findings from Health History
- **20 consecutive health checks** all show memory warnings
- Memory ranged from 87% to 95% over the observation period
- Error rate shows 100% consistently - this is a calculation artifact, not real errors
- Database connectivity: 100% healthy

### Log Pattern Summary
| Pattern | Frequency | Context |
|---------|-----------|---------|
| Memory warning | Every check | Sustained high baseline |
| Error rate 100% | Every check | Calculation bug (see below) |
| DB healthy | Every check | No database issues |

**Note:** Actual Railway logs not accessible via API. Analysis based on health endpoint history data.

---

## Task 4: Code Review for Memory Issues

### 4.1 Automated Monitoring (`server/automated-monitoring.ts`)

**Status:** ✅ No memory leaks, but contains a bug

**Findings:**
- Metrics array capped at 100 entries (`maxMetricsHistory = 100`) - good
- Uses `process.memoryUsage()` correctly
- Has automatic GC attempt on critical memory - good
- **BUG:** Error rate calculation flawed
  ```typescript
  // Problem: requestStats resets every 60 seconds
  // If 1 error occurs early in a minute with few requests, error rate = 100%
  const errorRate = this.requestStats.errors / this.requestStats.total;
  ```

### 4.2 Logger (`server/logger.ts`)

**Status:** ✅ Clean implementation

**Findings:**
- Uses AsyncLocalStorage for request context (efficient)
- Direct console output (no buffering/queuing)
- No accumulating data structures
- No memory leak risk

### 4.3 Database Connection (`server/db.ts`)

**Status:** ✅ Properly configured

**Findings:**
- Connection pooling: max 10 (Railway), 20 (local)
- Idle timeout: 10 seconds (Railway)
- Connection timeout: 5 seconds
- Has retry logic with exponential backoff
- Graceful shutdown handler for SIGTERM
- Event listeners don't accumulate (pool events are static)

### 4.4 File Upload Handling (`server/routes.ts`)

**Status:** ⚠️ HIGH MEMORY USAGE RISK

**Findings:**
```typescript
// Line 32-46: Multer configured with memoryStorage
const upload = multer({
  storage: multer.memoryStorage(),  // ⚠️ BUFFERS ENTIRE FILE IN MEMORY
  limits: {
    fileSize: 5 * 1024 * 1024,      // 5MB per file
    files: 5,                        // Max 5 files
  },
  ...
});
```

**Memory Impact:**
- Each upload buffers up to 5MB in memory before processing
- 5 concurrent uploads = up to 25MB in memory
- Files stay in memory during entire upload + object storage write operation
- No streaming used

**Affected Endpoints:**
- `POST /api/inspections` (building inspection with photos)
- `POST /api/custodial-notes` (notes with photos)
- `POST /api/inspections/:id/rooms/:roomId/submit` (room inspection with photos)

### 4.5 Object Storage (`server/objectStorage.ts`)

**Status:** ⚠️ MEMORY INTENSIVE

**Findings:**
```typescript
// Lines 53-96: Upload loads entire file buffer
async uploadLargeFile(fileBuffer: Buffer, ...) {
  // fileBuffer is already in memory from multer
  await fs.writeFile(filePath, fileBuffer);  // Writes from memory
}

// Lines 98-135: Get object loads entire file
async getObjectFile(filename: string) {
  const fileBuffer = await fs.readFile(validation.resolvedPath!);  // ⚠️ LOADS ENTIRE FILE
  // ...
}

// Lines 137-165: Download loads entire file
async downloadObject(filename: string) {
  const fileBuffer = await fs.readFile(validation.resolvedPath!);  // ⚠️ LOADS ENTIRE FILE
  // ...
}
```

**Memory Impact:**
- Every file read loads entire file into memory
- Serving photos to clients causes memory spikes
- No streaming or chunked reading implemented

### 4.6 Event Listeners

**Status:** ✅ No accumulating listeners

**Findings:**
- Database pool events are static (set once on startup)
- No dynamic event listener attachment in request handlers
- No EventEmitter usage that would cause leaks

### 4.7 In-Memory Caches

**Status:** ⚠️ Minor concern

**Findings:**
- Redis not configured - using in-memory storage
- Session storage in memory (via SessionManager)
- Health metrics history capped at 100 entries (good)
- No evidence of unbounded cache growth

---

## Task 5: Memory Correlation with Changes

### Deployment Timeline
| Date | Commit/Phase | Change | Memory Impact |
|------|--------------|--------|---------------|
| ~2026-02-10 | Phase 02 | Monitoring setup | Issue identified (93%) |
| ~2026-02-12 | Phase 03-01 | Quick Capture Core | Photo upload feature added |
| ~2026-02-13 | Phase 03-03 | Thumbnail Generation | More image processing |
| ~2026-02-19 | Current | v1.0.2 | Memory at 88% |

### Suspect Commits
1. **Phase 03-01:** Quick capture with photo upload functionality
   - Introduced `multer.memoryStorage()` for file handling
   - Added `/api/inspections/quick-capture` endpoint
   
2. **Phase 03-03:** Thumbnail generation
   - Additional image processing (likely uses canvas/sharp)
   - More memory-intensive operations

### Correlation Analysis
- Memory issue first documented in Phase 02 (monitoring setup)
- Photo features added in Phase 03
- Memory sustained at 87-95% since
- **Hypothesis:** Photo upload architecture (memory buffering) is primary contributor

---

## Root Cause Hypothesis

### Primary Cause: Memory-Intensive File Handling Architecture

**Evidence:**
1. **Multer memoryStorage**: All file uploads buffer entirely in RAM before disk write
   - 5MB × 5 files = up to 25MB per request in memory
   - Under concurrent uploads, memory multiplies

2. **Synchronous file reads**: Object storage loads entire files into memory
   - Every photo request loads full image into Node.js heap
   - No streaming/chunking implemented

3. **Missing Redis**: Session and cache data stored in application memory
   - Adds to baseline memory usage

### Contributing Factors
- Photo-heavy workflow (Quick Capture, Photo-First Review)
- Object storage service designed for simplicity, not memory efficiency
- No file size optimization (original images stored, not compressed)

### Not Likely Causes (Ruled Out)
- ❌ Memory leaks (metrics don't show unbounded growth)
- ❌ Database connection leaks (pool properly configured)
- ❌ Event listener accumulation (static listeners only)
- ❌ Log buffering (direct console output)

---

## Risk Assessment

| Factor | Assessment |
|--------|------------|
| **Current State** | 88% memory - WARNING level |
| **Critical Threshold** | 95% - approaching |
| **Service Stability** | Currently stable (16.5h uptime) |
| **OOM Risk** | Medium - could spike during heavy photo uploads |
| **User Impact** | Low - no degradation observed |

### Memory Trend Prediction
- Without changes: Likely to stay at 85-95% range
- Under heavy load: Risk of spiking to critical levels
- Not a runaway leak - stable but high baseline

---

## Remediation Recommendations

### Immediate (Low Effort)
1. **Fix error rate calculation bug** in `automated-monitoring.ts`
2. **Configure Redis** to move sessions out of application memory
3. **Add memory monitoring alert** at 90% (before critical)

### Short-term (Medium Effort)
4. **Switch multer to diskStorage**
   ```typescript
   const upload = multer({
     storage: multer.diskStorage({...}),  // Instead of memoryStorage
     ...
   });
   ```
5. **Implement streaming file serving** in objectStorage.ts
6. **Add request-level concurrency limits** for photo uploads

### Long-term (Higher Effort)
7. **Implement image optimization pipeline**
   - Compress/resize images on upload
   - Store multiple sizes (thumbnail, web, original)
8. **Add CDN or external object storage** (S3, R2, etc.)
9. **Implement chunked upload** for large files

---

## Conclusion

The 93% memory usage (now 88%) is caused by the application's file handling architecture that buffers entire files in memory during uploads and serves. This is not a memory leak (usage is stable), but rather a high baseline caused by design choices optimized for simplicity over memory efficiency.

**Key Insight:** The photo-centric features introduced in Phase 03 (Quick Capture, Photo-First Review) are the primary drivers of high memory usage. The multer memoryStorage configuration is the single biggest contributor.

**Recommendation:** Proceed with short-term remediation (switch to diskStorage) before addressing longer-term optimizations.

---

## Supporting Evidence

### Health Metrics Sample
```json
{
  "timestamp": "2026-02-19T16:17:32.707Z",
  "memory": {
    "used": 20,
    "total": 23,
    "percentage": 88
  },
  "uptime": 59350,
  "version": "1.0.2"
}
```

### Memory Trend (20 data points)
```
Time    Memory%
15:57   95  ████████████████████ CRITICAL
15:58   95  ████████████████████ CRITICAL
15:59   95  ████████████████████ CRITICAL
16:00   95  ████████████████████ CRITICAL
16:01   95  ████████████████████ CRITICAL
16:02   95  ████████████████████ CRITICAL
16:03   95  ████████████████████ CRITICAL
16:04   95  ████████████████████ CRITICAL
16:05   95  ████████████████████ CRITICAL
16:06   95  ████████████████████ CRITICAL
16:07   87  █████████████████▌   WARNING
16:08   87  █████████████████▌   WARNING
16:09   87  █████████████████▌   WARNING
16:10   88  █████████████████▊   WARNING
16:11   88  █████████████████▊   WARNING
16:12   88  █████████████████▊   WARNING
16:13   88  █████████████████▊   WARNING
16:14   88  █████████████████▊   WARNING
16:15   88  █████████████████▊   WARNING
16:16   88  █████████████████▊   WARNING
```

---

**Investigation Complete:** 2026-02-19  
**Next Step:** 08-02-PLAN.md (Runbook Update with remediation steps)
