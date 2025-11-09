import { pgTable, text, serial, integer, boolean, timestamp, pgTableCreator } from "drizzle-orm/pg-core";
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
  inspectorName: text("inspector_name"),
  school: text("school").notNull(),
  date: text("date").notNull(),
  location: text("location").notNull(),
  locationDescription: text("location_description"),
  notes: text("notes").notNull(),
  images: text("images").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const monthlyFeedback = pgTable("monthly_feedback", {
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
  buildingInspectionId: z.coerce.number().int(),  // Coerce string to number for tests
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

export const insertCustodialNoteSchema = createInsertSchema(custodialNotes).omit({
  id: true,
  createdAt: true,
}).extend({
  inspectorName: z.string().min(1, "Inspector name is required").max(100, "Inspector name too long"),
  school: z.string().min(1, "School is required").max(100, "School name too long"),
  date: z.string().min(1, "Date is required"),
  location: z.string().min(1, "Location is required").max(200, "Location too long"),
  locationDescription: z.string().max(500, "Location description too long").optional().nullable(),
  notes: z.string().min(10, "Please provide a detailed description (minimum 10 characters)").max(5000, "Notes too long"),
  images: z.array(z.string()).optional().default([]),
});

export const insertMonthlyFeedbackSchema = createInsertSchema(monthlyFeedback)
  .omit({ id: true, createdAt: true })
  .extend({
    school: z.string().min(1, "School is required").max(100),
    month: z.string().min(1, "Month is required").max(20),
    year: z.number().int().min(2020).max(2100, "Invalid year"),
    pdfUrl: z.string().min(1, "PDF URL is required").max(500),
    pdfFileName: z.string().min(1).max(255),
    extractedText: z.string().nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
    uploadedBy: z.string().max(255).nullable().optional(),
    fileSize: z.number().int().positive().nullable().optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = typeof inspections.$inferSelect;
export type InsertRoomInspection = z.infer<typeof insertRoomInspectionSchema>;
export type RoomInspection = typeof roomInspections.$inferSelect;
export type InsertCustodialNote = z.infer<typeof insertCustodialNoteSchema>;
export type CustodialNote = typeof custodialNotes.$inferSelect;
export type InsertMonthlyFeedback = z.infer<typeof insertMonthlyFeedbackSchema>;
export type MonthlyFeedback = typeof monthlyFeedback.$inferSelect;

// Photo capture enhancement tables
export const inspectionPhotos = pgTable("inspection_photos", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").references(() => inspections.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  locationLat: text("location_lat"), // Decimal(10,8) precision
  locationLng: text("location_lng"), // Decimal(11,8) precision
  locationAccuracy: text("location_accuracy"), // meters precision, stored as string
  locationSource: text("location_source").default('gps'), // 'gps', 'wifi', 'cell', 'manual', 'qr'
  buildingId: text("building_id"), // Reference to buildings table if available
  floor: integer("floor"), // Floor number for indoor location
  room: text("room"), // Room identifier for indoor location
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
  notes: text("notes"),
  syncStatus: text("sync_status").default('pending'), // 'pending', 'synced', 'failed'
  fileSize: integer("file_size"), // File size in bytes
  imageWidth: integer("image_width"), // Image width in pixels
  imageHeight: integer("image_height"), // Image height in pixels
  compressionRatio: text("compression_ratio"), // Compression ratio as decimal string
  deviceInfo: text("device_info"), // JSON string with device info
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const syncQueue = pgTable("sync_queue", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'photo_upload', 'inspection_update'
  photoId: integer("photo_id").references(() => inspectionPhotos.id, { onDelete: "cascade" }),
  data: text("data").notNull(), // JSON string with sync data
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInspectionPhotoSchema = createInsertSchema(inspectionPhotos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  inspectionId: z.coerce.number().int(),
  photoUrl: z.string().url("Invalid photo URL"),
  thumbnailUrl: z.string().url().optional(),
  locationLat: z.string().regex(/^-?\d+\.\d+$/).nullable().optional(),
  locationLng: z.string().regex(/^-?\d+\.\d+$/).nullable().optional(),
  locationAccuracy: z.string().regex(/^\d+(\.\d+)?$/).nullable().optional(),
  locationSource: z.enum(['gps', 'wifi', 'cell', 'manual', 'qr']).default('gps'),
  buildingId: z.string().uuid().nullable().optional(),
  floor: z.number().int().min(0).max(100).nullable().optional(),
  room: z.string().max(100).nullable().optional(),
  capturedAt: z.date().optional(),
  notes: z.string().max(5000).nullable().optional(),
  syncStatus: z.enum(['pending', 'synced', 'failed']).default('pending'),
  fileSize: z.number().int().positive().nullable().optional(),
  imageWidth: z.number().int().positive().nullable().optional(),
  imageHeight: z.number().int().positive().nullable().optional(),
  compressionRatio: z.string().regex(/^\d+(\.\d+)?$/).nullable().optional(),
  deviceInfo: z.string().max(1000).nullable().optional(),
});

export const insertSyncQueueSchema = createInsertSchema(syncQueue).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(['photo_upload', 'inspection_update']),
  photoId: z.coerce.number().int().nullable().optional(),
  data: z.string(), // JSON string
  retryCount: z.number().int().default(0),
  nextRetryAt: z.date().nullable().optional(),
  errorMessage: z.string().max(1000).nullable().optional(),
});

export type InsertInspectionPhoto = z.infer<typeof insertInspectionPhotoSchema>;
export type InspectionPhoto = typeof inspectionPhotos.$inferSelect;
export type InsertSyncQueue = z.infer<typeof insertSyncQueueSchema>;
export type SyncQueue = typeof syncQueue.$inferSelect;