
export const RATING_CATEGORIES = [
  'floors',
  'verticalHorizontalSurfaces', 
  'ceiling',
  'restrooms',
  'customerSatisfaction',
  'trash',
  'projectCleaning',
  'activitySupport',
  'safetyCompliance',
  'equipment',
  'monitoring'
] as const;

export const ROOM_TYPES = [
  'Classroom',
  'Restroom',
  'Hallway',
  'Office',
  'Cafeteria',
  'Gymnasium',
  'Library',
  'Laboratory',
  'Auditorium',
  'Other'
] as const;

export const SCHOOLS = [
  'Lincoln Elementary',
  'Washington Middle School', 
  'Jefferson High School',
  'Roosevelt Elementary',
  'Kennedy Middle School'
] as const;

export const LOCATION_CATEGORIES = [
  'Academic',
  'Administrative',
  'Athletic',
  'Food Service',
  'Maintenance',
  'Other'
] as const;

export type RatingCategory = typeof RATING_CATEGORIES[number];
export type RoomType = typeof ROOM_TYPES[number];
export type School = typeof SCHOOLS[number];
export type LocationCategory = typeof LOCATION_CATEGORIES[number];
