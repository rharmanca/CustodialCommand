---
phase: 07-ui-polish-gap-closure
plan: all
subsystem: UI Polish
milestone: v1.0 (Audit)
tags: [mobile-ux, accessibility, touch-targets, accordion, camera-first]
dependencies:
  requires: []
  provides: [MOB-01-compliance, REV-04, REV-05, CAP-02]
  affects: [quick-capture, inspection-completion, FAB]
tech-stack:
  added: []
  patterns: [Radix UI Accordion, scroll-direction state, collapsible sections]
key-files:
  created: []
  modified:
    - src/pages/quick-capture.tsx
    - src/components/review/InspectionCompletionForm.tsx
    - src/components/capture/QuickNoteInput.tsx
    - src/App.tsx
    - src/components/ui/FloatingActionButton.tsx
decisions:
  - "DOM reorder for camera-first (not CSS order) preserves accessibility"
  - "App-level scroll listener manages FAB visibility globally"
  - "Per-section progress uses form.watch() for reactive updates"
  - "QuickNoteInput supports both controlled and uncontrolled collapsed state"
metrics:
  duration: "Wave 1 Parallel Execution"
  completed-date: 2026-02-19
  tasks-completed: 3
  files-modified: 5
  commits: 3
---

# Phase 07 Plan Summary: UI Polish Gap Closure

**One-liner:** Completed MOB-01 touch targets, grouped accordion rating sections with per-section progress, and camera-first layout with FAB scroll-hide behavior.

## Overview

This phase addressed three critical UX gaps identified in Phase 04 verification: touch target violations (40px vs 44px minimum), flat rating form without grouping/progress, and camera placement below metadata fields. All changes maintain backward compatibility and follow existing project patterns.

## Changes Made

### Plan 07-01: Touch Target Fixes (MOB-01)
**Commit:** `5f5e916b`

- **File:** `src/pages/quick-capture.tsx`
- **Change:** Location preset buttons `min-h-[40px]` → `min-h-[44px]`
- **Impact:** All secondary interactive controls now meet 44px minimum touch target requirement

### Plan 07-02: Grouped Rating Sections
**Commit:** `b4a3dbae`

- **File:** `src/components/review/InspectionCompletionForm.tsx`
- **Changes:**
  - Added `RATING_GROUPS` constant with 4 accordion sections
  - Integrated Radix UI Accordion with multiple open support
  - Per-section progress tracking ("X/Y rated")
  - Visual completion indicators (green check when section complete)
  - 11 rating fields organized: Physical (3), Service (1), Maintenance (4), Compliance (3)
- **Icons:** Building2, Coffee, Wrench, Shield from lucide-react

### Plan 07-03: Camera-First Layout + FAB Scroll
**Commit:** `9181683f`

- **Files:**
  - `src/pages/quick-capture.tsx` - Reordered to camera-first, metadata in boxed section, notes default collapsed
  - `src/components/capture/QuickNoteInput.tsx` - Added `collapsed`, `onCollapsedChange`, `defaultCollapsed` props
  - `src/App.tsx` - Added scroll direction detection with `showFab` state
  - `src/components/ui/FloatingActionButton.tsx` - Added `visible` prop with translate/opacity transition

## Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Location presets 44px | ✅ | Line 360 quick-capture.tsx |
| 4 accordion sections | ✅ | RATING_GROUPS with 11 fields |
| Per-section progress | ✅ | "rated/total" display in headers |
| Camera first in DOM | ✅ | Camera section moved before metadata |
| Notes collapsible | ✅ | QuickNoteInput defaultCollapsed={true} |
| FAB hide on scroll | ✅ | App.tsx scroll listener + visible prop |
| TypeScript compiles | ✅ | `npm run check` passes |

## Technical Decisions

1. **DOM reorder vs CSS order:** Used actual DOM reorder for camera-first to preserve accessibility and tab order (not CSS `order` property)

2. **Scroll listener location:** App-level scroll detection ensures FAB behavior is consistent across all pages, not just dashboard

3. **Accordion default state:** All sections start expanded (`defaultValue={RATING_GROUPS.map(g => g.id)}`) so users see all rating options initially

4. **Controlled/uncontrolled QuickNoteInput:** Supports both patterns - quick-capture.tsx uses `defaultCollapsed` (uncontrolled), but controlled props available for future use

## Deviations from Plan

None. Plan executed exactly as written.

## Test Commands

```bash
npm run check          # TypeScript validation
npm run dev            # Visual verification
```

## Commits

| Hash | Plan | Message |
|------|------|---------|
| `5f5e916b` | 07-01 | fix(07-01): Update location preset touch targets to 44px (MOB-01) |
| `b4a3dbae` | 07-02 | feat(07-02): Add grouped accordion sections with per-section progress tracking |
| `9181683f` | 07-03 | feat(07-03): Camera-first layout with collapsible notes and FAB scroll behavior |

## Self-Check

- [x] All created files exist
- [x] All commits exist in git log
- [x] TypeScript compilation passes
- [x] No breaking changes to existing APIs
- [x] Mobile UX improvements verified

## Self-Check: PASSED
