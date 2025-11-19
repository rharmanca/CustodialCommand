import * as path from "path";
import { logger } from "../logger";

/**
 * Sanitizes user-provided file paths to prevent directory traversal attacks
 * @param userPath - The file path provided by the user
 * @param allowedDirectory - Optional base directory to restrict access to
 * @returns Sanitized file path relative to allowed directory
 * @throws Error if path contains directory traversal patterns or is absolute
 */
export function sanitizeFilePath(
  userPath: string,
  allowedDirectory?: string
): string {
  if (!userPath || typeof userPath !== "string") {
    logger.error("[Security] Invalid file path provided", { userPath });
    throw new Error("Invalid file path");
  }

  // Normalize the path to resolve any ../ or ./ patterns
  const normalized = path.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, "");

  // Check for directory traversal attempts
  if (normalized.includes("..") || path.isAbsolute(normalized)) {
    logger.warn("[Security] Directory traversal attempt detected", {
      userPath,
      normalized,
    });
    throw new Error("Invalid file path: directory traversal not allowed");
  }

  // Check for null bytes (path injection)
  if (normalized.includes("\0")) {
    logger.warn("[Security] Null byte injection attempt detected", {
      userPath,
    });
    throw new Error("Invalid file path: null bytes not allowed");
  }

  // If allowed directory is specified, ensure the final path is within it
  if (allowedDirectory) {
    const resolvedPath = path.resolve(allowedDirectory, normalized);
    const allowedPath = path.resolve(allowedDirectory);

    if (!resolvedPath.startsWith(allowedPath)) {
      logger.warn("[Security] Path escape attempt detected", {
        userPath,
        resolvedPath,
        allowedPath,
      });
      throw new Error("Invalid file path: outside allowed directory");
    }

    return resolvedPath;
  }

  return normalized;
}

/**
 * Validates if a filename is safe (no path components)
 * @param filename - The filename to validate
 * @returns true if filename is safe
 */
export function isValidFilename(filename: string): boolean {
  if (!filename || typeof filename !== "string") {
    return false;
  }

  // Filename should not contain path separators
  if (filename.includes("/") || filename.includes("\\")) {
    return false;
  }

  // Should not contain directory traversal patterns
  if (filename.includes("..")) {
    return false;
  }

  // Should not contain null bytes
  if (filename.includes("\0")) {
    return false;
  }

  return true;
}

/**
 * Sanitizes and validates a filename for safe file operations
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 * @throws Error if filename is invalid
 */
export function sanitizeFilename(filename: string): string {
  if (!isValidFilename(filename)) {
    logger.warn("[Security] Invalid filename detected", { filename });
    throw new Error("Invalid filename");
  }

  // Remove any potential dangerous characters
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  return sanitized;
}
