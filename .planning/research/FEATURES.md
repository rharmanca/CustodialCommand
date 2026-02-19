# Feature Landscape: Custodial Command v2.0

**Domain:** Facility inspection management PWA
**Researched:** 2026-02-19

## Table Stakes

Features users will expect given what v1.0 already provides.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Export inspection data to CSV | v1.0 has PDF export wizard; CSV is expected companion | Low | Server-side query + streaming response |
| Filter inspections by date range | Scores dashboard already has date range; notes/data pages need it | Low | Extend existing query params |
| Supervisor-visible trend summary | Data exists; no reporting surface for supervisors | Medium | New page + aggregation queries |
| Per-school score history chart | Scores dashboard shows current; history trending is logical next | Medium | Time-series query + recharts |
| Email notification on pending backlog | Inspections pile up with no alert | Medium | Requires email provider setup |

## Differentiators

Features that distinguish v2.0 and provide clear user value beyond table stakes.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Issue tagging on photos/notes | Makes inspections searchable and categorizable | Medium | Tag taxonomy + UI + filter |
| School comparison report | Supervisors can compare performance across schools | Medium | Cross-school aggregation |
| Pending inspection age indicators | Shows how long items have been waiting | Low | createdAt already in schema |
| Bulk complete/discard from list | Currently requires opening each inspection individually | Medium | Multi-select UI + batch API |
| Inspection scheduling | Set recurring inspection cadence per school | High | New schedule table + reminder logic |
| Monthly trend digest email | Weekly/monthly summary sent automatically | Medium | Cron job + email template |

## Anti-Features

Features to explicitly NOT build in v2.0.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| AI photo analysis (ADV-01) | Requires OpenAI/Vision API key, ongoing cost, unreliable accuracy | Manual tagging (ADV-03) achieves 80% of value |
| Native mobile app | v1.0 decision holds; PWA meets needs | Improve PWA offline reliability instead |
| Slack/Teams integration | High setup friction for small team; not validated by usage | Email notifications first; revisit if requested |
| Custom rating criteria editor | 11 ratings are stable; editor is maintenance burden | Document criteria in app; update code if needed |
| Multi-user collaboration/assignments | Single-inspector workflow is the validated model | Role-based filters if needed, but no live collab |
| Real-time map of inspection locations | GPS data exists but no validated use case | Defer until users request it |

## Feature Dependencies

```
Issue Tagging → Analytics filtering by tag
Scheduling → Overdue notification emails
Email Notifications → Email provider configured
Bulk Actions → Pending list (already built)
School Comparison → Per-school score history
Monthly Digest → School comparison + trend data
```

## MVP Recommendation for v2.0

Prioritize:
1. **CSV export** — Zero friction, high utility, one day effort
2. **Enhanced scores dashboard** (per-school history, trends) — Supervisors' primary use case
3. **Issue tagging** — Makes existing data searchable; low schema change
4. **Pending backlog age indicators** — One-line UI change, high operational value
5. **Email notification: pending backlog** — First notification feature; proves the infra

Defer:
- Inspection scheduling: High complexity, low urgency if notifications cover reminders
- Bulk complete/discard: Nice-to-have; single-item UX works at current scale
- Monthly digest: Build after email infra is proven with backlog alerts

## Sources

- `.planning/REQUIREMENTS.md` — v3 deferred requirements (ADV + INT series)
- `.planning/v1.0-MILESTONE-COMPLETE.md` — Backlog section "Future Features"
- `shared/schema.ts` — Existing data model (rich schema supports analytics)
- `src/pages/scores-dashboard.tsx` — Current dashboard reveals gaps (no history, no trends)
- `src/pages/inspection-data.tsx` — Current data view reveals missing filter/export features
