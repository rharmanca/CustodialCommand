import { Request, Response, NextFunction } from "express";
import { randomBytes, createHash } from "crypto";
import { logger } from "./logger";

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_SECRET_LENGTH = 32;
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_COOKIE_NAME = "csrf-secret";
const CSRF_TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

// In-memory token store (use Redis in production for distributed systems)
const tokenStore = new Map<string, { token: string; expires: number }>();

/**
 * Generate a CSRF token and secret pair
 */
function generateCsrfToken(): { token: string; secret: string } {
  const secret = randomBytes(CSRF_SECRET_LENGTH).toString("hex");
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString("hex");

  return { token, secret };
}

/**
 * Hash a token with a secret
 */
function hashToken(token: string, secret: string): string {
  return createHash("sha256")
    .update(`${token}:${secret}`)
    .digest("hex");
}

/**
 * Verify a CSRF token against a secret
 */
function verifyCsrfToken(token: string, secret: string, storedHash: string): boolean {
  const hash = hashToken(token, secret);
  return hash === storedHash;
}

/**
 * Middleware to generate and attach CSRF token to request
 */
export function csrfProtection(req: any, res: Response, next: NextFunction) {
  // Skip CSRF for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF for health checks and metrics
  if (req.path.startsWith("/health") || req.path.startsWith("/metrics")) {
    return next();
  }

  // Skip CSRF for admin authentication (endpoint uses password auth)
  if (req.path.startsWith("/api/admin/login")) {
    logger.debug("Skipping CSRF for admin authentication", { path: req.path });
    return next();
  }

  try {
    // Get secret from cookie
    const secret = req.cookies?.[CSRF_COOKIE_NAME];

    if (!secret) {
      logger.warn("CSRF validation failed: No secret cookie", {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return res.status(403).json({
        error: "CSRF token missing",
        message: "Please refresh the page and try again",
      });
    }

    // Get token from header or body
    const token = req.headers[CSRF_HEADER_NAME] || req.body?._csrf;

    if (!token) {
      logger.warn("CSRF validation failed: No token provided", {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return res.status(403).json({
        error: "CSRF token missing",
        message: "Please include CSRF token in request",
      });
    }

    // Verify token
    const storedData = tokenStore.get(secret);

    if (!storedData) {
      logger.warn("CSRF validation failed: Token not found or expired", {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return res.status(403).json({
        error: "CSRF token invalid or expired",
        message: "Please refresh the page and try again",
      });
    }

    // Check expiration
    if (Date.now() > storedData.expires) {
      tokenStore.delete(secret);
      logger.warn("CSRF validation failed: Token expired", {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return res.status(403).json({
        error: "CSRF token expired",
        message: "Please refresh the page and try again",
      });
    }

    // Verify the token
    if (!verifyCsrfToken(token as string, secret, storedData.token)) {
      logger.warn("CSRF validation failed: Invalid token", {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return res.status(403).json({
        error: "CSRF token invalid",
        message: "Security validation failed",
      });
    }

    // Token is valid
    logger.debug("CSRF token validated successfully", {
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    logger.error("CSRF validation error", {
      error: error instanceof Error ? error.message : "Unknown error",
      path: req.path,
      method: req.method,
    });
    return res.status(500).json({
      error: "CSRF validation failed",
      message: "An error occurred during security validation",
    });
  }
}

/**
 * Generate a new CSRF token for a session
 */
export function generateToken(req: Request, res: Response): { token: string; secret: string } {
  const { token, secret } = generateCsrfToken();
  const hashedToken = hashToken(token, secret);

  // Store token with expiration
  tokenStore.set(secret, {
    token: hashedToken,
    expires: Date.now() + CSRF_TOKEN_TTL,
  });

  // Set secret as httpOnly cookie
  res.cookie(CSRF_COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_TOKEN_TTL,
  });

  logger.debug("CSRF token generated", { ip: req.ip });

  return { token, secret };
}

/**
 * Endpoint to get a CSRF token
 */
export function getCsrfToken(req: Request, res: Response) {
  try {
    const { token } = generateToken(req, res);

    res.json({
      csrfToken: token,
      expiresIn: CSRF_TOKEN_TTL / 1000, // seconds
    });
  } catch (error) {
    logger.error("Failed to generate CSRF token", {
      error: error instanceof Error ? error.message : "Unknown error",
      ip: req.ip,
    });
    res.status(500).json({
      error: "Failed to generate CSRF token",
    });
  }
}

/**
 * Cleanup expired tokens periodically
 */
export function cleanupExpiredTokens() {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [secret, data] of tokenStore.entries()) {
    if (now > data.expires) {
      tokenStore.delete(secret);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    logger.debug("Cleaned up expired CSRF tokens", { count: cleanedCount });
  }
}

// Cleanup expired tokens every 15 minutes
setInterval(cleanupExpiredTokens, 15 * 60 * 1000);

/**
 * Get current token store stats (for monitoring)
 */
export function getCsrfStats() {
  return {
    activeTokens: tokenStore.size,
    headerName: CSRF_HEADER_NAME,
    cookieName: CSRF_COOKIE_NAME,
  };
}
