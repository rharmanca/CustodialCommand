---
phase: 01-review-and-testing
plan: 02
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Custodial Inspection form submits successfully with valid data"
    - "Whole Building Inspection form submits successfully with valid data"
    - "Form validation shows errors for invalid/missing data"
    - "Photo upload works on both forms"
    - "Submitted data appears in Inspection Data page"
  artifacts:
    - path: "Form test submissions"
      provides: "Verification data in database"
    - path: "Photo upload test results"
      provides: "Image storage confirmation"
  key_links:
    - from: "Inspection forms"
      to: "Database"
      via: "POST /api/inspections"
---

<objective>
Test the inspection forms functionality including submission, validation, and photo upload.

Purpose: Verify forms work correctly for data entry
Output: Form testing report with validation and submission results
</objective>

<execution_context>
@C:/Users/veloc/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
Forms to test:
- Custodial Inspection (Single Area Inspection)
- Whole Building Inspection

Key features:
- School selection dropdown
- Room/location input
- Scoring criteria (0-4 scale)
- Photo upload (multiple images)
- Notes/comments field
- Form validation
</context>

<tasks>

<task type="auto">
  <name>Task 1: Custodial Inspection Form Test</name>
  <files>N/A (browser testing)</files>
  <action>
    Test Single Area Inspection form:
    1. Navigate to Custodial Inspection page
    2. Fill in all required fields:
       - Inspector name: "Test Inspector"
       - School: Select any school (e.g., "Rosenwald")
       - Room number: "101"
       - Location description: "Test location"
    3. Rate all criteria with scores 0-4:
       - Floors, Vertical/Horizontal Surfaces, Ceiling
       - Restrooms, Customer Satisfaction, Trash
       - Project Cleaning, Activity Support, Safety Compliance
       - Equipment, Monitoring
    4. Add notes: "Test submission from automated testing"
    5. Submit form
    
    Verify:
    - Success message appears
    - Form resets after submission
    - No console errors
    - Response shows 201 status
    
    Document: Submission result, response time
  </action>
  <verify>Custodial Inspection form submits successfully</verify>
  <done>Single Area Inspection form tested</done>
</task>

<task type="auto">
  <name>Task 2: Whole Building Inspection Form Test</name>
  <files>N/A (browser testing)</files>
  <action>
    Test Whole Building Inspection form:
    1. Navigate to Whole Building Inspection page
    2. Fill in all required fields:
       - Inspector name: "Test Inspector"
       - School: Select any school
       - Inspection type: Select appropriate type
    3. Rate all building-level criteria
    4. Add rooms for individual inspection
    5. Rate room-specific criteria
    6. Add building notes
    7. Submit form
    
    Verify:
    - Success message appears
    - Building and room data saved
    - Calculated scores are accurate
    - No JavaScript errors
    
    Document: Submission result, multi-room handling
  </action>
  <verify>Whole Building Inspection form submits successfully</verify>
  <done>Whole Building form tested</done>
</task>

<task type="auto">
  <name>Task 3: Form Validation Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test form validation and error handling:
    1. Submit empty form → verify required field errors
    2. Submit with missing school → verify school error
    3. Submit with invalid scores (>4 or <0) → verify validation
    4. Test text field limits (very long input)
    5. Test special characters in text fields
    6. Verify error messages are user-friendly
    7. Verify error fields are highlighted
    
    Document: Validation behavior, error message quality
  </action>
  <verify>Form validation works correctly</verify>
  <done>Validation testing completed</done>
</task>

<task type="auto">
  <name>Task 4: Photo Upload Testing</name>
  <files>N/A (browser testing)</files>
  <action>
    Test photo upload functionality:
    1. Create test images (1-5 images, various sizes)
    2. Upload single photo on Custodial Inspection form
    3. Upload multiple photos (up to 5)
    4. Test photo removal before submission
    5. Submit form with photos attached
    6. Verify photos appear in Inspection Data detail view
    7. Test large image handling (>5MB should be rejected)
    8. Test invalid file type rejection
    
    Document: Upload success, image display, error handling
  </action>
  <verify>Photo upload works correctly</verify>
  <done>Photo upload testing completed</done>
</task>

<task type="auto">
  <name>Task 5: Form Data Verification</name>
  <files>N/A (browser testing)</files>
  <action>
    Verify submitted data appears correctly:
    1. Navigate to Inspection Data page
    2. Find test submissions from Tasks 1-2
    3. Verify all data displayed correctly:
       - Inspector name
       - School
       - Scores for each criterion
       - Notes
       - Photos (if uploaded)
    4. Check calculated overall score
    5. Verify timestamps are correct
    
    Document: Data accuracy verification
  </action>
  <verify>Submitted data appears correctly in data view</verify>
  <done>Form data verification completed</done>
</task>

</tasks>

<verification>
- [ ] Custodial Inspection form submits successfully
- [ ] Whole Building Inspection form submits successfully
- [ ] Form validation shows appropriate errors
- [ ] Photo upload works (single and multiple)
- [ ] Submitted data appears in Inspection Data
- [ ] Calculated scores are accurate
</verification>

<success_criteria>
Forms are fully functional with:
- Successful submission with valid data
- Proper validation and error messages
- Working photo upload
- Data persistence and display
</success_criteria>

<output>
After completion, create `.planning/phases/01-review-and-testing/01-02-FORMS-SUMMARY.md`
</output>
