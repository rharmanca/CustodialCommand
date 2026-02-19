---
phase: 10-notifications-alerts
plan: 01
subsystem: notifications
status: completed
dependency_graph:
  requires: []
  provides:
    - server/notificationService.ts
    - POST /api/notifications/trigger
    - scheduled notification job
  affects:
    - server/routes.ts
    - server/index.ts
    - .env.example
tech_stack:
  added:
    - resend@6.9.2
    - node-cron@4.2.1
    - "@types/node-cron"
  patterns:
    - Cron-based scheduled tasks
    - File-based cooldown tracking
    - HTML email templates
    - Environment-based feature toggling
key_files:
  created:
    - server/notificationService.ts
    - ".planning/phases/10-notifications-alerts/10-VERIFICATION.md"
  modified:
    - server/routes.ts
    - server/index.ts
    - .env.example
    - package.json
    - package-lock.json
decisions:
  - "File-based cooldown (.notification-cooldown) vs database storage - simpler, no migration needed"
  - "Hardcoded thresholds (10 count / 48h age) vs configurable - MVP approach"
  - "Weekday-only schedule (1-5) vs daily - matches business hours requirement"
  - "Admin-only manual trigger vs public endpoint - security first"
metrics:
  duration: 35
  completed_date: "2025-02-19"
  files_changed: 7
  lines_added: 769
  lines_deleted: 16
---

# Phase 10 Plan 01: Notifications & Alerts Summary

**One-liner:** Email alert system using Resend API that notifies facility manager when inspection backlog exceeds threshold (10 pending OR 48h oldest), with 24h cooldown and daily weekday scheduling.

## What Was Built

### Core Notification Service (`server/notificationService.ts`)

A comprehensive notification module with 7 exported functions:

1. **`getPendingInspectionStats()`** - Queries database for pending inspections, returns total count, school breakdown, and oldest pending age

2. **`checkThreshold(stats)`** - Returns true if either threshold exceeded (>=10 pending OR oldest >=48h)

3. **`shouldSendAlert()`** - Checks `.notification-cooldown` file for 24h suppression logic

4. **`recordAlertSent()`** - Writes current timestamp to cooldown file

5. **`sendNotificationEmail(stats)`** - Sends mobile-friendly HTML email via Resend with school breakdown and review link

6. **`sendAlertIfNeeded()`** - Orchestrates full flow: query -> threshold check -> cooldown check -> send -> record

7. **`scheduleNotifications()`** - Initializes node-cron job for 8am weekdays (America/Chicago timezone)

### Manual Trigger Endpoint

**POST /api/notifications/trigger** (admin auth required)

Allows manual testing and on-demand alerts without waiting for scheduled job.

Response format:
```json
{
  "success": true,
  "sent": true,
  "message": "Alert sent: 15 pending inspections across 3 schools"
}
```

### Scheduler Integration

- Cron expression: `0 8 * * 1-5` (8am, Monday-Friday)
- Timezone: America/Chicago
- Logs initialization and each scheduled run
- Gracefully handles errors without crashing server

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| File-based cooldown | No database migration needed, simple timestamp storage |
| Hardcoded thresholds | MVP approach - can make configurable later if needed |
| Weekday-only schedule | Requirement was weekdays 7am-7pm, 8am balances timeliness with non-urgent delivery |
| Resend over SendGrid | Better free tier (100 emails/day), simpler API, no complex domain verification for testing |
| Admin-only manual trigger | Security - prevents abuse of email endpoint |
| HTML email template | Mobile-friendly, professional appearance, direct CTA link to review page |
| Environment toggle | Service works without RESEND_API_KEY (logs warning, skips send) - no hard dependency |

## Deviations from Plan

**None** - Plan executed exactly as written.

## User Setup Required

Before email alerts will function:

1. Create Resend account at https://resend.com
2. Generate API key from Resend Dashboard
3. Set environment variable: `RESEND_API_KEY=re_xxxxxx`
4. Optionally customize: `ALERT_RECIPIENT=email@domain.com` (defaults to rharman@collegiateacademies.org)
5. Verify domain in Resend for production (optional for testing)

## Verification Results

| Check | Status |
|-------|--------|
| TypeScript compiles | Pass |
| Dependencies installed | resend@6.9.2, node-cron@4.2.1 |
| Service exports all functions | 7 functions exported |
| API endpoint registered | POST /api/notifications/trigger |
| Scheduler initialization | Called in server startup |
| Environment variables | Added to .env.example |

## Key Files

| File | Purpose |
|------|---------|
| `server/notificationService.ts` | Core notification logic (12.7KB) |
| `server/routes.ts` | Manual trigger endpoint |
| `server/index.ts` | Scheduler initialization |
| `.env.example` | Environment variable templates |

## Commit

**Hash:** a86cddf6

**Message:**
```
feat(10-01): implement notification service with Resend and node-cron

- Install resend@6.9.2 and node-cron@4.2.1 dependencies
- Create server/notificationService.ts with 7 functions:
  * getPendingInspectionStats() - Query pending by school
  * checkThreshold() - 10 pending OR 48h oldest threshold
  * shouldSendAlert() - 24h file-based cooldown check
  * recordAlertSent() - Update cooldown timestamp
  * sendNotificationEmail() - HTML email via Resend
  * sendAlertIfNeeded() - Orchestrate alert flow
  * scheduleNotifications() - Daily 8am weekday cron job
- Add POST /api/notifications/trigger endpoint (admin only)
- Integrate scheduler into server startup (index.ts)
- Update .env.example with RESEND_API_KEY and ALERT_RECIPIENT
- TypeScript compiles cleanly
```

## Self-Check

All files verified:
- server/notificationService.ts: FOUND
- server/routes.ts: Modified with endpoint
- server/index.ts: Modified with scheduler init
- .env.example: Modified with env vars
- package.json: Modified with deps
- 10-VERIFICATION.md: Created
- Commit a86cddf6: EXISTS
