/**
 * Global type declarations for server-side code
 */

export interface AdminSession {
  username: string;
  createdAt: Date;
  expiresAt: Date;
}

declare global {
  var adminSessions: Map<string, AdminSession> | undefined;

  namespace Express {
    interface Request {
      adminSession?: AdminSession;
    }
  }
}

export {};
