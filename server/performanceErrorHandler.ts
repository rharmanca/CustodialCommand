import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { metricsCollector } from './monitoring';

interface ErrorContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  timestamp: number;
  duration?: number;
}

interface PerformanceError extends Error {
  statusCode?: number;
  code?: string;
  context?: ErrorContext;
  isOperational?: boolean;
}

// Enhanced error class with performance context
class EnhancedError extends Error implements PerformanceError {
  public statusCode: number;
  public code: string;
  public context: ErrorContext;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    context?: Partial<ErrorContext>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.context = {
      timestamp: Date.now(),
      ...context
    } as ErrorContext;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Performance-optimized error handling middleware
export const performanceErrorHandler = (
  error: PerformanceError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = process.hrtime.bigint();

  // Add performance context to error
  if (!error.context) {
    error.context = { timestamp: Date.now() };
  }

  // Enhance error context with request details
  error.context = {
    ...error.context,
    requestId: (req as any).requestId,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    method: req.method,
    url: req.originalUrl || req.url
  };

  // Log error with performance metrics
  const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to milliseconds

  // Log error efficiently
  const errorLog = {
    errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    context: error.context,
    stack: error.stack,
    duration: `${duration.toFixed(2)}ms`,
    // Include performance metrics
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };

  logger.error('Performance error occurred', errorLog);

  // Update metrics
  metricsCollector.increment('errors_total');
  metricsCollector.increment(`errors_${error.statusCode}`);
  metricsCollector.increment(`errors_${error.code}`);

  // Send optimized error response
  const errorResponse = {
    success: false,
    error: {
      id: errorLog.errorId,
      code: error.code,
      message: getErrorMessage(error),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        context: error.context
      })
    },
    timestamp: new Date().toISOString(),
    // Add performance headers
    'X-Error-Duration': `${duration.toFixed(2)}ms`
  };

  // Check if headers already sent before trying to send response
  if (!res.headersSent) {
    // Set appropriate headers
    res.set({
      'X-Error-Id': errorLog.errorId,
      'X-Error-Code': error.code,
      'X-Content-Type-Options': 'nosniff'
    });

    // Send error response
    res.status(error.statusCode).json(errorResponse);
  } else {
    // Headers already sent - just log the error
    logger.warn('Headers already sent in performance error handler', {
      errorId: errorLog.errorId,
      statusCode: error.statusCode,
      path: req.path
    });
  }
};

// Optimized error message helper
function getErrorMessage(error: PerformanceError): string {
  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    if (error.statusCode >= 500) {
      return 'Internal server error';
    }
  }

  return error.message || 'An unexpected error occurred';
}

// Async error wrapper to handle uncaught promise rejections
export const asyncErrorHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = process.hrtime.bigint();

    Promise.resolve(fn(req, res, next))
      .catch((error: any) => {
        const duration = Number(process.hrtime.bigint() - startTime) / 1000000;

        // Enhance error with performance context
        if (!(error instanceof EnhancedError)) {
          error = new EnhancedError(
            error.message || 'Async operation failed',
            error.statusCode || 500,
            error.code || 'ASYNC_ERROR',
            {
              requestId: (req as any).requestId,
              method: req.method,
              url: req.originalUrl,
              duration,
              timestamp: Date.now()
            }
          );
        }

        next(error);
      });
  };
};

// Performance-specific error creators
export const createDatabaseError = (message: string, context?: Partial<ErrorContext>): EnhancedError => {
  return new EnhancedError(
    message,
    503,
    'DATABASE_ERROR',
    { ...context, type: 'database' }
  );
};

export const createCacheError = (message: string, context?: Partial<ErrorContext>): EnhancedError => {
  return new EnhancedError(
    message,
    503,
    'CACHE_ERROR',
    { ...context, type: 'cache' }
  );
};

export const createTimeoutError = (message: string, context?: Partial<ErrorContext>): EnhancedError => {
  return new EnhancedError(
    message,
    408,
    'TIMEOUT_ERROR',
    { ...context, type: 'timeout' }
  );
};

export const createRateLimitError = (message: string, context?: Partial<ErrorContext>): EnhancedError => {
  return new EnhancedError(
    message,
    429,
    'RATE_LIMIT_ERROR',
    { ...context, type: 'rate_limit' }
  );
};

export const createValidationError = (message: string, context?: Partial<ErrorContext>): EnhancedError => {
  return new EnhancedError(
    message,
    400,
    'VALIDATION_ERROR',
    { ...context, type: 'validation' }
  );
};

// Error recovery strategies
export const errorRecoveryMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only add headers if not already sent
  // Wrap res.json to add recovery information
  const originalJson = res.json;
  res.json = function(data: any) {
    if (res.statusCode >= 400 && !res.headersSent) {
      // Add recovery information to error responses
      if (data && typeof data === 'object') {
        // Use actual rate limit reset time for 429, otherwise a short retry
        const retryAfter = res.statusCode === 429
          ? Math.ceil((parseInt(res.getHeader('ratelimit-reset') as string) || 900))
          : 5;

        data.recovery = {
          retryAfter,
          canRetry: res.statusCode < 500 || res.statusCode === 503,
          maxRetries: res.statusCode === 429 ? 1 : 3
        };
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

// Graceful degradation for performance issues
export const gracefulDegradation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if we're under high load
  const memUsage = process.memoryUsage();
  const memoryPressure = memUsage.heapUsed / memUsage.heapTotal;

  if (memoryPressure > 0.9) {
    logger.warn('High memory pressure detected, enabling graceful degradation', {
      memoryPressure: `${(memoryPressure * 100).toFixed(1)}%`,
      path: req.path
    });

    // Only set headers if not already sent
    if (!res.headersSent) {
      // Enable graceful degradation mode
      res.set('X-Graceful-Degradation', 'true');
    }

    // For non-critical requests, serve simplified responses
    if (req.path.startsWith('/api/') && !req.path.includes('/admin/')) {
      // Add query parameter to request simplified data
      req.query.simplified = 'true';
    }
  }

  next();
};

// Circuit breaker pattern for performance protection
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly resetTimeout: number;

  constructor(threshold: number = 5, timeout: number = 60000, resetTimeout: number = 30000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
  }

  async execute<T>(operation: () => Promise<T>, context?: string): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker entering HALF_OPEN state', { context });
      } else {
        throw new EnhancedError(
          'Service temporarily unavailable',
          503,
          'CIRCUIT_BREAKER_OPEN',
          { context, state: this.state }
        );
      }
    }

    try {
      const result = await operation();

      if (this.state === 'HALF_OPEN') {
        this.reset();
        logger.info('Circuit breaker reset to CLOSED state', { context });
      }

      return result;
    } catch (error) {
      this.recordFailure(context);
      throw error;
    }
  }

  private recordFailure(context?: string): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      logger.warn('Circuit breaker opened', {
        failures: this.failures,
        threshold: this.threshold,
        context
      });
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  getState(): string {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

// Create circuit breakers for different operations
export const databaseCircuitBreaker = new CircuitBreaker(5, 60000, 30000);
export const cacheCircuitBreaker = new CircuitBreaker(10, 30000, 10000);
export const fileUploadCircuitBreaker = new CircuitBreaker(3, 120000, 60000);

// Circuit breaker middleware
export const circuitBreakerMiddleware = (
  circuitBreaker: CircuitBreaker,
  operation: string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only add headers if not already sent
    if (!res.headersSent) {
      // Add circuit breaker status to headers
      res.set('X-Circuit-Breaker-Status', circuitBreaker.getState());
      res.set('X-Circuit-Breaker-Failures', circuitBreaker.getFailures().toString());
    }

    next();
  };
};