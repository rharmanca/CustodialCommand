import { AsyncLocalStorage } from 'async_hooks';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  context?: Record<string, any>;
  requestId?: string;
  correlationId?: string;
}

interface RequestContext {
  requestId: string;
  correlationId?: string;
  userId?: number;
  username?: string;
  ip?: string;
}

// AsyncLocalStorage for request context (thread-safe in async operations)
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

class Logger {
  /**
   * Get current request context from AsyncLocalStorage
   */
  private getRequestContext(): RequestContext | undefined {
    return asyncLocalStorage.getStore();
  }

  private log(level: LogEntry['level'], message: string, context?: Record<string, any>) {
    const requestContext = this.getRequestContext();

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      requestId: requestContext?.requestId,
      correlationId: requestContext?.correlationId,
    };

    // Add user context if available
    if (requestContext?.userId) {
      entry.context = {
        ...entry.context,
        userId: requestContext.userId,
        username: requestContext.username,
        ip: requestContext.ip,
      };
    }

    // In production, you'd send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      const requestStr = requestContext?.requestId ? ` [${requestContext.requestId}]` : '';
      const correlationStr = requestContext?.correlationId ? ` (${requestContext.correlationId})` : '';
      console.log(`[${entry.timestamp}] ${level}${requestStr}${correlationStr}: ${message}${contextStr}`);
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('WARN', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('ERROR', message, context);
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, context);
    }
  }

  /**
   * Update user context for current request (for post-authentication logging)
   */
  updateUserContext(userId: number, username: string) {
    const currentContext = this.getRequestContext();
    if (currentContext) {
      currentContext.userId = userId;
      currentContext.username = username;
    }
  }
}

export const logger = new Logger();

/**
 * Request ID middleware with AsyncLocalStorage for proper request correlation
 * This ensures request IDs are properly tracked across async operations
 */
export const requestIdMiddleware = (req: any, res: any, next: any) => {
  // Generate unique request ID
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Extract correlation ID from headers (for distributed tracing)
  const correlationId = req.headers['x-correlation-id'] ||
                        req.headers['x-request-id'] ||
                        requestId;

  // Create request context
  const requestContext: RequestContext = {
    requestId,
    correlationId,
    ip: req.ip || req.connection.remoteAddress,
  };

  // Set headers
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', correlationId);

  // Run the rest of the middleware chain with this context
  asyncLocalStorage.run(requestContext, () => {
    next();
  });
};

/**
 * Export asyncLocalStorage for use in other modules if needed
 */
export { asyncLocalStorage };