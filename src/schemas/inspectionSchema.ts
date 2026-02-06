import { z } from 'zod';

/**
 * Zod validation schema for Single Area Inspection form
 * Maps exactly to the database schema in /shared/schema.ts
 *
 * CRITICAL: Field names must match database exactly - DO NOT MODIFY
 */
export const singleAreaInspectionSchema = z.object({
  // Basic Information
  inspectorName: z.string()
    .min(1, 'Inspector name is required')
    .max(200, 'Inspector name too long'),

  school: z.string()
    .min(1, 'School is required')
    .max(100, 'School name too long'),

  date: z.string()
    .min(1, 'Date is required')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid date format'
    ),

  inspectionType: z.literal('single_room').default('single_room'),

  locationDescription: z.string()
    .min(3, 'Please describe the location (minimum 3 characters)')
    .max(500, 'Location description too long'),

  roomNumber: z.string()
    .max(50, 'Room number too long')
    .optional()
    .or(z.literal('')),

  locationCategory: z.string()
    .max(100, 'Location category too long')
    .optional()
    .or(z.literal('')),

  // Rating fields (0-5 scale) - MUST match database exactly
  floors: z.number()
    .min(0, 'Rating must be 0-5')
    .max(5, 'Rating must be 0-5')
    .default(0),

  verticalHorizontalSurfaces: z.number()
    .min(0, 'Rating must be 0-5')
    .max(5, 'Rating must be 0-5')
    .default(0),

  ceiling: z.number()
    .min(0, 'Rating must be 0-5')
    .max(5, 'Rating must be 0-5')
    .default(0),

  restrooms: z.number()
    .min(0, 'Rating must be 0-5')
    .max(5, 'Rating must be 0-5')
    .default(0),

  customerSatisfaction: z.number()
    .min(0, 'Rating must be 0-5')
    .max(5, 'Rating must be 0-5')
    .default(0),

  trash: z.number()
    .min(0, 'Rating must be 0-5')
    .max(5, 'Rating must be 0-5')
    .default(0),

  projectCleaning: z.number()
    .min(0, 'Rating must be 0-5')
    .max(5, 'Rating must be 0-5')
    .default(0),

  activitySupport: z.number()
    .min(0, 'Rating must be 0-5')
    .max(5, 'Rating must be 0-5')
    .default(0),

  safetyCompliance: z.number()
    .min(0, 'Rating must be 0-5')
    .max(5, 'Rating must be 0-5')
    .default(0),

  equipment: z.number()
    .min(0, 'Rating must be 0-5')
    .max(5, 'Rating must be 0-5')
    .default(0),

  monitoring: z.number()
    .min(0, 'Rating must be 0-5')
    .max(5, 'Rating must be 0-5')
    .default(0),

  // Additional fields
  notes: z.string()
    .max(5000, 'Notes too long')
    .optional()
    .or(z.literal('')),

  images: z.array(z.string())
    .max(5, 'Maximum 5 images allowed')
    .default([])
});

/**
 * TypeScript type inferred from Zod schema
 * Use this for type-safe form data
 */
export type SingleAreaInspectionForm = z.infer<typeof singleAreaInspectionSchema>;

/**
 * Default values for the form
 * Ensures all fields start with valid values
 */
export const inspectionDefaultValues: SingleAreaInspectionForm = {
  inspectorName: '',
  school: '',
  date: new Date().toISOString().split('T')[0],
  inspectionType: 'single_room',
  locationDescription: '',
  roomNumber: '',
  locationCategory: '',
  floors: 0,
  verticalHorizontalSurfaces: 0,
  ceiling: 0,
  restrooms: 0,
  customerSatisfaction: 0,
  trash: 0,
  projectCleaning: 0,
  activitySupport: 0,
  safetyCompliance: 0,
  equipment: 0,
  monitoring: 0,
  notes: '',
  images: []
};
