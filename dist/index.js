var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

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
      isCompleted: z.boolean().optional().default(false)
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
  db: () => db,
  pool: () => pool
});
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    if (typeof WebSocket === "undefined") {
      neonConfig.webSocketConstructor = ws;
    }
    neonConfig.poolQueryViaFetch = true;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Check your Replit Secrets tab."
      );
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: process.env.NODE_ENV === "production" ? 3 : 1,
      idleTimeoutMillis: 6e4,
      // Longer for Replit
      connectionTimeoutMillis: 15e3
      // Longer timeout for Replit
    });
    db = drizzle({ client: pool, schema: schema_exports });
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

// server/monitoring.ts
var monitoring_exports = {};
__export(monitoring_exports, {
  errorHandler: () => errorHandler,
  healthCheck: () => healthCheck,
  metricsCollector: () => metricsCollector,
  metricsMiddleware: () => metricsMiddleware,
  performanceMonitor: () => performanceMonitor
});
var performanceMonitor, healthCheck, errorHandler, MetricsCollector, metricsCollector, metricsMiddleware;
var init_monitoring = __esm({
  "server/monitoring.ts"() {
    "use strict";
    init_logger();
    performanceMonitor = (req, res, next) => {
      const start2 = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start2;
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
    healthCheck = async (req, res) => {
      const startTime = Date.now();
      try {
        let dbStatus = "connected";
        try {
          const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
          if (dbModule.pool) {
            await dbModule.pool.query("SELECT 1");
          } else {
            throw new Error("Database pool not available");
          }
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
    errorHandler = (error, req, res, next) => {
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
    MetricsCollector = class {
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
    metricsCollector = new MetricsCollector();
    metricsMiddleware = (req, res, next) => {
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
  }
});

// server/index.ts
import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import helmet from "helmet";
import http from "node:http";

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
    try {
      const [result] = await db.insert(inspections).values(insertInspection).returning();
      return result;
    } catch (error) {
      console.error("Database error creating inspection:", error);
      throw new Error(`Failed to create inspection: ${error instanceof Error ? error.message : "Unknown database error"}`);
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

// shared/custodial-criteria.ts
var ratingDescriptions = [
  { stars: 1, label: "Unkempt Neglect", description: "Crisis" },
  { stars: 2, label: "Moderate Dinginess", description: "Reactive" },
  { stars: 3, label: "Casual Inattention", description: "Managed Care" },
  { stars: 4, label: "Ordinary Tidiness", description: "Comprehensive Care" },
  { stars: 5, label: "Orderly Spotlessness", description: "Showpiece Facility" }
];
var inspectionCategories = [
  {
    key: "floors",
    label: "Floors",
    criteria: {
      5: "Floors and base moldings shine and/or are bright and clean; colors are fresh. No dirt buildup in corners or along walls.",
      4: "Floors and base moldings shine and/or are bright and clean. There is no buildup in corners along walls, but there can be up to two days' worth of dust, dirt, stains, or streaks.",
      3: "Floors are swept or vacuumed clean, but upon close observation there can be stains. A buildup of dirt and/or floor finish in corners and along walls can be seen. There are dull spots and/or matted carpet in walking lanes. Base molding is dull and dingy with streaks or splashes.",
      2: "Floors are swept or vacuumed clean, but are dull, dingy, and stained. There is an obvious buildup of dirt and/or floor finish in corners and along walls. There is a dull path and/or obviously matted carpet in the walking lanes. Base molding is dull and dingy with streaks or splashes.",
      1: "Floors and carpet are dull, dirty, dingy, scuffed, and/or matted. There is a conspicuous buildup of old dirt and/or floor finish in corners and along walls. Base molding is dirty, stained, and streaked. Gum, stains, dirt, dust balls, and trash are broadcast."
    }
  },
  {
    key: "verticalHorizontalSurfaces",
    label: "Vertical and Horizontal Surfaces",
    criteria: {
      5: "All vertical and horizontal surfaces have a freshly cleaned or polished appearance and have no accumulation of dust, dirt, marks, streaks, smudges, or fingerprints. Windows, glass, sills, frames, and related surfaces are free of dust, smudges, fingerprints etc.",
      4: "All vertical and horizontal surfaces are clean, but marks, dust, smudges, and fingerprints are noticeable upon close observation. Windows appear clean, but on close inspection marks, dust, cobwebs may be found. Sills and frames may have visible dust, dirt, or cobwebs on them.",
      3: "All vertical and horizontal surfaces have obvious dust, dirt, marks, smudges, and fingerprints. Windows frames are dusty and dirty, window glass is acceptable but it is obvious they have not been cleaned.",
      2: "All vertical and horizontal surfaces have conspicuous dust, dirt, smudges, fingerprints, and marks. At a quick glance windows are visibly dirty.",
      1: "All vertical and horizontal surfaces have major accumulations of dust, dirt, smudges, and fingerprints, all of which will be difficult to remove. Lack of attention is obvious. Window glass has obvious smudges, dirt, and marks. Frames are visibly dirty, dusty, and cobwebs are appearing."
    }
  },
  {
    key: "ceiling",
    label: "Ceiling",
    criteria: {
      5: "Ceilings and air vents are clean and free of dust/debris including cobwebs. No deficiencies.",
      4: "Ceilings and air vents are clean but dust/debris/cobwebs are noticeable upon close inspection.",
      3: "Ceilings and air vents have obvious dust/debris/cobwebs.",
      2: "Ceilings and air vents have conspicuous dust/debris/cobwebs.",
      1: "Ceilings and air vents have major accumulation of dust/debris/cobwebs."
    }
  },
  {
    key: "restrooms",
    label: "Restrooms",
    criteria: {
      5: "Consistent Monitoring: Restrooms must be regularly checked for use and cleanliness. Stocked and Maintained: Supplies (soap, paper products, etc.) must be fully stocked at all times. Spotless and Polished: Surfaces must be free of dirt, smudges, and water stains, with polished fixtures and mirrors. Graffiti-Free: No graffiti or defacement is present. Pleasant Odor: Restrooms must have a fresh, pleasant scent with no unpleasant odors.",
      4: "Routine Monitoring: Restrooms are checked regularly but may have minor lapses between inspections. Adequately Stocked: Supplies are generally available, though occasional low stock may occur. Clean but Lived-In: Surfaces are mostly clean, but minor smudges, water spots, or streaks may be present. Graffiti-Free: No significant graffiti, though faint markings or minor blemishes may be visible. Neutral Odor: The restroom has no strong odors\u2014neither noticeably fresh nor unpleasant.",
      3: "Infrequent Monitoring: Restrooms are checked sporadically, leading to noticeable gaps in maintenance. Partially Stocked: Supplies are inconsistent\u2014some items may be low or temporarily unavailable. Visible Wear: Surfaces show clear signs of use, including smudges, water spots, and minor grime. Minor Graffiti: Small or faint graffiti, scratches, or markings are present but not overwhelming. Slight Odor: A faint but noticeable stale or musty odor may be present, though not overpowering.",
      2: "Inconsistent Monitoring: Restrooms are rarely checked, leading to noticeable lapses in cleanliness and maintenance. Low Stock: Many supplies are missing, and those that remain are often running low. Dirty Surfaces: Surfaces show significant grime, stains, and streaks. Cleaning is overdue, and the overall appearance is visibly unkempt. Graffiti and Damage: Obvious graffiti, markings, or damage is present in several areas. Unpleasant Odor: A strong, unpleasant odor may be present, creating a noticeable discomfort for users.",
      1: "Rare or No Monitoring: Restrooms are infrequently checked or completely overlooked, leading to prolonged periods of neglect. No Stock: Essential supplies are completely absent or inadequate, with no immediate plans to restock. Filthy Surfaces: Surfaces are visibly dirty, with heavy stains, grime, and possibly mold or mildew. The overall environment is unsanitary. Extensive Graffiti and Damage: Graffiti, damage, or vandalism is widespread and has not been addressed. Strong, Offensive Odor: The restroom emits a strong, unpleasant odor, often foul, making the space uncomfortable and potentially unsanitary."
    }
  },
  {
    key: "customerSatisfaction",
    label: "Customer Satisfaction and Coordination",
    criteria: {
      5: "Proud of facilities, have a high level of trust for the custodial organization.",
      4: "Satisfied with custodial-related services, usually complimentary of custodial staff.",
      3: "Accustomed to basic level of custodial care. Generally able to perform mission duties. Lack of pride in physical environment.",
      2: "Generally critical of cost, responsiveness, and quality of custodial services.",
      1: "Consistent customer ridicule, mistrust of custodial services."
    }
  },
  {
    key: "trash",
    label: "Trash",
    criteria: {
      5: "Interior trash cans only hold daily waste, and are clean and free from odor. Dumpster area is free from litter, dumpsters are closed and if applicable after hours locked. Exterior grounds are free from litter, and exterior trash cans are well placed and maintained.",
      4: "Most interior trash cans only hold daily waste, and are largely clean and free from odor. Dumpster area is free from litter, dumpsters are closed and if applicable after hours locked. Exterior grounds have some litter but appear to be regularly tended to. Exterior trash cans are present, maintenance is frequency of emptying is unclear but acceptable.",
      3: "Interior trash is regularly cleared, some cans are ill maintained and have odor. Litter is present near dumpsters. Some litter is blowing around exterior and does not appear to be addressed on a regular basis.",
      2: "Trash containers smell, are stained and are frequently at capacity with old trash. Litter is present at dumpster area, dumpsters are poorly secured and contributing to exterior litter issues. Exterior litter is present and obvious.",
      1: "Trash containers smell, are stained and are overflowing with old trash. Dumpster areas are overflowing, litter is present near dumpsters and does not appear regularly cleaned. Exterior litter is present, and affecting the overall appearance of school."
    }
  },
  {
    key: "projectCleaning",
    label: "Project Cleaning",
    criteria: {
      5: "Break work scope is completed on time and regarded well by school based staff. Items are organized, prioritized, and presented by custodial team. Work exceeds expectations.",
      4: "Break work scope is mostly completed, however not on time and some work is shifted throughout year. Custodial team organizes most items. Work meets expectations.",
      3: "Priority break work items are completed, some are pushed to a later date. Items have been organized, prioritized, and presented by school and network. Most of the work meets expectations.",
      2: "Break work items must be requested and organized by school or network. Some items are not able to be completed. Completed work does not meet expectations.",
      1: "There are insufficient funds and staffing for project cleaning."
    }
  },
  {
    key: "activitySupport",
    label: "Activity Support",
    criteria: {
      5: "Activity (athletics, events, afterschool activities) support happens, and is planned along with the weekly routine. All comments are complimentary. Activity support compliments and does not impede regular work.",
      4: "Activity support happens, and is planned along with the weekly routine. Most comments are complimentary.",
      3: "Activity support happens, and is planned along with the weekly routine. Work at times do not meet customer expectations. Comments are generally complimentary. Activity support is at the expense of some other duties.",
      2: "Activity support happens, but staffing is not allocated. Support is done by redirecting staff away from normal custodial duties on a routine basis.",
      1: "Activity support happens ad hoc and often leads to duties not being completed."
    }
  },
  {
    key: "safetyCompliance",
    label: "Safety and Compliance",
    criteria: {
      5: "All chemicals are properly labeled, secured, and used in accordance with manufacturer instructions. Gas, propane, and highly combustible items are stored off site. Closets are organized and compliant with DHH regulations.",
      4: "Most chemicals are properly labeled, secured, and used in accordance with manufacturer instructions. Gas, propane, and highly combustible items are stored off site. Some disorganization and lack of tidiness in closets.",
      3: "Some chemicals are properly labeled, secured. Proper use of chemicals is not clear, visible misuse of chemicals such as buildup or material damage is present. Gas, propane, and highly combustible items are usually stored off site, though often after use left on campus. Closets are dirty, though organizational and safety systems appear to be present.",
      2: "Many chemicals not labeled. Proper use of chemicals is not clear, visible misuse of chemicals such as buildup or material damage is present. Gas, propane, and highly combustible items can be found on site. Closets are dirty, no apparent regular organization or safety assessment.",
      1: "Improper use and knowledge of chemicals is widespread. Closets are consistently disorganized, dirty, and lacking safety precautions. Combustible materials prohibited may be present. It is unclear if there are any organizational or safety systems in place."
    }
  },
  {
    key: "equipment",
    label: "Equipment",
    criteria: {
      5: "There is sufficient equipment, located within reasonable proximity to the responsible areas. Equipment is kept in good repair and is replaced as needed. Equipment is evaluated and optimized for the tasks at hand. Equipment is being used in facility with regularity.",
      4: "There is sufficient equipment, located within reasonable proximity to the responsible areas. Equipment is kept in good repair and is replaced as needed. Equipment is evaluated and optimized for the tasks at hand.",
      3: "There is sufficient equipment, located within reasonable proximity to the responsible areas. Equipment is replaced as needed, but may not be the optimal equipment for the tasks at hand.",
      2: "Equipment is frequently shared and transported and occasionally in disrepair, but there is a basic inventory of equipment on hand.",
      1: "There is no or minimal capital investment for custodial operations. Equipment is limited and in disrepair. Staff do not use available equipment and or not trained on operation."
    }
  },
  {
    key: "monitoring",
    label: "Monitoring",
    criteria: {
      5: "Real-Time Monitoring: A system is in place to track performance and cleanliness frequently, with some elements monitored in real time. Contract Alignment: Performance standards are fully aligned with the specifications outlined in the contract. Responsive Feedback: Feedback from schools is actively sought, quickly addressed, and incorporated into service improvements.",
      4: "Regular Monitoring: A system is in place to track performance and cleanliness at scheduled intervals, though not in real time. Contract Compliance: Performance generally aligns with contractual standards, with only occasional minor deviations. Feedback Incorporated: Feedback from schools is generally addressed in a timely manner and used to improve services.",
      3: "Periodic Monitoring: Performance is monitored intermittently, leading to some inconsistencies in cleanliness and efficiency. Partial Contract Compliance: Standards are mostly followed, but occasional oversights or delays occur. Reactive Feedback Response: Feedback from schools is addressed, but often with some delay.",
      2: "Infrequent Monitoring: Performance is rarely tracked, leading to noticeable inconsistencies. Contract Deviations: Several standards outlined in the contract are not being consistently met. Delayed Feedback Response: Feedback from schools is often ignored or addressed with significant delay.",
      1: "No Monitoring: Performance is rarely or never tracked, resulting in significant inefficiencies. Contract Non-Compliance: Most contractual standards are not being met. Disregarded Feedback: Feedback from schools is ignored or dismissed."
    }
  }
];
var custodialCriteria = {
  ratingDescriptions,
  inspectionCategories
};

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // Get private object directory for large file storage
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error("PRIVATE_OBJECT_DIR not set. Object Storage not configured.");
    }
    return dir;
  }
  // Generate upload URL for large files (up to 5GB)
  async getLargeFileUploadURL(fileExtension = "") {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fileName = `large-upload-${objectId}${fileExtension}`;
    const fullPath = `${privateObjectDir}/uploads/${fileName}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 3600
      // 1 hour for large file uploads
    });
  }
  // Upload large file directly to object storage
  async uploadLargeFile(buffer, fileName, mimeType) {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fileExtension = fileName.split(".").pop() || "";
    const storedFileName = `${objectId}.${fileExtension}`;
    const fullPath = `${privateObjectDir}/uploads/${storedFileName}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    const stream = file.createWriteStream({
      metadata: {
        contentType: mimeType,
        metadata: {
          originalName: fileName,
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      },
      resumable: true
      // Important for large files
    });
    return new Promise((resolve, reject) => {
      stream.on("error", reject);
      stream.on("finish", () => {
        resolve(`/objects/${storedFileName}`);
      });
      stream.end(buffer);
    });
  }
  // Get file from object storage
  async getObjectFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const fileName = objectPath.replace("/objects/", "");
    const privateObjectDir = this.getPrivateObjectDir();
    const fullPath = `${privateObjectDir}/uploads/${fileName}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  // Download object file
  async downloadObject(file, res) {
    try {
      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": "private, max-age=3600"
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
};
function parseObjectPath(path2) {
  if (!path2.startsWith("/")) {
    path2 = `/${path2}`;
  }
  const pathParts = path2.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return { bucketName, objectName };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to sign object URL: ${response.status}`);
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
var objectStorageService = new ObjectStorageService();

// server/routes.ts
init_schema();
import { z as z2 } from "zod";
import multer from "multer";
var asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
async function registerRoutes(app2) {
  app2.post("/api/inspections", asyncHandler(async (req, res) => {
    try {
      const validatedData = insertInspectionSchema.parse(req.body);
      const inspection = await storage.createInspection(validatedData);
      res.json(inspection);
    } catch (error) {
      console.error("Error creating inspection:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid inspection data", details: error.errors });
      } else {
        res.status(500).json({
          error: "Failed to create inspection",
          message: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "Unknown error" : void 0
        });
      }
    }
  }));
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
  app2.post("/api/custodial-notes", async (req, res) => {
    try {
      const validatedData = insertCustodialNoteSchema.parse(req.body);
      const custodialNote = await storage.createCustodialNote(validatedData);
      res.json(custodialNote);
    } catch (error) {
      console.error("Error creating custodial note:", error);
      res.status(400).json({ error: "Invalid custodial note data" });
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
      const validatedData = insertRoomInspectionSchema.parse(req.body);
      const roomInspection = await storage.createRoomInspection(validatedData);
      res.json(roomInspection);
    } catch (error) {
      console.error("Error creating room inspection:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid room inspection data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create room inspection" });
      }
    }
  });
  app2.get("/api/room-inspections", async (req, res) => {
    try {
      const buildingInspectionId = req.query.buildingInspectionId;
      if (buildingInspectionId) {
        const id = parseInt(buildingInspectionId);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid building inspection ID" });
        }
        const roomInspections2 = await storage.getRoomInspectionsByBuildingId(id);
        res.json(roomInspections2);
      } else {
        const roomInspections2 = await storage.getRoomInspections();
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
  app2.get("/api/custodial-criteria", (req, res) => {
    res.json(custodialCriteria);
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024,
      // 100MB limit per file
      files: 5,
      // Allow up to 5 files
      fieldSize: 100 * 1024 * 1024,
      // 100MB field size
      fieldNameSize: 200,
      // Field name size
      fields: 20,
      // Number of non-file fields
      parts: 500
      // Reasonable parts limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        "image/",
        "video/",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
        "application/x-zip-compressed",
        "application/octet-stream"
      ];
      const isAllowed = allowedTypes.some((type) => file.mimetype.startsWith(type));
      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error("File type not allowed. Only images, videos, PDF documents, archives, and MS Office files are permitted."));
      }
    }
  });
  app2.post("/api/large-upload/presigned", async (req, res) => {
    try {
      const { fileName, fileType } = req.body;
      if (!fileName || !fileType) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "fileName and fileType are required"
        });
      }
      const fileExtension = fileName.split(".").pop() || "";
      const uploadURL = await objectStorageService.getLargeFileUploadURL(`.${fileExtension}`);
      res.json({
        uploadURL,
        message: "Presigned URL generated for large file upload"
      });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({
        error: "Failed to generate upload URL",
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "Unknown error" : void 0
      });
    }
  });
  app2.get("/objects/:fileName", async (req, res) => {
    try {
      const { fileName } = req.params;
      const objectPath = `/objects/${fileName}`;
      const file = await objectStorageService.getObjectFile(objectPath);
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving file:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      res.status(500).json({ error: "Error serving file" });
    }
  });
  app2.post("/api/media/upload", upload.array("files", 5), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const uploadedFiles = [];
      const errors = [];
      for (const file of req.files) {
        try {
          const timestamp2 = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const fileName = `${timestamp2}-${randomSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
          console.log(`Uploading file: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          const objectPath = await objectStorageService.uploadLargeFile(file.buffer, fileName, file.mimetype);
          uploadedFiles.push({
            fileName,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            objectPath
          });
        } catch (fileError) {
          console.error(`Error uploading file ${file.originalname}:`, fileError);
          errors.push({
            fileName: file.originalname,
            error: fileError instanceof Error ? fileError.message : "Upload failed"
          });
        }
      }
      const response = {
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        files: uploadedFiles
      };
      if (errors.length > 0) {
        response.errors = errors;
        response.message += `, ${errors.length} file(s) failed`;
      }
      res.json(response);
    } catch (error) {
      console.error("Media upload error:", error);
      if (error instanceof Error) {
        if (error.message.includes("File too large")) {
          return res.status(413).json({
            error: "File too large",
            message: "Maximum file size is 100MB per file",
            maxSizeBytes: 100 * 1024 * 1024
          });
        }
        if (error.message.includes("Too many files")) {
          return res.status(413).json({
            error: "Too many files",
            message: "Maximum 5 files allowed per upload (100MB each)"
          });
        }
        if (error.message.includes("too many parts")) {
          return res.status(413).json({
            error: "Request too complex",
            message: "File upload request has too many parts"
          });
        }
      }
      res.status(500).json({
        error: "Failed to upload media files",
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "Unknown error" : void 0
      });
    }
  });
}

// server/index.ts
init_logger();
init_monitoring();
var app = express();
var isProd = process.env.NODE_ENV === "production";
var PORT = Number(process.env.PORT) || 5e3;
app.set("trust proxy", 1);
app.use(requestIdMiddleware);
app.use(performanceMonitor);
app.use(metricsMiddleware);
app.use(express.json());
if (isProd) {
  app.use(helmet());
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      hsts: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false
    })
  );
  app.use((_, res, next) => {
    res.removeHeader("X-Frame-Options");
    res.removeHeader("Strict-Transport-Security");
    res.setHeader(
      "Content-Security-Policy",
      "frame-ancestors self https://*.replit.dev https://*.repl.co https://*.replit.app"
    );
    next();
  });
}
app.get("/health", async (req, res, next) => {
  try {
    const { healthCheck: healthCheck2 } = await Promise.resolve().then(() => (init_monitoring(), monitoring_exports));
    await healthCheck2(req, res);
  } catch (error) {
    next(error);
  }
});
app.get("/metrics", (req, res) => {
  const { metricsCollector: metricsCollector2 } = (init_monitoring(), __toCommonJS(monitoring_exports));
  res.json(metricsCollector2.getMetrics());
});
async function start() {
  const requiredEnvVars = ["DATABASE_URL"];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(", ")}`);
  }
  await registerRoutes(app);
  const httpServer = http.createServer(app);
  if (!isProd) {
    const vite = await (await import("vite")).createServer({
      root: process.cwd(),
      appType: "custom",
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer
        }
      }
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let html = await fs.readFile(path.resolve(process.cwd(), "index.html"), "utf-8");
        html = await vite.transformIndexHtml(url, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const dist = path.resolve(process.cwd(), "dist");
    app.use(express.static(dist));
    app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  }
  app.use(errorHandler);
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on ${PORT} (${isProd ? "prod" : "dev + Vite middleware + HMR"})`);
  });
}
start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
