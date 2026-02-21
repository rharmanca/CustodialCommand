---
phase: 13-offline-sync-hardening
plan: "02"
subsystem: offline-ux
tags: [network-status, offline, pwa, indicators, dashboard, quick-capture]
dependency_graph:
  requires: [13-01]
  provides: [network-indicator-component, useNetworkStatus-hook]
  affects: [Dashboard, QuickCapture]
tech_stack:
  added: []
  patterns: [navigator.onLine polling fallback, wasOffline transition flag, aria-live status]
key_files:
  created:
    - src/hooks/useNetworkStatus.ts
    - src/components/ui/network-indicator.tsx
  modified:
    - src/pages/Dashboard.tsx
    - src/pages/quick-capture.tsx
decisions:
  - "compact variant on mobile Dashboard, full on desktop — responsive sizing via useIsMobile"
  - "wasOffline flag: 3s window for Back Online animation after reconnect"
  - "Polling fallback via HEAD /health every 5s for iOS Safari navigator.onLine unreliability"
  - "amber banner in Quick Capture for maximum offline visibility before camera section"
  - "role=alert aria-live=assertive for offline banner (urgent), role=status aria-live=polite for indicator (informational)"
metrics:
  duration: 3min
  completed: "2026-02-21"
  tasks_completed: 4
  tasks_total: 4
  files_changed: 4
---

# Phase 13 Plan 02: Status Indicators Integration Summary

Online/offline network indicators integrated into Dashboard and Quick Capture with smooth transition animations, accessibility, and iOS Safari polling fallback.

## What Was Built

### useNetworkStatus hook (`src/hooks/useNetworkStatus.ts`)

Reliable network status with:
- `navigator.onLine` tracking via `online`/`offline` events
- `wasOffline` flag: true for 3 seconds after reconnect, drives "Back Online" animation
- Polling fallback: HEAD `/health` every 5 seconds for iOS Safari (where `navigator.onLine` can be unreliably `true`)
- AbortController timeout (3s) on poll to avoid hanging requests
- Full cleanup on unmount: event listeners, intervals, timers

Return shape: `{ isOnline: boolean, wasOffline: boolean, lastChecked: Date }`

### NetworkIndicator component (`src/components/ui/network-indicator.tsx`)

Three variants for different placement contexts:
- `full` — Dashboard: bordered pill with Wifi/WifiOff icon + status dot + "Online"/"Offline"/"Back Online" text
- `compact` — Quick Capture header: icon + dot only, minimal space
- `minimal` — nav bars: colored dot only

Four display states:
- Online: green styling, Wifi icon
- Offline: red styling, WifiOff icon
- Just reconnected (`wasOffline && isOnline`): green pulse animation, "Back Online" text
- Syncing (`showSyncStatus` + reconnecting): spinning RefreshCw icon

Accessibility: `role="status"`, `aria-live="polite"`, `aria-label` with current state, `min-h-[44px]` touch targets.

### Dashboard integration (`src/pages/Dashboard.tsx`)

Header added above the workflow grid:
- `compact` variant on mobile (tight header space)
- `full` variant on desktop (more context for non-field use)
- `showSyncStatus` enabled to show sync spinner on reconnect

### Quick Capture integration (`src/pages/quick-capture.tsx`)

Two integration points:
1. Header: `compact` NetworkIndicator in right side of header bar, alongside Clear All button
2. Offline banner: full-width amber bar below header when `!isOnline`
   - Text: "You're offline. Photos will sync when connection is restored."
   - `role="alert"` + `aria-live="assertive"` for immediate screen reader announcement (more urgent than informational indicator)

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create useNetworkStatus hook | e30805bf | src/hooks/useNetworkStatus.ts |
| 2 | Create NetworkIndicator component | e8a1f8bb | src/components/ui/network-indicator.tsx |
| 3 | Integrate into Dashboard | 246a7b45 | src/pages/Dashboard.tsx |
| 4 | Integrate into Quick Capture | a9871f97 | src/pages/quick-capture.tsx |

## Verification Results

- [x] `npm run check` passes (TypeScript clean) — verified after each task
- [x] NetworkIndicator has 3 variants and 4 display states
- [x] Dashboard displays indicator in header (compact mobile, full desktop)
- [x] Quick Capture displays compact indicator + offline banner
- [x] Accessibility: role=status/alert, aria-live annotations, 44px touch targets
- [ ] Visual/functional verification — awaiting human checkpoint

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files Created/Modified
- src/hooks/useNetworkStatus.ts: FOUND
- src/components/ui/network-indicator.tsx: FOUND
- src/pages/Dashboard.tsx: FOUND (modified)
- src/pages/quick-capture.tsx: FOUND (modified)

### Commits
- e30805bf: feat(13-02): create useNetworkStatus hook
- e8a1f8bb: feat(13-02): create NetworkIndicator component
- 246a7b45: feat(13-02): integrate NetworkIndicator into Dashboard
- a9871f97: feat(13-02): integrate NetworkIndicator into Quick Capture

## Self-Check: PASSED
