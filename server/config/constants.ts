// Application configuration constants
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  PDF_MAX_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

export const RATE_LIMITS = {
  API_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)
    : 100, // 100 requests per 15 minutes for production
  STRICT_MAX_REQUESTS: 20, // 20 requests per 15 minutes for auth endpoints
} as const;

export const CACHE = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  SESSION_TTL: 24 * 60 * 60, // 24 hours in seconds
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;
