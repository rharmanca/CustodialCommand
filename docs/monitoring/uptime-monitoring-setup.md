# External Uptime Monitoring Setup

## Service: UptimeRobot (Recommended)

### Why UptimeRobot?
- **Free Tier**: 50 monitors, 5-minute intervals
- **SSL Monitoring**: Certificate expiry alerts
- **Multiple Alert Channels**: Email, SMS, Slack, webhooks
- **Public Status Pages**: Optional public status page
- **API Access**: Programmatic monitor management

---

## Setup Instructions

### Step 1: Create UptimeRobot Account
1. Visit https://uptimerobot.com/
2. Click "Sign Up Free"
3. Use organization email for account
4. Verify email address

### Step 2: Add Monitors

#### Monitor 1: Main Application
```
Monitor Type: HTTP(s)
Friendly Name: Custodial Command - Main
URL: https://cacustodialcommand.up.railway.app/
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
```

#### Monitor 2: Health Endpoint
```
Monitor Type: HTTP(s)
Friendly Name: Custodial Command - Health Check
URL: https://cacustodialcommand.up.railway.app/health
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
Expected Status Code: 200
```

#### Monitor 3: API Endpoint
```
Monitor Type: HTTP(s)
Friendly Name: Custodial Command - API
URL: https://cacustodialcommand.up.railway.app/api/inspections
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
Expected Status Code: 200 (or 401 if authentication required)
```

#### Monitor 4: Metrics Endpoint
```
Monitor Type: HTTP(s)
Friendly Name: Custodial Command - Metrics
URL: https://cacustodialcommand.up.railway.app/metrics
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
Expected Status Code: 200
```

### Step 3: Configure Alert Contacts

#### Email Alerts
```
Contact Type: Email
Email Address: [primary-admin-email]
Alert Threshold: Down for 2 consecutive checks (10 minutes)
```

#### Slack Alerts (Optional)
```
Contact Type: Slack
Webhook URL: [Slack webhook URL]
Channel: #alerts
Alert Threshold: Down for 1 check (5 minutes)
```

### Step 4: Alert Settings

#### Downtime Alerts
- **Trigger**: Down for 2 consecutive checks (10 minutes)
- **Severity**: Critical
- **Notification**: Email + Slack
- **Repeat**: Every 30 minutes while down

#### Response Time Alerts
- **Trigger**: Response time > 3 seconds
- **Severity**: Warning
- **Notification**: Email

#### SSL Certificate Alerts
- **Trigger**: Certificate expires in < 30 days
- **Severity**: Warning
- **Notification**: Email

### Step 5: Test Alerts
1. Temporarily stop the Railway service
2. Verify alerts are received within 10 minutes
3. Restart the service
4. Verify recovery notification

---

## Alternative Services

### Pingdom (SolarWinds)
- **Free Tier**: 1 monitor, 1-minute intervals
- **Paid**: Starting at $10/month for 10 monitors
- **Features**: Transaction monitoring, real user monitoring
- **URL**: https://www.pingdom.com/

### Better Uptime
- **Free Tier**: 10 monitors, 3-minute intervals
- **Features**: Beautiful status pages, incident management
- **URL**: https://betteruptime.com/

### StatusCake
- **Free Tier**: Unlimited monitors, 5-minute intervals
- **Features**: Page speed monitoring, SSL monitoring
- **URL**: https://www.statuscake.com/

---

## Monitor Configuration Summary

| Monitor | URL | Interval | Timeout | Alert After |
|---------|-----|----------|---------|-------------|
| Main App | / | 5 min | 30s | 10 min down |
| Health | /health | 5 min | 30s | 10 min down |
| API | /api/inspections | 5 min | 30s | 10 min down |
| Metrics | /metrics | 5 min | 30s | 10 min down |

---

## Post-Setup Verification

### Checklist
- [ ] UptimeRobot account created
- [ ] All 4 monitors added
- [ ] Email alerts configured
- [ ] Slack alerts configured (if applicable)
- [ ] SSL monitoring enabled
- [ ] Test alerts sent and received
- [ ] Dashboard bookmarked
- [ ] Mobile app installed (optional)

### Dashboard Access
- **URL**: https://uptimerobot.com/dashboard
- **Bookmark**: Add to browser bookmarks
- **Mobile**: Install UptimeRobot mobile app for iOS/Android

---

## Incident Response

### When Alert Received
1. **Acknowledge** alert in UptimeRobot
2. **Check** Railway dashboard for deployment status
3. **Check** `/health` endpoint manually
4. **Review** Railway logs for errors
5. **Document** incident in runbook (if significant)

### Escalation Path
1. **Primary**: [Admin email] - Immediate notification
2. **Secondary**: [Secondary admin] - If unresolved in 30 min
3. **Emergency**: [On-call phone] - If unresolved in 1 hour
