---
phase: 13-offline-sync-hardening
plan: "05"
subsystem: offline-sync
tags:
  - gap-closure
  - storage-warning
  - photo-upload
  - offline-sync
dependency_graph:
  requires:
    - 13-01-SUMMARY.md (StorageWarning component + storageQuota.ts)
    - 13-04-SUMMARY.md (SyncRecovery in Dashboard)
  provides:
    - StorageWarning rendered in Dashboard (visible when storage exceeds 80%)
    - Real photo upload via /api/photos/upload in offlineManager
  affects:
    - src/pages/Dashboard.tsx
    - src/utils/offlineManager.ts
tech_stack:
  added: []
  patterns:
    - Orphaned component integration (import + conditional render)
    - FormData POST with Blob/base64 fallback for photo upload
key_files:
  created: []
  modified:
    - src/pages/Dashboard.tsx
    - src/utils/offlineManager.ts
decisions:
  - "75: StorageWarning placed between SyncRecovery banner and grid layout — appears at page top when triggered, does not disrupt capture/review workflow"
  - "76: uploadPhoto() uses Blob-first approach with base64 data URL fallback for robustness across PhotoStorageItem variants"
  - "77: Quick Capture's direct fetch bypass is accepted by design — SW intercepts offline; offlineManager quota gate protects standalone photo pipeline only (documented via code comment)"
metrics:
  duration: "~2 minutes"
  completed: "2026-02-21"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 2
---

# Phase 13 Plan 05: Gap Closure — StorageWarning + Real uploadPhoto Summary

**One-liner:** Wired orphaned StorageWarning into Dashboard.tsx and replaced offlineManager.uploadPhoto() simulation stub with real FormData POST to /api/photos/upload.

## What Was Built

### Gap 1 Closed: StorageWarning Rendered in Dashboard

`StorageWarning` was a fully implemented component (292 lines, polling hook, progress bar, amber/red color states, Manage modal) that existed in `src/components/ui/storage-warning.tsx` but was never imported anywhere. Users could never see storage warnings regardless of storage state.

**Fix applied to `src/pages/Dashboard.tsx`:**
- Added import: `import { StorageWarning } from "@/components/ui/storage-warning";`
- Rendered `<StorageWarning />` between the SyncRecovery banner (line 62) and the responsive grid layout (line 70)
- The component handles its own visibility: hidden below 80% storage, amber warning at 80-95%, red critical above 95%
- No props needed — unconditional render is safe because the component self-hides when storage is healthy

### Gap 2 Closed: offlineManager.uploadPhoto() Uses Real Server Upload

The `uploadPhoto()` private method previously contained a simulation stub:
```
// Simulate network delay
await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
// Simulate occasional failures for testing
if (Math.random() < 0.1) { throw new Error('Network error during upload'); }
```

This meant `syncPendingItems()`, `syncSingleItem()`, and the Sync Now button produced fake results — photos were marked "synced" in IndexedDB but never reached the server.

**Fix applied to `src/utils/offlineManager.ts`:**
- Replaced simulation with real `fetch('/api/photos/upload', { method: 'POST', body: formData })`
- Handles `photo.blob instanceof Blob` (primary path) for PhotoStorageItem's Blob storage format
- Handles base64 data URL fallback (string starting with `data:`) for robustness
- Appends `metadata`, `location`, and `inspectionId` fields matching the SW's `syncOfflinePhotos()` pattern
- Throws descriptive errors on non-OK responses for proper retry logic

### Gap 3 Documented: Quick Capture Bypass Is Acceptable (Informational)

Added code comment near the `savePhoto()` quota gate in `offlineManager.ts`:
```typescript
// Note: Quick Capture uses a separate path (direct fetch intercepted by SW).
// This quota gate protects the standalone photo upload pipeline only.
```

Quick Capture posts directly to `/api/inspections/quick-capture` as JSON (not through offlineManager). When offline, the Service Worker intercepts and stores via `OfflineFormManager`. This design is intentional — the offlineManager quota gate was never meant to cover Quick Capture.

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASSED — no type errors |
| `grep "StorageWarning" src/pages/Dashboard.tsx` | FOUND — import line 8 + JSX line 65 |
| `grep "api/photos/upload" src/utils/offlineManager.ts` | FOUND — lines 428, 462 |
| `grep -c "Math.random\|setTimeout.*1000" src/utils/offlineManager.ts` | 0 — no simulation code |
| `npm run build` | SUCCESS — 14.87s, no errors |

## Deviations from Plan

None — plan executed exactly as written.

## Tasks

| Task | Name | Commit | Files Modified |
|------|------|--------|----------------|
| 1 | Wire StorageWarning + implement real uploadPhoto | 93a00cab | src/pages/Dashboard.tsx, src/utils/offlineManager.ts |

## Key Decisions Made

75. **StorageWarning placement**: Between SyncRecovery banner and grid layout — appears prominently at page top when storage warning fires, but is invisible during normal use (below 80% threshold returns null).

76. **Blob-first upload with base64 fallback**: `PhotoStorageItem.blob` is typed as `Blob` so the Blob path is primary. The base64 fallback handles any edge cases where blob data was serialized as a data URL string.

77. **Quick Capture bypass accepted**: The SW interception model for Quick Capture is intentional architecture. Documenting it via code comment closes the verification gap without requiring architectural changes (which would be Rule 4 territory).

## Self-Check: PASSED

Files verified:
- `src/pages/Dashboard.tsx` — EXISTS, contains StorageWarning import and render
- `src/utils/offlineManager.ts` — EXISTS, contains `/api/photos/upload` fetch, no simulation stubs
- Commit `93a00cab` — EXISTS in git log
