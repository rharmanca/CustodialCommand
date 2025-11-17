import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";
import { z } from "zod";

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
export function handleValidationError(error: unknown, res: Response): boolean {
  if (error instanceof z.ZodError) {
    errorResponse(res, 400, "Validation failed", error.errors);
    return true;
  }
  return false;
}

/**
 * Global error handler
 */
export function globalErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  logger.error("Unhandled error", {
    error: error.message,
    stack: error.stack,
    path: req.path,
  });

  if (res.headersSent) {
    return next(error);
  }

  errorResponse(
    res,
    500,
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message,
  );
}
