# Mobile Testing Guide - CA Custodial Command

## Overview

This guide provides comprehensive testing procedures for validating the mobile user experience of the CA Custodial Command application after React Hook Form + Zod integration and mobile UX enhancements.

---

## Test Environment Setup

### Required Devices/Tools
1. **Physical Devices** (Recommended):
   - iOS device (iPhone 12 or newer)
   - Android device (Android 10+)

2. **Browser DevTools** (Alternative):
   - Chrome DevTools Device Mode
   - Safari Responsive Design Mode
   - Firefox Responsive Design Mode

3. **Testing Browsers**:
   - iOS: Safari Mobile
   - Android: Chrome Mobile, Samsung Internet
   - Desktop: Chrome, Safari, Firefox (responsive mode)

---

## Pre-Deployment Checklist

### Build & Deploy
```bash
# 1. Build the application
npm run build

# 2. Test build output
npm run preview

# 3. Deploy to Railway (if applicable)
# Ensure environment variables are set:
# - DATABASE_URL (NeonDB connection string)
# - ADMIN_PASSWORD
```

---

## Phase 1: Touch Target Testing

### Objective
Verify all interactive elements meet WCAG AAA standards (48x48px minimum)

### Test Steps

#### 1.1 Star Ratings (Custodial Inspection Form)
**Path**: Home → Single Area Inspection

**Mobile View Tests**:
- [ ] Open form on mobile device (or responsive mode at 375px width)
- [ ] Verify each star button is easily tappable (no accidental taps)
- [ ] Check spacing between stars (should not overlap)
- [ ] Test "Not Rated" button is large enough to tap
- [ ] Verify all 11 rating fields have proper touch targets

**Expected Results**:
- Star buttons: 48x48px minimum (padding: 12px, icon: 28x28px)
- "Not Rated" button: min-height 48px
- No accidental taps when selecting adjacent stars
- Clear visual feedback on tap

#### 1.2 Form Buttons
**Forms to Test**:
- Custodial Notes Form
- Custodial Inspection Form

**Tests**:
- [ ] Submit button is at least 56px tall (size="lg")
- [ ] Back button is at least 48px tall
- [ ] "Capture Photo" button is at least 48px tall
- [ ] All buttons have adequate spacing (no accidental taps)

---

## Phase 2: Form Validation Testing

### Objective
Verify Zod validation works correctly on mobile with proper error messages

### Test Steps

#### 2.1 Custodial Notes Form
**Path**: Home → Report A Custodial Concern

| Test Case | Input | Expected Result |
|-----------|-------|----------------|
| Empty inspector name | Leave blank, submit | Error: "Inspector name is required" |
| Empty school | Leave blank, submit | Error: "School is required" |
| Invalid date | Enter "abc", submit | Error: "Invalid date format" |
| Short notes | Enter < 10 chars | Error: "Please provide a detailed description (minimum 10 characters)" |
| Long notes | Enter > 5000 chars | Error: "Notes too long" |
| Too many images | Upload > 5 images | Error: "Maximum 5 images allowed" |
| Valid submission | Fill all fields correctly | Success message, form clears |

**Mobile-Specific Tests**:
- [ ] Error messages appear clearly on small screens
- [ ] Error messages don't overlap with inputs
- [ ] Form doesn't jump/scroll when errors appear
- [ ] Success toast is visible and readable

#### 2.2 Custodial Inspection Form
**Path**: Home → Single Area Inspection

| Test Case | Input | Expected Result |
|-----------|-------|----------------|
| Empty inspector name | Leave blank, submit | Error: "Inspector name is required" |
| Invalid rating | (Not possible - uses controlled inputs) | N/A |
| Rating > 5 | (Not possible - max is 5) | N/A |
| All "Not Rated" | Set all to 0, submit | Should accept (valid) |
| Valid with notes | Fill all fields + notes | Success message |
| Valid without notes | Fill required only | Success message |

---

## Phase 3: Image Upload & Compression Testing

### Objective
Verify image compression works correctly and provides user feedback

### Test Steps

#### 3.1 Camera Capture (Mobile Only)
**Mobile Device Required**

- [ ] Tap "📷 Capture Photo" button
- [ ] Camera interface opens correctly
- [ ] Take photo
- [ ] Photo appears in preview grid
- [ ] Toast notification shows: "📷 Photo Captured Successfully!"
- [ ] Check console for compression log (if large image)

#### 3.2 File Upload
**All Devices**

| Test Case | Action | Expected Result |
|-----------|--------|----------------|
| Upload small image (< 500KB) | Upload | Accepted without compression |
| Upload large image (> 500KB) | Upload | Compressed to ~500KB, shows compression stats |
| Upload 5 images | Upload multiple | All accepted, count shown |
| Upload 6th image | Upload after 5 | Error: "Maximum 5 images allowed" |
| Upload non-image | Upload .txt file | Error: "Only image files are allowed" |
| Remove image | Tap X button | Image removed from preview |

**Compression Verification**:
- [ ] Check browser console for compression logs
- [ ] Example log: `Compressed photo.jpg: 2.5 MB → 450 KB`
- [ ] Toast shows compression stats: "Saved 2.1 MB (84% compression)"

#### 3.3 Image Preview
- [ ] Preview grid displays correctly (2-4 columns based on screen size)
- [ ] Images maintain aspect ratio
- [ ] Remove button (X) appears on hover/tap
- [ ] Preview is responsive on different screen sizes

---

## Phase 4: Mobile Keyboard Testing

### Objective
Verify mobile keyboards display appropriately for input fields

| Field | Input Type | Expected Keyboard |
|-------|-----------|------------------|
| Inspector Name | text | Standard keyboard with autocorrect |
| School | text | Standard keyboard with autocorrect |
| Room Number | text | Alphanumeric keyboard |
| Date | date | Native date picker |
| Notes | textarea | Standard keyboard with autocorrect |

**Note**: inputMode attributes were not applicable for this form (no purely numeric fields)

---

## Phase 5: Performance Testing

### Objective
Verify performance on mobile devices

### Test Metrics

#### 5.1 Page Load Times
- [ ] Home page loads in < 2 seconds on 3G
- [ ] Forms load instantly (< 500ms)
- [ ] Star rating interactions are instant (< 100ms)

#### 5.2 Star Rating Performance
**With React.memo Optimization**:
- [ ] No lag when tapping stars rapidly
- [ ] Form doesn't re-render unnecessarily
- [ ] All 11 rating fields respond smoothly

**Test**:
1. Open Custodial Inspection form
2. Rapidly tap different stars across all fields
3. Verify no lag or stuttering

#### 5.3 Image Upload Performance
- [ ] Small images (< 500KB) upload instantly
- [ ] Large images (2-5 MB) compress in < 2 seconds
- [ ] Multiple images (5 total) compress in < 5 seconds
- [ ] UI remains responsive during compression

---

## Phase 6: Cross-Browser Testing

### Test Matrix

| Browser | Platform | Version | Status |
|---------|----------|---------|--------|
| Safari | iOS 15+ | Latest | ☐ Tested |
| Chrome | Android 10+ | Latest | ☐ Tested |
| Samsung Internet | Android | Latest | ☐ Tested |
| Firefox | Android | Latest | ☐ Tested |

**Critical Tests for Each Browser**:
1. Form submission works
2. Image upload/compression works
3. Star ratings work
4. Toast notifications appear
5. Error validation displays correctly

---

## Phase 7: Accessibility Testing

### Objective
Verify WCAG AAA compliance on mobile

### Test Checklist

#### 7.1 Touch Targets
- [ ] All buttons meet 48x48px minimum
- [ ] Star ratings meet 48x48px minimum
- [ ] Adequate spacing prevents accidental taps

#### 7.2 Visual Feedback
- [ ] Selected stars show clear visual state
- [ ] Buttons show active/pressed states
- [ ] Form focus indicators are visible

#### 7.3 Screen Reader Testing
**iOS VoiceOver**:
- [ ] Form labels read correctly
- [ ] Star ratings announce value
- [ ] Error messages are announced
- [ ] Success messages are announced

**Android TalkBack**:
- [ ] Form labels read correctly
- [ ] Star ratings announce value
- [ ] Error messages are announced
- [ ] Success messages are announced

---

## Phase 8: Network Testing

### Objective
Verify form behavior on slow/unstable connections

### Test Scenarios

#### 8.1 Slow 3G
**Chrome DevTools**: Set network to "Slow 3G"

- [ ] Form remains usable
- [ ] Loading overlay appears during submission
- [ ] Timeout handling (if applicable)
- [ ] Error messages for failed submissions

#### 8.2 Offline Mode
**Chrome DevTools**: Set network to "Offline"

- [ ] Appropriate error message when submitting
- [ ] Form data preserved (not lost on error)
- [ ] User can retry after connection restored

#### 8.3 Large Image Upload on Slow Connection
- [ ] Compression reduces upload time significantly
- [ ] Progress feedback (loading overlay shown)
- [ ] Upload completes successfully

---

## Phase 9: Edge Cases

### Test Scenarios

#### 9.1 Form State Management
- [ ] Back button preserves form data (if applicable)
- [ ] Refresh clears form (expected behavior)
- [ ] Multiple rapid submits prevented (disabled state)

#### 9.2 Image Upload Edge Cases
- [ ] Upload same image twice (should work)
- [ ] Upload, remove, upload again (should work)
- [ ] Upload during form submission (should queue or prevent)

#### 9.3 Validation Edge Cases
- [ ] Submit empty form (all required field errors shown)
- [ ] Fix one error, submit (remaining errors shown)
- [ ] Valid submission clears all errors

---

## Phase 10: User Acceptance Testing (UAT)

### Real User Testing Checklist

**Recruit 3-5 custodial staff members**

| Task | Success Criteria | Notes |
|------|-----------------|-------|
| Submit custodial note | Complete in < 2 minutes | ☐ Passed |
| Upload 3 photos | Photos appear in preview | ☐ Passed |
| Complete inspection | All fields rated | ☐ Passed |
| Find back button | Return to home | ☐ Passed |
| Read error message | Understand what to fix | ☐ Passed |

**Feedback Questions**:
1. Were buttons easy to tap?
2. Were error messages clear?
3. Was photo upload intuitive?
4. Did star ratings feel responsive?
5. Any confusion or frustration points?

---

## Known Issues & Database Schema Mismatches

### Critical Issue: inspectorName Not Saved ⚠️

**Problem**: The `inspectorName` field is collected in the Custodial Notes form but NOT saved to the database.

**Impact**: User-submitted inspector names are being discarded.

**Files Affected**:
- `/shared/schema.ts` - Database schema missing `inspector_name` column
- `/server/routes.ts:197` - Backend doesn't extract `inspectorName` from request

**Status**: Documented in implementation log, requires database migration to fix

**Workaround for Testing**: Inspect notes form can be tested, but inspector name data will not persist

---

## Testing Tools

### Recommended Tools

1. **BrowserStack** (Cross-browser testing)
   - Test on real devices
   - iOS and Android support

2. **Chrome DevTools**
   - Device mode for responsive testing
   - Network throttling
   - Performance profiling

3. **Lighthouse** (Performance/Accessibility)
   ```bash
   npm install -g lighthouse
   lighthouse https://your-deployed-app.com --view
   ```

4. **axe DevTools** (Accessibility)
   - Browser extension for a11y testing

---

## Reporting Issues

### Issue Template

**Title**: [Component] Brief description

**Environment**:
- Device: iPhone 13 / Samsung Galaxy S21
- OS: iOS 16 / Android 12
- Browser: Safari / Chrome
- Screen Size: 375x812

**Steps to Reproduce**:
1. Navigate to...
2. Tap on...
3. Observe...

**Expected**: [What should happen]

**Actual**: [What actually happened]

**Screenshots**: [Attach if applicable]

**Severity**: Critical / High / Medium / Low

---

## Success Criteria

### Deployment Readiness Checklist

**Phase 4 Enhancements** (Completed):
- [x] Touch targets meet 48x48px minimum
- [x] Star ratings optimized with React.memo
- [x] Image compression implemented (500KB target)
- [x] Build passes with no TypeScript errors

**Phase 5 Testing** (In Progress):
- [x] Zod validation tested (all 10 tests passed)
- [x] Image compression verified (custom Canvas implementation)
- [ ] Mobile UAT testing complete
- [ ] Cross-browser testing complete
- [ ] Performance benchmarks met

**Database Schema** (Pending):
- [ ] `inspectorName` column added to database
- [ ] Backend route updated to capture `inspectorName`
- [ ] Schema validation added to backend

---

## Additional Resources

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Mobile Touch Target Sizes](https://web.dev/accessible-tap-targets/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Validation Guide](https://zod.dev/)

---

**Last Updated**: January 11, 2025
**Version**: 1.0
**Status**: Ready for Mobile UAT
