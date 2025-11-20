import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import { createClient, RedisClientType } from "redis";
import { logger } from "./logger";

// Rate limiting middleware
export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// API rate limiter - production-ready limits
const API_RATE_LIMIT = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)
  : (process.env.NODE_ENV === 'production' ? 60 : 100); // Stricter in production
const STRICT_RATE_LIMIT = process.env.NODE_ENV === 'production' ? 10 : 20; // Stricter auth limits in production
const HEALTH_CHECK_RATE_LIMIT = 100; // 100 requests per 15 minutes for health checks

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: API_RATE_LIMIT,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: false, // Set to false to avoid trust proxy warnings on Replit
  keyGenerator: (req) => {
    // Use forwarded IP or fallback to connection IP
    return (
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "anonymous"
    );
  },
});

// Strict rate limiter for sensitive operations
export const strictRateLimit = createRateLimit(
  15 * 60 * 1000,
  STRICT_RATE_LIMIT,
);

// Health check rate limiter to prevent abuse
export const healthCheckRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: HEALTH_CHECK_RATE_LIMIT,
  message: { error: "Too many health check requests" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for Railway health checks (identified by headers)
    return !!(req.headers['x-railway-service-id'] || req.headers['user-agent']?.includes('Railway'));
  },
  keyGenerator: (req) => {
    return (
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "anonymous"
    );
  },
});

// Improved input sanitization
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === "string") {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (typeof obj === "object" && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  next();
};

// Updated CORS for Replit
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const allowedOrigins = ["http://localhost:5000", "http://localhost:5173"];

  // Replit-specific origins
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    allowedOrigins.push(
      `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
      `https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co`,
      `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`,
    );
  }

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With",
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
};

// Redis client for secure session and cache storage
let redisClient: RedisClientType | null = null;

// Initialize Redis connection
export async function initializeRedis(): Promise<void> {
  try {
    if (!process.env.REDIS_URL) {
      logger.warn(
        "REDIS_URL not configured, falling back to memory storage (NOT RECOMMENDED FOR PRODUCTION)",
      );
      return;
    }

    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      },
    });

    redisClient.on("error", (err) => {
      logger.error("Redis Client Error", { error: err.message });
      redisClient = null; // Fallback to memory storage
    });

    redisClient.on("connect", () => {
      logger.info("Redis client connected successfully");
    });

    await redisClient.connect();
    logger.info("Redis initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Redis", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    redisClient = null;
  }
}

// Password hashing utilities
export class PasswordManager {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, salt);
      logger.debug("Password hashed successfully");
      return hashedPassword;
    } catch (error) {
      logger.error("Failed to hash password", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error("Password hashing failed");
    }
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      logger.debug("Password verification completed", { isValid });
      return isValid;
    } catch (error) {
      logger.error("Failed to verify password", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }
}

// Session data type
export interface SessionData {
  username: string;
  loginTime: string;
  userAgent?: string;
  ip?: string;
  createdAt?: string;
  lastAccessed?: string;
  expiresAt?: Date;
}

// Priority queue for efficient session expiration tracking (memory-based only)
class SessionExpirationQueue {
  private queue: Array<{ token: string; expiresAt: number }> = [];

  add(token: string, expiresAt: Date) {
    const expiryTime = expiresAt.getTime();
    this.queue.push({ token, expiresAt: expiryTime });
    // Keep queue sorted by expiration time (ascending)
    this.queue.sort((a, b) => a.expiresAt - b.expiresAt);
  }

  getExpired(now: number): string[] {
    const expired: string[] = [];
    while (this.queue.length > 0 && this.queue[0].expiresAt <= now) {
      const item = this.queue.shift();
      if (item) {
        expired.push(item.token);
      }
    }
    return expired;
  }

  remove(token: string) {
    const index = this.queue.findIndex((item) => item.token === token);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  size(): number {
    return this.queue.length;
  }
}

// Secure session management
export class SessionManager {
  private static readonly SESSION_PREFIX = "admin_session:";
  private static readonly CACHE_PREFIX = "app_cache:";
  private static readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours in seconds
  private static readonly INACTIVE_SESSION_TTL = 30 * 60; // 30 minutes of inactivity
  private static expirationQueue = new SessionExpirationQueue();

  /**
   * Store session data securely
   */
  static async setSession(
    sessionToken: string,
    sessionData: SessionData,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    try {
      const key = this.SESSION_PREFIX + sessionToken;
      const value = JSON.stringify({
        ...sessionData,
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      });

      if (redisClient) {
        await redisClient.setEx(key, ttl, value);
        logger.debug("Session stored in Redis", { sessionToken, ttl });
      } else {
        // Fallback to memory storage with expiration
        if (!global.adminSessions) {
          global.adminSessions = new Map();
        }
        const expiresAt = new Date(Date.now() + ttl * 1000);
        const sessionWithExpiry = {
          ...sessionData,
          expiresAt,
        };
        (global.adminSessions as Map<string, any>).set(sessionToken, sessionWithExpiry);

        // Add to expiration queue for efficient cleanup
        this.expirationQueue.add(sessionToken, expiresAt);

        logger.warn("Session stored in memory (NOT SECURE FOR PRODUCTION)", {
          sessionToken,
        });
      }
    } catch (error) {
      logger.error("Failed to store session", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error("Session storage failed");
    }
  }

  /**
   * Retrieve session data
   */
  static async getSession(sessionToken: string): Promise<SessionData | null> {
    try {
      const key = this.SESSION_PREFIX + sessionToken;

      if (redisClient) {
        const value = await redisClient.get(key);
        if (!value) {
          logger.debug("Session not found in Redis", { sessionToken });
          return null;
        }

        const sessionData = JSON.parse(value);
        const now = new Date();
        const lastAccessed = sessionData.lastAccessed ? new Date(sessionData.lastAccessed) : now;

        // Check for inactivity timeout (30 minutes)
        const inactivityMs = now.getTime() - lastAccessed.getTime();
        if (inactivityMs > this.INACTIVE_SESSION_TTL * 1000) {
          logger.info("Session expired due to inactivity", {
            sessionToken,
            inactivityMinutes: Math.floor(inactivityMs / 60000),
          });
          await this.deleteSession(sessionToken);
          return null;
        }

        // Update last accessed time
        sessionData.lastAccessed = now.toISOString();
        await redisClient.setEx(
          key,
          this.DEFAULT_TTL,
          JSON.stringify(sessionData),
        );

        logger.debug("Session retrieved from Redis", { sessionToken });
        return sessionData;
      } else {
        // Fallback to memory storage
        if (!global.adminSessions) {
          return null;
        }

        const sessionData = (global.adminSessions as Map<string, any>).get(
          sessionToken,
        );
        if (!sessionData) {
          return null;
        }

        // Check expiration
        if (sessionData.expiresAt && new Date() > sessionData.expiresAt) {
          (global.adminSessions as Map<string, any>).delete(sessionToken);
          return null;
        }

        // Update last accessed time
        sessionData.lastAccessed = new Date().toISOString();

        logger.debug("Session retrieved from memory", { sessionToken });
        return sessionData;
      }
    } catch (error) {
      logger.error("Failed to retrieve session", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Delete a session
   */
  static async deleteSession(sessionToken: string): Promise<void> {
    try {
      const key = this.SESSION_PREFIX + sessionToken;

      if (redisClient) {
        await redisClient.del(key);
        logger.debug("Session deleted from Redis", { sessionToken });
      } else {
        // Fallback to memory storage
        if (global.adminSessions) {
          (global.adminSessions as Map<string, any>).delete(sessionToken);
          // Remove from expiration queue
          this.expirationQueue.remove(sessionToken);
          logger.debug("Session deleted from memory", { sessionToken });
        }
      }
    } catch (error) {
      logger.error("Failed to delete session", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Clean up expired sessions (optimized with priority queue for memory sessions)
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      if (redisClient) {
        // For Redis, scan for sessions and check inactive ones
        // This helps reclaim memory even though TTL auto-expires
        await this.cleanupInactiveSessions();
        return;
      }

      // Clean up memory sessions using priority queue
      if (!global.adminSessions) {
        return;
      }

      const sessions = global.adminSessions as Map<string, any>;
      const now = Date.now();

      // Get expired tokens from priority queue (O(k) where k = expired count)
      const expiredTokens = this.expirationQueue.getExpired(now);

      let cleanedCount = 0;
      for (const token of expiredTokens) {
        if (sessions.delete(token)) {
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info("Cleaned up expired memory sessions", {
          count: cleanedCount,
          remainingSessions: sessions.size,
          queueSize: this.expirationQueue.size(),
        });
      }
    } catch (error) {
      logger.error("Failed to cleanup expired sessions", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Clean up inactive sessions in Redis (even if not expired, reclaim memory)
   */
  private static async cleanupInactiveSessions(): Promise<void> {
    if (!redisClient) return;

    try {
      // Use SCAN to iterate through session keys without blocking
      const pattern = `${this.SESSION_PREFIX}*`;
      let cursor = 0;
      let cleanedCount = 0;
      const now = new Date();

      do {
        const result = await redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100, // Process 100 keys at a time
        });

        cursor = result.cursor;
        const keys = result.keys;

        for (const key of keys) {
          const value = await redisClient.get(key);
          if (!value) continue;

          const sessionData = JSON.parse(value);
          const lastAccessed = sessionData.lastAccessed
            ? new Date(sessionData.lastAccessed)
            : new Date(sessionData.createdAt || 0);

          // Delete sessions inactive for more than 30 minutes
          const inactivityMs = now.getTime() - lastAccessed.getTime();
          if (inactivityMs > this.INACTIVE_SESSION_TTL * 1000) {
            await redisClient.del(key);
            cleanedCount++;
          }
        }
      } while (cursor !== 0);

      if (cleanedCount > 0) {
        logger.info("Cleaned up inactive Redis sessions", {
          count: cleanedCount,
        });
      }
    } catch (error) {
      logger.error("Failed to cleanup inactive Redis sessions", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

// Circuit breaker for cache operations
class CacheCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  private readonly threshold = 5; // Open circuit after 5 failures
  private readonly timeout = 60000; // Try again after 60 seconds
  private readonly resetTime = 300000; // Reset failure count after 5 minutes of success

  recordSuccess() {
    if (this.state === "half-open") {
      this.state = "closed";
      this.failureCount = 0;
      logger.info("Cache circuit breaker closed - Redis recovered");
    } else if (this.state === "closed" && this.failureCount > 0) {
      // Reset failure count after successful operation
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.resetTime) {
        this.failureCount = 0;
      }
    }
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold && this.state === "closed") {
      this.state = "open";
      logger.warn("Cache circuit breaker opened - too many Redis failures", {
        failureCount: this.failureCount,
      });
    }
  }

  canAttempt(): boolean {
    if (this.state === "closed") {
      return true;
    }

    if (this.state === "open") {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.timeout) {
        this.state = "half-open";
        logger.info("Cache circuit breaker half-open - attempting Redis connection");
        return true;
      }
      return false;
    }

    // half-open state
    return true;
  }

  getState(): string {
    return this.state;
  }
}

// Secure cache management (replacing in-memory Map)
export class CacheManager {
  private static readonly DEFAULT_TTL = 5 * 60; // 5 minutes in seconds
  private static circuitBreaker = new CacheCircuitBreaker();
  private static cacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    fallbacks: 0,
  };

  /**
   * Set cache value with graceful degradation
   */
  static async set(
    key: string,
    value: any,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    const cacheKey = SessionManager.CACHE_PREFIX + key;
    const serializedValue = JSON.stringify(value);

    // Try Redis if available and circuit breaker allows
    if (redisClient && this.circuitBreaker.canAttempt()) {
      try {
        await redisClient.setEx(cacheKey, ttl, serializedValue);
        this.circuitBreaker.recordSuccess();
        logger.debug("Cache stored in Redis", { key, ttl });
        return;
      } catch (error) {
        this.cacheStats.errors++;
        this.circuitBreaker.recordFailure();
        logger.warn("Redis cache set failed, falling back to memory", {
          key,
          error: error instanceof Error ? error.message : "Unknown error",
          circuitState: this.circuitBreaker.getState(),
        });
        // Continue to memory fallback
      }
    }

    // Fallback to memory storage
    try {
      this.cacheStats.fallbacks++;
      if (!global.appCache) {
        global.appCache = new Map();
      }

      const cache = global.appCache as Map<
        string,
        { data: any; expiresAt: Date }
      >;
      const expiresAt = new Date(Date.now() + ttl * 1000);
      cache.set(key, { data: value, expiresAt });

      // Implement LRU eviction if cache gets too large (limit to 500 items)
      if (cache.size > 500) {
        const keysToDelete = Array.from(cache.keys()).slice(0, 100);
        keysToDelete.forEach((k) => cache.delete(k));
        logger.debug("Memory cache LRU eviction", { evicted: keysToDelete.length });
      }

      logger.debug("Cache stored in memory", { key, ttl });
    } catch (error) {
      this.cacheStats.errors++;
      logger.error("Failed to set cache in both Redis and memory", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Silent failure - cache is optional
    }
  }

  /**
   * Get cache value with graceful degradation
   */
  static async get(key: string): Promise<any | null> {
    const cacheKey = SessionManager.CACHE_PREFIX + key;

    // Try Redis if available and circuit breaker allows
    if (redisClient && this.circuitBreaker.canAttempt()) {
      try {
        const value = await redisClient.get(cacheKey);
        if (value) {
          this.circuitBreaker.recordSuccess();
          this.cacheStats.hits++;
          const parsedValue = JSON.parse(value);
          logger.debug("Cache hit in Redis", { key });
          return parsedValue;
        }
        // Not found in Redis, try memory fallback
      } catch (error) {
        this.cacheStats.errors++;
        this.circuitBreaker.recordFailure();
        logger.warn("Redis cache get failed, trying memory fallback", {
          key,
          error: error instanceof Error ? error.message : "Unknown error",
          circuitState: this.circuitBreaker.getState(),
        });
        // Continue to memory fallback
      }
    }

    // Fallback to memory storage
    try {
      if (!global.appCache) {
        this.cacheStats.misses++;
        return null;
      }

      const cache = global.appCache as Map<
        string,
        { data: any; expiresAt: Date }
      >;
      const cached = cache.get(key);

      if (!cached) {
        this.cacheStats.misses++;
        return null;
      }

      // Check expiration
      if (new Date() > cached.expiresAt) {
        cache.delete(key);
        this.cacheStats.misses++;
        return null;
      }

      this.cacheStats.hits++;
      this.cacheStats.fallbacks++;
      logger.debug("Cache hit in memory", { key });
      return cached.data;
    } catch (error) {
      this.cacheStats.errors++;
      this.cacheStats.misses++;
      logger.error("Failed to get cache from both Redis and memory", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Delete cache value with graceful degradation
   */
  static async delete(key: string): Promise<void> {
    const cacheKey = SessionManager.CACHE_PREFIX + key;
    let redisSuccess = false;

    // Try Redis if available and circuit breaker allows
    if (redisClient && this.circuitBreaker.canAttempt()) {
      try {
        await redisClient.del(cacheKey);
        this.circuitBreaker.recordSuccess();
        logger.debug("Cache deleted from Redis", { key });
        redisSuccess = true;
      } catch (error) {
        this.cacheStats.errors++;
        this.circuitBreaker.recordFailure();
        logger.warn("Redis cache delete failed, will try memory", {
          key,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Also delete from memory (even if Redis succeeded, for consistency)
    try {
      if (global.appCache) {
        (global.appCache as Map<string, any>).delete(key);
        if (!redisSuccess) {
          logger.debug("Cache deleted from memory", { key });
        }
      }
    } catch (error) {
      logger.error("Failed to delete cache from memory", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Clear cache by pattern
   */
  static async clearPattern(pattern: string): Promise<void> {
    try {
      if (redisClient) {
        const keys = await redisClient.keys(
          SessionManager.CACHE_PREFIX + "*" + pattern + "*",
        );
        if (keys.length > 0) {
          await redisClient.del(keys);
          logger.info("Cleared cache pattern in Redis", {
            pattern,
            count: keys.length,
          });
        }
      } else {
        // Fallback to memory storage
        if (!global.appCache) {
          return;
        }

        const cache = global.appCache as Map<string, any>;
        const keysToDelete = Array.from(cache.keys()).filter((key) =>
          key.includes(pattern),
        );
        let deletedCount = 0;

        for (const key of keysToDelete) {
          cache.delete(key);
          deletedCount++;
        }

        if (deletedCount > 0) {
          logger.info("Cleared cache pattern in memory", {
            pattern,
            count: deletedCount,
          });
        }
      }
    } catch (error) {
      logger.error("Failed to clear cache pattern", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  static async getStats(): Promise<{
    size: number;
    type: string;
    hits: number;
    misses: number;
    errors: number;
    fallbacks: number;
    hitRate: string;
    circuitBreakerState: string;
  }> {
    try {
      let size = 0;
      let type = "Unknown";

      if (redisClient && this.circuitBreaker.canAttempt()) {
        try {
          const keys = await redisClient.keys(SessionManager.CACHE_PREFIX + "*");
          size = keys.length;
          type = "Redis";
        } catch (error) {
          // Fallback to memory stats
          size = global.appCache ? (global.appCache as Map<string, any>).size : 0;
          type = "Memory (Redis unavailable)";
        }
      } else {
        size = global.appCache ? (global.appCache as Map<string, any>).size : 0;
        type = this.circuitBreaker.getState() === "open"
          ? "Memory (Circuit breaker open)"
          : "Memory (INSECURE)";
      }

      const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
      const hitRate = totalRequests > 0
        ? ((this.cacheStats.hits / totalRequests) * 100).toFixed(2) + "%"
        : "N/A";

      return {
        size,
        type,
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        errors: this.cacheStats.errors,
        fallbacks: this.cacheStats.fallbacks,
        hitRate,
        circuitBreakerState: this.circuitBreaker.getState(),
      };
    } catch (error) {
      logger.error("Failed to get cache stats", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        size: 0,
        type: "Unknown",
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        errors: this.cacheStats.errors,
        fallbacks: this.cacheStats.fallbacks,
        hitRate: "N/A",
        circuitBreakerState: "unknown",
      };
    }
  }
}

/**
 * Get Redis connection status and health
 */
export async function getRedisHealth(): Promise<{
  connected: boolean;
  type: "redis" | "memory";
  error?: string;
}> {
  if (!redisClient) {
    return {
      connected: false,
      type: "memory",
      error: "Redis not configured (using memory storage)",
    };
  }

  try {
    // Ping Redis to check if it's alive
    const pingResult = await redisClient.ping();
    const isConnected = pingResult === "PONG";

    return {
      connected: isConnected,
      type: "redis",
    };
  } catch (error) {
    return {
      connected: false,
      type: "redis",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get Redis client (for internal use)
 */
export function getRedisClient() {
  return redisClient;
}

// Initialize Redis on module import
initializeRedis().catch(() => {
  logger.warn(
    "Security module initialized without Redis (falling back to insecure memory storage)",
  );
});

// Cleanup expired sessions every 10 minutes
setInterval(
  () => {
    SessionManager.cleanupExpiredSessions().catch((error) => {
      logger.error("Failed to cleanup expired sessions", { error });
    });
  },
  10 * 60 * 1000,
);

// Request validation middleware
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Check content length
  const contentLength = parseInt(req.headers["content-length"] || "0");
  if (contentLength > 10 * 1024 * 1024) {
    // 10MB limit
    return res.status(413).json({ error: "Request too large" });
  }

  // Validate content type for POST/PUT/PATCH
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.headers["content-type"];
    if (!contentType) {
      return res.status(400).json({ error: "Content-Type header is required" });
    }

    // Extract base content type (remove charset and other parameters)
    const baseContentType = contentType.split(';')[0].trim().toLowerCase();

    // Check if base content type is valid
    const validTypes = ["application/json", "multipart/form-data"];
    if (!validTypes.some(type => baseContentType === type || baseContentType.startsWith(type))) {
      return res.status(400).json({
        error: "Invalid content type",
        received: baseContentType,
        expected: validTypes
      });
    }
  }

  next();
};
