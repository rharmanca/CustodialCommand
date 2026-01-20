# Changelog

All notable changes to Custodial Command will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - January 20, 2026

### Fixed

#### Critical Bugs - All Resolved

1. **Data Export Functionality (Bug #1)** - ✅ FIXED
   - Fixed PDFExportWizard to use standard Radix UI pattern
   - Changed from custom `div` wrapper with manual `onClick` to `<DialogTrigger asChild>`
   - File: `src/components/reports/PDFExportWizard.tsx`
   - **Note**: ExportDialog was already using correct pattern

2. **Admin Authentication (Bug #2)** - ✅ FIXED
   - Added `/api/admin/login` exemption from CSRF middleware
   - Excluded `/api/admin/` routes from Service Worker offline handling
   - File: `server/csrf.ts` (line 54)
   - File: `public/sw.js` (line 61)
   - **Root Cause**: CSRF middleware blocked login (403), then Service Worker treated it as network failure
   - **Impact**: Admin panel will be accessible after deployment

### Added

#### Test Infrastructure Improvements
- **data-testid attributes** for robust test selectors:
  - `school-select` on school dropdown (`custodial-inspection.tsx`)
  - `custodial-notes-description` on notes textarea (`custodial-notes.tsx`)
  - `multi-progress` on progress indicator (`whole-building-inspection.tsx`)
- **data-loaded markers** for React hydration synchronization:
  - Single Room Inspection page (`custodial-inspection.tsx`)
  - Custodial Notes page (`custodial-notes.tsx`)
  - Whole Building Inspection page (`whole-building-inspection.tsx`)
- **React hydration utilities** in `ui-tests/ui.spec.ts`:
  - `waitForReactReady(page)` - Waits for DOM interactive state
  - `navigateAndWait(page, path)` - Combined navigation + hydration wait
- **Extended Select component** (`src/components/ui/select.tsx`):
  - Added optional `data-testid` prop for testability

### Changed

#### Test Selectors (`tests/exhaustive-production-test.cjs`)
- Line 484: Changed from `button[role="combobox"]` to `[data-testid="school-select"]`
- Line 538: Changed from `textarea` to `[data-testid="custodial-notes-description"]`
- Line 564: Changed from text content check to `[data-testid="multi-progress"]`

### Known Issues

#### Test Infrastructure - Rate Limiting
- Automated tests blocked by HTTP 429 (Too Many Requests) on production
- Tests always hit production - no local testing configuration
- Need: Local testing support or test bypass token
- Documented in: `tests/run-all-tests.cjs` (lines 8-16)

---

## [1.0.0] - 2025

### Added
- Progressive Web App (PWA) functionality
- Single Room Inspection workflow
- Whole Building Inspection workflow
- Custodial Notes for quick concern reporting
- Monthly Feedback PDF upload and review
- Scores Dashboard and analytics
- Rating Criteria reference page
- Admin Panel for administrative oversight
- Mobile-optimized touch-friendly interface
- Offline data synchronization
- Real-time updates

### Security
- Rate limiting (configurable via `RATE_LIMIT_MAX_REQUESTS`)
- Input sanitization (XSS protection)
- CORS configuration
- Security headers (Helmet.js)
- Request validation
- CSRF protection (with admin login exemption added in unreleased)

### Testing
- Integration test suite
- Playwright UI tests
- Accessibility audits
- Performance monitoring
- Health check endpoint: `/health`

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2025 | Initial release with core custodial inspection features |
| Unreleased | 2026-01-20 | Admin auth fix, test infrastructure improvements |
