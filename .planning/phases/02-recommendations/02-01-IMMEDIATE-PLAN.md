---
phase: 02-recommendations
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Inspection Data page UI structure is documented and understood"
    - "Admin functionality tested successfully with credentials"
    - "Lighthouse accessibility score is measured and recorded"
    - "Critical accessibility issues are identified"
  artifacts:
    - path: "UI structure documentation"
      provides: "Inspection Data page layout details"
    - path: "Admin test results"
      provides: "Authentication and CRUD verification"
    - path: "Lighthouse report"
      provides: "Accessibility scores and recommendations"
  key_links:
    - from: "Browser DevTools"
      to: "Application pages"
      via: "Manual inspection and audit tools"
---

<objective>
Complete immediate verification tasks identified in Phase 01: inspect data page UI, test admin with credentials, and run Lighthouse accessibility audit.

Purpose: Address critical pre-production verification gaps
Output: Documentation of UI structure, admin test results, and accessibility assessment
</objective>

<execution_context>
@C:/Users/veloc/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/phases/01-review-and-testing/01-03-DATA-SUMMARY.md
@.planning/phases/01-review-and-testing/01-04-ADMIN-SUMMARY.md

Application URL: https://cacustodialcommand.up.railway.app/

Outstanding tasks from Phase 01:
1. Data Management UI - Test scripts couldn't parse page structure
2. Admin Testing - 5 test scripts created but need credentials
3. Accessibility - Automated checks passed, Lighthouse audit needed
</context>

<tasks>

<task type="auto">
  <name>Task 1: Manual Inspection Data Page Review</name>
  <files>N/A (browser inspection)</files>
  <action>
    Manually inspect the Inspection Data page to understand its structure:
    1. Navigate to https://cacustodialcommand.up.railway.app/inspection-data
    2. Open Chrome DevTools (F12)
    3. Use Elements tab to inspect the page structure
    4. Document the DOM structure:
       - How are inspection records displayed? (table, cards, list?)
       - What are the actual CSS selectors for data elements?
       - Is there filtering UI present?
       - How does pagination work?
    5. Take screenshots of the page layout
    6. Check if data from Plan 01-02 ("Test Inspector") is visible
    7. Note any JavaScript frameworks rendering the data
    
    Compare findings to what test scripts expected (table structure).
    Document the actual structure for future test updates.
  </action>
  <verify>Page structure documented with actual DOM selectors</verify>
  <done>Inspection Data UI structure understood and documented</done>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <what-needed>Admin credentials for testing</what-needed>
  <how-to-provide>
    The admin test scripts need credentials to authenticate:
    1. Check Railway dashboard Environment Variables
    2. Find ADMIN_USERNAME and ADMIN_PASSWORD values
    3. Provide credentials for test execution
  </how-to-provide>
  <resume-signal>Provide credentials or say "skip admin testing"</resume-signal>
</task>

<task type="auto">
  <name>Task 2: Admin Credential Testing</name>
  <files>
    - tests/admin/test_admin_login.py
    - tests/admin/test_admin_crud.py
    - tests/admin/test_monthly_feedback.py
    - tests/admin/test_scores_dashboard.py
    - tests/admin/test_protected_routes.py
  </files>
  <action>
    Execute admin test scripts with provided credentials:
    1. Update test scripts with credentials
    2. Run: python tests/admin/test_admin_login.py
       - Verify login succeeds
       - Check session cookie handling
    3. Run: python tests/admin/test_protected_routes.py
       - Verify auth required on admin routes
       - Test CSRF protection
    4. Run: python tests/admin/test_admin_crud.py
       - Test inspection editing
       - Test inspection deletion
    5. Run: python tests/admin/test_monthly_feedback.py
       - Test PDF upload
       - Verify Docling processing
    6. Run: python tests/admin/test_scores_dashboard.py
       - Verify dashboard with authenticated access
    7. Document any failures or issues
    8. Capture screenshots of admin functionality
  </action>
  <verify>All admin tests pass with credentials</verify>
  <done>Admin functionality fully tested and verified</done>
</task>

<task type="auto">
  <name>Task 3: Lighthouse Accessibility Audit</name>
  <files>N/A (browser audit)</files>
  <action>
    Run comprehensive Lighthouse accessibility audit:
    1. Open Chrome and navigate to https://cacustodialcommand.up.railway.app/
    2. Open DevTools (F12) → Lighthouse tab
    3. Configure audit:
       - Device: Mobile
       - Categories: Accessibility (checked)
       - Categories: Performance (checked)
       - Categories: Best Practices (checked)
       - Categories: SEO (checked)
    4. Run audit on Home page
    5. Record scores for all categories
    6. Navigate to key pages and run audits:
       - /custodial-inspection
       - /inspection-data
       - /custodial-notes
    7. Document all accessibility violations:
       - Critical issues (must fix)
       - Warnings (should fix)
       - Notices (nice to have)
    8. Export Lighthouse reports as JSON
    9. Check for missing:
       - ARIA labels
       - Alt text on images
       - Color contrast issues
       - Keyboard navigation problems
  </action>
  <verify>Lighthouse scores recorded, violations documented</verify>
  <done>Accessibility audit completed with actionable findings</done>
</task>

<task type="auto">
  <name>Task 4: Document Findings and Recommendations</name>
  <files>
    - .planning/phases/02-recommendations/02-01-IMMEDIATE-SUMMARY.md
  </files>
  <action>
    Create comprehensive summary of immediate verification:
    1. Document Inspection Data page structure:
       - Actual DOM layout
       - CSS selectors for test updates
       - Any issues with data display
    2. Document admin testing results:
       - Which tests passed/failed
       - Any authentication issues
       - CRUD operation status
    3. Document Lighthouse findings:
       - Scores for each page
       - Critical accessibility issues
       - Performance bottlenecks
       - Recommendations for fixes
    4. Prioritize issues:
       - Blockers (must fix before production)
       - High priority (fix soon)
       - Medium priority (fix when convenient)
       - Low priority (nice to have)
    5. Update test scripts with corrected selectors if needed
  </action>
  <verify>SUMMARY.md created with all findings</verify>
  <done>Immediate verification tasks documented and prioritized</done>
</task>

</tasks>

<verification>
- [ ] Inspection Data page structure documented
- [ ] Admin tests executed with credentials (or skipped)
- [ ] Lighthouse accessibility audit completed
- [ ] Scores and violations documented
- [ ] Issues prioritized with fix recommendations
- [ ] SUMMARY.md created
</verification>

<success_criteria>
All immediate verification tasks complete:
- UI structure understood
- Admin functionality verified (if credentials provided)
- Accessibility audited with Lighthouse
- Findings documented and prioritized
</success_criteria>

<output>
After completion, create `.planning/phases/02-recommendations/02-01-IMMEDIATE-SUMMARY.md`
</output>
