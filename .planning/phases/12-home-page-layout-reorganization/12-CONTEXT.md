# Phase 12: Home Page Layout Reorganization - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Refine the dashboard layout to prioritize field workflows (Quick Capture) and improve mobile usability. This phase reorganizes the existing dashboard to make Quick Capture the primary, most prominent call to action, ensures Review Inspections and pending badge are easily locatable, and optimizes the layout for mobile portrait orientation with one-handed use in mind.

</domain>

<decisions>
## Implementation Decisions

### Quick Capture Prominence
- **Position**: Thumb zone (bottom 1/3 of screen) for one-handed reachability
- **Content**: Icon + label + brief description (e.g., "Capture issues while walking")
- **Visual treatment**: Claude's discretion — choose optimal prominence approach

### Dashboard Layout Structure
- **Pattern**: Claude's discretion — choose optimal layout (card-based, single column, or hybrid)
- **Grouping**: By workflow stages (Capture, Review, Analyze)
- **Initial load**: Show all content (not collapsed)
- **Responsive**: Yes — different layouts for mobile vs desktop
- **Information density**: Medium (balanced — key stats + clear actions)
- **Collapsible sections**: Only secondary sections collapsible, primary actions always visible
- **Visual separation**: Background color blocks between sections

### Review & Pending Placement
- **Review section position**: Claude's discretion
- **Pending badge display**: Claude's discretion
- **Review section content**: Claude's discretion
- **Visual distinction**: Minimal — rely on content and position, not strong styling differences

### Mobile Thumb Zone
- **Existing FAB**: Claude's discretion on strategy (keep, replace, or both)
- **Secondary touch targets**: Claude's discretion on sizing
- **Bottom navigation**: Claude's discretion (standard nav, none, or minimal)
- **Safe area insets**: Claude's discretion on implementation approach

### Claude's Discretion
The following areas have been delegated to Claude's judgment during planning and implementation:
- Exact visual treatment for Quick Capture prominence
- Specific dashboard layout pattern (cards, list, grid, or hybrid)
- Review Inspections section placement and content level
- Pending badge display method
- FAB strategy (keep, replace, or dual approach)
- Touch target sizing for secondary actions
- Bottom navigation approach
- Safe area inset handling strategy
- Exact responsive breakpoints and layout changes
- Specific background colors for section separation

</decisions>

<specifics>
## Specific Ideas

- Quick Capture should feel like the primary purpose of the dashboard
- Mobile-first design: optimize for portrait orientation with one-handed use
- Field workflow priority: walking and capturing should be frictionless
- Review Inspections should be discoverable without hunting
- Consider custodial staff may be wearing gloves (touch target implications)
- Research shows 56px FAB is Material Design standard — already implemented in Phase 04-05

</specifics>

<deferred>
## Deferred Ideas

- Offline sync functionality — belongs in Phase 13 (Offline Sync Hardening)
- Inspection scheduling features — belongs in Phase 14 (Inspection Scheduling)
- Voice notes capability — belongs in Phase 15 (Voice Notes)
- Real-time collaboration — out of scope per PROJECT.md
- Native mobile app — out of scope per PROJECT.md

</deferred>

---

*Phase: 12-home-page-layout-reorganization*
*Context gathered: 2026-02-20*
