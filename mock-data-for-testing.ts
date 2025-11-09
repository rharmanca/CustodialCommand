// Comprehensive mock data for export functionality testing
import type { Inspection, CustodialNote } from './shared/schema';

export const mockInspections: Inspection[] = [
  // Critical Issues (Rating < 2.0)
  {
    id: 1,
    school: 'Lincoln Elementary School',
    date: '2025-01-15',
    inspectionType: 'single_room',
    roomNumber: 'Room 101',
    buildingName: 'Main Building',
    locationDescription: 'First floor classroom near main entrance',
    inspectorName: 'John Smith',
    floors: 1,
    verticalHorizontalSurfaces: 2,
    ceiling: 1,
    restrooms: 1,
    customerSatisfaction: 1,
    trash: 2,
    projectCleaning: 1,
    activitySupport: 2,
    safetyCompliance: 1,
    equipment: 1,
    monitoring: 1,
    notes: 'Severe cleaning issues found. Floors have spills, walls have marks, restroom needs deep cleaning.',
    createdAt: '2025-01-15T10:30:00Z'
  },
  {
    id: 2,
    school: 'Washington Middle School',
    date: '2025-01-16',
    inspectionType: 'single_room',
    roomNumber: 'Room 205',
    buildingName: 'North Wing',
    locationDescription: 'Second floor science laboratory',
    inspectorName: 'Sarah Johnson',
    floors: 1,
    verticalHorizontalSurfaces: 1,
    ceiling: 2,
    restrooms: 1,
    customerSatisfaction: 2,
    trash: 1,
    projectCleaning: 1,
    activitySupport: 1,
    safetyCompliance: 2,
    equipment: 1,
    monitoring: 1,
    notes: 'Chemical spills on floors, equipment not properly sanitized, safety concerns.',
    createdAt: '2025-01-16T14:15:00Z'
  },

  // Needs Attention (Rating 2.0-3.0)
  {
    id: 3,
    school: 'Lincoln Elementary School',
    date: '2025-01-17',
    inspectionType: 'single_room',
    roomNumber: 'Cafeteria',
    buildingName: 'Main Building',
    locationDescription: 'Ground floor cafeteria area',
    inspectorName: 'Mike Davis',
    floors: 3,
    verticalHorizontalSurfaces: 3,
    ceiling: 4,
    restrooms: 2,
    customerSatisfaction: 3,
    trash: 2,
    projectCleaning: 3,
    activitySupport: 3,
    safetyCompliance: 3,
    equipment: 3,
    monitoring: 3,
    notes: 'General cleaning needs improvement. Tables sticky, floors need mopping.',
    createdAt: '2025-01-17T11:45:00Z'
  },
  {
    id: 4,
    school: 'Jefferson High School',
    date: '2025-01-18',
    inspectionType: 'whole_building',
    roomNumber: '',
    buildingName: 'Athletics Building',
    locationDescription: 'Gymnasium and locker rooms',
    inspectorName: 'Emily Wilson',
    floors: 2,
    verticalHorizontalSurfaces: 3,
    ceiling: 3,
    restrooms: 2,
    customerSatisfaction: 2,
    trash: 3,
    projectCleaning: 2,
    activitySupport: 3,
    safetyCompliance: 3,
    equipment: 2,
    monitoring: 3,
    notes: 'Locker rooms need attention, gym floor has scuff marks, general wear and tear.',
    createdAt: '2025-01-18T09:20:00Z'
  },

  // Acceptable Performance (Rating > 3.0)
  {
    id: 5,
    school: 'Roosevelt Elementary',
    date: '2025-01-19',
    inspectionType: 'single_room',
    roomNumber: 'Library',
    buildingName: 'Main Building',
    locationDescription: 'Second floor library',
    inspectorName: 'Lisa Anderson',
    floors: 4,
    verticalHorizontalSurfaces: 4,
    ceiling: 4,
    restrooms: 4,
    customerSatisfaction: 5,
    trash: 4,
    projectCleaning: 4,
    activitySupport: 4,
    safetyCompliance: 5,
    equipment: 4,
    monitoring: 4,
    notes: 'Excellent condition. Well maintained, clean and organized.',
    createdAt: '2025-01-19T13:30:00Z'
  },
  {
    id: 6,
    school: 'Madison Middle School',
    date: '2025-01-20',
    inspectionType: 'whole_building',
    roomNumber: '',
    buildingName: 'Arts Building',
    locationDescription: 'Music rooms and art studios',
    inspectorName: 'David Brown',
    floors: 4,
    verticalHorizontalSurfaces: 4,
    ceiling: 4,
    restrooms: 4,
    customerSatisfaction: 4,
    trash: 4,
    projectCleaning: 4,
    activitySupport: 4,
    safetyCompliance: 4,
    equipment: 4,
    monitoring: 4,
    notes: 'Good overall condition. Some minor dust in art rooms, generally well maintained.',
    createdAt: '2025-01-20T10:15:00Z'
  },

  // Additional data for large dataset testing
  ...Array.from({ length: 50 }, (_, i) => ({
    id: i + 7,
    school: ['Lincoln Elementary School', 'Washington Middle School', 'Jefferson High School', 'Roosevelt Elementary', 'Madison Middle School'][i % 5],
    date: new Date(2025, 0, 21 + (i % 30)).toISOString().split('T')[0],
    inspectionType: i % 3 === 0 ? 'whole_building' : 'single_room' as const,
    roomNumber: i % 3 === 0 ? '' : `Room ${100 + (i % 200)}`,
    buildingName: ['Main Building', 'North Wing', 'Athletics Building', 'Arts Building', 'Science Wing'][i % 5],
    locationDescription: `Test location ${i + 1}`,
    inspectorName: ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Wilson', 'Lisa Anderson', 'David Brown'][i % 6],
    floors: Math.floor(Math.random() * 5) + 1,
    verticalHorizontalSurfaces: Math.floor(Math.random() * 5) + 1,
    ceiling: Math.floor(Math.random() * 5) + 1,
    restrooms: Math.floor(Math.random() * 5) + 1,
    customerSatisfaction: Math.floor(Math.random() * 5) + 1,
    trash: Math.floor(Math.random() * 5) + 1,
    projectCleaning: Math.floor(Math.random() * 5) + 1,
    activitySupport: Math.floor(Math.random() * 5) + 1,
    safetyCompliance: Math.floor(Math.random() * 5) + 1,
    equipment: Math.floor(Math.random() * 5) + 1,
    monitoring: Math.floor(Math.random() * 5) + 1,
    notes: `Test inspection notes for record ${i + 7}. Random data for testing large datasets.`,
    createdAt: new Date(2025, 0, 21 + (i % 30)).toISOString()
  }))
];

export const mockCustodialNotes: CustodialNote[] = [
  // Urgent/High Priority Notes
  {
    id: 1,
    school: 'Lincoln Elementary School',
    date: '2025-01-15',
    location: 'Main Building - Room 101',
    notes: 'URGENT: Broken water pipe causing flooding. Need immediate maintenance attention. Water damage to floors and walls.',
    createdAt: '2025-01-15T10:30:00Z'
  },
  {
    id: 2,
    school: 'Washington Middle School',
    date: '2025-01-16',
    location: 'North Wing - Science Lab 205',
    notes: 'HIGH PRIORITY: Chemical spill in laboratory. Need professional cleanup and safety equipment failure.',
    createdAt: '2025-01-16T14:15:00Z'
  },
  {
    id: 3,
    school: 'Jefferson High School',
    date: '2025-01-17',
    location: 'Athletics Building - Gymnasium',
    notes: 'URGENT: HVAC system failure, no heat in gym. Temperature dropping, affecting student activities.',
    createdAt: '2025-01-17T09:00:00Z'
  },

  // Regular Notes
  {
    id: 4,
    school: 'Roosevelt Elementary',
    date: '2025-01-18',
    location: 'Main Building - Library',
    notes: 'Request: Need additional trash cans in study areas. Current ones overflowing during peak hours.',
    createdAt: '2025-01-18T11:30:00Z'
  },
  {
    id: 5,
    school: 'Madison Middle School',
    date: '2025-01-19',
    location: 'Arts Building - Music Room',
    notes: 'Note: Piano needs tuning and deep cleaning. Dust accumulation on musical equipment.',
    createdAt: '2025-01-19T15:45:00Z'
  },

  // Additional notes for testing
  ...Array.from({ length: 20 }, (_, i) => ({
    id: i + 6,
    school: ['Lincoln Elementary School', 'Washington Middle School', 'Jefferson High School', 'Roosevelt Elementary', 'Madison Middle School'][i % 5],
    date: new Date(2025, 0, 20 + (i % 25)).toISOString().split('T')[0],
    location: ['Main Building', 'North Wing', 'Athletics Building', 'Arts Building', 'Science Wing'][i % 5] + ` - Location ${i + 1}`,
    notes: `Test custodial note ${i + 6}. ${i % 3 === 0 ? 'URGENT: ' : ''}Maintenance request or observation for testing purposes.`,
    createdAt: new Date(2025, 0, 20 + (i % 25)).toISOString()
  }))
];

// Helper functions for testing
export const createTestDataset = (size: number = 100) => {
  const schools = ['Lincoln Elementary School', 'Washington Middle School', 'Jefferson High School', 'Roosevelt Elementary', 'Madison Middle School'];
  const buildings = ['Main Building', 'North Wing', 'Athletics Building', 'Arts Building', 'Science Wing'];
  const inspectors = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Wilson', 'Lisa Anderson', 'David Brown'];

  return Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    school: schools[i % schools.length],
    date: new Date(2025, 0, 1 + (i % 365)).toISOString().split('T')[0],
    inspectionType: i % 4 === 0 ? 'whole_building' : 'single_room' as const,
    roomNumber: i % 4 === 0 ? '' : `Room ${100 + (i % 500)}`,
    buildingName: buildings[i % buildings.length],
    locationDescription: `Test location ${i + 1} for performance testing`,
    inspectorName: inspectors[i % inspectors.length],
    floors: Math.floor(Math.random() * 5) + 1,
    verticalHorizontalSurfaces: Math.floor(Math.random() * 5) + 1,
    ceiling: Math.floor(Math.random() * 5) + 1,
    restrooms: Math.floor(Math.random() * 5) + 1,
    customerSatisfaction: Math.floor(Math.random() * 5) + 1,
    trash: Math.floor(Math.random() * 5) + 1,
    projectCleaning: Math.floor(Math.random() * 5) + 1,
    activitySupport: Math.floor(Math.random() * 5) + 1,
    safetyCompliance: Math.floor(Math.random() * 5) + 1,
    equipment: Math.floor(Math.random() * 5) + 1,
    monitoring: Math.floor(Math.random() * 5) + 1,
    notes: `Performance test inspection ${i + 1}. Random data for testing large datasets and export performance.`,
    createdAt: new Date(2025, 0, 1 + (i % 365)).toISOString()
  }));
};