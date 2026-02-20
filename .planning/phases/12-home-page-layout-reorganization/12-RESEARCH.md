# Phase 12 Research: Home Page Layout Reorganization

**Phase:** 12 - Home Page Layout Reorganization  
**Research Date:** 2026-02-20  
**Goal:** Refine dashboard layout to prioritize Quick Capture and improve mobile usability

---

## Research Findings

### 1. Thumb Zone Optimization

**Key Insight:** Natural thumb reach zones for mobile (portrait, right-handed):
- **Easy zone**: Bottom 1/3 of screen, center to right side
- **Reachable zone**: Middle 1/3, center to right
- **Stretch zone**: Top 1/3 or far corners

**Decision:** Position Quick Capture CTA in bottom 1/3 (locked per CONTEXT.md), specifically bottom-center for ambidextrous access.

### 2. Safe Area Inset Handling

**iOS Notch/Home Indicator:** Modern iPhones require `env(safe-area-inset-bottom)` to avoid UI being obscured by the home indicator.

**Tailwind Implementation:**
```css
/* Safe area padding for bottom elements */
pb-[env(safe-area-inset-bottom)]
/* Or using arbitrary values with fallback */
pb-[max(1rem,env(safe-area-inset-bottom))]
```

**Meta Tag Required:** `viewport-fit=cover` in HTML meta viewport tag (already present in Phase 04 implementation).

### 3. Dashboard Section Patterns

**Option A: Card-based Grid**
- Pros: Visual hierarchy, distinct containers
- Cons: More visual noise, harder to group by workflow

**Option B: Section-based with Background Colors**
- Pros: Clear workflow grouping, cleaner visual hierarchy, supports "background color blocks" requirement
- Cons: Less distinct boundaries between items

**Recommendation:** Section-based with background colors - matches user decision for "background color blocks between sections" and "group by workflow stages."

### 4. FAB Strategy

**Existing Implementation:** 56px FAB from Phase 04-05 with:
- Amber color theme (capture workflow)
- Camera icon
- Scroll-aware visibility (hides on scroll down, shows on scroll up)
- Safe area inset padding

**Options:**
1. **Replace FAB**: Remove FAB, rely only on bottom section CTA
2. **Keep FAB only**: No bottom section changes
3. **Dual approach**: Keep FAB (universal access) + add prominent bottom section CTA (thumb zone)

**Recommendation:** Dual approach - FAB provides access at any scroll position (Phase 04 requirement), bottom section CTA satisfies LAYOUT-01 prominence requirement.

### 5. Responsive Breakpoints

**Standard Tailwind Breakpoints:**
- `sm:` 640px+ (tablet/small desktop)
- `md:` 768px+ (desktop)
- `lg:` 1024px+ (large desktop)

**Layout Strategy:**
- **Mobile (< 640px)**: Single column, stacked sections, large touch targets (48px+)
- **Desktop (>= 640px)**: Two-column grid (Quick Capture + Review side-by-side), additional stats/analytics

### 6. Touch Target Sizing

**WCAG Guidelines:**
- Minimum: 44x44px for interactive elements
- Recommended for gloved hands: 48x48px

**Current State:** Primary capture button is 64px (Phase 04), secondary buttons vary.

**Recommendation:** Ensure all dashboard interactive elements are minimum 44px, with primary CTAs at 48-56px.

### 7. Visual Hierarchy

**Color Scheme:**
- Quick Capture (active/workflow): Amber/warm tones (#F59E0B, #FEF3C7)
- Review (analytical): Teal/cool tones (#14B8A6, #CCFBF1)
- Neutral/Section backgrounds: Slate/gray (#F1F5F9, #F8FAFC)

**Typography:**
- Section headers: text-xl font-semibold
- Card titles: text-lg font-medium
- Descriptions: text-sm text-muted-foreground

---

## Standard Stack

| Category | Selection | Rationale |
|----------|-----------|-----------|
| Layout | Tailwind CSS + CSS Grid/Flex | Already in project |
| Components | shadcn/ui Card, Button | Already in project |
| Responsive | Tailwind breakpoints (sm:, md:) | Standard approach |
| Safe Area | CSS env() variables | Native CSS, no library needed |
| Icons | Lucide React | Already in project |

---

## Architecture Patterns

### Dashboard Component Structure
```
DashboardPage
├── WorkflowSection (Capture)
│   ├── QuickCaptureCard (icon + label + description)
│   └── QuickActions (location presets, camera)
├── WorkflowSection (Review)
│   ├── ReviewHeader (with PendingBadge)
│   └── RecentInspectionsPreview
└── WorkflowSection (Analyze)
    └── StatsSummary
```

### Responsive Strategy
- Mobile: Single column, full-width cards, 48px+ touch targets
- Desktop: Two-column grid (Capture | Review), side-by-side layout

---

## Common Pitfalls

1. **Fixed positioning conflicts**: FAB and bottom section may overlap on small screens
   - Mitigation: FAB moves above bottom section on mobile

2. **Safe area not applied**: Content obscured by iPhone home indicator
   - Mitigation: Apply `pb-[env(safe-area-inset-bottom)]` to bottom elements

3. **Touch targets too small**: Gloved hands can't activate buttons
   - Mitigation: Minimum 44px, test with glove simulation

4. **Visual hierarchy unclear**: Quick Capture doesn't stand out
   - Mitigation: Larger size, contrasting background, prominent icon

5. **Responsive breakpoints wrong**: Mobile layout on tablet
   - Mitigation: Test at 640px breakpoint specifically

---

## Must-Haves for Planning

**Artifacts Required:**
1. Dashboard page with workflow sections
2. QuickCaptureCard component (thumb zone, icon+label+description)
3. ReviewSection component with PendingBadge
4. Safe area wrapper for mobile
5. Responsive breakpoint handling

**Key Links:**
- Dashboard page -> QuickCaptureCard (import + render)
- Dashboard page -> ReviewSection (import + render)
- ReviewSection -> PendingBadge (child component)
- Dashboard page -> existing usePendingInspections hook (data)

---

*Research complete. Ready for planning.*
