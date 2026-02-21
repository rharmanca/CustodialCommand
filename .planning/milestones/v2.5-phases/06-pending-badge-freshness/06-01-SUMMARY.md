---
phase: 06
plan: 01
subsystem: pending-badge
wave: 1
tags:
  - api-contract
  - bug-fix
  - pending-count
  - pagination
requires:
  - "Phase 04: pending badge UI implementation"
provides:
  - "Correct pending count display via aligned API contract"
affects:
  - src/hooks/usePendingCount.ts
tech-stack:
  added: []
  patterns:
    - "Backend contract alignment (totalRecords)"
key-files:
  created: []
  modified:
    - src/hooks/usePendingCount.ts
decisions:
  - "Option A selected: Update frontend to match backend (single line change)"
  - "Backend uses totalRecords consistently across all endpoints"
metrics:
  duration: 2
  completed-date: 2026-02-18
---

# Phase 06 Plan 01: Fix API Contract Summary

**One-liner:** Fixed API contract mismatch by updating usePendingCount to read `totalRecords` instead of `totalCount`, aligning frontend with backend pagination field naming.

## What Was Delivered

Fixed the pending count always showing 0 despite having pending inspections:

1. **Task 1:** Updated `usePendingCount.ts` line 30 to use `pagination.totalRecords`
2. **Task 2:** Verified fix with TypeScript compilation (npm run check passes)

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | bc5fb363 | fix(06-01): update usePendingCount to use totalRecords |

## Technical Details

**Before:**
```typescript
const total = data?.pagination?.totalCount ?? 0; // Always 0
```

**After:**
```typescript
const total = data?.pagination?.totalRecords ?? 0; // Correct value
```

## Requirements Impact

| ID | Requirement | Status |
|----|-------------|--------|
| CAP-05 | Save quick capture (badge updates immediately) | Fixed - count now accurate |
| REV-01 | View pending inspections (count accurate) | Fixed - count now accurate |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

- [x] usePendingCount.ts line 30 uses `totalRecords` instead of `totalCount`
- [x] TypeScript compilation passes (`npm run check`)
- [x] Commit includes clear description of contract fix
- [x] File modified: `src/hooks/usePendingCount.ts`

## Self-Check: PASSED
