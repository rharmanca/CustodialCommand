---
phase: 13-offline-sync-hardening
plan: "03"
subsystem: offline-sync
tags: [offline, sync, queue, dashboard, ui, react, hooks, indexeddb]
dependency_graph:
  requires: [13-01]
  provides: [pending-uploads-ui, usePendingUploads-hook]
  affects: [Dashboard, offline-workflow]
tech_stack:
  added: []
  patterns:
    - IndexedDB polling via setInterval (5s)
    - Service worker MessageChannel for offline form retrieval
    - offlineManager event listeners for real-time sync status
    - Collapsible card component with auto-expand on data
key_files:
  created:
    - src/hooks/usePendingUploads.ts
    - src/components/ui/pending-upload-card.tsx
    - src/components/ui/pending-uploads.tsx
  modified:
    - src/pages/Dashboard.tsx
decisions:
  - "Poll IndexedDB every 5s rather than event-only for robustness on iOS Safari where background events may be missed"
  - "Separate getPhotosByStatus helper queries IDB directly for failed photos since photoStorage.getPendingPhotos only returns pending status"
  - "syncingIds uses module-level Set (not state) to avoid stale closure issues when offlineManager events fire"
  - "PendingUploads placed between Review and Analyze sections — full width mobile, right-aligned (max 400px) desktop"
  - "maxItems=5 in Dashboard context keeps queue compact; full list accessible via scroll within component"
metrics:
  duration: "~5 minutes"
  completed: "2026-02-21"
  tasks: 4
  files_created: 3
  files_modified: 1
---

# Phase 13 Plan 03: Pending Queue UI Summary

Pending upload queue UI showing offline captures waiting to sync, with real-time status, location/timestamp display, and manual retry controls integrated into the Dashboard.

## What Was Built

### `src/hooks/usePendingUploads.ts`

Custom React hook that aggregates pending and failed upload items from multiple sources:

- Queries `CustodialCommandPhotos` IndexedDB for photos with `syncStatus='pending'` and `syncStatus='failed'` using the `syncStatus` index
- Fetches pending offline forms from the service worker via `MessageChannel` with a 1.5s timeout fallback
- Polls every 5 seconds for real-time updates
- Listens to `offlineManager` events: `photoSynced`, `photoSyncFailed`, `syncStarted`, `syncCompleted`, `photoSaved`
- Listens to service worker messages: `FORM_SYNC_SUCCESS`, `PHOTO_SYNC_SUCCESS`
- Tracks syncing state via a module-level `Set<string>` to avoid stale closure issues
- Exposes `retryItem(id)` (single item via `offlineManager.syncSingleItem`) and `retryAll()` (via `offlineManager.forceSyncAll`)
- Derives `pendingCount`, `failedCount`, `syncingCount`, `totalCount` for consumer convenience
- Sorts items newest-first

**Exports:** `UploadItem`, `PendingUploadsState`, `usePendingUploads`

### `src/components/ui/pending-upload-card.tsx`

Individual upload item card component:

- Camera icon for photos, FileText icon for forms
- Relative timestamp: "just now", "2 min ago", "1 hour ago", "3 days ago"
- File size display for photos (e.g., "3.2 MB")
- Retry count display if > 0
- Status badge with color coding:
  - Pending: amber badge with Clock icon
  - Syncing: amber pulsing badge with spinning RefreshCw icon
  - Failed: red destructive badge with AlertCircle icon
  - Synced: green badge with CheckCircle icon
- Syncing state: `animate-pulse` on icon container
- Failed state: red border and background highlight, error message text
- Retry button: 44px touch target, visible only when `status='failed'`, loading state during retry
- Accessibility: `role="listitem"`, descriptive `aria-label` on card and retry button

### `src/components/ui/pending-uploads.tsx`

Container component for the full pending uploads queue:

- Header: "Pending Uploads" title, count badge (amber/red), "Sync Now" button, collapse toggle
- Content: scrollable list (`max-height: 400px`, native scrollbar styling) of `PendingUploadCard` components
- `maxItems` prop with "+X more items not shown" overflow indicator
- Empty state: CheckCircle + "You're all caught up" centered display
- Loading state: spinner with "Loading..." text, `aria-live="polite"`
- Collapsed state: shows "N pending, M failed" count text
- Footer: "Retry All Failed (N)" button (red, only when failures exist), storage used, last synced timestamp
- Auto-expands when items appear; stays user-collapsed when empty
- Props: `maxItems=10`, `showHeader=true`, `collapsible=true`, `className`

### `src/pages/Dashboard.tsx`

Added `PendingUploads` between the Capture/Review grid and the Analyze section:

```tsx
<div className="flex sm:justify-end">
  <PendingUploads maxItems={5} showHeader collapsible className="w-full sm:w-auto" />
</div>
```

- Full width on mobile, right-aligned (max 400px) on tablet/desktop
- `maxItems={5}` keeps Dashboard compact; internal scroll for overflow
- `collapsible=true`: auto-expands when pending items exist, stays collapsed when empty
- No layout disruption — section naturally integrates with existing spacing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] fetchFailedPhotos not exposed by photoStorage**

- **Found during:** Task 1
- **Issue:** `photoStorage.getPendingPhotos()` only returns items with `syncStatus='pending'`. Failed photos (status='failed') are not accessible via the existing API.
- **Fix:** Added `getPhotosByStatus(status)` helper inside `usePendingUploads.ts` that opens the IDB directly using the `syncStatus` index, mirroring the pattern in `PhotoStorageManager`.
- **Files modified:** `src/hooks/usePendingUploads.ts`
- **Commit:** b905ead9

**2. [Rule 1 - Bug] TypeScript strict null on serviceWorker.controller**

- **Found during:** Task 1 (`npm run check`)
- **Issue:** `navigator.serviceWorker.controller` typed as `ServiceWorker | null`, accessing `.postMessage()` directly caused TS error TS18047.
- **Fix:** Added explicit null check — early return with empty array when controller is null.
- **Files modified:** `src/hooks/usePendingUploads.ts`
- **Commit:** b905ead9

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | b905ead9 | feat(13-03): create usePendingUploads hook |
| 2 | 285773fd | feat(13-03): create PendingUploadCard component |
| 3 | a75aefad | feat(13-03): create PendingUploads component |
| 4 | d329d128 | feat(13-03): integrate PendingUploads into Dashboard |

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/hooks/usePendingUploads.ts | FOUND |
| src/components/ui/pending-upload-card.tsx | FOUND |
| src/components/ui/pending-uploads.tsx | FOUND |
| src/pages/Dashboard.tsx (modified) | FOUND |
| 13-03-SUMMARY.md | FOUND |
| commit b905ead9 (Task 1) | FOUND |
| commit 285773fd (Task 2) | FOUND |
| commit a75aefad (Task 3) | FOUND |
| commit d329d128 (Task 4) | FOUND |
| PendingUploads in Dashboard.tsx | INTEGRATED (lines 6, 145) |
| TypeScript (npm run check) | PASSED |
