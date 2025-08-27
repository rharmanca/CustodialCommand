
// Direct API Testing Script
// Run with: node test-api-direct.js

import fetch from('node-fetch');

const BASE_URL = 'http://0.0.0.0:5000';

async function testSingleInspectionSubmission() {
  console.log('Testing Single Room Inspection Submission...');
  
  const testData = {
    inspectorName: 'Test Inspector',
    school: 'ASA',
    date: new Date().toISOString().split('T')[0],
    inspectionType: 'single_room',
    locationDescription: 'Test Location',
    roomNumber: 'API-TEST-101',
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
    notes: 'API test submission',
    images: []
  };

  try {
    console.log('Sending request with data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseBody = await response.text();
    console.log('Response body:', responseBody);
    
    if (response.ok) {
      console.log('✅ SUCCESS: Single inspection submitted');
    } else {
      console.log('❌ FAILED: Single inspection submission failed');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

async function testBuildingInspectionSubmission() {
  console.log('\nTesting Building Inspection Submission...');
  
  const buildingData = {
    inspectorName: 'Test Inspector',
    school: 'LCA',
    date: new Date().toISOString().split('T')[0],
    inspectionType: 'whole_building',
    locationDescription: 'Whole Building Inspection',
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
    notes: ''
  };

  try {
    console.log('Sending building inspection request...');
    
    const response = await fetch(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildingData)
    });

    console.log('Response status:', response.status);
    const responseBody = await response.text();
    console.log('Response body:', responseBody);
    
    if (response.ok) {
      console.log('✅ SUCCESS: Building inspection submitted');
      return JSON.parse(responseBody);
    } else {
      console.log('❌ FAILED: Building inspection submission failed');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

async function testRoomInspectionSubmission(buildingId) {
  console.log('\nTesting Room Inspection Submission...');
  
  const roomData = {
    buildingInspectionId: buildingId,
    roomType: 'classroom',
    roomIdentifier: 'API-ROOM-101',
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
    notes: 'API test room inspection',
    images: []
  };

  try {
    console.log('Sending room inspection request...');
    
    const response = await fetch(`${BASE_URL}/api/room-inspections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(roomData)
    });

    console.log('Response status:', response.status);
    const responseBody = await response.text();
    console.log('Response body:', responseBody);
    
    if (response.ok) {
      console.log('✅ SUCCESS: Room inspection submitted');
    } else {
      console.log('❌ FAILED: Room inspection submission failed');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('=== API SUBMISSION TESTING ===\n');
  
  // Test single inspection
  await testSingleInspectionSubmission();
  
  // Test building inspection workflow
  const buildingInspection = await testBuildingInspectionSubmission();
  
  if (buildingInspection && buildingInspection.id) {
    await testRoomInspectionSubmission(buildingInspection.id);
  }
  
  console.log('\n=== TESTING COMPLETE ===');
}

runTests().catch(console.error);
