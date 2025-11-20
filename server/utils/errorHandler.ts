import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";
import { z } from "zod";

/**
 * Error categories for better tracking
 */
export enum ErrorCategory {
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  DATABASE = "database",
  NETWORK = "network",
  FILE_SYSTEM = "file_system",
  RATE_LIMIT = "rate_limit",
  INTERNAL = "internal",
  UNKNOWN = "unknown",
}

/**
 * Categorize error based on error type and message
 */
function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();

  if (error instanceof z.ZodError) {
    return ErrorCategory.VALIDATION;
  }

  if (message.includes("unauthorized") || message.includes("not authenticated")) {
    return ErrorCategory.AUTHENTICATION;
  }

  if (message.includes("forbidden") || message.includes("not authorized")) {
    return ErrorCategory.AUTHORIZATION;
  }

  if (
    message.includes("econnrefused") ||
    message.includes("etimedout") ||
    message.includes("enotfound") ||
    message.includes("connection")
  ) {
    return ErrorCategory.DATABASE;
  }

  if (message.includes("network") || message.includes("fetch failed")) {
    return ErrorCategory.NETWORK;
  }

  if (message.includes("enoent") || message.includes("file") || message.includes("directory")) {
    return ErrorCategory.FILE_SYSTEM;
  }

  if (message.includes("rate limit") || message.includes("too many requests")) {
    return ErrorCategory.RATE_LIMIT;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Extract request context for logging
 */
function getRequestContext(req: Request): Record<string, any> {
  const context: Record<string, any> = {
    method: req.method,
    path: req.path,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
    requestId: (req as any).requestId,
  };

  // Add user info if authenticated
  if ((req as any).session?.userId) {
    context.userId = (req as any).session.userId;
    context.username = (req as any).session.username;
  }

  // Add query params if present
  if (Object.keys(req.query).length > 0) {
    context.query = req.query;
  }

  // Add body preview (first 200 chars, sanitize sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };

    // Remove sensitive fields
    const sensitiveFields = ["password", "token", "secret", "apiKey", "sessionId"];
    sensitiveFields.forEach((field) => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = "[REDACTED]";
      }
    });

    const bodyStr = JSON.stringify(sanitizedBody);
    context.bodyPreview = bodyStr.length > 200 ? bodyStr.substring(0, 200) + "..." : bodyStr;
  }

  // Add content type
  if (req.headers["content-type"]) {
    context.contentType = req.headers["content-type"];
  }

  return context;
}

/**
 * Async error handler wrapper for consistent error handling
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Standardized error response
 */
export function errorResponse(
  res: Response,
  statusCode: number,
  message: string,
  details?: any,
) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: unknown, res: Response, req?: Request): boolean {
  if (error instanceof z.ZodError) {
    // Enhanced logging for validation errors
    if (req) {
      logger.warn("Validation error", {
        errors: error.errors,
        ...getRequestContext(req),
        category: ErrorCategory.VALIDATION,
      });
    }

    errorResponse(res, 400, "Validation failed", error.errors);
    return true;
  }
  return false;
}

/**
 * Global error handler with enhanced context logging
 */
export function globalErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const category = categorizeError(error);
  const requestContext = getRequestContext(req);

  // Enhanced structured logging
  logger.error("Unhandled error", {
    error: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    category,
    ...requestContext,
    timestamp: new Date().toISOString(),
  });

  if (res.headersSent) {
    return next(error);
  }

  // Determine appropriate status code based on error category
  let statusCode = 500;
  if (category === ErrorCategory.VALIDATION) {
    statusCode = 400;
  } else if (category === ErrorCategory.AUTHENTICATION) {
    statusCode = 401;
  } else if (category === ErrorCategory.AUTHORIZATION) {
    statusCode = 403;
  } else if (category === ErrorCategory.RATE_LIMIT) {
    statusCode = 429;
  }

  errorResponse(
    res,
    statusCode,
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message,
  );
}
