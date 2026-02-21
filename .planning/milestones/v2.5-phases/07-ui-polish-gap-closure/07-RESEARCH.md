# Phase 07: UI Polish Gap Closure - Research

**Researched:** 2026-02-18  
**Domain:** React + Radix UI interaction polish in existing workflow screens  
**Confidence:** HIGH

## User Constraints

- No `CONTEXT.md` exists for this phase; no locked discussion-time decisions to copy verbatim.
- Apply provided prior decisions as implementation guardrails:
  - Sticky thumb zone: mobile camera block remains reachable above safe-area and save bar.
  - Explicit touch minimums: primary capture `64px`, secondary actions `44px` minimum.
  - Pending badge urgency/freshness wiring is complete in Phase 06 and must not regress.

## Summary

Phase 07 should be implemented as targeted component refactors, not a redesign. The existing stack already has everything needed to close the Phase 04 gaps: Radix Accordion and Collapsible primitives, react-hook-form, existing Tailwind sizing conventions, and existing pending-count event wiring from Phase 06. The safest approach is to preserve current data contracts and form schema keys, then reshape UI structure around them.

The main hidden risk is schema drift in rating-group implementation. Current form fields are `floors`, `verticalHorizontalSurfaces`, `ceiling`, `restrooms`, `customerSatisfaction`, `trash`, `projectCleaning`, `activitySupport`, `safetyCompliance`, `equipment`, `monitoring` (from `shared/schema.ts` and `shared/custodial-criteria.ts`). Any grouping plan that introduces non-existent keys (for example `walls`, `windows`, `doors`, `hazmat`, `signage`, `overall`, `recommendation`) will silently break progress counts and submission integrity.

**Primary recommendation:** Keep existing field schema untouched, implement grouped UI with Radix Accordion + derived per-section progress, make quick-capture camera block first in DOM order, add default-collapsed notes with Radix Collapsible pattern, and wire FAB hide/show using App-level scroll direction state passed as a prop to `FloatingActionButton`.

## Standard Stack

**Confidence: HIGH**

### Core
| Library | Version (repo) | Purpose in Phase 07 | Why Standard Here |
|---|---:|---|---|
| `react` | `^18.3.1` | Page/component state and conditional rendering | Existing app runtime; no migration risk |
| `react-hook-form` | `^7.66.0` | Rating form state + validation integration | Already used by `InspectionCompletionForm` |
| `@radix-ui/react-accordion` | `^1.2.4` | Accessible grouped ratings UI | Already installed + existing `src/components/ui/accordion.tsx` wrapper |
| `@radix-ui/react-collapsible` | `^1.1.4` | Notes expand/collapse and optional metadata collapse | Already installed + existing `src/components/ui/collapsible.tsx` |
| `tailwindcss` | `^3.4.17` | Touch target minimums and responsive hierarchy | Existing design language and utility conventions |

### Supporting
| Library/Pattern | Version | Purpose | When to Use |
|---|---:|---|---|
| `lucide-react` | `^0.453.0` | Section affordances (chevrons/icons) | Accordion/collapsible trigger affordance |
| Existing `cn()` helper | internal | Deterministic conditional classes | All state-driven class toggles |
| Browser event model (`addEventListener`) | baseline | Scroll direction detection for FAB visibility | Dashboard page only, app shell scope |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|---|---|---|
| Radix Accordion | Custom `CollapsibleSection` animation div | Faster to hack, but weaker built-in a11y semantics/keyboard behavior |
| Derived progress from `form.watch()` calls spread across JSX | `useWatch` selective subscriptions | `useWatch` is cleaner and reduces broad rerender pressure in larger forms |
| App-level FAB visibility state | Internal FAB component scroll listener | Duplicates event listeners and makes shell-level behavior harder to coordinate |

**Install:** No new dependencies required for Phase 07.

## Architecture Patterns

**Confidence: HIGH**

### 1) Ratings: Schema-first grouping, UI-only refactor
**Use:** Group existing 11 rating fields into 4 sections without changing API/schema keys.

Required canonical keys (must stay exact):
- `floors`, `verticalHorizontalSurfaces`, `ceiling`
- `restrooms`, `trash`, `projectCleaning`, `activitySupport`
- `safetyCompliance`, `equipment`, `monitoring`
- `customerSatisfaction`

Recommended sections for this codebase:
- **Physical Condition:** `floors`, `verticalHorizontalSurfaces`, `ceiling`
- **Service Delivery:** `restrooms`, `trash`, `projectCleaning`, `activitySupport`
- **Compliance & Operations:** `safetyCompliance`, `equipment`, `monitoring`
- **Satisfaction:** `customerSatisfaction`

### 2) Progress counters from form state (not duplicated local state)
**Use:** Compute `rated/total` from form-controlled values; do not introduce parallel rating state.

### 3) Camera-first by DOM order, not CSS order hacks
**Use:** Place camera section above metadata and notes in JSX tree. Keep metadata visible but secondary.

### 4) Notes default-collapsed via Radix Collapsible contract
**Use:** Controlled `open` state at page level (`quick-capture.tsx`), pass `open/onOpenChange` to notes section.

### 5) FAB hide/show: App shell owns scroll direction
**Use:** Add one app-level scroll-direction detector in `src/App.tsx`, pass `isVisible` prop into `FloatingActionButton`.

Implementation guidance:
- Use threshold (for example 12-16px delta) to avoid jitter.
- Keep listener cleanup strict in `useEffect` teardown.
- Use transform/opacity transitions (avoid mount/unmount thrash).

## Don't Hand-Roll

**Confidence: HIGH**

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Accordion semantics + keyboard map | Custom collapsible div with manual aria and key handlers | Radix Accordion (`src/components/ui/accordion.tsx`) | APG-compliant semantics and interaction model already solved |
| Collapsible notes semantics | Bespoke hidden/expanded textarea logic only | Radix Collapsible (`src/components/ui/collapsible.tsx`) | Avoids accessibility drift and inconsistent state attributes |
| Form state duplication | Separate `ratings` state object | `react-hook-form` as single source of truth (`useWatch`/form values) | Prevents divergence between UI and submit payload |
| Scroll listener orchestration in multiple components | One listener per FAB/card component | Single App-level listener + prop drilling | Prevents conflicting visibility logic and listener leaks |
| Touch-target policy interpretation from mixed sources | Ad hoc per-control choices | Enforce product rule `>=44px` for all secondary controls | Consistent with project decision and current requirement gate |

## Common Pitfalls

**Confidence: HIGH (repo + standards verified)**

### 1) Field-key mismatch between plan text and actual schema
**What goes wrong:** Group config references non-existent keys (example: `walls`, `windows`, `doors`, `hazmat`, `signage`, `overall`, `recommendation`).  
**Why it happens:** Earlier planning examples diverged from `shared/schema.ts` / `shared/custodial-criteria.ts`.  
**How to avoid:** Define rating groups from schema constants, not from memory.  
**Warning signs:** Progress counters never reach full completion, submit payload misses expected numeric ratings.

### 2) Re-render churn from heavy `form.watch()` usage in render tree
**What goes wrong:** Form feels sluggish as grouped sections expand/collapse and multiple watchers fire.  
**Why it happens:** Broad subscription patterns cause large component rerenders.  
**How to avoid:** Use selective `useWatch` or derive once per render from controlled values map.  
**Warning signs:** Noticeable lag when selecting stars rapidly.

### 3) Camera-first implemented visually but not structurally
**What goes wrong:** CSS `order` changes visual layout while keyboard/screen-reader order remains old.  
**Why it happens:** Quick layout patch instead of DOM reorder.  
**How to avoid:** Move camera JSX block above metadata/notes blocks directly in `quick-capture.tsx`.  
**Warning signs:** Tab focus reaches metadata before camera controls.

### 4) FAB visibility jitter and memory leaks
**What goes wrong:** FAB flickers on tiny scroll changes or behavior degrades after route toggles.  
**Why it happens:** No delta threshold and/or listener cleanup errors.  
**How to avoid:** Track lastY + minimum delta, cleanup listener on unmount, keep animation CSS-only.  
**Warning signs:** Rapid show/hide while finger is mostly stationary; duplicate listener behavior.

### 5) 44px rule inconsistently applied
**What goes wrong:** One or two secondary controls remain under target size (already seen with `min-h-[40px]`).  
**Why it happens:** Spot-fix only around known line without auditing neighboring controls.  
**How to avoid:** Audit interactive elements in affected pages and standardize `min-h-[44px] min-w-[44px]` minimum.  
**Warning signs:** Mixed 40/44/48 values on same control class family.

### 6) Breaking existing freshness/event model while polishing UI
**What goes wrong:** Pending badge freshness regresses after quick-capture edits.  
**Why it happens:** Refactor removes or bypasses event dispatch flow introduced in Phase 06.  
**How to avoid:** Preserve `window.dispatchEvent(new Event(PENDING_COUNT_UPDATED_EVENT))` path exactly after successful save.  
**Warning signs:** Badge updates only on poll interval, not immediate post-save.

## Code Examples

**Confidence: HIGH**

### 1) Grouped rating configuration using real schema keys
```typescript
// Source anchors:
// - shared/schema.ts
// - shared/custodial-criteria.ts
const RATING_GROUPS = [
  {
    id: 'physical',
    label: 'Physical Condition',
    fields: ['floors', 'verticalHorizontalSurfaces', 'ceiling'] as const,
  },
  {
    id: 'service',
    label: 'Service Delivery',
    fields: ['restrooms', 'trash', 'projectCleaning', 'activitySupport'] as const,
  },
  {
    id: 'compliance',
    label: 'Compliance & Operations',
    fields: ['safetyCompliance', 'equipment', 'monitoring'] as const,
  },
  {
    id: 'satisfaction',
    label: 'Satisfaction',
    fields: ['customerSatisfaction'] as const,
  },
] as const;
```

### 2) Per-section progress derived from form values
```typescript
// Source: react-hook-form v7.66.0 docs (useWatch selective subscriptions)
import { useWatch } from 'react-hook-form';

const values = useWatch({ control: form.control });

function getSectionProgress(fields: readonly string[]) {
  const rated = fields.filter((field) => {
    const value = values?.[field as keyof typeof values];
    return typeof value === 'number' && value >= 1 && value <= 5;
  }).length;

  return { rated, total: fields.length };
}
```

### 3) Camera-first + default-collapsed notes structure
```tsx
// Source anchors:
// - src/pages/quick-capture.tsx (current ordering)
// - src/components/ui/collapsible.tsx
<main>
  <section aria-labelledby="photos-heading">
    {/* camera block first in DOM */}
    <CameraCapture ... />
  </section>

  {capturedImages.length > 0 && <PhotoPreviewStrip ... />}

  <section aria-labelledby="metadata-heading" className="space-y-4">
    {/* school/location/name controls remain accessible but secondary */}
  </section>

  <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
    <CollapsibleTrigger asChild>
      <Button type="button" variant="outline" className="min-h-[44px]">
        {notesOpen ? 'Hide Notes' : 'Add Notes'}
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <QuickNoteInput value={quickNotes} onChange={setQuickNotes} ... />
    </CollapsibleContent>
  </Collapsible>
</main>
```

### 4) App-level FAB hide/show on scroll direction
```tsx
// Source anchors:
// - src/App.tsx
// - src/components/ui/FloatingActionButton.tsx
const [fabVisible, setFabVisible] = useState(true);

useEffect(() => {
  let lastY = window.scrollY;
  const threshold = 12;

  const onScroll = () => {
    const nextY = window.scrollY;
    const delta = nextY - lastY;
    if (Math.abs(delta) < threshold) return;
    setFabVisible(delta < 0 || nextY < 24);
    lastY = nextY;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);

<FloatingActionButton className={fabVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'} ... />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Flat list of 11 rating rows | Grouped accordion sections with per-section progress | Current phase objective (2026) | Faster scanability, lower cognitive load, easier completion tracking |
| Metadata-first quick capture flow | Camera-first DOM order with secondary metadata | Current phase objective (2026) | Better field ergonomics and faster capture path |
| Always-visible notes block | Default-collapsed notes with explicit toggle | Current phase objective (2026) | Lower visual clutter while preserving optional detail capture |
| Static FAB visibility | Scroll-direction-aware FAB visibility | Current phase objective (2026) | Better content visibility while scrolling, retains quick action access |

**Deprecated/outdated in this codebase context:**
- `min-h-[40px]` for secondary quick actions: below project touch minimum; replace with `min-h-[44px]` (+ `min-w-[44px]` where applicable).
- Example rating keys in 07-02 plan (`walls`, `windows`, `doors`, `hazmat`, etc.): stale versus canonical schema keys in `shared/schema.ts`.

## Sources

### Primary (HIGH confidence)
- Repo code: `src/components/review/InspectionCompletionForm.tsx`
- Repo code: `src/pages/quick-capture.tsx`
- Repo code: `src/components/capture/QuickNoteInput.tsx`
- Repo code: `src/components/ui/FloatingActionButton.tsx`
- Repo code: `src/App.tsx`
- Repo code: `src/components/ui/accordion.tsx`
- Repo code: `src/components/ui/collapsible.tsx`
- Repo schema: `shared/schema.ts`
- Repo criteria: `shared/custodial-criteria.ts`
- Package versions: `package.json`
- Radix Accordion docs: https://www.radix-ui.com/primitives/docs/components/accordion
- WAI-ARIA APG Accordion pattern: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
- React Hook Form docs (v7.66.0 via Context7): `/react-hook-form/react-hook-form/v7.66.0`

### Secondary (MEDIUM confidence)
- Apple UI Design Tips (44pt minimum hit targets): https://developer.apple.com/design/tips/
- Android Accessibility (48dp recommendation): https://support.google.com/accessibility/android/answer/7101858?hl=en
- MDN addEventListener guidance (listener options and behavior): https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
- WCAG 2.2 target minimum (24x24 CSS px baseline): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

### Tertiary (LOW confidence)
- None

## Confidence Assessment

| Area | Level | Reason |
|---|---|---|
| Standard Stack | HIGH | Directly verified against `package.json` and in-repo component wrappers |
| Architecture | HIGH | Derived from current file structure and verified primitive availability |
| Pitfalls | HIGH | Confirmed by current unresolved gaps + schema and interaction standards |
| Cross-platform touch-size context | MEDIUM | Guidance varies by platform (44pt/48dp/WCAG 24px), but project requirement is explicit |

## Open Questions

1. Should FAB hide/show be completed inside Phase 07 despite current 07-03 plan text focusing only on camera-first + notes?
   - What we know: Phase goal explicitly includes FAB hide/show in roadmap/phase description.
   - What is unclear: Existing per-plan files do not include a dedicated FAB task.
   - Recommendation: Treat FAB hide/show as required acceptance criteria for Phase 07 even if implemented via amendment to 07-03.

2. Should rating sections default to expanded or partially collapsed?
   - What we know: Requirement is grouped sections + progress; no locked behavior for default open state.
   - What is unclear: Preferred operator behavior under field conditions.
   - Recommendation: Desktop default expanded for speed, mobile default first section expanded and others collapsible.

## Validity Window

- **Research date:** 2026-02-18
- **Valid until:** 2026-03-20 (30 days; stable stack)
