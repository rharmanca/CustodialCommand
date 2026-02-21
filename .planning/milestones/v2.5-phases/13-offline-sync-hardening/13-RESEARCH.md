# Phase 13: Offline Sync Hardening - Research

**Research Date:** 2026-02-20
**Status:** Complete

## Executive Summary

Phase 13 builds upon existing offline infrastructure to ensure reliable quick capture functionality in poor/no connectivity areas. The codebase already has foundational offline support via Service Worker, IndexedDB storage, and background sync — this phase hardens these systems for production reliability.

## Existing Infrastructure Analysis

### Current Implementation

| Component | Status | Location |
|-----------|--------|----------|
| Service Worker | ✅ Implemented | `public/sw.js` |
| IndexedDB Photo Storage | ✅ Implemented | `PhotoManager` class in sw.js |
| IndexedDB Form Storage | ✅ Implemented | `OfflineFormManager` class in sw.js |
| Background Sync | ✅ Implemented | `sync` event handler in sw.js |
| Offline Status UI | ✅ Implemented | `src/components/ui/offline-status.tsx` |
| Offline Manager | ✅ Implemented | `src/utils/offlineManager.ts` |

### Capabilities Already Present

**Service Worker (sw.js):**
- Photo offline storage with metadata
- Form offline storage with retry logic
- Background sync registration for forms and photos
- Fetch interception for API requests
- Offline fallback page
- Client messaging for sync status

**Offline Manager (offlineManager.ts):**
- Event-driven architecture (`on`, `off`, `emit`)
- Configurable storage limits (default 100MB)
- Auto-cleanup of old data
- Sync retry with exponential backoff
- Background sync interval (30s)
- Statistics tracking

**Offline Status Component:**
- Network status indicator
- Pending forms count
- Expandable details view
- Status badges (online/offline/pending)

## Gaps Identified

### SYNC-01: Reliable Background Sync

**Current State:**
- Background sync is implemented but needs hardening
- Storage quota management not enforced (warn at 80%)
- Auto-prune old synced items not implemented
- Quick Capture integration not verified

**Requirements:**
- Warn user at 80% storage capacity
- Auto-prune old synced items to prevent exhaustion
- Ensure Quick Capture works seamlessly offline

### SYNC-02: Online/Offline Status Indicators

**Current State:**
- `offline-status.tsx` component exists
- Not integrated into Quick Capture flow
- No prominent placement in Dashboard

**Requirements:**
- Clear visual indicator placement (Claude's discretion)
- Transition signaling when status changes
- Prominence appropriate for field use

### SYNC-03: Pending Upload Queue Visibility

**Current State:**
- Offline status component shows pending forms
- Photo queue exists in IndexedDB but not exposed in UI
- No integration with Dashboard

**Requirements:**
- Show queue of pending uploads
- Display location, timestamp, and status
- User control capabilities (retry, cancel)

### SYNC-04: Data Consistency

**Current State:**
- Service worker handles sync on reconnect
- No explicit handling of app closure mid-sync
- Conflict resolution not implemented

**Requirements:**
- Ensure data consistency if app closed before sync completes
- Handle partial sync states
- Recover from interrupted uploads

## Technical Constraints

### iOS Safari Limitations
- **Background Sync API** not supported on iOS
- **Fallback:** Polling-based sync when app is active
- Service Worker limitations on iOS (less reliable)

### Storage Quotas
- Typical IndexedDB quota: 50-250MB
- Photos can exhaust quota quickly (3-5MB each)
- Need proactive quota management

### PWA Constraints
- Background sync only works when app is open (iOS)
- Android supports periodic background sync
- Must handle both graceful degradation

## Recommended Architecture

### Wave 1: Storage Quota Management
- Add storage quota monitoring
- Implement 80% warning threshold
- Create auto-prune for old synced items

### Wave 2: Status Indicators Integration
- Integrate offline status into Quick Capture
- Add network indicator to Dashboard
- Implement transition animations

### Wave 3: Pending Queue UI
- Create PendingUploads component
- Show photos + forms in unified queue
- Add manual retry controls

### Wave 4: Data Consistency Hardening
- Add sync state persistence
- Handle partial uploads on reconnect
- Implement conflict detection

## Implementation Notes

### Storage Calculation
```typescript
// Estimate photo storage
const photoSize = 3 * 1024 * 1024; // 3MB average
const maxPhotos = Math.floor((quota * 0.8) / photoSize);

// Prune strategy: oldest synced items first
const itemsToPrune = syncedItems
  .sort((a, b) => a.syncedAt - b.syncedAt)
  .slice(0, pruneCount);
```

### Sync State Persistence
```typescript
// Store sync progress in IndexedDB
interface SyncState {
  inProgress: boolean;
  currentItemId: string | null;
  startedAt: number;
  completedItems: string[];
}
```

### iOS Fallback Strategy
```typescript
// Poll every 5 seconds when online
const iosSyncInterval = setInterval(() => {
  if (navigator.onLine && !isIOS()) {
    offlineManager.syncPendingItems();
  }
}, 5000);
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| iOS storage quota exceeded | Medium | High | Proactive pruning + user warnings |
| Background sync fails silently | Medium | High | Polling fallback + manual sync button |
| Data loss on app close | Low | High | Immediate IndexedDB writes + resume on reopen |
| Conflict resolution edge cases | Low | Medium | Last-write-wins + user notification |

## Dependencies

- Phase 12 (Home Page Layout) - COMPLETE ✅
- IndexedDB API (browser native)
- Service Worker (already registered)
- Existing offline infrastructure

## Deferred Out of Scope

- Real-time collaborative sync
- Advanced conflict resolution UI
- Cloud backup integration
- Cross-device sync

---

*Research complete. Ready for planning.*
