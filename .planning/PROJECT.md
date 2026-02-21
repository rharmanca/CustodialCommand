# Custodial Command

## What This Is

A custodial inspection management application that helps school custodial staff document facility conditions through mobile-first inspections. Deployed at cacustodialcommand.up.railway.app with photo capture, offline-capable quick capture, inspection forms, analytics, and data management.

## Core Value

**Custodial staff can efficiently capture facility issues while walking, then complete detailed assessments later with photo reference.**

The app must work reliably in the field on mobile devices — including areas with poor connectivity — and support both rapid capture workflows and thorough review sessions.

## Requirements

### Validated

- ✓ Photo capture and upload (v1.0)
- ✓ Location-based inspection forms (v1.0)
- ✓ Custodial notes creation (v1.0)
- ✓ Inspection data viewing and filtering (v1.0)
- ✓ Admin authentication and protected routes (v1.0)
- ✓ PostgreSQL data persistence (v1.0)
- ✓ Quick capture mode & photo-first review (v1.0)
- ✓ Real-time pending badges & FAB (v1.0)
- ✓ Analytics Dashboard & CSV export (v2.0)
- ✓ Email Alerts via Resend (v2.0)
- ✓ Issue Tagging with 8-tag taxonomy (v2.0)
- ✓ Dashboard reorganized with Quick Capture as primary CTA (v2.5)
- ✓ Mobile thumb-zone positioning for primary action (v2.5)
- ✓ Offline sync hardening — storage quota, network indicators, pending queue, sync recovery (v2.5)

### Active (for next milestone)

- [ ] Recurring inspection schedules (daily, weekly) for specific locations
- [ ] Dashboard displays due/upcoming scheduled inspections
- [ ] Scheduled inspections link directly to capture form
- [ ] Schedule compliance/completion rate tracking
- [ ] Voice-to-text note taking in quick capture
- [ ] Editable transcription before saving

### Out of Scope

- **Real-time collaborative editing** — Single inspector workflow is sufficient
- **Native mobile apps** — PWA covers needs; native apps are maintenance burden
- **Advanced AI photo analysis** — Requires ML infrastructure, high complexity
- **External work order system integration** — Manual export acceptable at current scale

## Context

### Current State

**Technical Stack:** React 18.3 + TypeScript 5.6 frontend, Express 4.21 + PostgreSQL backend, Railway hosting, PWA-enabled with offline sync.
**Milestones Complete:** v1.0 (Core & Quick Capture), v2.0 (Reporting & Accountability), v2.5 (Polish and Enhancements).
**Codebase:** ~20 source files modified in v2.5, +3,756 lines. 13 phases shipped total across all milestones.

### Constraints

- **Budget**: Existing Railway hobby plan sufficient
- **Timeline**: No hard deadline; improvements as bandwidth allows
- **Devices**: Must work on phones used by custodial staff (various Android/iOS)
- **Offline**: Service worker with IndexedDB sync, storage quota management, and recovery for interrupted syncs

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fixed tag taxonomy | Keeps data structured and avoids UI complexity for admin | ✓ v2.0 |
| Email notifications to single recipient | Meets MVP accountability needs without complex preferences | ✓ v2.0 |
| No JS aggregation for analytics | DB-level `GROUP BY` avoids memory issues at scale | ✓ v2.0 |
| Dashboard three-section layout | Capture/Review/Analyze workflow mirrors field usage pattern | ✓ v2.5 |
| Thumb-zone primary CTA | Quick Capture in bottom 1/3 of mobile viewport for one-handed use | ✓ v2.5 |
| IndexedDB sync state persistence | Survives app closure; SW resumes on activate event | ✓ v2.5 |
| 80%/95% storage thresholds | Warn early, auto-prune at critical; keeps Quick Capture working | ✓ v2.5 |
| Defer scheduling to v3.0 | Offline reliability was higher priority for field staff | ⚠️ Revisit |
| Defer voice notes to v3.0 | Nice-to-have; scheduling has more impact on daily workflow | ⚠️ Revisit |

---
*Last updated: 2026-02-21 after v2.5 milestone*
