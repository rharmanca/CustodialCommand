---
phase: 02-recommendations
plan: 04
type: execute
wave: 3
depends_on: ["02-01"]
files_modified: []
autonomous: true

must_haves:
  truths:
    - "All test data identified and catalogued"
    - "Test inspections removed from database"
    - "Test photos and files cleaned up"
    - "Database integrity verified after cleanup"
  artifacts:
    - path: "Cleanup log"
      provides: "Record of deleted items"
    - path: "Database verification"
      provides: "Post-cleanup integrity check"
  key_links:
    - from: "Test data identification"
      to: "Database cleanup"
      via: "SQL delete operations"
---

<objective>
Clean up test data created during Phase 01 testing, including "Test Inspector" entries and associated photos/files.

Purpose: Remove test artifacts before production use
Output: Clean database with only production data
</objective>

<execution_context>
@C:/Users/veloc/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/phases/01-review-and-testing/01-02-FORMS-SUMMARY.md

Test Data Created in Phase 01:
- Inspector: "Test Inspector"
- Test Timestamp: 20260210_071606
- Room: 101
- School: Rosenwald
- Test notes with timestamps
- Photo uploads in test directories

Locations:
- Database: inspections, custodial_notes tables
- Files: tests/screenshots/, tests/admin/screenshots/, uploads/
</context>

<tasks>

<task type="auto">
  <name>Task 1: Identify All Test Data</name>
  <files>N/A (database query)</files>
  <action>
    Catalog all test data before cleanup:
    1. Query database for test records:
       ```sql
       -- Find test inspections
       SELECT id, inspector_name, school, date, created_at
       FROM inspections
       WHERE inspector_name LIKE '%Test%' 
          OR inspector_name LIKE '%test%'
          OR notes LIKE '%test%'
          OR notes LIKE '%automated%';
       
       -- Find test notes
       SELECT id, school, note, created_at
       FROM custodial_notes
       WHERE note LIKE '%test%'
          OR note LIKE '%automated%';
       
       -- Find test room inspections
       SELECT id, inspection_id, room_number, created_at
       FROM room_inspections
       WHERE created_at > '2026-02-09';
       ```
    2. Check for uploaded test files:
       - uploads/inspections/ directory
       - uploads/custodial-notes/ directory
       - Look for files with timestamps matching test dates
    3. List all identified test data:
       - Inspection IDs to delete
       - Note IDs to delete
       - Photo file paths to delete
       - Room inspection IDs to delete
    4. Count total records to be deleted
    5. Export list for verification after cleanup
  </action>
  <verify>Complete catalog of test data created</verify>
  <done>All test data identified and listed</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-needed>Confirmation before data deletion</what-needed>
  <how-to-verify>
    Review the list of test data to be deleted:
    1. Check the identified test records
    2. Verify no production data is included
    3. Confirm deletion is acceptable
    4. Note any items to preserve
  </how-to-verify>
  <resume-signal>Type "confirmed" to proceed with deletion, or specify items to preserve</resume-signal>
</task>

<task type="auto">
  <name>Task 2: Delete Test Database Records</name>
  <files>N/A (database operations)</files>
  <action>
    Remove test records from database:
    1. Backup consideration: Note that test data is not critical
    2. Delete in proper order (foreign key constraints):
       ```sql
       -- First delete related records
       DELETE FROM room_inspections 
       WHERE inspection_id IN (
         SELECT id FROM inspections 
         WHERE inspector_name LIKE '%Test%'
       );
       
       DELETE FROM inspection_photos
       WHERE inspection_id IN (
         SELECT id FROM inspections 
         WHERE inspector_name LIKE '%Test%'
       );
       
       -- Delete test inspections
       DELETE FROM inspections
       WHERE inspector_name LIKE '%Test%'
          OR inspector_name LIKE '%test%'
          OR notes LIKE '%automated testing%';
       
       -- Delete test notes
       DELETE FROM custodial_notes
       WHERE note LIKE '%test%'
          OR note LIKE '%automated testing%';
       ```
    3. Use API as alternative if direct DB access not available:
       ```bash
       # Get list of test inspections
       curl https://cacustodialcommand.up.railway.app/api/inspections?inspector=Test
       
       # Delete via admin API (if available)
       ```
    4. Verify deletion counts match identification count
    5. Check for any orphaned records
    6. Document deletion log with counts
  </action>
  <verify>Test records deleted from database</verify>
  <done>Database cleaned of test data</done>
</task>

<task type="auto">
  <name>Task 3: Clean Up Test Files</name>
  <files>N/A (filesystem cleanup)</files>
  <action>
    Remove test files and uploads:
    1. Identify test photos in uploads/:
       - uploads/inspections/ - files created during testing
       - uploads/custodial-notes/ - test note photos
       - uploads/room-inspections/ - test room photos
    2. Check file timestamps:
       - Files created on 2026-02-09 and 2026-02-10
       - Match timestamps from database records
    3. Delete identified test files:
       ```bash
       # List test files (dry run first)
       find uploads/ -name "*test*" -o -newermt "2026-02-09" ! -newermt "2026-02-11"
       
       # Delete after verification
       find uploads/ -name "*test*" -delete
       ```
    4. Clean up test directories:
       - tests/screenshots/ - keep or remove?
       - tests/admin/screenshots/ - keep for documentation?
    5. Remove temporary test scripts if no longer needed:
       - tests/data-management-test.py (if purely test)
       - Other temporary test files
    6. Document files deleted
  </action>
  <verify>Test files removed from uploads and directories</verify>
  <done>Filesystem cleaned of test artifacts</done>
</task>

<task type="auto">
  <name>Task 4: Verify Database Integrity</name>
  <files>N/A (verification)</files>
  <action>
    Verify database integrity after cleanup:
    1. Query counts to confirm deletions:
       ```sql
       -- Count remaining inspections
       SELECT COUNT(*) FROM inspections;
       
       -- Verify no test data remains
       SELECT COUNT(*) FROM inspections 
       WHERE inspector_name LIKE '%Test%';
       
       -- Count remaining notes
       SELECT COUNT(*) FROM custodial_notes;
       
       -- Verify no test notes remain
       SELECT COUNT(*) FROM custodial_notes 
       WHERE note LIKE '%test%';
       ```
    2. Check for orphaned records:
       - Room inspections without parent inspection
       - Photos without parent records
    3. Verify foreign key constraints still valid
    4. Test application functionality:
       - Load Inspection Data page
       - Verify no errors
       - Check that remaining data displays correctly
    5. Run health check:
       ```bash
       curl https://cacustodialcommand.up.railway.app/health
       ```
    6. Document final database state
  </action>
  <verify>Database integrity confirmed, no test data remains</verify>
  <done>Database integrity verified after cleanup</done>
</task>

<task type="auto">
  <name>Task 5: Document Cleanup Results</name>
  <files>
    - .planning/phases/02-recommendations/02-04-CLEANUP-SUMMARY.md
  </files>
  <action>
    Create cleanup summary report:
    1. Document what was deleted:
       - Number of inspections removed
       - Number of notes removed
       - Number of room inspections removed
       - Number of photos/files removed
    2. Document what was preserved:
       - Production data counts
       - Legitimate test infrastructure
    3. Document verification results:
       - Database integrity check passed
       - Application functioning correctly
    4. Provide recommendations:
       - Future testing best practices
       - Data cleanup procedures
       - Test data identification patterns
    5. Commit any necessary changes
    6. Archive test scripts if needed
  </action>
  <verify>SUMMARY.md created with cleanup details</verify>
  <done>Cleanup documented and completed</done>
</task>

</tasks>

<verification>
- [ ] All test data identified and catalogued
- [ ] Deletion confirmed via checkpoint
- [ ] Test records deleted from database
- [ ] Test files cleaned up
- [ ] Database integrity verified
- [ ] Application functioning correctly
- [ ] SUMMARY.md created
</verification>

<success_criteria>
Cleanup complete with:
- All "Test Inspector" entries removed
- Test photos and files deleted
- Database integrity maintained
- Application verified working
- Cleanup documented
</success_criteria>

<output>
After completion, create `.planning/phases/02-recommendations/02-04-CLEANUP-SUMMARY.md`
</output>
