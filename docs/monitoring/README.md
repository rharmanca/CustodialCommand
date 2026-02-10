# Custodial Command - Monitoring Documentation

Complete monitoring documentation for the Custodial Command application.

## Quick Start

**Current Status**: https://cacustodialcommand.up.railway.app/health

**Key Metrics**: https://cacustodialcommand.up.railway.app/metrics

**Dashboards**:
- Railway: https://railway.app/dashboard
- UptimeRobot: https://uptimerobot.com/dashboard (after setup)

## Documentation Index

### Core Documents

| Document | Purpose |
|----------|---------|
| [Current Monitoring Inventory](./current-monitoring-inventory.md) | Complete list of existing monitoring infrastructure |
| [Monitoring Runbook](./monitoring-runbook.md) | Incident response procedures and troubleshooting |

### Setup Guides

| Document | Purpose |
|----------|---------|
| [Uptime Monitoring Setup](./uptime-monitoring-setup.md) | External uptime monitoring configuration (UptimeRobot) |
| [Log Monitoring Guide](./log-monitoring-guide.md) | Log access, analysis, and monitoring |
| [Performance Monitoring Guide](./performance-monitoring-guide.md) | Performance metrics, thresholds, and baselines |

## Current Monitoring Status

### ✅ Active Monitoring

1. **Health Endpoint** (`/health`)
   - Database connectivity
   - Memory usage
   - Uptime tracking
   - **Status**: Operational

2. **Metrics Endpoint** (`/metrics`)
   - Request counts
   - Error tracking
   - Response codes
   - **Status**: Operational

3. **Automated Health Monitoring**
   - 1-minute health checks
   - Memory threshold alerts (> 85%)
   - Response time monitoring (> 3s)
   - **Status**: Active

4. **Logging Infrastructure**
   - Structured JSON logging
   - Request correlation IDs
   - Error tracking
   - **Status**: Active

### ⚠️ Gaps to Address

1. **External Uptime Monitoring**
   - UptimeRobot account needed
   - 4 monitors to configure
   - Email/Slack alerts needed

2. **Alert Contacts**
   - Primary/secondary contacts to define
   - Escalation path to establish

3. **Log Aggregation**
   - Currently Railway-only
   - Consider external service for long-term storage

## Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Memory Usage | > 85% | > 95% |
| Response Time | > 3s | > 5s |
| Error Rate | > 1% | > 5% |
| Uptime Target | - | < 99.9% |

**Current Alert**: Memory at 93% (Warning)

## Monitoring Checklist

### Daily (5 min)
- [ ] Check UptimeRobot dashboard
- [ ] Verify health endpoint
- [ ] Review active alerts
- [ ] Scan logs for errors

### Weekly (15 min)
- [ ] Review uptime percentage
- [ ] Analyze response time trends
- [ ] Check error rates
- [ ] Review slow requests
- [ ] Verify SSL certificate

### Monthly (30 min)
- [ ] Full performance review
- [ ] Capacity planning
- [ ] Update thresholds
- [ ] Test alerts
- [ ] Update runbook

## Emergency Contacts

| Role | Contact | Response Time |
|------|---------|---------------|
| Primary Admin | [To be configured] | 15 min |
| Secondary Admin | [To be configured] | 30 min |
| Database Admin | [To be configured] | 1 hour |

## External Resources

- **Railway Status**: https://status.railway.app/
- **Neon DB Status**: https://status.neon.tech/
- **Application URL**: https://cacustodialcommand.up.railway.app/

---

**Last Updated**: 2026-02-10
