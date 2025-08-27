
import fetch from 'node-fetch';

const API_BASE = 'http://0.0.0.0:5000/api';

async function testCompleteWorkflow() {
  console.log('=== COMPREHENSIVE SUBMISSION DEBUG TEST ===\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing server connectivity...');
    const healthResponse = await fetch(`${API_BASE}/../health`);
    console.log(`Health check: ${healthResponse.status} ${healthResponse.statusText}`);
    
    // Test 2: Create building inspection
    console.log('\n2. Testing building inspection creation...');
    const buildingData = {
      inspectorName: 'Debug Tester',
      school: 'ASA',
      date: '2025-08-25',
      inspectionType: 'whole_building',
      locationDescription: 'Debug Test Building',
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
    
    console.log('Building payload:', JSON.stringify(buildingData, null, 2));
    
    const buildingResponse = await fetch(`${API_BASE}/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildingData)
    });
    
    console.log(`Building response: ${buildingResponse.status} ${buildingResponse.statusText}`);
    const buildingResult = await buildingResponse.json();
    console.log('Building result:', buildingResult);
    
    if (!buildingResponse.ok) {
      throw new Error(`Building creation failed: ${JSON.stringify(buildingResult)}`);
    }
    
    // Test 3: Create room inspection
    console.log('\n3. Testing room inspection creation...');
    const roomData = {
      buildingInspectionId: buildingResult.id,
      roomType: 'classroom',
      roomIdentifier: 'Debug Room 101',
      floors: 4,
      verticalHorizontalSurfaces: 5,
      ceiling: 3,
      restrooms: null,
      customerSatisfaction: 4,
      trash: 5,
      projectCleaning: 3,
      activitySupport: 4,
      safetyCompliance: 5,
      equipment: 4,
      monitoring: 3,
      notes: 'Debug test room inspection',
      images: []
    };
    
    console.log('Room payload:', JSON.stringify(roomData, null, 2));
    
    const roomResponse = await fetch(`${API_BASE}/room-inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData)
    });
    
    console.log(`Room response: ${roomResponse.status} ${roomResponse.statusText}`);
    const roomResult = await roomResponse.json();
    console.log('Room result:', roomResult);
    
    if (!roomResponse.ok) {
      throw new Error(`Room creation failed: ${JSON.stringify(roomResult)}`);
    }
    
    console.log('\n✅ ALL TESTS PASSED - Submission workflow is working correctly');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Full error:', error);
  }
}

testCompleteWorkflow();
