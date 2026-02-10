---
phase: 01-review-and-testing
plan: 04
type: execute
wave: 2
depends_on: ["01-02"]
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Admin login works with valid credentials"
    - "Protected routes require authentication"
    - "Monthly Feedback PDF upload processes correctly"
    - "Scores Dashboard displays accurate data"
    - "Admin can perform CRUD operations on inspections"
  artifacts:
    - path: "Admin test session"
      provides: "Authenticated session verification"
    - path: "PDF processing test"
      provides: "Docling integration verification"
  key_links:
    - from: "Admin login"
      to: "Protected routes"
      via: "Session-based authentication"
---

<objective>
Test admin functionality including authentication, Monthly Feedback PDF processing, and Scores Dashboard.

Purpose: Verify admin features and protected routes work correctly
Output: Admin functionality test report
</objective>

<execution_context>
@C:/Users/veloc/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
Features to test:
- Admin login (/api/admin/login)
- Protected admin routes
- Monthly Feedback PDF upload and Docling processing
- Scores Dashboard data visualization
- Admin CRUD operations on inspections
</context>

<tasks>

<task type="auto">
  <name>Task 1: Admin Login Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test admin authentication:
    1. Navigate to Admin Inspections page
    2. Verify redirect to login (if not authenticated)
    3. Enter valid admin credentials:
       - Username: (from environment)
       - Password: (from environment)
    4. Submit login form
    5. Verify successful authentication
    6. Check session cookie is set
    7. Verify redirect to admin dashboard
    
    Also test:
    - Invalid credentials show error
    - Empty fields show validation errors
    - Session persists across page navigation
    
    Document: Login flow, session handling
  </action>
  <verify>Admin login works with valid credentials</verify>
  <done>Admin authentication tested</done>
</task>

<task type="auto">
  <name>Task 2: Protected Routes Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test route protection:
    1. Access /api/admin/inspections without auth → verify 401
    2. Access admin page directly without auth → verify redirect to login
    3. Login and access protected routes → verify 200
    4. Test CSRF protection on admin endpoints
    5. Verify session timeout behavior (if testable)
    6. Test logout functionality
    7. Verify protected routes inaccessible after logout
    
    Use browser DevTools to verify:
    - Correct HTTP status codes
    - Session cookie presence
    - CSRF token in requests
    
    Document: Route protection working correctly
  </action>
  <verify>Protected routes require authentication</verify>
  <done>Route protection validated</done>
</task>

<task type="auto">
  <name>Task 3: Monthly Feedback PDF Upload</name>
  <files>N/A (browser testing)</files>
  <action>
    Test Monthly Feedback PDF processing:
    1. Navigate to Monthly Feedback page
    2. Upload a test PDF file:
       - File size < 10MB
       - Valid PDF format
    3. Verify upload progress indicator
    4. Wait for Docling processing to complete
    5. Verify extracted text appears
    6. Check feedback is saved to database
    7. View feedback in list view
    8. Edit notes on feedback entry
    
    Also test error cases:
    - Invalid file type (non-PDF)
    - File too large (>10MB)
    - Corrupted PDF
    
    Document: Upload flow, processing time, extraction accuracy
  </action>
  <verify>PDF upload and Docling processing work correctly</verify>
  <done>Monthly Feedback feature tested</done>
</task>

<task type="auto">
  <name>Task 4: Scores Dashboard Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test Scores Dashboard:
    1. Navigate to Scores Dashboard
    2. Verify dashboard loads without errors
    3. Check all schools are listed
    4. Verify overall scores are calculated correctly
    5. Test school-specific score view
    6. Verify score breakdown by category:
       - Floors, Surfaces, Ceiling
       - Restrooms, Customer Satisfaction
       - Safety, Equipment, etc.
    7. Check data visualization (charts/graphs)
    8. Verify scores update with new inspections
    9. Test date range filtering (if available)
    
    Document: Dashboard accuracy, visualization quality
  </action>
  <verify>Scores Dashboard displays accurate data</verify>
  <done>Scores Dashboard tested</done>
</task>

<task type="auto">
  <name>Task 5: Admin CRUD Operations</name>
  <files>N/A (browser testing)</files>
  <action>
    Test admin CRUD on inspections:
    1. Login as admin
    2. View list of all inspections
    3. Test edit operation:
       - Select inspection
       - Modify scores
       - Save changes
       - Verify updates persist
    4. Test delete operation:
       - Create test inspection
       - Delete it
       - Verify removal from list
    5. Test bulk operations (if available)
    6. Verify audit trail (if present)
    
    Document: CRUD operations working, any limitations
  </action>
  <verify>Admin can perform CRUD operations</verify>
  <done>Admin CRUD tested</done>
</task>

</tasks>

<verification>
- [ ] Admin login works
- [ ] Protected routes enforce authentication
- [ ] Monthly Feedback PDF upload processes correctly
- [ ] Scores Dashboard displays accurate data
- [ ] Admin CRUD operations work
- [ ] CSRF protection active
</verification>

<success_criteria>
Admin functionality is fully working with:
- Successful authentication
- Protected routes secured
- PDF processing with Docling
- Accurate scores dashboard
- Full CRUD capabilities
</success_criteria>

<output>
After completion, create `.planning/phases/01-review-and-testing/01-04-ADMIN-SUMMARY.md`
</output>
