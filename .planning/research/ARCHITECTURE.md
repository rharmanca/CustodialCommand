# Architecture Patterns: Custodial Command v2.0

**Domain:** Facility inspection management PWA
**Researched:** 2026-02-19

## Existing Architecture (Inherited from v1.0)

```
Browser (React PWA)
  └── Service Worker (offline cache)
       │
       ▼
Express API (Railway)
  ├── routes.ts (REST endpoints)
  ├── security.ts (rate limiting, CSRF, helmet)
  ├── storage.ts (Drizzle ORM queries)
  └── automated-monitoring.ts (health + memory alerts)
       │
       ▼
PostgreSQL (Railway managed)
  ├── inspections (quick capture + full inspection)
  ├── room_inspections (building inspection rooms)
  ├── custodial_notes (field notes)
  ├── monthly_feedback (PDF uploads)
  ├── inspection_photos (photo metadata)
  └── sync_queue (offline sync tracking)
```

## v2.0 Architecture Additions

### Analytics Layer (Phase 09)

Add server-side aggregation queries in `server/storage.ts` and expose via new routes:

```
GET /api/analytics/school-trends?school=X&months=6
GET /api/analytics/comparison?startDate=&endDate=
GET /api/analytics/summary
GET /api/export/inspections.csv?school=X&startDate=&endDate=
```

**Pattern:** Aggregation queries in Drizzle, response serialized server-side. No new table — existing `inspections` schema is sufficient.

### Notification Service (Phase 10)

New file: `server/services/notifications.ts`

```
node-cron scheduler (server startup)
  └── Check pending inspections older than N hours
       └── Resend API call → supervisor email

Trigger on mutation:
  quick-capture save → pending count ≥ 5 → threshold alert email
```

**Component Boundaries:**

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `server/services/notifications.ts` | Email rendering + send | Resend API |
| `server/jobs/scheduler.ts` | Cron job definitions | notifications.ts, storage.ts |
| `server/routes.ts` | Notification preferences API | notifications.ts |

### Tagging System (Phase 11)

Minimal schema addition — add `tags` text array column to `inspections` and `custodial_notes`.

```sql
ALTER TABLE inspections ADD COLUMN tags text[];
ALTER TABLE custodial_notes ADD COLUMN tags text[];
CREATE INDEX inspections_tags_idx ON inspections USING GIN(tags);
```

Tag taxonomy: fixed list maintained in `shared/inspection-tags.ts` (same pattern as `custodial-criteria.ts`).

## Patterns to Follow

### Pattern: Additive Schema Changes Only
**What:** Add nullable columns with defaults; never rename or remove existing columns
**When:** Any schema change in v2.0
**Example:**
```typescript
// Good — nullable with default
tags: text("tags").array().default([]),

// Bad — schema-breaking
inspectorName: text("name").notNull(), // renamed column
```

### Pattern: Server-Side CSV Streaming
**What:** Stream CSV response directly from query rather than building in memory
**When:** Data export endpoints
**Example:**
```typescript
res.setHeader('Content-Type', 'text/csv');
res.setHeader('Content-Disposition', 'attachment; filename=inspections.csv');
// Write header row
res.write('school,date,score,...\n');
// Stream rows from cursor
for (const row of rows) {
  res.write(csvRow(row) + '\n');
}
res.end();
```

### Pattern: Feature Flag Environment Variables
**What:** Gate new notification/email features behind env vars
**When:** Any external service dependency
**Example:**
```typescript
if (process.env.NOTIFICATIONS_ENABLED === 'true') {
  scheduler.start();
}
```

## Anti-Patterns to Avoid

### Anti-Pattern: In-Memory Aggregation for Reports
**What:** Fetching all inspection records to JS then aggregating
**Why bad:** Memory spike matches the multer upload issue; defeats existing DB indexes
**Instead:** SQL aggregation with GROUP BY at the database layer

### Anti-Pattern: Blocking Email Sends in Request Handler
**What:** `await resend.send()` inside a POST handler before responding
**Why bad:** Email API latency (100-500ms) added to user-facing response time
**Instead:** Enqueue email job after response (`res.json()` then async email)

### Anti-Pattern: Hardcoded Supervisor Email
**What:** `const SUPERVISOR = 'john@school.edu'` in source code
**Why bad:** Non-configurable; can't change without redeploy
**Instead:** `process.env.SUPERVISOR_EMAIL` with sensible fallback

## Scalability Considerations

| Concern | At current scale | At 10x scale | Notes |
|---------|-----------------|--------------|-------|
| Analytics queries | Direct SQL is fine | Add materialized views | Existing indexes cover common filters |
| Email volume | Resend free tier (3k/mo) sufficient | Upgrade to paid Resend | Trigger-based, not bulk |
| Photo storage | Railway ephemeral storage (current issue) | Object storage (S3/R2) | Phase 12 candidate |
| Offline sync | Service worker covers it | Background Sync API | Hardening in Phase 12 |

## Sources

- `server/routes.ts` — Existing route patterns
- `server/storage.ts` — Existing query patterns
- `shared/schema.ts` — Database schema
- `shared/custodial-criteria.ts` — Pattern for shared taxonomy files
