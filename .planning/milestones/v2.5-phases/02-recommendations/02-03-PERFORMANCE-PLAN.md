---
phase: 02-recommendations
plan: 03
type: execute
wave: 2
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "/api/room-inspections response time improved"
    - "Database query performance optimized"
    - "Performance benchmarks documented"
  artifacts:
    - path: "Performance optimization report"
      provides: "Before/after metrics"
    - path: "Query optimization changes"
      provides: "Code improvements"
  key_links:
    - from: "API endpoints"
      to: "Database queries"
      via: "Optimized Drizzle ORM queries"
---

<objective>
Optimize application performance, specifically targeting the slow /api/room-inspections endpoint (1.67s response time) and database query efficiency.

Purpose: Address performance bottlenecks identified in Phase 01
Output: Optimized queries with measurable performance improvements
</objective>

<execution_context>
@C:/Users/veloc/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/phases/01-review-and-testing/01-06-API-SUMMARY.md

Performance Issues Identified:
- GET /api/room-inspections: 1.67s (slowest endpoint)
- GET /api/inspections: 1.06s (room for improvement)
- Target: All API responses under 1 second
</context>

<tasks>

<task type="auto">
  <name>Task 1: Analyze Room Inspections Query</name>
  <files>
    - server/routes.ts
    - server/storage.ts
  </files>
  <action>
    Analyze the slow room-inspections endpoint:
    1. Find the route handler in server/routes.ts:
       - GET /api/room-inspections
       - GET /api/room-inspections/:id
    2. Trace the database queries:
       - Check server/storage.ts getRoomInspections() method
       - Look for N+1 query patterns
       - Check for missing indexes
       - Analyze query complexity
    3. Review related table structure:
       - roomInspections table in shared/schema.ts
       - Relationships to inspections table
       - Foreign key constraints
    4. Check for:
       - Unnecessary joins
       - Missing WHERE clauses causing full table scans
       - Large result sets without pagination
       - Inefficient sorting
    5. Document current query patterns
    6. Identify optimization opportunities
  </action>
  <verify>Query analysis complete with identified bottlenecks</verify>
  <done>Room inspections query analyzed</done>
</task>

<task type="auto">
  <name>Task 2: Optimize Room Inspections Endpoint</name>
  <files>
    - server/storage.ts
    - server/routes.ts
  </files>
  <action>
    Implement optimizations for room-inspections endpoint:
    1. Add pagination if missing:
       - Default limit: 50 records
       - Support page and limit query params
    2. Add filtering:
       - Filter by inspection_id
       - Filter by room_number
       - Filter by date range
    3. Optimize database query:
       - Use select() to limit columns returned
       - Add proper WHERE clauses
       - Use indexes (inspection_id, room_number)
    4. Reduce N+1 queries:
       - Batch related data fetching
       - Use joins where appropriate
    5. Add caching (if applicable):
       - Cache frequently accessed data
       - Set appropriate TTL
    6. Test optimizations:
       - Measure before/after response times
       - Verify data accuracy maintained
       - Test pagination works correctly
    7. Document changes made
  </action>
  <verify>Response time improved (target: < 1s)</verify>
  <done>Room inspections endpoint optimized</done>
</task>

<task type="auto">
  <name>Task 3: Review Other Slow Queries</name>
  <files>
    - server/storage.ts
    - server/routes.ts
  </files>
  <action>
    Review and optimize other slow endpoints:
    1. GET /api/inspections (1.06s):
       - Check for missing pagination
       - Optimize joins if present
       - Add filtering support
    2. GET /api/custodial-notes (0.60s):
       - Already fast but review for consistency
    3. GET /api/monthly-feedback (0.90s):
       - PDF data may be inherently slower
       - Consider caching extracted text
    4. Common optimizations to apply:
       - Add LIMIT/OFFSET pagination
       - Use indexed columns for filtering
       - Select only needed columns
       - Avoid SELECT *
    5. Check database indexes:
       - Verify foreign key indexes exist
       - Check query execution plans if possible
    6. Implement consistent patterns across all list endpoints
  </action>
  <verify>All slow queries reviewed and optimized</verify>
  <done>All endpoints optimized</done>
</task>

<task type="auto">
  <name>Task 4: Performance Testing</name>
  <files>N/A (API testing)</files>
  <action>
    Measure performance after optimizations:
    1. Test all endpoints with curl:
       ```bash
       # Room inspections
       curl -w "@curl-format.txt" -o /dev/null -s \
         https://cacustodialcommand.up.railway.app/api/room-inspections
       
       # Inspections
       curl -w "@curl-format.txt" -o /dev/null -s \
         https://cacustodialcommand.up.railway.app/api/inspections
       
       # Test with pagination
       curl -w "@curl-format.txt" -o /dev/null -s \
         "https://cacustodialcommand.up.railway.app/api/room-inspections?limit=20"
       ```
    2. Record metrics:
       - Response time (before and after)
       - Time to first byte
       - Total transfer time
    3. Test with various loads:
       - Single request
       - Multiple concurrent requests
       - With filters applied
    4. Verify all endpoints under 1 second
    5. Document performance improvements:
       - Calculate percentage improvement
       - Note any trade-offs made
  </action>
  <verify>All endpoints respond in under 1 second</verify>
  <done>Performance verified and documented</done>
</task>

<task type="auto">
  <name>Task 5: Document Performance Changes</name>
  <files>
    - .planning/phases/02-recommendations/02-03-PERFORMANCE-SUMMARY.md
  </files>
  <action>
    Create performance optimization report:
    1. Document baseline metrics (from Phase 01):
       - /api/room-inspections: 1.67s
       - /api/inspections: 1.06s
       - Other endpoints
    2. Document optimizations made:
       - Pagination added
       - Filtering implemented
       - Query optimizations
       - Index usage
    3. Document final metrics:
       - /api/room-inspections: [new time]
       - /api/inspections: [new time]
       - Improvement percentages
    4. List code changes:
       - Files modified
       - Lines changed
       - New functions added
    5. Provide recommendations:
       - Future monitoring strategy
       - When to add more optimization
       - Scaling considerations
    6. Commit changes with descriptive messages
  </action>
  <verify>SUMMARY.md created with before/after metrics</verify>
  <done>Performance optimization documented</done>
</task>

</tasks>

<verification>
- [ ] Room inspections query analyzed
- [ ] Endpoint optimized with pagination/filtering
- [ ] Other slow queries reviewed
- [ ] All endpoints under 1 second
- [ ] Performance metrics documented
- [ ] SUMMARY.md created
</verification>

<success_criteria>
Performance optimization complete with:
- /api/room-inspections response time < 1 second
- All list endpoints paginated
- Query efficiency improved
- Measurable performance gains documented
</success_criteria>

<output>
After completion, create `.planning/phases/02-recommendations/02-03-PERFORMANCE-SUMMARY.md`
</output>
