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
  insertInspectionPhotoSchema: () => insertInspectionPhotoSchema,
  insertInspectionSchema: () => insertInspectionSchema,
  insertMonthlyFeedbackSchema: () => insertMonthlyFeedbackSchema,
  insertRoomInspectionSchema: () => insertRoomInspectionSchema,
  insertSyncQueueSchema: () => insertSyncQueueSchema,
  insertUserSchema: () => insertUserSchema,
  inspectionPhotos: () => inspectionPhotos,
  inspections: () => inspections,
  monthlyFeedback: () => monthlyFeedback,
  roomInspections: () => roomInspections,
  syncQueue: () => syncQueue,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var coerceNullableNumber, users, inspections, roomInspections, custodialNotes, monthlyFeedback, insertUserSchema, insertInspectionSchema, insertRoomInspectionSchema, insertCustodialNoteSchema, insertMonthlyFeedbackSchema, inspectionPhotos, syncQueue, insertInspectionPhotoSchema, insertSyncQueueSchema;
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
    }, (table) => ({
      schoolIdx: index("inspections_school_idx").on(table.school),
      dateIdx: index("inspections_date_idx").on(table.date),
      schoolDateIdx: index("inspections_school_date_idx").on(table.school, table.date),
      inspectionTypeIdx: index("inspections_type_idx").on(table.inspectionType)
    }));
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
    }, (table) => ({
      schoolIdx: index("custodial_notes_school_idx").on(table.school),
      dateIdx: index("custodial_notes_date_idx").on(table.date),
      schoolDateIdx: index("custodial_notes_school_date_idx").on(table.school, table.date)
    }));
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
    }, (table) => ({
      schoolIdx: index("monthly_feedback_school_idx").on(table.school),
      yearIdx: index("monthly_feedback_year_idx").on(table.year),
      schoolYearIdx: index("monthly_feedback_school_year_idx").on(table.school, table.year),
      schoolYearMonthIdx: index("monthly_feedback_school_year_month_idx").on(table.school, table.year, table.month)
    }));
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
    inspectionPhotos = pgTable("inspection_photos", {
      id: serial("id").primaryKey(),
      inspectionId: integer("inspection_id").references(() => inspections.id, { onDelete: "cascade" }),
      photoUrl: text("photo_url").notNull(),
      thumbnailUrl: text("thumbnail_url"),
      locationLat: text("location_lat"),
      // Decimal(10,8) precision
      locationLng: text("location_lng"),
      // Decimal(11,8) precision
      locationAccuracy: text("location_accuracy"),
      // meters precision, stored as string
      locationSource: text("location_source").default("gps"),
      // 'gps', 'wifi', 'cell', 'manual', 'qr'
      buildingId: text("building_id"),
      // Reference to buildings table if available
      floor: integer("floor"),
      // Floor number for indoor location
      room: text("room"),
      // Room identifier for indoor location
      capturedAt: timestamp("captured_at").defaultNow().notNull(),
      notes: text("notes"),
      syncStatus: text("sync_status").default("pending"),
      // 'pending', 'synced', 'failed'
      fileSize: integer("file_size"),
      // File size in bytes
      imageWidth: integer("image_width"),
      // Image width in pixels
      imageHeight: integer("image_height"),
      // Image height in pixels
      compressionRatio: text("compression_ratio"),
      // Compression ratio as decimal string
      deviceInfo: text("device_info"),
      // JSON string with device info
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    }, (table) => ({
      inspectionIdIdx: index("inspection_photos_inspection_id_idx").on(table.inspectionId),
      syncStatusIdx: index("inspection_photos_sync_status_idx").on(table.syncStatus)
    }));
    syncQueue = pgTable("sync_queue", {
      id: serial("id").primaryKey(),
      type: text("type").notNull(),
      // 'photo_upload', 'inspection_update'
      photoId: integer("photo_id").references(() => inspectionPhotos.id, { onDelete: "cascade" }),
      data: text("data").notNull(),
      // JSON string with sync data
      retryCount: integer("retry_count").default(0),
      nextRetryAt: timestamp("next_retry_at"),
      errorMessage: text("error_message"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertInspectionPhotoSchema = createInsertSchema(inspectionPhotos).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      inspectionId: z.coerce.number().int(),
      photoUrl: z.string().min(1, "Photo URL is required").refine(
        (val) => val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://"),
        "Photo URL must be a relative path (starting with /) or a full URL"
      ),
      thumbnailUrl: z.string().refine(
        (val) => val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://"),
        "Thumbnail URL must be a relative path or full URL"
      ).optional(),
      locationLat: z.string().regex(/^-?\d+\.\d+$/).nullable().optional(),
      locationLng: z.string().regex(/^-?\d+\.\d+$/).nullable().optional(),
      locationAccuracy: z.string().regex(/^\d+(\.\d+)?$/).nullable().optional(),
      locationSource: z.enum(["gps", "wifi", "cell", "manual", "qr"]).default("gps"),
      buildingId: z.string().max(100).nullable().optional(),
      floor: z.number().int().min(0).max(100).nullable().optional(),
      room: z.string().max(100).nullable().optional(),
      capturedAt: z.date().optional(),
      notes: z.string().max(5e3).nullable().optional(),
      syncStatus: z.enum(["pending", "synced", "failed"]).default("pending"),
      fileSize: z.number().int().positive().nullable().optional(),
      imageWidth: z.number().int().positive().nullable().optional(),
      imageHeight: z.number().int().positive().nullable().optional(),
      compressionRatio: z.string().regex(/^\d+(\.\d+)?$/).nullable().optional(),
      deviceInfo: z.string().max(1e3).nullable().optional()
    });
    insertSyncQueueSchema = createInsertSchema(syncQueue).omit({
      id: true,
      createdAt: true
    }).extend({
      type: z.enum(["photo_upload", "inspection_update"]),
      photoId: z.coerce.number().int().nullable().optional(),
      data: z.string(),
      // JSON string
      retryCount: z.number().int().default(0),
      nextRetryAt: z.date().nullable().optional(),
      errorMessage: z.string().max(1e3).nullable().optional()
    });
  }
});

// server/logger.ts
import { AsyncLocalStorage } from "async_hooks";
var asyncLocalStorage, Logger, logger, requestIdMiddleware;
var init_logger = __esm({
  "server/logger.ts"() {
    "use strict";
    asyncLocalStorage = new AsyncLocalStorage();
    Logger = class {
      /**
       * Get current request context from AsyncLocalStorage
       */
      getRequestContext() {
        return asyncLocalStorage.getStore();
      }
      log(level, message, context) {
        const requestContext = this.getRequestContext();
        const entry = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          level,
          message,
          context,
          requestId: requestContext?.requestId,
          correlationId: requestContext?.correlationId
        };
        if (requestContext?.userId) {
          entry.context = {
            ...entry.context,
            userId: requestContext.userId,
            username: requestContext.username,
            ip: requestContext.ip
          };
        }
        if (process.env.NODE_ENV === "production") {
          console.log(JSON.stringify(entry));
        } else {
          const contextStr = context ? ` ${JSON.stringify(context)}` : "";
          const requestStr = requestContext?.requestId ? ` [${requestContext.requestId}]` : "";
          const correlationStr = requestContext?.correlationId ? ` (${requestContext.correlationId})` : "";
          console.log(`[${entry.timestamp}] ${level}${requestStr}${correlationStr}: ${message}${contextStr}`);
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
      /**
       * Update user context for current request (for post-authentication logging)
       */
      updateUserContext(userId, username) {
        const currentContext = this.getRequestContext();
        if (currentContext) {
          currentContext.userId = userId;
          currentContext.username = username;
        }
      }
    };
    logger = new Logger();
    requestIdMiddleware = (req, res, next) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const correlationId = req.headers["x-correlation-id"] || req.headers["x-request-id"] || requestId;
      const requestContext = {
        requestId,
        correlationId,
        ip: req.ip || req.connection.remoteAddress
      };
      req.requestId = requestId;
      res.setHeader("X-Request-ID", requestId);
      res.setHeader("X-Correlation-ID", correlationId);
      asyncLocalStorage.run(requestContext, () => {
        next();
      });
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool,
  withDatabaseReconnection: () => withDatabaseReconnection
});
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
async function initializeDatabase() {
  const maxRetries = 5;
  const retryDelay = 2e3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await pool.query("SELECT 1");
      logger.info("Database connection established successfully", {
        poolSize: pool.totalCount,
        attempt
      });
      return;
    } catch (error) {
      logger.error(`Database connection attempt ${attempt} failed`, {
        error: error instanceof Error ? error.message : "Unknown error",
        attempt,
        maxRetries
      });
      if (attempt === maxRetries) {
        logger.error("Failed to establish database connection after all retries");
        throw error;
      }
      logger.info(`Retrying database connection in ${retryDelay}ms...`);
      await new Promise((resolve2) => setTimeout(resolve2, retryDelay));
    }
  }
}
async function withDatabaseReconnection(operation, operationName, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isConnectionError = errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ENOTFOUND") || errorMessage.includes("ETIMEDOUT") || errorMessage.includes("Connection terminated") || errorMessage.includes("connection_lost") || errorMessage.includes("PROTOCOL_CONNECTION_LOST") || errorMessage.includes("ECONNRESET");
      if (!isConnectionError) {
        throw error;
      }
      logger.warn(`Database connection error on attempt ${attempt}/${maxRetries}`, {
        operation: operationName,
        error: errorMessage,
        attempt
      });
      if (attempt === maxRetries) {
        logger.error(`Database operation failed after ${maxRetries} attempts`, {
          operation: operationName,
          error: errorMessage
        });
        throw error;
      }
      const delay = Math.min(100 * Math.pow(2, attempt - 1), 1e3);
      await new Promise((resolve2) => setTimeout(resolve2, delay));
      logger.info(`Retrying database operation`, {
        operation: operationName,
        attempt: attempt + 1,
        delay
      });
    }
  }
  throw lastError || new Error("Database operation failed");
}
var isRailway, POOL_CONFIG, sql, db, pool, connectionPoolErrors, MAX_POOL_ERRORS;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_logger();
    config();
    neonConfig.fetchConnectionCache = true;
    neonConfig.cacheAdapter = {
      get: (key) => Promise.resolve(null),
      // Implement proper cache if needed
      set: (key, value, ttl) => Promise.resolve()
    };
    isRailway = process.env.RAILWAY_ENVIRONMENT === "production" || process.env.RAILWAY_SERVICE_ID;
    POOL_CONFIG = isRailway ? {
      maxConnections: 10,
      minConnections: 2,
      idleTimeoutMillis: 1e4,
      connectionTimeoutMillis: 5e3,
      acquireTimeoutMillis: 15e3,
      createTimeoutMillis: 1e4
    } : {
      maxConnections: 20,
      minConnections: 5,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 1e4,
      acquireTimeoutMillis: 6e4,
      createTimeoutMillis: 3e4
    };
    if (isRailway) {
      neonConfig.maxConnections = POOL_CONFIG.maxConnections;
      neonConfig.idleTimeoutMillis = POOL_CONFIG.idleTimeoutMillis;
      neonConfig.connectionTimeoutMillis = POOL_CONFIG.connectionTimeoutMillis;
      logger.info("Applying Railway-specific database configuration", POOL_CONFIG);
    } else {
      neonConfig.maxConnections = POOL_CONFIG.maxConnections;
      neonConfig.idleTimeoutMillis = POOL_CONFIG.idleTimeoutMillis;
      neonConfig.connectionTimeoutMillis = POOL_CONFIG.connectionTimeoutMillis;
      logger.info("Applying local development database configuration", POOL_CONFIG);
    }
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set. Check your Replit Secrets tab.");
    }
    sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema: schema_exports });
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: POOL_CONFIG.maxConnections,
      min: POOL_CONFIG.minConnections,
      idleTimeoutMillis: POOL_CONFIG.idleTimeoutMillis,
      connectionTimeoutMillis: POOL_CONFIG.connectionTimeoutMillis,
      acquireTimeoutMillis: POOL_CONFIG.acquireTimeoutMillis,
      createTimeoutMillis: POOL_CONFIG.createTimeoutMillis,
      destroyTimeoutMillis: 5e3,
      reapIntervalMillis: 1e3,
      createRetryIntervalMillis: 200
    });
    connectionPoolErrors = 0;
    MAX_POOL_ERRORS = 5;
    pool.on("error", (err) => {
      connectionPoolErrors++;
      logger.error("Database pool error", { error: err.message, errorCount: connectionPoolErrors });
      if (connectionPoolErrors >= MAX_POOL_ERRORS) {
        logger.error("Too many database pool errors, restarting pool may be needed");
      }
    });
    pool.on("connect", (client) => {
      logger.debug("New database connection established", {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      });
    });
    pool.on("remove", (client) => {
      logger.debug("Database connection removed", {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount
      });
    });
    initializeDatabase().catch((error) => {
      logger.error("Fatal: Database initialization failed", { error });
      process.exit(1);
    });
    process.on("SIGTERM", () => {
      logger.info("Closing database connections...");
      pool.end(() => {
        logger.info("Database connections closed");
        process.exit(0);
      });
    });
  }
});

// server/security.ts
var security_exports = {};
__export(security_exports, {
  CacheManager: () => CacheManager,
  PasswordManager: () => PasswordManager,
  SessionManager: () => SessionManager,
  apiRateLimit: () => apiRateLimit,
  createRateLimit: () => createRateLimit,
  getRedisClient: () => getRedisClient,
  getRedisHealth: () => getRedisHealth,
  healthCheckRateLimit: () => healthCheckRateLimit,
  initializeRedis: () => initializeRedis,
  photoUploadRateLimit: () => photoUploadRateLimit,
  sanitizeInput: () => sanitizeInput,
  securityHeaders: () => securityHeaders,
  strictRateLimit: () => strictRateLimit,
  validateRequest: () => validateRequest
});
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import { createClient } from "redis";
async function initializeRedis() {
  try {
    if (!process.env.REDIS_URL) {
      logger.warn(
        "REDIS_URL not configured, falling back to memory storage (NOT RECOMMENDED FOR PRODUCTION)"
      );
      return;
    }
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5e3,
        lazyConnect: true
      }
    });
    redisClient.on("error", (err) => {
      logger.error("Redis Client Error", { error: err.message });
      redisClient = null;
    });
    redisClient.on("connect", () => {
      logger.info("Redis client connected successfully");
    });
    await redisClient.connect();
    logger.info("Redis initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Redis", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    redisClient = null;
  }
}
async function getRedisHealth() {
  if (!redisClient) {
    return {
      connected: false,
      type: "memory",
      error: "Redis not configured (using memory storage)"
    };
  }
  try {
    const pingResult = await redisClient.ping();
    const isConnected = pingResult === "PONG";
    return {
      connected: isConnected,
      type: "redis"
    };
  } catch (error) {
    return {
      connected: false,
      type: "redis",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
function getRedisClient() {
  return redisClient;
}
var createRateLimit, API_RATE_LIMIT, STRICT_RATE_LIMIT, HEALTH_CHECK_RATE_LIMIT, apiRateLimit, strictRateLimit, healthCheckRateLimit, photoUploadRateLimit, sanitizeInput, securityHeaders, redisClient, PasswordManager, SessionExpirationQueue, SessionManager, CacheCircuitBreaker, CacheManager, validateRequest;
var init_security = __esm({
  "server/security.ts"() {
    "use strict";
    init_logger();
    createRateLimit = (windowMs, max) => {
      return rateLimit({
        windowMs,
        max,
        message: { error: "Too many requests, please try again later" },
        standardHeaders: true,
        legacyHeaders: false
      });
    };
    API_RATE_LIMIT = process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) : process.env.NODE_ENV === "production" ? 60 : 100;
    STRICT_RATE_LIMIT = process.env.NODE_ENV === "production" ? 10 : 20;
    HEALTH_CHECK_RATE_LIMIT = 100;
    apiRateLimit = rateLimit({
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
    strictRateLimit = createRateLimit(
      15 * 60 * 1e3,
      STRICT_RATE_LIMIT
    );
    healthCheckRateLimit = rateLimit({
      windowMs: 15 * 60 * 1e3,
      // 15 minutes
      max: HEALTH_CHECK_RATE_LIMIT,
      message: { error: "Too many health check requests" },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        return !!(req.headers["x-railway-service-id"] || req.headers["user-agent"]?.includes("Railway"));
      },
      keyGenerator: (req) => {
        return req.headers["x-forwarded-for"] || req.connection.remoteAddress || "anonymous";
      }
    });
    photoUploadRateLimit = rateLimit({
      windowMs: 15 * 60 * 1e3,
      // 15 minutes
      max: 10,
      // Limit to 10 uploads per 15-minute window per IP
      message: "Too many photo upload requests from this IP. Please try again after 15 minutes.",
      standardHeaders: true,
      // Return rate limit info in `RateLimit-*` headers
      legacyHeaders: false,
      // Disable `X-RateLimit-*` headers
      // Custom handler for rate limit exceeded
      handler: (req, res) => {
        logger.warn("Photo upload rate limit exceeded", {
          ip: req.ip || req.connection.remoteAddress,
          path: req.path,
          method: req.method,
          userAgent: req.get("User-Agent"),
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        res.status(429).json({
          success: false,
          message: "Too many photo upload requests from this IP. Please try again after 15 minutes.",
          retryAfter: Math.ceil((req.rateLimit?.resetTime?.getTime() ?? Date.now()) / 1e3)
          // Seconds until reset
        });
      },
      keyGenerator: (req) => {
        return req.headers["x-forwarded-for"] || req.connection.remoteAddress || "anonymous";
      },
      // Skip rate limiting for trusted IPs (optional)
      skip: (req) => {
        const trustedIPs = process.env.TRUSTED_IPS?.split(",") || [];
        const clientIP = req.ip || req.connection.remoteAddress || "";
        return trustedIPs.includes(clientIP);
      }
    });
    sanitizeInput = (req, res, next) => {
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
    securityHeaders = (req, res, next) => {
      const allowedOrigins = ["http://localhost:5000", "http://localhost:5173"];
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
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,PUT,POST,DELETE,PATCH,OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Content-Length, X-Requested-With"
      );
      res.setHeader("Access-Control-Allow-Credentials", "true");
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    };
    redisClient = null;
    PasswordManager = class {
      static SALT_ROUNDS = 12;
      /**
       * Hash a password using bcrypt
       */
      static async hashPassword(password) {
        try {
          const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
          const hashedPassword = await bcrypt.hash(password, salt);
          logger.debug("Password hashed successfully");
          return hashedPassword;
        } catch (error) {
          logger.error("Failed to hash password", {
            error: error instanceof Error ? error.message : "Unknown error"
          });
          throw new Error("Password hashing failed");
        }
      }
      /**
       * Verify a password against its hash
       */
      static async verifyPassword(password, hashedPassword) {
        try {
          const isValid = await bcrypt.compare(password, hashedPassword);
          logger.debug("Password verification completed", { isValid });
          return isValid;
        } catch (error) {
          logger.error("Failed to verify password", {
            error: error instanceof Error ? error.message : "Unknown error"
          });
          return false;
        }
      }
      /**
       * Generate a secure random password
       */
      static generateSecurePassword(length = 16) {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * charset.length);
          password += charset[randomIndex];
        }
        return password;
      }
    };
    SessionExpirationQueue = class {
      queue = [];
      add(token, expiresAt) {
        const expiryTime = expiresAt.getTime();
        this.queue.push({ token, expiresAt: expiryTime });
        this.queue.sort((a, b) => a.expiresAt - b.expiresAt);
      }
      getExpired(now) {
        const expired = [];
        while (this.queue.length > 0 && this.queue[0].expiresAt <= now) {
          const item = this.queue.shift();
          if (item) {
            expired.push(item.token);
          }
        }
        return expired;
      }
      remove(token) {
        const index2 = this.queue.findIndex((item) => item.token === token);
        if (index2 !== -1) {
          this.queue.splice(index2, 1);
        }
      }
      size() {
        return this.queue.length;
      }
    };
    SessionManager = class {
      static SESSION_PREFIX = "admin_session:";
      static CACHE_PREFIX = "app_cache:";
      static DEFAULT_TTL = 24 * 60 * 60;
      // 24 hours in seconds
      static INACTIVE_SESSION_TTL = 30 * 60;
      // 30 minutes of inactivity
      static expirationQueue = new SessionExpirationQueue();
      /**
       * Store session data securely
       */
      static async setSession(sessionToken, sessionData, ttl = this.DEFAULT_TTL) {
        try {
          const key = this.SESSION_PREFIX + sessionToken;
          const value = JSON.stringify({
            ...sessionData,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            lastAccessed: (/* @__PURE__ */ new Date()).toISOString()
          });
          if (redisClient) {
            await redisClient.setEx(key, ttl, value);
            logger.debug("Session stored in Redis", { sessionToken, ttl });
          } else {
            if (!global.adminSessions) {
              global.adminSessions = /* @__PURE__ */ new Map();
            }
            const expiresAt = new Date(Date.now() + ttl * 1e3);
            const sessionWithExpiry = {
              ...sessionData,
              expiresAt
            };
            global.adminSessions.set(sessionToken, sessionWithExpiry);
            this.expirationQueue.add(sessionToken, expiresAt);
            logger.warn("Session stored in memory (NOT SECURE FOR PRODUCTION)", {
              sessionToken
            });
          }
        } catch (error) {
          logger.error("Failed to store session", {
            error: error instanceof Error ? error.message : "Unknown error"
          });
          throw new Error("Session storage failed");
        }
      }
      /**
       * Retrieve session data
       */
      static async getSession(sessionToken) {
        try {
          const key = this.SESSION_PREFIX + sessionToken;
          if (redisClient) {
            const value = await redisClient.get(key);
            if (!value) {
              logger.debug("Session not found in Redis", { sessionToken });
              return null;
            }
            const sessionData = JSON.parse(value);
            const now = /* @__PURE__ */ new Date();
            const lastAccessed = sessionData.lastAccessed ? new Date(sessionData.lastAccessed) : now;
            const inactivityMs = now.getTime() - lastAccessed.getTime();
            if (inactivityMs > this.INACTIVE_SESSION_TTL * 1e3) {
              logger.info("Session expired due to inactivity", {
                sessionToken,
                inactivityMinutes: Math.floor(inactivityMs / 6e4)
              });
              await this.deleteSession(sessionToken);
              return null;
            }
            sessionData.lastAccessed = now.toISOString();
            await redisClient.setEx(
              key,
              this.DEFAULT_TTL,
              JSON.stringify(sessionData)
            );
            logger.debug("Session retrieved from Redis", { sessionToken });
            return sessionData;
          } else {
            if (!global.adminSessions) {
              return null;
            }
            const sessionData = global.adminSessions.get(
              sessionToken
            );
            if (!sessionData) {
              return null;
            }
            if (sessionData.expiresAt && /* @__PURE__ */ new Date() > sessionData.expiresAt) {
              global.adminSessions.delete(sessionToken);
              return null;
            }
            sessionData.lastAccessed = (/* @__PURE__ */ new Date()).toISOString();
            logger.debug("Session retrieved from memory", { sessionToken });
            return sessionData;
          }
        } catch (error) {
          logger.error("Failed to retrieve session", {
            error: error instanceof Error ? error.message : "Unknown error"
          });
          return null;
        }
      }
      /**
       * Delete a session
       */
      static async deleteSession(sessionToken) {
        try {
          const key = this.SESSION_PREFIX + sessionToken;
          if (redisClient) {
            await redisClient.del(key);
            logger.debug("Session deleted from Redis", { sessionToken });
          } else {
            if (global.adminSessions) {
              global.adminSessions.delete(sessionToken);
              this.expirationQueue.remove(sessionToken);
              logger.debug("Session deleted from memory", { sessionToken });
            }
          }
        } catch (error) {
          logger.error("Failed to delete session", {
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      /**
       * Clean up expired sessions (optimized with priority queue for memory sessions)
       */
      static async cleanupExpiredSessions() {
        try {
          if (redisClient) {
            await this.cleanupInactiveSessions();
            return;
          }
          if (!global.adminSessions) {
            return;
          }
          const sessions = global.adminSessions;
          const now = Date.now();
          const expiredTokens = this.expirationQueue.getExpired(now);
          let cleanedCount = 0;
          for (const token of expiredTokens) {
            if (sessions.delete(token)) {
              cleanedCount++;
            }
          }
          if (cleanedCount > 0) {
            logger.info("Cleaned up expired memory sessions", {
              count: cleanedCount,
              remainingSessions: sessions.size,
              queueSize: this.expirationQueue.size()
            });
          }
        } catch (error) {
          logger.error("Failed to cleanup expired sessions", {
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      /**
       * Clean up inactive sessions in Redis (even if not expired, reclaim memory)
       */
      static async cleanupInactiveSessions() {
        if (!redisClient) return;
        try {
          const pattern = `${this.SESSION_PREFIX}*`;
          let cursor = 0;
          let cleanedCount = 0;
          const now = /* @__PURE__ */ new Date();
          do {
            const result = await redisClient.scan(cursor, {
              MATCH: pattern,
              COUNT: 100
              // Process 100 keys at a time
            });
            cursor = result.cursor;
            const keys = result.keys;
            for (const key of keys) {
              const value = await redisClient.get(key);
              if (!value) continue;
              const sessionData = JSON.parse(value);
              const lastAccessed = sessionData.lastAccessed ? new Date(sessionData.lastAccessed) : new Date(sessionData.createdAt || 0);
              const inactivityMs = now.getTime() - lastAccessed.getTime();
              if (inactivityMs > this.INACTIVE_SESSION_TTL * 1e3) {
                await redisClient.del(key);
                cleanedCount++;
              }
            }
          } while (cursor !== 0);
          if (cleanedCount > 0) {
            logger.info("Cleaned up inactive Redis sessions", {
              count: cleanedCount
            });
          }
        } catch (error) {
          logger.error("Failed to cleanup inactive Redis sessions", {
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    };
    CacheCircuitBreaker = class {
      failureCount = 0;
      lastFailureTime = 0;
      state = "closed";
      threshold = 5;
      // Open circuit after 5 failures
      timeout = 6e4;
      // Try again after 60 seconds
      resetTime = 3e5;
      // Reset failure count after 5 minutes of success
      recordSuccess() {
        if (this.state === "half-open") {
          this.state = "closed";
          this.failureCount = 0;
          logger.info("Cache circuit breaker closed - Redis recovered");
        } else if (this.state === "closed" && this.failureCount > 0) {
          const timeSinceLastFailure = Date.now() - this.lastFailureTime;
          if (timeSinceLastFailure > this.resetTime) {
            this.failureCount = 0;
          }
        }
      }
      recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.threshold && this.state === "closed") {
          this.state = "open";
          logger.warn("Cache circuit breaker opened - too many Redis failures", {
            failureCount: this.failureCount
          });
        }
      }
      canAttempt() {
        if (this.state === "closed") {
          return true;
        }
        if (this.state === "open") {
          const timeSinceLastFailure = Date.now() - this.lastFailureTime;
          if (timeSinceLastFailure >= this.timeout) {
            this.state = "half-open";
            logger.info("Cache circuit breaker half-open - attempting Redis connection");
            return true;
          }
          return false;
        }
        return true;
      }
      getState() {
        return this.state;
      }
    };
    CacheManager = class {
      static DEFAULT_TTL = 5 * 60;
      // 5 minutes in seconds
      static circuitBreaker = new CacheCircuitBreaker();
      static cacheStats = {
        hits: 0,
        misses: 0,
        errors: 0,
        fallbacks: 0
      };
      /**
       * Set cache value with graceful degradation
       */
      static async set(key, value, ttl = this.DEFAULT_TTL) {
        const cacheKey = SessionManager.CACHE_PREFIX + key;
        const serializedValue = JSON.stringify(value);
        if (redisClient && this.circuitBreaker.canAttempt()) {
          try {
            await redisClient.setEx(cacheKey, ttl, serializedValue);
            this.circuitBreaker.recordSuccess();
            logger.debug("Cache stored in Redis", { key, ttl });
            return;
          } catch (error) {
            this.cacheStats.errors++;
            this.circuitBreaker.recordFailure();
            logger.warn("Redis cache set failed, falling back to memory", {
              key,
              error: error instanceof Error ? error.message : "Unknown error",
              circuitState: this.circuitBreaker.getState()
            });
          }
        }
        try {
          this.cacheStats.fallbacks++;
          if (!global.appCache) {
            global.appCache = /* @__PURE__ */ new Map();
          }
          const cache = global.appCache;
          const expiresAt = new Date(Date.now() + ttl * 1e3);
          cache.set(key, { data: value, expiresAt });
          if (cache.size > 500) {
            const keysToDelete = Array.from(cache.keys()).slice(0, 100);
            keysToDelete.forEach((k) => cache.delete(k));
            logger.debug("Memory cache LRU eviction", { evicted: keysToDelete.length });
          }
          logger.debug("Cache stored in memory", { key, ttl });
        } catch (error) {
          this.cacheStats.errors++;
          logger.error("Failed to set cache in both Redis and memory", {
            key,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      /**
       * Get cache value with graceful degradation
       */
      static async get(key) {
        const cacheKey = SessionManager.CACHE_PREFIX + key;
        if (redisClient && this.circuitBreaker.canAttempt()) {
          try {
            const value = await redisClient.get(cacheKey);
            if (value) {
              this.circuitBreaker.recordSuccess();
              this.cacheStats.hits++;
              const parsedValue = JSON.parse(value);
              logger.debug("Cache hit in Redis", { key });
              return parsedValue;
            }
          } catch (error) {
            this.cacheStats.errors++;
            this.circuitBreaker.recordFailure();
            logger.warn("Redis cache get failed, trying memory fallback", {
              key,
              error: error instanceof Error ? error.message : "Unknown error",
              circuitState: this.circuitBreaker.getState()
            });
          }
        }
        try {
          if (!global.appCache) {
            this.cacheStats.misses++;
            return null;
          }
          const cache = global.appCache;
          const cached = cache.get(key);
          if (!cached) {
            this.cacheStats.misses++;
            return null;
          }
          if (/* @__PURE__ */ new Date() > cached.expiresAt) {
            cache.delete(key);
            this.cacheStats.misses++;
            return null;
          }
          this.cacheStats.hits++;
          this.cacheStats.fallbacks++;
          logger.debug("Cache hit in memory", { key });
          return cached.data;
        } catch (error) {
          this.cacheStats.errors++;
          this.cacheStats.misses++;
          logger.error("Failed to get cache from both Redis and memory", {
            key,
            error: error instanceof Error ? error.message : "Unknown error"
          });
          return null;
        }
      }
      /**
       * Delete cache value with graceful degradation
       */
      static async delete(key) {
        const cacheKey = SessionManager.CACHE_PREFIX + key;
        let redisSuccess = false;
        if (redisClient && this.circuitBreaker.canAttempt()) {
          try {
            await redisClient.del(cacheKey);
            this.circuitBreaker.recordSuccess();
            logger.debug("Cache deleted from Redis", { key });
            redisSuccess = true;
          } catch (error) {
            this.cacheStats.errors++;
            this.circuitBreaker.recordFailure();
            logger.warn("Redis cache delete failed, will try memory", {
              key,
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
        }
        try {
          if (global.appCache) {
            global.appCache.delete(key);
            if (!redisSuccess) {
              logger.debug("Cache deleted from memory", { key });
            }
          }
        } catch (error) {
          logger.error("Failed to delete cache from memory", {
            key,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      /**
       * Clear cache by pattern
       */
      static async clearPattern(pattern) {
        try {
          if (redisClient) {
            const keys = await redisClient.keys(
              SessionManager.CACHE_PREFIX + "*" + pattern + "*"
            );
            if (keys.length > 0) {
              await redisClient.del(keys);
              logger.info("Cleared cache pattern in Redis", {
                pattern,
                count: keys.length
              });
            }
          } else {
            if (!global.appCache) {
              return;
            }
            const cache = global.appCache;
            const keysToDelete = Array.from(cache.keys()).filter(
              (key) => key.includes(pattern)
            );
            let deletedCount = 0;
            for (const key of keysToDelete) {
              cache.delete(key);
              deletedCount++;
            }
            if (deletedCount > 0) {
              logger.info("Cleared cache pattern in memory", {
                pattern,
                count: deletedCount
              });
            }
          }
        } catch (error) {
          logger.error("Failed to clear cache pattern", {
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      /**
       * Get comprehensive cache statistics
       */
      static async getStats() {
        try {
          let size = 0;
          let type = "Unknown";
          if (redisClient && this.circuitBreaker.canAttempt()) {
            try {
              const keys = await redisClient.keys(SessionManager.CACHE_PREFIX + "*");
              size = keys.length;
              type = "Redis";
            } catch (error) {
              size = global.appCache ? global.appCache.size : 0;
              type = "Memory (Redis unavailable)";
            }
          } else {
            size = global.appCache ? global.appCache.size : 0;
            type = this.circuitBreaker.getState() === "open" ? "Memory (Circuit breaker open)" : "Memory (INSECURE)";
          }
          const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
          const hitRate = totalRequests > 0 ? (this.cacheStats.hits / totalRequests * 100).toFixed(2) + "%" : "N/A";
          return {
            size,
            type,
            hits: this.cacheStats.hits,
            misses: this.cacheStats.misses,
            errors: this.cacheStats.errors,
            fallbacks: this.cacheStats.fallbacks,
            hitRate,
            circuitBreakerState: this.circuitBreaker.getState()
          };
        } catch (error) {
          logger.error("Failed to get cache stats", {
            error: error instanceof Error ? error.message : "Unknown error"
          });
          return {
            size: 0,
            type: "Unknown",
            hits: this.cacheStats.hits,
            misses: this.cacheStats.misses,
            errors: this.cacheStats.errors,
            fallbacks: this.cacheStats.fallbacks,
            hitRate: "N/A",
            circuitBreakerState: "unknown"
          };
        }
      }
    };
    initializeRedis().catch(() => {
      logger.warn(
        "Security module initialized without Redis (falling back to insecure memory storage)"
      );
    });
    setInterval(
      () => {
        SessionManager.cleanupExpiredSessions().catch((error) => {
          logger.error("Failed to cleanup expired sessions", { error });
        });
      },
      10 * 60 * 1e3
    );
    validateRequest = (req, res, next) => {
      const contentLength = parseInt(req.headers["content-length"] || "0");
      if (contentLength > 10 * 1024 * 1024) {
        return res.status(413).json({ error: "Request too large" });
      }
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        const contentType = req.headers["content-type"];
        if (!contentType) {
          return res.status(400).json({ error: "Content-Type header is required" });
        }
        const baseContentType = contentType.split(";")[0].trim().toLowerCase();
        const validTypes = ["application/json", "multipart/form-data"];
        if (!validTypes.some((type) => baseContentType === type || baseContentType.startsWith(type))) {
          return res.status(400).json({
            error: "Invalid content type",
            received: baseContentType,
            expected: validTypes
          });
        }
      }
      next();
    };
  }
});

// server/index.ts
import express3 from "express";
import { createServer } from "http";
import { readFileSync as readFileSync2 } from "fs";
import { join as join5, dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

// server/routes.ts
import * as express from "express";
import * as path4 from "path";
import { randomBytes } from "crypto";

// server/storage.ts
init_db();
init_schema();
init_logger();
init_security();
import { eq, desc, and, gte, lte, sql as sql2 } from "drizzle-orm";
var performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  slowQueries: 0,
  totalQueries: 0
};
var DEFAULT_TTL = 5 * 60 * 1e3;
async function getFromCache(key) {
  try {
    const cached = await CacheManager.get(key);
    if (cached !== null) {
      performanceMetrics.cacheHits++;
      return cached;
    }
    performanceMetrics.cacheMisses++;
    return null;
  } catch (error) {
    logger.error("Cache retrieval failed", { error, key });
    performanceMetrics.cacheMisses++;
    return null;
  }
}
async function setCache(key, data, ttl = DEFAULT_TTL) {
  try {
    await CacheManager.set(key, data, ttl / 1e3);
  } catch (error) {
    logger.error("Cache storage failed", { error, key });
  }
}
async function executeQuery(operation, queryFn, cacheKey, ttl) {
  const startTime = Date.now();
  performanceMetrics.totalQueries++;
  try {
    if (cacheKey) {
      const cached = await getFromCache(cacheKey);
      if (cached !== null) {
        logger.debug("Cache hit for operation", { operation, cacheKey });
        return cached;
      }
    }
    const result = await withDatabaseReconnection(queryFn, operation);
    const duration = Date.now() - startTime;
    if (duration > 1e3) {
      performanceMetrics.slowQueries++;
      logger.warn("Slow query detected", {
        operation,
        duration,
        cacheKey
      });
    }
    if (cacheKey && result) {
      await setCache(cacheKey, result, ttl);
    }
    logger.debug("Query completed", {
      operation,
      duration,
      cacheHit: false
    });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Query failed", {
      operation,
      duration,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  }
}
var storage = {
  // Inspection methods
  async createInspection(data) {
    return executeQuery("createInspection", async () => {
      const [result] = await db.insert(inspections).values(data).returning();
      logger.info("Created inspection:", { id: result.id });
      await CacheManager.clearPattern("inspections:all");
      return result;
    });
  },
  async getInspections(options) {
    const cacheKey = `inspections:all:${JSON.stringify(options || {})}`;
    return executeQuery("getInspections", async () => {
      let query = db.select().from(inspections);
      const conditions = [];
      if (options?.startDate) {
        conditions.push(gte(inspections.date, options.startDate));
      }
      if (options?.endDate) {
        conditions.push(lte(inspections.date, options.endDate));
      }
      if (options?.school) {
        conditions.push(eq(inspections.school, options.school));
      }
      if (options?.inspectionType) {
        conditions.push(eq(inspections.inspectionType, options.inspectionType));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      query = query.orderBy(desc(inspections.date));
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.offset(options.offset);
      }
      const result = await query;
      logger.info(`Retrieved ${result.length} inspections`, { options });
      return result;
    }, cacheKey, 6e4);
  },
  async getInspection(id) {
    const cacheKey = `inspection:${id}`;
    return executeQuery("getInspection", async () => {
      const [result] = await db.select().from(inspections).where(eq(inspections.id, id));
      logger.info("Retrieved inspection:", { id });
      return result;
    }, cacheKey, 3e5);
  },
  async updateInspection(id, data) {
    return executeQuery("updateInspection", async () => {
      const [result] = await db.update(inspections).set(data).where(eq(inspections.id, id)).returning();
      logger.info("Updated inspection:", { id });
      await CacheManager.delete(`inspection:${id}`);
      await CacheManager.clearPattern("inspections:all");
      return result;
    });
  },
  async deleteInspection(id) {
    return executeQuery("deleteInspection", async () => {
      await db.delete(inspections).where(eq(inspections.id, id));
      logger.info("Deleted inspection:", { id });
      await CacheManager.delete(`inspection:${id}`);
      await CacheManager.clearPattern("inspections:all");
      return true;
    });
  },
  // Custodial Notes methods
  async createCustodialNote(data) {
    return executeQuery("createCustodialNote", async () => {
      const [result] = await db.insert(custodialNotes).values(data).returning();
      logger.info("Created custodial note:", { id: result.id });
      await CacheManager.delete("custodialNotes:all");
      return result;
    });
  },
  async getCustodialNotes(options) {
    const cacheKey = `custodialNotes:all:${JSON.stringify(options || {})}`;
    return executeQuery("getCustodialNotes", async () => {
      let query = db.select().from(custodialNotes);
      const conditions = [];
      if (options?.school) {
        conditions.push(eq(custodialNotes.school, options.school));
      }
      if (options?.startDate) {
        conditions.push(gte(custodialNotes.date, options.startDate));
      }
      if (options?.endDate) {
        conditions.push(lte(custodialNotes.date, options.endDate));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      query = query.orderBy(desc(custodialNotes.createdAt));
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.offset(options.offset);
      }
      const result = await query;
      logger.info(`Retrieved ${result.length} custodial notes`, { options });
      return result;
    }, cacheKey, 6e4);
  },
  async getCustodialNote(id) {
    const cacheKey = `custodialNote:${id}`;
    return executeQuery("getCustodialNote", async () => {
      const [result] = await db.select().from(custodialNotes).where(eq(custodialNotes.id, id));
      logger.info("Retrieved custodial note:", { id });
      return result;
    }, cacheKey, 3e5);
  },
  async deleteCustodialNote(id) {
    return executeQuery("deleteCustodialNote", async () => {
      await db.delete(custodialNotes).where(eq(custodialNotes.id, id));
      logger.info("Deleted custodial note:", { id });
      await CacheManager.delete(`custodialNote:${id}`);
      await CacheManager.clearPattern("custodialNotes:all");
      return true;
    });
  },
  // Room Inspections methods
  async createRoomInspection(data) {
    return executeQuery("createRoomInspection", async () => {
      const [result] = await db.insert(roomInspections).values(data).returning();
      logger.info("Created room inspection:", { id: result.id });
      await CacheManager.delete("roomInspections:all");
      return result;
    });
  },
  async getRoomInspections(buildingInspectionId) {
    const cacheKey = `roomInspections:all:${buildingInspectionId || "all"}`;
    return executeQuery("getRoomInspections", async () => {
      if (buildingInspectionId) {
        const result = await db.select().from(roomInspections).where(eq(roomInspections.buildingInspectionId, buildingInspectionId)).orderBy(desc(roomInspections.createdAt));
        logger.info(`Retrieved ${result.length} room inspections for building:`, { buildingInspectionId });
        return result;
      } else {
        const result = await db.select().from(roomInspections).orderBy(desc(roomInspections.createdAt));
        logger.info(`Retrieved ${result.length} room inspections`);
        return result;
      }
    }, cacheKey, 6e4);
  },
  async getRoomInspection(id) {
    const cacheKey = `roomInspection:${id}`;
    return executeQuery("getRoomInspection", async () => {
      const [result] = await db.select().from(roomInspections).where(eq(roomInspections.id, id));
      logger.info("Retrieved room inspection:", { id });
      return result;
    }, cacheKey, 3e5);
  },
  async getRoomInspectionsByBuildingId(buildingInspectionId) {
    return this.getRoomInspections(buildingInspectionId);
  },
  async updateRoomInspection(roomId, buildingInspectionId, data) {
    return executeQuery("updateRoomInspection", async () => {
      const [result] = await db.update(roomInspections).set(data).where(
        and(
          eq(roomInspections.id, roomId),
          eq(roomInspections.buildingInspectionId, buildingInspectionId)
        )
      ).returning();
      if (!result) {
        logger.warn("Room inspection not found for update:", { roomId, buildingInspectionId });
        return null;
      }
      logger.info("Updated room inspection:", { roomId, buildingInspectionId });
      await CacheManager.delete(`roomInspection:${roomId}`);
      await CacheManager.delete(`roomInspections:all:${buildingInspectionId}`);
      await CacheManager.clearPattern("roomInspections:all");
      return result;
    });
  },
  // Monthly Feedback methods
  async createMonthlyFeedback(data) {
    return executeQuery("createMonthlyFeedback", async () => {
      const [result] = await db.insert(monthlyFeedback).values(data).returning();
      logger.info("Created monthly feedback:", { id: result.id, school: result.school });
      await CacheManager.delete("monthlyFeedback:all");
      return result;
    });
  },
  async getMonthlyFeedback(options) {
    const cacheKey = `monthlyFeedback:all:${JSON.stringify(options || {})}`;
    return executeQuery("getMonthlyFeedback", async () => {
      const conditions = [];
      if (options?.school) {
        conditions.push(eq(monthlyFeedback.school, options.school));
      }
      if (options?.year) {
        conditions.push(eq(monthlyFeedback.year, options.year));
      }
      if (options?.month) {
        conditions.push(eq(monthlyFeedback.month, options.month));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
      const page = options?.page && options.page > 0 ? options.page : 1;
      const limit = options?.limit && options.limit > 0 && options.limit <= 100 ? options.limit : 50;
      const offset = (page - 1) * limit;
      const [feedbackData, totalCountResult] = await Promise.all([
        // Fetch paginated data
        db.select().from(monthlyFeedback).where(whereClause).orderBy(desc(monthlyFeedback.year), desc(monthlyFeedback.month)).limit(limit).offset(offset),
        // Fetch total count for pagination metadata
        db.select({ count: sql2`count(*)` }).from(monthlyFeedback).where(whereClause)
      ]);
      const totalCount = Number(totalCountResult[0]?.count || 0);
      const totalPages = Math.ceil(totalCount / limit);
      logger.info(`Retrieved ${feedbackData.length} monthly feedback documents (page ${page}/${totalPages})`, {
        options,
        totalCount
      });
      return {
        data: feedbackData,
        totalCount,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalPages,
          totalRecords: totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    }, cacheKey, 12e4);
  },
  async getMonthlyFeedbackById(id) {
    const cacheKey = `monthlyFeedback:${id}`;
    return executeQuery("getMonthlyFeedbackById", async () => {
      const [result] = await db.select().from(monthlyFeedback).where(eq(monthlyFeedback.id, id));
      logger.info("Retrieved monthly feedback:", { id });
      return result;
    }, cacheKey, 3e5);
  },
  async deleteMonthlyFeedback(id) {
    return executeQuery("deleteMonthlyFeedback", async () => {
      await db.delete(monthlyFeedback).where(eq(monthlyFeedback.id, id));
      logger.info("Deleted monthly feedback:", { id });
      await CacheManager.delete(`monthlyFeedback:${id}`);
      await CacheManager.clearPattern("monthlyFeedback:all");
      return true;
    });
  },
  async updateMonthlyFeedbackNotes(id, notes) {
    return executeQuery("updateMonthlyFeedbackNotes", async () => {
      const [result] = await db.update(monthlyFeedback).set({ notes }).where(eq(monthlyFeedback.id, id)).returning();
      logger.info("Updated monthly feedback notes:", { id });
      await CacheManager.delete(`monthlyFeedback:${id}`);
      await CacheManager.clearPattern("monthlyFeedback:all");
      return result;
    });
  },
  // Performance metrics and cache management
  async getPerformanceMetrics() {
    const cacheStats = await CacheManager.getStats();
    return {
      ...performanceMetrics,
      cacheHitRate: performanceMetrics.totalQueries > 0 ? (performanceMetrics.cacheHits / performanceMetrics.totalQueries * 100).toFixed(2) + "%" : "0%",
      slowQueryRate: performanceMetrics.totalQueries > 0 ? (performanceMetrics.slowQueries / performanceMetrics.totalQueries * 100).toFixed(2) + "%" : "0%",
      cacheSize: cacheStats.size,
      cacheType: cacheStats.type,
      poolStatus: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  },
  async clearCache(pattern) {
    try {
      if (pattern) {
        await CacheManager.clearPattern(pattern);
        logger.info("Cleared cache entries matching pattern", { pattern });
      } else {
        logger.warn("Full cache clearing not implemented with Redis - use pattern-based clearing");
      }
    } catch (error) {
      logger.error("Failed to clear cache", { error, pattern });
    }
  },
  // Cache warming for frequently accessed data
  async warmCache() {
    logger.info("Warming cache...");
    try {
      await this.getInspections({ limit: 50 });
      await this.getCustodialNotes({ limit: 50 });
      await this.getMonthlyFeedback();
      logger.info("Cache warming completed");
    } catch (error) {
      logger.error("Cache warming failed", { error });
    }
  },
  // Photo storage methods
  async createInspectionPhoto(photoData) {
    return executeQuery(
      "createInspectionPhoto",
      async () => {
        const [photo] = await db.insert(inspectionPhotos).values(photoData).returning();
        return photo;
      },
      `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
  },
  async getInspectionPhoto(photoId) {
    return executeQuery(
      "getInspectionPhoto",
      async () => {
        const [photo] = await db.select().from(inspectionPhotos).where(eq(inspectionPhotos.id, photoId)).limit(1);
        return photo;
      },
      `inspection_photo_${photoId}`
    );
  },
  async getInspectionPhotosByInspectionId(inspectionId) {
    return executeQuery(
      "getInspectionPhotosByInspectionId",
      async () => {
        const photos = await db.select().from(inspectionPhotos).where(eq(inspectionPhotos.inspectionId, inspectionId)).orderBy(desc(inspectionPhotos.createdAt));
        return photos;
      },
      `photos_inspection_${inspectionId}`,
      10 * 60 * 1e3
      // 10 minute cache
    );
  },
  async getAllInspectionPhotos() {
    return executeQuery(
      "getAllInspectionPhotos",
      async () => {
        const photos = await db.select().from(inspectionPhotos).orderBy(desc(inspectionPhotos.createdAt));
        return photos;
      },
      "all_photos",
      5 * 60 * 1e3
      // 5 minute cache
    );
  },
  async updateInspectionPhoto(photoId, updateData) {
    return executeQuery(
      "updateInspectionPhoto",
      async () => {
        const [photo] = await db.update(inspectionPhotos).set(updateData).where(eq(inspectionPhotos.id, photoId)).returning();
        return photo;
      },
      `update_photo_${photoId}`
    );
  },
  async deleteInspectionPhoto(photoId) {
    return executeQuery(
      "deleteInspectionPhoto",
      async () => {
        await db.delete(inspectionPhotos).where(eq(inspectionPhotos.id, photoId));
      },
      `delete_photo_${photoId}`
    );
  },
  // Sync queue methods
  async createSyncQueue(queueData) {
    return executeQuery(
      "createSyncQueue",
      async () => {
        const [queueItem] = await db.insert(syncQueue).values(queueData).returning();
        return queueItem;
      },
      `sync_queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
  },
  async getSyncQueueItems(status) {
    return executeQuery(
      "getSyncQueueItems",
      async () => {
        let query = db.select().from(syncQueue).orderBy(desc(syncQueue.createdAt));
        if (status) {
          query = query.where(eq(syncQueue.type, status));
        }
        const items = await query;
        return items;
      },
      `sync_queue_${status || "all"}`,
      5 * 60 * 1e3
      // 5 minute cache
    );
  },
  async updateSyncQueue(queueId, updateData) {
    return executeQuery(
      "updateSyncQueue",
      async () => {
        const [queueItem] = await db.update(syncQueue).set(updateData).where(eq(syncQueue.id, queueId)).returning();
        return queueItem;
      },
      `update_sync_queue_${queueId}`
    );
  },
  async deleteSyncQueue(queueId) {
    return executeQuery(
      "deleteSyncQueue",
      async () => {
        await db.delete(syncQueue).where(eq(syncQueue.id, queueId));
      },
      `delete_sync_queue_${queueId}`
    );
  }
};

// server/routes.ts
init_schema();
init_security();
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
import { createHash } from "crypto";
import mime from "mime-types";
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
  /**
   * Validate that the requested file path is within the storage directory
   * Prevents path traversal attacks
   */
  validateFilePath(filename) {
    if (filename.includes("..") || filename.startsWith("/") || filename.includes("\0")) {
      logger.warn("Path traversal attempt detected", { filename });
      return { valid: false, error: "Invalid filename: path traversal detected" };
    }
    const requestedPath = path2.resolve(this.storagePath, filename);
    const normalizedStoragePath = path2.resolve(this.storagePath);
    if (!requestedPath.startsWith(normalizedStoragePath + path2.sep) && requestedPath !== normalizedStoragePath) {
      logger.warn("File access outside storage directory attempted", {
        filename,
        requestedPath,
        storagePath: normalizedStoragePath
      });
      return { valid: false, error: "Access denied: file outside storage directory" };
    }
    return { valid: true, resolvedPath: requestedPath };
  }
  async uploadLargeFile(fileBuffer, filename, _mimetype) {
    try {
      const parsedPath = path2.parse(filename);
      const categoryPath = parsedPath.dir || "general";
      const safeCategoryPath = categoryPath.split(path2.sep).map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, "-")).join(path2.sep);
      const categoryDir = path2.join(this.storagePath, safeCategoryPath);
      await fs2.mkdir(categoryDir, { recursive: true });
      const finalFilename = parsedPath.base || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${parsedPath.ext || ".bin"}`;
      const filePath = path2.join(categoryDir, finalFilename);
      await fs2.writeFile(filePath, fileBuffer);
      const publicUrl = `/uploads/${safeCategoryPath}/${finalFilename}`;
      logger.info(`File uploaded: ${finalFilename} (${fileBuffer.length} bytes)`);
      return {
        success: true,
        filename: `${safeCategoryPath}/${finalFilename}`,
        filePath,
        publicUrl,
        size: fileBuffer.length,
        originalName: filename
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
      const validation = this.validateFilePath(filename);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || "Invalid file path"
        };
      }
      const fileBuffer = await fs2.readFile(validation.resolvedPath);
      const contentType = mime.lookup(filename) || "application/octet-stream";
      const hash = createHash("md5").update(fileBuffer).digest("hex");
      logger.info(`File retrieved: ${filename}`);
      return {
        success: true,
        buffer: fileBuffer,
        filename,
        httpMetadata: {
          contentType
        },
        httpEtag: hash
      };
    } catch (error) {
      logger.error("Error retrieving file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "File not found"
      };
    }
  }
  async downloadObject(filename) {
    try {
      const validation = this.validateFilePath(filename);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || "Invalid file path",
          data: null
        };
      }
      const fileBuffer = await fs2.readFile(validation.resolvedPath);
      logger.info(`File downloaded: ${filename}`);
      return {
        success: true,
        data: fileBuffer
      };
    } catch (error) {
      logger.error("Error downloading file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "File not found",
        data: null
      };
    }
  }
  /**
   * Delete a file from storage
   * NOTE: Caller should verify file is not referenced in database before calling this method
   * @param filename - Path to the file relative to storage directory
   * @param skipReferenceCheck - If true, skip checking if file is still referenced (use with caution)
   */
  async deleteFile(filename, skipReferenceCheck = false) {
    try {
      const validation = this.validateFilePath(filename);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || "Invalid file path"
        };
      }
      if (skipReferenceCheck) {
        logger.warn("File deletion without reference check", { filename });
      }
      await fs2.unlink(validation.resolvedPath);
      logger.info(`File deleted: ${filename}`, { skipReferenceCheck });
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
    /\b(going well|improving|progress|complimentary)\b/i,
    /\bsmells?\s+(good|great|clean|fresh|nice)\b/i
    // "smells good", "smell fresh", etc.
  ],
  major: [
    /\b(crisis|unsafe|hazard|broken|damaged|filthy|disgusting|unacceptable|failure|critical)\b/i,
    /\b(not working|completely|severe|major|serious|significant)\b/i,
    /\b(overflowing|overflow|stinks|foul|offensive)\b/i,
    /\bsmells?\s+(bad|terrible|awful|horrible|like)\b/i,
    // "smells bad", "smells like...", etc.
    /\b(bad|terrible|awful|horrible)\s+smell\b/i
    // "bad smell", "terrible smell", etc.
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

// server/utils/pathValidation.ts
init_logger();
import * as path3 from "path";
function sanitizeFilePath(userPath, allowedDirectory) {
  if (!userPath || typeof userPath !== "string") {
    logger.error("[Security] Invalid file path provided", { userPath });
    throw new Error("Invalid file path");
  }
  const normalized = path3.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, "");
  if (normalized.includes("..") || path3.isAbsolute(normalized)) {
    logger.warn("[Security] Directory traversal attempt detected", {
      userPath,
      normalized
    });
    throw new Error("Invalid file path: directory traversal not allowed");
  }
  if (normalized.includes("\0")) {
    logger.warn("[Security] Null byte injection attempt detected", {
      userPath
    });
    throw new Error("Invalid file path: null bytes not allowed");
  }
  if (allowedDirectory) {
    const resolvedPath = path3.resolve(allowedDirectory, normalized);
    const allowedPath = path3.resolve(allowedDirectory);
    if (!resolvedPath.startsWith(allowedPath)) {
      logger.warn("[Security] Path escape attempt detected", {
        userPath,
        resolvedPath,
        allowedPath
      });
      throw new Error("Invalid file path: outside allowed directory");
    }
    return resolvedPath;
  }
  return normalized;
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
        logger.warn("[POST] Missing required fields", {
          school,
          inspectionType
        });
        return res.status(400).json({
          message: "Missing required fields",
          details: { school: !!school, inspectionType: !!inspectionType }
        });
      }
      let imageUrls = [];
      if (files && files.length > 0) {
        logger.info("[POST] Processing uploaded files with object storage", {
          count: files.length
        });
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
              logger.info("[POST] File uploaded to object storage", {
                filename,
                url: `/objects/${filename}`
              });
            } else {
              logger.error("[POST] Failed to upload file to object storage", {
                filename,
                error: uploadResult.error
              });
            }
          } catch (uploadError) {
            logger.error(
              "[POST] Error uploading file to object storage:",
              uploadError
            );
          }
        }
      }
      const parseNumericField = (value) => {
        if (value === null || value === void 0 || value === "") return null;
        const num = typeof value === "string" ? parseInt(value, 10) : value;
        return isNaN(num) ? null : num;
      };
      const inspectionData = {
        inspectorName: inspectorName || "",
        school,
        date: req.body.date || (/* @__PURE__ */ new Date()).toISOString(),
        inspectionType,
        locationDescription: req.body.locationDescription || "",
        roomNumber: req.body.roomNumber || null,
        locationCategory: req.body.locationCategory || null,
        floors: parseNumericField(req.body.floors),
        verticalHorizontalSurfaces: parseNumericField(req.body.verticalHorizontalSurfaces),
        ceiling: parseNumericField(req.body.ceiling),
        restrooms: parseNumericField(req.body.restrooms),
        customerSatisfaction: parseNumericField(req.body.customerSatisfaction),
        trash: parseNumericField(req.body.trash),
        projectCleaning: parseNumericField(req.body.projectCleaning),
        activitySupport: parseNumericField(req.body.activitySupport),
        safetyCompliance: parseNumericField(req.body.safetyCompliance),
        equipment: parseNumericField(req.body.equipment),
        monitoring: parseNumericField(req.body.monitoring),
        notes: req.body.notes || null,
        images: imageUrls,
        verifiedRooms: [],
        isCompleted: false
      };
      logger.info("[POST] Creating building inspection", { inspectionData });
      try {
        const validatedData = insertInspectionSchema.parse(inspectionData);
        const newInspection = await storage.createInspection(validatedData);
        logger.info("[POST] Building inspection created successfully", {
          id: newInspection.id
        });
        res.status(201).json({
          message: "Building inspection created successfully",
          id: newInspection.id,
          imageCount: imageUrls.length
        });
      } catch (validationError) {
        if (validationError instanceof z2.ZodError) {
          logger.warn("[POST] Validation failed", {
            errors: validationError.errors
          });
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
      const { type, incomplete, page = "1", limit = "50" } = req.query;
      let inspections2;
      inspections2 = await storage.getInspections();
      logger.info(`[GET] Found ${inspections2.length} total inspections`);
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          error: "Invalid pagination parameters",
          details: {
            page: isNaN(pageNum) ? "invalid" : page,
            limit: isNaN(limitNum) ? "invalid" : limit,
            validRange: "1-100"
          }
        });
      }
      const totalCount = inspections2.length;
      const offset = (pageNum - 1) * limitNum;
      if (type === "whole_building" && incomplete === "true") {
        inspections2 = inspections2.filter(
          (inspection) => inspection.inspectionType === "whole_building" && !inspection.isCompleted
        );
        logger.info(
          `[GET] Filtered whole_building incomplete: ${inspections2.length} \u2192 ${inspections2.length} inspections`
        );
      }
      const paginatedInspections = inspections2.slice(offset, offset + limitNum);
      res.json({
        data: paginatedInspections,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      });
    } catch (error) {
      logger.error("Error fetching inspections:", error);
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
      logger.error("Error fetching inspection:", error);
      res.status(500).json({ error: "Failed to fetch inspection" });
    }
  });
  app2.post("/api/custodial-notes", upload.array("images"), async (req, res) => {
    logger.info("[POST] Custodial Notes submission started", {
      headers: req.headers,
      contentType: req.headers["content-type"],
      files: req.files ? req.files.length : 0
    });
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("multipart/form-data")) {
      logger.warn("[POST] Invalid content type for multipart endpoint", {
        contentType,
        userAgent: req.headers["user-agent"]
      });
      return res.status(400).json({
        success: false,
        message: "Invalid content type",
        details: "This endpoint requires multipart/form-data. Please use the form to submit data.",
        technical: "Expected multipart/form-data, got " + (contentType || "none")
      });
    }
    try {
      const {
        inspectorName,
        school,
        date,
        locationDescription,
        location,
        notes
      } = req.body;
      const files = Array.isArray(req.files) ? req.files : [];
      logger.info("[POST] Parsed form data", {
        inspectorName,
        school,
        date,
        location,
        locationDescription,
        notes: notes ? `${notes.substring(0, 50)}...` : "none",
        fileCount: files.length
      });
      if (!inspectorName || !school || !date || !location) {
        logger.warn("[POST] Missing required fields", {
          received: { inspectorName, school, date, location },
          validation: {
            inspectorName: !!inspectorName,
            school: !!school,
            date: !!date,
            location: !!location
          }
        });
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          details: {
            inspectorName: !!inspectorName ? "\u2713" : "\u2717 required",
            school: !!school ? "\u2713" : "\u2717 required",
            date: !!date ? "\u2713" : "\u2717 required",
            location: !!location ? "\u2713" : "\u2717 required"
          },
          receivedFields: { inspectorName, school, date, location }
        });
      }
      let imageUrls = [];
      if (files && files.length > 0) {
        logger.info("[POST] Processing uploaded files with object storage", {
          count: files.length
        });
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
              logger.info("[POST] File uploaded to object storage", {
                filename,
                url: `/objects/${filename}`
              });
            } else {
              logger.error("[POST] Failed to upload file to object storage", {
                filename,
                error: uploadResult.error
              });
            }
          } catch (uploadError) {
            logger.error(
              "[POST] Error uploading file to object storage:",
              uploadError
            );
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
      logger.info("[POST] Custodial note created successfully", {
        id: custodialNoteResult.id
      });
      res.status(201).json({
        success: true,
        message: "Custodial note submitted successfully",
        id: custodialNoteResult.id,
        imageCount: imageUrls.length
      });
    } catch (error) {
      logger.error("[POST] Error creating custodial note:", error);
      if (error && error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size too large",
          details: "Maximum file size is 5MB per image"
        });
      }
      if (error && error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: "Too many files",
          details: "Maximum 5 images allowed"
        });
      }
      if (error && error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: "Invalid file field",
          details: "Only image files are allowed"
        });
      }
      if (error instanceof z2.ZodError) {
        logger.warn("[POST] Validation failed", { errors: error.errors });
        return res.status(400).json({
          success: false,
          message: "Invalid form data",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message
          }))
        });
      }
      if (error && error.message && error.message.includes("Unexpected end of form")) {
        logger.error(
          "[POST] FormData parsing error - likely malformed request",
          error
        );
        return res.status(400).json({
          success: false,
          message: "Invalid form data format",
          details: "The form data was not properly formatted. Please try again.",
          technical: "FormData parsing failed"
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "Unknown error" : "Please try again or contact support"
      });
    }
  });
  app2.use(
    "/api/custodial-notes",
    (err, req, res, next) => {
      logger.error("[POST] Multipart error in custodial notes:", err);
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File size too large",
            details: "Maximum file size is 5MB per image"
          });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            success: false,
            message: "Too many files",
            details: "Maximum 5 images allowed"
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            message: "Invalid file field",
            details: "Only image files are allowed"
          });
        }
        return res.status(400).json({
          success: false,
          message: "File upload error",
          details: err.message
        });
      }
      if (err && err.message) {
        if (err.message.includes("Unexpected end of form") || err.message.includes("Multipart: Boundary not found") || err.message.includes("Malformed part header")) {
          return res.status(400).json({
            success: false,
            message: "Form data is malformed",
            details: "The request format was invalid. Please try submitting the form again.",
            technical: "FormData parsing failed"
          });
        }
        if (err.message.includes("Unexpected field") || err.message.includes("Error: Multipart") || req.headers["content-type"]?.includes("application/json")) {
          return res.status(400).json({
            success: false,
            message: "Invalid content type",
            details: "This endpoint requires multipart/form-data. Please use the form to submit data.",
            technical: "Wrong content type for multipart endpoint"
          });
        }
      }
      return res.status(400).json({
        success: false,
        message: "Invalid request format",
        details: "The request could not be processed. Please ensure you are submitting the form correctly.",
        technical: "Multipart processing error"
      });
    }
  );
  app2.get("/api/custodial-notes", async (req, res) => {
    try {
      const { page = "1", limit = "50", school } = req.query;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          error: "Invalid pagination parameters",
          details: {
            page: isNaN(pageNum) ? "invalid" : page,
            limit: isNaN(limitNum) ? "invalid" : limit,
            validRange: "1-100"
          }
        });
      }
      const offset = (pageNum - 1) * limitNum;
      const allNotes = await storage.getCustodialNotes({
        school
      });
      const totalCount = allNotes.length;
      const paginatedNotes = allNotes.slice(offset, offset + limitNum);
      res.json({
        data: paginatedNotes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      });
    } catch (error) {
      logger.error("Error fetching custodial notes:", error);
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
      logger.error("Error fetching custodial note:", error);
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
      logger.info(`[PATCH] Updating inspection ${id} with:`, updates);
      const inspection = await storage.updateInspection(id, updates);
      if (!inspection) {
        logger.info(`[PATCH] Inspection ${id} not found`);
        return res.status(404).json({ error: "Inspection not found" });
      }
      logger.info(
        `[PATCH] Successfully updated inspection ${id}. isCompleted: ${inspection.isCompleted}`
      );
      res.json(inspection);
    } catch (error) {
      logger.error("Error updating inspection:", error);
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
      logger.error("Error deleting inspection:", error);
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
      logger.error("Error updating inspection:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid inspection data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update inspection" });
      }
    }
  });
  app2.post(
    "/api/submit-building-inspection",
    async (req, res) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      logger.info("Creating building inspection via submit endpoint", {
        requestId
      });
      try {
        logger.info(
          `[${requestId}] Raw building inspection request:`,
          JSON.stringify(req.body, null, 2)
        );
        logger.info(
          `[${requestId}] Headers:`,
          JSON.stringify(req.headers, null, 2)
        );
        if (!req.body) {
          logger.warn(`[${requestId}] No request body received`);
          return res.status(400).json({
            error: "No request body received",
            message: "Please ensure the request contains valid JSON data"
          });
        }
        const validatedData = insertInspectionSchema.parse(req.body);
        logger.info(
          `[${requestId}] Validated building inspection:`,
          JSON.stringify(validatedData, null, 2)
        );
        const result = await storage.createInspection(validatedData);
        logger.info("Building inspection created successfully", {
          requestId,
          inspectionId: result.id
        });
        const responsePayload = { success: true, id: result.id, ...result };
        logger.info(
          `[${requestId}] Response (JSON):`,
          JSON.stringify(responsePayload, null, 2)
        );
        res.setHeader("Content-Type", "application/json");
        return res.status(201).json(responsePayload);
      } catch (err) {
        logger.error(
          `[${requestId}] Failed to create building inspection:`,
          err
        );
        logger.error("Failed to create building inspection", {
          requestId,
          error: err
        });
        if (err instanceof z2.ZodError) {
          logger.error(`[${requestId}] Validation errors:`, err.errors);
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
        logger.info(
          `[${requestId}] Response (ERROR JSON):`,
          JSON.stringify(errorPayload, null, 2)
        );
        res.setHeader("Content-Type", "application/json");
        return res.status(500).json(errorPayload);
      }
    }
  );
  app2.get("/api/inspections/:id/rooms", async (req, res) => {
    try {
      const buildingInspectionId = parseInt(req.params.id);
      if (isNaN(buildingInspectionId)) {
        return res.status(400).json({ error: "Invalid building inspection ID" });
      }
      const rooms = await storage.getRoomInspectionsByBuildingId(buildingInspectionId);
      res.json(rooms);
    } catch (error) {
      logger.error("Error fetching rooms for building inspection:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });
  app2.post("/api/room-inspections", async (req, res) => {
    try {
      logger.info(
        "[POST] Creating room inspection with data:",
        JSON.stringify(req.body, null, 2)
      );
      const validatedData = insertRoomInspectionSchema.parse(req.body);
      logger.info(
        "[POST] Validated room inspection data:",
        JSON.stringify(validatedData, null, 2)
      );
      const roomInspection = await storage.createRoomInspection(validatedData);
      logger.info(
        "[POST] Successfully created room inspection:",
        roomInspection.id
      );
      res.status(201).json(roomInspection);
    } catch (error) {
      logger.error("Error creating room inspection:", error);
      if (error instanceof z2.ZodError) {
        logger.error("Validation errors:", error.errors);
        res.status(400).json({
          error: "Invalid room inspection data",
          details: error.errors,
          message: "Please check that all required fields are properly filled."
        });
      } else {
        logger.error("Database or server error:", error);
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
      logger.error("Error fetching room inspections:", error);
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
      logger.error("Error fetching room inspection:", error);
      res.status(500).json({ error: "Failed to fetch room inspection" });
    }
  });
  app2.post(
    "/api/inspections/:id/rooms/:roomId/submit",
    upload.array("images"),
    async (req, res) => {
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
          logger.info("[POST] Processing uploaded files with object storage", {
            count: files.length
          });
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
                logger.info("[POST] File uploaded to object storage", {
                  filename,
                  url: `/objects/${filename}`
                });
              } else {
                logger.error("[POST] Failed to upload file to object storage", {
                  filename,
                  error: uploadResult.error
                });
              }
            } catch (uploadError) {
              logger.error(
                "[POST] Error uploading file to object storage:",
                uploadError
              );
            }
          }
        }
        const updatedRoom = await storage.updateRoomInspection(
          roomId,
          inspectionId,
          {
            responses: JSON.stringify(parsedResponses),
            images: JSON.stringify(imageUrls),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            isCompleted: true
          }
        );
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
    }
  );
  app2.post(
    "/api/inspections/:id/finalize",
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid inspection ID" });
        }
        const inspection = await storage.updateInspection(id, {
          isCompleted: true
        });
        if (!inspection) {
          return res.status(404).json({ error: "Inspection not found" });
        }
        res.json(inspection);
      } catch (error) {
        logger.error("Error finalizing inspection:", error);
        res.status(500).json({ error: "Failed to finalize inspection" });
      }
    }
  );
  app2.use("/uploads", express.static(path4.join(process.cwd(), "uploads")));
  app2.get("/objects/:filename(*)", async (req, res) => {
    try {
      const requestedPath = req.params.filename;
      let filename;
      try {
        filename = sanitizeFilePath(requestedPath);
      } catch (securityError) {
        logger.error("[GET] Security validation failed for file path", {
          requestedPath,
          error: securityError instanceof Error ? securityError.message : securityError
        });
        return res.status(400).json({
          error: "Invalid file path",
          message: "File path validation failed"
        });
      }
      logger.info("[GET] Serving object from storage", { filename, requestedPath });
      const objectFile = await objectStorageService.getObjectFile(filename);
      if (!objectFile) {
        logger.warn("[GET] Object not found", { filename });
        return res.status(404).json({ message: "File not found" });
      }
      const downloadResult = await objectStorageService.downloadObject(filename);
      if (!downloadResult.success || !downloadResult.data) {
        logger.error("[GET] Failed to download object", {
          filename,
          error: downloadResult.error
        });
        return res.status(500).json({ message: "Failed to serve file" });
      }
      res.set({
        "Content-Type": objectFile.httpMetadata?.contentType || "application/octet-stream",
        "Content-Length": downloadResult.data.length.toString(),
        "Cache-Control": "public, max-age=31536000",
        // 1 year cache
        ETag: `"${objectFile.httpEtag}"`
      });
      res.send(downloadResult.data);
      logger.info("[GET] Object served successfully", {
        filename,
        size: downloadResult.data.length
      });
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
      const adminUsername = process.env.ADMIN_USERNAME;
      if (!adminUsername) {
        logger.error("ADMIN_USERNAME environment variable not set. Admin login unavailable.", {
          endpoint: "/api/admin/login",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          attemptedFrom: req.ip || req.connection.remoteAddress,
          userAgent: req.headers["user-agent"]
        });
        return res.status(500).json({
          success: false,
          message: "Internal server error. Please try again later."
        });
      }
      const hashedPassword = process.env.ADMIN_PASSWORD_HASH;
      if (!hashedPassword) {
        logger.error(
          "ADMIN_PASSWORD_HASH environment variable not set - please run password setup",
          {
            endpoint: "/api/admin/login",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            attemptedFrom: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
          }
        );
        return res.status(500).json({
          success: false,
          message: "Internal server error. Please try again later."
        });
      }
      const isValidPassword = await PasswordManager.verifyPassword(
        password,
        hashedPassword
      );
      if (username === adminUsername && isValidPassword) {
        const sessionToken = "admin_" + randomBytes(32).toString("hex");
        await SessionManager.setSession(sessionToken, {
          username,
          loginTime: (/* @__PURE__ */ new Date()).toISOString(),
          userAgent: req.headers["user-agent"],
          ip: req.ip || req.connection.remoteAddress
        });
        logger.info("Admin login successful", { username });
        res.json({
          success: true,
          message: "Login successful",
          sessionToken
        });
      } else {
        logger.warn("Admin login failed - invalid credentials", {
          username,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          attemptedFrom: req.ip || req.connection.remoteAddress,
          userAgent: req.headers["user-agent"]
        });
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
  const validateAdminSession = async (req, res, next) => {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "");
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "No session token provided"
      });
    }
    const session = await SessionManager.getSession(sessionToken);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid session token"
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
  app2.delete(
    "/api/admin/inspections/:id",
    validateAdminSession,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteInspection(id);
        if (success) {
          res.json({
            success: true,
            message: "Inspection deleted successfully"
          });
        } else {
          res.status(404).json({ success: false, message: "Inspection not found" });
        }
      } catch (error) {
        logger.error("Error deleting admin inspection", { error });
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  );
  app2.delete(
    "/api/admin/custodial-notes/:id",
    validateAdminSession,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ success: false, message: "Invalid custodial note ID" });
        }
        const success = await storage.deleteCustodialNote(id);
        if (success) {
          res.json({
            success: true,
            message: "Custodial note deleted successfully"
          });
        } else {
          res.status(404).json({ success: false, message: "Custodial note not found" });
        }
      } catch (error) {
        logger.error("Error deleting custodial note", { error });
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  );
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
  app2.post(
    "/api/monthly-feedback",
    pdfUpload.single("pdf"),
    async (req, res) => {
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
            details: {
              school: !!school,
              month: !!month,
              year: !!year,
              file: !!file
            }
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
          logger.error("[POST] Failed to upload PDF", {
            error: uploadResult.error
          });
          return res.status(500).json({ message: "Failed to upload PDF file" });
        }
        const pdfUrl = `/objects/${filename}`;
        logger.info("[POST] PDF uploaded successfully", {
          filename,
          url: pdfUrl
        });
        let extractedText = null;
        try {
          extractedText = await doclingService.extractTextFromPDF(
            file.buffer,
            file.originalname
          );
          if (!extractedText) {
            logger.warn(
              "[POST] Docling returned empty content, continuing without text"
            );
          }
        } catch (extractError) {
          logger.error(
            "[POST] Docling extraction failed, continuing without text:",
            extractError
          );
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
        logger.info("[POST] Monthly feedback created successfully", {
          id: newFeedback.id
        });
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
    }
  );
  app2.get("/api/monthly-feedback", async (req, res) => {
    try {
      const school = typeof req.query.school === "string" && req.query.school.trim().length > 0 ? req.query.school.trim() : void 0;
      const yearStr = typeof req.query.year === "string" ? req.query.year.trim() : "";
      const month = typeof req.query.month === "string" && req.query.month.trim().length > 0 ? req.query.month.trim() : void 0;
      let validYear = void 0;
      if (yearStr) {
        const yearNum = parseInt(yearStr, 10);
        if (isNaN(yearNum) || yearNum < 2e3 || yearNum > 2100) {
          return res.status(400).json({
            success: false,
            message: "Invalid year parameter. Year must be between 2000 and 2100."
          });
        }
        validYear = yearNum;
      }
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
      if (page < 1) {
        return res.status(400).json({
          success: false,
          message: "Page number must be greater than 0"
        });
      }
      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: "Limit must be between 1 and 100"
        });
      }
      const result = await storage.getMonthlyFeedback({
        school,
        year: validYear,
        month,
        page,
        limit
      });
      logger.info("[GET] Retrieved filtered monthly feedback", {
        page: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        totalRecords: result.pagination.totalRecords,
        filters: { school, year: validYear, month }
      });
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        filters: {
          school,
          year: validYear,
          month
        }
      });
    } catch (error) {
      logger.error("[GET] Error fetching monthly feedback:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : void 0
      });
      const errorDetails = {
        message: "Failed to fetch monthly feedback",
        error: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : void 0,
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : void 0,
        details: error instanceof Error ? error.message : String(error)
      };
      res.status(500).json(errorDetails);
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
  app2.get("/api/monthly-feedback-diagnostic", async (req, res) => {
    try {
      const diagnostic = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: process.env.NODE_ENV,
        database_url_exists: !!process.env.DATABASE_URL,
        database_url_prefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + "..." : "NOT SET"
      };
      const { pool: pool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      try {
        const tableCheck = await pool2.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'monthly_feedback'
          ) as table_exists
        `);
        diagnostic.table_exists = tableCheck.rows[0]?.table_exists || false;
      } catch (tableCheckError) {
        diagnostic.table_check_error = tableCheckError instanceof Error ? tableCheckError.message : String(tableCheckError);
      }
      if (diagnostic.table_exists) {
        try {
          const columns = await pool2.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'monthly_feedback' 
            ORDER BY ordinal_position
          `);
          diagnostic.table_columns = columns.rows;
        } catch (colError) {
          diagnostic.columns_error = colError instanceof Error ? colError.message : String(colError);
        }
        try {
          const countResult = await pool2.query("SELECT count(*) FROM monthly_feedback");
          diagnostic.raw_count = parseInt(countResult.rows[0]?.count || "0");
        } catch (countError) {
          diagnostic.raw_count_error = countError instanceof Error ? countError.message : String(countError);
        }
        try {
          const selectResult = await pool2.query("SELECT * FROM monthly_feedback LIMIT 3");
          diagnostic.raw_select_success = true;
          diagnostic.raw_select_count = selectResult.rows.length;
        } catch (selectError) {
          diagnostic.raw_select_error = selectError instanceof Error ? selectError.message : String(selectError);
        }
      }
      try {
        const testQuery = await storage.getMonthlyFeedback();
        diagnostic.orm_query_success = true;
        diagnostic.orm_records_count = testQuery?.data ? testQuery.data.length : 0;
      } catch (queryError) {
        diagnostic.orm_query_success = false;
        diagnostic.orm_query_error = queryError instanceof Error ? queryError.message : String(queryError);
        diagnostic.orm_query_stack = queryError instanceof Error ? queryError.stack?.split("\n").slice(0, 5) : void 0;
      }
      res.json(diagnostic);
    } catch (error) {
      res.status(500).json({
        message: "Diagnostic failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.delete(
    "/api/monthly-feedback/:id",
    validateAdminSession,
    async (req, res) => {
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
    }
  );
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
      const startDate = typeof req.query.startDate === "string" ? req.query.startDate.trim() : "";
      const endDate = typeof req.query.endDate === "string" ? req.query.endDate.trim() : "";
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const validStartDate = startDate && dateRegex.test(startDate) ? startDate : "";
      const validEndDate = endDate && dateRegex.test(endDate) ? endDate : "";
      logger.info("[GET] Fetching building scores", {
        startDate: validStartDate,
        endDate: validEndDate
      });
      const filteredInspections = await storage.getInspections({
        startDate: validStartDate || void 0,
        endDate: validEndDate || void 0
      });
      const filteredNotes = await storage.getCustodialNotes({
        startDate: validStartDate || void 0,
        endDate: validEndDate || void 0
      });
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
      const scoresWithCompliance = schoolScores.map((schoolScore) => ({
        ...schoolScore,
        complianceStatus: getComplianceStatus(schoolScore.score.overallScore)
      }));
      res.json({
        success: true,
        scores: scoresWithCompliance,
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
      const school = req.params.school ? req.params.school.trim() : "";
      const startDate = typeof req.query.startDate === "string" ? req.query.startDate.trim() : "";
      const endDate = typeof req.query.endDate === "string" ? req.query.endDate.trim() : "";
      if (!school || school.length === 0) {
        return res.status(400).json({ message: "School parameter is required" });
      }
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const validStartDate = startDate && dateRegex.test(startDate) ? startDate : "";
      const validEndDate = endDate && dateRegex.test(endDate) ? endDate : "";
      logger.info("[GET] Fetching score for school", {
        school,
        startDate: validStartDate,
        endDate: validEndDate
      });
      const inspections2 = await storage.getInspections({
        school,
        startDate: validStartDate || void 0,
        endDate: validEndDate || void 0
      });
      const notes = await storage.getCustodialNotes({
        school,
        startDate: validStartDate || void 0,
        endDate: validEndDate || void 0
      });
      const scoringResult = calculateBuildingScore(inspections2, notes);
      const complianceStatus = getComplianceStatus(scoringResult.overallScore);
      res.json({
        success: true,
        school,
        score: scoringResult,
        complianceStatus,
        dateRange: {
          start: startDate || inspections2[0]?.date || notes[0]?.date,
          end: endDate || inspections2[inspections2.length - 1]?.date || notes[notes.length - 1]?.date
        }
      });
    } catch (error) {
      logger.error("[GET] Error fetching school score:", error);
      res.status(500).json({ message: "Failed to fetch school score" });
    }
  });
  app2.post("/api/photos/upload", photoUploadRateLimit, upload.single("photo"), async (req, res) => {
    logger.info("[POST] Photo upload started", {
      contentType: req.get("Content-Type"),
      hasFile: !!req.file,
      metadata: req.body.metadata,
      hasLocation: !!req.body.location,
      inspectionId: req.body.inspectionId
    });
    try {
      if (!req.file) {
        logger.warn("[POST] No photo file provided");
        return res.status(400).json({
          success: false,
          message: "Photo file is required"
        });
      }
      let metadata;
      try {
        metadata = JSON.parse(req.body.metadata || "{}");
        if (!metadata.width || !metadata.height || !metadata.fileSize) {
          logger.warn("[POST] Missing required metadata fields", { metadata });
          return res.status(400).json({
            success: false,
            message: "Invalid metadata: missing required fields (width, height, fileSize)"
          });
        }
        if (metadata.width <= 0 || metadata.height <= 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid image dimensions"
          });
        }
        if (metadata.fileSize <= 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid file size"
          });
        }
      } catch (parseError) {
        logger.warn("[POST] Invalid metadata format", {
          error: parseError,
          metadata: req.body.metadata
        });
        return res.status(400).json({
          success: false,
          message: "Invalid metadata format"
        });
      }
      let locationData;
      try {
        locationData = req.body.location ? JSON.parse(req.body.location) : null;
        if (locationData) {
          if (typeof locationData.latitude !== "number" || typeof locationData.longitude !== "number" || locationData.latitude < -90 || locationData.latitude > 90 || locationData.longitude < -180 || locationData.longitude > 180) {
            return res.status(400).json({
              success: false,
              message: "Invalid location coordinates"
            });
          }
          if (locationData.accuracy && (typeof locationData.accuracy !== "number" || locationData.accuracy < 0)) {
            return res.status(400).json({
              success: false,
              message: "Invalid location accuracy"
            });
          }
        }
      } catch (locationError) {
        logger.warn("[POST] Invalid location data format", {
          error: locationError,
          location: req.body.location
        });
        locationData = null;
      }
      let inspectionId;
      if (req.body.inspectionId) {
        try {
          inspectionId = parseInt(req.body.inspectionId, 10);
          if (isNaN(inspectionId) || inspectionId <= 0) {
            return res.status(400).json({
              success: false,
              message: "Invalid inspection ID"
            });
          }
          const inspection = await storage.getInspection(inspectionId);
          if (!inspection) {
            return res.status(404).json({
              success: false,
              message: "Inspection not found"
            });
          }
        } catch (inspectionError) {
          return res.status(400).json({
            success: false,
            message: "Invalid inspection ID format"
          });
        }
      }
      const timestamp2 = Date.now();
      const randomId = Math.round(Math.random() * 1e9);
      const filename = `photos/${timestamp2}-${randomId}-${req.file.originalname}`;
      logger.info("[POST] Uploading photo to object storage", {
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      const uploadResult = await objectStorageService.uploadLargeFile(
        req.file.buffer,
        filename,
        req.file.mimetype
      );
      if (!uploadResult.success) {
        logger.error("[POST] Failed to upload photo to object storage", {
          filename,
          error: uploadResult.error
        });
        return res.status(500).json({
          success: false,
          message: "Failed to upload photo"
        });
      }
      const photoUrl = `/objects/${filename}`;
      const photoData = {
        inspectionId: inspectionId || null,
        photoUrl,
        locationLat: locationData ? locationData.latitude.toString() : null,
        locationLng: locationData ? locationData.longitude.toString() : null,
        locationAccuracy: locationData && locationData.accuracy ? locationData.accuracy.toString() : null,
        locationSource: locationData ? locationData.source || "gps" : null,
        buildingId: locationData?.buildingId || null,
        floor: locationData?.floor || null,
        room: locationData?.room || null,
        capturedAt: metadata.capturedAt ? new Date(metadata.capturedAt) : /* @__PURE__ */ new Date(),
        notes: metadata.notes || null,
        syncStatus: "synced",
        fileSize: metadata.fileSize,
        imageWidth: metadata.width,
        imageHeight: metadata.height,
        compressionRatio: metadata.compressionRatio || null,
        deviceInfo: metadata.deviceInfo ? JSON.stringify(metadata.deviceInfo) : null
      };
      const savedPhoto = await storage.createInspectionPhoto(photoData);
      logger.info("[POST] Photo uploaded and saved successfully", {
        photoId: savedPhoto.id,
        photoUrl,
        inspectionId
      });
      res.status(201).json({
        success: true,
        message: "Photo uploaded successfully",
        photo: {
          id: savedPhoto.id,
          url: photoUrl,
          metadata: {
            width: metadata.width,
            height: metadata.height,
            fileSize: metadata.fileSize,
            capturedAt: metadata.capturedAt
          },
          location: locationData ? {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            accuracy: locationData.accuracy,
            source: locationData.source
          } : null,
          inspectionId: inspectionId || null
        }
      });
    } catch (error) {
      logger.error("[POST] Error uploading photo:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during photo upload"
      });
    }
  });
  app2.get("/api/photos/:inspectionId", async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId, 10);
      if (isNaN(inspectionId) || inspectionId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid inspection ID"
        });
      }
      const inspection = await storage.getInspection(inspectionId);
      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: "Inspection not found"
        });
      }
      const photos = await storage.getInspectionPhotosByInspectionId(inspectionId);
      res.json({
        success: true,
        inspectionId,
        photos: photos.map((photo) => ({
          id: photo.id,
          url: photo.photoUrl,
          thumbnailUrl: photo.thumbnailUrl,
          capturedAt: photo.capturedAt,
          location: photo.locationLat && photo.locationLng ? {
            latitude: parseFloat(photo.locationLat),
            longitude: parseFloat(photo.locationLng),
            accuracy: photo.locationAccuracy ? parseFloat(photo.locationAccuracy) : null,
            source: photo.locationSource
          } : null,
          buildingId: photo.buildingId,
          floor: photo.floor,
          room: photo.room,
          syncStatus: photo.syncStatus,
          fileSize: photo.fileSize,
          dimensions: photo.imageWidth && photo.imageHeight ? {
            width: photo.imageWidth,
            height: photo.imageHeight
          } : null
        }))
      });
    } catch (error) {
      logger.error("[GET] Error fetching photos:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch photos"
      });
    }
  });
  app2.delete("/api/photos/:photoId", async (req, res) => {
    try {
      const photoId = parseInt(req.params.photoId, 10);
      if (isNaN(photoId) || photoId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid photo ID"
        });
      }
      const photo = await storage.getInspectionPhoto(photoId);
      if (!photo) {
        return res.status(404).json({
          success: false,
          message: "Photo not found"
        });
      }
      await storage.deleteInspectionPhoto(photoId);
      if (photo.photoUrl && photo.photoUrl.startsWith("/objects/")) {
        const filename = photo.photoUrl.replace("/objects/", "");
        const deleteResult = await objectStorageService.deleteFile(filename, true);
        if (!deleteResult.success) {
          logger.warn("[DELETE] Failed to delete photo from object storage", {
            photoId,
            filename,
            error: deleteResult.error,
            note: "Database record already deleted, file may be orphaned"
          });
        }
      }
      logger.info("[DELETE] Photo deleted successfully", { photoId });
      res.json({
        success: true,
        message: "Photo deleted successfully"
      });
    } catch (error) {
      logger.error("[DELETE] Error deleting photo:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete photo"
      });
    }
  });
  app2.get("/api/photos/sync-status", async (req, res) => {
    try {
      const photos = await storage.getAllInspectionPhotos();
      const syncStats = {
        total: photos.length,
        pending: photos.filter((p) => p.syncStatus === "pending").length,
        synced: photos.filter((p) => p.syncStatus === "synced").length,
        failed: photos.filter((p) => p.syncStatus === "failed").length,
        lastSyncTime: photos.length > 0 ? Math.max(...photos.map((p) => new Date(p.updatedAt).getTime())) : null
      };
      res.json({
        success: true,
        stats: syncStats
      });
    } catch (error) {
      logger.error("[GET] Error fetching sync status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch sync status"
      });
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
        "GET /api/scores/:school",
        "POST /api/photos/upload",
        "GET /api/photos/:inspectionId",
        "DELETE /api/photos/:photoId",
        "GET /api/photos/sync-status"
      ]
    });
  });
}

// server/vite.ts
init_logger();
import * as express2 from "express";
import * as path5 from "path";
function serveStatic(app2) {
  const uploadsPath = path5.join(process.cwd(), "uploads");
  app2.use("/uploads", express2.static(uploadsPath));
  logger.info(`Serving uploads from: ${uploadsPath}`);
  const staticPath = path5.join(process.cwd(), "dist", "public");
  app2.use((req, res, next) => {
    if (req.path.endsWith(".html") || req.path === "/") {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      logger.debug(`Setting no-cache headers for HTML request: ${req.path}`);
    }
    next();
  });
  app2.use(express2.static(staticPath, {
    maxAge: "1y",
    // Cache static assets for 1 year
    etag: true,
    lastModified: true,
    setHeaders: (res, path6) => {
      if (path6.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    }
  }));
  app2.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/health") || req.path.startsWith("/uploads") || req.path.includes(".")) {
      return next();
    }
    const indexPath = path5.join(staticPath, "index.html");
    if (!res.headersSent) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    if (!res.headersSent) {
      res.sendFile(indexPath, (err) => {
        if (err) {
          logger.error("Error serving index.html:", err);
          if (!res.headersSent) {
            res.status(500).send("Server Error");
          }
        }
      });
    } else {
      logger.warn("Headers already sent when trying to serve index.html for path:", req.path);
    }
  });
  logger.info(`Serving static files from: ${staticPath}`);
}
function log(message, type = "info") {
  logger[type](message);
}

// server/index.ts
init_security();
init_logger();

// server/monitoring.ts
init_logger();
import { readFileSync } from "fs";
import { join as join4, dirname } from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var packageJson = JSON.parse(
  readFileSync(join4(__dirname, "../package.json"), "utf-8")
);
var APP_VERSION = packageJson.version;
var healthCheck = async (req, res) => {
  const startTime = Date.now();
  try {
    let dbStatus = "connected";
    try {
      const { pool: pool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await Promise.race([
        pool2.query("SELECT 1"),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Database query timeout")), 5e3)
        )
      ]);
    } catch (error) {
      dbStatus = "error";
      logger.error("Database health check failed", { error: error instanceof Error ? error.message : "Unknown error" });
    }
    let redisHealth;
    try {
      const { getRedisHealth: getRedisHealth2 } = await Promise.resolve().then(() => (init_security(), security_exports));
      redisHealth = await getRedisHealth2();
    } catch (error) {
      redisHealth = {
        connected: false,
        type: "memory",
        error: error instanceof Error ? error.message : "Unknown error"
      };
      logger.error("Redis health check failed", { error: error instanceof Error ? error.message : "Unknown error" });
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
      version: APP_VERSION,
      environment: process.env.NODE_ENV || "development",
      database: dbStatus,
      redis: redisHealth,
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
    if (!res.headersSent) {
      res.status(500).json({
        status: "error",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        message: "Health check failed"
      });
    }
  }
};
var MetricsCollector = class {
  metrics = {};
  maxMetricKeys = 500;
  // Prevent unbounded growth
  lastResetTime = Date.now();
  resetIntervalMs = 24 * 60 * 60 * 1e3;
  // Reset daily
  increment(metric, value = 1) {
    if (Date.now() - this.lastResetTime > this.resetIntervalMs) {
      this.reset();
    }
    const keyCount = Object.keys(this.metrics).length;
    if (keyCount >= this.maxMetricKeys && !(metric in this.metrics)) {
      if (!this.metrics["_limit_reached"]) {
        this.metrics["_limit_reached"] = 1;
        console.warn(`MetricsCollector: Max metric keys (${this.maxMetricKeys}) reached, ignoring new keys`);
      }
      return;
    }
    this.metrics[metric] = (this.metrics[metric] || 0) + value;
  }
  getMetrics() {
    return {
      ...this.metrics,
      _keyCount: Object.keys(this.metrics).length,
      _uptimeHours: Math.round((Date.now() - this.lastResetTime) / 36e5 * 10) / 10
    };
  }
  reset() {
    this.metrics = {};
    this.lastResetTime = Date.now();
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

// server/automated-monitoring.ts
init_logger();
var AutomatedMonitoringService = class {
  isMonitoring = false;
  checkInterval = 6e4;
  // 1 minute
  intervalId;
  metrics = [];
  maxMetricsHistory = 100;
  // Thresholds for alerting
  thresholds = {
    memoryUsagePercent: 85,
    // Alert if memory usage > 85%
    avgResponseTime: 3e3,
    // Alert if avg response > 3s
    errorRate: 0.05,
    // Alert if error rate > 5%
    criticalMemory: 95,
    // Critical alert at 95%
    criticalResponseTime: 5e3
    // Critical alert at 5s
  };
  // Request tracking for metrics
  requestStats = {
    total: 0,
    errors: 0,
    responseTimes: [],
    lastReset: Date.now()
  };
  /**
   * Start automated monitoring
   */
  start() {
    if (this.isMonitoring) {
      logger.warn("Automated monitoring already running");
      return;
    }
    this.isMonitoring = true;
    logger.info("Starting automated health monitoring", {
      interval: `${this.checkInterval / 1e3}s`,
      thresholds: this.thresholds
    });
    this.performHealthCheck();
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
  }
  /**
   * Stop automated monitoring
   */
  stop() {
    if (!this.isMonitoring) {
      return;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = void 0;
    }
    this.isMonitoring = false;
    logger.info("Stopped automated health monitoring");
  }
  /**
   * Track request for metrics
   */
  trackRequest(responseTime, isError) {
    this.requestStats.total++;
    if (isError) {
      this.requestStats.errors++;
    }
    this.requestStats.responseTimes.push(responseTime);
    if (Date.now() - this.requestStats.lastReset > 6e4) {
      this.requestStats = {
        total: 0,
        errors: 0,
        responseTimes: [],
        lastReset: Date.now()
      };
    }
  }
  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    const alerts = [];
    try {
      const dbHealthy = await this.checkDatabase();
      if (!dbHealthy) {
        alerts.push({
          severity: "critical",
          message: "Database connection failed",
          timestamp: timestamp2,
          metric: "database"
        });
      }
      const memMetrics = this.checkMemory();
      if (memMetrics.usagePercent > this.thresholds.criticalMemory) {
        alerts.push({
          severity: "critical",
          message: `Critical memory usage: ${memMetrics.usagePercent}%`,
          timestamp: timestamp2,
          metric: "memory",
          value: memMetrics.usagePercent,
          threshold: this.thresholds.criticalMemory
        });
      } else if (memMetrics.usagePercent > this.thresholds.memoryUsagePercent) {
        alerts.push({
          severity: "warning",
          message: `High memory usage: ${memMetrics.usagePercent}%`,
          timestamp: timestamp2,
          metric: "memory",
          value: memMetrics.usagePercent,
          threshold: this.thresholds.memoryUsagePercent
        });
      }
      const avgResponseTime = this.calculateAverageResponseTime();
      if (avgResponseTime > this.thresholds.criticalResponseTime) {
        alerts.push({
          severity: "critical",
          message: `Critical response time: ${avgResponseTime}ms`,
          timestamp: timestamp2,
          metric: "responseTime",
          value: avgResponseTime,
          threshold: this.thresholds.criticalResponseTime
        });
      } else if (avgResponseTime > this.thresholds.avgResponseTime) {
        alerts.push({
          severity: "warning",
          message: `Slow response time: ${avgResponseTime}ms`,
          timestamp: timestamp2,
          metric: "responseTime",
          value: avgResponseTime,
          threshold: this.thresholds.avgResponseTime
        });
      }
      const errorRate = this.calculateErrorRate();
      if (errorRate > this.thresholds.errorRate) {
        alerts.push({
          severity: "critical",
          message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
          timestamp: timestamp2,
          metric: "errorRate",
          value: errorRate,
          threshold: this.thresholds.errorRate
        });
      }
      const criticalAlerts = alerts.filter((a) => a.severity === "critical");
      const status = criticalAlerts.length > 0 ? "critical" : alerts.length > 0 ? "degraded" : "healthy";
      const healthMetrics = {
        timestamp: timestamp2,
        status,
        checks: {
          database: dbHealthy,
          memory: memMetrics.usagePercent < this.thresholds.memoryUsagePercent,
          responseTime: avgResponseTime < this.thresholds.avgResponseTime,
          errorRate: errorRate < this.thresholds.errorRate
        },
        metrics: {
          memoryUsagePercent: memMetrics.usagePercent,
          avgResponseTime,
          errorRate,
          requestsPerMinute: this.requestStats.total
        },
        alerts
      };
      this.metrics.push(healthMetrics);
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics.shift();
      }
      if (status === "healthy") {
        logger.info("Health check passed", {
          status,
          metrics: healthMetrics.metrics
        });
      } else {
        logger.warn(`Health check ${status}`, {
          status,
          metrics: healthMetrics.metrics,
          alerts
        });
        await this.attemptRecovery(alerts);
      }
    } catch (error) {
      logger.error("Health check execution failed", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Check database connectivity with timeout
   */
  async checkDatabase() {
    try {
      const { pool: pool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await Promise.race([
        pool2.query("SELECT 1"),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Database query timeout")), 5e3)
        )
      ]);
      return true;
    } catch (error) {
      logger.error("Database health check failed", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return false;
    }
  }
  /**
   * Check memory usage
   */
  checkMemory() {
    const memUsage = process.memoryUsage();
    const used = Math.round(memUsage.heapUsed / 1024 / 1024);
    const total = Math.round(memUsage.heapTotal / 1024 / 1024);
    const usagePercent = Math.round(memUsage.heapUsed / memUsage.heapTotal * 100);
    return { usagePercent, used, total };
  }
  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    if (this.requestStats.responseTimes.length === 0) {
      return 0;
    }
    const sum = this.requestStats.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.requestStats.responseTimes.length);
  }
  /**
   * Calculate error rate
   */
  calculateErrorRate() {
    if (this.requestStats.total === 0) {
      return 0;
    }
    return this.requestStats.errors / this.requestStats.total;
  }
  /**
   * Attempt automatic recovery for certain issues
   */
  async attemptRecovery(alerts) {
    for (const alert of alerts) {
      switch (alert.metric) {
        case "memory":
          if (alert.severity === "critical" && global.gc) {
            logger.info("Attempting garbage collection due to critical memory usage");
            global.gc();
          }
          break;
        case "database":
          logger.error("Database connection recovery needed - manual intervention required");
          break;
        default:
          logger.warn("Alert requires monitoring", { alert });
      }
    }
  }
  /**
   * Get current health status
   */
  getCurrentHealth() {
    return this.metrics[this.metrics.length - 1] || null;
  }
  /**
   * Get health history
   */
  getHealthHistory(limit = 20) {
    return this.metrics.slice(-limit);
  }
  /**
   * Get active alerts
   */
  getActiveAlerts() {
    const current = this.getCurrentHealth();
    return current?.alerts || [];
  }
};
var automatedMonitoring = new AutomatedMonitoringService();
if (process.env.NODE_ENV === "production") {
  automatedMonitoring.start();
}

// server/cache.ts
init_logger();
var APICache = class {
  cache = /* @__PURE__ */ new Map();
  maxSize = 1e3;
  // Maximum number of cached entries
  cleanupInterval = 6e4;
  // Cleanup expired entries every minute
  constructor() {
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
    if (keysToDelete.length > 0) {
      logger.debug("Cache cleanup completed", { deletedCount: keysToDelete.length, remainingSize: this.cache.size });
    }
  }
  getCacheKey(req) {
    const url = req.originalUrl || req.url;
    const method = req.method;
    const queryString = new URLSearchParams(req.query).toString();
    const key = method === "GET" ? `${method}:${url}:${queryString}` : `${method}:${url}`;
    return key;
  }
  // Expose getCacheKey for middleware use
  static getCacheKeyForRequest(req) {
    const url = req.originalUrl || req.url;
    const method = req.method;
    const queryString = new URLSearchParams(req.query).toString();
    return method === "GET" ? `${method}:${url}:${queryString}` : `${method}:${url}`;
  }
  shouldCacheRequest(req) {
    if (req.method !== "GET") return false;
    if (req.headers["cache-control"] === "no-cache") return false;
    const noCachePatterns = [
      "/api/admin/",
      "/health",
      "/metrics"
    ];
    return !noCachePatterns.some((pattern) => req.path.includes(pattern));
  }
  getCacheTTL(req) {
    const path6 = req.path;
    if (path6.includes("/api/inspections") || path6.includes("/api/custodial-notes")) {
      return 6e4;
    } else if (path6.includes("/api/scores")) {
      return 3e5;
    } else if (path6.includes("/api/monthly-feedback")) {
      return 12e4;
    } else if (path6.startsWith("/api/")) {
      return 6e4;
    } else {
      return 3e5;
    }
  }
  get(req) {
    const key = this.getCacheKey(req);
    const entry = this.cache.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    logger.debug("Cache hit", { key, path: req.path });
    return entry.data;
  }
  set(req, res, data) {
    if (!this.shouldCacheRequest(req)) return;
    const key = this.getCacheKey(req);
    const ttl = this.getCacheTTL(req);
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    const headers = {};
    const relevantHeaders = ["content-type", "etag", "last-modified"];
    relevantHeaders.forEach((header) => {
      const value = res.getHeader(header);
      if (value) {
        headers[header] = Array.isArray(value) ? value.join(", ") : String(value);
      }
    });
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      headers
    });
    logger.debug("Cache set", { key, path: req.path, ttl });
  }
  invalidate(pattern) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
    logger.info("Cache invalidated", { pattern, deletedCount: keysToDelete.length });
  }
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalSize++;
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    }
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredCount,
      totalSize,
      hitRate: this.getHitRate()
    };
  }
  hitRate = 0;
  totalRequests = 0;
  hits = 0;
  recordRequest(hit) {
    this.totalRequests++;
    if (hit) this.hits++;
    this.hitRate = this.totalRequests > 0 ? this.hits / this.totalRequests * 100 : 0;
  }
  getHitRate() {
    return this.hitRate;
  }
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.totalRequests = 0;
    this.hitRate = 0;
    logger.info("Cache cleared");
  }
};
var apiCache = new APICache();
var cacheMiddleware = (req, res, next) => {
  if (req.method === "GET") {
    const cachedData = apiCache.get(req);
    if (cachedData !== null) {
      apiCache.recordRequest(true);
      res.set("X-Cache", "HIT");
      res.set("X-Cache-Hit-Rate", `${apiCache.getHitRate().toFixed(1)}%`);
      const cacheKey = apiCache.getCacheKey ? apiCache.getCacheKey(req) : null;
      if (cacheKey) {
        res.set("Content-Type", "application/json");
      }
      return res.json(cachedData);
    }
  }
  apiCache.recordRequest(false);
  res.set("X-Cache", "MISS");
  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      apiCache.set(req, res, data);
    }
    return originalJson.call(this, data);
  };
  next();
};
var invalidateCache = (patterns) => {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach((pattern) => apiCache.invalidate(pattern));
      }
      return originalSend.call(this, data);
    };
    next();
  };
};
var performanceMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const originalWriteHead = res.writeHead;
  res.writeHead = function(...args) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6;
    try {
      if (!res.headersSent) {
        res.setHeader("X-Response-Time", `${duration.toFixed(2)}ms`);
      }
    } catch (err) {
    }
    return originalWriteHead.apply(res, args);
  };
  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6;
    if (duration > 1e3) {
      logger.warn("Slow request detected", {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }
    logger.debug("Request completed", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress
    });
  });
  next();
};
var memoryMonitoring = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
  if (heapUsedMB > 500) {
    logger.warn("High memory usage detected", {
      heapUsed: `${heapUsedMB.toFixed(2)}MB`,
      heapTotal: `${heapTotalMB.toFixed(2)}MB`,
      external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
      path: req.path
    });
  }
  res.set("X-Memory-Used", `${heapUsedMB.toFixed(2)}MB`);
  res.set("X-Memory-Total", `${heapTotalMB.toFixed(2)}MB`);
  next();
};
var pendingRequests = /* @__PURE__ */ new Map();
var requestDeduplication = (req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }
  const key = `${req.method}:${req.originalUrl}`;
  const existingRequest = pendingRequests.get(key);
  if (existingRequest) {
    logger.debug("Request deduplication: merging identical request", { key });
    existingRequest.then((data) => {
      res.set("X-Deduplicated", "true");
      res.json(data);
    }).catch((error) => {
      next(error);
    });
    return;
  }
  const requestPromise = new Promise((resolve2, reject) => {
    const originalJson = res.json;
    const originalSend = res.send;
    res.json = function(data) {
      resolve2(data);
      return originalJson.call(this, data);
    };
    res.send = function(data) {
      resolve2(data);
      return originalSend.call(this, data);
    };
    res.on("error", reject);
  });
  pendingRequests.set(key, requestPromise);
  res.on("finish", () => {
    pendingRequests.delete(key);
  });
  res.on("error", () => {
    pendingRequests.delete(key);
  });
  next();
};

// server/performanceErrorHandler.ts
init_logger();
var EnhancedError = class extends Error {
  statusCode;
  code;
  context;
  isOperational;
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", context, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.context = {
      timestamp: Date.now(),
      ...context
    };
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
};
var performanceErrorHandler = (error, req, res, next) => {
  const startTime = process.hrtime.bigint();
  if (!error.context) {
    error.context = { timestamp: Date.now() };
  }
  error.context = {
    ...error.context,
    requestId: req.requestId,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
    method: req.method,
    url: req.originalUrl || req.url
  };
  const duration = Number(process.hrtime.bigint() - startTime) / 1e6;
  const errorLog = {
    errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    context: error.context,
    stack: error.stack,
    duration: `${duration.toFixed(2)}ms`,
    // Include performance metrics
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };
  logger.error("Performance error occurred", errorLog);
  metricsCollector.increment("errors_total");
  metricsCollector.increment(`errors_${error.statusCode}`);
  metricsCollector.increment(`errors_${error.code}`);
  const errorResponse = {
    success: false,
    error: {
      id: errorLog.errorId,
      code: error.code,
      message: getErrorMessage(error),
      ...process.env.NODE_ENV === "development" && {
        stack: error.stack,
        context: error.context
      }
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    // Add performance headers
    "X-Error-Duration": `${duration.toFixed(2)}ms`
  };
  if (!res.headersSent) {
    res.set({
      "X-Error-Id": errorLog.errorId,
      "X-Error-Code": error.code,
      "X-Content-Type-Options": "nosniff"
    });
    res.status(error.statusCode).json(errorResponse);
  } else {
    logger.warn("Headers already sent in performance error handler", {
      errorId: errorLog.errorId,
      statusCode: error.statusCode,
      path: req.path
    });
  }
};
function getErrorMessage(error) {
  if (process.env.NODE_ENV === "production") {
    if (error.statusCode >= 500) {
      return "Internal server error";
    }
  }
  return error.message || "An unexpected error occurred";
}
var errorRecoveryMiddleware = (req, res, next) => {
  if (!res.headersSent) {
    res.set({
      "X-Retry-After": "5",
      // Suggest retry after 5 seconds
      "X-Error-Recovery": "true"
    });
  }
  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode >= 400 && !res.headersSent) {
      if (data && typeof data === "object") {
        data.recovery = {
          retryAfter: 5,
          canRetry: res.statusCode < 500,
          maxRetries: 3
        };
      }
    }
    return originalJson.call(this, data);
  };
  next();
};
var gracefulDegradation = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const memoryPressure = memUsage.heapUsed / memUsage.heapTotal;
  if (memoryPressure > 0.9) {
    logger.warn("High memory pressure detected, enabling graceful degradation", {
      memoryPressure: `${(memoryPressure * 100).toFixed(1)}%`,
      path: req.path
    });
    if (!res.headersSent) {
      res.set("X-Graceful-Degradation", "true");
    }
    if (req.path.startsWith("/api/") && !req.path.includes("/admin/")) {
      req.query.simplified = "true";
    }
  }
  next();
};
var CircuitBreaker = class {
  failures = 0;
  lastFailureTime = 0;
  state = "CLOSED";
  threshold;
  timeout;
  resetTimeout;
  constructor(threshold = 5, timeout = 6e4, resetTimeout = 3e4) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
  }
  async execute(operation, context) {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "HALF_OPEN";
        logger.info("Circuit breaker entering HALF_OPEN state", { context });
      } else {
        throw new EnhancedError(
          "Service temporarily unavailable",
          503,
          "CIRCUIT_BREAKER_OPEN",
          { context, state: this.state }
        );
      }
    }
    try {
      const result = await operation();
      if (this.state === "HALF_OPEN") {
        this.reset();
        logger.info("Circuit breaker reset to CLOSED state", { context });
      }
      return result;
    } catch (error) {
      this.recordFailure(context);
      throw error;
    }
  }
  recordFailure(context) {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = "OPEN";
      logger.warn("Circuit breaker opened", {
        failures: this.failures,
        threshold: this.threshold,
        context
      });
    }
  }
  reset() {
    this.failures = 0;
    this.state = "CLOSED";
  }
  getState() {
    return this.state;
  }
  getFailures() {
    return this.failures;
  }
};
var databaseCircuitBreaker = new CircuitBreaker(5, 6e4, 3e4);
var cacheCircuitBreaker = new CircuitBreaker(10, 3e4, 1e4);
var fileUploadCircuitBreaker = new CircuitBreaker(3, 12e4, 6e4);
var circuitBreakerMiddleware = (circuitBreaker, operation) => {
  return (req, res, next) => {
    if (!res.headersSent) {
      res.set("X-Circuit-Breaker-Status", circuitBreaker.getState());
      res.set("X-Circuit-Breaker-Failures", circuitBreaker.getFailures().toString());
    }
    next();
  };
};

// server/csrf.ts
init_logger();
import { randomBytes as randomBytes2, createHash as createHash2 } from "crypto";
var CSRF_TOKEN_LENGTH = 32;
var CSRF_SECRET_LENGTH = 32;
var CSRF_HEADER_NAME = "x-csrf-token";
var CSRF_COOKIE_NAME = "csrf-secret";
var CSRF_TOKEN_TTL = 24 * 60 * 60 * 1e3;
var tokenStore = /* @__PURE__ */ new Map();
function generateCsrfToken() {
  const secret = randomBytes2(CSRF_SECRET_LENGTH).toString("hex");
  const token = randomBytes2(CSRF_TOKEN_LENGTH).toString("hex");
  return { token, secret };
}
function hashToken(token, secret) {
  return createHash2("sha256").update(`${token}:${secret}`).digest("hex");
}
function verifyCsrfToken(token, secret, storedHash) {
  const hash = hashToken(token, secret);
  return hash === storedHash;
}
function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  if (req.path.startsWith("/health") || req.path.startsWith("/metrics")) {
    return next();
  }
  if (req.path.includes("/admin/") || req.path === "/admin/login") {
    logger.debug("Skipping CSRF for admin authentication", { path: req.path });
    return next();
  }
  try {
    const secret = req.cookies?.[CSRF_COOKIE_NAME];
    if (!secret) {
      logger.warn("CSRF validation failed: No secret cookie", {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(403).json({
        error: "CSRF token missing",
        message: "Please refresh the page and try again"
      });
    }
    const token = req.headers[CSRF_HEADER_NAME] || req.body?._csrf;
    if (!token) {
      logger.warn("CSRF validation failed: No token provided", {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(403).json({
        error: "CSRF token missing",
        message: "Please include CSRF token in request"
      });
    }
    const storedData = tokenStore.get(secret);
    if (!storedData) {
      logger.warn("CSRF validation failed: Token not found or expired", {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(403).json({
        error: "CSRF token invalid or expired",
        message: "Please refresh the page and try again"
      });
    }
    if (Date.now() > storedData.expires) {
      tokenStore.delete(secret);
      logger.warn("CSRF validation failed: Token expired", {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(403).json({
        error: "CSRF token expired",
        message: "Please refresh the page and try again"
      });
    }
    if (!verifyCsrfToken(token, secret, storedData.token)) {
      logger.warn("CSRF validation failed: Invalid token", {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(403).json({
        error: "CSRF token invalid",
        message: "Security validation failed"
      });
    }
    logger.debug("CSRF token validated successfully", {
      path: req.path,
      method: req.method
    });
    next();
  } catch (error) {
    logger.error("CSRF validation error", {
      error: error instanceof Error ? error.message : "Unknown error",
      path: req.path,
      method: req.method
    });
    return res.status(500).json({
      error: "CSRF validation failed",
      message: "An error occurred during security validation"
    });
  }
}
function generateToken(req, res) {
  const { token, secret } = generateCsrfToken();
  const hashedToken = hashToken(token, secret);
  tokenStore.set(secret, {
    token: hashedToken,
    expires: Date.now() + CSRF_TOKEN_TTL
  });
  res.cookie(CSRF_COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_TOKEN_TTL
  });
  logger.debug("CSRF token generated", { ip: req.ip });
  return { token, secret };
}
function getCsrfToken(req, res) {
  try {
    const { token } = generateToken(req, res);
    res.json({
      csrfToken: token,
      expiresIn: CSRF_TOKEN_TTL / 1e3
      // seconds
    });
  } catch (error) {
    logger.error("Failed to generate CSRF token", {
      error: error instanceof Error ? error.message : "Unknown error",
      ip: req.ip
    });
    res.status(500).json({
      error: "Failed to generate CSRF token"
    });
  }
}
function cleanupExpiredTokens() {
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
setInterval(cleanupExpiredTokens, 15 * 60 * 1e3);
function getCsrfStats() {
  return {
    activeTokens: tokenStore.size,
    headerName: CSRF_HEADER_NAME,
    cookieName: CSRF_COOKIE_NAME
  };
}

// server/index.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var packageJson2 = JSON.parse(
  readFileSync2(join5(__dirname2, "../package.json"), "utf-8")
);
var APP_VERSION2 = packageJson2.version;
var app = express3();
if (process.env.REPL_SLUG) {
  app.set("trust proxy", 1);
} else {
  app.set("trust proxy", false);
}
app.use(requestIdMiddleware);
app.use(performanceMiddleware);
app.use(memoryMonitoring);
app.use(metricsMiddleware);
app.use((req, res, next) => {
  if (!req.path.startsWith("/health")) {
    req.setTimeout(12e4, () => {
      logger.warn("Request timeout", { path: req.path, method: req.method });
      if (!res.headersSent) {
        res.status(408).json({ error: "Request timeout" });
      }
    });
    res.setTimeout(12e4, () => {
      logger.warn("Response timeout", { path: req.path, method: req.method });
    });
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    automatedMonitoring.trackRequest(duration, isError);
  });
  next();
});
app.use(gracefulDegradation);
app.use(errorRecoveryMiddleware);
app.use(requestDeduplication);
app.use(helmet({
  // Content Security Policy - disabled for development to allow inline styles
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      // FIXED: Added 'unsafe-inline' for Vite compatibility
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
  // Don't infer MIME type
  noSniff: true,
  // X-Frame-Options - already set in securityHeaders but keeping for consistency
  frameguard: { action: "deny" },
  // X-XSS-Protection - already set in securityHeaders but keeping for consistency
  xssFilter: true
}));
app.use(compression({
  // Enhanced compression settings
  level: 6,
  // Compression level (1-9, 6 is default)
  threshold: 1024,
  // Only compress responses larger than 1KB
  chunkSize: 16 * 1024,
  // 16KB chunks for better compression
  windowBits: 15,
  memLevel: 8,
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
app.use(cookieParser());
app.use(cacheMiddleware);
app.use("/api/admin/login", strictRateLimit);
app.use("/api/inspections", apiRateLimit);
app.use("/api/custodial-notes", apiRateLimit);
app.use("/api/monthly-feedback", apiRateLimit);
app.use("/api", apiRateLimit);
app.use("/api/inspections", invalidateCache(["inspections", "scores"]));
app.use("/api/custodial-notes", invalidateCache(["custodialNotes", "scores"]));
app.use("/api/monthly-feedback", invalidateCache(["monthlyFeedback"]));
app.use("/api/inspections", circuitBreakerMiddleware(databaseCircuitBreaker, "inspections"));
app.use("/api/custodial-notes", circuitBreakerMiddleware(databaseCircuitBreaker, "custodial-notes"));
app.use("/api/monthly-feedback", circuitBreakerMiddleware(fileUploadCircuitBreaker, "monthly-feedback"));
app.use("/api/scores", circuitBreakerMiddleware(cacheCircuitBreaker, "scores"));
app.use("/api", (req, res, next) => {
  try {
    const contentType = req.headers["content-type"];
    const accept = req.headers["accept"];
    const contentLength = req.headers["content-length"];
    const path6 = req.path;
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
    log(`API REQ ${method} ${path6} ct=${contentType || "n/a"} accept=${accept || "n/a"} len=${contentLength || "n/a"} :: ${JSON.stringify(bodyPreview || {})}`);
  } catch {
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
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
    const originalWriteHead = res.writeHead;
    res.writeHead = function(...args) {
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
          if (!res.headersSent) {
            res.setHeader("Content-Security-Policy", newVal);
          }
        }
      } catch (err) {
      }
      return originalWriteHead.apply(res, args);
    };
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
    const requiredEnvVars = ["DATABASE_URL", "SESSION_SECRET"];
    const requiredProdEnvVars = process.env.NODE_ENV === "production" ? ["ADMIN_USERNAME", "ADMIN_PASSWORD_HASH"] : [];
    const allRequiredVars = [...requiredEnvVars, ...requiredProdEnvVars];
    const missingEnvVars = allRequiredVars.filter((varName) => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      logger.error("Missing required environment variables", {
        missing: missingEnvVars,
        environment: process.env.NODE_ENV || "development"
      });
      if (missingEnvVars.includes("SESSION_SECRET")) {
        logger.error("SESSION_SECRET is required. Generate one with: openssl rand -hex 32");
      }
      if (missingEnvVars.includes("ADMIN_PASSWORD_HASH")) {
        logger.error("ADMIN_PASSWORD_HASH is required for production. Hash a password using bcrypt.");
      }
      process.exit(1);
    }
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
      logger.error("SESSION_SECRET must be at least 32 characters long");
      process.exit(1);
    }
    try {
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await db2.execute("SELECT 1");
      logger.info("Database connection successful");
      automatedMonitoring.start();
      logger.info("Automated health monitoring started");
    } catch (error) {
      logger.error("Database connection failed", { error: error instanceof Error ? error.message : "Unknown error" });
      process.exit(1);
    }
    app.get("/health", healthCheckRateLimit, async (req, res) => {
      try {
        if (process.env.RAILWAY_SERVICE_ID && !res.headersSent) {
          res.set("X-Railway-Service-ID", process.env.RAILWAY_SERVICE_ID);
          res.set("X-Railway-Environment", process.env.RAILWAY_ENVIRONMENT || "production");
        }
        await Promise.race([
          healthCheck(req, res),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Health check timeout")), 3e4)
          )
        ]);
      } catch (error) {
        logger.error("Health check failed", { error: error instanceof Error ? error.message : "Unknown error" });
        if (!res.headersSent) {
          res.status(503).json({
            status: "error",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            uptime: process.uptime(),
            error: "Health check failed"
          });
        }
      }
    });
    app.get("/metrics", healthCheckRateLimit, (req, res) => {
      try {
        const metrics = metricsCollector.getMetrics();
        metrics.railway = {
          serviceId: process.env.RAILWAY_SERVICE_ID,
          environment: process.env.RAILWAY_ENVIRONMENT,
          region: process.env.RAILWAY_REGION,
          projectId: process.env.RAILWAY_PROJECT_ID
        };
        res.json(metrics);
      } catch (error) {
        logger.error("Metrics endpoint failed", { error });
        res.status(500).json({ error: "Failed to fetch metrics" });
      }
    });
    app.get("/health/metrics", healthCheckRateLimit, (req, res) => {
      try {
        const currentHealth = automatedMonitoring.getCurrentHealth();
        if (!currentHealth) {
          return res.status(503).json({
            status: "initializing",
            message: "Monitoring system is initializing"
          });
        }
        res.json(currentHealth);
      } catch (error) {
        logger.error("Health metrics endpoint failed", { error });
        res.status(500).json({ error: "Failed to fetch health metrics" });
      }
    });
    app.get("/health/history", healthCheckRateLimit, (req, res) => {
      try {
        const limit = parseInt(req.query.limit || "20", 10);
        const history = automatedMonitoring.getHealthHistory(limit);
        res.json({
          count: history.length,
          history
        });
      } catch (error) {
        logger.error("Health history endpoint failed", { error });
        res.status(500).json({ error: "Failed to fetch health history" });
      }
    });
    app.get("/health/alerts", healthCheckRateLimit, (req, res) => {
      try {
        const alerts = automatedMonitoring.getActiveAlerts();
        res.json({
          count: alerts.length,
          alerts
        });
      } catch (error) {
        logger.error("Health alerts endpoint failed", { error });
        res.status(500).json({ error: "Failed to fetch alerts" });
      }
    });
    app.get("/api/performance/stats", async (req, res) => {
      try {
        const storageMetrics = await storage.getPerformanceMetrics();
        const cacheStats = apiCache.getStats();
        const memUsage = process.memoryUsage();
        res.json({
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          uptime: process.uptime(),
          memory: {
            heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
            heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
            external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
            rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`
          },
          storage: storageMetrics,
          cache: cacheStats,
          database: {
            connected: true
            // We'll add more detailed DB stats later
          }
        });
      } catch (error) {
        logger.error("Error fetching performance stats", { error });
        res.status(500).json({ error: "Failed to fetch performance stats" });
      }
    });
    app.post("/api/performance/clear-cache", (req, res) => {
      try {
        const { pattern } = req.body;
        if (pattern) {
          storage.clearCache(pattern);
          apiCache.invalidate(pattern);
          res.json({ message: `Cache cleared for pattern: ${pattern}` });
        } else {
          storage.clearCache();
          apiCache.clear();
          res.json({ message: "All caches cleared" });
        }
      } catch (error) {
        logger.error("Error clearing cache", { error });
        res.status(500).json({ error: "Failed to clear cache" });
      }
    });
    app.post("/api/performance/warm-cache", async (req, res) => {
      try {
        await storage.warmCache();
        res.json({ message: "Cache warming completed" });
      } catch (error) {
        logger.error("Error warming cache", { error });
        res.status(500).json({ error: "Failed to warm cache" });
      }
    });
    logger.info("Health check and performance endpoints configured");
    app.get("/api/csrf-token", getCsrfToken);
    logger.info("CSRF token endpoint configured");
    app.use("/api", csrfProtection);
    logger.info("CSRF protection enabled for API routes");
    app.get("/api/csrf-stats", (req, res) => {
      try {
        res.json(getCsrfStats());
      } catch (error) {
        logger.error("Failed to get CSRF stats", { error });
        res.status(500).json({ error: "Failed to get CSRF stats" });
      }
    });
    await registerRoutes(app);
    logger.info("Routes registered successfully");
    serveStatic(app);
    logger.info("Static file serving configured");
    app.use(performanceErrorHandler);
    const server = createServer(app);
    logger.info("HTTP server created");
    async function initializeDatabase2() {
      try {
        const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        await db2.execute("SELECT 1");
        logger.info("Database connection successful");
      } catch (error) {
        logger.error("Database connection failed", { error: error instanceof Error ? error.message : "Unknown error" });
        if (process.env.NODE_ENV === "production") {
          logger.warn("Continuing startup despite database connection failure (production mode)");
        } else {
          throw error;
        }
      }
    }
    await initializeDatabase2();
    const PORT = parseInt(process.env.PORT || "5000", 10);
    const HOST = "0.0.0.0";
    logger.info(`About to listen on port ${PORT}...`);
    server.listen(PORT, HOST, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || "development",
        version: APP_VERSION2
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
