# Domain Pitfalls: Custodial Command v2.0

**Domain:** Facility inspection management PWA
**Researched:** 2026-02-19

## Critical Pitfalls

### Pitfall 1: Analytics Queries Causing Memory Spikes
**What goes wrong:** Fetching all inspections to JS memory for aggregation
**Why it happens:** Easy to write `db.select().from(inspections)` and aggregate in JS
**Consequences:** Triggers the already-documented 93% memory warning; multer + analytics = OOM risk
**Prevention:** Always use SQL aggregation (`GROUP BY`, `AVG()`, `COUNT()`) at the DB layer; never pull unbounded result sets
**Detection:** Memory spike in `/health` metrics after running a report

### Pitfall 2: Email Provider SMTP Blocked on Railway Hobby Plan
**What goes wrong:** Attempting to send email via SMTP (Nodemailer) fails with connection refused
**Why it happens:** Railway blocks outbound port 25/587 on hobby plan for anti-spam
**Consequences:** Notifications silently fail; users think feature works but no emails arrive
**Prevention:** Use Resend (HTTP API over port 443); never use direct SMTP
**Detection:** Test with `curl` to SMTP port; verify in Railway network logs

### Pitfall 3: Schema Migrations Breaking Existing Data
**What goes wrong:** Adding NOT NULL columns without defaults, or renaming columns
**Why it happens:** Drizzle push (`db:push`) doesn't always warn before destructive changes
**Consequences:** Production data loss or failed migrations
**Prevention:** Only add nullable columns with `.default([])` or `.optional()`; use Drizzle migrations (not push) for v2.0 schema changes
**Detection:** Always test migration on a DB copy before production push

## Moderate Pitfalls

### Pitfall 4: Notification Spam From Threshold Triggers
**What goes wrong:** Supervisor receives 10 emails in one day because inspection count oscillates around threshold
**Prevention:** Track "last notified at" timestamp per school; enforce minimum 4-hour cooldown between alerts

### Pitfall 5: CSV Export Includes PII Without Review
**What goes wrong:** Inspector names, notes, and location data exported without access control
**Prevention:** Require admin authentication for export endpoints (already have admin auth pattern); document data sensitivity in export UI

### Pitfall 6: Tag Taxonomy Explosion
**What goes wrong:** Free-form tags create dozens of near-duplicates ("HVAC", "hvac", "Hvac issue", "heating/cooling")
**Prevention:** Fixed taxonomy defined in `shared/inspection-tags.ts`; UI uses select/multiselect, not free text

### Pitfall 7: node-cron Jobs Running Twice on Redeploy
**What goes wrong:** Railway redeploys without zero-downtime; brief overlap means cron fires twice
**Prevention:** Check last-run timestamp before executing job; make jobs idempotent

## Minor Pitfalls

### Pitfall 8: Charts Re-render on Every Keystroke in Filter UI
**What goes wrong:** Date range inputs trigger full chart reload while user is still typing
**Prevention:** Debounce filter input changes (300ms); only re-fetch on blur or explicit "Apply" button

### Pitfall 9: PWA Service Worker Caching Stale Analytics
**What goes wrong:** Analytics page shows old data from service worker cache
**Prevention:** Exclude `/api/analytics/*` and `/api/export/*` from service worker cache (already excluded pattern for admin routes in `sw.js`)

### Pitfall 10: Recharts Overflow on Mobile
**What goes wrong:** Trend charts overflow container on small screens
**Prevention:** Use `ResponsiveContainer` with `width="100%"` (Recharts standard pattern); already used in scores dashboard

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 09: Analytics | Memory spike from unbounded queries | SQL aggregation only; paginate large datasets |
| Phase 09: CSV Export | Auth bypass on export endpoint | Require admin session (existing pattern) |
| Phase 10: Notifications | SMTP blocked on Railway | Use Resend HTTP API |
| Phase 10: Notifications | Alert spam | Cooldown timestamp per school |
| Phase 11: Tagging | Tag sprawl | Fixed taxonomy in shared file |
| Phase 12: Offline | Background Sync API not supported on older iOS | Progressive enhancement; fall back to manual sync |
| Phase 13: Scheduling | Cron double-fire on redeploy | Idempotent jobs with last-run check |

## Sources

- `.planning/phases/08-*/08-01-FINDINGS.md` — Memory root cause (multer memoryStorage)
- `public/sw.js` — Service worker cache exclusions (admin route pattern)
- `server/csrf.ts` — Auth exemption pattern (admin login)
- `server/automated-monitoring.ts` — Memory trend alerting (TREND_WARNING threshold)
