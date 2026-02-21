---
phase: 06-pending-badge-freshness
plan: 02
name: Emit Refresh Event on Quick Capture
subsystem: quick-capture
tags: [event, badge, freshness, quick-capture]
requires: []
provides: [CAP-05, CAP-07]
affects: [src/pages/quick-capture.tsx]
tech-stack:
  added: []
  patterns: [custom-event, hook-export]
key-files:
  created: []
  modified:
    - src/pages/quick-capture.tsx
decisions: []
metrics:
  duration: "5 min"
  completed_date: "2026-02-18"
---

# Phase 06 Plan 02: Emit Refresh Event on Quick Capture

## Summary

Added `PENDING_COUNT_UPDATED_EVENT` emission to quick capture success handler, enabling immediate dashboard badge refresh after photo capture.

## One-Liner

Dashboard pending count badge now refreshes instantly when quick capture saves, closing the freshness gap.

## Execution Log

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add event emission to quick capture success | 59f0e813 | src/pages/quick-capture.tsx |
| 2 | Verify event emission pattern | c07ad5f1 | (verification only) |

## Changes Made

### src/pages/quick-capture.tsx

**Import added (line 7):**
```typescript
import { usePendingCount, PENDING_COUNT_UPDATED_EVENT } from '@/hooks/usePendingCount';
```

**Event dispatch added (line 194):**
```typescript
// Emit event to refresh pending count badge on dashboard
window.dispatchEvent(new Event(PENDING_COUNT_UPDATED_EVENT));
```

## Verification

- [x] Event imported from usePendingCount hook
- [x] Event dispatch occurs after successful API response (line 194)
- [x] Pattern matches usePendingInspections.ts (lines 157, 209)
- [x] TypeScript compilation passes (`npm run check`)
- [x] Event name constant used (not hardcoded string)

## Deviations from Plan

None - plan executed exactly as written.

## Auth Gates

None encountered.

## Self-Check: PASSED

- [x] Modified file exists: src/pages/quick-capture.tsx
- [x] Commit 59f0e813 exists in git log
- [x] Commit c07ad5f1 exists in git log
- [x] TypeScript compilation passes
