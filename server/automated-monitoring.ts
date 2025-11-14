/**
 * AUTOMATED HEALTH MONITORING AND ALERTING SYSTEM
 *
 * Provides comprehensive application health monitoring with:
 * - Periodic health checks
 * - Automatic recovery attempts
 * - Performance degradation detection
 * - Resource usage monitoring
 * - Alert generation and logging
 */

import { logger } from './logger';

interface HealthMetrics {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'critical';
  checks: {
    database: boolean;
    memory: boolean;
    responseTime: boolean;
    errorRate: boolean;
  };
  metrics: {
    memoryUsagePercent: number;
    avgResponseTime: number;
    errorRate: number;
    requestsPerMinute: number;
  };
  alerts: Alert[];
}

interface Alert {
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  metric?: string;
  value?: number;
  threshold?: number;
}

class AutomatedMonitoringService {
  private isMonitoring = false;
  private checkInterval = 60000; // 1 minute
  private intervalId?: NodeJS.Timeout;
  private metrics: HealthMetrics[] = [];
  private maxMetricsHistory = 100;

  // Thresholds for alerting
  private readonly thresholds = {
    memoryUsagePercent: 85,     // Alert if memory usage > 85%
    avgResponseTime: 3000,       // Alert if avg response > 3s
    errorRate: 0.05,             // Alert if error rate > 5%
    criticalMemory: 95,          // Critical alert at 95%
    criticalResponseTime: 5000   // Critical alert at 5s
  };

  // Request tracking for metrics
  private requestStats = {
    total: 0,
    errors: 0,
    responseTimes: [] as number[],
    lastReset: Date.now()
  };

  /**
   * Start automated monitoring
   */
  start(): void {
    if (this.isMonitoring) {
      logger.warn('Automated monitoring already running');
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting automated health monitoring', {
      interval: `${this.checkInterval / 1000}s`,
      thresholds: this.thresholds
    });

    // Run initial check
    this.performHealthCheck();

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
  }

  /**
   * Stop automated monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.isMonitoring = false;
    logger.info('Stopped automated health monitoring');
  }

  /**
   * Track request for metrics
   */
  trackRequest(responseTime: number, isError: boolean): void {
    this.requestStats.total++;
    if (isError) {
      this.requestStats.errors++;
    }
    this.requestStats.responseTimes.push(responseTime);

    // Reset stats every minute
    if (Date.now() - this.requestStats.lastReset > 60000) {
      this.requestStats = {
        total: 0,
        errors: 0,
        responseTimes: [],
        lastReset: Date.now()
      };
    }
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const timestamp = new Date().toISOString();
    const alerts: Alert[] = [];

    try {
      // Check database connectivity
      const dbHealthy = await this.checkDatabase();
      if (!dbHealthy) {
        alerts.push({
          severity: 'critical',
          message: 'Database connection failed',
          timestamp,
          metric: 'database'
        });
      }

      // Check memory usage
      const memMetrics = this.checkMemory();
      if (memMetrics.usagePercent > this.thresholds.criticalMemory) {
        alerts.push({
          severity: 'critical',
          message: `Critical memory usage: ${memMetrics.usagePercent}%`,
          timestamp,
          metric: 'memory',
          value: memMetrics.usagePercent,
          threshold: this.thresholds.criticalMemory
        });
      } else if (memMetrics.usagePercent > this.thresholds.memoryUsagePercent) {
        alerts.push({
          severity: 'warning',
          message: `High memory usage: ${memMetrics.usagePercent}%`,
          timestamp,
          metric: 'memory',
          value: memMetrics.usagePercent,
          threshold: this.thresholds.memoryUsagePercent
        });
      }

      // Check response times
      const avgResponseTime = this.calculateAverageResponseTime();
      if (avgResponseTime > this.thresholds.criticalResponseTime) {
        alerts.push({
          severity: 'critical',
          message: `Critical response time: ${avgResponseTime}ms`,
          timestamp,
          metric: 'responseTime',
          value: avgResponseTime,
          threshold: this.thresholds.criticalResponseTime
        });
      } else if (avgResponseTime > this.thresholds.avgResponseTime) {
        alerts.push({
          severity: 'warning',
          message: `Slow response time: ${avgResponseTime}ms`,
          timestamp,
          metric: 'responseTime',
          value: avgResponseTime,
          threshold: this.thresholds.avgResponseTime
        });
      }

      // Check error rate
      const errorRate = this.calculateErrorRate();
      if (errorRate > this.thresholds.errorRate) {
        alerts.push({
          severity: 'critical',
          message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
          timestamp,
          metric: 'errorRate',
          value: errorRate,
          threshold: this.thresholds.errorRate
        });
      }

      // Determine overall health status
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      const status: HealthMetrics['status'] =
        criticalAlerts.length > 0 ? 'critical' :
        alerts.length > 0 ? 'degraded' :
        'healthy';

      // Create health metrics
      const healthMetrics: HealthMetrics = {
        timestamp,
        status,
        checks: {
          database: dbHealthy,
          memory: memMetrics.usagePercent < this.thresholds.memoryUsagePercent,
          responseTime: avgResponseTime < this.thresholds.avgResponseTime,
          errorRate: errorRate < this.thresholds.errorRate
        },
        metrics: {
          memoryUsagePercent: memMetrics.usagePercent,
          avgResponseTime,
          errorRate,
          requestsPerMinute: this.requestStats.total
        },
        alerts
      };

      // Store metrics
      this.metrics.push(healthMetrics);
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics.shift();
      }

      // Log health status
      if (status === 'healthy') {
        logger.info('Health check passed', {
          status,
          metrics: healthMetrics.metrics
        });
      } else {
        logger.warn(`Health check ${status}`, {
          status,
          metrics: healthMetrics.metrics,
          alerts
        });

        // Attempt automatic recovery for certain issues
        await this.attemptRecovery(alerts);
      }

    } catch (error) {
      logger.error('Health check execution failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check database connectivity with timeout
   */
  private async checkDatabase(): Promise<boolean> {
    try {
      const { pool } = await import('./db');
      await Promise.race([
        pool.query('SELECT 1'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        )
      ]);
      return true;
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): { usagePercent: number; used: number; total: number } {
    const memUsage = process.memoryUsage();
    const used = Math.round(memUsage.heapUsed / 1024 / 1024);
    const total = Math.round(memUsage.heapTotal / 1024 / 1024);
    const usagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    return { usagePercent, used, total };
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(): number {
    if (this.requestStats.responseTimes.length === 0) {
      return 0;
    }

    const sum = this.requestStats.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.requestStats.responseTimes.length);
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    if (this.requestStats.total === 0) {
      return 0;
    }

    return this.requestStats.errors / this.requestStats.total;
  }

  /**
   * Attempt automatic recovery for certain issues
   */
  private async attemptRecovery(alerts: Alert[]): Promise<void> {
    for (const alert of alerts) {
      switch (alert.metric) {
        case 'memory':
          // Attempt garbage collection if critical memory usage
          if (alert.severity === 'critical' && global.gc) {
            logger.info('Attempting garbage collection due to critical memory usage');
            global.gc();
          }
          break;

        case 'database':
          // Log database connection failure for manual investigation
          logger.error('Database connection recovery needed - manual intervention required');
          break;

        default:
          // Log other alerts for monitoring
          logger.warn('Alert requires monitoring', { alert });
      }
    }
  }

  /**
   * Get current health status
   */
  getCurrentHealth(): HealthMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  /**
   * Get health history
   */
  getHealthHistory(limit: number = 20): HealthMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    const current = this.getCurrentHealth();
    return current?.alerts || [];
  }
}

// Export singleton instance
export const automatedMonitoring = new AutomatedMonitoringService();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  automatedMonitoring.start();
}
