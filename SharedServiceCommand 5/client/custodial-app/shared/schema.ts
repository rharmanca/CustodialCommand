import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const inspections = pgTable('inspections', {
  id: serial('id').primaryKey(),
  facilityName: text('facility_name').notNull(),
  inspectorName: text('inspector_name').notNull(),
  dateInspected: timestamp('date_inspected').notNull(),
  overallRating: integer('overall_rating').notNull(),
  overallComments: text('overall_comments'),
  
  // Individual ratings (1-5 scale)
  generalCleanlinessRating: integer('general_cleanliness_rating').notNull(),
  restroomCleanlinessRating: integer('restroom_cleanliness_rating').notNull(),
  floorMaintenanceRating: integer('floor_maintenance_rating').notNull(),
  windowCleanlinessRating: integer('window_cleanliness_rating').notNull(),
  trashRemovalRating: integer('trash_removal_rating').notNull(),
  suppliesStockingRating: integer('supplies_stocking_rating').notNull(),
  equipmentMaintenanceRating: integer('equipment_maintenance_rating').notNull(),
  safetyComplianceRating: integer('safety_compliance_rating').notNull(),
  timelinessRating: integer('timeliness_rating').notNull(),
  professionalismRating: integer('professionalism_rating').notNull(),
  responsivenessFeedbackRating: integer('responsiveness_feedback_rating').notNull(),

  // Individual comments
  generalCleanlinessComments: text('general_cleanliness_comments'),
  restroomCleanlinessComments: text('restroom_cleanliness_comments'),
  floorMaintenanceComments: text('floor_maintenance_comments'),
  windowCleanlinessComments: text('window_cleanliness_comments'),
  trashRemovalComments: text('trash_removal_comments'),
  suppliesStockingComments: text('supplies_stocking_comments'),
  equipmentMaintenanceComments: text('equipment_maintenance_comments'),
  safetyComplianceComments: text('safety_compliance_comments'),
  timelinessComments: text('timeliness_comments'),
  professionalismComments: text('professionalism_comments'),
  responsivenessFeedbackComments: text('responsiveness_feedback_comments'),

  // Photo URLs
  photoUrls: text('photo_urls').array(),
  
  createdAt: timestamp('created_at').defaultNow(),
});

export const custodialNotes = pgTable('custodial_notes', {
  id: serial('id').primaryKey(),
  facilityName: text('facility_name').notNull(),
  submitterName: text('submitter_name').notNull(),
  issueType: text('issue_type').notNull(),
  description: text('description').notNull(),
  priority: text('priority').notNull(),
  status: text('status').defaultTo('open'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Zod schemas for validation
export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
});

export const insertCustodialNoteSchema = createInsertSchema(custodialNotes).omit({
  id: true,
  createdAt: true,
});

// Types
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type CustodialNote = typeof custodialNotes.$inferSelect;
export type InsertCustodialNote = z.infer<typeof insertCustodialNoteSchema>;