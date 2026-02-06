# Task Plan: Production Testing & Bug Fixes

**Goal**: Autonomously test every aspect of the deployed CustodialCommand application and fix all discovered bugs

**Target**: https://cacustodialcommand.up.railway.app/

**Status**: COMPLETE (19/25 bugs fixed, 3 deferred, 3 resolved by other fixes)

---

## Completed Phases

### Phase 1: Autonomous Production Testing ✅
- [x] Health & infrastructure (3 tests)
- [x] Navigation & pages (12 tests)
- [x] Single room inspection (8 tests)
- [x] Whole building inspection (10 tests)
- [x] Custodial notes (8 tests)
- [x] Monthly feedback (4 tests)
- [x] Scores dashboard (5 tests)
- [x] Inspection data & exports (12 tests)
- [x] Admin panel (4 tests)
- [x] API endpoints (28 tests)
- [x] Security (11 tests)
- [x] PWA & offline (12 tests)
- [x] Accessibility (8 tests)
- [x] Mobile responsiveness (3 tests)
- **Result**: 128 tests, 79% pass rate, 25 bugs found

### Phase 2: Critical Bug Fixes ✅ (commit `fda5640e`)
- [x] Add Inspector Name field to single room inspection form
- [x] Fix input sanitization middleware ordering
- [x] Rebuild dist with service worker v11

### Phase 3: High Priority Bug Fixes ✅ (commit `4ab44a68`)
- [x] Restrict CORS to allowed origins
- [x] Fix retryAfter rate limit values

### Phase 4: Medium Priority Bug Fixes ✅ (commit `11cbf75d`)
- [x] Fix API format mismatch (custodial notes + monthly feedback)
- [x] Remove viewport pinch-to-zoom restriction
- [x] Fix PDF export wizard ratingThreshold default
- [x] Add Cache-Control to CSRF endpoint
- [x] Add aria-labels to star rating buttons
- [x] Fix date timezone bug (UTC → local)

### Phase 5: Low Priority Bug Fixes ✅ (commit `d8861363`)
- [x] Use proper NotFoundPage component
- [x] Tighten CSP directives
- [x] Fix "Room null" display
- [x] Rename "All Schools" filter
- [x] Correct API endpoint docs

### Phase 6: Documentation ✅
- [x] Update PROJECT_STATUS.md
- [x] Update production test findings with fix status
- [x] Update progress.md
- [x] Update task_plan.md
- [x] Commit and push documentation

---

## Deferred Items (Future Sessions)

### Navigation System Refactor (Bug #19, #20)
**Problem**: App uses dual navigation - React state (`setCurrentPage`) for menu buttons and Wouter for URL routing. These can get out of sync, causing inconsistent page transitions and occasional random navigation during form editing.
**Approach**: Migrate all navigation to Wouter URL-based routing, remove `currentPage` state, use `useLocation` hook consistently.
**Files**: `src/App.tsx` (main switch/case → Route components), all page components (remove `onBack` prop pattern)

### Memory Usage Investigation
**Problem**: Health endpoint reported ~95% memory usage. Could be memory leak, insufficient allocation, or accumulated session/cache data.
**Approach**: Profile with `--inspect` flag, check for uncollected event listeners, review session store cleanup interval.

### Icon Path Consistency
**Problem**: Manifest icon paths may not match actual file locations.
**Approach**: Audit `manifest.json` icon entries against actual files in `public/`.

### Post-Fix Verification
**Approach**: Re-run the autonomous production test suite (`docs/plans/2026-02-05-autonomous-production-testing.md`) against the deployed application to verify all 4 fix waves are working correctly in production.
