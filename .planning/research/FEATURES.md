# Feature Landscape: Milestone v2.5 "Polish and Enhancements"

**Domain:** Facility inspection management PWA for custodial staff
**Researched:** 2026-02-19
**Confidence:** HIGH (based on codebase analysis + field service industry patterns)

## Table Stakes (Users Expect These)

Features users assume exist in modern field service tools. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Offline Quick Capture** | Field workers are in connectivity dead zones (basements, remote wings) | Medium | IndexedDB queue + service worker sync; photos must queue locally |
| **Upload Queue Visibility** | Users need confidence data isn't lost when offline | Low | Badge/indicator showing pending items count |
| **Online/Offline Status Indicator** | Users need to know connectivity state at a glance | Low | `navigator.onLine` + visual badge (icon/color change) |
| **Quick Capture Prominence** | Primary workflow; must be discoverable immediately | Low | Card/button above fold on mobile; FAB for instant access |
| **Review Inspections Visibility** | Critical secondary workflow; currently buried in nav | Low | Dashboard card or prominent nav link |
| **Recurring Schedules** | Facilities need consistent coverage (daily/weekly) | Medium | Cron + schedule table; generate due items |
| **Due/Upcoming List** | Daily task list; what should I inspect today? | Medium | Query scheduled items by date; dashboard card |
| **Direct Schedule→Capture** | One-tap from due item to capture form | Low | URL param pre-fills location; saves time |

### Table Stakes Notes

**Offline Sync (Critical):** Schools have connectivity dead zones—basements, remote wings, interior rooms. 2024 PWA patterns use:
- **IndexedDB** for local queue (photos + metadata) — *only browser storage supporting structured clone*
- **Service Worker** with `sync` event for background upload
- **Queue visualization** — count badge + list of pending items

**Source:** [Monterail PWA Offline Patterns 2024](https://www.monterail.com/blog/pwa-offline-dynamic-data), [LogRocket Background Sync](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)

---

## Differentiators (Competitive Advantage)

Features that set Custodial Command apart. Not required, but valuable for daily use.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Mobile-First Dashboard** | Thumb-zone placement; field workers hold phones one-handed | Low | CSS `safe-area-inset` + 56px FAB at bottom-right |
| **Voice-to-Text Notes** | Hands-free capture while walking/inspecting | Low-Medium | Web Speech API; iOS Safari has limitations |
| **Compliance Tracking** | Admin visibility into schedule vs actual completion | Medium | Reporting view: scheduled count vs completed count |
| **Auto-Sync Retry** | Failed uploads retry with exponential backoff | Medium | `retryCount` + `nextRetryAt` in sync queue |
| **Schedule Overdue Warnings** | Visual indicator when inspections are past due | Low | Amber/red badge based on days overdue |
| **Quick Schedule Creation** | Minimal clicks to create recurring inspection | Low | Pre-fill school/location; pick frequency |

### Differentiator Notes

**Voice Notes:** Web Speech API is free and sufficient for MVP. No need for AI transcription. iOS Safari requires `webkitSpeechRecognition` prefix.

**Mobile Dashboard Patterns:** Field service apps (Jobber, ServiceTrade) use:
- Primary action in thumb zone (bottom 1/3 of screen)
- Quick stats at top (today's tasks, pending count)
- Scrollable "due today" list as main content

**Source:** [SAP Dashboard Design Patterns](https://community.sap.com/t5/technology-blog-posts-by-sap/dashboard-design-patterns/ba-p/14055722), [Mobile UX Thumb Zone 2026](https://www.sanjaydey.com/mobile-ux-ui-design-patterns-2026-data-backed/)

---

## Anti-Features (Explicitly NOT Building)

Features that seem good but create complexity without proportional value.

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| **Offline Complete Inspections** | Full ratings offline | Adds massive complexity (validation, conflict resolution) | Limit offline to photos + notes only; full ratings when online |
| **Calendar Integration** | Google/Outlook sync | OAuth complexity; internal scheduling sufficient | Simple recurring logic in app; manual export if needed |
| **Bulk Schedule Creation** | Create many schedules at once | 6 schools = low volume; manual is fine | Single-schedule creation with quick duplicate |
| **AI Transcription** | "Smarter" voice notes | Overkill; Web Speech API is free | Browser-native recognition; edit after capture |
| **Video Capture** | Record video inspections | Storage/bandwidth explosion; photos sufficient | Stick to photo-first workflow |
| **Custom Notification Schedules** | Per-user alert preferences | Complexity for 3 users | Fixed daily cadence; email at 8am |
| **Background Sync API** | Automatic sync without app open | iOS Safari doesn't support; unreliable | Manual polling on app focus + explicit sync button |

### Anti-Feature Rationale

**Background Sync API:** While Chrome supports `sync` events, iOS Safari (critical for custodial staff) does not. Better pattern: queue in IndexedDB + poll on `online` event + explicit "Sync Now" button.

**Source:** [DEV Community Background Sync Guide 2024](https://dev.to/ruppysuppy/supercharge-your-website-using-pwa-background-sync-1m23)

---

## Feature Dependencies

```
Dashboard Layout (Phase 12)
    └── enables ──> Quick Capture prominence
    └── enables ──> Review Inspections visibility

Offline Sync (Phase 13)
    ├── requires ──> IndexedDB storage
    ├── requires ──> Service Worker sync handler
    ├── requires ──> Upload queue UI
    └── requires ──> Status indicator

Inspection Scheduling (Phase 14)
    ├── requires ──> Schedule table (new)
    ├── requires ──> Due inspection query
    ├── requires ──> Dashboard "Due Today" card
    └── enhances ──> Quick Capture (pre-fill location)

Voice Notes (Phase 15)
    ├── requires ──> Quick Capture (existing)
    ├── requires ──> Web Speech API
    └── requires ──> Transcription editing UI

Cross-Phase Dependencies:
    Phase 12 (Dashboard) ──> Phase 13 (Offline) ──> Phase 14 (Scheduling)
    Phase 12 (Dashboard) can parallel with Phase 15 (Voice)
```

### Dependency Notes

- **Phase 13 requires Phase 12:** Offline sync needs prominent Quick Capture access point
- **Phase 14 requires Phase 13:** Scheduling needs reliable capture (users trust it works offline)
- **Phase 15 requires Phase 12:** Voice notes enhance Quick Capture, which needs dashboard prominence
- **All phases require existing v2.0 foundation:** Quick Capture, Photo-First Review, pending badges

---

## User Interaction Patterns

### Offline Capture Flow

**Pattern:** Queue-first, sync-second

```
User Action → Save to IndexedDB → Update UI (queued) → [Online Event] → Sync Queue
```

**Key behaviors:**
1. **Immediate feedback:** Show "Saved locally" toast; add to queue count
2. **Queue visibility:** Badge on upload icon; tap shows list with retry button per item
3. **Auto-retry on online:** When `online` event fires, process queue automatically
4. **Manual retry:** User can tap individual failed items to retry immediately
5. **Conflict handling:** Last-write-wins; timestamps resolve ties

**Source:** [LogRocket Offline-First Guide 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)

### Scheduling Flow

**Pattern:** Recurrence generates due items

```
Admin Creates Schedule → Cron generates Due Inspections → Dashboard shows "Due Today"
     ↓
User taps Due Item → Pre-filled Quick Capture → Completes → Marks schedule item done
```

**Key behaviors:**
1. **Schedule = template:** Defines what should happen (school, location, frequency)
2. **Due items = instances:** Generated nightly for today/tomorrow
3. **Completion links:** Due item references completed inspection (or remains pending)
4. **Compliance view:** Compare scheduled vs completed counts per week/month

### Mobile Dashboard Layout

**Pattern:** Thumb-zone primary actions, glanceable stats

```
┌─────────────────────────────┐
│  [Header: School Selector]  │  ← Top: Context switch (rare)
├─────────────────────────────┤
│  Due Today: 3  Pending: 12   │  ← Stats row (glanceable)
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ Quick Capture Card    │  │  ← Primary action (thumb reachable)
│  │ [Camera Icon]         │  │
│  │ "Tap to start"        │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Due Inspections       │  │  ← Scrollable list
│  │ • Gym - Daily         │  │
│  │ • Cafeteria - Weekly  │  │
│  └───────────────────────┘  │
│                             │
├─────────────────────────────┤
│ [Review] [Analytics] [More] │  ← Bottom nav (thumb reachable)
└─────────────────────────────┘
        ↖ FAB (56px) ── Camera icon, bottom-right
```

**Key behaviors:**
1. **FAB for instant capture:** 56px Material Design standard; hides on scroll down
2. **Stats above fold:** Today's workload at a glance
3. **Due list scrollable:** Can grow to 10+ items without breaking layout
4. **Bottom nav for secondary:** Review, Analytics accessible but not competing

**Source:** [UITop Mobile Dashboard Components](https://uitop.design/blog/design/mobile-dashboard-ui-components/)

---

## Complexity Assessment

| Feature | Frontend | Backend | Database | Integration | Total |
|---------|----------|---------|----------|-------------|-------|
| **Dashboard Layout** | Medium | None | None | Low | **Low** |
| **Offline Queue** | Medium | Low | None | Medium | **Medium** |
| **Upload Indicator** | Low | None | None | Low | **Low** |
| **Status Badge** | Low | None | None | Low | **Low** |
| **Inspection Schedule** | Medium | Medium | Medium | Low | **Medium** |
| **Due List** | Medium | Medium | None | Low | **Medium** |
| **Voice Notes** | Medium | None | None | Low | **Low-Medium** |
| **Compliance Tracking** | Medium | Medium | Low | Low | **Medium** |

### Complexity Notes

- **Offline Queue:** IndexedDB + Service Worker sync is well-documented but requires careful error handling and retry logic
- **Scheduling:** Recurring logic (daily/weekly) needs cron job to generate due items; conflict detection if manual inspection exists
- **Voice Notes:** Web Speech API is straightforward but browser support varies; iOS needs `webkitSpeechRecognition`

---

## MVP Definition for v2.5

### Launch With (v2.5.0)

Minimum viable polish release:

1. ✅ **Dashboard Layout Reorganization** — Quick Capture prominence; Review visibility; thumb-zone placement
2. ✅ **Offline Quick Capture** — Photos + metadata queue in IndexedDB; manual sync button
3. ✅ **Upload Queue Indicator** — Badge showing pending count; list view of queued items
4. ✅ **Online/Offline Status** — Visual indicator (green/red dot or icon)
5. ✅ **Basic Scheduling** — Daily/weekly recurring per location; simple CRUD
6. ✅ **Due Inspections List** — Dashboard card showing today's scheduled items
7. ✅ **Schedule→Capture Link** — Tap due item opens Quick Capture with pre-filled location

### Add After Validation (v2.5.x)

Once core is stable and used:

- [ ] **Compliance Tracking** — Scheduled vs completed report; coverage percentage
- [ ] **Voice Notes** — Speech-to-text in Quick Capture; edit before save
- [ ] **Schedule Overdue Warnings** — Amber/red badges for past-due items
- [ ] **Auto-Sync Retry** — Exponential backoff for failed uploads

### Future Consideration (v2.6+)

Defer until product-market fit confirmed:

- [ ] **Bulk Schedule Import** — CSV upload for many schedules
- [ ] **Calendar Export** — iCal feed of scheduled inspections
- [ ] **Custom Recurrence** — Every 3 days, monthly, etc.
- [ ] **Shift Scheduling** — Assign inspectors to specific schedules

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Dashboard Layout | HIGH | LOW | **P1** |
| Offline Queue | HIGH | MEDIUM | **P1** |
| Upload Indicator | HIGH | LOW | **P1** |
| Status Badge | MEDIUM | LOW | **P1** |
| Due List | HIGH | MEDIUM | **P1** |
| Schedule→Capture Link | HIGH | LOW | **P1** |
| Basic Scheduling | HIGH | MEDIUM | **P1** |
| Compliance Tracking | MEDIUM | MEDIUM | **P2** |
| Voice Notes | MEDIUM | LOW | **P2** |
| Auto-Retry | MEDIUM | MEDIUM | **P2** |
| Overdue Warnings | LOW | LOW | **P3** |

**Priority Key:**
- **P1:** Must have for v2.5 launch
- **P2:** Should have; add in v2.5.x if time permits
- **P3:** Nice to have; future consideration

---

## Competitor Feature Analysis

| Feature | ServiceTrade | Jobber | FieldEquip | Custodial Command Approach |
|---------|--------------|--------|------------|---------------------------|
| Offline Capture | Full offline mode | Limited offline | Full offline | **Photos + notes only** (reduced scope) |
| Queue Visibility | Sync status bar | Upload progress | Sync indicator | **Badge + list** (simple, clear) |
| Recurring Schedules | Daily/weekly/monthly | Weekly patterns | PM schedules | **Daily/weekly only** (MVP) |
| Due List | Today/tomorrow | Job list | Work orders | **Dashboard card** (prominent) |
| Mobile Dashboard | Stats + actions | Home + schedule | Map + list | **Cards + FAB** (clean, simple) |
| Voice Notes | Not offered | Not offered | Not offered | **Web Speech API** (differentiator) |

### Competitive Notes

**Offline Strategy:** Enterprise tools (ServiceTrade, FieldEquip) offer full offline mode with complex conflict resolution. Custodial Command's reduced scope (photos + notes offline, ratings online) is intentional complexity reduction.

**Scheduling:** Competitors support complex recurrence (monthly, yearly, custom). Custodial Command starts with daily/weekly only—sufficient for school facilities.

**Source:** [ServiceTrade Scheduling](https://servicetrade.com/features/scheduling/), [Jobber Field Service](https://www.superbcrew.com/step-by-step-guide-how-to-use-jobber-a-field-service-management-software/)

---

## Integration with Existing Features

### Dependencies on v2.0 Foundation

| New Feature | Requires From v2.0 | Integration Point |
|-------------|-------------------|-------------------|
| **Offline Capture** | Quick Capture form; photo upload | Extend with IndexedDB queue before API call |
| **Due List** | `inspections` table; pending badges | Query joins schedule + completion status |
| **Schedule→Capture** | Quick Capture page; location selection | URL params pre-fill location dropdown |
| **Dashboard Layout** | Existing dashboard cards; navigation | Reorder/restyle existing components |
| **Voice Notes** | Quick Capture notes field | Add mic button + transcription |

### Data Flow: Offline Capture

```
User in Quick Capture
    │
    ▼
Takes Photo → Store in IndexedDB (blob + metadata)
    │
    ▼
Adds Notes (optional) → Update IndexedDB record
    │
    ▼
Hits "Save" → Add to sync queue table
    │
    ▼
[Online Event] → Service Worker processes queue
    │
    ▼
POST /api/inspections/quick-capture (with photo)
    │
    ▼
Server saves → Update IndexedDB status to "synced"
```

---

## Phase Mapping

| Feature | Phase | Plan | Status |
|---------|-------|------|--------|
| Dashboard Layout | 12 | LAYOUT-01, LAYOUT-02, LAYOUT-03 | Planned |
| Offline Queue | 13 | SYNC-01, SYNC-02 | Planned |
| Upload Indicator | 13 | SYNC-03 | Planned |
| Status Badge | 13 | SYNC-04 | Planned |
| Inspection Schedule | 14 | SCHED-01, SCHED-02 | Planned |
| Due List | 14 | SCHED-03 | Planned |
| Schedule→Capture | 14 | SCHED-04 | Planned |
| Voice Notes | 15 | VOICE-01, VOICE-02 | Planned |

---

## Sources

### Offline Sync Patterns
- [Monterail: PWA Offline Dynamic Data](https://www.monterail.com/blog/pwa-offline-dynamic-data) — IndexedDB + Background Sync
- [LogRocket: Offline-First Frontend 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/) — IndexedDB patterns
- [DEV Community: Background Sync](https://dev.to/ruppysuppy/supercharge-your-website-using-pwa-background-sync-1m23) — Queue management
- [CodeSamplez: Advanced Service Workers](https://codesamplez.com/front-end/advanced-service-worker-features) — Sync events

### Scheduling Patterns
- [ServiceTrade Scheduling](https://servicetrade.com/features/scheduling/) — Recurring service patterns
- [Jobber Field Service Guide](https://www.superbcrew.com/step-by-step-guide-how-to-use-jobber-a-field-service-management-software/) — Mobile field workflows
- [MyFieldAudits: Inspection Scheduling](https://www.myfieldaudits.com/blog/inspection-scheduling-software) — Industry comparison

### Mobile Dashboard UX
- [SAP Dashboard Design Patterns](https://community.sap.com/t5/technology-blog-posts-by-sap/dashboard-design-patterns/ba-p/14055722) — Enterprise dashboard patterns
- [Mobile UX Patterns 2026](https://www.sanjaydey.com/mobile-ux-ui-design-patterns-2026-data-backed/) — Thumb-zone design
- [UITop: Mobile Dashboard Components](https://uitop.design/blog/design/mobile-dashboard-ui-components/) — Button sizing, card patterns
- [618Media: Thumb-Friendly Design](https://618media.com/en/blog/thumb-friendly-design-optimizing-for-mobile/) — Touch target guidelines

### Codebase References
- `shared/schema.ts` — `syncQueue` table (lines 258-267), `inspectionPhotos` table (lines 231-256)
- `src/pages/quick-capture.tsx` — Existing capture form
- `.planning/ROADMAP.md` — Phase 12-15 requirements

---

*Feature research for: Custodial Command v2.5*
*Researched: 2026-02-19*
*Confidence: HIGH (industry patterns + existing codebase foundation)*
