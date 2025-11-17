import { Request, Response, NextFunction } from "express";
import { SessionData } from "../security";

declare global {
  namespace Express {
    interface Request {
      adminSession?: SessionData;
      requestId?: string;
    }
  }
}

export {};
