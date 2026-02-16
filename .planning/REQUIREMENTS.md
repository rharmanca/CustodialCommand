# Requirements: Custodial Command

**Defined:** 2026-02-16
**Core Value:** Custodial staff can efficiently capture facility issues while walking, then complete detailed assessments later with photo reference

## v1 Requirements (Completed)

See PROJECT.md Validated section for completed requirements from Phases 01-02.

## v2 Requirements (Phase 03: Workflow Improvements)

### Quick Capture

- [ ] **CAP-01**: User can initiate quick capture mode from mobile dashboard
- [ ] **CAP-02**: User can select location with minimal taps (dropdown or quick-select)
- [ ] **CAP-03**: User can capture multiple photos in rapid succession with camera remaining open
- [ ] **CAP-04**: User can optionally add quick text note (single field, max 200 chars)
- [ ] **CAP-05**: User can save quick capture with one tap
- [ ] **CAP-06**: Quick capture saves as "pending review" status
- [ ] **CAP-07**: User sees confirmation that capture was saved

### Photo-First Review

- [ ] **REV-01**: User can view all "pending review" inspections on desktop
- [ ] **REV-02**: User can open pending inspection with photos displayed prominently
- [ ] **REV-03**: User can reference photos while completing full inspection form
- [ ] **REV-04**: Photos remain visible while scrolling through form fields
- [ ] **REV-05**: User can complete inspection with full ratings and detailed notes
- [ ] **REV-06**: Completed inspection shows completion timestamp separate from capture timestamp
- [ ] **REV-07**: User can discard pending inspection if no longer relevant

### Performance

- [ ] **PERF-01**: Quick capture mode loads in <1 second on mobile 4G
- [ ] **PERF-02**: Photo capture keeps camera active between shots (no re-initialization)
- [ ] **PERF-03**: Photo thumbnails generate for quick browsing
- [ ] **PERF-04**: Pending review list loads in <2 seconds
- [ ] **PERF-05**: Photo-first review page loads photos progressively

### Mobile UX

- [ ] **MOB-01**: Large touch targets for field use (min 44px)
- [ ] **MOB-02**: Clear visual distinction between capture and review modes
- [ ] **MOB-03**: Works in portrait orientation (no forced landscape)
- [ ] **MOB-04**: Offline capability maintained for quick capture

## v3 Requirements (Deferred)

### Advanced Features

- **ADV-01**: AI photo analysis for automatic issue detection
- **ADV-02**: Voice-to-text notes during capture
- **ADV-03**: Photo tagging (e.g., "HVAC", "Plumbing", "Safety")
- **ADV-04**: Batch review mode for processing multiple inspections
- **ADV-05**: Time-based reminders for pending inspections

### Integrations

- **INT-01**: Email notifications to supervisors when inspections completed
- **INT-02**: Slack integration for urgent issues
- **INT-03**: Calendar integration for inspection scheduling

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time collaboration | Single inspector per school is current workflow |
| Native mobile apps | PWA covers needs; native apps are maintenance burden |
| Advanced analytics dashboard | Export features sufficient; defer until data volume increases |
| External work order system integration | Manual export acceptable at current scale |
| Video capture | Photos sufficient for documentation needs |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAP-01 | Phase 03 | Pending |
| CAP-02 | Phase 03 | Pending |
| CAP-03 | Phase 03 | Pending |
| CAP-04 | Phase 03 | Pending |
| CAP-05 | Phase 03 | Pending |
| CAP-06 | Phase 03 | Pending |
| CAP-07 | Phase 03 | Pending |
| REV-01 | Phase 03 | Pending |
| REV-02 | Phase 03 | Pending |
| REV-03 | Phase 03 | Pending |
| REV-04 | Phase 03 | Pending |
| REV-05 | Phase 03 | Pending |
| REV-06 | Phase 03 | Pending |
| REV-07 | Phase 03 | Pending |
| PERF-01 | Phase 03 | Pending |
| PERF-02 | Phase 03 | Pending |
| PERF-03 | Phase 03 | Pending |
| PERF-04 | Phase 03 | Pending |
| PERF-05 | Phase 03 | Pending |
| MOB-01 | Phase 03 | Pending |
| MOB-02 | Phase 03 | Pending |
| MOB-03 | Phase 03 | Pending |
| MOB-04 | Phase 03 | Pending |

**Coverage:**
- v2 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-16*
*Last updated: 2026-02-16 after Phase 02 completion*
