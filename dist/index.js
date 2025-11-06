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
  insertMonthlyFeedbackSchema: () => insertMonthlyFeedbackSchema,
  insertRoomInspectionSchema: () => insertRoomInspectionSchema,
  insertUserSchema: () => insertUserSchema,
  inspections: () => inspections,
  monthlyFeedback: () => monthlyFeedback,
  roomInspections: () => roomInspections,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var coerceNullableNumber, users, inspections, roomInspections, custodialNotes, monthlyFeedback, insertUserSchema, insertInspectionSchema, insertRoomInspectionSchema, insertCustodialNoteSchema, insertMonthlyFeedbackSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    coerceNullableNumber = z.preprocess(
      (value) => value === "" || value === void 0 ? null : value,
      z.coerce.number().nullable()
    );
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
      responses: text("responses"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    custodialNotes = pgTable("custodial_notes", {
      id: serial("id").primaryKey(),
      inspectorName: text("inspector_name"),
      school: text("school").notNull(),
      date: text("date").notNull(),
      location: text("location").notNull(),
      locationDescription: text("location_description"),
      notes: text("notes").notNull(),
      images: text("images").array().default([]),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    monthlyFeedback = pgTable("monthly_feedback", {
      id: serial("id").primaryKey(),
      school: text("school").notNull(),
      month: text("month").notNull(),
      year: integer("year").notNull(),
      pdfUrl: text("pdf_url").notNull(),
      pdfFileName: text("pdf_file_name").notNull(),
      extractedText: text("extracted_text"),
      notes: text("notes"),
      uploadedBy: text("uploaded_by"),
      fileSize: integer("file_size"),
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
      floors: coerceNullableNumber.optional(),
      verticalHorizontalSurfaces: coerceNullableNumber.optional(),
      ceiling: coerceNullableNumber.optional(),
      restrooms: coerceNullableNumber.optional(),
      customerSatisfaction: coerceNullableNumber.optional(),
      trash: coerceNullableNumber.optional(),
      projectCleaning: coerceNullableNumber.optional(),
      activitySupport: coerceNullableNumber.optional(),
      safetyCompliance: coerceNullableNumber.optional(),
      equipment: coerceNullableNumber.optional(),
      monitoring: coerceNullableNumber.optional(),
      notes: z.string().nullable().optional()
    });
    insertRoomInspectionSchema = createInsertSchema(roomInspections).omit({
      id: true,
      createdAt: true
    }).extend({
      buildingInspectionId: z.coerce.number().int(),
      // Coerce string to number for tests
      roomType: z.string().min(1, "Room type is required"),
      images: z.array(z.string()).optional().default([]),
      floors: coerceNullableNumber.optional(),
      verticalHorizontalSurfaces: coerceNullableNumber.optional(),
      ceiling: coerceNullableNumber.optional(),
      restrooms: coerceNullableNumber.optional(),
      customerSatisfaction: coerceNullableNumber.optional(),
      trash: coerceNullableNumber.optional(),
      projectCleaning: coerceNullableNumber.optional(),
      activitySupport: coerceNullableNumber.optional(),
      safetyCompliance: coerceNullableNumber.optional(),
      equipment: coerceNullableNumber.optional(),
      monitoring: coerceNullableNumber.optional(),
      notes: z.string().nullable().optional(),
      roomIdentifier: z.string().nullable().optional()
    });
    insertCustodialNoteSchema = createInsertSchema(custodialNotes).omit({
      id: true,
      createdAt: true
    }).extend({
      inspectorName: z.string().min(1, "Inspector name is required").max(100, "Inspector name too long"),
      school: z.string().min(1, "School is required").max(100, "School name too long"),
      date: z.string().min(1, "Date is required"),
      location: z.string().min(1, "Location is required").max(200, "Location too long"),
      locationDescription: z.string().max(500, "Location description too long").optional().nullable(),
      notes: z.string().min(10, "Please provide a detailed description (minimum 10 characters)").max(5e3, "Notes too long"),
      images: z.array(z.string()).optional().default([])
    });
    insertMonthlyFeedbackSchema = createInsertSchema(monthlyFeedback).omit({ id: true, createdAt: true }).extend({
      school: z.string().min(1, "School is required").max(100),
      month: z.string().min(1, "Month is required").max(20),
      year: z.number().int().min(2020).max(2100, "Invalid year"),
      pdfUrl: z.string().min(1, "PDF URL is required").max(500),
      pdfFileName: z.string().min(1).max(255),
      extractedText: z.string().nullable().optional(),
      notes: z.string().max(5e3).nullable().optional(),
      uploadedBy: z.string().max(255).nullable().optional(),
      fileSize: z.number().int().positive().nullable().optional()
    });
  }
});

// server/logger.ts
var Logger, logger, requestIdMiddleware;
var init_logger = __esm({
  "server/logger.ts"() {
    "use strict";
    Logger = class {
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
    logger = new Logger();
    requestIdMiddleware = (req, res, next) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      req.requestId = requestId;
      res.setHeader("X-Request-ID", requestId);
      logger.setRequestId(requestId);
      next();
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool
});
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
var sql, db, pool;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_logger();
    config();
    neonConfig.fetchConnectionCache = true;
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set. Check your Replit Secrets tab.");
    }
    sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema: schema_exports });
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.query("SELECT 1").then(() => {
      logger.info("Database connection established successfully");
    }).catch((error) => {
      logger.error("Database connection failed", { error: error instanceof Error ? error.message : "Unknown error" });
    });
  }
});

// server/index.ts
import express3 from "express";
import { createServer } from "http";
import { randomBytes } from "crypto";
import helmet from "helmet";
import compression from "compression";

// server/routes.ts
import * as express from "express";
import * as path3 from "path";

// server/storage.ts
init_db();
init_schema();
init_logger();
import { eq, desc } from "drizzle-orm";
var storage = {
  // Inspection methods
  async createInspection(data) {
    try {
      const [result] = await db.insert(inspections).values(data).returning();
      logger.info("Created inspection:", { id: result.id });
      return result;
    } catch (error) {
      logger.error("Error creating inspection:", error);
      throw error;
    }
  },
  async getInspections() {
    try {
      const result = await db.select().from(inspections);
      logger.info(`Retrieved ${result.length} inspections`);
      return result;
    } catch (error) {
      logger.error("Error getting inspections:", error);
      throw error;
    }
  },
  async getInspection(id) {
    try {
      const [result] = await db.select().from(inspections).where(eq(inspections.id, id));
      logger.info("Retrieved inspection:", { id });
      return result;
    } catch (error) {
      logger.error("Error getting inspection:", error);
      throw error;
    }
  },
  async updateInspection(id, data) {
    try {
      const [result] = await db.update(inspections).set(data).where(eq(inspections.id, id)).returning();
      logger.info("Updated inspection:", { id });
      return result;
    } catch (error) {
      logger.error("Error updating inspection:", error);
      throw error;
    }
  },
  async deleteInspection(id) {
    try {
      await db.delete(inspections).where(eq(inspections.id, id));
      logger.info("Deleted inspection:", { id });
      return true;
    } catch (error) {
      logger.error("Error deleting inspection:", error);
      return false;
    }
  },
  // Custodial Notes methods
  async createCustodialNote(data) {
    try {
      const [result] = await db.insert(custodialNotes).values(data).returning();
      logger.info("Created custodial note:", { id: result.id });
      return result;
    } catch (error) {
      logger.error("Error creating custodial note:", error);
      throw error;
    }
  },
  async getCustodialNotes() {
    try {
      const result = await db.select().from(custodialNotes);
      logger.info(`Retrieved ${result.length} custodial notes`);
      return result;
    } catch (error) {
      logger.error("Error getting custodial notes:", error);
      throw error;
    }
  },
  async getCustodialNote(id) {
    try {
      const [result] = await db.select().from(custodialNotes).where(eq(custodialNotes.id, id));
      logger.info("Retrieved custodial note:", { id });
      return result;
    } catch (error) {
      logger.error("Error getting custodial note:", error);
      throw error;
    }
  },
  async deleteCustodialNote(id) {
    try {
      await db.delete(custodialNotes).where(eq(custodialNotes.id, id));
      logger.info("Deleted custodial note:", { id });
      return true;
    } catch (error) {
      logger.error("Error deleting custodial note:", error);
      return false;
    }
  },
  // Room Inspections methods
  async createRoomInspection(data) {
    try {
      const [result] = await db.insert(roomInspections).values(data).returning();
      logger.info("Created room inspection:", { id: result.id });
      return result;
    } catch (error) {
      logger.error("Error creating room inspection:", error);
      throw error;
    }
  },
  async getRoomInspections() {
    try {
      const result = await db.select().from(roomInspections);
      logger.info(`Retrieved ${result.length} room inspections`);
      return result;
    } catch (error) {
      logger.error("Error getting room inspections:", error);
      throw error;
    }
  },
  async getRoomInspection(id) {
    try {
      const [result] = await db.select().from(roomInspections).where(eq(roomInspections.id, id));
      logger.info("Retrieved room inspection:", { id });
      return result;
    } catch (error) {
      logger.error("Error getting room inspection:", error);
      throw error;
    }
  },
  async getRoomInspectionsByBuildingId(buildingInspectionId) {
    try {
      const result = await db.select().from(roomInspections).where(eq(roomInspections.buildingInspectionId, buildingInspectionId));
      logger.info(`Retrieved ${result.length} room inspections for building:`, { buildingInspectionId });
      return result;
    } catch (error) {
      logger.error("Error getting room inspections by building ID:", error);
      throw error;
    }
  },
  // Monthly Feedback methods
  async createMonthlyFeedback(data) {
    try {
      const [result] = await db.insert(monthlyFeedback).values(data).returning();
      logger.info("Created monthly feedback:", { id: result.id, school: result.school });
      return result;
    } catch (error) {
      logger.error("Error creating monthly feedback:", error);
      throw error;
    }
  },
  async getMonthlyFeedback() {
    try {
      const result = await db.select().from(monthlyFeedback).orderBy(desc(monthlyFeedback.createdAt));
      logger.info(`Retrieved ${result.length} monthly feedback documents`);
      return result;
    } catch (error) {
      logger.error("Error getting monthly feedback:", error);
      throw error;
    }
  },
  async getMonthlyFeedbackById(id) {
    try {
      const [result] = await db.select().from(monthlyFeedback).where(eq(monthlyFeedback.id, id));
      logger.info("Retrieved monthly feedback:", { id });
      return result;
    } catch (error) {
      logger.error("Error getting monthly feedback by id:", error);
      throw error;
    }
  },
  async deleteMonthlyFeedback(id) {
    try {
      await db.delete(monthlyFeedback).where(eq(monthlyFeedback.id, id));
      logger.info("Deleted monthly feedback:", { id });
      return true;
    } catch (error) {
      logger.error("Error deleting monthly feedback:", error);
      return false;
    }
  },
  async updateMonthlyFeedbackNotes(id, notes) {
    try {
      const [result] = await db.update(monthlyFeedback).set({ notes }).where(eq(monthlyFeedback.id, id)).returning();
      logger.info("Updated monthly feedback notes:", { id });
      return result;
    } catch (error) {
      logger.error("Error updating monthly feedback notes:", error);
      throw error;
    }
  }
};

// server/routes.ts
init_schema();
init_logger();
import { z as z2 } from "zod";
import multer from "multer";

// server/doclingService.ts
init_logger();
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
var execAsync = promisify(exec);
var DoclingService = class {
  async extractTextFromPDF(pdfBuffer, originalFilename) {
    const tempDir = path.join(process.cwd(), "temp");
    const tempPdfPath = path.join(tempDir, `temp-${Date.now()}-${originalFilename}`);
    const tempMdPath = tempPdfPath.replace(".pdf", ".md");
    try {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(tempPdfPath, pdfBuffer);
      const { stdout, stderr } = await execAsync(
        `docling "${tempPdfPath}" --output "${tempDir}"`,
        { maxBuffer: 10 * 1024 * 1024 }
        // 10MB buffer
      );
      if (stderr && !stderr.includes("WARNING")) {
        logger.warn("Docling stderr:", stderr);
      }
      const markdownContent = await fs.readFile(tempMdPath, "utf-8");
      await fs.unlink(tempPdfPath).catch((e) => logger.warn("Cleanup error:", e));
      await fs.unlink(tempMdPath).catch((e) => logger.warn("Cleanup error:", e));
      if (!markdownContent || markdownContent.trim().length === 0) {
        logger.warn("Docling extracted empty content");
        return null;
      }
      logger.info("Docling extraction successful", {
        filename: originalFilename,
        extractedLength: markdownContent.length
      });
      return markdownContent;
    } catch (error) {
      logger.error("Docling extraction error:", error);
      await fs.unlink(tempPdfPath).catch(() => {
      });
      await fs.unlink(tempMdPath).catch(() => {
      });
      return null;
    }
  }
};
var doclingService = new DoclingService();

// server/objectStorage.ts
init_logger();
import fs2 from "fs/promises";
import path2 from "path";
var ObjectStorageService = class {
  storagePath;
  constructor() {
    this.storagePath = path2.join(process.cwd(), "uploads");
    this.ensureStorageDirectory();
  }
  async ensureStorageDirectory() {
    try {
      await fs2.mkdir(this.storagePath, { recursive: true });
      logger.info(`Storage directory ensured: ${this.storagePath}`);
    } catch (error) {
      logger.error("Failed to create storage directory:", error);
    }
  }
  async uploadLargeFile(fileBuffer, originalName, category = "general") {
    try {
      const safeCategory = (category || "general").replace(/[^a-zA-Z0-9_-]/g, "-");
      const categoryDir = path2.join(this.storagePath, safeCategory);
      await fs2.mkdir(categoryDir, { recursive: true });
      const timestamp2 = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = path2.extname(originalName) || ".bin";
      const filename = `${timestamp2}-${randomId}${extension}`;
      const filePath = path2.join(categoryDir, filename);
      await fs2.writeFile(filePath, fileBuffer);
      const publicUrl = `/uploads/${safeCategory}/${filename}`;
      logger.info(`File uploaded: ${filename} (${fileBuffer.length} bytes)`);
      return {
        success: true,
        filename: `${safeCategory}/${filename}`,
        filePath,
        publicUrl,
        size: fileBuffer.length,
        originalName
      };
    } catch (error) {
      logger.error("Error uploading file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async getObjectFile(filename) {
    try {
      const filePath = path2.join(this.storagePath, filename);
      const fileBuffer = await fs2.readFile(filePath);
      logger.info(`File retrieved: ${filename}`);
      return {
        success: true,
        buffer: fileBuffer,
        filename
      };
    } catch (error) {
      logger.error("Error retrieving file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "File not found"
      };
    }
  }
  async deleteFile(filename) {
    try {
      const filePath = path2.join(this.storagePath, filename);
      await fs2.unlink(filePath);
      logger.info(`File deleted: ${filename}`);
      return {
        success: true
      };
    } catch (error) {
      logger.error("Error deleting file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "File not found"
      };
    }
  }
};

// server/utils/scoring.ts
var SENTIMENT_PATTERNS = {
  positive: [
    /\b(excellent|outstanding|exceptional|great|good|clean|well maintained|shine|bright|fresh|spotless|tidy)\b/i,
    /\b(going well|improving|progress|complimentary)\b/i
  ],
  major: [
    /\b(crisis|unsafe|hazard|broken|damaged|filthy|disgusting|unacceptable|failure|critical)\b/i,
    /\b(not working|completely|severe|major|serious|significant)\b/i,
    /\b(overflowing|overflow|smells|stinks|foul|offensive)\b/i
  ],
  minor: [
    /\b(needs|need|should|could|minor|slight|small|little|dull|dingy|stain|streak|smudge)\b/i,
    /\b(attention|cleaning|maintenance|repair|replace|fix)\b/i
  ]
};
function analyzeSentiment(noteText) {
  const lowerText = noteText.toLowerCase();
  if (SENTIMENT_PATTERNS.major.some((pattern) => pattern.test(lowerText))) {
    return "major" /* MAJOR_ISSUE */;
  }
  if (SENTIMENT_PATTERNS.minor.some((pattern) => pattern.test(lowerText))) {
    return "minor" /* MINOR_ISSUE */;
  }
  if (SENTIMENT_PATTERNS.positive.some((pattern) => pattern.test(lowerText))) {
    return "positive" /* POSITIVE */;
  }
  return "neutral" /* NEUTRAL */;
}
function calculateNotesSentimentScore(notes) {
  if (notes.length === 0) return 0;
  let totalSentimentScore = 0;
  for (const note of notes) {
    const sentiment = analyzeSentiment(note.notes);
    switch (sentiment) {
      case "positive" /* POSITIVE */:
        totalSentimentScore += 0.1;
        break;
      case "minor" /* MINOR_ISSUE */:
        totalSentimentScore -= 0.1;
        break;
      case "major" /* MAJOR_ISSUE */:
        totalSentimentScore -= 0.3;
        break;
      case "neutral" /* NEUTRAL */:
      default:
        break;
    }
  }
  const averageSentiment = totalSentimentScore / notes.length;
  return Math.max(-0.5, Math.min(0.5, averageSentiment));
}
function calculateInspectionScore(inspection) {
  const ratingFields = [
    inspection.floors,
    inspection.verticalHorizontalSurfaces,
    inspection.ceiling,
    inspection.restrooms,
    inspection.customerSatisfaction,
    inspection.trash,
    inspection.projectCleaning,
    inspection.activitySupport,
    inspection.safetyCompliance,
    inspection.equipment,
    inspection.monitoring
  ];
  const validRatings = ratingFields.filter(
    (rating) => rating !== null && rating !== void 0 && rating >= 0
  );
  if (validRatings.length === 0) return null;
  const sum = validRatings.reduce((acc, rating) => acc + (rating || 0), 0);
  return sum / validRatings.length;
}
function calculateCategoryBreakdown(inspections2) {
  const categories = [
    { key: "floors", name: "Floors" },
    { key: "verticalHorizontalSurfaces", name: "Surfaces" },
    { key: "ceiling", name: "Ceiling" },
    { key: "restrooms", name: "Restrooms" },
    { key: "customerSatisfaction", name: "Customer Satisfaction" },
    { key: "trash", name: "Trash" },
    { key: "projectCleaning", name: "Project Cleaning" },
    { key: "activitySupport", name: "Activity Support" },
    { key: "safetyCompliance", name: "Safety & Compliance" },
    { key: "equipment", name: "Equipment" },
    { key: "monitoring", name: "Monitoring" }
  ];
  return categories.map(({ key, name }) => {
    const ratings = inspections2.map((i) => i[key]).filter((r) => r !== null && r !== void 0 && r >= 0);
    const averageRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + (r || 0), 0) / ratings.length : 0;
    return {
      category: name,
      averageRating,
      count: ratings.length
    };
  });
}
function calculateBuildingScore(inspections2, notes) {
  const inspectionScores = inspections2.map((inspection) => calculateInspectionScore(inspection)).filter((score) => score !== null);
  const inspectionScore = inspectionScores.length > 0 ? inspectionScores.reduce((acc, score) => acc + score, 0) / inspectionScores.length : 0;
  const notesModifier = calculateNotesSentimentScore(notes);
  const weightedInspection = inspectionScore * 0.75;
  const weightedNotes = notesModifier * 0.25;
  const overallScore = weightedInspection + weightedNotes;
  const categoryBreakdown = calculateCategoryBreakdown(inspections2);
  return {
    overallScore,
    inspectionScore,
    notesModifier,
    level2Compliant: overallScore >= 3,
    inspectionCount: inspections2.length,
    notesCount: notes.length,
    categoryBreakdown
  };
}
function calculateSchoolScores(inspectionsBySchool, notesBySchool, dateRange) {
  const schools = Object.keys(inspectionsBySchool);
  const schoolScores = schools.map((school) => {
    const inspections2 = inspectionsBySchool[school] || [];
    const notes = notesBySchool[school] || [];
    return {
      school,
      score: calculateBuildingScore(inspections2, notes),
      dateRange: dateRange || {
        start: inspections2[0]?.date || notes[0]?.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        end: inspections2[inspections2.length - 1]?.date || notes[notes.length - 1]?.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      }
    };
  });
  return schoolScores.sort((a, b) => b.score.overallScore - a.score.overallScore);
}
function getComplianceStatus(score) {
  if (score >= 4) {
    return { text: "Exceeds Standards", color: "green" };
  } else if (score >= 3) {
    return { text: "Meets Level 2 Standards", color: "green" };
  } else if (score >= 2) {
    return { text: "Below Standards", color: "yellow" };
  } else {
    return { text: "Needs Immediate Attention", color: "red" };
  }
}

// server/routes.ts
var objectStorageService = new ObjectStorageService();
var upload = multer({
  storage: multer.memoryStorage(),
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
  app2.post("/api/inspections", upload.array("images"), async (req, res) => {
    logger.info("[POST] Building inspection submission started", {
      body: req.body,
      files: req.files ? req.files.length : 0
    });
    try {
      const { inspectorName, school, inspectionType } = req.body;
      const files = req.files;
      if (!school || !inspectionType) {
        logger.warn("[POST] Missing required fields", { school, inspectionType });
        return res.status(400).json({
          message: "Missing required fields",
          details: { school: !!school, inspectionType: !!inspectionType }
        });
      }
      let imageUrls = [];
      if (files && files.length > 0) {
        logger.info("[POST] Processing uploaded files with object storage", { count: files.length });
        for (const file of files) {
          try {
            const filename = `inspections/${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
            const uploadResult = await objectStorageService.uploadLargeFile(
              file.buffer,
              filename,
              file.mimetype
            );
            if (uploadResult.success) {
              imageUrls.push(`/objects/${filename}`);
              logger.info("[POST] File uploaded to object storage", { filename, url: `/objects/${filename}` });
            } else {
              logger.error("[POST] Failed to upload file to object storage", { filename, error: uploadResult.error });
            }
          } catch (uploadError) {
            logger.error("[POST] Error uploading file to object storage:", uploadError);
          }
        }
      }
      const inspectionData = {
        inspectorName: inspectorName || "",
        school,
        date: req.body.date || (/* @__PURE__ */ new Date()).toISOString(),
        inspectionType,
        locationDescription: req.body.locationDescription || "",
        roomNumber: req.body.roomNumber || null,
        locationCategory: req.body.locationCategory || null,
        floors: req.body.floors || null,
        verticalHorizontalSurfaces: req.body.verticalHorizontalSurfaces || null,
        ceiling: req.body.ceiling || null,
        restrooms: req.body.restrooms || null,
        customerSatisfaction: req.body.customerSatisfaction || null,
        trash: req.body.trash || null,
        projectCleaning: req.body.projectCleaning || null,
        activitySupport: req.body.activitySupport || null,
        safetyCompliance: req.body.safetyCompliance || null,
        equipment: req.body.equipment || null,
        monitoring: req.body.monitoring || null,
        notes: req.body.notes || null,
        images: imageUrls,
        verifiedRooms: [],
        isCompleted: false
      };
      logger.info("[POST] Creating building inspection", { inspectionData });
      try {
        const validatedData = insertInspectionSchema.parse(inspectionData);
        const newInspection = await storage.createInspection(validatedData);
        logger.info("[POST] Building inspection created successfully", { id: newInspection.id });
        res.status(201).json({
          message: "Building inspection created successfully",
          id: newInspection.id,
          imageCount: imageUrls.length
        });
      } catch (validationError) {
        if (validationError instanceof z2.ZodError) {
          logger.warn("[POST] Validation failed", { errors: validationError.errors });
          return res.status(400).json({
            message: "Invalid inspection data",
            details: validationError.errors
          });
        }
        throw validationError;
      }
    } catch (error) {
      logger.error("[POST] Error creating building inspection:", error);
      res.status(500).json({ message: "Internal server error" });
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
  app2.post("/api/custodial-notes", upload.array("images"), async (req, res) => {
    logger.info("[POST] Custodial Notes submission started", {
      body: req.body,
      files: req.files ? req.files.length : 0
    });
    try {
      const { inspectorName, school, date, locationDescription, location, notes } = req.body;
      const files = req.files;
      if (!inspectorName || !school || !date || !location) {
        logger.warn("[POST] Missing required fields", { inspectorName, school, date, location });
        return res.status(400).json({
          message: "Missing required fields",
          details: { inspectorName: !!inspectorName, school: !!school, date: !!date, location: !!location }
        });
      }
      let imageUrls = [];
      if (files && files.length > 0) {
        logger.info("[POST] Processing uploaded files with object storage", { count: files.length });
        for (const file of files) {
          try {
            const filename = `custodial-notes/${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
            const uploadResult = await objectStorageService.uploadLargeFile(
              file.buffer,
              filename,
              file.mimetype
            );
            if (uploadResult.success) {
              imageUrls.push(`/objects/${filename}`);
              logger.info("[POST] File uploaded to object storage", { filename, url: `/objects/${filename}` });
            } else {
              logger.error("[POST] Failed to upload file to object storage", { filename, error: uploadResult.error });
            }
          } catch (uploadError) {
            logger.error("[POST] Error uploading file to object storage:", uploadError);
          }
        }
      }
      const custodialNote = {
        inspectorName,
        school,
        date,
        location,
        locationDescription: locationDescription || null,
        notes: notes || "",
        images: imageUrls
      };
      logger.info("[POST] Validating custodial note data", { custodialNote });
      const validatedData = insertCustodialNoteSchema.parse(custodialNote);
      logger.info("[POST] Creating custodial note", { validatedData });
      const custodialNoteResult = await storage.createCustodialNote(validatedData);
      logger.info("[POST] Custodial note created successfully", { id: custodialNoteResult.id });
      res.status(201).json({
        message: "Custodial note submitted successfully",
        id: custodialNoteResult.id,
        imageCount: imageUrls.length
      });
    } catch (error) {
      logger.error("[POST] Error creating custodial note:", error);
      res.status(500).json({ message: "Internal server error" });
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
  app2.post("/api/submit-building-inspection", async (req, res) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.info("Creating building inspection via submit endpoint", { requestId });
    try {
      console.log(`[${requestId}] Raw building inspection request:`, JSON.stringify(req.body, null, 2));
      console.log(`[${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
      if (!req.body) {
        logger.warn(`[${requestId}] No request body received`);
        return res.status(400).json({
          error: "No request body received",
          message: "Please ensure the request contains valid JSON data"
        });
      }
      const validatedData = insertInspectionSchema.parse(req.body);
      console.log(`[${requestId}] Validated building inspection:`, JSON.stringify(validatedData, null, 2));
      const result = await storage.createInspection(validatedData);
      logger.info("Building inspection created successfully", { requestId, inspectionId: result.id });
      const responsePayload = { success: true, id: result.id, ...result };
      console.log(`[${requestId}] Response (JSON):`, JSON.stringify(responsePayload, null, 2));
      res.setHeader("Content-Type", "application/json");
      return res.status(201).json(responsePayload);
    } catch (err) {
      console.error(`[${requestId}] Failed to create building inspection:`, err);
      logger.error("Failed to create building inspection", { requestId, error: err });
      if (err instanceof z2.ZodError) {
        console.error(`[${requestId}] Validation errors:`, err.errors);
        return res.status(400).json({
          error: "Invalid building inspection data",
          details: err.errors,
          message: "Please check all required fields are filled correctly"
        });
      }
      const errorPayload = {
        error: "Failed to create building inspection",
        message: "An internal server error occurred. Please try again.",
        requestId
      };
      console.log(`[${requestId}] Response (ERROR JSON):`, JSON.stringify(errorPayload, null, 2));
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json(errorPayload);
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
      res.status(201).json(roomInspection);
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
  app2.post("/api/inspections/:id/rooms/:roomId/submit", upload.array("images"), async (req, res) => {
    logger.info("[POST] Room inspection submission started", {
      inspectionId: req.params.id,
      roomId: req.params.roomId,
      body: req.body,
      files: req.files ? req.files.length : 0
    });
    try {
      const inspectionId = parseInt(req.params.id);
      const roomId = parseInt(req.params.roomId);
      const { responses } = req.body;
      const files = req.files;
      if (!responses) {
        logger.warn("[POST] Missing responses", { inspectionId, roomId });
        return res.status(400).json({ message: "Missing responses data" });
      }
      let parsedResponses;
      try {
        parsedResponses = typeof responses === "string" ? JSON.parse(responses) : responses;
      } catch (parseError) {
        logger.error("[POST] Error parsing responses:", parseError);
        return res.status(400).json({ message: "Invalid responses format" });
      }
      let imageUrls = [];
      if (files && files.length > 0) {
        logger.info("[POST] Processing uploaded files with object storage", { count: files.length });
        for (const file of files) {
          try {
            const filename = `room-inspections/${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
            const uploadResult = await objectStorageService.uploadLargeFile(
              file.buffer,
              filename,
              file.mimetype
            );
            if (uploadResult.success) {
              imageUrls.push(`/objects/${filename}`);
              logger.info("[POST] File uploaded to object storage", { filename, url: `/objects/${filename}` });
            } else {
              logger.error("[POST] Failed to upload file to object storage", { filename, error: uploadResult.error });
            }
          } catch (uploadError) {
            logger.error("[POST] Error uploading file to object storage:", uploadError);
          }
        }
      }
      const updatedRoom = await storage.updateRoomInspection(roomId, inspectionId, {
        responses: JSON.stringify(parsedResponses),
        images: JSON.stringify(imageUrls),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        isCompleted: true
      });
      if (!updatedRoom) {
        logger.error("[POST] Room not found", { inspectionId, roomId });
        return res.status(404).json({ message: "Room not found" });
      }
      logger.info("[POST] Room inspection completed successfully", {
        inspectionId,
        roomId,
        responseCount: Object.keys(parsedResponses).length,
        imageCount: imageUrls.length
      });
      res.status(200).json({
        message: "Room inspection submitted successfully",
        roomId: updatedRoom.id,
        responseCount: Object.keys(parsedResponses).length,
        imageCount: imageUrls.length
      });
    } catch (error) {
      logger.error("[POST] Error submitting room inspection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/inspections/:id/finalize", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      const inspection = await storage.updateInspection(id, { isCompleted: true });
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      console.error("Error finalizing inspection:", error);
      res.status(500).json({ error: "Failed to finalize inspection" });
    }
  });
  app2.use("/uploads", express.static(path3.join(process.cwd(), "uploads")));
  app2.get("/objects/:filename(*)", async (req, res) => {
    try {
      const filename = req.params.filename;
      logger.info("[GET] Serving object from storage", { filename });
      const objectFile = await objectStorageService.getObjectFile(filename);
      if (!objectFile) {
        logger.warn("[GET] Object not found", { filename });
        return res.status(404).json({ message: "File not found" });
      }
      const downloadResult = await objectStorageService.downloadObject(filename);
      if (!downloadResult.success || !downloadResult.data) {
        logger.error("[GET] Failed to download object", { filename, error: downloadResult.error });
        return res.status(500).json({ message: "Failed to serve file" });
      }
      res.set({
        "Content-Type": objectFile.httpMetadata?.contentType || "application/octet-stream",
        "Content-Length": downloadResult.data.length.toString(),
        "Cache-Control": "public, max-age=31536000",
        // 1 year cache
        "ETag": `"${objectFile.httpEtag}"`
      });
      res.send(downloadResult.data);
      logger.info("[GET] Object served successfully", { filename, size: downloadResult.data.length });
    } catch (error) {
      logger.error("[GET] Error serving object:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password are required"
        });
      }
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        logger.error("ADMIN_PASSWORD environment variable not set");
        return res.status(500).json({
          success: false,
          message: "Server configuration error"
        });
      }
      if (username === adminUsername && password === adminPassword) {
        const sessionToken = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (!global.adminSessions) {
          global.adminSessions = /* @__PURE__ */ new Map();
        }
        global.adminSessions.set(sessionToken, {
          username,
          createdAt: /* @__PURE__ */ new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3)
          // 24 hours
        });
        logger.info("Admin login successful", { username });
        res.json({
          success: true,
          message: "Login successful",
          sessionToken
        });
      } else {
        logger.warn("Admin login failed", { username });
        res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }
    } catch (error) {
      logger.error("Admin login error", { error });
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  const validateAdminSession = (req, res, next) => {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "");
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "No session token provided"
      });
    }
    if (!global.adminSessions) {
      return res.status(401).json({
        success: false,
        message: "No active sessions"
      });
    }
    const session = global.adminSessions.get(sessionToken);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid session token"
      });
    }
    if (/* @__PURE__ */ new Date() > session.expiresAt) {
      global.adminSessions.delete(sessionToken);
      return res.status(401).json({
        success: false,
        message: "Session expired"
      });
    }
    req.adminSession = session;
    next();
  };
  app2.get("/api/admin/inspections", validateAdminSession, async (req, res) => {
    try {
      const inspections2 = await storage.getInspections();
      res.json({ success: true, data: inspections2 });
    } catch (error) {
      logger.error("Error fetching admin inspections", { error });
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  app2.delete("/api/admin/inspections/:id", validateAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInspection(id);
      if (success) {
        res.json({ success: true, message: "Inspection deleted successfully" });
      } else {
        res.status(404).json({ success: false, message: "Inspection not found" });
      }
    } catch (error) {
      logger.error("Error deleting admin inspection", { error });
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  app2.delete("/api/admin/custodial-notes/:id", validateAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid custodial note ID" });
      }
      const success = await storage.deleteCustodialNote(id);
      if (success) {
        res.json({ success: true, message: "Custodial note deleted successfully" });
      } else {
        res.status(404).json({ success: false, message: "Custodial note not found" });
      }
    } catch (error) {
      logger.error("Error deleting custodial note", { error });
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  const pdfUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
      // 10MB limit
      files: 1
      // Only one PDF at a time
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype === "application/pdf" && file.originalname.toLowerCase().endsWith(".pdf")) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF files are allowed"));
      }
    }
  });
  app2.post("/api/monthly-feedback", pdfUpload.single("pdf"), async (req, res) => {
    logger.info("[POST] Monthly feedback upload started", {
      body: req.body,
      file: req.file ? req.file.originalname : "none"
    });
    try {
      const { school, month, year, notes, uploadedBy } = req.body;
      const file = req.file;
      if (!school || !month || !year || !file) {
        logger.warn("[POST] Missing required fields");
        return res.status(400).json({
          message: "Missing required fields",
          details: { school: !!school, month: !!month, year: !!year, file: !!file }
        });
      }
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
        return res.status(400).json({ message: "Invalid year" });
      }
      const filename = `monthly-feedback/${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
      const uploadResult = await objectStorageService.uploadLargeFile(
        file.buffer,
        filename,
        file.mimetype
      );
      if (!uploadResult.success) {
        logger.error("[POST] Failed to upload PDF", { error: uploadResult.error });
        return res.status(500).json({ message: "Failed to upload PDF file" });
      }
      const pdfUrl = `/objects/${filename}`;
      logger.info("[POST] PDF uploaded successfully", { filename, url: pdfUrl });
      let extractedText = null;
      try {
        extractedText = await doclingService.extractTextFromPDF(file.buffer, file.originalname);
        if (!extractedText) {
          logger.warn("[POST] Docling returned empty content, continuing without text");
        }
      } catch (extractError) {
        logger.error("[POST] Docling extraction failed, continuing without text:", extractError);
      }
      const feedbackData = {
        school,
        month,
        year: yearNum,
        pdfUrl,
        pdfFileName: file.originalname,
        extractedText,
        notes: notes || null,
        uploadedBy: uploadedBy || null,
        fileSize: file.size
      };
      const validatedData = insertMonthlyFeedbackSchema.parse(feedbackData);
      const newFeedback = await storage.createMonthlyFeedback(validatedData);
      logger.info("[POST] Monthly feedback created successfully", { id: newFeedback.id });
      res.status(201).json({
        message: "Monthly feedback uploaded successfully",
        id: newFeedback.id,
        hasExtractedText: !!extractedText
      });
    } catch (error) {
      logger.error("[POST] Error creating monthly feedback:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid data",
          details: error.errors
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/monthly-feedback", async (req, res) => {
    try {
      const { school, year, month } = req.query;
      let feedback = await storage.getMonthlyFeedback();
      if (school) {
        feedback = feedback.filter((f) => f.school === school);
      }
      if (year) {
        const yearNum = parseInt(year);
        if (!isNaN(yearNum)) {
          feedback = feedback.filter((f) => f.year === yearNum);
        }
      }
      if (month) {
        feedback = feedback.filter((f) => f.month === month);
      }
      logger.info("[GET] Retrieved filtered monthly feedback", {
        total: feedback.length,
        filters: { school, year, month }
      });
      res.json(feedback);
    } catch (error) {
      logger.error("[GET] Error fetching monthly feedback:", error);
      res.status(500).json({ message: "Failed to fetch monthly feedback" });
    }
  });
  app2.get("/api/monthly-feedback/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }
      const feedback = await storage.getMonthlyFeedbackById(id);
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      res.json(feedback);
    } catch (error) {
      logger.error("[GET] Error fetching feedback by ID:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });
  app2.delete("/api/monthly-feedback/:id", validateAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }
      const success = await storage.deleteMonthlyFeedback(id);
      if (success) {
        res.json({ message: "Monthly feedback deleted successfully" });
      } else {
        res.status(404).json({ message: "Feedback not found" });
      }
    } catch (error) {
      logger.error("[DELETE] Error deleting monthly feedback:", error);
      res.status(500).json({ message: "Failed to delete feedback" });
    }
  });
  app2.patch("/api/monthly-feedback/:id/notes", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }
      if (typeof notes !== "string") {
        return res.status(400).json({ message: "Notes must be a string" });
      }
      const updated = await storage.updateMonthlyFeedbackNotes(id, notes);
      if (!updated) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      res.json({ message: "Notes updated successfully", feedback: updated });
    } catch (error) {
      logger.error("[PATCH] Error updating notes:", error);
      res.status(500).json({ message: "Failed to update notes" });
    }
  });
  app2.get("/api/scores", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      logger.info("[GET] Fetching building scores", { startDate, endDate });
      const allInspections = await storage.getInspections();
      const allNotes = await storage.getCustodialNotes();
      let filteredInspections = allInspections;
      let filteredNotes = allNotes;
      if (startDate && typeof startDate === "string") {
        filteredInspections = filteredInspections.filter((i) => i.date >= startDate);
        filteredNotes = filteredNotes.filter((n) => n.date >= startDate);
      }
      if (endDate && typeof endDate === "string") {
        filteredInspections = filteredInspections.filter((i) => i.date <= endDate);
        filteredNotes = filteredNotes.filter((n) => n.date <= endDate);
      }
      const inspectionsBySchool = {};
      const notesBySchool = {};
      filteredInspections.forEach((inspection) => {
        if (!inspectionsBySchool[inspection.school]) {
          inspectionsBySchool[inspection.school] = [];
        }
        inspectionsBySchool[inspection.school].push(inspection);
      });
      filteredNotes.forEach((note) => {
        if (!notesBySchool[note.school]) {
          notesBySchool[note.school] = [];
        }
        notesBySchool[note.school].push(note);
      });
      const schoolScores = calculateSchoolScores(
        inspectionsBySchool,
        notesBySchool,
        startDate && endDate ? { start: startDate, end: endDate } : void 0
      );
      res.json({
        success: true,
        scores: schoolScores,
        dateRange: {
          start: startDate || "all",
          end: endDate || "all"
        }
      });
    } catch (error) {
      logger.error("[GET] Error fetching scores:", error);
      res.status(500).json({ message: "Failed to fetch scores" });
    }
  });
  app2.get("/api/scores/:school", async (req, res) => {
    try {
      const { school } = req.params;
      const { startDate, endDate } = req.query;
      logger.info("[GET] Fetching score for school", { school, startDate, endDate });
      const allInspections = await storage.getInspections();
      const allNotes = await storage.getCustodialNotes();
      let inspections2 = allInspections.filter((i) => i.school === school);
      let notes = allNotes.filter((n) => n.school === school);
      if (startDate && typeof startDate === "string") {
        inspections2 = inspections2.filter((i) => i.date >= startDate);
        notes = notes.filter((n) => n.date >= startDate);
      }
      if (endDate && typeof endDate === "string") {
        inspections2 = inspections2.filter((i) => i.date <= endDate);
        notes = notes.filter((n) => n.date <= endDate);
      }
      const scoringResult = calculateBuildingScore(inspections2, notes);
      const complianceStatus = getComplianceStatus(scoringResult.overallScore);
      res.json({
        success: true,
        school,
        score: scoringResult,
        complianceStatus,
        dateRange: {
          start: startDate || (inspections2[0]?.date || notes[0]?.date),
          end: endDate || (inspections2[inspections2.length - 1]?.date || notes[notes.length - 1]?.date)
        }
      });
    } catch (error) {
      logger.error("[GET] Error fetching school score:", error);
      res.status(500).json({ message: "Failed to fetch school score" });
    }
  });
  app2.use("/api/*", (req, res) => {
    res.status(404).json({
      error: "API endpoint not found",
      path: req.path,
      method: req.method,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      availableEndpoints: [
        "POST /api/inspections",
        "GET /api/inspections",
        "POST /api/submit-building-inspection",
        "POST /api/custodial-notes",
        "POST /api/room-inspections",
        "GET /api/scores",
        "GET /api/scores/:school"
      ]
    });
  });
}

// server/vite.ts
init_logger();
import * as express2 from "express";
import * as path4 from "path";
function serveStatic(app2) {
  const uploadsPath = path4.join(process.cwd(), "uploads");
  app2.use("/uploads", express2.static(uploadsPath));
  logger.info(`Serving uploads from: ${uploadsPath}`);
  const staticPath = path4.join(process.cwd(), "dist", "public");
  app2.use((req, res, next) => {
    if (req.path.endsWith(".html") || req.path === "/") {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      logger.debug(`Setting no-cache headers for HTML request: ${req.path}`);
    }
    next();
  });
  app2.use(express2.static(staticPath));
  app2.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/health") || req.path.startsWith("/uploads")) {
      return next();
    }
    const indexPath = path4.join(staticPath, "index.html");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(indexPath, (err) => {
      if (err) {
        logger.error("Error serving index.html:", err);
        res.status(500).send("Server Error");
      }
    });
  });
  logger.info(`Serving static files from: ${staticPath}`);
}
function log(message, type = "info") {
  logger[type](message);
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
var API_RATE_LIMIT = 1e4;
var STRICT_RATE_LIMIT = 1e3;
var apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: API_RATE_LIMIT,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: false,
  // Set to false to avoid trust proxy warnings on Replit
  keyGenerator: (req) => {
    return req.headers["x-forwarded-for"] || req.connection.remoteAddress || "anonymous";
  }
});
var strictRateLimit = createRateLimit(15 * 60 * 1e3, STRICT_RATE_LIMIT);
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

// server/index.ts
init_logger();

// server/monitoring.ts
init_logger();
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
      const { pool: pool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await pool2.query("SELECT 1");
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
      version: "1.0.0",
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
var app = express3();
if (process.env.REPL_SLUG) {
  app.set("trust proxy", 1);
} else {
  app.set("trust proxy", false);
}
app.use(requestIdMiddleware);
app.use(performanceMonitor);
app.use(metricsMiddleware);
app.use(helmet({
  // Content Security Policy - disabled for development to allow inline styles
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  } : false,
  crossOriginEmbedderPolicy: false,
  // Additional security headers
  hsts: process.env.NODE_ENV === "production" ? {
    maxAge: 31536e3,
    // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  permittedCrossDomainPolicies: false,
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Prevent IE from executing downloads in site context
  ieNoOpen: true,
  // Don't infer the MIME type
  noSniff: true,
  // X-Frame-Options - already set in securityHeaders but keeping for consistency
  frameguard: { action: "deny" },
  // X-XSS-Protection - already set in securityHeaders but keeping for consistency
  xssFilter: true
}));
app.use(compression({
  // Compress all responses
  level: 6,
  // Compression level (1-9, 6 is default)
  threshold: 1024,
  // Only compress responses larger than 1KB
  // Compress only these content types
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    const type = res.getHeader("Content-Type");
    if (type && (type.includes("image/") || type.includes("video/") || type.includes("application/zip"))) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use(securityHeaders);
app.use(validateRequest);
app.use(sanitizeInput);
app.use(express3.json({ limit: "10mb" }));
app.use(express3.urlencoded({ extended: false, limit: "10mb" }));
app.use("/api/admin/login", strictRateLimit);
app.use("/api/inspections", apiRateLimit);
app.use("/api/custodial-notes", apiRateLimit);
app.use("/api/monthly-feedback", apiRateLimit);
app.use("/api", apiRateLimit);
app.use("/api", (req, res, next) => {
  try {
    const contentType = req.headers["content-type"];
    const accept = req.headers["accept"];
    const contentLength = req.headers["content-length"];
    const path5 = req.path;
    const method = req.method;
    const bodyPreview = req.body ? JSON.parse(JSON.stringify(req.body)) : void 0;
    const truncate = (val) => {
      if (typeof val === "string" && val.length > 500) return val.slice(0, 497) + "\u2026";
      return val;
    };
    if (bodyPreview && typeof bodyPreview === "object") {
      for (const k of Object.keys(bodyPreview)) {
        bodyPreview[k] = truncate(bodyPreview[k]);
      }
    }
    log(`API REQ ${method} ${path5} ct=${contentType || "n/a"} accept=${accept || "n/a"} len=${contentLength || "n/a"} :: ${JSON.stringify(bodyPreview || {})}`);
  } catch {
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
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
if (process.env.REPL_SLUG) {
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
}
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
    app.get("/health", healthCheck);
    app.get("/metrics", (req, res) => {
      res.json(metricsCollector.getMetrics());
    });
    logger.info("Health check endpoints configured");
    await registerRoutes(app);
    logger.info("Routes registered successfully");
    serveStatic(app);
    logger.info("Static file serving configured");
    const server = createServer(app);
    logger.info("HTTP server created");
    const PORT = parseInt(process.env.PORT || "5000", 10);
    const HOST = "0.0.0.0";
    logger.info(`About to listen on port ${PORT}...`);
    server.listen(PORT, HOST, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || "development",
        version: "1.0.0"
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
