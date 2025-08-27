
// Direct API Testing Script
// Run with: node test-api-direct.js

import fetch from 'node-fetch';

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
    } else {
      console.log('❌ FAILED: Building inspection submission failed');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

async function testHealthCheck() {
  console.log('\nTesting Health Check...');
  
  try {
    const response = await fetch(`${BASE_URL}/health`);
    console.log('Health check status:', response.status);
    
    if (response.ok) {
      const healthData = await response.json();
      console.log('Health data:', healthData);
      console.log('✅ SUCCESS: Health check passed');
    } else {
      console.log('❌ FAILED: Health check failed');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

async function runAllTests() {
  console.log('=== API DIRECT TESTING ===\n');
  
  await testHealthCheck();
  await testSingleInspectionSubmission();
  await testBuildingInspectionSubmission();
  
  console.log('\n=== TESTING COMPLETE ===');
}

runAllTests();
