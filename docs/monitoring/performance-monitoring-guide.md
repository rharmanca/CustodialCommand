# Performance Monitoring Guide

## Overview

Comprehensive performance monitoring documentation for Custodial Command including endpoints, thresholds, and baselines.

---

## Performance Endpoints

### 1. Health Endpoint (`/health`)

**URL**: https://cacustodialcommand.up.railway.app/health

**Purpose**: Quick application health check with basic metrics

**Response Time Target**: < 500ms

**Current Baseline**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T16:58:54.695Z",
  "uptime": 332228,
  "version": "1.0.2",
  "environment": "production",
  "database": "connected",
  "memory": {
    "used": 25,
    "total": 27,
    "percentage": 94
  }
}
```

### 2. Metrics Endpoint (`/metrics`)

**URL**: https://cacustodialcommand.up.railway.app/metrics

**Purpose**: Application request metrics and counters

**Response Time Target**: < 200ms

**Current Baseline**:
```json
{
  "requests_total": 1270,
  "requests_get": 1220,
  "responses_200": 821,
  "responses_429": 402,
  "errors_total": 428,
  "_uptimeHours": 17.4
}
```

**Key Metrics Explained**:
| Metric | Description | Current Value |
|--------|-------------|---------------|
| `requests_total` | Total requests since last reset | 1,270 |
| `errors_total` | Total error responses | 428 |
| `responses_429` | Rate limit hits | 402 |
| `_uptimeHours` | Hours since metrics reset | 17.4 |

### 3. Health Metrics Endpoint (`/health/metrics`)

**URL**: https://cacustodialcommand.up.railway.app/health/metrics

**Purpose**: Real-time automated monitoring data

**Response Time Target**: < 300ms

**Current Baseline**:
```json
{
  "timestamp": "2026-02-10T16:57:55.382Z",
  "status": "degraded",
  "checks": {
    "database": true,
    "memory": false,
    "responseTime": true,
    "errorRate": true
  },
  "metrics": {
    "memoryUsagePercent": 93,
    "avgResponseTime": 3,
    "errorRate": 0,
    "requestsPerMinute": 34
  },
  "alerts": [...]
}
```

### 4. Performance Stats Endpoint (`/api/performance/stats`)

**URL**: https://cacustodialcommand.up.railway.app/api/performance/stats

**Purpose**: Detailed performance statistics (requires authentication)

**Response Time Target**: < 500ms

**Features**:
- Memory usage breakdown
- Storage performance metrics
- Cache statistics
- Database status

---

## Performance Thresholds

### Response Time Thresholds

| Status | Threshold | Description |
|--------|-----------|-------------|
| ✅ Good | < 1 second | Normal operation |
| ⚠️ Warning | 1 - 3 seconds | Degraded performance |
| 🔴 Critical | > 3 seconds | Performance issue |

**Endpoint-Specific Targets**:
| Endpoint | Target | Warning | Critical |
|----------|--------|---------|----------|
| `/health` | < 500ms | 500ms - 1s | > 1s |
| `/metrics` | < 200ms | 200ms - 500ms | > 500ms |
| `/api/*` (GET) | < 500ms | 500ms - 2s | > 2s |
| `/api/*` (POST) | < 1s | 1s - 3s | > 3s |
| Static Assets | < 300ms | 300ms - 1s | > 1s |

### Error Rate Thresholds

| Status | Threshold | Description |
|--------|-----------|-------------|
| ✅ Good | < 1% | Normal error rate |
| ⚠️ Warning | 1% - 5% | Elevated errors |
| 🔴 Critical | > 5% | Error spike |

**Current Baseline**:
- Total errors: 428
- Total requests: 1,270
- **Error rate: 33.7%** ⚠️ (primarily rate limiting 429s)

*Note: High error rate is due to rate limiting (402 out of 428 errors are 429 responses)*

### Memory Usage Thresholds

| Status | Threshold | Description |
|--------|-----------|-------------|
| ✅ Good | < 70% | Normal memory usage |
| ⚠️ Warning | 70% - 85% | High memory usage |
| 🔴 Critical | > 85% | Very high memory usage |

**Current Baseline**:
- Used: 25 MB
- Total: 27 MB
- **Percentage: 94%** 🔴 CRITICAL

### Uptime Targets

| Target | Description |
|--------|-------------|
| 99.9% | Monthly uptime target (43.8 min downtime/month) |
| 99.5% | Minimum acceptable (3.6 hours downtime/month) |
| 99.0% | Investigation threshold (7.2 hours downtime/month) |

**Current Uptime**: 332,228 seconds (~92 hours continuous)

---

## Performance Baseline

### Current Performance Snapshot

**Date**: 2026-02-10
**Environment**: Production
**Version**: 1.0.2

#### System Resources
| Metric | Value | Status |
|--------|-------|--------|
| Memory Used | 25 MB / 27 MB | 🔴 94% |
| Uptime | 92+ hours | ✅ |
| Database | Connected | ✅ |
| Redis | Memory storage | ⚠️ |

#### Request Metrics (Last 17.4 Hours)
| Metric | Value |
|--------|-------|
| Total Requests | 1,270 |
| GET Requests | 1,220 (96%) |
| POST Requests | 44 (3.5%) |
| Success Rate (2xx) | 64.7% |
| Rate Limited (429) | 31.7% |
| Errors (5xx) | 0.08% |

#### Response Performance
| Metric | Value | Status |
|--------|-------|--------|
| Avg Response Time | 3ms | ✅ |
| Requests/Minute | 34 | ✅ |
| Current Health | degraded | ⚠️ |

### Known Performance Characteristics

#### Fast Endpoints (< 100ms)
- `/health` - Health check
- `/metrics` - Metrics endpoint
- `/api/csrf-token` - CSRF token generation

#### Medium Endpoints (100ms - 500ms)
- `/api/performance/stats` - Performance statistics
- Static asset serving

#### Slow Endpoints (> 500ms)
- `/api/room-inspections` - Without pagination (FIXED with server-side pagination)
- `/api/inspections` - Without filtering (FIXED with server-side pagination)

*Note: Recent optimizations (Plan 02-03) improved room inspections and inspections endpoints significantly.*

---

## Performance Monitoring Script

### Automated Health Check Script

Create file: `scripts/monitor-health.sh`

```bash
#!/bin/bash

# Performance monitoring script for Custodial Command
# Run with: ./scripts/monitor-health.sh

BASE_URL="https://cacustodialcommand.up.railway.app"
LOG_FILE="performance-$(date +%Y%m%d).log"

echo "=== Performance Check: $(date) ===" | tee -a $LOG_FILE

# Check health endpoint
echo -n "Health check... "
HEALTH_TIME=$(curl -s -w "%{time_total}" -o /dev/null "$BASE_URL/health")
echo "${HEALTH_TIME}s" | tee -a $LOG_FILE

# Check metrics endpoint
echo -n "Metrics check... "
METRICS_TIME=$(curl -s -w "%{time_total}" -o /dev/null "$BASE_URL/metrics")
echo "${METRICS_TIME}s" | tee -a $LOG_FILE

# Get health data
echo "Health data:"
curl -s "$BASE_URL/health" | jq '.' | tee -a $LOG_FILE

# Get metrics data
echo "Metrics summary:"
curl -s "$BASE_URL/metrics" | jq '{requests: .requests_total, errors: .errors_total}' | tee -a $LOG_FILE

echo "" | tee -a $LOG_FILE
```

### Running Regular Checks

```bash
# Run once
./scripts/monitor-health.sh

# Run every 5 minutes (using cron)
*/5 * * * * /path/to/scripts/monitor-health.sh >> /var/log/cac-monitor.log 2>&1
```

---

## Performance Trending

### Weekly Review Template

```markdown
## Performance Review: [Date]

### Response Time Trends
- Average: ___ ms (target: < 500ms)
- 95th percentile: ___ ms
- Slowest endpoint: ___

### Error Rate Trends
- Current rate: ___ % (target: < 1%)
- Error breakdown:
  - 4xx errors: ___
  - 5xx errors: ___
  - Rate limits (429): ___

### Resource Usage
- Memory peak: ___ MB
- Memory average: ___ MB
- Uptime: ___%

### Actions Taken
- [ ] Investigated slow endpoints
- [ ] Reviewed error patterns
- [ ] Optimized queries
- [ ] Adjusted cache settings

### Next Week Focus
1. ___
2. ___
```

---

## Performance Alerts

### Automated Alerts (Already Configured)

The application has built-in alerting via `automated-monitoring.ts`:

| Condition | Threshold | Severity |
|-----------|-----------|----------|
| Slow Response Time | > 3s | Warning |
| Critical Response Time | > 5s | Critical |
| High Error Rate | > 5% | Critical |
| High Memory | > 85% | Warning |
| Critical Memory | > 95% | Critical |

**Active Alert**: Memory usage at 93% (Warning)

### Recommended External Alerts

Configure in UptimeRobot or similar:

| Monitor | Alert Condition | Priority |
|---------|----------------|----------|
| Response Time | > 3s for 2 consecutive checks | High |
| Error Rate | > 5% over 5 minutes | Critical |
| Availability | Down for > 5 minutes | Critical |
| SSL Certificate | Expires in < 30 days | Medium |

---

## Performance Optimization History

### Recent Improvements (Plan 02-03)

| Endpoint | Before | After | Improvement |
|----------|--------|-------|-------------|
| `/api/room-inspections` | ~1.67s | < 500ms | 70%+ faster |
| `/api/inspections` | ~1.06s | < 400ms | 60%+ faster |

**Optimizations Applied**:
- ✅ Server-side pagination
- ✅ Database indexes on frequently queried columns
- ✅ Column selection to reduce data transfer
- ✅ Parallel queries for data + count
- ✅ Request deduplication

---

## Related Documentation

- [Current Monitoring Inventory](./current-monitoring-inventory.md)
- [Uptime Monitoring Setup](./uptime-monitoring-setup.md)
- [Log Monitoring Guide](./log-monitoring-guide.md)
- [Monitoring Runbook](./monitoring-runbook.md)
