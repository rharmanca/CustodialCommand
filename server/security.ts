import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiting middleware
export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// API rate limiter - lenient limits to support test suites and normal usage
// High limits prevent 429 errors during testing while still providing DDoS protection
const API_RATE_LIMIT = 1000;  // 1000 requests per 15 minutes
const STRICT_RATE_LIMIT = 100; // 100 requests per 15 minutes for auth endpoints

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: API_RATE_LIMIT,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: false, // Set to false to avoid trust proxy warnings on Replit
  keyGenerator: (req) => {
    // Use forwarded IP or fallback to connection IP
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'anonymous';
  }
});

// Strict rate limiter for sensitive operations
export const strictRateLimit = createRateLimit(15 * 60 * 1000, STRICT_RATE_LIMIT);

// Improved input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  next();
};

// Updated CORS for Replit
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:5173'
  ];
  
  // Replit-specific origins
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    allowedOrigins.push(
      `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
      `https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co`,
      `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`
    );
  }
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Check content length
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    return res.status(413).json({ error: 'Request too large' });
  }
  
  // Validate content type for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      return res.status(400).json({ error: 'Invalid content type' });
    }
  }
  
  next();
};