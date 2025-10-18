<!-- da6e7e56-3783-4e73-abc5-bf2522350c8a 0131d1a9-0222-4dae-8215-51480143cdca -->
# Custodial Command - Consolidated Implementation Plan

## Code Review Findings:

### ✅ Already Implemented Well:
- **Touch Targets:** Buttons already have `min-h-[48px]` (exceeds WCAG 2.2 requirement)
- **Focus Indicators:** `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` already in place
- **PDF Imports:** Correct imports already in place (`import jsPDF from 'jspdf'` and `import 'jspdf-autotable'`)
- **Theme Consistency:** Brown/rust theme well implemented with CSS variables

### ❌ Critical Issues Found:
1. **PDF Export Bug:** Using `doc.autoTable()` prototype method instead of `autoTable(doc, {})` function API
2. **Type Casting:** Using `(doc as any).autoTable()` bypassing TypeScript safety
3. **No Error Handling:** PDF generation has no try/catch or user feedback

## Implementation Plan (12 Days)

### Sprint 1: Critical Bug Fixes (Days 1-3)

#### Day 1: Fix PDF Export
**Files:** `src/utils/printReportGenerator.ts` (line 204, 251), `src/utils/reportHelpers.ts` (line 217), `src/components/reports/PDFReportBuilder.tsx`

**Current (Broken):**
```typescript
doc.autoTable({
  head: [['School', 'Date', 'Rating']],
  body: tableData,
})
```

**Fix To:**
```typescript
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

try {
  const doc = new jsPDF()
  autoTable(doc, {
    head: [['School', 'Date', 'Rating']],
    body: tableData,
  })
  doc.save('report.pdf')
  showSuccessToast('PDF generated successfully')
} catch (error) {
  console.error('PDF generation failed:', error)
  showErrorToast('Failed to generate PDF. Please try again.')
}
```

**Remove type declarations:** Delete lines 7-15 in `printReportGenerator.ts` (no longer needed with function API)

#### Day 2: Add Export Progress & Error Handling
**Files:** Export button components

- Add loading spinner during PDF generation
- Show progress toast: "Generating PDF..."
- Error recovery: retry button on failure
- Success confirmation with download link

#### Day 3: Test PDF Exports
- Test all export buttons: Overview, Issues (PDF), Charts
- Verify downloads work in Chrome, Firefox, Safari, Edge
- Test mobile Safari (iOS) with fallback
- Test large datasets (100+ inspections)

### Sprint 2: Accessibility Refinements (Days 4-6)

#### Day 4: Keyboard Navigation Audit
**Files:** Modal dialogs, form components

- Ensure tab order is logical
- Add focus trapping to modals (already has dialogs)
- Test keyboard-only navigation through entire app
- Add skip-to-content link

#### Day 5: Screen Reader Enhancement
**Files:** All icon-only buttons, data visualizations

- Add `aria-label` to icon buttons
- Add `aria-live="polite"` to notification areas
- Add `aria-describedby` to form fields with help text
- Test with VoiceOver (macOS) and NVDA (Windows)

#### Day 6: Color Contrast Audit
**Files:** `src/index.css` (CSS variables)

- Run axe DevTools on all pages
- Fix any contrast issues (target 4.5:1 for text, 3:1 for UI components)
- Test with color blindness simulators
- Verify focus indicators have 3:1 contrast

### Sprint 3: Performance Optimization (Days 7-9)

#### Day 7: Code Splitting
**Files:** `src/App.tsx`, route components

```typescript
import { lazy, Suspense } from 'react'

const InspectionDataPage = lazy(() => import('./pages/inspection-data'))
const WholeBuildingInspectionPage = lazy(() => import('./pages/whole-building-inspection'))
const AdminInspectionsPage = lazy(() => import('./pages/admin-inspections'))

// In render:
<Suspense fallback={<PageLoadingSkeleton />}>
  <InspectionDataPage />
</Suspense>
```

- Split heavy dependencies: charts (recharts), PDF (jspdf)
- Add loading skeletons for all lazy routes
- Test bundle size reduction (target 30%+ reduction)

#### Day 8: Image Optimization
**Files:** Image components, photo upload

- Add `loading="lazy"` to images
- Implement blur-up placeholder for uploads
- Compress photos client-side before upload (target < 500KB)
- Use WebP format where supported

#### Day 9: Loading States
**Files:** Data tables, forms

- Add skeleton screens for:
  - Inspection data tables
  - Report visualizations
  - Building inspection lists
- Add spinners for form submissions
- Implement optimistic UI for quick actions

### Sprint 4: Mobile & UX Polish (Days 10-12)

#### Day 10: Mobile Form Optimization
**Files:** `src/pages/custodial-inspection.tsx`, `src/pages/whole-building-inspection.tsx`

- Add collapsible sections for long forms
- Implement step-by-step progress indicator
- Increase spacing between form fields (16px minimum)
- Test thumb-friendly tap targets

#### Day 11: Auto-save Implementation
**Files:** All inspection forms

```typescript
// Auto-save draft every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    const formData = getValues()
    localStorage.setItem(`draft-${formId}`, JSON.stringify({
      data: formData,
      timestamp: Date.now()
    }))
    showInfoToast('Draft saved')
  }, 30000)
  return () => clearInterval(interval)
}, [])

// Restore draft on mount
useEffect(() => {
  const draft = localStorage.getItem(`draft-${formId}`)
  if (draft) {
    const { data, timestamp } = JSON.parse(draft)
    if (confirm('Restore unsaved draft?')) {
      reset(data)
    }
  }
}, [])
```

#### Day 12: PWA Enhancement
**Files:** Service worker, manifest

- Improve install prompt with benefits
- Add app shortcuts to manifest
- Test offline functionality
- Add update notification when new version available

## Validation Checklist:

### PDF Export:
- [ ] All exports use `autoTable(doc, {})` function API
- [ ] No `(doc as any)` type casting
- [ ] Try/catch error handling on all PDF generation
- [ ] Loading states during generation
- [ ] Success/error toasts
- [ ] Works in all browsers (Chrome, Firefox, Safari, Edge)
- [ ] iOS Safari fallback tested

### Accessibility:
- [ ] Lighthouse accessibility score > 95
- [ ] axe DevTools reports 0 violations
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all actions
- [ ] All colors meet 4.5:1 contrast ratio
- [ ] Focus indicators visible and meet 3:1 contrast

### Performance:
- [ ] Lighthouse performance score > 90
- [ ] Bundle size reduced by 30%+
- [ ] Code splitting implemented for routes
- [ ] Images lazy loaded
- [ ] Loading skeletons in place

### Mobile:
- [ ] All touch targets ≥ 48px (already done!)
- [ ] Forms work smoothly on mobile
- [ ] Auto-save prevents data loss
- [ ] PWA install prompt works

## Technical Notes:

### PDF Function API Pattern (per jsPDF AutoTable docs):
```typescript
// Recommended import pattern
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Correct usage
const doc = new jsPDF()
autoTable(doc, {
  head: [['Column 1', 'Column 2']],
  body: [['Row 1', 'Data 1']],
  // Options...
})

// Access last table: doc.lastAutoTable.finalY
```

### Error Boundaries (already exists in App.tsx):
The app already has an ErrorBoundary component - just need to wrap lazy-loaded routes.

### Touch Targets (already compliant):
Current button sizes:
- Default: `min-h-[48px]` ✅
- Small: `min-h-[44px]` ✅
- Large: `min-h-[56px]` ✅
- Icon: `min-h-[48px] min-w-[48px]` ✅

No changes needed for touch targets!

## Files to Modify (Priority Order):

1. **src/utils/printReportGenerator.ts** - Lines 204, 251 (PDF fix)
2. **src/utils/reportHelpers.ts** - Line 217 (PDF fix)
3. **src/components/reports/PDFReportBuilder.tsx** - All `autoTable` calls (PDF fix)
4. **src/App.tsx** - Add lazy loading for routes
5. **All form pages** - Add auto-save functionality
6. **Icon buttons** - Add aria-labels
7. **Data tables** - Add loading skeletons

## Success Metrics:

- **PDF Export Success Rate:** 100% (currently failing)
- **Lighthouse Scores:** All > 90
- **Bundle Size:** Reduce by 30%
- **User Feedback:** No PDF export errors reported
- **Accessibility:** WCAG 2.2 AA compliant

### To-dos

- [ ] Replace doc.autoTable() with autoTable(doc, {}) in all 4 files
- [ ] Add try/catch and user feedback to all PDF exports
- [ ] Test PDF exports in Chrome, Firefox, Safari, Edge (desktop + mobile)
- [ ] Test and fix keyboard navigation throughout entire app
- [ ] Add aria-labels to all icon buttons and data visualizations
- [ ] Run axe DevTools and fix any contrast issues
- [ ] Add lazy loading for route components with Suspense
- [ ] Create and add skeleton screens for data tables and reports
- [ ] Add auto-save with localStorage for all inspection forms
- [ ] Add lazy loading and compression for all images
- [ ] Improve install prompt and add app shortcuts
- [ ] Run full test suite: accessibility, performance, cross-browser