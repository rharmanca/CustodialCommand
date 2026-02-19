# Research Summary: Custodial Command Milestone v2.0

**Domain:** Facility inspection management PWA
**Researched:** 2026-02-19
**Overall confidence:** HIGH (based on existing codebase and backlog analysis)

## Executive Summary

Custodial Command v1.0 delivers a complete mobile inspection capture + desktop review workflow. The core "walk and capture, review later" cycle is fully operational with 23/23 requirements satisfied. The application manages school facility inspections, custodial notes, monthly feedback PDFs, and a scores dashboard.

The natural next milestone is closing the gap between raw data collection and actionable insights. v1.0 generates inspection data; v2.0 should make that data useful: trend reporting, school comparison, supervisor notifications, and annotation/tagging to categorize issues. There is also a secondary dimension of operational maturity — better offline support, inspection scheduling, and bulk workflow actions.

The deferred v3 requirements list in REQUIREMENTS.md provides strong signal: ADV-01 (AI photo analysis), ADV-02 (voice notes), ADV-03 (photo tagging), ADV-04 (batch review), ADV-05 (time-based reminders), and INT-01..INT-03 (email, Slack, calendar). These map cleanly to two themes: **Intelligence & Insights** (data utility) and **Workflow Automation** (reduce manual overhead).

The highest-value and lowest-risk v2.0 theme is **Reporting & Accountability** — building the tools supervisors need to act on inspection data rather than just store it.

## Key Findings

**Stack:** React/Express/PostgreSQL/Railway — no changes required; additive feature work
**Architecture:** Server-side analytics queries + report rendering is well-supported by existing schema
**Critical pitfall:** Schema already rich (11 rating categories, timestamps, status) — v2.0 risk is UI complexity creep, not data gaps
**Deferred requirements:** 8 items explicitly deferred (ADV + INT series) provide ready-made backlog

## Implications for Roadmap

Suggested phase structure for v2.0:

1. **Analytics & Reporting** (Phase 09) — Build trend reports, school comparison, CSV/PDF export
   - Addresses: ADV-04 (batch actions), scores dashboard enhancement, export gaps
   - Avoids: Over-engineering before usage patterns are known

2. **Notifications & Alerts** (Phase 10) — Email summaries for supervisors, pending inspection reminders
   - Addresses: INT-01, ADV-05
   - Avoids: Slack/Calendar (scope creep for v2.0)

3. **Issue Tagging & Categorization** (Phase 11) — Photo tags, issue categories, filterable issues list
   - Addresses: ADV-03, makes notes/inspections searchable
   - Avoids: AI photo analysis (ADV-01) which requires external API integration

4. **Offline & Reliability** (Phase 12) — Robust offline queue, sync status UI, background sync
   - Addresses: MOB-04 hardening, service worker improvements
   - Avoids: Full native app

5. **Scheduling & Accountability** (Phase 13) — Inspection schedule calendar, overdue alerts
   - Addresses: ADV-05, INT-03 (calendar)
   - Avoids: Full calendar integration (simple internal scheduler sufficient)

**Phase ordering rationale:**
- Phase 09 first: analytics needs data already in system → zero new data model risk
- Phase 10 second: notifications require analytics data to be meaningful
- Phase 11 third: tagging enriches both analytics and notifications
- Phases 12-13 are independent; schedule based on user feedback after 09-11

**Research flags for phases:**
- Phase 10 (Notifications): Needs research on email provider (Resend vs SendGrid vs Railway SMTP)
- Phase 11 (Tagging): Decision needed on tag schema (fixed taxonomy vs free-form)
- Phase 12 (Offline): Background Sync API browser support needs verification for target devices

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Same stack, no changes needed |
| Features | HIGH | Direct from deferred backlog + codebase gaps |
| Architecture | HIGH | Additive; existing schema supports analytics queries |
| Pitfalls | MEDIUM | Email/notification provider selection unresolved |

## Gaps to Address

- Which email provider to use for notifications (Resend is Railway-friendly, free tier)
- Whether "inspection scheduling" needs calendar integration or internal-only scheduling is sufficient
- User feedback from v1.0 production use (may reprioritize phases)
