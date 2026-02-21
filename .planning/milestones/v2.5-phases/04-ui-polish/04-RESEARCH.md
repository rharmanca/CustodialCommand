# Phase 04: UI/UX Polish - Research

Researched: 2026-02-18
Mode: ecosystem
Scope lock: Implement locked Phase 04 decisions only (no theme change, no feature expansion)

## Standard Stack

Use the existing app stack already present in the repo; do not introduce new UI/state libraries for this phase.

### Core UI stack (use as-is)
- React 18.3.1 + TypeScript (repo standard): component state and interaction logic.
- Tailwind CSS 3.4.x utilities: sticky layout, touch target sizing (`min-h-*`, `min-w-*`), motion variants.
- Radix primitives via existing shadcn wrappers:
  - `@radix-ui/react-accordion` for grouped rating sections.
  - `@radix-ui/react-dialog` for photo zoom modal.
- Existing local components/hook patterns in this codebase:
  - `src/components/ui/accordion.tsx`
  - `src/components/ui/dialog.tsx`
  - `src/components/ui/FloatingActionButton.tsx`
  - `src/hooks/usePendingInspections.ts`

Confidence: HIGH (validated from local code and official docs)

### State/data-flow stack (use as-is)
- Local component state for ephemeral UI only (expanded sections, selected photo, modal open, FAB visibility).
- Existing fetch + existing hook pattern for pending counts/refresh (`usePendingInspections` style).
- TanStack Query (`@tanstack/react-query` already installed) only if count polling/invalidation is centralized; do not mix competing cache patterns inside one flow.

Confidence: MEDIUM-HIGH (repo currently uses both local fetch and Query provider; recommendation is consistency-first)

### Accessibility and motion baseline (current SOTA)
- WCAG 2.2 AA baseline includes SC 2.5.8 Target Size (Minimum): 24x24 CSS px minimum.
- Project lock (44px/64px targets) is stricter than WCAG minimum and should be preserved.
- Respect reduced motion preferences for pulse/accordion/FAB transitions via Tailwind `motion-safe`/`motion-reduce`.

Confidence: HIGH (WCAG 2.2 + MDN + Tailwind docs)

## Architecture Patterns

### 1) Sticky review pane pattern (layout domain)
Use a 2-column desktop layout where the photo pane is sticky and the form column scrolls normally.

Prescriptive pattern:
- Keep sticky behavior at pane level (`position: sticky`) with explicit top inset.
- Ensure sticky container lives inside a scroll context that does not accidentally break sticky semantics.
- Keep a bounded internal scroll (`max-h-[calc(100vh-...)] overflow-y-auto`) for photo stacks.

Why:
- MDN confirms sticky requires at least one non-auto inset and sticks relative to nearest scrolling ancestor.

Confidence: HIGH

### 2) Grouped ratings with accordion + progress (form UX + accessibility)
Use Radix Accordion in `type="multiple"` mode with all four sections open by default and per-section `X/Y rated` in trigger labels.

Prescriptive pattern:
- Keep all 11 ratings in the same `react-hook-form` instance.
- Compute section progress from watched fields.
- Render progress in accordion trigger text (not color-only).
- Keep sections collapsible but default expanded.

Why:
- Matches locked decisions and existing `src/components/ui/accordion.tsx` semantics.

Confidence: HIGH

### 3) Camera-first capture with progressive disclosure (mobile UX)
Keep capture action primary, notes secondary.

Prescriptive pattern:
- Camera visible immediately.
- Notes collapsed by default (existing `QuickNoteInput` can be wrapped in collapsible).
- Keep horizontal photo strip (`PhotoPreviewStrip`) persistent while capturing.
- Maintain min 64px primary capture action and >=44px secondary controls.

Why:
- Reduces tap count (CAP-02) and preserves optional note workflow (CAP-04).

Confidence: HIGH

### 4) Pending indicator + FAB behavior (state + animation domain)
Implement urgency as count + color + subtle pulse, and keep updates near real-time.

Prescriptive pattern:
- Derive urgency classes from count thresholds in one helper (amber 1-5, red 5+).
- Pulse only when count > 0; gate with `motion-safe` and disable with `motion-reduce`.
- FAB: fixed bottom-right mobile, hide on downward scroll and reveal on upward scroll with threshold/debounce.
- Keep FAB purely navigational (open Quick Capture) and never block core form buttons.

Confidence: MEDIUM-HIGH (logic is standard; exact hide/show threshold remains implementation discretion)

### 5) Orientation and mode distinction (mobile + accessibility)
Support portrait-first workflows without restricting orientation.

Prescriptive pattern:
- Do not enforce landscape-only interactions.
- Keep explicit visual labels for mode identity (capture vs review) using text + icon + layout, not color alone.

Why:
- Aligns with WCAG orientation guidance and locked MOB requirements.

Confidence: HIGH

## Don't Hand-Roll

- Dialog focus trapping / escape handling
  - Don’t build custom modal focus management.
  - Use existing Radix Dialog wrappers (`Dialog`, `DialogContent`, `DialogTitle`).
  - Reason: Radix already implements keyboard interactions and WAI-ARIA dialog behavior.

- Accordion keyboard semantics
  - Don’t build custom collapse headers/divs.
  - Use existing Radix Accordion wrapper.
  - Reason: built-in keyboard navigation and state data attributes for open/closed states.

- Server state coherence for pending counts
  - Don’t hand-roll ad hoc polling loops in multiple components.
  - Use one shared fetch/hook path; if Query is used, use `invalidateQueries`/`refetchInterval` patterns.
  - Reason: avoids duplicate timers, stale counts, and race conditions.

- Complex animation orchestration
  - Don’t hand-roll JS-heavy animation controllers for this phase.
  - Use CSS/Tailwind transitions plus Radix state attributes.
  - Reason: phase scope is polish, not animation framework work.

- Touch target geometry math
  - Don’t create custom pointer-hitbox math utilities.
  - Use explicit min size utilities and spacing in layout (`min-h`, `min-w`, padding).
  - Reason: simpler to verify and already meets locked targets.

## Common Pitfalls

### Sticky pane does not stick
What goes wrong:
- Sticky appears broken or jumps.

Why it happens:
- Missing top inset, or parent/ancestor overflow creates unexpected scroll ancestor.

Avoidance:
- Ensure sticky element has explicit `top-*`.
- Verify ancestor overflow chain; test in desktop viewport and with long forms.

Confidence: HIGH

### Accordion progress and form values drift
What goes wrong:
- `X/Y rated` differs from submitted values.

Why it happens:
- Local duplicated state diverges from `react-hook-form` values.

Avoidance:
- Derive progress directly from form `watch` data.
- Keep one source of truth (form state).

Confidence: HIGH

### Motion causes accessibility regressions
What goes wrong:
- Pulse/transition animations distract or trigger vestibular discomfort.

Why it happens:
- Animations applied unconditionally.

Avoidance:
- Apply motion only behind `motion-safe:*` and define `motion-reduce:*` fallbacks.

Confidence: HIGH

### Real-time badge updates become inconsistent
What goes wrong:
- Badge count lags, over-updates, or conflicts with list state.

Why it happens:
- Multiple fetch loops / no centralized invalidation.

Avoidance:
- Keep one polling/invalidation owner for pending count.
- Reuse existing pending-inspections data flow patterns.

Confidence: MEDIUM-HIGH

### Touch target passes visually but fails usability
What goes wrong:
- Buttons look large but interactive area is small/overlapped.

Why it happens:
- Icon-only hit area, tight adjacent targets.

Avoidance:
- Enforce real interactive dimensions (`min-h-[44px]`, `min-w-[44px]`; capture `>=64px`).
- Validate spacing in dense rows.

Confidence: HIGH

## Code Examples

### Sticky photo pane with bounded internal scroll
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
  <aside className="lg:sticky lg:top-4 lg:self-start">
    <Card className="max-h-[calc(100vh-6rem)] overflow-y-auto">
      <PhotoReviewPane photos={photos} />
    </Card>
  </aside>
  <section className="min-w-0">
    <InspectionCompletionForm ... />
  </section>
</div>
```
Source basis: MDN `position: sticky`, Tailwind sticky/top utilities.

### Accordion with all sections open by default + progress labels
```tsx
<Accordion type="multiple" defaultValue={["physical", "service", "compliance", "satisfaction"]}>
  {sections.map((section) => (
    <AccordionItem key={section.id} value={section.id}>
      <AccordionTrigger>
        {section.label} ({section.rated}/{section.total} rated)
      </AccordionTrigger>
      <AccordionContent>
        {section.fields.map(renderRatingField)}
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```
Source basis: Radix Accordion API (`type="multiple"`, `defaultValue`).

### Accessible zoom modal using existing dialog primitives
```tsx
<Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
  <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
    <DialogTitle className="sr-only">Inspection photo zoom</DialogTitle>
    <img src={selectedPhoto.fullUrl} alt={selectedPhoto.alt} className="max-h-[90vh] object-contain" />
  </DialogContent>
</Dialog>
```
Source basis: Radix Dialog accessibility model (focus trap, Esc close, title announcement).

### Reduced-motion-safe urgency pulse
```tsx
const badgeTone = pendingCount >= 5 ? "bg-red-500" : pendingCount > 0 ? "bg-amber-500" : "bg-muted";
const pulse = pendingCount > 0 ? "motion-safe:animate-pulse motion-reduce:animate-none" : "";

<span className={`${badgeTone} ${pulse} rounded-full px-2 py-1 text-xs font-semibold`}>
  {pendingCount}
</span>
```
Source basis: Tailwind `motion-safe` / `motion-reduce`, MDN `prefers-reduced-motion`.

### Single-owner pending refresh pattern
```tsx
const { data, refetch } = usePendingInspections();

useEffect(() => {
  const id = window.setInterval(() => {
    void refetch();
  }, 60_000);
  return () => window.clearInterval(id);
}, [refetch]);
```
Source basis: existing repo hook pattern; TanStack Query guidance for invalidation/refetch centralization.

---

Primary sources used:
- Local repo files: `package.json`, `src/pages/photo-first-review.tsx`, `src/pages/quick-capture.tsx`, `src/components/review/PhotoReviewPane.tsx`, `src/components/review/InspectionCompletionForm.tsx`, `src/components/ui/accordion.tsx`, `src/components/ui/FloatingActionButton.tsx`, `src/hooks/usePendingInspections.ts`.
- MDN CSS `position`: https://developer.mozilla.org/en-US/docs/Web/CSS/position
- MDN `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- WCAG 2.2 SC 2.5.8 understanding: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- WCAG 2.2 spec: https://www.w3.org/TR/WCAG22/
- Radix Dialog docs: https://radix-ui.com/primitives/docs/components/dialog
- Radix Accordion docs: https://radix-ui.com/primitives/docs/components/accordion
- Tailwind docs (`sticky`, `motion-safe` / `motion-reduce`): https://tailwindcss.com/docs
- TanStack Query v5 docs (invalidation/refetch): /tanstack/query/v5.60.5
