---
phase: 13-offline-sync-hardening
plan: 01
subsystem: ui
tags: [indexeddb, offline, storage-quota, react, typescript, pwa]

# Dependency graph
requires:
  - phase: 12-home-page-layout-reorganization
    provides: Dashboard layout context for where to surface storage warnings
provides:
  - Storage quota monitoring with 80%/95% thresholds
  - Auto-prune of old synced photos to prevent storage exhaustion
  - StorageWarning React component with progress bar and modal
  - useStorageQuota hook polling every 30 seconds
  - offlineManager integrated with quota checks before every photo save
affects:
  - 13-02
  - 13-03
  - 13-04

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Storage API + IndexedDB fallback for cross-browser quota estimation
    - Event emission pattern (storageWarning, storageCritical, pruned) on OfflineManager
    - useStorageQuota polling hook with 30-second interval
    - Quota gate in savePhoto() with auto-prune + retry before hard throw

key-files:
  created:
    - src/utils/storageQuota.ts
    - src/components/ui/storage-warning.tsx
  modified:
    - src/utils/offlineManager.ts

key-decisions:
  - "Storage API with IndexedDB fallback: prefer navigator.storage.estimate(), fall back to summing IndexedDB blob sizes for older browsers"
  - "savePhoto() quota gate: warn at 80%, auto-prune + retry at 95%, throw error only if still critical after prune"
  - "pruneOldItems respects MIN_RETENTION_COUNT=50: never prunes below that floor regardless of age"
  - "StorageWarning hidden by default when healthy (<80%): reduces visual noise in normal operation"
  - "ManageStorageModal: shows freed-MB feedback after prune to give user confidence the action worked"

patterns-established:
  - "Quota gate pattern: check quota before write, emit event, prune if critical, re-check before throw"
  - "StorageQuotaInfo type: { used, available, total, percentage, warning, critical } — unified return type across both quota functions"

requirements-completed: []

# Metrics
duration: 4min
completed: 2026-02-21
---

# Phase 13 Plan 01: Storage Quota Management Summary

**Storage quota monitoring system with IndexedDB-backed usage tracking, 80%/95% threshold enforcement, auto-prune of old synced photos, and an amber/red StorageWarning React component with manage-storage modal.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-21T02:28:00Z
- **Completed:** 2026-02-21T02:32:07Z
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments

- Created `storageQuota.ts` with four exported utilities: `checkStorageQuota()`, `getStorageUsage()`, `pruneOldItems()`, and `requestPersistentStorage()`
- Updated `offlineManager.ts` to run quota check on every `savePhoto()` call, emit `storageWarning`/`storageCritical` events, trigger auto-prune at 95%, and call `pruneOldItems()` during `initialize()`
- Created `StorageWarning` component with amber/red color-coded progress bar, dismissible manage modal, and `useStorageQuota` polling hook

## Task Commits

Each task was committed atomically:

1. **Task 1: Create storage quota utilities** - `b6bb7469` (feat)
2. **Task 2: Update offlineManager with quota checks** - `0771a67a` (feat)
3. **Task 3: Create StorageWarning component** - `68be02bf` (feat)

## Files Created/Modified

- `src/utils/storageQuota.ts` - Storage quota monitoring: checkStorageQuota, getStorageUsage, pruneOldItems, requestPersistentStorage. Uses Storage API with IndexedDB fallback.
- `src/utils/offlineManager.ts` - Updated with quota gate in savePhoto(), auto-prune on initialize(), checkQuota() public method, three new config defaults
- `src/components/ui/storage-warning.tsx` - StorageWarning card + ManageStorageModal + useStorageQuota hook

## Decisions Made

- Storage API (`navigator.storage.estimate()`) preferred for quota values, with an IndexedDB blob-size sum as fallback — ensures accurate totals even on browsers that don't expose the Quota API (older Safari, Firefox private mode).
- `pruneOldItems()` enforces a hard minimum of 50 retained items regardless of age — prevents wiping out a user's only local copy of their recent work.
- `StorageWarning` is hidden by default when storage is healthy — the custodians' daily experience should not be cluttered with storage meters unless there is an actionable problem.
- `savePhoto()` only throws a quota error after a prune attempt fails to bring usage below 95% — quick capture continues working during the warning band (80–95%), giving the user headroom.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 13-02 (online/offline status indicators) can proceed immediately; StorageWarning component and useStorageQuota hook are available to integrate into Dashboard and Quick Capture contexts.
- The `storageWarning` and `storageCritical` events emitted by `offlineManager` are available for 13-03 and 13-04 to react to if needed.

## Self-Check: PASSED

- FOUND: src/utils/storageQuota.ts
- FOUND: src/components/ui/storage-warning.tsx
- FOUND: src/utils/offlineManager.ts
- FOUND: .planning/phases/13-offline-sync-hardening/13-01-SUMMARY.md
- FOUND commit b6bb7469 (Task 1)
- FOUND commit 0771a67a (Task 2)
- FOUND commit 68be02bf (Task 3)

---
*Phase: 13-offline-sync-hardening*
*Completed: 2026-02-21*
