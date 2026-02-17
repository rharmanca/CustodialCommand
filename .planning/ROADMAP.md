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
*Roadmap created: 2026-02-16*
*Last updated: 2026-02-16 - Created 6 detailed execution plans for Phase 03*
