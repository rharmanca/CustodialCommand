var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  custodialNotes: () => custodialNotes,
  insertCustodialNoteSchema: () => insertCustodialNoteSchema,
  insertInspectionSchema: () => insertInspectionSchema,
  insertRoomInspectionSchema: () => insertRoomInspectionSchema,
  insertUserSchema: () => insertUserSchema,
  inspections: () => inspections,
  roomInspections: () => roomInspections,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, inspections, roomInspections, custodialNotes, insertUserSchema, insertInspectionSchema, insertRoomInspectionSchema, insertCustodialNoteSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password").notNull()
    });
    inspections = pgTable("inspections", {
      id: serial("id").primaryKey(),
      inspectorName: text("inspector_name"),
      school: text("school").notNull(),
      date: text("date").notNull(),
      inspectionType: text("inspection_type").notNull(),
      // 'single_room' or 'whole_building'
      locationDescription: text("location_description").notNull(),
      roomNumber: text("room_number"),
      // For single room inspections
      locationCategory: text("location_category"),
      // New field for location category
      buildingName: text("building_name"),
      // For whole building inspections
      buildingInspectionId: integer("building_inspection_id"),
      // Reference to parent building inspection
      // For single room inspections, store ratings directly (nullable for building inspections)
      floors: integer("floors"),
      verticalHorizontalSurfaces: integer("vertical_horizontal_surfaces"),
      ceiling: integer("ceiling"),
      restrooms: integer("restrooms"),
      customerSatisfaction: integer("customer_satisfaction"),
      trash: integer("trash"),
      projectCleaning: integer("project_cleaning"),
      activitySupport: integer("activity_support"),
      safetyCompliance: integer("safety_compliance"),
      equipment: integer("equipment"),
      monitoring: integer("monitoring"),
      notes: text("notes"),
      images: text("images").array(),
      verifiedRooms: text("verified_rooms").array(),
      // For tracking completed room types in building inspections
      isCompleted: boolean("is_completed").default(false),
      // For whole building inspections
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    roomInspections = pgTable("room_inspections", {
      id: serial("id").primaryKey(),
      buildingInspectionId: integer("building_inspection_id").notNull(),
      roomType: text("room_type").notNull(),
      roomIdentifier: text("room_identifier"),
      // Specific room number or identifier
      floors: integer("floors"),
      verticalHorizontalSurfaces: integer("vertical_horizontal_surfaces"),
      ceiling: integer("ceiling"),
      restrooms: integer("restrooms"),
      customerSatisfaction: integer("customer_satisfaction"),
      trash: integer("trash"),
      projectCleaning: integer("project_cleaning"),
      activitySupport: integer("activity_support"),
      safetyCompliance: integer("safety_compliance"),
      equipment: integer("equipment"),
      monitoring: integer("monitoring"),
      notes: text("notes"),
      images: text("images").array().default([]),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    custodialNotes = pgTable("custodial_notes", {
      id: serial("id").primaryKey(),
      school: text("school").notNull(),
      date: text("date").notNull(),
      location: text("location").notNull(),
      locationDescription: text("location_description").notNull(),
      notes: text("notes").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertUserSchema = createInsertSchema(users).pick({
      username: true,
      password: true
    });
    insertInspectionSchema = createInsertSchema(inspections).omit({
      id: true,
      createdAt: true
    }).extend({
      buildingInspectionId: z.number().nullable().optional(),
      images: z.array(z.string()).optional().default([]),
      verifiedRooms: z.array(z.string()).optional().default([]),
      isCompleted: z.boolean().optional().default(false),
      school: z.string().min(1, "School is required"),
      inspectionType: z.string().optional().default("whole_building"),
      locationDescription: z.string().optional().default(""),
      inspectorName: z.string().min(1, "Inspector name is required"),
      date: z.string().min(1, "Date is required"),
      // Make these fields nullable for building inspections
      floors: z.number().nullable().optional(),
      verticalHorizontalSurfaces: z.number().nullable().optional(),
      ceiling: z.number().nullable().optional(),
      restrooms: z.number().nullable().optional(),
      customerSatisfaction: z.number().nullable().optional(),
      trash: z.number().nullable().optional(),
      projectCleaning: z.number().nullable().optional(),
      activitySupport: z.number().nullable().optional(),
      safetyCompliance: z.number().nullable().optional(),
      equipment: z.number().nullable().optional(),
      monitoring: z.number().nullable().optional(),
      notes: z.string().nullable().optional()
    });
    insertRoomInspectionSchema = createInsertSchema(roomInspections).omit({
      id: true,
      createdAt: true
    }).extend({
      images: z.array(z.string()).optional().default([]),
      floors: z.number().nullable().optional(),
      verticalHorizontalSurfaces: z.number().nullable().optional(),
      ceiling: z.number().nullable().optional(),
      restrooms: z.number().nullable().optional(),
      customerSatisfaction: z.number().nullable().optional(),
      trash: z.number().nullable().optional(),
      projectCleaning: z.number().nullable().optional(),
      activitySupport: z.number().nullable().optional(),
      safetyCompliance: z.number().nullable().optional(),
      equipment: z.number().nullable().optional(),
      monitoring: z.number().nullable().optional(),
      notes: z.string().nullable().optional(),
      roomIdentifier: z.string().nullable().optional()
    });
    insertCustodialNoteSchema = createInsertSchema(custodialNotes).omit({
      id: true,
      createdAt: true
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db
});
import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import dotenv from "dotenv";
var sql, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    dotenv.config();
    neonConfig.fetchConnectionCache = true;
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set. Check your Replit Secrets tab.");
    }
    sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema: schema_exports });
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import { randomBytes } from "crypto";
import helmet from "helmet";
import compression from "compression";

// server/storage.ts
init_schema();
init_db();
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values([insertUser]).returning();
    return user;
  }
  async createInspection(insertInspection) {
    console.log("Creating inspection with data:", JSON.stringify(insertInspection, null, 2));
    try {
      const [inspection] = await db.insert(inspections).values([insertInspection]).returning();
      console.log("Successfully created inspection:", inspection);
      return inspection;
    } catch (error) {
      console.error("Database error creating inspection:", error);
      throw error;
    }
  }
  async getInspections() {
    return await db.select().from(inspections);
  }
  async getInspection(id) {
    const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
    return inspection || void 0;
  }
  async createCustodialNote(insertCustodialNote) {
    const [custodialNote] = await db.insert(custodialNotes).values([insertCustodialNote]).returning();
    return custodialNote;
  }
  async getCustodialNotes() {
    return await db.select().from(custodialNotes);
  }
  async getCustodialNote(id) {
    const [custodialNote] = await db.select().from(custodialNotes).where(eq(custodialNotes.id, id));
    return custodialNote || void 0;
  }
  async updateInspection(id, updates) {
    const [inspection] = await db.update(inspections).set(updates).where(eq(inspections.id, id)).returning();
    return inspection || void 0;
  }
  async createRoomInspection(insertRoomInspection) {
    const [roomInspection] = await db.insert(roomInspections).values([insertRoomInspection]).returning();
    return roomInspection;
  }
  async getRoomInspections() {
    return await db.select().from(roomInspections);
  }
  async getRoomInspection(id) {
    const [roomInspection] = await db.select().from(roomInspections).where(eq(roomInspections.id, id));
    return roomInspection || void 0;
  }
  async getRoomInspectionsByBuildingId(buildingInspectionId) {
    return await db.select().from(roomInspections).where(eq(roomInspections.buildingInspectionId, buildingInspectionId));
  }
  async deleteInspection(id) {
    const result = await db.delete(inspections).where(eq(inspections.id, id)).returning();
    return result.length > 0;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
init_schema();
import { z as z2 } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// server/logger.ts
var Logger = class {
  requestId = null;
  setRequestId(id) {
    this.requestId = id;
  }
  log(level, message, context) {
    const entry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      message,
      context,
      requestId: this.requestId || void 0
    };
    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(entry));
    } else {
      const contextStr = context ? ` ${JSON.stringify(context)}` : "";
      const requestStr = this.requestId ? ` [${this.requestId}]` : "";
      console.log(`[${entry.timestamp}] ${level}${requestStr}: ${message}${contextStr}`);
    }
  }
  info(message, context) {
    this.log("INFO", message, context);
  }
  warn(message, context) {
    this.log("WARN", message, context);
  }
  error(message, context) {
    this.log("ERROR", message, context);
  }
  debug(message, context) {
    if (process.env.NODE_ENV === "development") {
      this.log("DEBUG", message, context);
    }
  }
};
var logger = new Logger();
var requestIdMiddleware = (req, res, next) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  logger.setRequestId(requestId);
  next();
};

// server/routes.ts
var storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});
var upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024,
    // 5MB limit
    files: 5
    // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
async function registerRoutes(app2) {
  app2.post("/api/inspections", async (req, res) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.info("Creating new inspection", { requestId });
    try {
      console.log(`[${requestId}] Raw request body:`, JSON.stringify(req.body, null, 2));
      const validatedData = insertInspectionSchema.parse(req.body);
      console.log(`[${requestId}] Validated payload:`, JSON.stringify(validatedData, null, 2));
      const result = await storage.createInspection(validatedData);
      logger.info("Inspection created successfully", { requestId, inspectionId: result.id });
      return res.status(201).json({ success: true, id: result.id, ...result });
    } catch (err) {
      console.error(`[${requestId}] Failed to create inspection:`, err);
      logger.error("Failed to create inspection", { requestId, error: err });
      if (err instanceof z2.ZodError) {
        console.error(`[${requestId}] Validation errors:`, err.errors);
        return res.status(400).json({
          error: "Invalid inspection data",
          details: err.errors,
          message: "Please check all required fields are filled correctly"
        });
      }
      res.status(500).json({ error: "Failed to create inspection" });
    }
  });
  app2.get("/api/inspections", async (req, res) => {
    try {
      const { type, incomplete } = req.query;
      let inspections2;
      inspections2 = await storage.getInspections();
      console.log(`[GET] Found ${inspections2.length} total inspections`);
      if (type === "whole_building" && incomplete === "true") {
        const beforeFilter = inspections2.length;
        inspections2 = inspections2.filter(
          (inspection) => inspection.inspectionType === "whole_building" && !inspection.isCompleted
        );
        console.log(`[GET] Filtered whole_building incomplete: ${beforeFilter} \u2192 ${inspections2.length} inspections`);
        console.log(`[GET] Incomplete inspections:`, inspections2.map((i) => ({ id: i.id, school: i.school, isCompleted: i.isCompleted })));
      }
      res.json(inspections2);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      res.status(500).json({ error: "Failed to fetch inspections" });
    }
  });
  app2.get("/api/inspections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      const inspection = await storage.getInspection(id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      console.error("Error fetching inspection:", error);
      res.status(500).json({ error: "Failed to fetch inspection" });
    }
  });
  app2.post("/api/custodial-notes", upload.fields([{ name: "image", maxCount: 10 }, { name: "images", maxCount: 10 }]), async (req, res) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      console.log(`[${requestId}] POST /api/custodial-notes - Starting submission`);
      const __filesRecord = req.files || {};
      let __files = Array.isArray(__filesRecord) ? __filesRecord : [
        ...__filesRecord.image || [],
        ...__filesRecord.images || []
      ];
      req.files = __files;
      console.log(`[${requestId}] Body:`, req.body);
      console.log(`[${requestId}] Files:`, req.files?.map((f) => ({ name: f.originalname, size: f.size, path: f.path })));
      const filesRecord = req.files || {};
      const imageFiles = [
        ...filesRecord.image || [],
        ...filesRecord.images || []
      ];
      const uploadedPaths = imageFiles.map((f) => f.path);
      if (uploadedPaths.length) {
        req.body.notes = `${req.body.notes || ""}

Uploaded Images: ${uploadedPaths.join(", ")}`.trim();
      }
      const noteData = {
        inspectorName: req.body.inspectorName,
        school: req.body.school,
        date: req.body.date,
        location: req.body.location,
        locationDescription: req.body.locationDescription,
        notes: req.body.notes
      };
      console.log("Validating data:", noteData);
      const validatedData = insertCustodialNoteSchema.parse(noteData);
      const custodialNote = await storage.createCustodialNote(validatedData);
      console.log("Successfully created custodial note:", custodialNote.id);
      res.json(custodialNote);
    } catch (error) {
      console.error("Error creating custodial note:", error);
      if (req.files) {
        req.files.forEach((file) => {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.error("Error cleaning up file:", unlinkError);
          }
        });
      }
      if (error instanceof z2.ZodError) {
        res.status(400).json({
          error: "Invalid custodial note data",
          details: error.errors,
          message: "Please check all required fields are filled correctly"
        });
      } else if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({
            error: "File too large",
            message: "Maximum file size is 5MB per file"
          });
        } else if (error.code === "LIMIT_FILE_COUNT") {
          res.status(400).json({
            error: "Too many files",
            message: "Maximum 5 files allowed"
          });
        } else {
          res.status(400).json({
            error: "File upload error",
            message: error.message
          });
        }
      } else {
        res.status(500).json({
          error: "Failed to create custodial note",
          message: "Server error occurred. Please try again."
        });
      }
    }
  });
  app2.get("/api/custodial-notes", async (req, res) => {
    try {
      const custodialNotes2 = await storage.getCustodialNotes();
      res.json(custodialNotes2);
    } catch (error) {
      console.error("Error fetching custodial notes:", error);
      res.status(500).json({ error: "Failed to fetch custodial notes" });
    }
  });
  app2.get("/api/custodial-notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid custodial note ID" });
      }
      const custodialNote = await storage.getCustodialNote(id);
      if (!custodialNote) {
        return res.status(404).json({ error: "Custodial note not found" });
      }
      res.json(custodialNote);
    } catch (error) {
      console.error("Error fetching custodial note:", error);
      res.status(500).json({ error: "Failed to fetch custodial note" });
    }
  });
  app2.patch("/api/inspections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      const updates = req.body;
      console.log(`[PATCH] Updating inspection ${id} with:`, updates);
      const inspection = await storage.updateInspection(id, updates);
      if (!inspection) {
        console.log(`[PATCH] Inspection ${id} not found`);
        return res.status(404).json({ error: "Inspection not found" });
      }
      console.log(`[PATCH] Successfully updated inspection ${id}. isCompleted: ${inspection.isCompleted}`);
      res.json(inspection);
    } catch (error) {
      console.error("Error updating inspection:", error);
      res.status(500).json({ error: "Failed to update inspection" });
    }
  });
  app2.delete("/api/inspections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      const success = await storage.deleteInspection(id);
      if (!success) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json({ message: "Inspection deleted successfully" });
    } catch (error) {
      console.error("Error deleting inspection:", error);
      res.status(500).json({ error: "Failed to delete inspection" });
    }
  });
  app2.put("/api/inspections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      const validatedData = insertInspectionSchema.parse(req.body);
      const inspection = await storage.updateInspection(id, validatedData);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      console.error("Error updating inspection:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid inspection data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update inspection" });
      }
    }
  });
  app2.get("/api/inspections/:id/rooms", async (req, res) => {
    try {
      const buildingInspectionId = parseInt(req.params.id);
      if (isNaN(buildingInspectionId)) {
        return res.status(400).json({ error: "Invalid building inspection ID" });
      }
      const rooms = await storage.getRoomInspectionsByBuildingId(buildingInspectionId);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms for building inspection:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });
  app2.post("/api/room-inspections", async (req, res) => {
    try {
      console.log("[POST] Creating room inspection with data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertRoomInspectionSchema.parse(req.body);
      console.log("[POST] Validated room inspection data:", JSON.stringify(validatedData, null, 2));
      const roomInspection = await storage.createRoomInspection(validatedData);
      console.log("[POST] Successfully created room inspection:", roomInspection.id);
      res.json(roomInspection);
    } catch (error) {
      console.error("Error creating room inspection:", error);
      if (error instanceof z2.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({
          error: "Invalid room inspection data",
          details: error.errors,
          message: "Please check that all required fields are properly filled."
        });
      } else {
        console.error("Database or server error:", error);
        res.status(500).json({
          error: "Failed to create room inspection",
          message: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "Unknown server error" : "Server error occurred. Please try again."
        });
      }
    }
  });
  app2.get("/api/room-inspections", async (req, res) => {
    try {
      const buildingInspectionId = req.query.buildingInspectionId;
      const roomInspections2 = await storage.getRoomInspections();
      if (buildingInspectionId) {
        const filteredRooms = roomInspections2.filter(
          (room) => room.buildingInspectionId === parseInt(buildingInspectionId)
        );
        res.json(filteredRooms);
      } else {
        res.json(roomInspections2);
      }
    } catch (error) {
      console.error("Error fetching room inspections:", error);
      res.status(500).json({ error: "Failed to fetch room inspections" });
    }
  });
  app2.get("/api/room-inspections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid room inspection ID" });
      }
      const roomInspection = await storage.getRoomInspection(id);
      if (!roomInspection) {
        return res.status(404).json({ error: "Room inspection not found" });
      }
      res.json(roomInspection);
    } catch (error) {
      console.error("Error fetching room inspection:", error);
      res.status(500).json({ error: "Failed to fetch room inspection" });
    }
  });
}

// server/vite.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import { existsSync } from "fs";
import path2 from "path";
var log = console.log;
function serveStatic(app2) {
  const distPath = path2.join(process.cwd(), "dist/public");
  if (!existsSync(distPath)) {
    log.error('Build directory not found. Run "npm run build" first.');
    app2.get("*", (req, res) => {
      if (req.path.startsWith("/api") || req.path === "/health" || req.path === "/metrics") {
        return res.status(500).json({ error: "Application not built" });
      }
      res.status(500).send('<h1>Run "npm run build" first</h1>');
    });
    return;
  }
  app2.use(express.static(distPath));
  app2.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health" || req.path === "/metrics") {
      return next();
    }
    res.sendFile(path2.join(distPath, "index.html"));
  });
}

// server/security.ts
import rateLimit from "express-rate-limit";
var createRateLimit = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false
  });
};
var apiRateLimit = createRateLimit(15 * 60 * 1e3, 100);
var strictRateLimit = createRateLimit(15 * 60 * 1e3, 10);
var sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/javascript:/gi, "").replace(/on\w+\s*=/gi, "");
  };
  const sanitizeObject = (obj) => {
    if (typeof obj === "string") {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (typeof obj === "object" && obj !== null) {
      const sanitized = {};
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
var securityHeaders = (req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5000",
    "http://localhost:5173"
  ];
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    allowedOrigins.push(
      `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
      `https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co`,
      `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`
    );
  }
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
};
var validateRequest = (req, res, next) => {
  const contentLength = parseInt(req.headers["content-length"] || "0");
  if (contentLength > 10 * 1024 * 1024) {
    return res.status(413).json({ error: "Request too large" });
  }
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("application/json") && !contentType.includes("multipart/form-data")) {
      return res.status(400).json({ error: "Invalid content type" });
    }
  }
  next();
};

// server/monitoring.ts
var performanceMonitor = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl;
    const statusCode = res.statusCode;
    if (duration > 1e3) {
      logger.warn("Slow request detected", {
        method,
        url,
        duration,
        statusCode
      });
    }
    if (statusCode >= 400) {
      logger.error("Request failed", {
        method,
        url,
        statusCode,
        duration
      });
    }
    logger.debug("Request completed", {
      method,
      url,
      statusCode,
      duration
    });
  });
  next();
};
var healthCheck = async (req, res) => {
  const startTime = Date.now();
  try {
    let dbStatus = "connected";
    try {
      const { pool } = await Promise.resolve().then(() => (init_db(), db_exports));
      await pool.query("SELECT 1");
    } catch (error) {
      dbStatus = "error";
      logger.error("Database health check failed", { error: error instanceof Error ? error.message : "Unknown error" });
    }
    const memUsage = process.memoryUsage();
    const memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round(memUsage.heapUsed / memUsage.heapTotal * 100)
    };
    const health = {
      status: dbStatus === "error" ? "error" : "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: dbStatus,
      memory
    };
    const responseTime = Date.now() - startTime;
    res.setHeader("X-Response-Time", `${responseTime}ms`);
    if (health.status === "error") {
      res.status(503).json(health);
    } else {
      res.json(health);
    }
  } catch (error) {
    logger.error("Health check failed", { error: error instanceof Error ? error.message : "Unknown error" });
    res.status(500).json({
      status: "error",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: "Health check failed"
    });
  }
};
var errorHandler = (error, req, res, next) => {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logger.error("Unhandled error", {
    errorId,
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body
  });
  if (process.env.NODE_ENV === "production") {
  }
  res.status(error.status || 500).json({
    error: "Internal server error",
    errorId,
    message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
  });
};
var MetricsCollector = class {
  metrics = {};
  increment(metric, value = 1) {
    this.metrics[metric] = (this.metrics[metric] || 0) + value;
  }
  getMetrics() {
    return { ...this.metrics };
  }
  reset() {
    this.metrics = {};
  }
};
var metricsCollector = new MetricsCollector();
var metricsMiddleware = (req, res, next) => {
  metricsCollector.increment("requests_total");
  metricsCollector.increment(`requests_${req.method.toLowerCase()}`);
  res.on("finish", () => {
    metricsCollector.increment(`responses_${res.statusCode}`);
    if (res.statusCode >= 400) {
      metricsCollector.increment("errors_total");
    }
  });
  next();
};

// server/index.ts
var app = express2();
app.set("trust proxy", true);
app.use(requestIdMiddleware);
app.use(performanceMonitor);
app.use(metricsMiddleware);
app.use(helmet({
  contentSecurityPolicy: false,
  // Allow inline styles for development
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(securityHeaders);
app.use(validateRequest);
app.use(sanitizeInput);
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.use("/api", apiRateLimit);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    logger.info("Starting server setup...");
    if (process.env.REPL_SLUG) {
      logger.info("Running on Replit", {
        slug: process.env.REPL_SLUG,
        owner: process.env.REPL_OWNER
      });
    }
    const requiredEnvVars = ["DATABASE_URL"];
    const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      logger.error("Missing required environment variables", { missing: missingEnvVars });
      process.exit(1);
    }
    if (!process.env.SESSION_SECRET) {
      process.env.SESSION_SECRET = randomBytes(32).toString("hex");
      logger.warn("Generated temporary session secret");
    }
    await registerRoutes(app);
    logger.info("Routes registered successfully");
    const server = createServer(app);
    logger.info("HTTP server created");
    app.get("/health", healthCheck);
    app.get("/metrics", (req, res) => {
      res.json(metricsCollector.getMetrics());
    });
    logger.info("Health check endpoints configured");
    serveStatic(app);
    logger.info("Static file serving configured");
    app.use(errorHandler);
    const PORT = parseInt(process.env.PORT || "5000", 10);
    const HOST = "0.0.0.0";
    logger.info(`About to listen on port ${PORT}...`);
    server.listen(PORT, HOST, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "1.0.0"
      });
    });
    const shutdown = (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Error during server startup", { error: error instanceof Error ? error.message : "Unknown error" });
    throw error;
  }
})().catch((error) => {
  logger.error("Unhandled error in server startup", { error: error instanceof Error ? error.message : "Unknown error" });
  process.exit(1);
});
app.use((req, res, next) => {
  try {
    res.removeHeader("X-Frame-Options");
    res.removeHeader("Cross-Origin-Opener-Policy");
    res.removeHeader("Cross-Origin-Embedder-Policy");
    const fa = "frame-ancestors 'self' https://replit.com https://*.replit.com https://*.replit.dev https://*.replit.app";
    const current = res.getHeader("Content-Security-Policy");
    if (!current) {
      res.setHeader("Content-Security-Policy", fa);
    } else {
      const value = Array.isArray(current) ? current.join("; ") : String(current);
      const re = /frame-ancestors[^;]*/i;
      const newVal = re.test(value) ? value.replace(re, fa) : value ? value + "; " + fa : fa;
      res.setHeader("Content-Security-Policy", newVal);
    }
  } catch {
  }
  next();
});
app.use((req, res, next) => {
  try {
    res.removeHeader("X-Frame-Options");
    res.removeHeader("Cross-Origin-Opener-Policy");
    res.removeHeader("Cross-Origin-Embedder-Policy");
    const fa = "frame-ancestors 'self' https://replit.com https://*.replit.com https://*.replit.dev https://*.replit.app";
    const current = res.getHeader("Content-Security-Policy");
    if (!current) {
      res.setHeader("Content-Security-Policy", fa);
    } else {
      const value = Array.isArray(current) ? current.join("; ") : String(current);
      const re = /frame-ancestors[^;]*/i;
      const newVal = re.test(value) ? value.replace(re, fa) : value ? value + "; " + fa : fa;
      res.setHeader("Content-Security-Policy", newVal);
    }
  } catch {
  }
  next();
});
