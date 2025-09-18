import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Coerce number-like strings to numbers; treat empty string/undefined as null
const coerceNullableNumber = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.coerce.number().nullable()
);

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
  images: text("images").array().default([]),
  responses: text("responses"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const custodialNotes = pgTable("custodial_notes", {
  id: serial("id").primaryKey(),
  school: text("school").notNull(),
  date: text("date").notNull(),
  location: text("location").notNull(),
  locationDescription: text("location_description").notNull(),
  notes: text("notes").notNull(),
  images: text("images").array().default([]),
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
  buildingInspectionId: z.number().nullable().optional(),
  images: z.array(z.string()).optional().default([]),
  verifiedRooms: z.array(z.string()).optional().default([]),
  isCompleted: z.boolean().optional().default(false),
  school: z.string().min(1, "School is required"),
  inspectionType: z.string().optional().default('whole_building'),
  locationDescription: z.string().optional().default(''),
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
  notes: z.string().nullable().optional(),
});

export const insertRoomInspectionSchema = createInsertSchema(roomInspections).omit({
  id: true,
  createdAt: true,
}).extend({
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

export const insertCustodialNoteSchema = createInsertSchema(custodialNotes).omit({
  id: true,
  createdAt: true,
}).extend({
  images: z.array(z.string()).optional().default([]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = typeof inspections.$inferSelect;
export type InsertRoomInspection = z.infer<typeof insertRoomInspectionSchema>;
export type RoomInspection = typeof roomInspections.$inferSelect;
export type InsertCustodialNote = z.infer<typeof insertCustodialNoteSchema>;
export type CustodialNote = typeof custodialNotes.$inferSelect;