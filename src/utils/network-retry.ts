/**
 * Network Retry Utility with Exponential Backoff
 *
 * Provides automatic retry logic for failed network requests with:
 * - Exponential backoff (1s, 2s, 4s, 8s)
 * - Circuit breaker pattern
 * - Configurable retry attempts
 * - Error classification (retryable vs non-retryable)
 */

export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  resetTimeout?: number;
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;

  constructor(config: CircuitBreakerConfig = {}) {
    this.failureThreshold = config.failureThreshold ?? 5;
    this.resetTimeout = config.resetTimeout ?? 60000; // 1 minute
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN - too many failures');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime >= this.resetTimeout;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.warn(
        `Circuit breaker opened after ${this.failureCount} failures. Will retry in ${this.resetTimeout}ms`,
      );
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

// Global circuit breaker instance
const globalCircuitBreaker = new CircuitBreaker();

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  // Network errors are retryable
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return true;
  }

  // Timeout errors are retryable
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return true;
  }

  // Check for HTTP status codes if available
  if ('status' in error) {
    const status = (error as { status: number }).status;
    // Retry on 5xx server errors and 429 (rate limit)
    return status >= 500 || status === 429;
  }

  // Don't retry by default
  return false;
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * @example
 * ```typescript
 * const data = await retryWithBackoff(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = isRetryableError,
    onRetry,
  } = config;

  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Use circuit breaker for execution
      return await globalCircuitBreaker.execute(fn);
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's the last attempt
      if (attempt === maxAttempts - 1) {
        break;
      }

      // Don't retry if error is not retryable
      if (!shouldRetry(lastError)) {
        break;
      }

      // Calculate delay and notify
      const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffMultiplier);

      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      console.warn(
        `Retry attempt ${attempt + 1}/${maxAttempts} after ${delay}ms. Error: ${lastError.message}`,
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All retries exhausted
  throw lastError!;
}

/**
 * Fetch with automatic retry
 *
 * @example
 * ```typescript
 * const response = await fetchWithRetry('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify({ key: 'value' })
 * });
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig?: RetryConfig,
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, options);

    // Throw error for non-OK responses
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & {
        status: number;
      };
      error.status = response.status;
      throw error;
    }

    return response;
  }, retryConfig);
}

/**
 * Get circuit breaker status
 */
export function getCircuitBreakerStatus() {
  return {
    state: globalCircuitBreaker.getState(),
    isOpen: globalCircuitBreaker.getState() === CircuitState.OPEN,
  };
}

/**
 * Reset circuit breaker (useful for testing or manual recovery)
 */
export function resetCircuitBreaker() {
  globalCircuitBreaker.reset();
}

export { CircuitState };
