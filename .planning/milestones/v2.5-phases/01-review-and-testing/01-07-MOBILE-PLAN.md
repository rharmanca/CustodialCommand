---
phase: 01-review-and-testing
plan: 07
type: execute
wave: 3
depends_on: ["01-01", "01-02"]
files_modified: []
autonomous: true

must_haves:
  truths:
    - "PWA installs successfully on mobile devices"
    - "Offline functionality works as designed"
    - "Photo capture works on mobile cameras"
    - "Touch interactions are smooth and responsive"
    - "Responsive layout works at all mobile breakpoints"
  artifacts:
    - path: "Mobile test screenshots"
      provides: "Visual verification of mobile UI"
    - path: "PWA install test"
      provides: "Installation flow verification"
  key_links:
    - from: "Mobile browser"
      to: "PWA features"
      via: "Service worker and manifest"
---

<objective>
Test mobile functionality including PWA installation, offline capabilities, and photo capture.

Purpose: Verify mobile user experience and PWA features
Output: Mobile testing report
</objective>

<execution_context>
@C:/Users/veloc/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
Mobile features to test:
- PWA install prompt and installation
- Offline mode functionality
- Mobile camera/photo capture
- Touch gestures and interactions
- Responsive breakpoints (375px, 768px)
- Mobile navigation (bottom nav if present)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Mobile Browser Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test on mobile device or emulator:
    1. Open Chrome DevTools Device Toolbar
    2. Select iPhone 12 Pro (390x844)
    3. Navigate to https://cacustodialcommand.up.railway.app/
    4. Verify page loads correctly
    5. Check layout doesn't overflow horizontally
    6. Test vertical scrolling smoothness
    7. Verify text is readable (no zoom needed)
    8. Test button tap targets (minimum 44px)
    9. Check form input usability
    10. Test on Android device size (360x640)
    
    Document: Layout issues, touch target sizes
  </action>
  <verify>App works correctly on mobile viewport</verify>
  <done>Mobile browser testing completed</done>
</task>

<task type="auto">
  <name>Task 2: PWA Installation Test</name>
  <files>N/A (browser testing)</files>
  <action>
    Test PWA installation flow:
    1. Open app in Chrome mobile (or DevTools mobile emulation)
    2. Look for "Add to Home Screen" prompt
    3. Check manifest.json is valid:
       - name, short_name present
       - icons in multiple sizes
       - display: standalone or fullscreen
       - start_url correct
    4. Test manual install (Chrome menu → Install app)
    5. Verify app installs without errors
    6. Launch from home screen
    7. Verify opens in standalone mode (no browser chrome)
    8. Check splash screen displays
    
    Document: Install flow, any issues encountered
  </action>
  <verify>PWA installs and launches correctly</verify>
  <done>PWA installation tested</done>
</task>

<task type="auto">
  <name>Task 3: Offline Functionality Test</name>
  <files>N/A (browser testing)</files>
  <action>
    Test offline capabilities:
    1. Install PWA
    2. Load app while online
    3. Turn on airplane mode / disconnect network
    4. Verify app still loads (from cache)
    5. Check if offline indicator shows
    6. Try to submit form while offline
    7. Verify form data is queued for sync
    8. Reconnect network
    9. Verify queued data syncs automatically
    10. Check offline status indicator updates
    
    Test service worker:
    - Check DevTools → Application → Service Workers
    - Verify SW is active and controlling page
    - Check cache storage for assets
    
    Document: Offline behavior, sync functionality
  </action>
  <verify>Offline mode works and syncs when reconnected</verify>
  <done>Offline functionality tested</done>
</task>

<task type="auto">
  <name>Task 4: Mobile Photo Capture Test</name>
  <files>N/A (browser testing)</files>
  <action>
    Test photo capture on mobile:
    1. Navigate to Custodial Inspection form
    2. Tap photo upload button
    3. Verify camera option appears (on real device)
    4. Test selecting from gallery
    5. Verify image preview displays
    6. Submit form with photo attached
    7. Verify photo uploads successfully
    8. Check uploaded photo displays in detail view
    9. Test multiple photo upload
    
    On emulator, test:
    - File selection from simulated gallery
    - Image preview functionality
    - Upload progress indication
    
    Document: Photo capture flow, upload success
  </action>
  <verify>Photo capture and upload works on mobile</verify>
  <done>Mobile photo capture tested</done>
</task>

<task type="auto">
  <name>Task 5: Mobile Navigation and UX</name>
  <files>N/A (browser testing)</files>
  <action>
    Test mobile-specific UX:
    1. Check for mobile bottom navigation (if present)
    2. Test navigation between pages
    3. Verify back button behavior (Android)
    4. Test swipe gestures (if applicable)
    5. Check pull-to-refresh (if enabled)
    6. Test form auto-scroll on focus
    7. Verify keyboard doesn't cover inputs
    8. Check date/time picker usability
    9. Test dropdown/select usability on mobile
    
    Document: Navigation patterns, any UX issues
  </action>
  <verify>Mobile navigation and UX work smoothly</verify>
  <done>Mobile UX testing completed</done>
</task>

</tasks>

<verification>
- [ ] Mobile browser rendering correct
- [ ] PWA installs successfully
- [ ] Offline mode functional
- [ ] Photo capture works
- [ ] Mobile navigation smooth
- [ ] Touch targets adequate
</verification>

<success_criteria>
Mobile experience is fully functional with:
- Successful PWA installation
- Working offline capabilities
- Functional photo capture
- Smooth mobile UX
- Proper responsive design
</success_criteria>

<output>
After completion, create `.planning/phases/01-review-and-testing/01-07-MOBILE-SUMMARY.md`
</output>
