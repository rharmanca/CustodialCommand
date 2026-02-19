# Phase 10 - Notifications & Alerts Verification

**Phase:** 10-notifications-alerts  
**Plan:** 01  
**Completed:** 2025-02-19

## Must-Have Verifications

### 1. Dependencies Installed
- [x] `resend` v6.9.2 installed
- [x] `node-cron` v4.2.1 installed
- [x] `@types/node-cron` installed as dev dependency

### 2. Service File Created
- [x] `server/notificationService.ts` exists (12,720 bytes)
- [x] Exports all required functions:
  - `getPendingInspectionStats()` - Query pending inspections by school
  - `checkThreshold(stats)` - Check if threshold exceeded (10 pending OR 48h oldest)
  - `shouldSendAlert()` - Check 24h cooldown via file
  - `recordAlertSent()` - Update cooldown file
  - `sendNotificationEmail(stats)` - Send HTML email via Resend
  - `sendAlertIfNeeded()` - Orchestrate alert flow
  - `scheduleNotifications()` - Initialize cron job

### 3. API Endpoint Added
- [x] `POST /api/notifications/trigger` endpoint exists in `server/routes.ts`
- [x] Protected by `validateAdminSession` middleware
- [x] Returns `{ success: boolean, sent: boolean, message: string }`

### 4. Scheduler Integration
- [x] `scheduleNotifications()` imported in `server/index.ts`
- [x] Called after server starts listening
- [x] Logs "Notification scheduler initialized" on startup

### 5. Environment Variables
- [x] `.env.example` updated with:
  - `RESEND_API_KEY=your_resend_api_key_here`
  - `ALERT_RECIPIENT=rharman@collegiateacademies.org`

### 6. TypeScript Compilation
- [x] `npm run check` passes with no errors

### 7. Threshold Logic
- [x] Count threshold: 10 pending inspections
- [x] Age threshold: 48 hours (172,800,000 ms)
- [x] Alert fires if EITHER threshold exceeded

### 8. Cooldown Mechanism
- [x] 24-hour cooldown stored in `.notification-cooldown` file
- [x] `shouldSendAlert()` checks file timestamp
- [x] `recordAlertSent()` updates file with current timestamp

### 9. Schedule Configuration
- [x] Cron: `0 8 * * 1-5` (8am, weekdays only)
- [x] Timezone: `America/Chicago`
- [x] node-cron scheduler initialized

### 10. Email Template
- [x] Mobile-friendly HTML template
- [x] Includes: total count, school breakdown, oldest age
- [x] Direct link to `/review` page
- [x] Alert note explaining 24h cooldown

## Automated Checks Passed

```bash
$ npm run check
> tsc --noEmit
# No errors

$ npm list resend node-cron
custodial-command@1.0.2
├── node-cron@4.2.1
└── resend@6.9.2
```

## Files Created/Modified

| File | Status | Size |
|------|--------|------|
| `server/notificationService.ts` | Created | 12,720 bytes |
| `server/routes.ts` | Modified | Added endpoint + import |
| `server/index.ts` | Modified | Added scheduler init |
| `.env.example` | Modified | Added notification env vars |
| `package.json` | Modified | Added resend, node-cron deps |

## API Endpoints

### POST /api/notifications/trigger
Manual trigger for testing (admin only).

**Auth:** Bearer token required (admin session)

**Response:**
```json
{
  "success": true,
  "sent": true,
  "message": "Alert sent: 15 pending inspections across 3 schools"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to trigger notification"
}
```

## Server Startup Logs

Expected log output on server start:
```
[info] Server running on port 5000
[info] Notification scheduler initialized
       schedule: 0 8 * * 1-5
       timezone: America/Chicago
       thresholdCount: 10
       thresholdHours: 48
       resendConfigured: true/false
```

## User Setup Required

Before email alerts will work:

1. **Create Resend account** at https://resend.com
2. **Generate API key** from Resend Dashboard
3. **Set environment variable:**
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ALERT_RECIPIENT=rharman@collegiateacademies.org
   ```
4. **Verify domain** in Resend (for production)
5. **Test manually:**
   ```bash
   curl -X POST https://cacustodialcommand.up.railway.app/api/notifications/trigger \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

## Notes

- Email sending is skipped if `RESEND_API_KEY` is not configured
- Cooldown file `.notification-cooldown` is created automatically
- Schedule runs only on weekdays (Monday-Friday) at 8am Central Time
- Manual trigger endpoint available for testing without waiting for schedule
