// Test data for Custodial Command application
// This file contains comprehensive test data for all types of submissions

export const testData = {
  schools: [
    { value: 'ASA', label: 'ASA' },
    { value: 'LCA', label: 'LCA' },
    { value: 'GWC', label: 'GWC' },
    { value: 'OA', label: 'OA' },
    { value: 'CBR', label: 'CBR' },
    { value: 'WLC', label: 'WLC' }
  ],

  locationCategories: [
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
  ],

  // Single Room Inspection Test Data
  singleRoomInspection: {
    inspectorName: 'Test Inspector 1',
    school: 'ASA',
    date: new Date().toISOString().split('T')[0],
    inspectionType: 'single_room',
    locationDescription: 'Main Entrance Classroom',
    roomNumber: '101A',
    locationCategory: 'classroom',
    floors: 5,
    verticalHorizontalSurfaces: 4,
    ceiling: 5,
    restrooms: 3,
    customerSatisfaction: 4,
    trash: 5,
    projectCleaning: 3,
    activitySupport: 4,
    safetyCompliance: 5,
    equipment: 4,
    monitoring: 3,
    notes: 'Test single room inspection with comprehensive ratings',
    images: []
  },

  // Building Inspection Test Data
  buildingInspection: {
    inspectorName: 'Building Inspector',
    school: 'LCA',
    date: new Date().toISOString().split('T')[0],
    inspectionType: 'whole_building',
    locationDescription: 'Entire building inspection',
    isCompleted: false,
    locationCategory: null,
    roomNumber: null,
    floors: null,
    verticalHorizontalSurfaces: null,
    ceiling: null,
    restrooms: null,
    customerSatisfaction: null,
    trash: null,
    projectCleaning: null,
    activitySupport: null,
    safetyCompliance: null,
    equipment: null,
    monitoring: null,
    notes: 'Comprehensive building inspection',
    images: []
  },

  // Custodial Notes Test Data
  custodialNotes: {
    school: 'GWC',
    date: new Date().toISOString().split('T')[0],
    location: 'Cafeteria',
    locationDescription: 'Large dining area near main entrance',
    notes: 'Spill cleanup required near entrance. Mop bucket needed for deep cleaning.'
  },

  // Room Inspection Test Data
  roomInspection: {
    buildingInspectionId: null,
    roomType: 'classroom',
    roomIdentifier: 'Room 205',
    floors: 4,
    verticalHorizontalSurfaces: 3,
    ceiling: 5,
    customerSatisfaction: 4,
    trash: 5,
    notes: 'Room inspection for second floor classroom',
    responses: JSON.stringify({
      'floors': 4,
      'verticalHorizontalSurfaces': 3,
      'ceiling': 5,
      'customerSatisfaction': 4,
      'trash': 5
    })
  },

  // Additional test variations for different scenarios
  testScenarios: {
    // Low ratings scenario
    lowRatingsInspection: {
      inspectorName: 'Test Inspector Low',
      school: 'OA',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationDescription: 'Storage room inspection',
      roomNumber: 'Storage-001',
      locationCategory: 'utility_storage',
      floors: 1,
      verticalHorizontalSurfaces: 2,
      ceiling: 1,
      restrooms: 1,
      customerSatisfaction: 2,
      trash: 2,
      projectCleaning: 1,
      activitySupport: 2,
      safetyCompliance: 3,
      equipment: 1,
      monitoring: 2,
      notes: 'Multiple issues identified. Requires immediate attention.',
      images: []
    },

    // High ratings scenario
    highRatingsInspection: {
      inspectorName: 'Test Inspector High',
      school: 'CBR',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationDescription: 'Executive conference room',
      roomNumber: 'Exec-Conf-001',
      locationCategory: 'admin_office',
      floors: 5,
      verticalHorizontalSurfaces: 5,
      ceiling: 5,
      restrooms: 5,
      customerSatisfaction: 5,
      trash: 5,
      projectCleaning: 5,
      activitySupport: 5,
      safetyCompliance: 5,
      equipment: 5,
      monitoring: 5,
      notes: 'Excellent condition throughout. Outstanding maintenance.',
      images: []
    },

    // Partial ratings scenario
    partialRatingsInspection: {
      inspectorName: 'Test Inspector Partial',
      school: 'WLC',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationDescription: 'Temporary classroom setup',
      roomNumber: 'Temp-001',
      locationCategory: 'classroom',
      floors: 3,
      verticalHorizontalSurfaces: null,
      ceiling: 4,
      restrooms: null,
      customerSatisfaction: 3,
      trash: null,
      projectCleaning: 4,
      activitySupport: null,
      safetyCompliance: 3,
      equipment: null,
      monitoring: 4,
      notes: 'Partially inspected area. Further inspection required for restrooms and trash areas.',
      images: []
    }
  },

  // Validations for form data
  validations: {
    requiredFields: {
      'inspections': ['school', 'date', 'inspectionType'],
      'custodial-notes': ['school', 'date', 'location'],
      'room-inspections': ['buildingInspectionId', 'roomType']
    },
    
    fieldLengths: {
      school: { min: 1, max: 10 },
      roomNumber: { min: 1, max: 20 },
      locationDescription: { min: 0, max: 500 },
      notes: { min: 0, max: 2000 }
    },
    
    ratingRanges: {
      min: 0,
      max: 5,
      nullAllowed: true
    }
  },

  // Test images (base64 encoded small images for testing)
  testImages: {
    png1x1: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    jpeg1x1: "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/gA=="
  }
};