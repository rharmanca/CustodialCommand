# Technology Stack: Custodial Command v2.0

**Project:** Custodial Command
**Researched:** 2026-02-19

## Existing Stack (v1.0 — No Changes Required)

| Technology | Version | Purpose |
|------------|---------|---------|
| React + TypeScript | 18 | Frontend SPA |
| Express.js | 4 | Backend API |
| PostgreSQL | 15 | Primary database |
| Drizzle ORM | current | Type-safe queries |
| Railway | — | Hosting + DB |
| Tailwind + Radix UI | — | UI components |
| sharp | current | Image/thumbnail processing |
| Recharts | — | Charts (scores dashboard) |

## New Libraries Needed for v2.0

### Email Notifications (Phase 10)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Resend | latest | Transactional email | Railway-compatible, generous free tier (3k emails/month), simple API, TypeScript-first |

**Alternatives Considered:**

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Email | Resend | SendGrid | SendGrid free tier requires card; more complex setup |
| Email | Resend | Nodemailer + SMTP | Railway doesn't guarantee SMTP relay; Resend abstracts this |
| Email | Resend | Postmark | More expensive, overkill for low-volume use case |

### Scheduled Jobs (Phase 13)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| node-cron | latest | In-process job scheduling | Simplest option; Railway doesn't provide cron as a service on hobby plan |

**Note:** If Railway upgrades to a plan with cron jobs, prefer Railway's native cron over in-process scheduling. Monitor Railway pricing.

### CSV Export (Phase 09)

No new library needed — use Node.js stream + manual CSV serialization. The schema is flat enough that a library is overkill.

## Installation (New Dependencies)

```bash
# Email notifications
npm install resend

# Scheduled jobs (for recurring reports/reminders)
npm install node-cron
npm install -D @types/node-cron
```

## Environment Variables (New)

```env
# Email (Phase 10)
RESEND_API_KEY=re_...
NOTIFICATION_FROM_EMAIL=noreply@cacustodialcommand.up.railway.app
SUPERVISOR_EMAIL=supervisor@domain.com

# Feature flags
NOTIFICATIONS_ENABLED=true
```

## Sources

- Resend docs: https://resend.com/docs
- node-cron: https://github.com/node-cron/node-cron
- Existing package.json (confirmed stack)
