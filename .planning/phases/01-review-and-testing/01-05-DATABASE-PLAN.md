---
phase: 01-review-and-testing
plan: 05
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Database is confirmed to be hosted on Railway PostgreSQL"
    - "Environment variables point to Railway database, not localhost"
    - "Data persists across app restarts and deployments"
    - "Database connection is stable and performant"
    - "No local database dependencies exist in production"
  artifacts:
    - path: "Verification report"
      provides: "Database hosting confirmation"
    - path: "Environment audit"
      provides: "DATABASE_URL validation"
  key_links:
    - from: "Railway Dashboard"
      to: "Application"
      via: "DATABASE_URL"
---

<objective>
Verify that the Custodial Command application's PostgreSQL database is fully hosted on Railway and not using any local database instances.

Purpose: Ensure production data is properly hosted in the cloud with reliable infrastructure
Output: Database hosting verification report with confirmation of Railway PostgreSQL usage
</objective>

<execution_context>
@C:/Users/veloc/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/codebase/INTEGRATIONS.md
@.planning/codebase/CONCERNS.md

Application URL: https://cacustodialcommand.up.railway.app/
Railway Project: cacustodialcommand
Expected Database: Railway PostgreSQL (not local)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Verify Railway Database Instance</name>
  <files>N/A (external verification)</files>
  <action>
    Access Railway dashboard at https://railway.app/ and verify:
    1. PostgreSQL database service is provisioned for the project
    2. Database is in "Running" state
    3. Note the database connection details (host, port, database name)
    4. Check database resource allocation (CPU, memory, storage)
    5. Verify database is in the same region as the app service
    
    Document findings including:
    - Database service name
    - Deployment region
    - Resource limits
    - Connection string format (mask credentials)
  </action>
  <verify>Railway dashboard shows active PostgreSQL service</verify>
  <done>Railway database instance confirmed and documented</done>
</task>

<task type="auto">
  <name>Task 2: Audit Environment Variables</name>
  <files>N/A (environment verification)</files>
  <action>
    In Railway dashboard, check the application's environment variables:
    1. Find DATABASE_URL variable
    2. Verify it points to Railway PostgreSQL (contains railway.app domain)
    3. Confirm it does NOT contain localhost, 127.0.0.1, or local paths
    4. Check for any fallback/local database configurations
    5. Verify REDIS_URL if present (should also be Railway or external)
    
    Document the DATABASE_URL pattern:
    - Should match: postgresql://[user]:[pass]@[host].railway.app:[port]/[database]
    - Should NOT match: postgresql://localhost:* or postgresql://127.0.0.1:*
  </action>
  <verify>DATABASE_URL points to Railway PostgreSQL host</verify>
  <done>Environment variables confirmed to use Railway database</done>
</task>

<task type="auto">
  <name>Task 3: Test Database Connectivity from App</name>
  <files>N/A (live testing)</files>
  <action>
    Test database connectivity through the deployed application:
    1. Visit https://cacustodialcommand.up.railway.app/health
    2. Check if health endpoint reports database status
    3. Navigate to Inspection Data page - should load existing records
    4. Create a test inspection record
    5. Verify the record persists after page refresh
    6. Check that data appears in the Scores Dashboard
    
    Use browser DevTools Network tab to verify:
    - API calls to /api/inspections succeed
    - Response times are reasonable (< 2 seconds)
    - No connection errors or timeouts
  </action>
  <verify>Application successfully reads and writes to database</verify>
  <done>Database connectivity confirmed through live application</done>
</task>

<task type="auto">
  <name>Task 4: Verify No Local Database References</name>
  <files>
    - server/db.ts
    - server/storage.ts
    - .env files (if accessible)
  </files>
  <action>
    Search codebase for any hardcoded local database references:
    1. Check server/db.ts for database connection logic
    2. Look for localhost, 127.0.0.1, ::1, or file: references
    3. Check for SQLite or local file-based database patterns
    4. Verify all database connections use environment variables
    5. Confirm no fallback to local database in production
    
    Report any findings of local database dependencies.
  </action>
  <verify>No hardcoded localhost database references found</verify>
  <done>Codebase confirmed to use environment-based database configuration</done>
</task>

<task type="auto">
  <name>Task 5: Document Database Verification Results</name>
  <files>
    - .planning/phases/01-review-and-testing/01-05-DATABASE-SUMMARY.md
  </files>
  <action>
    Create comprehensive verification report:
    1. Railway PostgreSQL instance details
    2. Environment variable configuration
    3. Connectivity test results
    4. Code audit findings
    5. Confirmation that database is fully hosted on Railway
    6. Any concerns or recommendations
    
    Include screenshots of Railway dashboard where applicable.
  </action>
  <verify>Summary document created with all verification details</verify>
  <done>Database hosting fully verified and documented</done>
</task>

</tasks>

<verification>
- [ ] Railway PostgreSQL service is confirmed running
- [ ] DATABASE_URL points to Railway (not localhost)
- [ ] Application successfully connects to Railway database
- [ ] Data persists across sessions
- [ ] No local database references in codebase
- [ ] Verification report created
</verification>

<success_criteria>
Database is confirmed to be fully hosted on Railway PostgreSQL with:
- Active Railway PostgreSQL service
- Correct environment variable configuration
- Successful application connectivity
- Data persistence verified
- No local database dependencies
</success_criteria>

<output>
After completion, create `.planning/phases/01-review-and-testing/01-05-DATABASE-SUMMARY.md`
</output>
