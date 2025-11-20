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

// Secure session management
export class SessionManager {
  private static readonly SESSION_PREFIX = "admin_session:";
  private static readonly CACHE_PREFIX = "app_cache:";
  private static readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours in seconds

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
        (global.adminSessions as Map<string, any>).set(sessionToken, {
          ...sessionData,
          expiresAt,
        });
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

        // Update last accessed time
        sessionData.lastAccessed = new Date().toISOString();
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
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      if (redisClient) {
        // Redis automatically handles TTL expiration
        logger.debug("Redis handles automatic session expiration");
        return;
      }

      // Clean up memory sessions
      if (!global.adminSessions) {
        return;
      }

      const sessions = global.adminSessions as Map<string, any>;
      const now = new Date();
      let cleanedCount = 0;

      for (const [token, sessionData] of sessions.entries()) {
        if (sessionData.expiresAt && now > sessionData.expiresAt) {
          sessions.delete(token);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info("Cleaned up expired memory sessions", {
          count: cleanedCount,
        });
      }
    } catch (error) {
      logger.error("Failed to cleanup expired sessions", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

// Secure cache management (replacing in-memory Map)
export class CacheManager {
  private static readonly DEFAULT_TTL = 5 * 60; // 5 minutes in seconds

  /**
   * Set cache value
   */
  static async set(
    key: string,
    value: any,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    try {
      const cacheKey = SessionManager.CACHE_PREFIX + key;
      const serializedValue = JSON.stringify(value);

      if (redisClient) {
        await redisClient.setEx(cacheKey, ttl, serializedValue);
        logger.debug("Cache stored in Redis", { key, ttl });
      } else {
        // Fallback to memory storage
        if (!global.appCache) {
          global.appCache = new Map();
        }

        const cache = global.appCache as Map<
          string,
          { data: any; expiresAt: Date }
        >;
        const expiresAt = new Date(Date.now() + ttl * 1000);
        cache.set(key, { data: value, expiresAt });

        // Implement LRU eviction if cache gets too large
        if (cache.size > 100) {
          const oldestKey = cache.keys().next().value;
          cache.delete(oldestKey);
        }

        logger.debug("Cache stored in memory", { key, ttl });
      }
    } catch (error) {
      logger.error("Failed to set cache", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get cache value
   */
  static async get(key: string): Promise<any | null> {
    try {
      const cacheKey = SessionManager.CACHE_PREFIX + key;

      if (redisClient) {
        const value = await redisClient.get(cacheKey);
        if (!value) {
          return null;
        }

        const parsedValue = JSON.parse(value);
        logger.debug("Cache hit in Redis", { key });
        return parsedValue;
      } else {
        // Fallback to memory storage
        if (!global.appCache) {
          return null;
        }

        const cache = global.appCache as Map<
          string,
          { data: any; expiresAt: Date }
        >;
        const cached = cache.get(key);

        if (!cached) {
          return null;
        }

        // Check expiration
        if (new Date() > cached.expiresAt) {
          cache.delete(key);
          return null;
        }

        logger.debug("Cache hit in memory", { key });
        return cached.data;
      }
    } catch (error) {
      logger.error("Failed to get cache", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Delete cache value
   */
  static async delete(key: string): Promise<void> {
    try {
      const cacheKey = SessionManager.CACHE_PREFIX + key;

      if (redisClient) {
        await redisClient.del(cacheKey);
        logger.debug("Cache deleted from Redis", { key });
      } else {
        // Fallback to memory storage
        if (global.appCache) {
          (global.appCache as Map<string, any>).delete(key);
          logger.debug("Cache deleted from memory", { key });
        }
      }
    } catch (error) {
      logger.error("Failed to delete cache", {
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
   * Get cache statistics
   */
  static async getStats(): Promise<{ size: number; type: string }> {
    try {
      if (redisClient) {
        const keys = await redisClient.keys(SessionManager.CACHE_PREFIX + "*");
        return { size: keys.length, type: "Redis" };
      } else {
        const size = global.appCache
          ? (global.appCache as Map<string, any>).size
          : 0;
        return { size, type: "Memory (INSECURE)" };
      }
    } catch (error) {
      logger.error("Failed to get cache stats", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { size: 0, type: "Unknown" };
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
