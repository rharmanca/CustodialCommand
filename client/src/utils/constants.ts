
export const APP_CONFIG = {
  VERSION: '1.0.0',
  NAME: 'Custodial Command',
  DESCRIPTION: 'Shared Service Command application for managing custodial inspections',
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGES_PER_INSPECTION: 5,
  AUTO_SAVE_DELAY: 2000, // 2 seconds
  NOTIFICATION_DURATION: 4000, // 4 seconds
  DRAFT_RETENTION_DAYS: 7
} as const;

export const SCHOOL_OPTIONS = [
  { value: 'ASA', label: 'ASA' },
  { value: 'LCA', label: 'LCA' },
  { value: 'GWC', label: 'GWC' },
  { value: 'OA', label: 'OA' },
  { value: 'CBR', label: 'CBR' },
  { value: 'WLC', label: 'WLC' }
] as const;

export const LOCATION_CATEGORIES = [
  { value: 'exterior', label: 'Exterior' },
  { value: 'gym_bleachers', label: 'Gym and Bleachers' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'utility_storage', label: 'Utility Or Storage' },
  { value: 'admin_office', label: 'Admin or Office Area' },
  { value: 'hallway', label: 'Hallway' },
  { value: 'stairwell', label: 'Stairwell' },
  { value: 'restroom', label: 'Restroom' },
  { value: 'staff_single_restroom', label: 'Staff or Single Restroom' }
] as const;

export const BUILDING_REQUIREMENTS = {
  exterior: 2,
  gym_bleachers: 1,
  classroom: 3,
  cafeteria: 1,
  utility_storage: 1,
  admin_office: 2,
  hallway: 3,
  stairwell: 2,
  restroom: 2,
  staff_single_restroom: 1
} as const;

export const API_ENDPOINTS = {
  INSPECTIONS: '/api/inspections',
  CUSTODIAL_NOTES: '/api/custodial-notes',
  ROOM_INSPECTIONS: '/api/room-inspections'
} as const;

export const RATING_SCALE = {
  MIN: 1,
  MAX: 5,
  NOT_RATED: -1
} as const;
