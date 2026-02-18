---
phase: 04-ui-polish
plan: 04
subsystem: ui
tags: [react, badge, urgency, polling, workflow]

requires:
  - phase: 04-01
    provides: photo review layout and workflow card baseline
  - phase: 04-02
    provides: grouped rating flow context for review lifecycle
  - phase: 04-03
    provides: quick capture flow and capability inventory pattern
provides:
  - Dashboard review badges wired to shared pending-count state
  - Urgency styling thresholds with pulse behavior for pending work
  - Near-real-time pending count refresh via polling and action events
affects: [dashboard, review, quick-capture, ui-polish]

tech-stack:
  added: []
  patterns:
    - Shared pending count hook for cross-surface badge consistency
    - Event-driven count refresh after complete/discard mutations

key-files:
  created:
    - .planning/phases/04-ui-polish/04-04-CAPABILITY-INVENTORY.md
    - src/hooks/usePendingCount.ts
  modified:
    - src/App.tsx
    - src/components/ui/FloatingActionButton.tsx
    - src/hooks/usePendingInspections.ts
    - .planning/phases/04-ui-polish/deferred-items.md

key-decisions:
  - "Checkpoint decision preset applied: option-b (expanded capability inventory)."
  - "Urgency thresholds resolved as amber 1-4, red >=5 to remove overlap at count 5."
  - "Remote deep-journey is treated as flaky regression signal; local check/build and visual-analysis are primary verification gates for this UI plan."

patterns-established:
  - "Badge urgency pattern: thresholded color + subtle pulse when count > 0."
  - "Dashboard count freshness: polling + mutation broadcast events."

duration: 5 min
completed: 2026-02-18
---

# Phase 04 Plan 04: Pending Badge Urgency Summary

**Workflow review surfaces now share a live pending count with urgency thresholds and pulsing badges to prioritize review backlog.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-18T14:45:57-06:00
- **Completed:** 2026-02-18T14:50:45-06:00
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments
- Applied capability-orchestration checkpoint with option-b inventory before code changes.
- Replaced ad-hoc dashboard polling with reusable `usePendingCount` wiring in `App`.
- Added urgency visuals to Review card and FAB badges (amber normal, red backlog, pulse when pending).
- Added near-real-time refresh on interval, tab focus/visibility, and complete/discard mutation events.

## Task Commits

Each task was committed atomically:

1. **Task 1: Checkpoint: Capability inventory and orchestration** - `5f1e2fa9` (docs)
2. **Task 2: Add pending badge to Review nav item** - `d3b2c2a3` (feat)
3. **Task 3: Add pulse animation and color coding** - `554a8685` (feat)
4. **Task 4: Ensure real-time updates** - `39e968c3` (feat)

**Plan metadata:** pending

## Files Created/Modified
- `.planning/phases/04-ui-polish/04-04-CAPABILITY-INVENTORY.md` - Option-b tool/agent/skill orchestration record.
- `src/hooks/usePendingCount.ts` - Shared pending count hook with polling and refresh triggers.
- `src/App.tsx` - Dashboard wiring for Review card + FAB pending badges via hook state.
- `src/components/ui/FloatingActionButton.tsx` - Urgency color thresholds and pulse behavior for badges.
- `src/hooks/usePendingInspections.ts` - Emits pending-count update event after complete/discard actions.
- `.planning/phases/04-ui-polish/deferred-items.md` - Captures remote deep-journey CSRF/rate-limit instability.

## Decisions Made
- Used expanded inventory path (`option-b`) and documented orchestration before implementation.
- Resolved threshold ambiguity by making backlog red at `>=5` and amber at `1-4`.
- Kept deep-journey as remote regression guard only because remote target currently returns CSRF/rate-limit errors unrelated to this plan scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Resolved overlapping urgency threshold at count 5**
- **Found during:** Task 3 (Add pulse animation and color coding)
- **Issue:** Plan wording had overlap (`amber 1-5` and `red 5+`) causing ambiguous rendering at exactly 5.
- **Fix:** Implemented mutually exclusive urgency logic with `red >=5`, `amber 1-4`.
- **Files modified:** `src/components/ui/FloatingActionButton.tsx`
- **Verification:** Visual-analysis run completed and classes map deterministically by threshold.
- **Committed in:** `554a8685`

**2. [Rule 2 - Missing Critical] Added mutation-driven count refresh after complete/discard**
- **Found during:** Task 4 (Ensure real-time updates)
- **Issue:** Polling alone could leave stale count immediately after review actions.
- **Fix:** Broadcast `pending-inspections-updated` event from completion/discard hooks and consume in `usePendingCount`.
- **Files modified:** `src/hooks/usePendingInspections.ts`, `src/hooks/usePendingCount.ts`
- **Verification:** Typecheck/build pass; event wiring validated by static flow inspection.
- **Committed in:** `39e968c3`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Deviations tightened correctness and responsiveness without expanding scope.

## Authentication Gates
None.

## Issues Encountered
- Remote regression command `dev-browser-deep-journey.cjs` intermittently fails with CSRF `403` and rate-limit `429` responses from `custodialcommand-dev.up.railway.app`; captured in deferred items and treated as out-of-scope environment instability for this local UI polish execution.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Badge urgency and update wiring are complete and locally verified (`npm run check`, `npm run build`, `node tests/visual-analysis.cjs`).
- Phase remains exposed to remote environment instability for deep-journey checks; see deferred items for follow-up.

## Self-Check: PASSED

- Verified summary and key implementation files exist on disk.
- Verified all task commit hashes resolve in git history.

---
*Phase: 04-ui-polish*
*Completed: 2026-02-18*
