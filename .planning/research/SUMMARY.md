# Project Research Summary: Custodial Command v2.5

**Project:** Custodial Command v2.5 "Polish and Enhancements"
**Domain:** Facility inspection management PWA for custodial staff
**Researched:** 2026-02-19
**Confidence:** HIGH

## Executive Summary

Custodial Command v2.5 is a field service inspection PWA that must work reliably in school environments with poor connectivity (basements, remote wings). Based on research into modern PWA patterns and field service industry standards, the recommended approach is a **progressive enhancement strategy** that prioritizes offline queue functionality over full offline mode complexity.

The research reveals that facility staff in schools have predictable workflows: daily/weekly recurring inspections, photo-first documentation, and one-handed mobile usage while walking. The recommended architecture leverages the existing Dexie-based IndexedDB layer (already installed) with Service Worker coordination for offline queuing, node-cron for recurring schedule generation, and a mobile-first dashboard with thumb-zone positioning (56px FAB at bottom-right).

**Key risks identified:** (1) iOS Safari doesn't support Background Sync API, requiring a polling + manual sync fallback; (2) IndexedDB storage quotas (50-250MB) require proactive monitoring to prevent data loss from queued photos; (3) Schedule recurrence logic is error-prone around timezone transitions. All three are mitigatable with feature detection, storage estimation, and UTC storage patterns.

## Key Findings

### Recommended Stack

The existing React/Express/PostgreSQL foundation is solid and requires minimal additions. Core stack remains unchanged (React 18.3.1, TypeScript 5.6.3, Express 4.21.2, Vite 6.4.1). For v2.5 features, only lightweight additions are needed: `idb-keyval` (optional IndexedDB wrapper), native Background Sync API with fallback polling, `node-cron` (already in use), and the Web Speech API (native, no install).

**Core technologies:**
- **IndexedDB**: Local photo/data queue — only browser storage supporting structured clone for binary photo data
- **idb-keyval**: IndexedDB wrapper — simpler API than raw IDB, smaller than Dexie for simple key-value needs
- **Background Sync API**: Deferred uploads — Chrome/Edge only; must implement polling fallback for iOS Safari
- **node-cron**: Server-side schedule generation — already used in Phase 10, proven pattern
- **Web Speech API**: Speech-to-text — free, native, sufficient for MVP (iOS needs webkit prefix)

*See [STACK.md](STACK.md) for full analysis and alternatives considered.*

### Expected Features

Modern field service tools have established user expectations. Missing table stakes features makes the product feel incomplete to custodial staff who compare against tools like ServiceTrade or Jobber.

**Must have (table stakes):**
- **Offline Quick Capture** — Field workers need confidence they can capture photos in connectivity dead zones
- **Upload Queue Visibility** — Badge showing pending count; list view with retry per item
- **Online/Offline Status Indicator** — Visual indicator (green/red dot) at a glance
- **Quick Capture Prominence** — Primary workflow must be discoverable immediately; card above fold + FAB
- **Recurring Schedules** — Daily/weekly frequency for consistent facility coverage
- **Due Inspections List** — Dashboard card showing today's scheduled items
- **Schedule→Capture Link** — One-tap from due item to capture form with pre-filled location

**Should have (competitive):**
- **Mobile-First Dashboard** — Thumb-zone placement; 56px FAB at bottom-right
- **Voice-to-Text Notes** — Hands-free capture while walking/inspecting
- **Compliance Tracking** — Admin visibility into scheduled vs actual completion
- **Auto-Sync Retry** — Failed uploads retry with exponential backoff

**Defer (v2.5.x or v2.6+):**
- **Full Offline Mode** — Adds massive complexity (validation, conflict resolution); limit to photos+notes only
- **Calendar Integration** — OAuth complexity; internal scheduling sufficient
- **AI Transcription** — Overkill; Web Speech API is free

*See [FEATURES.md](FEATURES.md) for MVP definition and competitor analysis.*

### Architecture Approach

The v2.5 features integrate cleanly with the existing React/Express/PostgreSQL stack. The recommended pattern is **Phase 13 (Offline Sync) → Phase 14 (Scheduling) → Phase 12 (Dashboard Layout)** based on data-layer dependencies.

**Major components:**
1. **SyncEngine.ts** — IndexedDB queue management with Service Worker coordination; handles add/remove/sync operations
2. **ScheduleService.ts** — node-cron job that generates daily inspection instances from recurring schedule templates
3. **VoiceNoteInput.tsx** — Client-side Web Speech API wrapper with feature detection and transcript editing
4. **UpcomingInspectionsCard** — Dashboard widget querying scheduled inspections for today/next 7 days

*See [ARCHITECTURE.md](ARCHITECTURE.md) for data flows, patterns, and component boundaries.*

### Critical Pitfalls

1. **IndexedDB Storage Quota Exceeded** — Photos queue fills device storage (~50-250MB limit); sync fails silently. *Mitigation: Check `navigator.storage.estimate()` before queue; auto-purge synced items; warn at 80% capacity.*

2. **Background Sync API Unsupported on iOS** — Safari iOS doesn't support Background Sync (as of 2026-02). *Mitigation: Progressive enhancement with polling fallback + explicit "Sync Now" button.*

3. **Schedule Recurrence Logic Edge Cases** — Timezone handling, daylight saving transitions cause duplicate/missed inspections. *Mitigation: Store schedules in UTC; use established cron library with timezone support.*

4. **Voice Recognition Fails Silently on iOS** — Web Speech API requires user gesture; prefixed and limited on iOS. *Mitigation: Feature detect `window.SpeechRecognition || window.webkitSpeechRecognition`; show text fallback.*

*See [PITFALLS.md](PITFALLS.md) for moderate/minor pitfalls and phase-specific warnings.*

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Offline Sync Foundation
**Rationale:** Offline sync is the data foundation—subsequent phases (Scheduling, Dashboard) both need reliable data persistence. Users must trust capture works before scheduling matters.
**Delivers:** IndexedDB queue for photos+metadata; Service Worker sync handler; upload queue UI with badge; online/offline status indicator; manual sync button
**Addresses:** Offline Quick Capture, Upload Queue Visibility, Status Indicator, Auto-Sync Retry
**Avoids:** IndexedDB quota exceeded (storage monitoring); iOS Background Sync lack (polling fallback)
**Research Flag:** STANDARD — well-documented IndexedDB + Service Worker patterns

### Phase 2: Inspection Scheduling Engine
**Rationale:** Scheduling provides the content that makes the dashboard meaningful. Need due items before displaying them.
**Delivers:** `recurring_schedules` table; ScheduleService (node-cron) generating daily inspection instances; admin CRUD UI; dashboard "Due Today" card; pre-filled Quick Capture from due items
**Addresses:** Recurring Schedules, Due List, Schedule→Capture Link
**Avoids:** Recurrence edge cases (UTC storage, established cron lib); Timezone drift (UTC backend, local display)
**Research Flag:** SKIP — node-cron pattern already proven in Phase 10

### Phase 3: Dashboard Layout & Voice
**Rationale:** Dashboard is presentation layer only; adapts to data from prior phases. Voice notes enhance Quick Capture, which needs dashboard prominence first.
**Delivers:** Mobile-first responsive layout; thumb-zone FAB (56px); widget system (Stats, Due List, Schedule); Voice-to-Text integration in Quick Capture
**Addresses:** Mobile-First Dashboard, Quick Capture Prominence, Voice Notes
**Avoids:** FAB overlap (safe-area-inset testing); iOS voice failures (feature detection)
**Research Flag:** STANDARD — Tailwind responsive patterns; Web Speech API docs clear

### Phase Ordering Rationale

1. **Data foundation first:** Phase 13 (Offline) establishes reliable data persistence that Phase 14 (Scheduling) and Phase 12 (Dashboard) both depend on
2. **Content before presentation:** Phase 14 generates the due items that Phase 12 will display
3. **Progressive enhancement:** Each phase adds capability without breaking prior work
4. **Risk mitigation:** Toughest problems (offline sync, iOS compatibility) addressed first when attention is highest

### Research Flags

Phases likely needing deeper research during planning:
- **None identified** — All v2.5 features use established patterns with clear documentation

Phases with standard patterns (skip research-phase):
- **Phase 13 (Offline Sync):** Dexie.js + Service Worker well-documented; Background Sync API has clear fallback patterns
- **Phase 14 (Scheduling):** node-cron already used in Phase 10; recurrence patterns standard
- **Phase 15 (Voice):** Web Speech API native; feature detection straightforward
- **Phase 12 (Dashboard):** Tailwind responsive design is standard; no new patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Uses existing foundation; minimal new deps; official docs verified |
| Features | HIGH | Industry consensus on field service app patterns; competitor analysis clear |
| Architecture | HIGH | Dexie proven in codebase; node-cron already used; patterns well-documented |
| Pitfalls | HIGH | Can I Use + MDN verify iOS limitations; storage quota behavior consistent |

**Overall confidence:** HIGH

### Gaps to Address

- **Real-world storage usage:** Actual photo sizes (MB) vs IndexedDB quota on custodial staff devices; validate during Phase 13 testing
- **iOS Safari testing:** Web Speech API and Background Sync must be tested on physical iOS devices, not just emulators
- **Schedule volume:** Validate daily/weekly frequency assumption with custodial team; assess if monthly needed

## Sources

### Primary (HIGH confidence)
- `CLAUDE.md` — Existing architecture documentation
- `ROADMAP.md` — Phase 12-15 requirements
- `shared/schema.ts` — syncQueue table foundation, inspectionPhotos schema
- `public/sw.js` — Service worker patterns
- `server/automated-monitoring.ts` — Existing node-cron pattern
- Dexie.js Official Docs (Context7) — IndexedDB patterns
- MDN Web Docs — Background Sync API, Web Speech API
- Can I Use — Browser compatibility tables

### Secondary (MEDIUM confidence)
- Monterail PWA Offline Patterns 2024 — Queue management patterns
- LogRocket Offline-First Guide 2025 — IndexedDB patterns
- ServiceTrade Scheduling — Recurring service patterns
- Mobile UX Thumb Zone 2026 — Touch target guidelines

### Tertiary (LOW confidence)
- Field service competitor analysis — Feature comparison only, not implementation guidance

---
*Research completed: 2026-02-19*
*Ready for roadmap: yes*
