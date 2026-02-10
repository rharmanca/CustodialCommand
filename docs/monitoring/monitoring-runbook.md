# Monitoring Runbook

## Overview

This runbook provides step-by-step procedures for responding to common monitoring scenarios and incidents.

**Last Updated**: 2026-02-10

---

## Quick Reference

### Critical URLs
| Resource | URL |
|----------|-----|
| Application | https://cacustodialcommand.up.railway.app/ |
| Health Check | https://cacustodialcommand.up.railway.app/health |
| Metrics | https://cacustodialcommand.up.railway.app/metrics |
| Railway Dashboard | https://railway.app/dashboard |
| UptimeRobot Dashboard | https://uptimerobot.com/dashboard |

### Current Status
- **Application**: ✅ Operational
- **Health**: degraded (high memory usage 93%)
- **Uptime**: 92+ hours
- **Version**: 1.0.2

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
   - If `database: "error"` → Database issue
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
   - Wait 2-3 minutes for restart
   - Verify health endpoint responds
   
   **Option B: Redeploy**
   - If recent deployment failed
   - Trigger manual redeploy
   - Monitor deployment logs

6. **Verify Recovery** (2 minutes)
   ```bash
   curl https://cacustodialcommand.up.railway.app/health
   ```
   - Confirm status: "ok"
   - Confirm database: "connected"
   - Check UptimeRobot for recovery

7. **Post-Incident** (10 minutes)
   - Document incident in incident log
   - Note root cause
   - Identify preventive measures
   - Update runbook if needed

#### Escalation
- If unresolved after 15 minutes: Escalate to senior admin
- If database issue: Contact database administrator
- If security incident: Follow security incident procedure

---

### Procedure 2: Slow Performance

**Symptoms**: Response times > 3s, user complaints, monitoring alerts

**Impact**: Degraded user experience

**Response Time**: Within 15 minutes

#### Step-by-Step Response

1. **Confirm the Issue** (2 minutes)
   ```bash
   curl -w "@curl-format.txt" https://cacustodialcommand.up.railway.app/health
   ```
   - Check if response time > 3s consistently
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
   - Consider enabling additional caching
   - Check if rate limiting is appropriate
   
   **If Database Issue**:
   - Review slow query log
   - Consider query optimization
   - Check for missing indexes
   
   **If Memory Issue**:
   - Restart service to clear memory
   - Investigate memory leak
   - Consider scaling resources

8. **Verification** (5 minutes)
   - Re-run performance checks
   - Confirm response times < 3s
   - Monitor for 10 minutes

---

### Procedure 3: Database Issues

**Symptoms**: Database errors, connection timeouts, health check failures

**Impact**: Data cannot be read/written

**Response Time**: Immediate

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
   - Check Railway status page
   - Wait for Railway to recover
   - Consider failover if configured
   
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

---

### Procedure 4: Error Spikes

**Symptoms**: Error rate > 5%, increased 5xx responses, user reports

**Impact**: Data integrity concerns, user frustration

**Response Time**: Within 10 minutes

#### Step-by-Step Response

1. **Check Current Error Rate** (1 minute)
   ```bash
   curl https://cacustodialcommand.up.railway.app/metrics | jq '.errors_total'
   ```
   Also check `/health/metrics` for recent error rate

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
   - Scale up resources if needed
   - Restart services
   - Enable additional logging

6. **Documentation**
   - Record error details
   - Note root cause
   - Document fix applied

---

### Procedure 5: High Memory Usage

**Symptoms**: Memory usage > 85%, application slowdown, OOM errors

**Impact**: Application instability, potential crashes

**Response Time**: Within 20 minutes

#### Step-by-Step Response

1. **Check Current Memory Usage** (1 minute)
   ```bash
   curl https://cacustodialcommand.up.railway.app/health | jq '.memory'
   ```
   Also check `/api/performance/stats` for detailed breakdown

2. **Review Memory Trend** (3 minutes)
   - Railway Dashboard → Metrics → Memory
   - Is usage climbing or stable?
   - When did increase start?

3. **Check for Memory Leaks** (5 minutes)
   - Review logs for memory warnings
   - Look for:
     - Unclosed connections
     - Large object accumulation
     - Event listener leaks
   - Check `/health/history` for trends

4. **Identify Memory Hogs** (3 minutes)
   ```bash
   curl https://cacustodialcommand.up.railway.app/api/performance/stats | jq '.memory'
   ```
   - Check heap usage
   - Review external memory
   - Look at RSS

5. **Immediate Mitigation**
   
   **Restart Application**:
   - Railway Dashboard → Restart
   - Clears accumulated memory
   - Monitor recovery
   
   **Scale Resources** (if available):
   - Increase memory allocation
   - Consider upgrading Railway plan

6. **Long-term Fix**
   - Profile application for leaks
   - Optimize memory-intensive operations
   - Implement memory limits

---

## Alert Contacts

### Primary Contacts

| Role | Name | Email | Phone | Response Time |
|------|------|-------|-------|---------------|
| Primary Admin | [Name] | [Email] | [Phone] | 15 minutes |
| Secondary Admin | [Name] | [Email] | [Phone] | 30 minutes |
| Database Admin | [Name] | [Email] | [Phone] | 1 hour |

### Escalation Path

1. **0-15 minutes**: Primary Admin
2. **15-30 minutes**: Secondary Admin
3. **30-60 minutes**: Database Admin / Senior Dev
4. **60+ minutes**: On-call escalation

### External Services

| Service | Support URL | Status Page |
|---------|-------------|-------------|
| Railway | https://railway.app/help | https://status.railway.app/ |
| Neon DB | https://neon.tech/docs | https://status.neon.tech/ |

---

## Monitoring Checklist

### Daily Checklist (5 minutes)

- [ ] Check UptimeRobot dashboard for alerts
- [ ] Verify `/health` endpoint responds normally
- [ ] Review `/health/metrics` for active alerts
- [ ] Quick scan of Railway logs for errors
- [ ] Verify memory usage < 85%

### Weekly Checklist (15 minutes)

- [ ] Review uptime percentage (target: > 99.9%)
- [ ] Analyze response time trends
- [ ] Check error rate trends
- [ ] Review slow request logs
- [ ] Verify SSL certificate validity (> 30 days)
- [ ] Check disk/database usage
- [ ] Update incident log

### Monthly Checklist (30 minutes)

- [ ] Full performance review
- [ ] Capacity planning assessment
- [ ] Review and update alert thresholds
- [ ] Test alert notifications
- [ ] Review and update runbook
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
- Metrics and monitoring
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
# Health
curl https://cacustodialcommand.up.railway.app/health

# Metrics
curl https://cacustodialcommand.up.railway.app/metrics

# Health Metrics
curl https://cacustodialcommand.up.railway.app/health/metrics

# Alerts
curl https://cacustodialcommand.up.railway.app/health/alerts
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
