import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  inspectorName: text("inspector_name"),
  school: text("school").notNull(),
  date: text("date").notNull(),
  inspectionType: text("inspection_type").notNull(), // 'single_room' or 'whole_building'
  locationDescription: text("location_description").notNull(),
  roomNumber: text("room_number"), // For single room inspections
  locationCategory: text("location_category"), // New field for location category
  buildingName: text("building_name"), // For whole building inspections
  buildingInspectionId: integer("building_inspection_id"), // Reference to parent building inspection
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
  verifiedRooms: text("verified_rooms").array(), // For tracking completed room types in building inspections
  isCompleted: boolean("is_completed").default(false), // For whole building inspections
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New table for individual room inspections within a building inspection
export const roomInspections = pgTable("room_inspections", {
  id: serial("id").primaryKey(),
  buildingInspectionId: integer("building_inspection_id").notNull(),
  roomType: text("room_type").notNull(),
  roomIdentifier: text("room_identifier"), // Specific room number or identifier
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const custodialNotes = pgTable("custodial_notes", {
  id: serial("id").primaryKey(),
  school: text("school").notNull(),
  date: text("date").notNull(),
  location: text("location").notNull(),
  locationDescription: text("location_description").notNull(),
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
}).extend({
  buildingInspectionId: z.number().optional(),
});

export const insertRoomInspectionSchema = createInsertSchema(roomInspections).omit({
  id: true,
  createdAt: true,
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

export const insertCustodialNoteSchema = createInsertSchema(custodialNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = typeof inspections.$inferSelect;
export type InsertRoomInspection = z.infer<typeof insertRoomInspectionSchema>;
export type RoomInspection = typeof roomInspections.$inferSelect;
export type InsertCustodialNote = z.infer<typeof insertCustodialNoteSchema>;
export type CustodialNote = typeof custodialNotes.$inferSelect;