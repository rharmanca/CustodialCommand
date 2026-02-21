# Phase 04: UI/UX Polish - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement design improvements to Phase 03 workflow features (Quick Capture and Photo-First Review) without changing the overall theme. Focus on layout, positioning, and UX refinements.

Scope includes:
- Sticky photo sidebar in Photo-First Review
- Grouped rating form sections
- Simplified Quick Capture empty state
- Enhanced pending badge with urgency colors
- Dashboard FAB for Quick Capture
- Improved touch targets for mobile

Out of scope: New features, theme changes, color palette modifications.

</domain>

<decisions>
## Implementation Decisions

### Layout - Photo Sidebar
- Make photo sidebar sticky so it stays visible while scrolling through the rating form
- Add zoom functionality on photo click
- Show thumbnail grid if multiple photos (currently single photo only)

### Layout - Rating Form
- Group 11 ratings into collapsible sections:
  - Physical (Floors, Surfaces, Ceiling, Restrooms) - 4 items
  - Service (Trash, Project Cleaning, Activity Support) - 3 items  
  - Compliance (Safety, Equipment, Monitoring) - 3 items
  - Satisfaction (Customer Satisfaction) - 1 item
- Show section progress (e.g., "3/4 rated")
- All sections expanded by default

### Layout - Quick Capture
- Start with camera feed and capture button only
- Collapse notes into expandable section below
- Show captured photos in horizontal strip
- Keep existing amber/warm theme

### Layout - Dashboard
- Add Floating Action Button (FAB) in bottom-right corner
- Use amber color to match Quick Capture theme
- Size: 56px diameter
- Icon: Camera
- Hide on scroll down, show on scroll up

### Visual - Pending Badge
- Show pending count on Review navigation item
- Add subtle pulse animation when count > 0
- Color coding: amber (1-5), red (5+)
- Update in real-time

### Touch Targets
- Primary capture button: 64px minimum (currently may be smaller)
- Position in easy thumb reach (bottom center on mobile)
- Secondary buttons: 44px minimum (existing)

### Claude's Discretion
- Exact sticky positioning implementation
- Animation timing and easing functions
- Zoom modal design
- Accordion expand/collapse animation style

</decisions>

<specifics>
## Specific Ideas

- Sticky sidebar: "Like how Slack keeps the channel list visible while scrolling messages"
- FAB: "Material Design floating action button pattern - contextual, always accessible"
- Grouped form: "Like how long forms in Typeform break into sections"

</specifics>

<deferred>
## Deferred Ideas

- Voice-to-text for notes in review (requires new API integration)
- Haptic feedback on capture (requires PWA capabilities)
- Photo editing/cropping in sidebar (complex feature)

</deferred>

---

*Phase: 04-ui-polish*
*Context gathered: 2026-02-18*
