import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  database: 'connected' | 'disconnected' | 'error';
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl;
    const statusCode = res.statusCode;
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method,
        url,
        duration,
        statusCode
      });
    }
    
    // Log errors
    if (statusCode >= 400) {
      logger.error('Request failed', {
        method,
        url,
        statusCode,
        duration
      });
    }
    
    // Log all requests in debug mode
    logger.debug('Request completed', {
      method,
      url,
      statusCode,
      duration
    });
  });
  
  next();
};

// Health check endpoint handler
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Check database connection
    let dbStatus: HealthCheck['database'] = 'connected';
    try {
      // Import the pool from your db.ts file
      const { pool } = await import('./db');
      await pool.query('SELECT 1');
    } catch (error) {
      dbStatus = 'error';
      logger.error('Database health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    };
    
    const health: HealthCheck = {
      status: dbStatus === 'error' ? 'error' : 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      memory
    };
    
    const responseTime = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    if (health.status === 'error') {
      res.status(503).json(health);
    } else {
      res.json(health);
    }
    
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed'
    });
  }
};

// Error tracking and alerting
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.error('Unhandled error', {
    errorId,
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body
  });
  
  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error);
  }
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    errorId,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
};

// Metrics collection
class MetricsCollector {
  private metrics: Record<string, number> = {};
  
  increment(metric: string, value = 1) {
    this.metrics[metric] = (this.metrics[metric] || 0) + value;
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
  
  reset() {
    this.metrics = {};
  }
}

export const metricsCollector = new MetricsCollector();

// Metrics middleware
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  metricsCollector.increment('requests_total');
  metricsCollector.increment(`requests_${req.method.toLowerCase()}`);
  
  res.on('finish', () => {
    metricsCollector.increment(`responses_${res.statusCode}`);
    if (res.statusCode >= 400) {
      metricsCollector.increment('errors_total');
    }
  });
  
  next();
};