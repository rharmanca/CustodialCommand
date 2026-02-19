# Phase 07: UI Polish Gap Closure - Research

**Researched:** 2026-02-19
**Domain:** React UI/UX improvements for existing components
**Confidence:** HIGH

## User Constraints

### From Phase 04 Verification (Gap Sources)

**Gap 1: Grouped Rating Sections**
- File: `src/components/review/InspectionCompletionForm.tsx:240`
- Current: Flat list of 11 rating fields
- Required: Group into Physical/Service/Compliance/Satisfaction sections
- Required: Per-section progress (e.g., "3/4 rated")

**Gap 2: Camera-First Quick Capture**
- File: `src/pages/quick-capture.tsx:391`
- Current: Camera after metadata fields
- Required: Camera first in visual hierarchy
- Required: Collapsible notes (default collapsed)

**Gap 3: Touch Target Constraints**
- File: `src/pages/quick-capture.tsx:356`
- Current: `min-h-[40px]` for location presets
- Required: `min-h-[44px]` minimum for all secondary controls

## Summary

Phase 07 closes the remaining Phase 04 UX gaps identified in verification:

1. **Grouped Rating Form**: Reorganize flat 11-field list into 4 collapsible accordion sections with progress tracking
2. **Camera-First Flow**: Reorder Quick Capture to show camera immediately, with notes section default-collapsed
3. **Touch Target Compliance**: Update 40px controls to 44px minimum per MOB-01 requirement

**Technical Approach:**
- Use Radix UI Accordion for grouped sections
- Use React state for camera/notes visibility toggle
- Update Tailwind classes for touch targets
- Maintain existing form submission logic

## Standard Stack

### Core
| Library | Use | Why |
|---------|-----|-----|
| Radix UI Accordion | Section grouping | Already in project, accessible |
| React useState | Collapse toggle | Standard React pattern |
| Tailwind CSS | Touch target sizing | Already used throughout |
| Lucide React | Section icons | Already in project |

### No New Dependencies Required

## Architecture Patterns

### Pattern 1: Accordion Grouping for Ratings
```typescript
// Group 11 ratings into 4 sections
const RATING_GROUPS = [
  { id: 'physical', label: 'Physical Condition', fields: ['floors', 'walls', 'windows'], icon: Building2 },
  { id: 'service', label: 'Service Areas', fields: ['restrooms', 'breakrooms'], icon: Coffee },
  { id: 'compliance', label: 'Compliance', fields: ['safety', 'hazmat', 'signage'], icon: Shield },
  { id: 'satisfaction', label: 'Satisfaction', fields: ['overall', 'recommendation'], icon: Star }
];
```

### Pattern 2: Progress Tracking
```typescript
// Calculate progress per section
const getSectionProgress = (section: RatingGroup, values: FormValues) => {
  const rated = section.fields.filter(f => values[f] !== undefined).length;
  return { rated, total: section.fields.length };
};
```

### Pattern 3: Camera-First Layout
```tsx
// Reorder: Camera first, metadata optional, notes collapsed
<div className="camera-first-layout">
  <CameraCapture /> {/* Primary focus */}
  <CollapsibleMetadata /> {/* Secondary */}
  <CollapsibleNotes /> {/* Tertiary, default collapsed */}
</div>
```

### Anti-Patterns to Avoid
- Don't use CSS `order` property (accessibility issue)
- Don't collapse sections that have validation errors
- Don't hide required fields in collapsed sections
- Don't reduce touch target size for aesthetic reasons

## Recommended Plan Decomposition

### Wave 1 - Touch Target Fix (Quick Win)
- Update quick-capture.tsx location presets from 40px to 44px
- Verify all secondary controls meet minimum

### Wave 2 - Grouped Rating Form
- Refactor InspectionCompletionForm.tsx to use accordion sections
- Add progress tracking per section
- Maintain existing validation logic

### Wave 3 - Camera-First Flow
- Reorder quick-capture.tsx layout
- Add collapsible notes toggle
- Update QuickNoteInput component if needed

## Dependency and Wave Guidance

| Wave | Depends On | Output |
|------|-----------|--------|
| 1 | None | MOB-01 compliance (touch targets) |
| 2 | None | REV-04/REV-05 improvements (grouped ratings) |
| 3 | None | CAP-02 improvements (camera-first flow) |

**Note:** These are independent and can be parallelized, but sequential execution reduces cognitive load.

## Risks

- **Medium**: Camera-first reorder may confuse existing users familiar with current flow
- **Low**: Accordion may require additional ARIA attributes for full accessibility
- **Low**: Progress tracking adds minor computational overhead

## Sources

### Primary
- Phase 04 Verification Report (`.planning/phases/04-ui-polish/04-VERIFICATION.md`)
- `src/components/review/InspectionCompletionForm.tsx` (line 240)
- `src/pages/quick-capture.tsx` (lines 356, 391)
- `src/components/capture/CameraCapture.tsx` (line 155 - compliant example)

### Secondary
- Radix UI Accordion documentation
- Existing codebase patterns (Accordion usage in other components)
- Tailwind CSS touch target best practices

**Confidence breakdown:**
- Gap requirements: HIGH (from verification report)
- Technical implementation: HIGH (using existing patterns)
- Risk assessment: MEDIUM (user habit disruption)
