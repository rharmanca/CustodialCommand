# Custodial Command

## What This Is

A custodial inspection management application that helps school custodial staff document facility conditions through mobile-first inspections. Currently deployed at cacustodialcommand.up.railway.app with photo capture, inspection forms, and data management capabilities.

## Core Value

**Custodial staff can efficiently capture facility issues while walking, then complete detailed assessments later with photo reference.**

The app must work reliably in the field on mobile devices and support both rapid capture workflows and thorough review sessions.

## Requirements

### Validated

- ✓ Photo capture and upload — Phase 01
- ✓ Location-based inspection forms — Phase 01
- ✓ Custodial notes creation — Phase 01
- ✓ Inspection data viewing and filtering — Phase 01
- ✓ Monthly feedback PDF processing — Phase 01
- ✓ Admin authentication and protected routes — Phase 01
- ✓ PostgreSQL data persistence — Phase 01
- ✓ Health monitoring endpoints — Phase 02

### Active

#### Phase 03: Workflow Improvements

- [ ] **CAP-01**: User can initiate quick capture mode from mobile
- [ ] **CAP-02**: User can select location and rapid-fire capture photos with minimal UI friction
- [ ] **CAP-03**: User can optionally add quick text note during capture
- [ ] **CAP-04**: Quick captures are saved as "pending review" inspection records
- [ ] **CAP-05**: User can view quick capture photos on desktop with full inspection form
- [ ] **CAP-06**: User can complete detailed ratings and notes using photos as reference
- [ ] **CAP-07**: Completed inspections retain link to original quick capture session

#### Performance & Polish

- [ ] **PERF-01**: Inspection form loads in <2 seconds on mobile
- [ ] **PERF-02**: Photo capture flow has minimal taps/clicks
- [ ] **PERF-03**: Photo gallery loads with thumbnails for quick browsing

### Out of Scope

- **Real-time collaborative editing** — Single inspector workflow is sufficient; complexity outweighs value
- **Advanced analytics dashboard** — Current export features meet needs; defer until data volume justifies
- **Mobile app (native)** — PWA is working well; native apps are significant maintenance burden
- **Integration with external work order systems** — Manual export is acceptable for current scale

## Context

### Current State

**Technical Stack:** React + TypeScript frontend, Express + PostgreSQL backend, Railway hosting, PWA-enabled

**User Workflow:** 
- Mobile: Walk school, open inspection form, document issues with photos and ratings
- Desktop: Review inspection data, process monthly feedback PDFs, manage scores

**Key Pain Point:** Opening features and taking notes is slow on mobile. Current flow interrupts walking rhythm with form navigation.

**Proposed New Workflow:**
1. Quick Capture Mode (mobile): Location → Photos → Optional note → Save
2. Photo-First Review (desktop): Photos displayed alongside full inspection form for detailed assessment

### Performance Baseline

- App is deployed and functional
- Health monitoring shows 93% memory usage (monitoring)
- No critical bugs blocking usage
- Testing completed for core features

### Constraints

- **Budget**: Existing Railway hobby plan sufficient
- **Timeline**: No hard deadline; improvements as bandwidth allows
- **Devices**: Must work on phones used by custodial staff (various Android/iOS)
- **Offline**: Current offline support via service worker should be maintained

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Quick capture separate from full inspection | Walking flow vs review flow have different needs | — Pending |
| Photo-first review on desktop | Larger screens better for detailed assessment | — Pending |
| Optional quick notes | Some items need immediate context even if details come later | — Pending |

---
*Last updated: 2026-02-16 after Phase 02 completion, Phase 03 planning*
