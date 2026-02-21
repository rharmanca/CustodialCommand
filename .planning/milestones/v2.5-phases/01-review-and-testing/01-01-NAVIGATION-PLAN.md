---
phase: 01-review-and-testing
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Home page loads successfully on deployed URL"
    - "All navigation links work and route to correct pages"
    - "PWA install prompt appears on supported browsers"
    - "Responsive design works on mobile and desktop viewports"
    - "Accessibility features are present and functional"
  artifacts:
    - path: "Navigation test results"
      provides: "Verification of all routes"
    - path: "Screenshot documentation"
      provides: "Visual evidence of each page"
  key_links:
    - from: "Home page"
      to: "All 8 other pages"
      via: "Navigation buttons"
---

<objective>
Test the home page and navigation system of the deployed Custodial Command application.

Purpose: Verify core navigation works and all pages are accessible
Output: Navigation test report with screenshots of each page
</objective>

<execution_context>
@C:/Users/veloc/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
Application URL: https://cacustodialcommand.up.railway.app/
Pages to test:
- Home (Custodial)
- Custodial Inspection
- Custodial Notes
- Whole Building Inspection
- Inspection Data
- Rating Criteria
- Monthly Feedback
- Scores Dashboard
- Admin Inspections
</context>

<tasks>

<task type="auto">
  <name>Task 1: Home Page Load Test</name>
  <files>N/A (browser testing)</files>
  <action>
    Navigate to https://cacustodialcommand.up.railway.app/ and verify:
    1. Page loads without errors (check console)
    2. Title shows "Custodial Command"
    3. App logo/branding is visible
    4. Navigation buttons are present
    5. PWA install section is visible
    6. No 404 or 500 errors
    
    Check browser DevTools Console for JavaScript errors.
    Check Network tab for failed requests.
    
    Document: Load time, any errors, screenshot of home page
  </action>
  <verify>Home page loads without errors</verify>
  <done>Home page successfully loaded and documented</done>
</task>

<task type="auto">
  <name>Task 2: Navigation Link Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test navigation to each page from home:
    1. Click "Custodial Notes" → verify Custodial Notes page loads
    2. Click "Custodial Inspection" → verify Single Area Inspection form loads
    3. Click "Whole Building Inspection" → verify Whole Building form loads
    4. Click "Scores Dashboard" → verify dashboard loads
    5. Click "Inspection Data" → verify data page loads
    6. Click "Monthly Feedback" → verify feedback page loads
    7. Click "Rating Criteria" → verify criteria reference loads
    8. Click "Admin" → verify admin login/page loads
    
    For each page verify:
    - Correct page title/heading
    - Page content loads (not blank)
    - No console errors
    - Back navigation works
    
    Document: Each page tested, any navigation failures
  </action>
  <verify>All 8 navigation links work correctly</verify>
  <done>All navigation routes tested and verified</done>
</task>

<task type="auto">
  <name>Task 3: PWA Install Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test Progressive Web App functionality:
    1. Check for PWA install prompt in Chrome/Edge
    2. Verify manifest.json is accessible (/manifest.json)
    3. Verify service worker is registered (DevTools → Application → Service Workers)
    4. Check manifest contains:
       - name: "Custodial Command"
       - icons for various sizes
       - display: standalone or fullscreen
       - start_url
    5. Test install button functionality if present
    
    Document: PWA status, install availability, manifest contents
  </action>
  <verify>PWA requirements validated</verify>
  <done>PWA functionality tested and documented</done>
</task>

<task type="auto">
  <name>Task 4: Responsive Design Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test responsive design across viewports:
    1. Desktop (1920x1080) - verify full layout
    2. Tablet (768x1024) - verify adapted layout
    3. Mobile (375x667) - verify mobile layout
    4. Check mobile bottom navigation if present
    5. Verify forms are usable on mobile
    6. Check text readability at all sizes
    
    Use DevTools Device Toolbar to simulate viewports.
    
    Document: Screenshots at each breakpoint, any responsive issues
  </action>
  <verify>Responsive design works at all breakpoints</verify>
  <done>Responsive design validated across devices</done>
</task>

<task type="auto">
  <name>Task 5: Accessibility Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test accessibility features:
    1. Keyboard navigation - Tab through all interactive elements
    2. Skip links - Verify "Skip to main content" works
    3. ARIA labels - Check buttons have aria-labels
    4. Color contrast - Verify text is readable
    5. Focus indicators - Check visible focus states
    6. Screen reader compatibility - Verify semantic HTML
    
    Use Lighthouse accessibility audit.
    Use axe DevTools if available.
    
    Document: Accessibility score, any violations found
  </action>
  <verify>Accessibility requirements met</verify>
  <done>Accessibility testing completed</done>
</task>

</tasks>

<verification>
- [ ] Home page loads without errors
- [ ] All 8 navigation links work
- [ ] PWA manifest and service worker present
- [ ] Responsive at desktop, tablet, mobile
- [ ] Accessibility features functional
- [ ] Screenshots captured for each page
</verification>

<success_criteria>
Navigation system is fully functional with:
- Error-free home page loading
- All pages accessible via navigation
- PWA features working
- Responsive design at all breakpoints
- Accessibility requirements met
</success_criteria>

<output>
After completion, create `.planning/phases/01-review-and-testing/01-01-NAVIGATION-SUMMARY.md`
</output>
