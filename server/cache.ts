import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  headers?: Record<string, string>;
}

class APICache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000; // Maximum number of cached entries
  private cleanupInterval = 60000; // Cleanup expired entries every minute

  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      logger.debug('Cache cleanup completed', { deletedCount: keysToDelete.length, remainingSize: this.cache.size });
    }
  }

  private getCacheKey(req: Request): string {
    // Create cache key based on URL and relevant parameters
    const url = req.originalUrl || req.url;
    const method = req.method;
    const queryString = new URLSearchParams(req.query as any).toString();

    // For GET requests, include query parameters in cache key
    // For other requests, cache based on URL only
    const key = method === 'GET' ? `${method}:${url}:${queryString}` : `${method}:${url}`;

    return key;
  }

  // Expose getCacheKey for middleware use
  static getCacheKeyForRequest(req: Request): string {
    const url = req.originalUrl || req.url;
    const method = req.method;
    const queryString = new URLSearchParams(req.query as any).toString();
    return method === 'GET' ? `${method}:${url}:${queryString}` : `${method}:${url}`;
  }

  private shouldCacheRequest(req: Request): boolean {
    // Only cache GET requests for now
    if (req.method !== 'GET') return false;

    // Don't cache if no-cache header is present
    if (req.headers['cache-control'] === 'no-cache') return false;

    // Don't cache certain endpoints
    const noCachePatterns = [
      '/api/admin/',
      '/health',
      '/metrics'
    ];

    return !noCachePatterns.some(pattern => req.path.includes(pattern));
  }

  private getCacheTTL(req: Request): number {
    const path = req.path;

    // Different TTL for different endpoints
    if (path.includes('/api/inspections') || path.includes('/api/custodial-notes')) {
      return 60000; // 1 minute for frequently changing data
    } else if (path.includes('/api/scores')) {
      return 300000; // 5 minutes for score calculations
    } else if (path.includes('/api/monthly-feedback')) {
      return 120000; // 2 minutes for feedback
    } else if (path.startsWith('/api/')) {
      return 60000; // Default 1 minute for API endpoints
    } else {
      return 300000; // 5 minutes for static content
    }
  }

  get(req: Request): any | null {
    const key = this.getCacheKey(req);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    logger.debug('Cache hit', { key, path: req.path });
    return entry.data;
  }

  set(req: Request, res: Response, data: any): void {
    if (!this.shouldCacheRequest(req)) return;

    const key = this.getCacheKey(req);
    const ttl = this.getCacheTTL(req);

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    // Store relevant headers for cache replay
    const headers: Record<string, string> = {};
    const relevantHeaders = ['content-type', 'etag', 'last-modified'];
    relevantHeaders.forEach(header => {
      const value = res.getHeader(header);
      if (value) {
        headers[header] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    });

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      headers
    });

    logger.debug('Cache set', { key, path: req.path, ttl });
  }

  invalidate(pattern: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    logger.info('Cache invalidated', { pattern, deletedCount: keysToDelete.length });
  }

  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      totalSize++;
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredCount,
      totalSize,
      hitRate: this.getHitRate()
    };
  }

  private hitRate = 0;
  private totalRequests = 0;
  private hits = 0;

  recordRequest(hit: boolean): void {
    this.totalRequests++;
    if (hit) this.hits++;
    this.hitRate = this.totalRequests > 0 ? (this.hits / this.totalRequests) * 100 : 0;
  }

  getHitRate(): number {
    return this.hitRate;
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.totalRequests = 0;
    this.hitRate = 0;
    logger.info('Cache cleared');
  }
}

export const apiCache = new APICache();

// Cache middleware
export const cacheMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check cache for GET requests
  if (req.method === 'GET') {
    const cachedData = apiCache.get(req);
    if (cachedData !== null) {
      apiCache.recordRequest(true);

      // Set cache headers
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Hit-Rate', `${apiCache.getHitRate().toFixed(1)}%`);

      // Restore cached headers if available
      const cacheKey = apiCache.getCacheKey ? apiCache.getCacheKey(req) : null;
      if (cacheKey) {
        // This would require modifying the APICache class to expose the cache entry
        // For now, we'll set basic headers
        res.set('Content-Type', 'application/json');
      }

      return res.json(cachedData);
    }
  }

  apiCache.recordRequest(false);
  res.set('X-Cache', 'MISS');

  // Intercept res.json to cache the response
  const originalJson = res.json;
  res.json = function(data: any) {
    // Cache the response if applicable
    if (res.statusCode >= 200 && res.statusCode < 300) {
      apiCache.set(req, res, data);
    }

    return originalJson.call(this, data);
  };

  next();
};

// Cache invalidation middleware for mutations
export const invalidateCache = (patterns: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;

    res.send = function(data: any) {
      // Invalidate cache patterns after successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => apiCache.invalidate(pattern));
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

// Performance monitoring middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();

  // Intercept writeHead to add performance header before response is sent
  const originalWriteHead = res.writeHead;
  res.writeHead = function(...args: any[]) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    try {
      // Add performance header before sending response
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
      }
    } catch (err) {
      // Silently fail if headers already sent
    }
    
    return originalWriteHead.apply(res, args);
  };

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }

    // Log request details for monitoring (no header setting here)
    logger.debug('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    });
  });

  next();
};

// Memory monitoring
export const memoryMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  const memUsage = process.memoryUsage();

  // Log memory usage warnings
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;

  if (heapUsedMB > 500) { // Warning if using more than 500MB
    logger.warn('High memory usage detected', {
      heapUsed: `${heapUsedMB.toFixed(2)}MB`,
      heapTotal: `${heapTotalMB.toFixed(2)}MB`,
      external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
      path: req.path
    });
  }

  // Add memory headers for monitoring
  res.set('X-Memory-Used', `${heapUsedMB.toFixed(2)}MB`);
  res.set('X-Memory-Total', `${heapTotalMB.toFixed(2)}MB`);

  next();
};

// Request deduplication middleware
const pendingRequests = new Map<string, Promise<any>>();

export const requestDeduplication = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method !== 'GET') {
    return next();
  }

  const key = `${req.method}:${req.originalUrl}`;
  const existingRequest = pendingRequests.get(key);

  if (existingRequest) {
    logger.debug('Request deduplication: merging identical request', { key });

    existingRequest
      .then(data => {
        res.set('X-Deduplicated', 'true');
        res.json(data);
      })
      .catch(error => {
        next(error);
      });

    return;
  }

  // Create a promise for this request
  const requestPromise = new Promise((resolve, reject) => {
    const originalJson = res.json;
    const originalSend = res.send;

    res.json = function(data: any) {
      resolve(data);
      return originalJson.call(this, data);
    };

    res.send = function(data: any) {
      resolve(data);
      return originalSend.call(this, data);
    };

    res.on('error', reject);
  });

  pendingRequests.set(key, requestPromise);

  // Clean up after request completes
  res.on('finish', () => {
    pendingRequests.delete(key);
  });

  res.on('error', () => {
    pendingRequests.delete(key);
  });

  next();
};