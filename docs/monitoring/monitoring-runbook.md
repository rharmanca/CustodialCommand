# Monitoring Runbook

## Overview

This runbook provides step-by-step procedures for responding to common monitoring scenarios and incidents. Each procedure includes **validation checklists** to confirm issues and **remediation validation** to confirm fixes.

**Last Updated**: 2026-02-19  
**Version**: 2.0 (Phase 08 — added validation procedures, threshold reference, root-cause-aware memory section)

---

## Threshold Reference

> Central reference for all alerting thresholds. Validated against live system on 2026-02-19.

| Metric | Good (Green) | Warning (Amber) | Critical (Red) | Source |
|--------|-------------|-----------------|----------------|--------|
| Memory Usage | < 70% | 70–85% | > 85% | `/health` → `.memory.percentage` |
| Response Time | < 1 s | 1–3 s | > 3 s | `/health/metrics` → `avgResponseTime` |
| Error Rate | < 1% | 1–5% | > 5% | `/health/metrics` → `errorRate` |
| Uptime | > 99.9% | 99–99.9% | < 99% | UptimeRobot or Railway |
| Database | connected | — | error / disconnected | `/health` → `.database` |

**Known Baseline (2026-02-19):**
- Memory: 88% WARNING — caused by multer memoryStorage architecture (see Procedure 5)
- Response Time: ~3 ms average
- Error Rate: `/health/metrics` may report inflated rates (see Known Issues below)
- Uptime: 16+ hours since last restart

**Known Issues:**
- **Error rate calculation bug** in `server/automated-monitoring.ts`: `requestStats` resets every 60 s, so a single error early in a quiet minute can report 100%. Treat `/health/metrics` error rate as *indicative*, not absolute. Cross-reference with Railway logs.

---

## Quick Reference

### Critical URLs

| Resource | URL |
|----------|-----|
| Application | https://cacustodialcommand.up.railway.app/ |
| Health Check | https://cacustodialcommand.up.railway.app/health |
| Metrics | https://cacustodialcommand.up.railway.app/metrics |
| Health Metrics | https://cacustodialcommand.up.railway.app/health/metrics |
| Health History | https://cacustodialcommand.up.railway.app/health/history |
| Health Alerts | https://cacustodialcommand.up.railway.app/health/alerts |
| Railway Dashboard | https://railway.app/dashboard |
| UptimeRobot Dashboard | https://uptimerobot.com/dashboard |

### Useful curl Commands

```bash
# Quick health check
curl -s https://cacustodialcommand.up.railway.app/health | jq '.'

# Memory only
curl -s https://cacustodialcommand.up.railway.app/health | jq '.memory'

# Active alerts
curl -s https://cacustodialcommand.up.railway.app/health/alerts | jq '.'

# Response time test
curl -o /dev/null -s -w "time_total: %{time_total}s\n" https://cacustodialcommand.up.railway.app/health
```

---

## Validation Procedures

> Use these checklists when an alert fires to **confirm** the issue is real before taking action.

### VP-1: Memory Alert Validation

**Trigger:** Memory alert from automated monitoring or manual observation.

- [ ] **Step 1** — Query `/health` endpoint:
  ```bash
  curl -s https://cacustodialcommand.up.railway.app/health | jq '.memory'
  ```
  Record: `percentage` = _______%
- [ ] **Step 2** — Check Railway Dashboard → Metrics → Memory graph
  - Is it a spike (< 5 min) or sustained (> 10 min)?
  - Record trend: ☐ Spike  ☐ Sustained  ☐ Climbing
- [ ] **Step 3** — Query `/health/history` for last 20 data points:
  ```bash
  curl -s https://cacustodialcommand.up.railway.app/health/history | jq '.[].memory.percentage'
  ```
  Record range: ______% – ______%
- [ ] **Step 4** — Determine alert level:
  - 70–85% → **WARNING** — monitor, no immediate action
  - 85–95% → **HIGH** — follow Procedure 5 Steps 1–4
  - > 95% → **CRITICAL** — follow Procedure 5 immediately

**Result:** ☐ False alarm (transient spike)  ☐ Confirmed warning  ☐ Confirmed critical

---

### VP-2: Slow Response Validation

**Trigger:** Response time alert or user complaints.

- [ ] **Step 1** — Time the health endpoint:
  ```bash
  curl -o /dev/null -s -w "%{time_total}\n" https://cacustodialcommand.up.railway.app/health
  ```
  Record: _______ seconds
- [ ] **Step 2** — Time a data endpoint:
  ```bash
  curl -o /dev/null -s -w "%{time_total}\n" https://cacustodialcommand.up.railway.app/api/inspections?limit=5
  ```
  Record: _______ seconds
- [ ] **Step 3** — Check `/health/metrics` for `avgResponseTime`
- [ ] **Step 4** — Repeat Step 1 three times over 2 minutes
  - If all > 3 s → **Confirmed** — follow Procedure 2
  - If intermittent → **Suspected** — monitor for 10 min, then re-evaluate
  - If all < 1 s → **False alarm**

**Result:** ☐ False alarm  ☐ Intermittent  ☐ Confirmed slow

---

### VP-3: Error Rate Validation

**Trigger:** Error rate alert from automated monitoring.

> **Important:** The automated monitoring error rate can be inflated — see Known Issues in Threshold Reference.

- [ ] **Step 1** — Check `/health/metrics` for `errorRate`
- [ ] **Step 2** — Check `/metrics` for actual request/error counts
- [ ] **Step 3** — Search Railway logs for `ERROR` in last 15 min:
  - Count distinct errors: _______
  - Count total requests: _______
  - Calculate: errors ÷ requests = _______% (true rate)
- [ ] **Step 4** — Are errors `429` (rate limiting)?
  - If mostly 429 → **Expected behavior**, not a real error spike
  - If 500/503 → **Real errors** — follow Procedure 4

**Result:** ☐ False alarm (calculation artifact)  ☐ Expected 429s  ☐ Real error spike

---

### VP-4: Database Connection Validation

**Trigger:** Database error in health check or application logs.

- [ ] **Step 1** — Check `/health` for database status:
  ```bash
  curl -s https://cacustodialcommand.up.railway.app/health | jq '.database'
  ```
  Expected: `"connected"`
- [ ] **Step 2** — If `"error"`: check Railway Dashboard → Database service status
- [ ] **Step 3** — Check Railway status page: https://status.railway.app/
- [ ] **Step 4** — Check logs for `pool` or `connection` errors
- [ ] **Step 5** — Test a data query:
  ```bash
  curl -s https://cacustodialcommand.up.railway.app/api/inspections?limit=1 | jq '.totalRecords'
  ```
  Returns a number → DB functional. Returns error → DB issue confirmed.

**Result:** ☐ False alarm  ☐ Confirmed DB issue

---

## Incident Response Procedures

### Procedure 1: Application Down

**Symptoms**: UptimeRobot alert, 503 errors, site unreachable

**Impact**: Users cannot access application

**Response Time**: Immediate (within 5 minutes)

#### Step-by-Step Response

1. **Verify the Issue** (1 minute)
   ```bash
   curl -I https://cacustodialcommand.up.railway.app/health
   ```
   - If returns 200: False alarm, investigate monitor
   - If returns 503/timeout: Confirmed outage

2. **Check Railway Dashboard** (2 minutes)
   - Navigate to: https://railway.app/dashboard
   - Check deployment status
   - Look for:
     - Failed deployments
     - High resource usage
     - Database issues
   - Check logs for errors

3. **Check Health Endpoint Details** (1 minute)
   ```bash
   curl https://cacustodialcommand.up.railway.app/health
   ```
   - If `database: "error"` → Database issue (Procedure 3)
   - If `status: "error"` → Application error
   - If timeout → Server unresponsive

4. **Review Recent Logs** (2 minutes)
   - Railway Dashboard → Logs tab
   - Search for: `ERROR`
   - Look for recent exceptions or crashes
   - Note any deployment-related errors

5. **Attempt Recovery** (5 minutes)
   
   **Option A: Restart Service**
   - Railway Dashboard → Service → Restart
   - Wait 2–3 minutes for restart
   - Verify health endpoint responds
   
   **Option B: Redeploy**
   - If recent deployment failed
   - Trigger manual redeploy
   - Monitor deployment logs

6. **Verify Recovery** (2 minutes)
   ```bash
   curl https://cacustodialcommand.up.railway.app/health
   ```
   - Confirm status: `"ok"`
   - Confirm database: `"connected"`
   - Check UptimeRobot for recovery

7. **Post-Incident** (10 minutes)
   - Document incident in incident log
   - Note root cause
   - Identify preventive measures
   - Update runbook if needed

#### Recovery Validation Checklist

- [ ] `/health` returns `status: "ok"`
- [ ] `/health` returns `database: "connected"`
- [ ] Application loads in browser
- [ ] UptimeRobot shows "Up"
- [ ] Monitored for 5 minutes post-recovery with no recurrence

#### Escalation
- If unresolved after 15 minutes: Escalate to senior admin
- If database issue: Contact database administrator
- If security incident: Follow security incident procedure

---

### Procedure 2: Slow Performance

**Symptoms**: Response times > 3 s, user complaints, monitoring alerts

**Impact**: Degraded user experience

**Response Time**: Within 15 minutes

**Pre-check**: Run VP-2 (Slow Response Validation) to confirm the issue.

#### Step-by-Step Response

1. **Confirm the Issue** (2 minutes)
   ```bash
   curl -o /dev/null -s -w "time_total: %{time_total}s\n" https://cacustodialcommand.up.railway.app/health
   ```
   - Check if response time > 3 s consistently
   - Test multiple endpoints

2. **Check Performance Metrics** (3 minutes)
   ```bash
   curl https://cacustodialcommand.up.railway.app/api/performance/stats
   ```
   - Review memory usage
   - Check cache hit rates
   - Look for database performance issues

3. **Analyze Current Health** (2 minutes)
   ```bash
   curl https://cacustodialcommand.up.railway.app/health/metrics
   ```
   - Check `avgResponseTime`
   - Review `requestsPerMinute`
   - Look for active alerts

4. **Check for Traffic Spikes** (2 minutes)
   - Railway Dashboard → Metrics tab
   - Review request volume
   - Check if traffic spike correlates with slowdown

5. **Identify Slow Endpoints** (3 minutes)
   - Railway Dashboard → Logs
   - Search: `Slow request detected`
   - Note which endpoints are slow
   - Common slow endpoints:
     - `/api/room-inspections` (check pagination)
     - `/api/inspections` (check filters)

6. **Database Performance Check** (3 minutes)
   - Check database connection pool
   - Look for long-running queries in logs
   - Verify indexes are being used

7. **Immediate Mitigations**
   
   **If High Traffic**:
   - Check if rate limiting is appropriate
   - Monitor volume trend
   
   **If Database Issue**:
   - Review slow query log
   - Consider query optimization
   - Check for missing indexes
   
   **If Memory Issue** (see Procedure 5):
   - Memory pressure causes GC pauses → slow responses
   - Restart service to clear memory
   - Monitor memory after restart

8. **Verification** (5 minutes)
   - Re-run performance checks
   - Confirm response times < 3 s
   - Monitor for 10 minutes

#### Recovery Validation Checklist

- [ ] Health endpoint responds in < 1 s
- [ ] Data endpoints respond in < 3 s
- [ ] `/health/metrics` shows `avgResponseTime` < 1 s
- [ ] Monitored for 10 minutes post-fix with no recurrence
- [ ] Railway Metrics graph shows return to normal

---

### Procedure 3: Database Issues

**Symptoms**: Database errors, connection timeouts, health check failures

**Impact**: Data cannot be read/written

**Response Time**: Immediate

**Pre-check**: Run VP-4 (Database Connection Validation) to confirm.

#### Step-by-Step Response

1. **Check Database Health** (1 minute)
   ```bash
   curl https://cacustodialcommand.up.railway.app/health | jq '.database'
   ```
   Expected: `"connected"`
   If `"error"` or `"disconnected"`: Proceed to step 2

2. **Check Railway Database Status** (2 minutes)
   - Railway Dashboard → Database service
   - Check:
     - Connection status
     - Resource usage
     - Recent restarts
     - Error logs

3. **Review Connection Pool** (2 minutes)
   - Check for connection pool exhaustion
   - Look in logs for: `pool` OR `connection`
   - Note any timeout errors
   - Pool config: max 10 connections, 10 s idle timeout, 5 s connect timeout

4. **Test Direct Database Connection**
   ```bash
   # If you have database access
   psql $DATABASE_URL -c "SELECT 1"
   ```

5. **Check for Query Issues** (3 minutes)
   - Railway Dashboard → Logs
   - Search: `database connection failed`
   - Look for slow query warnings
   - Check for query timeouts

6. **Recovery Actions**
   
   **If Connection Pool Exhausted**:
   - Restart application to reset pool
   - Check for connection leaks in code
   - Monitor connection count
   
   **If Database Service Down**:
   - Check Railway status page: https://status.railway.app/
   - Check Neon status: https://status.neon.tech/
   - Wait for provider to recover
   
   **If Query Performance**:
   - Identify slow queries
   - Kill long-running queries if necessary
   - Optimize problematic queries

7. **Verification**
   ```bash
   curl https://cacustodialcommand.up.railway.app/health
   ```
   - Confirm `database: "connected"`
   - Test data read/write
   - Monitor for 15 minutes

#### Recovery Validation Checklist

- [ ] `/health` returns `database: "connected"`
- [ ] `/api/inspections?limit=1` returns data successfully
- [ ] No new `database` or `pool` errors in Railway logs for 15 min
- [ ] Connection pool is not saturated

---

### Procedure 4: Error Spikes

**Symptoms**: Error rate > 5%, increased 5xx responses, user reports

**Impact**: Data integrity concerns, user frustration

**Response Time**: Within 10 minutes

**Pre-check**: Run VP-3 (Error Rate Validation) to confirm. Note: automated error rate may be inflated.

#### Step-by-Step Response

1. **Check Current Error Rate** (1 minute)
   ```bash
   curl https://cacustodialcommand.up.railway.app/metrics
   ```
   Also check `/health/metrics` for recent error rate.
   
   > **Note:** If `/health/metrics` shows 100% error rate but Railway logs show few errors, this is likely the calculation bug — not a real incident. See Known Issues.

2. **Review Error Patterns** (3 minutes)
   - Railway Dashboard → Logs
   - Filter by: `ERROR`
   - Look for:
     - Specific error messages
     - Affected endpoints
     - Timestamp patterns

3. **Check for Recent Deployments** (2 minutes)
   - Railway Dashboard → Deployments
   - Did error spike start after deployment?
   - If yes: Consider rollback

4. **Identify Error Types**
   
   **Common Error Patterns**:
   | Pattern | Likely Cause | Action |
   |---------|--------------|--------|
   | `500` + stack trace | Application bug | Check recent code changes |
   | `429` | Rate limiting | Normal, monitor volume |
   | `401/403` | Auth issues | Check auth service |
   | Database errors | DB connection | Follow Procedure 3 |

5. **Immediate Actions**
   
   **If Recent Deployment**:
   - Consider rollback to previous version
   - Test fix in staging
   - Redeploy when fixed
   
   **If Specific Endpoint**:
   - Isolate the endpoint
   - Check endpoint logs
   - Apply targeted fix
   
   **If Systemic Issue**:
   - Restart services
   - Enable additional logging

6. **Documentation**
   - Record error details
   - Note root cause
   - Document fix applied

#### Recovery Validation Checklist

- [ ] True error rate (from logs) below 5%
- [ ] No new 500-level errors in Railway logs for 10 min
- [ ] Affected endpoints responding normally
- [ ] `/metrics` error counters not climbing

---

### Procedure 5: High Memory Usage

**Symptoms**: Memory usage > 85%, application slowdown, OOM errors

**Impact**: Application instability, potential crashes

**Response Time**: Within 20 minutes

**Pre-check**: Run VP-1 (Memory Alert Validation) to confirm the issue.

#### Root Cause Context (from Phase 08 Investigation)

> **Primary cause:** multer `memoryStorage` configuration buffers entire file uploads in RAM (up to 5 MB × 5 files = 25 MB per request). Object storage also loads entire files synchronously on reads. This is **not a memory leak** — it's a high stable baseline from the file handling architecture.
>
> **Expected baseline:** 85–95% memory usage is normal for this application under current architecture.
>
> **Key files:** `server/routes.ts` (multer config), `server/objectStorage.ts` (file I/O)

#### Step-by-Step Response

1. **Check Current Memory Usage** (1 minute)
   ```bash
   curl -s https://cacustodialcommand.up.railway.app/health | jq '.memory'
   ```
   Record: `percentage` = _______%

   **Decision tree:**
   - 85–90% → **Expected** baseline. Monitor, no action unless climbing.
   - 90–95% → **Elevated**. Check for concurrent uploads. Continue to Step 2.
   - > 95% → **Critical**. Proceed immediately to Step 5 (mitigation).

2. **Review Memory Trend** (3 minutes)
   - Railway Dashboard → Metrics → Memory
   - `/health/history` for app-level data
   - Is usage climbing or stable?
   - When did increase start?
   - Is there correlation with photo upload activity?

3. **Check for Active Uploads** (2 minutes)
   - Railway Dashboard → Logs
   - Search for: `upload`, `photo`, `multer`
   - Active photo uploads consume 5–25 MB each in memory
   - Memory may return to baseline after uploads complete

4. **Determine Cause** (3 minutes)

   | Symptom | Likely Cause | Action |
   |---------|-------------|--------|
   | Stable at 85–90% | Normal baseline (memoryStorage) | Monitor only |
   | Spike to > 95% during uploads | Concurrent photo uploads | Wait for completion; restart if OOM risk |
   | Gradually climbing over hours | Possible leak (unlikely) | Check event listeners, review `/health/history` for trend |
   | Sudden jump after deployment | New code issue | Check recent commits, consider rollback |

5. **Immediate Mitigation** (if > 95% or climbing)
   
   **Restart Application**:
   - Railway Dashboard → Service → Restart
   - Wait 2–3 minutes
   - Verify memory drops below 85% initially
   - Memory will climb back to 85–90% baseline — this is expected
   
   **If Restart Doesn't Help**:
   - Check for stuck uploads or requests in logs
   - Consider scaling Railway memory allocation
   - Review recent deployments for regression

6. **Long-term Remediation** (reference — not immediate action)
   
   These changes would reduce the memory baseline:
   
   | Change | Impact | Effort | Files |
   |--------|--------|--------|-------|
   | Switch multer to `diskStorage` | High — eliminates upload buffering | Medium | `server/routes.ts` |
   | Implement streaming file reads | High — eliminates read buffering | Medium | `server/objectStorage.ts` |
   | Configure Redis for sessions | Low–Medium | Low | `server/index.ts` |
   | Compress images on upload | Medium — smaller buffers | Medium | New service |
   | Use external CDN/storage (S3, R2) | High — offloads entirely | High | New infrastructure |

#### Recovery Validation Checklist (after restart)

- [ ] `/health` returns `memory.percentage` < 90%
- [ ] Wait 5 minutes — memory remains below 90%
- [ ] Wait 15 minutes — memory stabilized (not climbing)
- [ ] Application responsive (response time < 1 s)
- [ ] No OOM errors in Railway logs
- [ ] Railway Metrics graph shows memory drop and stabilization

---

## Remediation Validation Procedures

> After applying any fix, use these checklists to confirm the fix worked.

### RV-1: After Service Restart

- [ ] `/health` returns `status: "ok"` within 3 minutes
- [ ] `/health` returns `database: "connected"`
- [ ] Memory below 90% immediately after restart
- [ ] Application loads in browser
- [ ] Test one API call: `curl -s .../api/inspections?limit=1 | jq '.totalRecords'`
- [ ] Monitor for 15 minutes — no recurrence of original issue
- [ ] UptimeRobot shows "Up"

### RV-2: After Performance Fix

- [ ] Health endpoint responds in < 500 ms
- [ ] Previously-slow endpoint responds in < 3 s
- [ ] `/health/metrics` → `avgResponseTime` improved
- [ ] Monitor for 10 minutes — times remain stable
- [ ] No new errors introduced (check `/metrics`)

### RV-3: After Error Fix

- [ ] `/metrics` error count not increasing
- [ ] Railway logs show no new ERROR entries for 10 min
- [ ] Affected endpoint returns 200 on test call
- [ ] `/health/metrics` error rate trending down
- [ ] No side effects (other endpoints still working)

### RV-4: After Database Fix

- [ ] `/health` → `database: "connected"`
- [ ] Data read test: `curl -s .../api/inspections?limit=1` returns data
- [ ] Data write test: verify a new operation succeeds in the application
- [ ] No `pool` or `connection` errors in logs for 15 min
- [ ] Connection pool count normal (not saturated)

---

## Alert Contacts

### Primary Contacts

| Role | Name | Email | Phone | Response Time |
|------|------|-------|-------|---------------|
| Primary Admin | [Name] | [Email] | [Phone] | 15 minutes |
| Secondary Admin | [Name] | [Email] | [Phone] | 30 minutes |
| Database Admin | [Name] | [Email] | [Phone] | 1 hour |

### Escalation Path

1. **0–15 minutes**: Primary Admin
2. **15–30 minutes**: Secondary Admin
3. **30–60 minutes**: Database Admin / Senior Dev
4. **60+ minutes**: On-call escalation

### External Services

| Service | Support URL | Status Page |
|---------|-------------|-------------|
| Railway | https://railway.app/help | https://status.railway.app/ |
| Neon DB | https://neon.tech/docs | https://status.neon.tech/ |

---

## Monitoring Checklists

### Daily Checklist (5 minutes)

- [ ] Check UptimeRobot dashboard for alerts
- [ ] Verify `/health` endpoint responds normally
- [ ] Review `/health/metrics` for active alerts
- [ ] Quick scan of Railway logs for errors
- [ ] Verify memory usage < 90% (note: 85–90% is expected baseline)

### Weekly Checklist (15 minutes)

- [ ] Review uptime percentage (target: > 99.9%)
- [ ] Analyze response time trends
- [ ] Check error rate trends (remember: calculation may inflate)
- [ ] Review slow request logs
- [ ] Verify SSL certificate validity (> 30 days)
- [ ] Check disk/database usage
- [ ] Update incident log

### Monthly Checklist (30 minutes)

- [ ] Full performance review
- [ ] Capacity planning assessment
- [ ] Review and update alert thresholds (update Threshold Reference above)
- [ ] Test alert notifications
- [ ] Review and update this runbook
- [ ] Archive old logs
- [ ] Security patch review

---

## Tool Access

### Railway Dashboard

**URL**: https://railway.app/dashboard  
**Login**: Use Railway account credentials  
**Access Level**: Project admin

**Key Features**:
- Real-time logs
- Deployment management
- Environment variables
- Metrics and monitoring (7-day retention)
- Service restart

### UptimeRobot Dashboard

**URL**: https://uptimerobot.com/dashboard  
**Login**: UptimeRobot account

**Key Features**:
- Monitor status
- Alert configuration
- Response time history
- Public status page (if enabled)

### Application Endpoints

All endpoints accessible via curl or browser:

```bash
# Full health check
curl -s https://cacustodialcommand.up.railway.app/health | jq '.'

# Memory only
curl -s https://cacustodialcommand.up.railway.app/health | jq '.memory'

# Health metrics (response times, error rates)
curl -s https://cacustodialcommand.up.railway.app/health/metrics | jq '.'

# Health history (last ~100 data points)
curl -s https://cacustodialcommand.up.railway.app/health/history | jq '.'

# Active alerts
curl -s https://cacustodialcommand.up.railway.app/health/alerts | jq '.'

# Aggregate metrics
curl -s https://cacustodialcommand.up.railway.app/metrics | jq '.'
```

---

## Incident Log Template

```markdown
## Incident: [YYYY-MM-DD] - [Brief Description]

### Timeline
- **Detected**: [Time]
- **Started**: [Time]
- **Resolved**: [Time]
- **Duration**: [X minutes]

### Symptoms
- [Symptom 1]
- [Symptom 2]

### Validation (which VP was run)
- VP used: VP-[1/2/3/4]
- Result: [confirmed / false alarm]

### Root Cause
[Description of root cause]

### Impact
- Users affected: [Number]
- Features affected: [List]
- Data integrity: [Yes/No]

### Response Actions
1. [Action taken]
2. [Action taken]

### Resolution
[How issue was resolved]

### Recovery Validation (which RV was run)
- RV used: RV-[1/2/3/4]
- All checks passed: [Yes/No]

### Preventive Measures
- [ ] [Action item]
- [ ] [Action item]

### Lessons Learned
[Key takeaways]
```

---

## Related Documentation

- [Current Monitoring Inventory](./current-monitoring-inventory.md)
- [Uptime Monitoring Setup](./uptime-monitoring-setup.md)
- [Log Monitoring Guide](./log-monitoring-guide.md)
- [Performance Monitoring Guide](./performance-monitoring-guide.md)
- [Quick Reference Card](./QUICK-REFERENCE.md)
- [Phase 08 Memory Investigation](../../.planning/phases/08-monitoring-debt-cleanup/08-01-FINDINGS.md)

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-10 | 1.0 | Initial runbook (Phase 02 Plan 05) |
| 2026-02-19 | 2.0 | Phase 08 update: added Threshold Reference, Validation Procedures (VP-1 through VP-4), Remediation Validation (RV-1 through RV-4), root-cause-aware memory procedure, Known Issues, updated memory baseline to reflect investigation findings |
