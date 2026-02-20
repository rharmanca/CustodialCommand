---
phase: 07-ui-polish-gap-closure
plan: 03
subsystem: ui
tags: [mobile-ux, camera-first, collapsible, fab, scroll-behavior, quick-capture]

requires:
  - phase: 07-ui-polish-gap-closure
    provides: Touch target fixes (07-01) and grouped rating sections (07-02)
  - phase: 04-ui-polish
    provides: QuickNoteInput base component, FloatingActionButton, quick-capture page

provides:
  - Camera-first DOM layout in Quick Capture (camera before metadata)
  - Collapsible QuickNoteInput with controlled and uncontrolled props
  - App-level scroll direction detection for FAB visibility
  - FloatingActionButton visible prop with CSS translate/opacity transition

affects: [quick-capture, floating-action-button, app-shell]

tech-stack:
  added: []
  patterns:
    - Controlled/uncontrolled collapse pattern (controlled prop overrides internal state)
    - App-level scroll listener with passive event for FAB show/hide
    - CSS transition-based FAB visibility (translate-y + opacity, no layout shift)

key-files:
  created: []
  modified:
    - src/pages/quick-capture.tsx
    - src/components/capture/QuickNoteInput.tsx
    - src/App.tsx
    - src/components/ui/FloatingActionButton.tsx

key-decisions:
  - "DOM reorder for camera-first (not CSS order) preserves accessibility and tab order"
  - "App-level scroll listener manages FAB visibility globally across all pages"
  - "QuickNoteInput supports both controlled (collapsed prop) and uncontrolled (defaultCollapsed) patterns"
  - "FAB hides after 100px scroll threshold scrolling down, shows immediately on scroll up"

patterns-established:
  - "Controlled/uncontrolled collapse: controlled prop !== undefined overrides internal state"
  - "Passive scroll listener on window with cleanup in useEffect"

requirements-completed: []

duration: 25min
completed: 2026-02-19
---

# Phase 07 Plan 03: Camera-First Layout + FAB Scroll Summary

**Camera section moved to DOM-first position in Quick Capture with collapsible notes (defaultCollapsed=true) and App-level scroll-direction FAB visibility via translate/opacity CSS transitions.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-19
- **Completed:** 2026-02-19
- **Tasks:** 3 of 3
- **Files modified:** 4

## Accomplishments

- QuickNoteInput now supports `collapsed`, `onCollapsedChange`, and `defaultCollapsed` props with controlled/uncontrolled pattern
- Quick Capture page reordered so camera section is first in DOM (before school/location/name metadata)
- Metadata section styled as secondary (muted boxed section) to reduce visual competition with camera
- Notes section uses `defaultCollapsed={true}` — shows "Add quick notes" toggle button by default
- App.tsx scroll direction detection: FAB hides when scrolling down past 100px, shows when scrolling up
- FloatingActionButton `visible` prop added with `translate-y-20 opacity-0` CSS transition when hidden

## Task Commits

All tasks committed together in a single atomic commit:

1. **Task 1: Add collapsible API to QuickNoteInput** - `9181683f` (feat)
2. **Task 2: Reorder Quick Capture to camera-first** - `9181683f` (feat)
3. **Task 3: Update styles for camera-first layout** - `9181683f` (feat)

## Files Created/Modified

- `src/components/capture/QuickNoteInput.tsx` - Added collapsed/onCollapsedChange/defaultCollapsed props, toggle button UI, controlled/uncontrolled state management
- `src/pages/quick-capture.tsx` - Camera section moved before metadata, metadata in muted boxed section, QuickNoteInput with defaultCollapsed={true}
- `src/App.tsx` - Added showFab/lastScrollY state, scroll direction useEffect with passive listener
- `src/components/ui/FloatingActionButton.tsx` - Added visible prop, CSS transition classes for show/hide

## Decisions Made

1. **DOM reorder vs CSS order:** Used actual DOM reorder for camera-first to preserve accessibility and tab order (not CSS `order` property). Screen readers and keyboard navigation follow DOM order.

2. **Scroll listener location:** App-level scroll detection ensures FAB behavior is consistent across all pages, not just Quick Capture. Single listener manages global state.

3. **FAB threshold:** Hides after scrolling past 100px (prevents hiding on tiny incidental scrolls), shows immediately on any upward scroll intent.

4. **Controlled/uncontrolled collapse:** QuickNoteInput checks `controlledCollapsed !== undefined` — if controlled prop supplied it takes precedence; otherwise internal state is used. quick-capture.tsx uses `defaultCollapsed` (uncontrolled), but controlled prop available for future use.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Camera-first layout ships the UX improvement identified in Phase 04 verification
- FAB scroll behavior is globally consistent (not page-scoped)
- QuickNoteInput controlled/uncontrolled API ready for future consumers
- Phase 07 all plans complete, ready for Phase 07 verification

## Self-Check: PASSED

- [x] QuickNoteInput.tsx exists with collapsed/defaultCollapsed props
- [x] quick-capture.tsx exists with camera-first layout
- [x] App.tsx exists with showFab scroll direction detection
- [x] FloatingActionButton.tsx exists with visible prop
- [x] 07-03-SUMMARY.md created
- [x] Commit 9181683f confirmed in git log
- [x] TypeScript compilation passes (npm run check)

---
*Phase: 07-ui-polish-gap-closure*
*Plan: 03*
*Completed: 2026-02-19*
