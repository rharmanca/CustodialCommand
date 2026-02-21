---
phase: 01-review-and-testing
plan: 06
type: execute
wave: 3
depends_on: ["01-02", "01-03"]
files_modified: []
autonomous: true

must_haves:
  truths:
    - "All API endpoints return correct status codes"
    - "Authentication required on protected endpoints"
    - "File upload endpoints accept and store files"
    - "Error responses are properly formatted"
    - "API responses match expected schema"
  artifacts:
    - path: "API test results"
      provides: "Endpoint verification data"
    - path: "curl commands log"
      provides: "Reusable test commands"
  key_links:
    - from: "API endpoints"
      to: "Database/storage"
      via: "Storage layer methods"
---

<objective>
Test all backend API endpoints directly using curl/HTTP client to verify functionality and responses.

Purpose: Validate API contract and backend functionality
Output: API testing report with endpoint coverage
</objective>

<execution_context>
@C:/Users/veloc/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
Base URL: https://cacustodialcommand.up.railway.app/api

Endpoints to test:
- GET /inspections
- POST /inspections
- GET /inspections/:id
- PATCH /inspections/:id
- DELETE /inspections/:id
- GET /custodial-notes
- POST /custodial-notes
- GET /room-inspections
- POST /room-inspections
- GET /monthly-feedback
- GET /scores
- POST /photos/upload
- POST /admin/login
- GET /admin/inspections (protected)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Public API Endpoints Test</name>
  <files>N/A (API testing)</files>
  <action>
    Test public GET endpoints:
    ```bash
    # Test inspections list
    curl -s https://cacustodialcommand.up.railway.app/api/inspections | head -c 1000
    
    # Test custodial notes
    curl -s https://cacustodialcommand.up.railway.app/api/custodial-notes | head -c 1000
    
    # Test room inspections
    curl -s https://cacustodialcommand.up.railway.app/api/room-inspections | head -c 1000
    
    # Test monthly feedback
    curl -s https://cacustodialcommand.up.railway.app/api/monthly-feedback | head -c 1000
    
    # Test scores
    curl -s https://cacustodialcommand.up.railway.app/api/scores | head -c 1000
    
    # Test health endpoint
    curl -s https://cacustodialcommand.up.railway.app/health
    ```
    
    Verify:
    - All return 200 status
    - Response is valid JSON
    - Data structure matches expected schema
    - Response times < 2 seconds
    
    Document: Response status, sample data, response times
  </action>
  <verify>All public endpoints return 200 with valid JSON</verify>
  <done>Public API endpoints tested</done>
</task>

<task type="auto">
  <name>Task 2: POST Endpoints Test</name>
  <files>N/A (API testing)</files>
  <action>
    Test POST endpoints with test data:
    ```bash
    # Test inspection creation
    curl -X POST https://cacustodialcommand.up.railway.app/api/inspections \
      -H "Content-Type: application/json" \
      -d '{
        "inspectorName": "API Test",
        "school": "Rosenwald",
        "inspectionType": "routine",
        "floors": 3,
        "verticalHorizontalSurfaces": 3,
        "ceiling": 3,
        "restrooms": 3,
        "customerSatisfaction": 3,
        "trash": 3,
        "projectCleaning": 3,
        "activitySupport": 3,
        "safetyCompliance": 3,
        "equipment": 3,
        "monitoring": 3
      }'
    
    # Test custodial note creation
    curl -X POST https://cacustodialcommand.up.railway.app/api/custodial-notes \
      -H "Content-Type: application/json" \
      -d '{
        "school": "Rosenwald",
        "location": "Room 101",
        "priority": "medium",
        "note": "API test note"
      }'
    ```
    
    Verify:
    - 201 Created status
    - Response contains created record ID
    - Data is persisted (verify with GET)
    - Validation errors return 400
    
    Document: POST responses, created record IDs
  </action>
  <verify>POST endpoints create records successfully</verify>
  <done>POST endpoints tested</done>
</task>

<task type="auto">
  <name>Task 3: Protected Endpoints Authentication Test</name>
  <files>N/A (API testing)</files>
  <action>
    Test authentication on protected routes:
    ```bash
    # Test admin endpoint without auth - should fail
    curl -s -w "\nHTTP Status: %{http_code}\n" \
      https://cacustodialcommand.up.railway.app/api/admin/inspections
    
    # Login and get session
    curl -X POST -c cookies.txt \
      https://cacustodialcommand.up.railway.app/api/admin/login \
      -H "Content-Type: application/json" \
      -d '{"username": "admin", "password": "PASSWORD"}'
    
    # Access protected endpoint with session
    curl -s -b cookies.txt \
      https://cacustodialcommand.up.railway.app/api/admin/inspections | head -c 1000
    ```
    
    Verify:
    - 401 on unauthenticated requests
    - 200 on authenticated requests
    - Session cookie works
    - CSRF token required for state changes
    
    Document: Auth flow, cookie handling
  </action>
  <verify>Protected endpoints enforce authentication</verify>
  <done>Authentication tested</done>
</task>

<task type="auto">
  <name>Task 4: File Upload API Test</name>
  <files>N/A (API testing)</files>
  <action>
    Test file upload endpoints:
    ```bash
    # Create test image
    # Test photo upload
    curl -X POST \
      https://cacustodialcommand.up.railway.app/api/photos/upload \
      -F "photo=@test-image.jpg" \
      -F "inspectionId=1"
    
    # Test object storage access
    curl -s -o /dev/null -w "%{http_code}" \
      https://cacustodialcommand.up.railway.app/objects/inspections/test-file.jpg
    ```
    
    Verify:
    - Upload returns 200/201
    - File is accessible via GET
    - File size limits enforced (5MB for photos)
    - Invalid file types rejected
    
    Document: Upload responses, file access URLs
  </action>
  <verify>File upload endpoints work correctly</verify>
  <done>File upload API tested</done>
</task>

<task type="auto">
  <name>Task 5: Error Handling Test</name>
  <files>N/A (API testing)</files>
  <action>
    Test API error responses:
    ```bash
    # Test 404 on non-existent resource
    curl -s -w "\nStatus: %{http_code}\n" \
      https://cacustodialcommand.up.railway.app/api/inspections/99999
    
    # Test validation error
    curl -X POST \
      https://cacustodialcommand.up.railway.app/api/inspections \
      -H "Content-Type: application/json" \
      -d '{"invalid": "data"}'
    
    # Test invalid JSON
    curl -X POST \
      https://cacustodialcommand.up.railway.app/api/inspections \
      -H "Content-Type: application/json" \
      -d 'not valid json'
    
    # Test method not allowed
    curl -X DELETE \
      https://cacustodialcommand.up.railway.app/api/scores
    ```
    
    Verify:
    - 404 for missing resources
    - 400 for validation errors
    - 405 for invalid methods
    - Error messages are descriptive
    - JSON parsing errors handled
    
    Document: Error response format, status codes
  </action>
  <verify>Error responses are properly formatted</verify>
  <done>Error handling tested</done>
</task>

</tasks>

<verification>
- [ ] All public GET endpoints return 200
- [ ] POST endpoints create records
- [ ] Protected endpoints require auth
- [ ] File upload works correctly
- [ ] Error responses are proper
- [ ] Response times acceptable
</verification>

<success_criteria>
API is fully functional with:
- All endpoints responding correctly
- Proper authentication enforcement
- Working file uploads
- Appropriate error handling
</success_criteria>

<output>
After completion, create `.planning/phases/01-review-and-testing/01-06-API-SUMMARY.md`
</output>
