# Custodial Command - Project State

## Project Overview
- **Name**: Custodial Command
- **Current Phase**: Milestone v2.5 — Planning
- **Current Plan**: Defining requirements and roadmap
- **Status**: 🔄 **MILESTONE v2.5 IN PROGRESS** (Planning phase)
- **Version**: 2.5.0-alpha
- **Tag**: v2.0.0 (Last stable)
- **Requirements**: Defining for v2.5

## Phase Progress

```
Phase 01: review-and-testing [█████████] 100% ✅
├── 01-01: Navigation Testing ✅ COMPLETE
├── 01-02: Forms Testing ✅ COMPLETE
├── 01-03: Data Testing ✅ COMPLETE
├── 01-04: Admin Testing ✅ COMPLETE
├── 01-05: Database Testing ✅ COMPLETE
├── 01-06: API Testing ✅ COMPLETE
├── 01-07: Mobile Testing ✅ COMPLETE
├── 01-08: Cross-cutting Testing ✅ COMPLETE
└── 01-VERIFICATION.md ✅ SCAFFOLDED

Phase 02: recommendations [███████░░] 87% 🔄
├── 02-01: Immediate Verification ✅ COMPLETE
├── 02-02: Cross-Browser Testing ⏳ PENDING
├── 02-03: Performance Testing ✅ COMPLETE
├── 02-04: Cleanup ⏳ PENDING
├── 02-05: Monitoring ✅ COMPLETE
└── 02-VERIFICATION.md ✅ SCAFFOLDED

Phase 03: workflow-improvements [█████████] 100% ✅
├── 03-01: Quick Capture Core ✅ COMPLETE
├── 03-02: Photo-First Review ✅ COMPLETE
├── 03-03: Thumbnail Generation ✅ COMPLETE
├── 03-04: Mobile UX Polish ✅ COMPLETE
├── 03-05: Photo-First Review Page ✅ COMPLETE
├── 03-06: Workflow Completion ✅ COMPLETE
└── 03-VERIFICATION.md ✅ SCAFFOLDED

Phase 04: ui-polish [█████████] 100% ✅
├── 04-01: Capability Orchestration ✅ COMPLETE
├── 04-02: Grouped Rating Form ✅ COMPLETE
├── 04-03: Quick Capture Simplification ✅ COMPLETE
├── 04-04: Pending Badge + FAB ✅ COMPLETE
├── 04-05: Dashboard FAB ✅ COMPLETE
└── 04-06: Touch Targets + Reachability ✅ COMPLETE

Phase 05: verification-baseline-recovery [█████████] 100% ✅
├── 05-01: Scaffold Verification Artifacts ✅ COMPLETE
├── 05-02: Evidence Backfill ✅ COMPLETE
├── 05-03: Requirement Reconciliation ✅ COMPLETE
└── 05-04: Quality Gate Audit ✅ COMPLETE

Phase 06: pending-badge-freshness [█████████] 100% ✅
├── 06-01: Fix API Contract ✅ COMPLETE
├── 06-02: Emit Refresh Event ✅ COMPLETE
└── 06-03: Integration Verification ✅ COMPLETE

Phase 07: ui-polish-gap-closure [█████████] 100% ✅
├── 07-01: Touch Target Fixes (MOB-01) ✅ COMPLETE
├── 07-02: Grouped Rating Sections ✅ COMPLETE
├── 07-03: Camera-First Layout + FAB Scroll ✅ COMPLETE
└── 07-VERIFICATION.md ✅ COMPLETE

Phase 08: monitoring-debt-cleanup [█████████] 100% ✅ (All Waves Complete)
├── 08-01: Memory Investigation ✅ COMPLETE
├── 08-02: Runbook Update ✅ COMPLETE
├── 08-03: [Optional] Trend Analysis ✅ COMPLETE
└── 08-VERIFICATION.md ✅ COMPLETE

Phase 09: analytics-reporting [█████████] 100% ✅
├── 09-01: Analytics API Layer ✅ COMPLETE
├── 09-02: Analytics Dashboard UI ✅ COMPLETE
└── 09-VERIFICATION.md ✅ COMPLETE

Phase 10: notifications-alerts [█████████] 100% ✅
├── 10-01: Notification Service ✅ COMPLETE
└── 10-VERIFICATION.md ✅ COMPLETE
```

## Project Context

**Core Value:** Custodial staff can efficiently capture facility issues while walking, then complete detailed assessments later with photo reference.

**Key Improvement:** Quick capture mode that allows rapid photo documentation in the field, with detailed review completed later on desktop using photos as reference.

## Requirements Summary

| Category | Count | Status |
|----------|-------|--------|
| Quick Capture (CAP) | 7 | Phase 03 |
| Photo-First Review (REV) | 7 | Phase 03 |
| Performance (PERF) | 5 | Phase 03 |
| Mobile UX (MOB) | 4 | Phase 03 |
| **Total Phase 03** | **23** | **Planned** |

## Key Decisions

1. **Quick Capture Separate Workflow**: Walking flow (rapid) vs Review flow (thorough)
2. **Photo-First Review on Desktop**: Larger screens better for detailed assessment
3. **Optional Quick Notes**: Some items need immediate context
4. **Timeline**: No hard deadline; implement as bandwidth allows
5. **Inspection Status Enum**: Three states: 'pending_review', 'completed', 'discarded' with backward-compatible default
6. **Separate Timestamps**: captureTimestamp tracks quick capture, completionTimestamp tracks full review
7. **Progressive Photo Loading**: Blur placeholder -> 200x200 thumbnail -> full image for optimal UX
8. **Split-Pane Layout**: 400px sticky sidebar for photos, scrollable form for desktop review
9. **Touch-Optimized UI**: 44px+ touch targets, 64px capture button for gloved hands
10. **Canvas-based Screenshot**: Better quality control vs react-webcam getScreenshot
11. **FAB for Mobile Quick Capture**: Floating Action Button provides immediate access to capture mode
12. **Visual Workflow Distinction**: Amber/warm colors for capture, teal/cool colors for review
13. **Pending Count Badges**: Dashboard shows real-time count of inspections awaiting review
14. **Option-B Capability Inventory**: Expanded tool/agent/skill orchestration recorded before implementation
15. **Sticky Thumb Zone**: Mobile camera block remains reachable above safe-area and save bar
16. **Explicit Touch Minimums**: Primary capture at 64px, secondary actions at 44px minimum
17. **Pending Badge Urgency Bands**: Backlog highlights use red at >=5 while amber covers 1-4 pending items
18. **Pending Count Freshness**: Dashboard count refreshes via 30s polling and complete/discard mutation events
19. **Verification Status Vocabulary**: Standardized on SATISFIED/BLOCKED/UNVERIFIED/NEEDS_RERUN for all verification files
20. **Baseline Capture Pre-Backfill**: Phase completeness checks recorded before evidence population to preserve pre-recovery state

## Next Actions

1. **Milestone v1.0 COMPLETE**: All 8 phases finished
2. **Milestone v2.0 COMPLETE**: Phases 09-11 finished, Tagged v2.0.0
3. **Next**: Define roadmap and requirements for Milestone v2.5 (Polish and Enhancements)
   - Focus on Deferred Items: Home page layout, Offline & Reliability, Scheduling

---

## Milestone v1.0 Completion

**Status:** Ready to plan
**Date:** 2026-02-19  
**Tag:** `v1.0.0`

### Completion Summary

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Phases | 7 | 7 | ✅ 100% |
| Requirements | 23 | 23 | ✅ 100% |
| Integration Points | 9 | 9 | ✅ 100% |
| End-to-End Flows | 2 | 2 | ✅ 100% |

### Reports
- **Completion Report:** `.planning/v1.0-MILESTONE-COMPLETE.md`
- **Re-Audit Report:** `.planning/v1.0-MILESTONE-REAUDIT.md`

### Key Deliverables
- Quick Capture workflow with FAB entry
- Photo-First Review with grouped ratings
- Real-time pending badge updates
- Mobile-optimized UI (44px+ touch targets)
- All TypeScript checks passing

## Key Decisions (New)

21. **MOB-01 BLOCKED**: Touch target violations confirmed in Phase 04 verification (40px vs 44px required)
22. **PERF-01/04 UNVERIFIED**: Runtime performance claims require direct measurement evidence
23. **Denominator discrepancy**: REQUIREMENTS.md states 21 requirements but lists 23 (documentation error noted)
24. **Verification score**: 20/23 requirements satisfied (87% coverage) for Phase 03
25. **Baseline blocker CLOSED**: Missing verification artifacts for phases 01-03 now resolved
26. **Milestone v1.0 status**: AUDITABLE WITH GAPS (20/23 requirements satisfied)
27. **API contract fix**: Frontend updated to match backend (totalRecords field) - single line change preferred over backend modification
28. **Integration test approach**: Combined API verification with source code pattern inspection to handle auth-required endpoints
29. **Memory root cause**: multer memoryStorage + synchronous file reads, not a leak
30. **Memory trend baseline**: 0%/day growth confirmed, sawtooth GC pattern (87–96%), P3 remediation priority — no immediate action needed
31. **Trend alerting added**: Linear regression over 10-point window, TREND_WARNING fires when predicted to hit 95% critical within 30 minutes
32. **Phase 09 complete**: Analytics Dashboard with trends, comparison, CSV export — all 4 ANALYTICS requirements satisfied
33. **Zero JS aggregation**: All analytics queries use SQL GROUP BY/AVG, confirmed via storage.ts grep — no memory risk
34. **Phase 10 complete**: Notification service with Resend API, threshold alerts (10 pending OR 48h oldest), 24h cooldown, daily 8am weekday schedule
35. **File-based cooldown**: Simpler than database storage, no migration needed, works across server restarts
36. **Environment toggle**: Service gracefully skips email sending if RESEND_API_KEY not configured — no hard dependency
37. **Phase 11 planned**: 2-plan structure with backend-first approach (11-01) then frontend integration (11-02)
38. **Tag taxonomy**: 8 fixed tags with icons (floors, surfaces, restrooms, trash, safety, equipment, hvac, lighting)

## File References

- **Project**: `.planning/PROJECT.md`
- **Requirements**: `.planning/REQUIREMENTS.md`
- **Roadmap**: `.planning/ROADMAP.md`
- **Codebase Map**: `.planning/codebase/`

## Last Session

- **Timestamp**: 2026-02-20
- **Activity**: Phase 07-03 Camera-First Layout + FAB Scroll — SUMMARY.md created
- **Summary**: Plan 07-03 was previously executed (commit 9181683f). Created 07-03-SUMMARY.md documenting: QuickNoteInput collapsible API (controlled/uncontrolled pattern), camera-first DOM reorder in quick-capture.tsx, App-level scroll direction detection for FAB visibility with showFab state, FloatingActionButton visible prop with CSS translate/opacity transition. TypeScript compiles clean.

## Performance Metrics

| Phase-Plan | Duration | Tasks | Files | Date |
|------------|----------|-------|-------|------|
| 08-01 | ~45m | 6/6 | 1 | 2026-02-19 |
| 08-02 | ~25m | 7/7 | 2 | 2026-02-19 |
| 08-03 | ~60m | 5/5 | 2 | 2026-02-19 |
| 04-03 | ~5m | 2/2 | 3 | 2026-02-19 |
| 04-01 | ~15m | 3/3 | 2 | 2026-02-19 |
| Phase 04-ui-polish P05 | 8min | 3 tasks | 1 files |
| Phase 12 P04 | 8 min | 2 tasks | 1 files |
| Phase 07 P02 | 20min | 3 tasks | 1 files |
| Phase 07-01 P07-01 | 5min | 2 tasks | 1 files |
| Phase 07 P03 | 25min | 3 tasks | 4 files |
| Phase 13 P01 | 4min | 3 tasks | 3 files |
| Phase 13 P03 | 5min | 4 tasks | 4 files |
| Phase 13 P02 | 3min | 4 tasks | 4 files |

## Phase Progress

```
Phase 10: notifications-alerts [█████████] 100% ✅
├── 10-01: Notification Service ✅ COMPLETE
└── 10-VERIFICATION.md ✅ COMPLETE
```

## Phase 11: issue-tagging [█████████] 100% ✅
├── 11-01: Backend Foundation ✅ COMPLETE
├── 11-02: Frontend Integration ✅ COMPLETE
└── 11-VERIFICATION.md ✅ COMPLETE

---

## Milestone v2.5: Polish and Enhancements

**Status:** 📋 PLANNED

```
Phase 12: home-page-layout-reorganization [██████████] 100% ✅
├── Context gathered ✅
├── Research complete ✅
├── 12-01: Dashboard + Quick Capture ✅ COMPLETE
├── 12-02: Review + Pending Badge ✅ COMPLETE
├── 12-03: Mobile Optimization ✅ COMPLETE
├── 12-04: Thumb Zone Positioning (Gap Closure) ✅ COMPLETE
├── 12-VERIFICATION.md ✅ COMPLETE (gaps found → gaps closed)
└── Status: COMPLETE — All 4 plans finished, gap closure verified
```

```
Phase 13: offline-sync-hardening [███░░░░░░] 75% 🔄
├── Context gathered ✅
├── Research complete ✅
├── 13-01: Storage Quota Management ✅ COMPLETE
├── 13-02: Status Indicators Integration ✅ COMPLETE (awaiting human verify)
├── 13-03: Pending Queue UI ✅ COMPLETE (awaiting human verify)
└── 13-04: Data Consistency Hardening ⏳ PENDING
```

---
*Last updated: 2026-02-21*
*07-03-SUMMARY.md created: Camera-first layout + FAB scroll plan documented*
*Phase 12 Status: COMPLETE — Gap closure verified, LAYOUT-01 and LAYOUT-03 satisfied*
*Phase 13 Plan 01 Status: COMPLETE — Storage quota management with warning/prune/UI*
*Phase 13 Plan 02 Status: COMPLETE — Network status indicators in Dashboard + Quick Capture*
*Phase 13 Plan 03 Status: COMPLETE — Pending queue UI with usePendingUploads hook, PendingUploadCard, PendingUploads, Dashboard integration*

## Key Decisions (New)

39. **Tag filtering client-side**: Applied after data fetch to match existing filter pattern in Inspection Data
40. **Max 3 tags**: Prevents over-categorization, keeps UI clean and decision-making simple
41. **OR filter logic**: Inspections with ANY selected tag are shown (more inclusive for filtering)
42. **GIN index recommended**: For production performance on tag filtering
43. **04-03 verified complete**: Quick Capture simplification already implemented with camera-first layout, collapsible notes, and visible photo strip
44. **04-01 sticky sidebar pattern**: Parent container handles sticky with `items-start` grid alignment, not the Card itself, to avoid CSS conflicts and ensure proper sticky behavior
45. **Primary + grid photo viewer**: Large primary display with 4-column thumbnail grid provides clear visual hierarchy and easy photo navigation
46. **04-05 FAB size standardization**: Updated from 64px to 56px to match Material Design specification with proportional icon scaling
47. **12-01 dashboard structure**: Three workflow sections (Capture/Review/Analyze) with background color block separation
48. **12-01 QuickCaptureCard specs**: 120px minimum touch target, 48px camera icon, amber theme for field use with gloved hands
49. **12-02 PendingBadge urgency colors**: Amber (1-4 items), Red (5+ items), Gray (0 items) per Decision 17
50. **12-02 ReviewSection integration**: Self-contained component with usePendingInspections hook, teal theme for visual distinction
51. **12-02 Dashboard scaffold pattern**: Created minimal Dashboard.tsx to unblock integration, Plan 01 will expand with full structure
52. **12-01 responsive layout**: Mobile stacked, desktop two-column grid (Capture | Review), Analyze spans full width
53. **12-03 SafeAreaWrapper**: env(safe-area-inset-*) support for iPhone home indicator with fallback values
54. **12-03 touch target sizing**: 48px minimum (exceeds 44px requirement) for field use with gloved hands
55. **12-03 MobileNav optional**: Component conditionally rendered by parent, not always visible
56. **12-03 FAB clearance**: SafeAreaSpacer prevents content overlap with floating action button on mobile
57. **12-04 flexbox thumb zone**: flex-1 spacer pushes QuickCaptureCard to bottom, more responsive than fixed positioning
58. **12-04 responsive height constraint**: min-h-[400px] mobile ensures card in bottom 1/3, sm:min-h-0 removes constraint on desktop
59. **Storage API with IndexedDB fallback**: navigator.storage.estimate() preferred for quota values, IndexedDB blob-size sum as fallback for older browsers (Phase 13-01)
60. **savePhoto() quota gate**: warn at 80%, auto-prune + retry at 95%, throw only if still critical after prune — ensures quick capture keeps working in warning band (Phase 13-01)
61. **pruneOldItems MIN_RETENTION_COUNT=50**: never prunes below 50 synced items regardless of age — prevents wiping user's recent work (Phase 13-01)
62. **StorageWarning hidden when healthy**: component hidden by default below 80% to avoid cluttering daily experience (Phase 13-01)
63. **compact mobile, full desktop for Dashboard NetworkIndicator**: responsive sizing via useIsMobile to balance information density (Phase 13-02)
64. **wasOffline 3s window**: drives Back Online pulse animation; cleared when going offline again to prevent stale state (Phase 13-02)
65. **role=alert for offline banner, role=status for indicator**: assertive for urgent offline state in Quick Capture, polite for ongoing status indicator (Phase 13-02)
66. **HEAD /health polling fallback**: iOS Safari navigator.onLine unreliable — 5s polling with AbortController 3s timeout validates actual connectivity (Phase 13-02)
67. **Poll IndexedDB every 5s for pending uploads**: more robust than event-only approach for iOS Safari where background events may be missed (Phase 13-03)
68. **getPhotosByStatus direct IDB query**: photoStorage.getPendingPhotos() only returns 'pending' — added direct IDB query for 'failed' photos in usePendingUploads hook (Phase 13-03)
69. **syncingIds module-level Set**: avoids stale closure issues when offlineManager events fire asynchronously during React render cycles (Phase 13-03)
70. **PendingUploads between Review and Analyze**: provides visibility without disrupting primary capture/review workflow; right-aligned on desktop (Phase 13-03)
