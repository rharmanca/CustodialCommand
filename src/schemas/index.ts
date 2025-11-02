/**
 * Centralized export for all Zod validation schemas
 * Import schemas from here for consistency
 */

export {
  singleAreaInspectionSchema,
  type SingleAreaInspectionForm,
  inspectionDefaultValues
} from './inspectionSchema';

export {
  custodialNotesSchema,
  type CustodialNotesForm,
  custodialNotesDefaultValues,
  validateCustodialNoteField
} from './custodialNotesSchema';
