# Phase 13: Offline Sync Hardening - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure reliable quick capture functionality even in areas with poor or no connectivity. This phase enables full inspection completion offline, with automatic synchronization when connection is restored. Scope includes offline data persistence, online/offline status indicators, pending upload queue visibility, and sync behavior.

This phase builds on Phase 12's dashboard layout but does NOT add new UI capabilities like scheduling or voice notes — those belong in Phase 14 and 15.

</domain>

<decisions>
## Implementation Decisions

### Offline Save Behavior
- **Scope**: Full offline support — users can complete full inspections (photos, ratings, notes, tags) while offline, not just quick capture
- **Storage management**: Warn user at 80% capacity + auto-prune old synced items to prevent storage exhaustion
- **UX approach**: Claude's discretion — determine optimal feedback approach for offline saves

### Online/Offline Indicators
- **All aspects**: Claude's discretion — determine optimal placement, prominence level, and transition signaling

### Pending Upload Queue Visibility
- **All aspects**: Claude's discretion — determine optimal placement, information level to display, and user control capabilities

### Sync Trigger Behavior
- **Trigger strategy**: Hybrid — automatic sync when connection restored + manual "Sync Now" option available to user
- **Retry strategy**: Claude's discretion — determine retry approach for failed sync attempts
- **Conflict resolution**: Claude's discretion — determine how to handle sync conflicts between local and server data
- **Background behavior**: Claude's discretion — determine whether sync continues when app is in background

### Claude's Discretion
The following areas have been delegated to Claude's judgment during planning and implementation:
- Exact UX feedback for offline saves (toast vs silent vs blocking)
- Online/offline indicator placement, prominence, and transition behavior
- Pending queue placement, information density, and user control level
- Retry strategy implementation (exponential backoff, fixed interval, etc.)
- Conflict resolution approach
- Background sync behavior and limitations
- Specific IndexedDB schema design
- Service Worker sync event handling

</decisions>

<specifics>
## Specific Ideas

- Full offline support means inspectors can work in basement/concrete areas with no signal
- Storage quota management is critical — photos can fill device quickly
- iOS Safari limitations: Background Sync API not supported, need fallback polling
- Research shows 50-250MB IndexedDB quotas typical — need proactive management
- Hybrid auto+manual sync gives users control while ensuring reliability
- Custodial staff need confidence their work won't be lost

</specifics>

<deferred>
## Deferred Ideas

- Inspection scheduling features — belongs in Phase 14
- Voice notes capability — belongs in Phase 15
- Advanced conflict resolution UI — out of scope for v2.5
- Calendar integration for schedules — future phase
- Real-time collaborative editing — out of scope per PROJECT.md

</deferred>

---

*Phase: 13-offline-sync-hardening*
*Context gathered: 2026-02-20*
