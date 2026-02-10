# Log Monitoring Guide

## Overview

This guide covers log access, analysis, and monitoring for the Custodial Command application.

---

## Log Access

### 1. Railway Dashboard (Primary)

**URL**: https://railway.app/dashboard

**Access Logs**:
1. Navigate to your project
2. Select the `cacustodialcommand` service
3. Click on the "Logs" tab
4. View real-time logs with filtering

**Features**:
- Real-time log streaming
- Search/filter by text
- Log retention: Last 7 days (free tier) / 30 days (paid)
- Download logs for offline analysis
- Multiple log levels visible (INFO, WARN, ERROR, DEBUG)

### 2. Application Logs (In-App)

**Health/Metrics Endpoint**: Shows recent alerts and errors
```bash
curl https://cacustodialcommand.up.railway.app/health/metrics
```

**Health History Endpoint**: Historical health data
```bash
curl https://cacustodialcommand.up.railway.app/health/history?limit=20
```

---

## Log Format

### Production Log Format (JSON)

```json
{
  "timestamp": "2026-02-10T16:58:54.695Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "context": {
    "error": "connection timeout",
    "retryCount": 3
  },
  "requestId": "req_1739211523456_abc123def",
  "correlationId": "req_1739211523456_abc123def",
  "userId": 42,
  "username": "admin_user"
}
```

### Development Log Format (Human-Readable)

```
[2026-02-10T16:58:54.695Z] ERROR [req_1739211523456_abc123def]: Database connection failed {"error":"connection timeout"}
```

---

## Error Patterns to Monitor

### Critical Errors (Immediate Attention)

| Pattern | Description | Action Required |
|---------|-------------|-----------------|
| `Database connection failed` | Database connectivity issues | Check Railway DB status |
| `Health check failed` | Application health check failures | Check `/health` endpoint |
| `Unhandled error` | Unhandled exceptions | Review stack trace |
| `Critical memory usage` | Memory usage > 95% | Investigate memory leak |
| `Critical response time` | Response time > 5s | Check slow queries |

### Warning Patterns (Monitor Closely)

| Pattern | Description | Action Required |
|---------|-------------|-----------------|
| `Slow request detected` | Request took > 1s | Review endpoint performance |
| `High memory usage` | Memory usage > 85% | Monitor trend |
| `Rate limit exceeded` | 429 responses | Check for abuse |
| `Request failed` | 4xx/5xx responses | Review error patterns |

### Information Patterns (Normal Operations)

| Pattern | Description |
|---------|-------------|
| `Server running on port` | Normal startup message |
| `Routes registered successfully` | Application initialized |
| `Health check passed` | Normal health check |
| `Cache cleared` | Cache maintenance |

---

## Log Analysis Queries

### Railway Dashboard Search Examples

```
# Find all errors
ERROR

# Find database errors
"database connection"

# Find slow requests
"Slow request"

# Find authentication failures
"401" OR "authentication failed"

# Find rate limiting events
"429" OR "Rate limit"

# Find health check failures
"Health check failed"

# Find specific user activity
"userId": 42

# Find specific request
duration > 3000

# Find timeouts
timeout

# Find 500 errors
"responses_500"
```

### Common Log Analysis Commands

```bash
# View recent errors (if downloading logs)
grep "ERROR" application.log | tail -50

# Count errors by type
grep "ERROR" application.log | awk -F': ' '{print $2}' | sort | uniq -c | sort -rn

# Find slowest requests
grep "Slow request" application.log | sort -k6 -rn

# Check error rate per hour
grep "ERROR" application.log | awk '{print $1}' | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c
```

---

## Log-Based Alerts

### Current Automated Alerts

The application has built-in alerting via `automated-monitoring.ts`:

| Condition | Threshold | Severity |
|-----------|-----------|----------|
| Memory Usage | > 85% | Warning |
| Memory Usage | > 95% | Critical |
| Response Time | > 3s | Warning |
| Response Time | > 5s | Critical |
| Error Rate | > 5% | Critical |

**Alert Endpoint**: `GET /health/alerts`

### Recommended Railway Alerts

Railway offers webhook-based alerting:

1. **Deployment Failures**
   - Trigger: Deployment fails
   - Action: Notify team immediately

2. **High CPU/Memory**
   - Trigger: CPU > 80% or Memory > 90%
   - Action: Review and scale if needed

3. **High Error Rate**
   - Trigger: Error rate > 5%
   - Action: Investigate immediately

---

## Log Retention Policy

### Current Retention
- **Railway Dashboard**: 7 days (free tier)
- **Application Memory**: 100 health check data points (~1.5 hours)
- **Metrics**: 24-hour rolling window

### Recommendations

1. **Export Important Logs**
   - Download logs weekly for critical incidents
   - Store in secure location (S3, Google Drive)

2. **Log Aggregation (Optional Upgrade)**
   - **Loggly**: https://www.loggly.com/ (free tier: 200MB/day)
   - **Papertrail**: https://papertrailapp.com/ (free tier: 50MB/month)
   - **Splunk**: Enterprise solution for larger scale

3. **Integration with Railway**
   ```bash
   # Example: Forward logs to external service
   # Configure in Railway dashboard → Variables
   LOG_FORWARDING_URL=https://logs.loggly.com/inputs/[token]
   ```

---

## Troubleshooting with Logs

### Scenario 1: Application Down

```bash
# 1. Check Railway status
curl https://cacustodialcommand.up.railway.app/health

# 2. Review recent logs in Railway dashboard
Search: "ERROR"

# 3. Check for deployment issues
Railway dashboard → Deployments
```

### Scenario 2: Slow Performance

```bash
# 1. Check performance metrics
curl https://cacustodialcommand.up.railway.app/api/performance/stats

# 2. Search for slow requests in logs
Search: "Slow request detected"

# 3. Check database performance
Search: "database" AND "duration"
```

### Scenario 3: Error Spike

```bash
# 1. Get current error count
curl https://cacustodialcommand.up.railway.app/metrics | grep errors

# 2. Review error patterns in logs
Search: "Request failed"

# 3. Check specific endpoints
Search: "/api/inspections" AND "ERROR"
```

### Scenario 4: Database Issues

```bash
# 1. Check database health
curl https://cacustodialcommand.up.railway.app/health | jq '.database'

# 2. Search for database errors
Search: "Database" AND "ERROR"

# 3. Check connection pool
Search: "pool" AND "timeout"
```

---

## Log Monitoring Checklist

### Daily
- [ ] Review `/health/alerts` endpoint
- [ ] Check for new ERROR log entries
- [ ] Verify automated monitoring is running

### Weekly
- [ ] Analyze slow request patterns
- [ ] Review error rate trends
- [ ] Check memory usage trends
- [ ] Export logs for archive (optional)

### Monthly
- [ ] Full log analysis for patterns
- [ ] Review and adjust alert thresholds
- [ ] Update error runbook based on findings
- [ ] Archive old logs

---

## Related Documentation

- [Current Monitoring Inventory](./current-monitoring-inventory.md)
- [Uptime Monitoring Setup](./uptime-monitoring-setup.md)
- [Monitoring Runbook](./monitoring-runbook.md)
