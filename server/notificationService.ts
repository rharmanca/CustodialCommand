/**
 * Notification Service
 * 
 * Handles email alerts for inspection backlog thresholds using Resend API.
 * Scheduled daily at 8am on weekdays with 24h cooldown suppression.
 */

import { Resend } from 'resend';
import cron from 'node-cron';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { inspections } from '../shared/schema.js';
import { eq, count, sql } from 'drizzle-orm';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const COOLDOWN_FILE = join(__dirname, '../.notification-cooldown');
const THRESHOLD_COUNT = 10; // Alert if 10+ pending inspections
const THRESHOLD_HOURS = 48; // Alert if oldest pending is 48+ hours
const ALERT_RECIPIENT = process.env.ALERT_RECIPIENT || 'rharman@collegiateacademies.org';
const FROM_EMAIL = 'Custodial Command <alerts@cacustodialcommand.up.railway.app>';

// Initialize Resend if API key is available
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface PendingStats {
  totalCount: number;
  schoolBreakdown: { school: string; count: number }[];
  oldestPendingAge: number; // in hours
}

interface AlertResult {
  sent: boolean;
  message: string;
}

/**
 * Get statistics about pending inspections
 */
export async function getPendingInspectionStats(): Promise<PendingStats> {
  try {
    // Get total count of pending inspections
    const countResult = await db
      .select({ total: count() })
      .from(inspections)
      .where(eq(inspections.status, 'pending_review'));

    const totalCount = countResult[0]?.total || 0;

    // Get school breakdown
    const schoolResult = await db
      .select({
        school: inspections.school,
        count: count(),
      })
      .from(inspections)
      .where(eq(inspections.status, 'pending_review'))
      .groupBy(inspections.school);

    const schoolBreakdown = schoolResult.map(row => ({
      school: row.school,
      count: row.count,
    }));

    // Get oldest pending inspection age
    const oldestResult = await db
      .select({
        oldest: sql<Date>`MIN(${inspections.captureTimestamp})`,
      })
      .from(inspections)
      .where(eq(inspections.status, 'pending_review'));

    let oldestPendingAge = 0;
    if (oldestResult[0]?.oldest) {
      const oldestDate = new Date(oldestResult[0].oldest);
      const now = new Date();
      oldestPendingAge = (now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60); // Convert to hours
    }

    logger.info('Pending inspection stats retrieved', {
      totalCount,
      schoolCount: schoolBreakdown.length,
      oldestPendingAge: Math.round(oldestPendingAge * 100) / 100,
    });

    return {
      totalCount,
      schoolBreakdown,
      oldestPendingAge,
    };
  } catch (error) {
    logger.error('Failed to get pending inspection stats', { error });
    throw error;
  }
}

/**
 * Check if threshold is exceeded
 */
export function checkThreshold(stats: PendingStats): boolean {
  const countExceeded = stats.totalCount >= THRESHOLD_COUNT;
  const ageExceeded = stats.oldestPendingAge >= THRESHOLD_HOURS;
  
  const exceeded = countExceeded || ageExceeded;
  
  if (exceeded) {
    logger.info('Threshold exceeded', {
      totalCount: stats.totalCount,
      thresholdCount: THRESHOLD_COUNT,
      oldestAge: Math.round(stats.oldestPendingAge * 100) / 100,
      thresholdAge: THRESHOLD_HOURS,
      reason: countExceeded ? 'count' : 'age',
    });
  }
  
  return exceeded;
}

/**
 * Check if alert should be sent (24h cooldown)
 */
export function shouldSendAlert(): boolean {
  try {
    if (!existsSync(COOLDOWN_FILE)) {
      logger.info('No cooldown file exists, allowing alert');
      return true;
    }

    const lastSent = readFileSync(COOLDOWN_FILE, 'utf-8');
    const lastSentTime = parseInt(lastSent, 10);
    
    if (isNaN(lastSentTime)) {
      logger.warn('Invalid cooldown timestamp, allowing alert');
      return true;
    }

    const now = Date.now();
    const hoursSinceLastAlert = (now - lastSentTime) / (1000 * 60 * 60);
    
    if (hoursSinceLastAlert >= 24) {
      logger.info('Cooldown expired, allowing alert', { hoursSinceLastAlert: Math.round(hoursSinceLastAlert * 100) / 100 });
      return true;
    }
    
    logger.info('Alert suppressed by cooldown', { hoursSinceLastAlert: Math.round(hoursSinceLastAlert * 100) / 100 });
    return false;
  } catch (error) {
    logger.error('Error checking cooldown, allowing alert', { error });
    return true;
  }
}

/**
 * Record that an alert was sent
 */
export function recordAlertSent(): void {
  try {
    writeFileSync(COOLDOWN_FILE, Date.now().toString());
    logger.info('Alert sent timestamp recorded');
  } catch (error) {
    logger.error('Failed to record alert timestamp', { error });
  }
}

/**
 * Generate HTML email content
 */
function generateEmailHtml(stats: PendingStats): string {
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const schoolList = stats.schoolBreakdown
    .map(s => `<li>${s.school}: <strong>${s.count}</strong> pending</li>`)
    .join('');

  const oldestAgeDays = Math.floor(stats.oldestPendingAge / 24);
  const oldestAgeHours = Math.round(stats.oldestPendingAge % 24);
  const oldestAgeText = oldestAgeDays > 0 
    ? `${oldestAgeDays} days, ${oldestAgeHours} hours`
    : `${oldestAgeHours} hours`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inspection Backlog Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 25px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-top: 5px;
    }
    .school-list {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .school-list h3 {
      margin-top: 0;
      color: #333;
    }
    .school-list ul {
      list-style: none;
      padding: 0;
    }
    .school-list li {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .school-list li:last-child {
      border-bottom: none;
    }
    .cta-button {
      display: block;
      background: #667eea;
      color: white;
      text-decoration: none;
      padding: 15px 30px;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
      margin: 25px 0;
    }
    .cta-button:hover {
      background: #5a67d8;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999;
      margin-top: 20px;
    }
    .alert-note {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 Inspection Backlog Alert</h1>
    <p>Generated on ${now}</p>
  </div>
  
  <div class="content">
    <div class="alert-note">
      <strong>Alert triggered:</strong> Your inspection backlog has exceeded the configured threshold.
      Next alert will be sent in 24 hours if the threshold is still exceeded.
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.totalCount}</div>
        <div class="stat-label">Total Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${oldestAgeText}</div>
        <div class="stat-label">Oldest Pending</div>
      </div>
    </div>
    
    <div class="school-list">
      <h3>School Breakdown</h3>
      <ul>
        ${schoolList}
      </ul>
    </div>
    
    <a href="https://cacustodialcommand.up.railway.app/review" class="cta-button">
      Review Pending Inspections →
    </a>
    
    <div class="footer">
      <p>This is an automated alert from Custodial Command.</p>
      <p>To adjust alert settings, contact your system administrator.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send notification email via Resend
 */
export async function sendNotificationEmail(stats: PendingStats): Promise<boolean> {
  if (!resend) {
    logger.warn('Resend not configured, skipping email send');
    return false;
  }

  try {
    const subject = `[Custodial Command] ${stats.totalCount} inspections pending review`;
    const html = generateEmailHtml(stats);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ALERT_RECIPIENT,
      subject,
      html,
    });

    if (error) {
      logger.error('Failed to send notification email', { error });
      return false;
    }

    logger.info('Notification email sent successfully', {
      emailId: data?.id,
      recipient: ALERT_RECIPIENT,
      pendingCount: stats.totalCount,
    });

    return true;
  } catch (error) {
    logger.error('Exception sending notification email', { error });
    return false;
  }
}

/**
 * Orchestrate alert check and send
 */
export async function sendAlertIfNeeded(): Promise<AlertResult> {
  try {
    // Get current stats
    const stats = await getPendingInspectionStats();

    // Check threshold
    if (!checkThreshold(stats)) {
      return {
        sent: false,
        message: `No alert needed: ${stats.totalCount} pending (threshold: ${THRESHOLD_COUNT}), oldest: ${Math.round(stats.oldestPendingAge * 100) / 100}h (threshold: ${THRESHOLD_HOURS}h)`,
      };
    }

    // Check cooldown
    if (!shouldSendAlert()) {
      return {
        sent: false,
        message: 'Alert suppressed: within 24h cooldown period',
      };
    }

    // Check if Resend is configured
    if (!resendApiKey) {
      logger.warn('RESEND_API_KEY not configured, would send email but skipping');
      return {
        sent: false,
        message: 'Email not sent: RESEND_API_KEY not configured',
      };
    }

    // Send email
    const sent = await sendNotificationEmail(stats);
    
    if (sent) {
      recordAlertSent();
      return {
        sent: true,
        message: `Alert sent: ${stats.totalCount} pending inspections across ${stats.schoolBreakdown.length} schools`,
      };
    } else {
      return {
        sent: false,
        message: 'Alert failed: email send error',
      };
    }
  } catch (error) {
    logger.error('Error in sendAlertIfNeeded', { error });
    return {
      sent: false,
      message: `Alert failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Schedule daily notification job
 */
export function scheduleNotifications(): void {
  if (!cron.validate('0 8 * * 1-5')) {
    logger.error('Invalid cron expression');
    return;
  }

  // Schedule: 8am, Monday-Friday (1-5)
  cron.schedule('0 8 * * 1-5', async () => {
    logger.info('Running scheduled notification check', {
      time: new Date().toISOString(),
      timezone: 'America/Chicago',
    });
    
    try {
      const result = await sendAlertIfNeeded();
      logger.info('Scheduled notification result', result);
    } catch (error) {
      logger.error('Scheduled notification failed', { error });
    }
  }, {
    timezone: 'America/Chicago',
  });

  logger.info('Notification scheduler initialized', {
    schedule: '0 8 * * 1-5',
    timezone: 'America/Chicago',
    thresholdCount: THRESHOLD_COUNT,
    thresholdHours: THRESHOLD_HOURS,
    resendConfigured: !!resendApiKey,
  });
}
