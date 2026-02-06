import { z } from 'zod';

/**
 * Zod validation schema for Custodial Notes form
 * Maps exactly to the database schema in /shared/schema.ts
 *
 * CRITICAL: Field names must match database exactly - DO NOT MODIFY
 */
export const custodialNotesSchema = z.object({
  // Inspector Information
  inspectorName: z.string()
    .min(1, 'Inspector name is required')
    .max(100, 'Inspector name too long'),

  // Basic Information
  school: z.string()
    .min(1, 'School is required')
    .max(100, 'School name too long'),

  date: z.string()
    .min(1, 'Date is required')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid date format'
    ),

  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location too long'),

  locationDescription: z.string()
    .max(500, 'Location description too long')
    .optional()
    .or(z.literal('')),

  // Notes/Description
  notes: z.string()
    .min(10, 'Please provide a detailed description (minimum 10 characters)')
    .max(5000, 'Notes too long'),

  // Images (not stored in database directly, but validated for upload)
  images: z.array(z.instanceof(File))
    .max(5, 'Maximum 5 images allowed')
    .optional()
    .default([])
});

/**
 * TypeScript type inferred from Zod schema
 * Use this for type-safe form data
 */
export type CustodialNotesForm = z.infer<typeof custodialNotesSchema>;

/**
 * Default values for the form
 * Ensures all fields start with valid values
 */
export const custodialNotesDefaultValues: Partial<CustodialNotesForm> = {
  inspectorName: '',
  school: '',
  date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`, // Local date (avoids UTC timezone shift)
  location: '',
  locationDescription: '',
  notes: '',
  images: []
};

/**
 * Validation helper for individual fields
 * Useful for real-time validation feedback
 */
export const validateCustodialNoteField = (
  field: keyof CustodialNotesForm,
  value: any
): { valid: boolean; error?: string } => {
  try {
    const fieldSchema = custodialNotesSchema.shape[field];
    fieldSchema.parse(value);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors[0]?.message || 'Invalid value'
      };
    }
    return { valid: false, error: 'Validation error' };
  }
};
