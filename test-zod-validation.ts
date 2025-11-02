/**
 * Zod Validation Schema Test Script
 * Tests edge cases for custodial notes and inspection schemas
 */

import { custodialNotesSchema, type CustodialNotesForm } from './src/schemas/custodialNotesSchema';
import { singleAreaInspectionSchema, type SingleAreaInspectionForm } from './src/schemas/inspectionSchema';

console.log('🧪 Testing Zod Validation Schemas\n');
console.log('='.repeat(50));

// Test 1: Valid Custodial Notes Data
console.log('\n✅ Test 1: Valid Custodial Notes Data');
const validCustodialNote: CustodialNotesForm = {
  inspectorName: 'John Doe',
  school: 'Lincoln High School',
  date: '2025-01-11',
  location: 'Room 101',
  locationDescription: 'Main Building, East Wing',
  notes: 'Minor cleaning issue requiring attention',
  images: []
};

try {
  const result = custodialNotesSchema.parse(validCustodialNote);
  console.log('✅ PASSED: Valid data accepted');
} catch (error) {
  console.log('❌ FAILED:', error);
}

// Test 2: Missing Required Fields
console.log('\n❌ Test 2: Missing Required Fields (inspectorName)');
const missingInspectorName = {
  ...validCustodialNote,
  inspectorName: ''
};

try {
  custodialNotesSchema.parse(missingInspectorName);
  console.log('❌ FAILED: Should have rejected empty inspectorName');
} catch (error: any) {
  if (error.errors?.[0]?.message) {
    console.log(`✅ PASSED: Correctly rejected - "${error.errors[0].message}"`);
  }
}

// Test 3: Optional locationDescription
console.log('\n✅ Test 3: Optional locationDescription (empty string)');
const emptyLocationDesc = {
  ...validCustodialNote,
  locationDescription: ''
};

try {
  custodialNotesSchema.parse(emptyLocationDesc);
  console.log('✅ PASSED: Empty locationDescription accepted (optional field)');
} catch (error) {
  console.log('❌ FAILED:', error);
}

// Test 4: Notes Too Short
console.log('\n❌ Test 4: Notes Too Short (< 10 characters)');
const shortNotes = {
  ...validCustodialNote,
  notes: 'Too short'
};

try {
  custodialNotesSchema.parse(shortNotes);
  console.log('❌ FAILED: Should have rejected short notes');
} catch (error: any) {
  if (error.errors?.[0]?.message) {
    console.log(`✅ PASSED: Correctly rejected - "${error.errors[0].message}"`);
  }
}

// Test 5: Notes Too Long
console.log('\n❌ Test 5: Notes Too Long (> 5000 characters)');
const longNotes = {
  ...validCustodialNote,
  notes: 'A'.repeat(5001)
};

try {
  custodialNotesSchema.parse(longNotes);
  console.log('❌ FAILED: Should have rejected long notes');
} catch (error: any) {
  if (error.errors?.[0]?.message) {
    console.log(`✅ PASSED: Correctly rejected - "${error.errors[0].message}"`);
  }
}

// Test 6: Invalid Date Format
console.log('\n❌ Test 6: Invalid Date Format');
const invalidDate = {
  ...validCustodialNote,
  date: 'not-a-date'
};

try {
  custodialNotesSchema.parse(invalidDate);
  console.log('❌ FAILED: Should have rejected invalid date');
} catch (error: any) {
  if (error.errors?.[0]?.message) {
    console.log(`✅ PASSED: Correctly rejected - "${error.errors[0].message}"`);
  }
}

// Test 7: Too Many Images
console.log('\n❌ Test 7: Too Many Images (> 5)');
const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
const tooManyImages = {
  ...validCustodialNote,
  images: [mockFile, mockFile, mockFile, mockFile, mockFile, mockFile]
};

try {
  custodialNotesSchema.parse(tooManyImages);
  console.log('❌ FAILED: Should have rejected > 5 images');
} catch (error: any) {
  if (error.errors?.[0]?.message) {
    console.log(`✅ PASSED: Correctly rejected - "${error.errors[0].message}"`);
  }
}

// Test 8: Valid Single Area Inspection
console.log('\n✅ Test 8: Valid Single Area Inspection');
const validInspection: SingleAreaInspectionForm = {
  inspectorName: 'Jane Smith',
  school: 'Washington Elementary',
  date: '2025-01-11',
  roomNumber: '205',
  locationDescription: 'Science Wing',
  floors: 4,
  verticalHorizontalSurfaces: 5,
  ceiling: 3,
  restrooms: 4,
  customerSatisfaction: 5,
  trash: 4,
  projectCleaning: 3,
  activitySupport: 5,
  safetyCompliance: 5,
  equipment: 4,
  monitoring: 5,
  notes: 'Excellent overall condition with minor cleaning needed in corners',
  images: []
};

try {
  const result = singleAreaInspectionSchema.parse(validInspection);
  console.log('✅ PASSED: Valid inspection data accepted');
} catch (error) {
  console.log('❌ FAILED:', error);
}

// Test 9: Invalid Rating (> 5)
console.log('\n❌ Test 9: Invalid Rating (floors > 5)');
const invalidRating = {
  ...validInspection,
  floors: 6
};

try {
  singleAreaInspectionSchema.parse(invalidRating);
  console.log('❌ FAILED: Should have rejected rating > 5');
} catch (error: any) {
  if (error.errors?.[0]?.message) {
    console.log(`✅ PASSED: Correctly rejected - "${error.errors[0].message}"`);
  }
}

// Test 10: All Ratings at 0 (Not Rated)
console.log('\n✅ Test 10: All Ratings at 0 (Not Rated)');
const notRated = {
  ...validInspection,
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
  monitoring: 0
};

try {
  singleAreaInspectionSchema.parse(notRated);
  console.log('✅ PASSED: All "Not Rated" (0 values) accepted');
} catch (error) {
  console.log('❌ FAILED:', error);
}

console.log('\n' + '='.repeat(50));
console.log('🎯 Zod Validation Testing Complete!\n');
