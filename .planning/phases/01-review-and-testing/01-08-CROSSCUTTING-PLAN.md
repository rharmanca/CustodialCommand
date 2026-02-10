---
phase: 01-review-and-testing
plan: 08
type: execute
wave: 4
depends_on: ["01-01", "01-02", "01-03", "01-04", "01-05", "01-06", "01-07"]
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Performance metrics meet acceptable thresholds"
    - "Accessibility audit passes with no critical violations"
    - "Security headers and CSRF protection are active"
    - "Application works across major browsers"
    - "Error logging and monitoring are functional"
  artifacts:
    - path: "Performance report"
      provides: "Load times and metrics"
    - path: "Accessibility audit results"
      provides: "WCAG compliance status"
    - path: "Security scan results"
      provides: "Vulnerability assessment"
  key_links:
    - from: "Application"
      to: "Monitoring/Health"
      via: "Health endpoints and logging"
---

<objective>
Test cross-cutting concerns including performance, accessibility, security, and cross-browser compatibility.

Purpose: Verify application meets quality standards across all dimensions
Output: Comprehensive quality assessment report
</objective>

<execution_context>
@C:/Users/veloc/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
Quality dimensions to test:
- Performance (load times, Core Web Vitals)
- Accessibility (WCAG compliance, screen readers)
- Security (headers, CSRF, XSS protection)
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Error handling and logging
- Health monitoring endpoints
</context>

<tasks>

<task type="auto">
  <name>Task 1: Performance Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Run performance tests:
    1. Use Lighthouse in Chrome DevTools:
       - Performance audit
       - Record scores for: FCP, LCP, TTI, TBT, CLS
       - Target: Performance score > 70
    2. Test page load times:
       - Home page: < 3 seconds
       - Inspection forms: < 2 seconds
       - Data pages: < 3 seconds
    3. Check bundle sizes:
       - Main JS bundle size
       - Image optimization
    4. Test API response times:
       - GET /api/inspections: < 500ms
       - POST /api/inspections: < 1s
    5. Test with throttled connection (Fast 3G)
    
    Document: Lighthouse scores, load times, bottlenecks
  </action>
  <verify>Performance meets acceptable thresholds</verify>
  <done>Performance testing completed</done>
</task>

<task type="auto">
  <name>Task 2: Accessibility Audit</name>
  <files>N/A (browser testing)</files>
  <action>
    Run comprehensive accessibility audit:
    1. Lighthouse accessibility audit
       - Target: Score > 90
    2. axe DevTools scan (if available):
       - Check for critical violations
       - Note warnings and recommendations
    3. Manual keyboard navigation test:
       - Tab through entire application
       - Verify focus indicators visible
       - Check logical tab order
    4. Screen reader test (ChromeVox or NVDA):
       - Verify headings are announced
       - Check form labels
       - Test ARIA live regions
    5. Color contrast check:
       - Use DevTools contrast picker
       - Verify 4.5:1 ratio for text
    6. Test with reduced motion preference
    
    Document: Audit scores, violations found, fixes needed
  </action>
  <verify>Accessibility passes audit with no critical issues</verify>
  <done>Accessibility audit completed</done>
</task>

<task type="auto">
  <name>Task 3: Security Validation</name>
  <files>N/A (security testing)</files>
  <action>
    Test security measures:
    1. Check security headers:
       ```bash
       curl -s -I https://cacustodialcommand.up.railway.app/ | grep -i "security\|x-frame\|csp\|hsts"
       ```
    2. Test CSRF protection:
       - Attempt POST without token → should fail
       - Verify token in forms
    3. Test XSS protection:
       - Try injecting script in form inputs
       - Verify output is sanitized
    4. Check for exposed sensitive data:
       - No API keys in frontend code
       - No passwords in error messages
    5. Test rate limiting:
       - Rapid requests to /api/photos/upload
       - Verify 429 response after limit
    6. Check HTTPS enforcement:
       - HTTP request should redirect to HTTPS
    7. Test admin route protection
    
    Document: Security findings, recommendations
  </action>
  <verify>Security measures are active and effective</verify>
  <done>Security validation completed</done>
</task>

<task type="auto">
  <name>Task 4: Cross-Browser Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test on multiple browsers:
    1. Chrome (latest):
       - Full feature testing
       - PWA installation
    2. Firefox (latest):
       - Core functionality
       - Form submissions
    3. Safari (if available):
       - iOS Safari simulation
       - Photo capture
    4. Edge (latest):
       - Compatibility check
    5. Test responsive behavior in each
    6. Check for console errors in each browser
    
    Use BrowserStack or similar if available for broader coverage.
    
    Document: Browser compatibility matrix, issues found
  </action>
  <verify>Application works across major browsers</verify>
  <done>Cross-browser testing completed</done>
</task>

<task type="auto">
  <name>Task 5: Error Handling and Monitoring</name>
  <files>N/A (monitoring testing)</files>
  <action>
    Test error handling and monitoring:
    1. Health endpoint check:
       ```bash
       curl https://cacustodialcommand.up.railway.app/health
       ```
    2. Metrics endpoint check:
       ```bash
       curl https://cacustodialcommand.up.railway.app/metrics
       ```
    3. Test error scenarios:
       - 404 page displays correctly
       - 500 errors show user-friendly message
       - Network errors handled gracefully
    4. Check client-side error logging:
       - Console error monitoring
       - Error boundary functionality
    5. Test graceful degradation:
       - Disable JavaScript → check fallback
       - Slow network → check loading states
    
    Document: Error handling quality, monitoring status
  </action>
  <verify>Error handling and monitoring are functional</verify>
  <done>Error handling testing completed</done>
</task>

</tasks>

<verification>
- [ ] Performance scores acceptable
- [ ] Accessibility passes audit
- [ ] Security measures validated
- [ ] Cross-browser compatibility confirmed
- [ ] Error handling tested
- [ ] Health endpoints responding
</verification>

<success_criteria>
Application meets quality standards:
- Performance: Lighthouse > 70, load times < 3s
- Accessibility: Lighthouse > 90, keyboard navigable
- Security: Headers present, CSRF working, no XSS
- Cross-browser: Works on Chrome, Firefox, Safari, Edge
- Monitoring: Health endpoints active, errors handled
</success_criteria>

<output>
After completion, create `.planning/phases/01-review-and-testing/01-08-CROSSCUTTING-SUMMARY.md`
</output>
