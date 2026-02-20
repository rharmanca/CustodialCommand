# Technology Stack - Milestone v2.5

**Project:** Custodial Command v2.5 "Polish and Enhancements"
**Researched:** 2026-02-19

## Recommended Stack

### Core Framework (Unchanged from v2.0)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18.3.1 | UI framework | Established, hooks pattern throughout |
| TypeScript | 5.6.3 | Type safety | Strict mode enabled, shared types |
| Vite | 6.4.1 | Build tool | Fast HMR, established in project |
| Express | 4.21.2 | Backend API | Existing MVC pattern |
| Wouter | 3.3.5 | Routing | Lightweight, already in use |

### Database (Unchanged)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 15+ | Primary database | Existing Railway deployment |
| Drizzle ORM | 0.39.1 | Schema/Queries | Type-safe, existing patterns |
| Redis | 7+ | Sessions/Caching | Existing Railway addon |

### Phase 12: Dashboard Layout
| Technology | Purpose | Notes |
|------------|---------|-------|
| Tailwind CSS | Responsive layout | Existing utility classes |
| CSS Grid/Flex | Card positioning | Native, no new deps |
| Lucide React | Icons | Already used |

### Phase 13: Offline Sync
| Technology | Purpose | Browser Support |
|------------|---------|-----------------|
| IndexedDB | Photo/data queue | All modern browsers |
| idb-keyval | IndexedDB wrapper (optional) | Simpler API than raw IDB |
| Background Sync API | Deferred uploads | Chrome/Edge; iOS Safari NO |
| Broadcast Channel API | Cross-tab sync events | Most browsers |

### Phase 14: Scheduling
| Technology | Purpose | Why |
|------------|---------|-----|
| node-cron | Server-side cron | Already in use (Phase 10) |
| date-fns | Date manipulation | Already in use |
| Drizzle ORM | Schedule table | Existing patterns |

### Phase 15: Voice Notes
| Technology | Purpose | Browser Support |
|------------|---------|-----------------|
| Web Speech API | Speech-to-text | Chrome/Edge: Full; Safari: Limited |
| window.SpeechRecognition | Recognition interface | Prefixed on WebKit |
| MediaRecorder | Audio capture | All modern browsers |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Offline Storage | IndexedDB | localStorage | Binary photo data needs IDB |
| IDB Wrapper | idb-keyval | Dexie.js | Keyval is smaller; Dexie overkill |
| Background Sync | Native API | Workbox | Workbox adds bundle size; native API sufficient |
| Voice Recognition | Web Speech API | Azure Speech | Cost + complexity; browser API sufficient |
| Cron Library | node-cron | node-schedule | Already using node-cron |

## Installation

```bash
# Phase 13 (Offline Sync) - Optional
npm install idb-keyval

# Phase 15 (Voice Notes)
# No new dependencies needed — uses native Web Speech API
```

## Configuration

### Phase 13: Background Sync (Progressive Enhancement)
```javascript
// Feature detection pattern
const supportsBackgroundSync = 'sync' in ServiceWorkerRegistration.prototype;

if (supportsBackgroundSync) {
  // Use Background Sync API
} else {
  // Fallback: polling + manual trigger
}
```

### Phase 15: Web Speech API (Progressive Enhancement)
```javascript
// Feature detection pattern
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  // Enable voice button
} else {
  // Show text input fallback
}
```

## Sources

- `CLAUDE.md` — Architecture documentation
- `ROADMAP.md` — Phase 12-15 requirements
- `src/App.tsx` — Existing dashboard layout
- `public/sw.js` — Service worker patterns
- `shared/schema.ts` — syncQueue table foundation
- `server/automated-monitoring.ts` — Existing cron pattern
- Can I Use: Background Sync API, Web Speech API compatibility tables
