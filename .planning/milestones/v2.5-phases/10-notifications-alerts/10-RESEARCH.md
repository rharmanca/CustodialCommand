# Phase 10 Research: Notifications & Alerts

**Date:** 2026-02-19
**Phase:** 10-notifications-alerts

## Research Summary

### Resend API (Email Service)

**Installation:**
```bash
npm install resend
```

**Basic Usage:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: 'Custodial Command <alerts@cacustodialcommand.up.railway.app>',
  to: ['rharman@collegiateacademies.org'],
  subject: '[Custodial Command] 12 inspections pending review',
  html: '<p>Email content...</p>',
});

if (error) {
  logger.error('Failed to send email:', error);
} else {
  logger.info('Email sent:', data.id);
}
```

**Key Findings:**
- Requires `RESEND_API_KEY` environment variable
- Single email sending via `resend.emails.send()`
- Error handling via destructured `error` object
- Returns `data.id` on success for tracking
- HTML emails supported via `html` property
- Free tier: 100 emails/day (sufficient for daily alerts)
- Domain verification recommended but not required for testing

### node-cron (Scheduling)

**Installation:**
```bash
npm install node-cron
```

**Basic Usage:**
```typescript
import cron from 'node-cron';

// Weekdays at 8:00 AM
// 0 8 * * 1-5 = minute 0, hour 8, every day, every month, Mon-Fri
cron.schedule('0 8 * * 1-5', () => {
  console.log('Running scheduled task');
}, {
  scheduled: true,
  timezone: 'America/Chicago'
});
```

**Cron Syntax:**
```
# ┌────────────── second (optional)
# │ ┌──────────── minute
# │ │ ┌────────── hour
# │ │ │ ┌──────── day of month
# │ │ │ │ ┌────── month
# │ │ │ │ │ ┌──── day of week
# │ │ │ │ │ │
# │ │ │ │ │ │
# 0 8 * * 1-5     (Weekdays at 8:00 AM)
```

**Key Findings:**
- Timezone support via `timezone` option
- Weekdays pattern: `1-5` (Monday=1, Friday=5)
- Task runs in-process (no separate worker needed)
- Suitable for single-instance deployments (Railway)
- For multi-instance, would need distributed lock (not needed here)

### Database Query Pattern

**Pending Inspections Query:**
```typescript
// Get count and oldest timestamp for pending inspections
const pendingStats = await db
  .select({
    count: count(),
    oldest: sql`MIN(${inspections.captureTimestamp})`,
    school: inspections.school,
  })
  .from(inspections)
  .where(eq(inspections.status, 'pending_review'))
  .groupBy(inspections.school);

// Total pending count
const totalPending = pendingStats.reduce((sum, row) => sum + row.count, 0);

// Oldest across all schools
const oldestTimestamp = pendingStats.length > 0 
  ? Math.min(...pendingStats.map(row => new Date(row.oldest).getTime()))
  : null;
```

**Schema Reference:**
- `status` field: `'pending_review' | 'completed' | 'discarded'`
- `captureTimestamp`: When quick capture was created
- `school`: School name for grouping
- Index on `status` + `school` for efficient queries

### Cooldown Pattern

**Simple File-Based State:**
```typescript
import { readFileSync, writeFileSync, existsSync } from 'fs';

const COOLDOWN_FILE = '.notification-cooldown';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function shouldSendAlert(): boolean {
  if (!existsSync(COOLDOWN_FILE)) return true;
  
  const lastSent = parseInt(readFileSync(COOLDOWN_FILE, 'utf8'));
  const now = Date.now();
  
  return now - lastSent > COOLDOWN_MS;
}

function recordAlertSent(): void {
  writeFileSync(COOLDOWN_FILE, Date.now().toString());
}
```

**Alternative: In-Memory with Process Restart Loss**
- Simpler but loses state on deploy/restart
- Acceptable for 24h cooldown (alerts won't be spammy)

### Email Template Structure

**HTML Template (Mobile-Friendly):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .school-list { margin: 15px 0; }
    .school-item { padding: 10px; background: white; margin: 5px 0; border-radius: 4px; }
    .cta-button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Inspection Alert</h1>
    </div>
    <div class="content">
      <p>You have <strong>{count}</strong> inspections awaiting review:</p>
      <div class="school-list">
        {schoolItems}
      </div>
      <a href="https://cacustodialcommand.up.railway.app/review" class="cta-button">Review Queue</a>
      <p class="footer">This alert was sent because the pending backlog exceeded the threshold.</p>
    </div>
  </div>
</body>
</html>
```

## Implementation Decisions

1. **Dependencies:** `resend` + `node-cron` (both lightweight)
2. **Scheduling:** Daily at 8am, weekdays only (Mon-Fri)
3. **Cooldown:** 24-hour file-based to prevent spam
4. **Threshold:** 10 pending OR oldest > 48 hours
5. **Email Format:** HTML with inline CSS for email client compatibility
6. **State Storage:** File-based cooldown (simple, survives restarts)
7. **Error Handling:** Log failures, don't crash the app
8. **Environment:** `RESEND_API_KEY` required for production

## Open Questions

- **RESEND_API_KEY:** User must provide this (Claude cannot create Resend account)
- **From Address:** Use verified domain or Resend test domain initially
- **Time Zone:** America/Chicago (New Orleans) for 8am timing

---
*Research complete: Ready for planning*
