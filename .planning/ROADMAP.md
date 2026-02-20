# Custodial Command - Testing & Review Roadmap

## Overview

Comprehensive testing and review of the deployed application at https://cacustodialcommand.up.railway.app/

## Phase 01: Deployed App Review and Testing

**Goal:** Systematically test all features of the deployed application to verify functionality, identify issues, and document findings.

**Status:** ✅ COMPLETE (8/8 plans)

---

## Phase 02: Address Testing Recommendations

**Goal:** Resolve issues and complete verification tasks identified during Phase 01 testing.

**Status:** 🔄 IN PROGRESS (5/8 plans complete)

---

## Phase 03: Workflow Improvements

**Goal:** Implement quick capture mode and photo-first review to improve mobile inspection workflow.

**Status:** 📋 PLANNED (0/6 plans)

**Scope:**
- Quick capture mode for mobile field use
- Photo-first review on desktop
- Performance optimizations for mobile
- Mobile UX improvements
- Workflow completion tracking

---

### Phase 03: Plans

**Plan 01** — Database Schema for Pending Review
- Add status field to inspections (pending_review, completed, discarded)
- Add capture and completion timestamp fields
- Add quick notes field (200 char max)
- Create database indexes for performance
- Requirements: CAP-06, data model foundation

**Plan 02** — Backend API for Pending Review
- Create quick capture endpoint (POST /api/inspections/quick-capture)
- Create pending list endpoint (GET /api/inspections/pending)
- Create complete inspection endpoint (PATCH /api/inspections/:id/complete)
- Create discard inspection endpoint (PATCH /api/inspections/:id/discard)
- Requirements: CAP-01, CAP-05, CAP-07, REV-01, REV-05, REV-06, REV-07

**Plan 03** — Thumbnail Generation Service
- Install sharp library for image processing
- Create thumbnail generation service (200x200, 70% quality)
- Integrate with photo upload endpoint
- Store thumbnail URLs in database
- Requirements: PERF-03, PERF-05

**Plan 04** — Quick Capture UI
- Create useCamera hook with continuous capture
- Build CameraCapture component (react-webcam ref pattern)
- Build PhotoPreviewStrip and QuickNoteInput components
- Create Quick Capture page with location selection and save
- Requirements: CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, CAP-07, MOB-01

**Plan 05** — Photo-First Review UI
- Create usePendingInspections hook
- Build PendingInspectionList with thumbnails
- Build PhotoReviewPane with progressive loading
- Build InspectionCompletionForm with all ratings
- Create Photo-First Review page with split-pane layout
- Requirements: REV-01, REV-02, REV-03, REV-04, REV-05, REV-06, REV-07

**Plan 06** — Integration and Performance
- Add Quick Capture FAB and entry point to dashboard
- Add Photo-First Review link to dashboard
- Implement route-level code splitting (lazy loading)
- Optimize for <2s load time on mobile 4G
- Add visual distinction between capture and review modes
- Requirements: CAP-01, MOB-02, MOB-04, PERF-01, PERF-02, PERF-04

---

## Phase 03: Success Criteria

### Observable Outcomes

1. **Mobile inspector can capture 5 locations in under 2 minutes**
   - Including location selection, photos, and optional note
   - Without opening full inspection form

2. **Desktop reviewer can complete inspection using photos**
   - Photos visible alongside form fields
   - No need to re-visit physical location

3. **No data loss between capture and review**
   - Photos persist with inspection record
   - Optional notes preserved
   - Timestamps tracked separately

4. **Improved mobile performance**
   - Quick capture loads in <1s on 4G
   - Camera stays active between shots
   - Form loads in <2s

### User-Facing Milestones

| Milestone | User Can | Verification |
|-----------|----------|--------------|
| Quick Capture Live | Walk school and rapidly capture issues | Time 5 captures <2 min |
| Photo Review Ready | Review and complete inspections from photos | Complete inspection without re-visit |
| Performance Improved | Use app without waiting for loads | All screens <2s load |

---

## Traceability

All Phase 03 requirements map to specific plans:

| Plan | Requirements | Success Criteria |
|------|--------------|------------------|
| 03-01 | CAP-06 (schema) | Data model foundation |
| 03-02 | CAP-01, CAP-05, CAP-07, REV-01, REV-05, REV-06, REV-07 | API foundation |
| 03-03 | PERF-03, PERF-05 | Thumbnails, progressive loading |
| 03-04 | CAP-01 through CAP-07, MOB-01 | Milestone 1 |
| 03-05 | REV-01 through REV-07 | Milestone 2 |
| 03-06 | CAP-01, MOB-02, MOB-04, PERF-01, PERF-02, PERF-04 | Milestone 3 |

---

## Wave Structure

Phase 03 executes in 4 waves for parallel execution:

| Wave | Plans | Dependencies | Can Parallelize |
|------|-------|--------------|-----------------|
| 1 | 03-01 (Schema) | None | - |
| 2 | 03-02 (API), 03-03 (Thumbnails) | 03-01 | 03-02 and 03-03 |
| 3 | 03-04 (Quick Capture), 03-05 (Photo Review) | 03-02, 03-03 | 03-04 and 03-05 |
| 4 | 03-06 (Integration) | 03-04, 03-05 | - |

---

## Current Status Summary

| Phase | Status | Plans Complete | Next Action |
|-------|--------|----------------|-------------|
| 01 | ✅ Complete | 8/8 | — |
| 02 | 🔄 In Progress | 5/8 | Complete 02-02, 02-04 |
| 03 | 📋 Planned | Complete    | 2026-02-17 |

---

## Phase 04: UI/UX Polish

**Goal:** Refine Phase 03 workflow features with layout improvements and UX enhancements without changing the overall theme.

**Status:** 📋 PLANNED (0/6 plans)

**Scope:**
- Sticky photo sidebar in Photo-First Review
- Grouped rating form sections with progress tracking
- Simplified Quick Capture with collapsible notes
- Enhanced pending badge with urgency indicators
- Dashboard FAB for Quick Capture access
- Improved touch targets for mobile/gloved hands

---

### Phase 04: Plans

**Plan 01** — Sticky Photo Sidebar
- Make photo sidebar sticky in Photo-First Review
- Photos stay visible while scrolling rating form
- Add zoom functionality on photo click
- Requirements: REV-03, UX-01

**Plan 02** — Grouped Rating Form
- Group 11 ratings into 4 collapsible sections
- Show section progress (e.g., "3/4 rated")
- Physical, Service, Compliance, Satisfaction groups
- Requirements: REV-04, UX-02

**Plan 03** — Simplified Quick Capture
- Collapse notes into expandable section
- Show camera and capture button as primary focus
- Photo preview strip below camera
- Requirements: CAP-02, UX-03

**Plan 04** — Pending Badge Enhancement
- Show pending count on Review nav item
- Pulse animation when count > 0
- Color coding: amber (1-5), red (5+)
- Real-time updates
- Requirements: MOB-03, UX-04

**Plan 05** — Dashboard FAB
- Floating Action Button for Quick Capture
- Amber color, 56px, camera icon
- Hide on scroll down, show on scroll up
- Requirements: CAP-01, MOB-01

**Plan 06** — Touch Target Improvements
- Capture button 64px minimum
- Positioned for thumb reach
- Secondary buttons 44px minimum
- Gloved hand compatible
- Requirements: MOB-02, MOB-04

---

## Phase 04: Wave Structure

| Wave | Plans | Dependencies | Can Parallelize |
|------|-------|--------------|-----------------|
| 1 | 04-01, 04-02, 04-03 | None | 04-01, 04-02, 04-03 |
| 2 | 04-04, 04-05, 04-06 | Wave 1 | 04-04, 04-05, 04-06 |

---

## Current Status Summary

| Phase | Status | Plans Complete | Next Action |
|-------|--------|----------------|-------------|
| 01 | ✅ Complete | 8/8 | — |
| 02 | 🔄 In Progress | 5/8 | Complete 02-02, 02-04 |
| 03 | ✅ Complete | 6/6 | — |
| 04 | ✅ Complete | 6/6 | — |

---
## Gap Closure Phases (from v1.0 audit)

### Phase 05: Verification Baseline Recovery

**Goal:** Rebuild milestone-grade verification evidence for completed phases so requirement coverage can be audited reliably.

**Status:** 📋 PLANNED (0/4 plans)

**Plans:** 6/6 plans complete

**Requirements:** CAP-01..CAP-07, REV-01..REV-07, PERF-01..PERF-05, MOB-01..MOB-04 (evidence reconciliation)

**Gap Closure:**
- Restore/create execution `VERIFICATION.md` artifacts for phases 01, 02, and 03
- Reconcile requirement-to-evidence mapping across phase outputs
- Remove milestone blocker caused by unverified historical phases

Plans:
- [ ] 05-01-PLAN.md - Scaffold canonical execution verification artifacts for phases 01-03
- [ ] 05-02-PLAN.md - Backfill execution evidence for phase 01 and phase 02 verifications
- [ ] 05-03-PLAN.md - Build phase 03 master requirement reconciliation matrix and verification evidence
- [ ] 05-04-PLAN.md - Run quality gate and rerun milestone v1.0 audit

### Phase 05: Wave Structure

| Wave | Plans | Dependencies | Can Parallelize |
|------|-------|--------------|-----------------|
| 1 | 05-01 | None | - |
| 2 | 05-02, 05-03 | 05-01 | 05-02 and 05-03 |
| 3 | 05-04 | 05-02, 05-03 | - |

### Phase 06: Pending Badge Contract and Freshness Wiring

**Goal:** Fix pending count data contract and real-time refresh wiring so dashboard badges are accurate immediately after capture.

**Status:** 📋 PLANNED (0/3 plans)

**Plans:** 3 plans

**Requirements:** CAP-01, CAP-05, CAP-07, REV-01, MOB-03

**Gap Closure:**
- Align backend/frontend pending count contract (`totalRecords` vs `totalCount`)
- Emit/consume refresh events on quick-capture success
- Close broken flow: Quick Capture -> Dashboard pending badge freshness

Plans:
- [ ] 06-01-PLAN.md - Fix API contract: use totalRecords instead of totalCount
- [ ] 06-02-PLAN.md - Emit PENDING_COUNT_UPDATED_EVENT on quick capture success
- [ ] 06-03-PLAN.md - Create integration tests to verify fixes

### Phase 06: Wave Structure

| Wave | Plans | Dependencies | Can Parallelize |
|------|-------|--------------|-----------------|
| 1 | 06-01, 06-02 | None | 06-01 and 06-02 |
| 2 | 06-03 | 06-01, 06-02 | - |

### Phase 07: UI Polish Gap Closure

**Goal:** Complete unresolved Phase 04 UX must-haves and satisfy touch-target constraints.

**Status:** ✅ COMPLETE (3/3 plans)

**Plans:** 3 plans — ALL COMPLETE

**Requirements:** MOB-01, REV-04, CAP-02 — ALL SATISFIED

**Gap Closure:**
- ✅ Implemented grouped rating sections with per-section progress
- ✅ Made Quick Capture camera-first with default-collapsed notes
- ✅ Added FAB hide/show on scroll and finalized 44px+ secondary controls

Plans:
- [x] 07-01-PLAN.md - Fix touch targets: update location presets from 40px to 44px
- [x] 07-02-PLAN.md - Grouped rating form: 4 accordion sections with progress tracking
- [x] 07-03-PLAN.md - Camera-first quick capture: reorder layout, default-collapsed notes

### Phase 07: Wave Structure

| Wave | Plans | Dependencies | Can Parallelize |
|------|-------|--------------|-----------------|
| 1 | 07-01, 07-02, 07-03 | None | 07-01, 07-02, 07-03 |

**Completed:** 2026-02-19

### Phase 08: Monitoring Debt Cleanup (Optional)

**Goal:** Address non-blocking operational debt identified during phase summaries.

**Status:** 📋 PLANNED (0/3 plans)

**Requirements:** R1, R2 (required), R3 (optional)

**Gap Closure:**
- R1: Investigate root cause of 93% memory warning trend
- R2: Update monitoring runbook with concrete thresholds and validation
- R3: (Optional) Establish memory trend baseline

---

#### Phase 08: Plans

**Plan 01** — Memory Investigation
- Review Railway metrics dashboard for memory trends
- Check health endpoints (`/health`, `/health/metrics`, `/health/history`)
- Analyze application logs for memory patterns
- Code review for common memory leak patterns
- Correlate memory with recent deployments/changes
- Document root cause hypothesis
- Output: `08-01-FINDINGS.md`
- Requirements: R1
- Estimated: 60-90 min

**Plan 02** — Runbook Update with Validation
- Review current monitoring runbook
- Validate thresholds against current data
- Create validation procedures for each alert type
- Document remediation validation steps
- Update runbook with concrete, actionable steps
- Create quick reference card
- Output: Updated `docs/monitoring/monitoring-runbook.md`, `QUICK-REFERENCE.md`
- Requirements: R2
- Estimated: 45-60 min

**Plan 03** — Memory Trend Analysis (Optional)
- Gather historical memory data (Railway + health endpoints)
- Analyze trend pattern and growth rate
- Correlate memory with application events
- Create trend baseline document
- (Optional) Add trend alerting to monitoring
- Output: `docs/monitoring/memory-trend-baseline.md`
- Requirements: R3
- Estimated: 30-45 min (+30 optional)

---

#### Phase 08: Wave Structure

| Wave | Plans | Dependencies | Can Parallelize |
|------|-------|--------------|-----------------|
| 1 | 08-01, 08-02 | None | 08-01 and 08-02 |
| 2 | 08-03 | 08-01 (recommended) | - |

**Execution Strategy:**
- **Minimal:** Execute Wave 1 only (08-01 + 08-02 parallel) - ~90 min
- **Full:** Execute all waves (add 08-03) - ~135 min
- **Skip:** Accept debt, defer to later

---

#### Phase 08: Success Criteria

1. **Root cause hypothesis documented** with evidence (08-01)
2. **Runbook updated** with concrete validation checkboxes (08-02)
3. **(Optional) Trend baseline established** with growth rate (08-03)

---

## Gap Closure Status Summary

| Phase | Status | Plans Complete | Next Action |
|-------|--------|----------------|-------------|
| 05 | ✅ COMPLETE | 4/4 | — |
| 06 | ✅ COMPLETE | 3/3 | — |
| 07 | ✅ COMPLETE | 3/3 | — |
| 08 | 📋 PLANNED | 0/3 | Execute Wave 1 (08-01, 08-02) |

---

## Milestone v1.0 Status

**Status:** ✅ **COMPLETE**

**Date Completed:** 2026-02-19  
**Git Tag:** `v1.0.0`  
**Requirements:** 23/23 SATISFIED  
**Phases:** 7/7 COMPLETE  
**Integration Points:** 9/9 VERIFIED  
**End-to-End Flows:** 2/2 WORKING

**Completion Report:** `.planning/v1.0-MILESTONE-COMPLETE.md`  
**Re-Audit Report:** `.planning/v1.0-MILESTONE-REAUDIT.md`

---

## Milestone v2.0: Reporting & Accountability

**Status:** ✅ COMPLETE

**Date Completed:** 2026-02-19  
**Git Tag:** `v2.0.0`  
**Requirements:** 12/12 SATISFIED (Phase 09: 4 + Phase 10: 4 + Phase 11: 4)  
**Phases:** 3/3 COMPLETE

**Completion Report:** `.planning/v2.0-MILESTONE-COMPLETE.md`

---

**Scope:** Analytics, notifications, and issue tagging to enable accountability and trend visibility for facility management.

**MVP Phases:** 09, 10, 11  
**Deferred:** Phase 12 (Offline & Reliability — not a current pain point), Phase 13 (Scheduling — post-feedback)

---

### Phase 09: Analytics & Reporting

**Goal:** Users can view school-level trends and export inspection data for accountability reporting.

**Status:** ✅ COMPLETE (2/2 plans)

**Requirements:** ANALYTICS-01 through ANALYTICS-04 — ALL SATISFIED

**Scope:**
- School trend charts (ratings over time)
- School comparison view (side-by-side summary)
- CSV export of inspection data
- DB-layer GROUP BY aggregation (required — 93% memory baseline; no JS aggregation)

**Success Criteria:**
1. ✅ User can view a trend chart for any school showing average ratings over time
2. ✅ User can compare two or more schools on a single summary view
3. ✅ User can export inspection data as CSV (filtered by school/date range)
4. ✅ Analytics queries run via DB-layer GROUP BY, not in-process aggregation

**Dependencies:** Phases 01–08 complete ✅

**Plans:** 2 plans — ALL COMPLETE

Plans:
- [x] 09-01-PLAN.md — Analytics API layer (storage queries + 3 routes: trends, comparison, CSV export)
- [x] 09-02-PLAN.md — Analytics Dashboard UI (page + App.tsx nav wiring, checkpoint: human verify)

**Verification:** `.planning/phases/09-analytics-reporting/09-VERIFICATION.md`
**Date Completed:** 2026-02-19

---

### Phase 10: Notifications & Alerts

**Goal:** Facility manager receives email alerts when inspection backlog exceeds threshold.

**Status:** ✅ COMPLETE (1/1 plans)

**Requirements:** NOTIF-01 through NOTIF-04

**Scope:**
- Email alerts via Resend when pending backlog exceeds threshold
- Single recipient: rharman@collegiateacademies.org (hardcoded, no preferences UI)
- Add `resend` and `node-cron` dependencies
- No per-user notification preferences (deferred)

**Success Criteria:**
1. Email is sent to rharman@collegiateacademies.org when pending backlog exceeds configured threshold
2. Alert email includes count and link to review queue
3. Alerts fire on a scheduled cadence (not per-capture) to avoid spam
4. No UI changes required — purely server-side

**Dependencies:** Phase 09 (optional — analytics data enriches alert content)

**Plans:**
- [x] 10-01-PLAN.md — Notification service (Resend + node-cron, threshold check, cooldown, HTML email)

---

### Phase 11: Issue Tagging

**Goal:** Inspectors can tag issues with pre-defined categories; managers can filter by tag.

**Status:** ✅ COMPLETE (2/2 plans)

**Requirements:** TAG-01, TAG-02, TAG-03, TAG-04

**Scope:**
- Pre-defined taxonomy of 8–10 common custodial issue types (fixed list for MVP)
- Tags stored on inspection records
- Filterable inspection list by tag
- Dynamic/admin-managed tags deferred to future phase

**Success Criteria:**
1. ✅ Inspector can select one or more tags from a pre-defined list when capturing or completing an inspection
2. ✅ Tags are stored on the inspection record and persist across sessions
3. ✅ Inspection list can be filtered by one or more tags
4. ✅ Tag taxonomy is fixed in code (no admin UI required for MVP)

**Taxonomy:**
| Tag ID | Label | Description |
|--------|-------|-------------|
| floors | Floors | Spills, debris, damage |
| surfaces | Surfaces | Dust, smudges, marks |
| restrooms | Restrooms | Hygiene, supplies |
| trash | Trash | Overflow, improper disposal |
| safety | Safety | Hazards, blocked exits |
| equipment | Equipment | Malfunction, missing |
| hvac | Temperature | HVAC issues |
| lighting | Lighting | Burned out, dim |

**Dependencies:** Phase 09 (tag data feeds analytics filters)

**Plans:** 2 plans

Plans:
- [x] 11-01-PLAN.md — Backend foundation (schema, storage, API endpoints for tags)
- [x] 11-02-PLAN.md — Frontend integration (TagSelector component, Quick Capture, Photo-First Review, filtering)

**Verification:** `.planning/phases/11-issue-tagging/11-VERIFICATION.md`
**Date Completed:** 2026-02-19

### Phase 11: Wave Structure

| Wave | Plans | Dependencies | Can Parallelize |
|------|-------|--------------|-----------------|
| 1 | 11-01 | None | - |
| 2 | 11-02 | 11-01 | - |

---

## Milestone v2.0 Status Summary

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 09 | Analytics & Reporting | ✅ Complete | 2/2 |
| 10 | Notifications & Alerts | ✅ Complete | 1/1 |
| 11 | Issue Tagging | ✅ Complete | 2/2 |

---

## Milestone v2.5: Polish and Enhancements

**Goal:** Refine the user experience, improve offline reliability, and introduce scheduling to enhance the daily utility of the application for custodial staff.

**Status:** 📋 PLANNED

**Requirements:** 13/13 Mapped (Phase 12: 3, Phase 13: 4, Phase 14: 4, Phase 15: 2)

### Phases

- [ ] **Phase 12: Home Page Layout Reorganization** - Refine the dashboard layout to prioritize field workflows (Quick Capture) and improve mobile usability.
- [ ] **Phase 13: Offline Sync Hardening** - Ensure reliable quick capture functionality even in areas with poor or no connectivity.
- [ ] **Phase 14: Inspection Scheduling** - Enable recurring inspection cadences to ensure consistent facility coverage.
- [ ] **Phase 15: Voice Notes** - Allow hands-free note taking during quick capture via speech-to-text.

---

## Phase Details

### Phase 12: Home Page Layout Reorganization
**Goal**: Refine the dashboard layout to prioritize field workflows (Quick Capture) and improve mobile usability.
**Depends on**: Milestone v2.0
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03
**Success Criteria** (what must be TRUE):
  1. User sees "Quick Capture" as the primary, most prominent call to action on the dashboard.
  2. User can easily locate and access "Review Inspections" and the pending badge.
  3. User can comfortably reach primary actions with their thumb when using a mobile device in portrait orientation.
**Plans**: TBD

### Phase 13: Offline Sync Hardening
**Goal**: Ensure reliable quick capture functionality even in areas with poor or no connectivity.
**Depends on**: Phase 12
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04
**Success Criteria** (what must be TRUE):
  1. User can successfully save quick captures while the device has no internet connection.
  2. User can immediately identify their current online/offline status via UI indicators.
  3. User can view the queue of pending uploads waiting to synchronize.
  4. User's offline captures sync automatically and consistently without data loss when connection is restored.
**Plans**: TBD

### Phase 14: Inspection Scheduling
**Goal**: Enable recurring inspection cadences to ensure consistent facility coverage.
**Depends on**: Phase 13
**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04
**Success Criteria** (what must be TRUE):
  1. Admin can define and save recurring schedules (daily, weekly) for specific locations.
  2. User sees their "due" or "upcoming" scheduled inspections listed on the dashboard.
  3. User can tap a scheduled inspection to immediately open the capture form for that location.
  4. Admin can view a report showing completion rates against defined schedules.
**Plans**: TBD

### Phase 15: Voice Notes
**Goal**: Allow hands-free note taking during quick capture via speech-to-text.
**Depends on**: Phase 12
**Requirements**: VOICE-01, VOICE-02
**Success Criteria** (what must be TRUE):
  1. User can tap a microphone button in quick capture to record audio that transcribes to text.
  2. User can edit the resulting transcribed text using the keyboard before saving.
**Plans**: TBD

---

## Progress Summary

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 12. Home Page Layout Reorganization | 4/4 | ✅ Complete | 2026-02-20 |
| 13. Offline Sync Hardening | 0/0 | Not started | - |
| 14. Inspection Scheduling | 0/0 | Not started | - |
| 15. Voice Notes | 0/0 | Not started | - |

---

*Roadmap created: 2026-02-19*
*Last updated: 2026-02-19 - Milestone v2.5 Planned*
