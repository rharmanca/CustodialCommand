# Architecture Research: Offline Sync, Scheduling & Dashboard

**Domain:** Custodial Command - Inspection Management PWA
**Researched:** 2026-02-19
**Confidence:** HIGH (Dexie proven, existing sync infrastructure)
**Researcher:** Architecture Research Subagent

---

## Executive Summary

This document covers the architectural integration of three new capabilities into the existing Custodial Command React/Express/PostgreSQL stack:
1. **Offline Sync Hardening** - Queue-based sync with conflict resolution
2. **Inspection Scheduling** - Recurring job generation with node-cron
3. **Dashboard Layout** - Mobile-first responsive reorganization

All three features integrate cleanly with the existing Dexie-based IndexedDB layer and node-cron scheduling infrastructure.

---

## Current System Overview

## Existing Architecture (Inherited from v2.0)

```
Browser (React PWA)
  ├── Service Worker (offline cache)
  ├── IndexedDB (syncQueue — Phase 13 extension)
  └── BroadcastChannel (cross-tab events)
       │
       ▼
Express API (Railway)
  ├── routes.ts (REST endpoints)
  ├── storage.ts (Drizzle ORM queries)
  └── automated-monitoring.ts (cron jobs)
       │
       ▼
PostgreSQL (Railway managed)
  ├── inspections (quick capture + full)
  ├── sync_queue (offline tracking — extend for Phase 13)
  └── schedules (NEW: Phase 14 recurring inspections)
```

## v2.5 Architecture Additions

### Phase 12: Dashboard Layout Reorganization

**No new architecture** — Pure UI/UX changes within existing component structure.

```
src/App.tsx (dashboard view)
  ├── QuickCaptureCard (prominence: primary CTA)
  ├── ReviewInspectionsCard (prominence: secondary)
  ├── AnalyticsSummaryCard (tertiary)
  └── FloatingActionButton (mobile: bottom-right, scroll-aware)
```

**Pattern:** CSS positioning + mobile-first responsive design. No data flow changes.

### Phase 13: Offline Sync Hardening

**New Components:**

```
src/services/offlineQueue.ts
  ├── IndexedDB wrapper (idb-keyval)
  ├── Queue management (add, remove, sync)
  └── Storage quota monitoring

src/hooks/useOfflineSync.ts
  ├── Online/offline status detection
  ├── Upload progress tracking
  └── Retry logic with exponential backoff

src/components/ui/OfflineStatus.tsx (enhance existing)
  ├── Connection indicator (badge)
  ├── Pending upload count
  └── Manual sync trigger
```

**Data Flow:**

```
Quick Capture Form
  └── On submit (offline):
       ├── Save to IndexedDB queue
       ├── Show "Queued" status
       └── BroadcastChannel notify other tabs

Connectivity Restore
  └── Service Worker / Polling
       ├── Read IndexedDB queue
       ├── POST to /api/inspections/batch (new endpoint)
       ├── Remove synced items from queue
       └── BroadcastChannel notify success
```

**Backend Addition:**

```typescript
// server/routes.ts — Batch upload endpoint for queue sync
POST /api/inspections/batch-sync
  body: { inspections: QueuedInspection[] }
  response: { succeeded: number, failed: number, errors: Error[] }
```

### Phase 14: Inspection Scheduling

**New Database Table:**

```sql
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  school TEXT NOT NULL,
  location_description TEXT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  days_of_week INTEGER[], -- For weekly: [1,3,5] = Mon,Wed,Fri
  next_scheduled_at TIMESTAMP NOT NULL,
  last_completed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Cron Job Pattern (extends existing monitoring cron):**

```typescript
// server/jobs/scheduler.ts
// Runs daily at 6:00 AM
const createDailyInspections = async () => {
  const dueSchedules = await db
    .select()
    .from(schedules)
    .where(
      and(
        eq(schedules.isActive, true),
        lte(schedules.nextScheduledAt, now())
      )
    );
  
  // Create inspection placeholders for due schedules
  for (const schedule of dueSchedules) {
    await db.insert(inspections).values({
      school: schedule.school,
      locationDescription: schedule.locationDescription,
      status: 'scheduled', // New status
      scheduledAt: schedule.nextScheduledAt,
      // ... other fields
    });
    
    // Advance next_scheduled_at based on frequency
    await advanceSchedule(schedule);
  }
};
```

**Frontend Pattern:**

```
src/pages/admin-schedules.tsx (admin CRUD)
src/components/dashboard/UpcomingInspectionsCard.tsx
dashboard
  └── Upcoming Inspections (today + next 7 days)
       └── Click to Quick Capture for that location
```

### Phase 15: Voice Notes

**No new backend architecture** — Pure client-side feature.

```
src/components/capture/VoiceNoteInput.tsx
  ├── Feature detection: SpeechRecognition API
  ├── Recording state management
  ├── Interim + final transcript handling
  └── Transcript editing textarea

Quick Capture Integration
  └── Notes section
       ├── Existing: QuickNoteInput (text)
       └── New: VoiceNoteInput (voice-to-text)
            └── Recording button → Transcript → Editable textarea
```

## Patterns to Follow

### Pattern: Progressive Enhancement for Offline
**What:** Core functionality works without IndexedDB; enhanced when available
**When:** Phase 13 offline queue
**Example:**
```typescript
const supportsIndexedDB = 'indexedDB' in window;

if (supportsIndexedDB && !navigator.onLine) {
  await queueOffline(inspectionData);
} else {
  await submitDirectly(inspectionData);
}
```

### Pattern: Optimistic UI for Upload Queue
**What:** Show "Queued" immediately; update to "Synced" when confirmed
**When:** Phase 13 offline sync
**Example:**
```typescript
const [uploadStatus, setUploadStatus] = useState<'pending' | 'queued' | 'synced'>('pending');

// Optimistic: show queued immediately
setUploadStatus('queued');

// Then confirm on success
await syncQueue();
setUploadStatus('synced');
```

### Pattern: UTC Storage, Local Display
**What:** Store schedule times in UTC; convert to user's timezone for display
**When:** Phase 14 scheduling
**Example:**
```typescript
// Storage: UTC
const nextRun = new Date(schedule.nextScheduledAt); // stored as UTC

// Display: Local
const displayTime = nextRun.toLocaleTimeString('en-US', {
  timeZone: userTimezone,
});
```

### Pattern: Feature Detection Before API Use
**What:** Check for API support before enabling UI
**When:** Phase 15 voice notes, Phase 13 background sync
**Example:**
```typescript
const supportsSpeech = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

return (
  <Button disabled={!supportsSpeech}>
    {supportsSpeech ? 'Record Voice Note' : 'Voice Not Supported'}
  </Button>
);
```

## Anti-Patterns to Avoid

### Anti-Pattern: Unlimited IndexedDB Queue
**What:** Allowing queue to grow without bound
**Why bad:** Storage quota exceeded; data loss
**Instead:** Implement max queue size (e.g., 100 items); warn user; prioritize by age

### Anti-Pattern: Synchronous LocalStorage Fallback
**What:** Using localStorage as IDB fallback for binary data
**Why bad:** localStorage can't store Blobs/ArrayBuffers; sync API blocks UI
**Instead:** If IDB unavailable, warn user "Offline not supported on this device"

### Anti-Pattern: Client-Side Schedule Calculation
**What:** Computing next scheduled date in browser
**Why bad:** Timezone inconsistency; server is source of truth
**Instead:** Server calculates next run; client displays server's value

### Anti-Pattern: Continuous Voice Recognition
**What:** Keeping mic open for extended periods
**Why bad:** Battery drain; privacy concerns; transcript quality degrades
**Instead:** Manual start/stop; 60-second max per recording

## Scalability Considerations

| Concern | Current Scale | 10x Scale | Notes |
|---------|--------------|-----------|-------|
| IndexedDB Queue | 10s of items | 100s of items | Prune after 30 days; alert at 80% quota |
| Schedule Inspections | Daily cron | Hourly cron | Scale cron frequency, not complexity |
| Voice Transcription | Client-side only | Same | Web Speech API is client-side; no server scaling |
| Batch Uploads | 5 items/batch | 20 items/batch | Rate limit to prevent server overload |

## Phase-Specific Component Boundaries

| Phase | Component | Responsibility | Communicates With |
|-------|-----------|---------------|-------------------|
| 13 | `offlineQueue.ts` | IndexedDB CRUD | syncQueue table (fallback) |
| 13 | `useOfflineSync.ts` | Status + progress | offlineQueue.ts, UI components |
| 13 | `OfflineStatus.tsx` | Visual indicator | useOfflineSync hook |
| 14 | `schedules.ts` (backend) | Cron + CRUD | schedules table, inspections table |
| 14 | `UpcomingInspectionsCard.tsx` | Dashboard display | schedules API |
| 15 | `VoiceNoteInput.tsx` | Recognition + editing | Web Speech API |

---

## Integration Points for Roadmap

### New vs Modified Components

| Component | Type | Phase | Integration Point |
|-----------|------|-------|-------------------|
| `SyncEngine.ts` | **New** | Offline Sync | Dexie ↔ Service Worker |
| `useOfflineSync.ts` | **New** | Offline Sync | React hooks ↔ SyncEngine |
| `OfflineIndicator.tsx` | **New** | Offline Sync | UI component ↔ useOfflineSync |
| `sw.js` | **Modified** | Offline Sync | Enhanced retry + conflict detection |
| `storage.ts` | **Modified** | Offline Sync | Add queue operations |
| `schedules.ts` (backend) | **New** | Scheduling | node-cron ↔ PostgreSQL |
| `InspectionGenerator.ts` | **New** | Scheduling | ScheduleService ↔ inspections table |
| `ScheduleWidget.tsx` | **New** | Scheduling | Dashboard ↔ schedules API |
| `notificationService.ts` | **Modified** | Scheduling | Add schedule notifications |
| `Dashboard.tsx` | **Modified** | Dashboard | Mobile-first responsive layout |
| `QuickActions.tsx` | **Modified** | Dashboard | FAB integration |

### Data Flow Changes

**Before (Current):**
```
User Submit → API POST → PostgreSQL
               ↓
         Success Response
```

**After (With Offline Sync):**
```
User Submit → Dexie Queue → Service Worker → Background Sync → API POST → PostgreSQL
     ↓              ↓              ↓               ↓
  "Queued"    "Pending"    "Syncing"     "Synced"
```

### API Endpoints Required

| Endpoint | Method | Purpose | Phase |
|----------|--------|---------|-------|
| `/api/sync/batch` | POST | Submit offline queue | Offline Sync |
| `/api/sync/status` | GET | Check sync status | Offline Sync |
| `/api/sync/resolve` | POST | Resolve conflicts | Offline Sync |
| `/api/schedules` | GET/POST/PUT/DELETE | CRUD for schedules | Scheduling |
| `/api/inspections/generate` | POST | Create from template | Scheduling |

### Database Schema Changes

**New Tables:**
```sql
-- Phase: Scheduling
CREATE TABLE recurring_schedules (
  id SERIAL PRIMARY KEY,
  school TEXT NOT NULL,
  location_description TEXT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  days_of_week INTEGER[],
  next_scheduled_at TIMESTAMP NOT NULL,
  last_completed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Phase: Offline Sync (enhancement)
CREATE TABLE sync_queue_client (
  id UUID PRIMARY KEY, -- Client-generated for offline
  device_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP
);
```

---

## Build Order with Dependencies

```
Phase 1: Offline Sync Foundation
├─ Enhanced Dexie schema (v2)
├─ SyncEngine service
├─ Service worker hardening
└─ OfflineIndicator component
        ↓
Phase 2: Scheduling Engine
├─ recurring_schedules table
├─ ScheduleService (node-cron)
├─ InspectionGenerator
└─ ScheduleWidget
        ↓
Phase 3: Dashboard Layout
├─ Mobile-first responsive layout
├─ Widget system
└─ Quick actions integration
```

**Why this order:**
1. Offline sync is the data foundation—scheduling and dashboard both need reliable data persistence
2. Scheduling provides content the dashboard will display
3. Dashboard is presentation layer only, adapts to prior phases

---

## Sources

- `src/hooks/usePendingInspections.ts` — Existing pending pattern
- `shared/schema.ts` — syncQueue table foundation
- `public/sw.js` — Service worker patterns
- `server/automated-monitoring.ts` — Existing cron pattern
- Dexie.js Official Docs (Context7): /dexie/dexie.js
- Background Sync API: MDN Web Docs
- PWA Offline Patterns: LogRocket Blog (2025)
- PostgreSQL Job Scheduling: pg_cron documentation (Citus Data)
