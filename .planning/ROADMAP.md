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
| 04 | 📋 Planned | 0/6 | Ready for execution |

---
## Gap Closure Phases (from v1.0 audit)

### Phase 05: Verification Baseline Recovery

**Goal:** Rebuild milestone-grade verification evidence for completed phases so requirement coverage can be audited reliably.

**Requirements:** CAP-01..CAP-07, REV-01..REV-07, PERF-01..PERF-05, MOB-01..MOB-04 (evidence reconciliation)

**Gap Closure:**
- Restore/create execution `VERIFICATION.md` artifacts for phases 01, 02, and 03
- Reconcile requirement-to-evidence mapping across phase outputs
- Remove milestone blocker caused by unverified historical phases

### Phase 06: Pending Badge Contract and Freshness Wiring

**Goal:** Fix pending count data contract and real-time refresh wiring so dashboard badges are accurate immediately after capture.

**Requirements:** CAP-01, CAP-05, CAP-07, REV-01, MOB-03

**Gap Closure:**
- Align backend/frontend pending count contract (`totalRecords` vs `totalCount`)
- Emit/consume refresh events on quick-capture success
- Close broken flow: Quick Capture -> Dashboard pending badge freshness

### Phase 07: UI Polish Gap Closure

**Goal:** Complete unresolved Phase 04 UX must-haves and satisfy touch-target constraints.

**Requirements:** MOB-01, REV-04, CAP-02

**Gap Closure:**
- Implement grouped rating sections with per-section progress
- Make Quick Capture camera-first with default-collapsed notes
- Add FAB hide/show on scroll and finalize 44px+ secondary controls

### Phase 08: Monitoring Debt Cleanup (Optional)

**Goal:** Address non-blocking operational debt identified during phase summaries.

**Requirements:** Operational reliability follow-up (non-functional)

**Gap Closure:**
- Investigate and remediate sustained high-memory warning trend
- Update monitoring runbook actions with concrete thresholds and remediation validation

---

## Gap Closure Status Summary

| Phase | Status | Plans Complete | Next Action |
|-------|--------|----------------|-------------|
| 05 | 📋 Planned | 0/0 | /gsd-plan-phase 05 |
| 06 | 📋 Planned | 0/0 | /gsd-plan-phase 06 |
| 07 | 📋 Planned | 0/0 | /gsd-plan-phase 07 |
| 08 | 📋 Optional | 0/0 | /gsd-plan-phase 08 (if included) |

---
*Roadmap created: 2026-02-16*
*Last updated: 2026-02-19 - Added Phase 05-08 milestone gap closure phases from v1.0 audit*
