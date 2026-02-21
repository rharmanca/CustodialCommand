---
phase: 02-recommendations
plan: 05
type: execute
wave: 3
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Error log monitoring is configured"
    - "Performance metrics tracking is set up"
    - "Monitoring documentation is complete"
    - "Alert thresholds are defined"
  artifacts:
    - path: "Monitoring configuration"
      provides: "Setup for ongoing monitoring"
    - path: "Runbook documentation"
      provides: "Procedures for common issues"
  key_links:
    - from: "Application"
      to: "Monitoring systems"
      via: "Health endpoints and logging"
---

<objective>
Set up monitoring and automation for ongoing application health, including error logging and performance metrics tracking.

Purpose: Establish long-term monitoring for production application
Output: Monitoring configuration and documentation
</objective>

<execution_context>
@C:/Users/veloc/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/phases/01-review-and-testing/01-08-CROSSCUTTING-SUMMARY.md

Existing Monitoring:
- Health endpoint: /health (active with uptime metrics)
- Metrics endpoint: /metrics (tracking 1013+ requests)
- Error logging: Server-side logging implemented
- Railway dashboard: Basic monitoring available

Gaps:
- No automated alerting configured
- No external monitoring (Pingdom, UptimeRobot)
- No log aggregation/analysis
- No performance trend tracking
</context>

<tasks>

<task type="auto">
  <name>Task 1: Review Current Monitoring</name>
  <files>
    - server/index.ts
    - server/logger.ts
  </files>
  <action>
    Document existing monitoring infrastructure:
    1. Check server/index.ts for:
       - Health check endpoint (/health)
       - Metrics endpoint (/metrics)
       - Error tracking
       - Request logging
    2. Check server/logger.ts for:
       - Log levels (debug, info, warn, error)
       - Log format (structured JSON?)
       - Log destinations (console, file, external?)
    3. Document Railway monitoring:
       - Dashboard metrics available
       - Alert capabilities
       - Log streaming
    4. Check for any existing:
       - Error tracking services (Sentry, etc.)
       - Performance monitoring (New Relic, etc.)
       - Uptime monitoring
    5. List what monitoring already exists
    6. Identify gaps that need filling
  </action>
  <verify>Current monitoring fully documented</verify>
  <done>Existing monitoring catalogued</done>
</task>

<task type="auto">
  <name>Task 2: Set Up External Uptime Monitoring</name>
  <files>N/A (external service setup)</files>
  <action>
    Configure external uptime monitoring:
    1. Choose monitoring service (free options):
       - UptimeRobot (free tier: 50 monitors, 5 min intervals)
       - Pingdom (free tier available)
       - Better Uptime (free tier)
    2. Set up monitors for:
       - Main application: https://cacustodialcommand.up.railway.app/
       - Health endpoint: https://cacustodialcommand.up.railway.app/health
       - API endpoint: https://cacustodialcommand.up.railway.app/api/inspections
    3. Configure alert settings:
       - Down for 5 minutes → Alert
       - Response time > 3s → Warning
       - SSL certificate expiry → Alert (30 days)
    4. Set up notification channels:
       - Email notifications
       - Optional: Slack, SMS
    5. Document monitor configuration:
       - URLs monitored
       - Check intervals
       - Alert thresholds
       - Notification recipients
    6. Test alerts (temporarily break monitor to verify)
  </action>
  <verify>Uptime monitoring active and alerts tested</verify>
  <done>External uptime monitoring configured</done>
</task>

<task type="auto">
  <name>Task 3: Configure Log Monitoring</name>
  <files>N/A (log analysis)</files>
  <action>
    Set up log monitoring and analysis:
    1. Access Railway logs:
       - Railway dashboard logs view
       - Log retention period
       - Export capabilities
    2. Identify error patterns to monitor:
       - Database connection errors
       - API 500 errors
       - Authentication failures
       - File upload errors
    3. Create log analysis queries:
       ```bash
       # Example patterns to search for
       ERROR
       "database connection"
       "failed"
       "500"
       "timeout"
       ```
    4. Set up log-based alerts if possible:
       - Error rate threshold (e.g., > 10 errors/hour)
       - Specific error patterns
    5. Document log locations:
       - Railway dashboard
       - Server log files (if persisted)
       - Application logs
    6. Create log analysis runbook:
       - How to access logs
       - Common error patterns
       - Troubleshooting steps
    7. Consider log aggregation service (optional):
       - Loggly, Papertrail, Splunk
       - Or stay with Railway native logging
  </action>
  <verify>Log monitoring configured and documented</verify>
  <done>Log monitoring set up</done>
</task>

<task type="auto">
  <name>Task 4: Define Performance Monitoring</name>
  <files>N/A (metrics setup)</files>
  <action>
    Establish performance monitoring:
    1. Document current metrics endpoints:
       - /health - uptime, database status
       - /metrics - request counts, performance
       - Application version, environment
    2. Set up regular performance checks:
       ```bash
       # Create monitoring script
       #!/bin/bash
       # Check every hour and log
       curl -s https://cacustodialcommand.up.railway.app/metrics | jq .
       ```
    3. Define performance thresholds:
       - Response time: < 1s (good), 1-3s (warning), > 3s (critical)
       - Error rate: < 1% (good), 1-5% (warning), > 5% (critical)
       - Uptime: > 99.9% target
    4. Set up performance trend tracking:
       - Weekly response time averages
       - Monthly uptime reports
       - Error rate trends
    5. Document performance baseline:
       - Current average response times
       - Peak usage patterns
       - Known slow endpoints
    6. Create performance runbook:
       - How to check performance
       - What to do if slow
       - Scaling procedures
  </action>
  <verify>Performance monitoring documented and thresholds defined</verify>
  <done>Performance monitoring established</done>
</task>

<task type="auto">
  <name>Task 5: Create Monitoring Documentation</name>
  <files>
    - .planning/phases/02-recommendations/02-05-MONITORING-SUMMARY.md
    - docs/monitoring-runbook.md
  </files>
  <action>
    Create comprehensive monitoring documentation:
    1. Document all monitoring components:
       - Health endpoint: /health
       - Metrics endpoint: /metrics
       - Uptime monitoring: [service name]
       - Log access: Railway dashboard
    2. Create monitoring runbook:
       - **Application Down**
         1. Check Railway status
         2. Check /health endpoint
         3. Review recent logs
         4. Restart if necessary
       - **Slow Performance**
         1. Check /metrics endpoint
         2. Review database performance
         3. Check for traffic spikes
       - **Database Issues**
         1. Verify /health database status
         2. Check connection pool
         3. Review slow queries
       - **Error Spikes**
         1. Check logs for patterns
         2. Identify affected endpoints
         3. Rollback if recent deployment
    3. Document alert contacts:
       - Primary contact
       - Escalation path
       - Response time expectations
    4. Create monitoring checklist:
       - Daily: Check uptime dashboard
       - Weekly: Review performance trends
       - Monthly: Analyze error patterns
    5. Document tool access:
       - Railway dashboard URL
       - Uptime monitoring dashboard
       - Log access instructions
    6. Set calendar reminders for monitoring reviews
  </action>
  <verify>Monitoring documentation complete</verify>
  <done>Monitoring runbook and documentation created</done>
</task>

</tasks>

<verification>
- [ ] Current monitoring reviewed and documented
- [ ] External uptime monitoring configured
- [ ] Log monitoring set up
- [ ] Performance thresholds defined
- [ ] Monitoring runbook created
- [ ] Alert contacts documented
- [ ] SUMMARY.md created
</verification>

<success_criteria>
Monitoring setup complete with:
- External uptime monitoring active
- Log monitoring configured
- Performance tracking established
- Runbook documentation complete
- Alert thresholds defined
</success_criteria>

<output>
After completion, create `.planning/phases/02-recommendations/02-05-MONITORING-SUMMARY.md`
</output>
