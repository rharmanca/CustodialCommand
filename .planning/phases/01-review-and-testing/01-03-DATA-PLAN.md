---
phase: 01-review-and-testing
plan: 03
type: execute
wave: 2
depends_on: ["01-02"]
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Custodial Notes can be created and viewed"
    - "Inspection Data page displays all records"
    - "Search and filter functionality works"
    - "Data persists after page refresh"
    - "Export functionality works if available"
  artifacts:
    - path: "Test notes and inspections"
      provides: "Data for verification"
    - path: "Filter/search test results"
      provides: "Data manipulation verification"
  key_links:
    - from: "Data entry forms"
      to: "Inspection Data page"
      via: "Database storage and retrieval"
---

<objective>
Test data management features including Custodial Notes, Inspection Data viewing, and search/filter functionality.

Purpose: Verify data persistence and retrieval works correctly
Output: Data management test report
</objective>

<execution_context>
@C:/Users/veloc/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
Features to test:
- Custodial Notes creation and viewing
- Inspection Data listing and detail view
- Search functionality
- Filter by school, date, inspector
- Data export (if available)
- Pagination (if present)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Custodial Notes Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test Custodial Notes functionality:
    1. Navigate to Custodial Notes page
    2. Create a new note:
       - School: Select school
       - Location: "Test location"
       - Priority: Select priority level
       - Note: "Test custodial note from automated testing"
       - Add photo if functionality exists
    3. Submit note
    4. Verify success message
    5. View list of notes
    6. Verify new note appears in list
    7. Open note detail view
    8. Verify all data displayed correctly
    
    Document: Note creation flow, display accuracy
  </action>
  <verify>Custodial Notes can be created and viewed</verify>
  <done>Custodial Notes feature tested</done>
</task>

<task type="auto">
  <name>Task 2: Inspection Data Page Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test Inspection Data listing page:
    1. Navigate to Inspection Data page
    2. Verify list loads without errors
    3. Check that inspections display with:
       - Inspector name
       - School
       - Date
       - Overall score
       - Status (complete/incomplete)
    4. Click on inspection to view detail
    5. Verify detail view shows:
       - All scored criteria
       - Individual scores
       - Notes
       - Photos (if any)
       - Room inspections (if whole building)
    6. Test navigation back to list
    
    Document: Data display accuracy, loading performance
  </action>
  <verify>Inspection Data page displays records correctly</verify>
  <done>Inspection Data page tested</done>
</task>

<task type="auto">
  <name>Task 3: Search and Filter Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test search and filter functionality:
    1. Test school filter:
       - Select specific school
       - Verify only that school's data appears
       - Clear filter and verify all data returns
    2. Test date range filter (if available):
       - Select date range
       - Verify data is filtered correctly
    3. Test inspector filter (if available)
    4. Test search by text (if available):
       - Search for known text in notes
       - Verify matching results appear
    5. Test combined filters
    6. Verify filter state persists (URL params)
    
    Document: Filter functionality, any issues
  </action>
  <verify>Search and filters work correctly</verify>
  <done>Filter and search testing completed</done>
</task>

<task type="auto">
  <name>Task 4: Data Persistence Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Verify data persists across sessions:
    1. Create new inspection
    2. Note the ID or identifying info
    3. Refresh the page
    4. Verify data still appears in Inspection Data
    5. Close browser tab
    6. Reopen application
    7. Navigate to Inspection Data
    8. Verify data is still present
    9. Check data in Scores Dashboard (should reflect new data)
    
    Also verify:
    - Sorting works (by date, score, etc.)
    - Pagination works if >10 records
    - Loading states are shown
    
    Document: Persistence confirmed, any data loss issues
  </action>
  <verify>Data persists across refreshes and sessions</verify>
  <done>Data persistence verified</done>
</task>

<task type="auto">
  <name>Task 5: Data Export Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test export functionality (if available):
    1. Look for export buttons (CSV, PDF, etc.)
    2. Test CSV export:
       - Click export
       - Verify file downloads
       - Open file and verify data accuracy
    3. Test PDF export (if available)
    4. Test filtered export (export only filtered results)
    5. Verify exported data matches displayed data
    
    Document: Export functionality status, format accuracy
  </action>
  <verify>Export functionality works (if present)</verify>
  <done>Export testing completed</done>
</task>

</tasks>

<verification>
- [ ] Custodial Notes creation works
- [ ] Inspection Data page displays correctly
- [ ] Search and filter functionality works
- [ ] Data persists after refresh
- [ ] Sorting and pagination work
- [ ] Export tested (if available)
</verification>

<success_criteria>
Data management is fully functional with:
- Successful note creation
- Accurate data display
- Working search and filters
- Data persistence confirmed
- Export working (if present)
</success_criteria>

<output>
After completion, create `.planning/phases/01-review-and-testing/01-03-DATA-SUMMARY.md`
</output>
