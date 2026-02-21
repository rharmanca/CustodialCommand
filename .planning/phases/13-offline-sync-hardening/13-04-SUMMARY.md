---
phase: 13-offline-sync-hardening
plan: "04"
subsystem: offline-sync
tags: [offline, sync, recovery, pwa, indexeddb, service-worker]
dependency-graph:
  requires: [13-01, 13-02, 13-03]
  provides: [sync-state-persistence, sync-recovery-ui, interrupted-sync-resume]
  affects: [Dashboard, offlineManager, service-worker]
tech-stack:
  added: []
  patterns: [IndexedDB-state-persistence, SW-resume-on-activate, React-polling-hook, amber-warning-banner]
key-files:
  created:
    - src/utils/syncState.ts
    - src/hooks/useSyncRecovery.ts
    - src/components/ui/sync-recovery.tsx
  modified:
    - public/sw.js
    - src/utils/offlineManager.ts
    - src/pages/Dashboard.tsx
decisions:
  - "Separate IndexedDB DB (CustodialSyncState) for sync state to avoid coupling with photo/form stores"
  - "In-memory fallback in syncState.ts when IndexedDB unavailable"
  - "SyncStateManager in SW mirrors syncState.ts pattern for consistency"
  - "useSyncRecovery polls every 10s plus listens for SW messages"
  - "SyncRecovery renders null when no recovery needed to keep DOM clean"
  - "resumeSync() in syncState.ts is a pure check — no side effects"
metrics:
  duration: "~7 minutes"
  completed: "2026-02-21"
  tasks-completed: 6
  files-changed: 6
---

# Phase 13 Plan 04: Data Consistency Hardening Summary

**One-liner:** IndexedDB sync state persistence with SW resume-on-activate and React recovery banner for interrupted-sync detection and retry.

## What Was Built

### Task 1: src/utils/syncState.ts (new)

Sync state persistence utilities for the React side of the app:

- `SyncState` interface with `id`, `inProgress`, `currentItemId`, `itemType`, `startedAt`, `completedItems[]`, `failedItems[]`, `lastUpdated`
- `saveSyncState(state)` — persists to `CustodialSyncState` IndexedDB, store `sync-state`, key `current`
- `getSyncState()` — reads current state, returns `null` if none
- `clearSyncState()` — deletes the record on successful sync completion
- `resumeSync()` — pure check: returns `true` if `inProgress=true` exists
- `buildInitialSyncState(itemId, itemType)` — helper to create a fresh state object
- In-memory fallback (`memoryState`) when IndexedDB is unavailable

### Task 2: public/sw.js (modified)

Service worker updated with 192 line additions:

- **`SyncStateManager` class** — identical persistence pattern in the SW context (same DB schema)
- **`syncOfflinePhotos()`** — saves state before each photo upload; appends to `completedItems` on success, `failedItems` on error; calls `SyncStateManager.clear()` when all photos processed
- **`syncOfflineForms()`** — same state tracking for form syncs
- **`activate` event** — checks `SyncStateManager.hasInterruptedSync()` after claiming clients; if interrupted, posts `SYNC_INTERRUPTED_DETECTED` to all open clients and registers `background-sync`
- **`CHECK_SYNC_STATE` message handler** — returns current state via `MessageChannel` or broadcast
- **`CLEAR_SYNC_STATE` message handler** — clears state on command

### Task 3: src/hooks/useSyncRecovery.ts (new)

React hook returning `SyncRecoveryState`:

- Checks `getSyncState()` on mount and every 10 seconds via `setInterval`
- Listens for `SYNC_INTERRUPTED_DETECTED` and `FORM_SYNC_SUCCESS`/`PHOTO_SYNC_SUCCESS` SW messages
- Computes human-readable `recoveryMessage` from item counts
- `retryInterrupted()` calls `offlineManager.syncPendingItems()` with loading state
- `dismissRecovery()` calls `clearSyncState()` to prevent re-showing on next open

### Task 4: src/components/ui/sync-recovery.tsx (new)

Amber warning banner component:

- **Initial state**: AlertTriangle icon, recovery message, item counts, "Resume Sync" + "Dismiss" buttons
- **Retrying state**: Loader2 spinner, "Resuming sync..." text
- **Success state**: CheckCircle, "Sync complete!", auto-dismiss after 3 s
- **Error state**: Red error text, retry button still available
- `role="alert"` / `aria-live="assertive"` for screen readers
- 44px+ touch targets on all buttons
- Focus moves to banner when shown via `bannerRef.current.focus()`
- Renders `null` when `needsRecovery=false` and no pending states

### Task 5: src/utils/offlineManager.ts (modified)

- Imports `saveSyncState`, `getSyncState`, `clearSyncState`, `buildInitialSyncState`, `SyncState`
- `syncPendingItems()` saves state before each item; skips already-`completedItems` on resume; clears state on completion; emits `syncResumed` / `syncInterrupted`
- `resumeInterruptedSync()` — checks for existing state and calls `syncPendingItems()` if found
- `resolveConflict(itemId, strategy)` — 'local' keeps local (upload next sync), 'server' marks as synced (discards local)

### Task 6: src/pages/Dashboard.tsx (modified)

- Import `SyncRecovery` component and `useSyncRecovery` hook
- `needsRecovery` and `dismissRecovery` extracted from hook
- Conditional render: `{needsRecovery && <SyncRecovery onDismiss={dismissRecovery} />}` in a `transition-all duration-300` wrapper
- Placed above the capture/review grid for immediate visibility

## Deviations from Plan

None — plan executed exactly as written.

## Verification Checklist

- [x] Sync state saves before each item upload (offlineManager + SW)
- [x] State persists if app closes mid-sync (IndexedDB `CustodialSyncState`)
- [x] Recovery banner shows on app reopen (SYNC_INTERRUPTED_DETECTED message)
- [x] Resume sync continues from where it left off (skip completedItems)
- [x] Sync state clears on successful completion (clearSyncState())
- [x] Conflicts are detected and handled (resolveConflict())
- [x] Recovery can be dismissed by user (dismissRecovery())
- [x] npm run check passes (verified after each task)

## Self-Check: PASSED

All 6 created/modified files confirmed present and TypeScript compilation clean.
