interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  context?: Record<string, any>;
  requestId?: string;
}

class Logger {
  private requestId: string | null = null;
  
  setRequestId(id: string) {
    this.requestId = id;
  }

  private log(level: LogEntry['level'], message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      requestId: this.requestId || undefined
    };

    // In production, you'd send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      const requestStr = this.requestId ? ` [${this.requestId}]` : '';
      console.log(`[${entry.timestamp}] ${level}${requestStr}: ${message}${contextStr}`);
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
}

export const logger = new Logger();

// Request ID middleware for tracking requests
export const requestIdMiddleware = (req: any, res: any, next: any) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  logger.setRequestId(requestId);
  next();
};