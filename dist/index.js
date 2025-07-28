var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

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
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var inspections = pgTable("inspections", {
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
var roomInspections = pgTable("room_inspections", {
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
var custodialNotes = pgTable("custodial_notes", {
  id: serial("id").primaryKey(),
  school: text("school").notNull(),
  date: text("date").notNull(),
  location: text("location").notNull(),
  locationDescription: text("location_description").notNull(),
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true
}).extend({
  buildingInspectionId: z.number().optional()
});
var insertRoomInspectionSchema = createInsertSchema(roomInspections).omit({
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
var insertCustodialNoteSchema = createInsertSchema(custodialNotes).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  // Reduce pool size for serverless
  idleTimeoutMillis: 3e4,
  // Close idle connections faster
  connectionTimeoutMillis: 1e4
  // Shorter connection timeout
});
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
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
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async createInspection(insertInspection) {
    const [inspection] = await db.insert(inspections).values(insertInspection).returning();
    return inspection;
  }
  async getInspections() {
    return await db.select().from(inspections);
  }
  async getInspection(id) {
    const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
    return inspection || void 0;
  }
  async createCustodialNote(insertCustodialNote) {
    const [custodialNote] = await db.insert(custodialNotes).values(insertCustodialNote).returning();
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
    const [roomInspection] = await db.insert(roomInspections).values(insertRoomInspection).returning();
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
import { z as z2 } from "zod";
async function registerRoutes(app2) {
  app2.post("/api/inspections", async (req, res) => {
    try {
      const validatedData = insertInspectionSchema.parse(req.body);
      const inspection = await storage.createInspection(validatedData);
      res.json(inspection);
    } catch (error) {
      console.error("Error creating inspection:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid inspection data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create inspection" });
      }
    }
  });
  app2.get("/api/inspections", async (req, res) => {
    try {
      const { type, incomplete } = req.query;
      let inspections2;
      inspections2 = await storage.getInspections();
      if (type === "whole_building" && incomplete === "true") {
        inspections2 = inspections2.filter(
          (inspection) => inspection.inspectionType === "whole_building" && !inspection.isCompleted
        );
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
      const updates = req.body;
      const inspection = await storage.updateInspection(id, updates);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      console.error("Error updating inspection:", error);
      res.status(500).json({ error: "Failed to update inspection" });
    }
  });
  app2.delete("/api/inspections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
        const roomInspections2 = await storage.getRoomInspectionsByBuildingId(parseInt(buildingInspectionId));
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
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
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
