# Monitoring Quick Reference Card

> **One-page incident response reference.** For full procedures see [monitoring-runbook.md](./monitoring-runbook.md).

**Last Updated:** 2026-02-19

---

## Thresholds at a Glance

| Metric | ✅ Good | ⚠️ Warning | 🔴 Critical |
|--------|---------|------------|-------------|
| Memory | < 70% | 70–85% | > 85% |
| Response Time | < 1 s | 1–3 s | > 3 s |
| Error Rate | < 1% | 1–5% | > 5% |
| Uptime | > 99.9% | 99–99.9% | < 99% |

> **Note:** Memory baseline is 85–90% due to multer memoryStorage — this is expected, not a leak.  
> **Note:** Error rate from `/health/metrics` may be inflated by calculation bug — cross-check Railway logs.

---

## Key Endpoints

```
HEALTH   https://cacustodialcommand.up.railway.app/health
MEMORY   https://cacustodialcommand.up.railway.app/health  →  .memory.percentage
METRICS  https://cacustodialcommand.up.railway.app/health/metrics
HISTORY  https://cacustodialcommand.up.railway.app/health/history
ALERTS   https://cacustodialcommand.up.railway.app/health/alerts
```

---

## Quick Validation Commands

```bash
# Health check
curl -s https://cacustodialcommand.up.railway.app/health | jq '.status, .database, .memory.percentage'

# Response time
curl -o /dev/null -s -w "%{time_total}s\n" https://cacustodialcommand.up.railway.app/health

# Memory trend (last 5 points)
curl -s https://cacustodialcommand.up.railway.app/health/history | jq '.[-5:][] | .memory.percentage'
```

---

## Decision Trees

### Application Down?
```
curl health → 200?
  YES → False alarm. Check monitor.
  NO (503/timeout) → Check Railway Dashboard → Restart Service → Verify with RV-1
```

### Memory Alert?
```
Check /health → memory.percentage
  < 85% → OK, no action
  85–90% → Expected baseline. Monitor.
  90–95% → Check for active uploads. Wait or restart.
  > 95% → RESTART NOW. Verify with RV-1.
```

### Slow Response?
```
curl -w "%{time_total}" → > 3s consistently?
  NO → False alarm or intermittent
  YES → Check memory (Procedure 5) → Check DB (Procedure 3) → Restart if needed
```

### Error Spike?
```
Check Railway logs for ERROR count
  Mostly 429s? → Rate limiting. Normal.
  Real 500s? → Check recent deployment → Rollback or fix → Verify with RV-3
  Calculation artifact? → Ignore /health/metrics rate, trust logs.
```

---

## Log Search Patterns

| Pattern | What It Finds |
|---------|--------------|
| `ERROR` | All application errors |
| `Slow request` | Response time warnings |
| `database connection` | DB connectivity issues |
| `429` or `Rate limit` | Rate limiting events |
| `memory` | Memory-related warnings |
| `upload` or `multer` | File upload activity |
| `OOM` or `killed` | Out-of-memory crashes |

---

## Emergency Actions

| Action | How |
|--------|-----|
| **Restart service** | Railway Dashboard → Service → Restart |
| **Rollback deployment** | Railway Dashboard → Deployments → Redeploy previous |
| **Check Railway status** | https://status.railway.app/ |
| **Check Neon DB status** | https://status.neon.tech/ |

---

## Escalation

| Time | Contact |
|------|---------|
| 0–15 min | Primary Admin |
| 15–30 min | Secondary Admin |
| 30–60 min | Database Admin / Senior Dev |
| 60+ min | On-call escalation |

---

## Validation Procedure Reference

| Code | Alert Type | Runbook Section |
|------|-----------|-----------------|
| VP-1 | Memory | Validation Procedures → VP-1 |
| VP-2 | Slow Response | Validation Procedures → VP-2 |
| VP-3 | Error Rate | Validation Procedures → VP-3 |
| VP-4 | Database | Validation Procedures → VP-4 |
| RV-1 | Post-Restart | Remediation Validation → RV-1 |
| RV-2 | Post-Performance Fix | Remediation Validation → RV-2 |
| RV-3 | Post-Error Fix | Remediation Validation → RV-3 |
| RV-4 | Post-DB Fix | Remediation Validation → RV-4 |
