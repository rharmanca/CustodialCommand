# Phase 10: Notifications & Alerts - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Server-side email alerts via Resend when inspection backlog exceeds threshold. Purely backend implementation — no UI changes. Single hardcoded recipient: rharman@collegiateacademies.org.

</domain>

<decisions>
## Implementation Decisions

### Threshold Configuration
- **Trigger:** 10 pending inspections OR 48 hours since oldest pending
- **Rationale:** Triggers when actionable; 5 is too low, 20 is too late

### Alert Cadence
- **Schedule:** Daily at 8am
- **Rationale:** Single summary email beats hourly spam; facility staff check email mornings

### Email Content
- **Format:** Summary (count + school breakdown + oldest inspection age)
- **Rationale:** Enough context to prioritize; minimal requires clicking, detailed is overwhelming

### Suppression Strategy
- **Cooldown:** 24-hour minimum between alerts
- **Rationale:** One alert per day max; prevents annoyance if count fluctuates around threshold

### Timing Window
- **Active hours:** Weekdays 7am–7pm
- **Rationale:** Avoid weekend noise; custodial issues are business-hours concerns

### Email Format
- **Style:** HTML with basic styling
- **Rationale:** Professional look; plain text feels like spam, heavy CSS breaks in email clients

### Recipient
- **Single hardcoded address:** rharman@collegiateacademies.org
- **Rationale:** No UI for preferences; future phase can add multi-recipient support

### Claude's Discretion
- Exact HTML template styling
- Error handling for Resend API failures
- Logging of sent notifications
- Threshold configuration method (env var vs config file)

</decisions>

<specifics>
## Specific Ideas

**Suggested Email Template:**
```
Subject: [Custodial Command] 12 inspections pending review

You have 12 inspections awaiting review:
• Johnson High: 5 (oldest: 3 days ago)
• Lincoln Middle: 4 (oldest: 2 days ago)
• Central Elementary: 3 (oldest: 1 day ago)

→ Review queue: https://cacustodialcommand.up.railway.app/review
```

**Key Principles:**
- Keep it scannable at a glance
- Include direct link to action
- Show urgency via "oldest" timestamp

</specifics>

<deferred>
## Deferred Ideas

**Home page layout reorganization** — User mentioned Quick Capture and Review Inspections buttons need reorganization. This is a UI enhancement, NOT part of Phase 10 (server-side notifications only). Suggest for post-Milestone v2.0 UI polish phase.

</deferred>

---

*Phase: 10-notifications-alerts*
*Context gathered: 2026-02-19*
