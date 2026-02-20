# Domain Pitfalls: Milestone v2.5 "Polish and Enhancements"

**Domain:** Facility inspection management PWA
**Researched:** 2026-02-19

## Critical Pitfalls

### Pitfall 1: IndexedDB Storage Quota Exceeded
**What goes wrong:** Photos queue fills device storage; sync fails silently
**Why it happens:** IndexedDB has ~50MB-250MB limit depending on browser/device; photos accumulate
**Consequences:** Data loss when storage full; user confusion about "saved" captures
**Prevention:** Implement storage quota check before queue; auto-purge synced items; warn at 80% capacity
**Detection:** Monitor `navigator.storage.estimate()`; alert user when approaching limit

### Pitfall 2: Background Sync API Unsupported on iOS
**What goes wrong:** Relying on Background Sync API for offline uploads; fails on iOS Safari
**Why it happens:** Safari iOS doesn't support Background Sync (as of 2026-02)
**Consequences:** Offline captures never sync even when connectivity returns
**Prevention:** Progressive enhancement: use Background Sync if available, fall back to periodic polling + manual sync trigger
**Detection:** `'sync' in ServiceWorkerRegistration.prototype` feature detection

### Pitfall 3: Schedule Recurrence Logic Edge Cases
**What goes wrong:** Daily/weekly schedules create duplicate or missed inspections
**Why it happens:** Timezone handling, daylight saving transitions, cron misalignment
**Consequences:** Missing inspections on schedule change days; duplicate entries
**Prevention:** Store schedules in UTC; use established cron library (node-cron with timezone); verify next-run calculation
**Detection:** Log scheduled job executions; alert if expected inspection not created

### Pitfall 4: Voice Recognition Fails Silently on iOS
**What goes wrong:** Web Speech API not available or blocked on iOS Safari
**Why it happens:** iOS Safari requires user gesture; `webkitSpeechRecognition` is prefixed and limited
**Consequences:** Voice button appears but does nothing; user frustration
**Prevention:** Feature detect `window.SpeechRecognition || window.webkitSpeechRecognition`; show fallback input if unavailable
**Detection:** Test on actual iOS device; not just emulator

## Moderate Pitfalls

### Pitfall 5: Upload Queue Grows Unbounded
**What goes wrong:** User captures 50+ photos offline; sync attempts all at once on reconnect
**Why it happens:** No rate limiting or batching on sync
**Consequences:** Network timeout; server memory spike; failed uploads
**Prevention:** Batch uploads (5 at a time); exponential backoff on failure; progress indicator

### Pitfall 6: Dashboard FAB Overlaps Bottom Nav
**What goes wrong:** Quick Capture FAB positioned over mobile bottom navigation
**Why it happens:** `fixed bottom-6 right-6` doesn't account for navigation bar height
**Prevention:** Use `env(safe-area-inset-bottom)` + nav height calculation; test on multiple viewports

### Pitfall 7: Offline Status Indicator False Positives
**What goes wrong:** `navigator.onLine` returns true but actual connectivity is poor
**Why it happens:** Browser "online" just means network interface up, not actual internet
**Prevention:** Combine `navigator.onLine` with fetch heartbeat to `/health` endpoint

### Pitfall 8: Scheduled Inspection Timezone Drift
**What goes wrong:** Schedule created in CST, inspector views in EST, off by one hour
**Why it happens:** Storing local time without timezone; frontend converts inconsistently
**Prevention:** Store schedule times in UTC; display in user's local timezone with `Intl.DateTimeFormat`

## Minor Pitfalls

### Pitfall 9: Voice Transcription Timeout Too Short
**What goes wrong:** Long note gets cut off at 30 seconds
**Why it happens:** Default recognition timeout; no continuous mode
**Prevention:** Use `continuous: true` mode; handle interim vs final results

### Pitfall 10: Pending Badge Stale After Sync
**What goes wrong:** Dashboard shows "5 pending" after successful sync; count doesn't update
**Why it happens:** Cache invalidation missed; polling interval too long
**Prevention:** Invalidate cache on sync completion; emit event to refresh count

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 12: Layout | FAB overlaps bottom nav on small screens | safe-area-inset + viewport testing |
| Phase 13: Offline | iOS Safari lacks Background Sync | Feature detect + polling fallback |
| Phase 13: Offline | IndexedDB quota exceeded | Storage estimate + auto-purge |
| Phase 13: Offline | Queue grows unbounded | Batch uploads + rate limiting |
| Phase 14: Scheduling | Recurrence logic edge cases | UTC storage + established cron lib |
| Phase 14: Scheduling | Timezone drift | UTC backend + local display |
| Phase 15: Voice | iOS Safari recognition fails | Feature detection + text fallback |
| Phase 15: Voice | Recognition timeout too short | Continuous mode + interim results |

## Sources

- `.planning/ROADMAP.md` — Phase 12-15 requirements
- `public/sw.js` — Existing service worker patterns
- `src/hooks/usePendingCount.ts` — Pending count implementation
- `shared/schema.ts` — syncQueue table foundation
- Can I Use: Background Sync API browser support data
- MDN: Web Speech API compatibility notes
