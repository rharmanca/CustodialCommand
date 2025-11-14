/**
 * DATABASE RETRY LOGIC AND FAILOVER HANDLING
 *
 * Provides resilient database operations with:
 * - Exponential backoff retry logic
 * - Connection pool health monitoring
 * - Automatic failover attempts
 * - Query timeout handling
 * - Circuit breaker pattern
 */

import { logger } from './logger';

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  timeoutMs?: number;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

class DatabaseRetryManager {
  private readonly defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    timeoutMs: 10000
  };

  private failureCount = 0;
  private readonly failureThreshold = 10;
  private readonly failureWindowMs = 60000; // 1 minute
  private lastFailureTime: number = 0;
  private circuitBroken = false;

  /**
   * Execute database operation with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options?: RetryOptions,
    operationName: string = 'database operation'
  ): Promise<RetryResult<T>> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: Error | undefined;

    // Check if circuit breaker is open
    if (this.circuitBroken) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.failureWindowMs) {
        logger.warn('Circuit breaker is open, rejecting operation', {
          operation: operationName,
          failureCount: this.failureCount,
          timeSinceLastFailure
        });
        return {
          success: false,
          error: new Error('Circuit breaker is open - too many recent failures'),
          attempts: 0,
          totalDuration: Date.now() - startTime
        };
      } else {
        // Reset circuit breaker after window passes
        logger.info('Circuit breaker reset after timeout window', {
          operation: operationName
        });
        this.circuitBroken = false;
        this.failureCount = 0;
      }
    }

    // Attempt operation with retries
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        logger.debug('Executing database operation', {
          operation: operationName,
          attempt: attempt + 1,
          maxAttempts: opts.maxRetries + 1
        });

        // Execute with timeout
        const result = await this.executeWithTimeout(
          operation,
          opts.timeoutMs,
          operationName
        );

        // Success - reset failure tracking
        this.failureCount = 0;
        this.circuitBroken = false;

        const totalDuration = Date.now() - startTime;
        logger.info('Database operation succeeded', {
          operation: operationName,
          attempts: attempt + 1,
          duration: totalDuration
        });

        return {
          success: true,
          data: result,
          attempts: attempt + 1,
          totalDuration
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.warn('Database operation attempt failed', {
          operation: operationName,
          attempt: attempt + 1,
          maxAttempts: opts.maxRetries + 1,
          error: lastError.message,
          willRetry: attempt < opts.maxRetries
        });

        // Track failures
        this.recordFailure();

        // Don't retry on last attempt
        if (attempt >= opts.maxRetries) {
          break;
        }

        // Calculate exponential backoff delay
        const delay = Math.min(
          opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt),
          opts.maxDelayMs
        );

        logger.debug('Waiting before retry', {
          operation: operationName,
          delayMs: delay,
          nextAttempt: attempt + 2
        });

        // Wait before retry
        await this.sleep(delay);
      }
    }

    // All retries exhausted
    const totalDuration = Date.now() - startTime;
    logger.error('Database operation failed after all retries', {
      operation: operationName,
      attempts: opts.maxRetries + 1,
      totalDuration,
      error: lastError?.message
    });

    return {
      success: false,
      error: lastError,
      attempts: opts.maxRetries + 1,
      totalDuration
    };
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation "${operationName}" timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      )
    ]);
  }

  /**
   * Record operation failure and check circuit breaker threshold
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.circuitBroken = true;
      logger.error('Circuit breaker opened due to excessive failures', {
        failureCount: this.failureCount,
        threshold: this.failureThreshold,
        windowMs: this.failureWindowMs
      });
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current circuit breaker status
   */
  getCircuitStatus(): { broken: boolean; failureCount: number; lastFailureTime: number } {
    return {
      broken: this.circuitBroken,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  /**
   * Manually reset circuit breaker (for testing or manual recovery)
   */
  resetCircuit(): void {
    this.circuitBroken = false;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    logger.info('Circuit breaker manually reset');
  }
}

// Export singleton instance
export const dbRetryManager = new DatabaseRetryManager();

/**
 * Helper function for common database query patterns
 */
export async function retryDatabaseQuery<T>(
  queryFn: () => Promise<T>,
  operationName: string,
  options?: RetryOptions
): Promise<T> {
  const result = await dbRetryManager.executeWithRetry(
    queryFn,
    options,
    operationName
  );

  if (!result.success) {
    throw result.error || new Error(`Database operation "${operationName}" failed`);
  }

  return result.data as T;
}

/**
 * Helper function for database writes with longer timeouts
 */
export async function retryDatabaseWrite<T>(
  writeFn: () => Promise<T>,
  operationName: string
): Promise<T> {
  return retryDatabaseQuery(
    writeFn,
    operationName,
    {
      maxRetries: 3,
      initialDelayMs: 200,
      timeoutMs: 15000 // Longer timeout for writes
    }
  );
}

/**
 * Helper function for critical operations with more retries
 */
export async function retryDatabaseCritical<T>(
  criticalFn: () => Promise<T>,
  operationName: string
): Promise<T> {
  return retryDatabaseQuery(
    criticalFn,
    operationName,
    {
      maxRetries: 5,
      initialDelayMs: 500,
      maxDelayMs: 10000,
      timeoutMs: 20000 // Much longer timeout for critical ops
    }
  );
}
