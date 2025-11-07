#!/usr/bin/env node

/**
 * End-to-End User Journey Tests for Custodial Command
 * Tests complete user workflows from start to finish
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://cacustodialcommand.up.railway.app';

// Test results tracking
const journeyResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordJourneyTest(testName, passed, details = '') {
  journeyResults.total++;
  if (passed) {
    journeyResults.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    journeyResults.failed++;
    log(`FAIL: ${testName} - ${details}`, 'error');
  }
  journeyResults.details.push({ testName, passed, details });
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 15000
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({ status: res.statusCode, headers: res.headers, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Journey 1: Complete Single Room Inspection Workflow
async function testSingleRoomInspectionJourney() {
  log('🏢 Starting Single Room Inspection Journey', 'info');
  
  try {
    // Step 1: Create a single room inspection
    const inspectionData = {
      inspectorName: 'Journey Test Inspector',
      school: 'Journey Test School',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationDescription: 'Test Classroom for Journey',
      roomNumber: 'J101',
      locationCategory: 'classroom',
      buildingName: 'Journey Test Building',
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
      notes: 'Complete journey test inspection'
    };

    const createResponse = await makeRequest(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      body: inspectionData
    });

    if (createResponse.status !== 201 || !createResponse.data.id) {
      recordJourneyTest('Single Room Inspection Journey - Create', false, 
        `Failed to create inspection: ${createResponse.status}`);
      return;
    }

    const inspectionId = createResponse.data.id;
    recordJourneyTest('Single Room Inspection Journey - Create', true, 
      `Created inspection ID: ${inspectionId}`);

    // Step 2: Retrieve the created inspection
    const getResponse = await makeRequest(`${BASE_URL}/api/inspections/${inspectionId}`);
    
    if (getResponse.status !== 200 || getResponse.data.id !== inspectionId) {
      recordJourneyTest('Single Room Inspection Journey - Retrieve', false, 
        `Failed to retrieve inspection: ${getResponse.status}`);
      return;
    }

    recordJourneyTest('Single Room Inspection Journey - Retrieve', true, 
      `Retrieved inspection ${inspectionId}`);

    // Step 3: Verify data integrity
    const inspection = getResponse.data;
    const dataIntegrity = 
      inspection.inspectorName === inspectionData.inspectorName &&
      inspection.school === inspectionData.school &&
      inspection.roomNumber === inspectionData.roomNumber &&
      inspection.inspectionType === 'single_room';

    recordJourneyTest('Single Room Inspection Journey - Data Integrity', dataIntegrity, 
      dataIntegrity ? 'All data matches' : 'Data mismatch detected');

    // Step 4: Update the inspection
    const updateData = { notes: 'Updated journey test inspection' };
    const updateResponse = await makeRequest(`${BASE_URL}/api/inspections/${inspectionId}`, {
      method: 'PATCH',
      body: updateData
    });

    if (updateResponse.status !== 200) {
      recordJourneyTest('Single Room Inspection Journey - Update', false, 
        `Failed to update inspection: ${updateResponse.status}`);
      return;
    }

    recordJourneyTest('Single Room Inspection Journey - Update', true, 
      `Updated inspection ${inspectionId}`);

    // Step 5: Verify update
    const updatedInspection = await makeRequest(`${BASE_URL}/api/inspections/${inspectionId}`);
    const updateVerified = updatedInspection.data.notes === updateData.notes;

    recordJourneyTest('Single Room Inspection Journey - Update Verification', updateVerified, 
      updateVerified ? 'Update verified' : 'Update not reflected');

    log('✅ Single Room Inspection Journey Completed', 'success');

  } catch (error) {
    recordJourneyTest('Single Room Inspection Journey - Overall', false, error.message);
  }
}

// Journey 2: Complete Whole Building Inspection Workflow
async function testWholeBuildingInspectionJourney() {
  log('🏢 Starting Whole Building Inspection Journey', 'info');
  
  try {
    // Step 1: Create a whole building inspection
    const buildingData = {
      inspectorName: 'Journey Building Inspector',
      school: 'Journey Building School',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'whole_building',
      buildingName: 'Journey Test Building Complex',
      locationDescription: 'Complete building complex',
      floors: 3,
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
      notes: 'Whole building journey test',
      verifiedRooms: []
    };

    const createResponse = await makeRequest(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      body: buildingData
    });

    if (createResponse.status !== 201 || !createResponse.data.id) {
      recordJourneyTest('Whole Building Journey - Create', false, 
        `Failed to create building inspection: ${createResponse.status}`);
      return;
    }

    const buildingId = createResponse.data.id;
    recordJourneyTest('Whole Building Journey - Create', true, 
      `Created building inspection ID: ${buildingId}`);

    // Step 2: Create room inspections for the building
    const roomTypes = ['classroom', 'office', 'restroom'];
    const createdRooms = [];

    for (let i = 0; i < roomTypes.length; i++) {
      const roomData = {
        buildingInspectionId: buildingId,
        roomType: roomTypes[i],
        roomIdentifier: `J${200 + i}`,
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
        notes: `Room ${roomTypes[i]} journey test`
      };

      const roomResponse = await makeRequest(`${BASE_URL}/api/room-inspections`, {
        method: 'POST',
        body: roomData
      });

      if (roomResponse.status === 201 && roomResponse.data.id) {
        createdRooms.push(roomResponse.data.id);
        recordJourneyTest(`Whole Building Journey - Create Room ${roomTypes[i]}`, true, 
          `Created room ID: ${roomResponse.data.id}`);
      } else {
        recordJourneyTest(`Whole Building Journey - Create Room ${roomTypes[i]}`, false, 
          `Failed to create room: ${roomResponse.status}`);
      }
    }

    // Step 3: Retrieve all rooms for the building
    const roomsResponse = await makeRequest(`${BASE_URL}/api/inspections/${buildingId}/rooms`);
    
    if (roomsResponse.status === 200 && Array.isArray(roomsResponse.data)) {
      recordJourneyTest('Whole Building Journey - Retrieve Rooms', true, 
        `Retrieved ${roomsResponse.data.length} rooms`);
    } else {
      recordJourneyTest('Whole Building Journey - Retrieve Rooms', false, 
        `Failed to retrieve rooms: ${roomsResponse.status}`);
    }

    // Step 4: Mark building inspection as completed
    const completeResponse = await makeRequest(`${BASE_URL}/api/inspections/${buildingId}`, {
      method: 'PATCH',
      body: { isCompleted: true, verifiedRooms: roomTypes }
    });

    if (completeResponse.status === 200) {
      recordJourneyTest('Whole Building Journey - Mark Complete', true, 
        `Marked building ${buildingId} as completed`);
    } else {
      recordJourneyTest('Whole Building Journey - Mark Complete', false, 
        `Failed to mark complete: ${completeResponse.status}`);
    }

    log('✅ Whole Building Inspection Journey Completed', 'success');

  } catch (error) {
    recordJourneyTest('Whole Building Journey - Overall', false, error.message);
  }
}

// Journey 3: Complete Custodial Notes Workflow
async function testCustodialNotesJourney() {
  log('📝 Starting Custodial Notes Journey', 'info');
  
  try {
    // Step 1: Create a custodial note
    const noteData = {
      school: 'Journey Notes School',
      date: new Date().toISOString().split('T')[0],
      location: 'Journey Test Location',
      locationDescription: 'Test area for custodial notes journey',
      notes: 'Complete custodial notes journey test - maintenance needed'
    };

    const createResponse = await makeRequest(`${BASE_URL}/api/custodial-notes`, {
      method: 'POST',
      body: noteData
    });

    if (createResponse.status !== 201 || !createResponse.data.id) {
      recordJourneyTest('Custodial Notes Journey - Create', false, 
        `Failed to create note: ${createResponse.status}`);
      return;
    }

    const noteId = createResponse.data.id;
    recordJourneyTest('Custodial Notes Journey - Create', true, 
      `Created note ID: ${noteId}`);

    // Step 2: Retrieve the created note
    const getResponse = await makeRequest(`${BASE_URL}/api/custodial-notes/${noteId}`);
    
    if (getResponse.status !== 200 || getResponse.data.id !== noteId) {
      recordJourneyTest('Custodial Notes Journey - Retrieve', false, 
        `Failed to retrieve note: ${getResponse.status}`);
      return;
    }

    recordJourneyTest('Custodial Notes Journey - Retrieve', true, 
      `Retrieved note ${noteId}`);

    // Step 3: Verify data integrity
    const note = getResponse.data;
    const dataIntegrity = 
      note.school === noteData.school &&
      note.location === noteData.location &&
      note.notes === noteData.notes;

    recordJourneyTest('Custodial Notes Journey - Data Integrity', dataIntegrity, 
      dataIntegrity ? 'All data matches' : 'Data mismatch detected');

    // Step 4: Retrieve all notes to verify it appears in the list
    const allNotesResponse = await makeRequest(`${BASE_URL}/api/custodial-notes`);
    
    if (allNotesResponse.status === 200 && Array.isArray(allNotesResponse.data)) {
      const foundNote = allNotesResponse.data.find(n => n.id === noteId);
      recordJourneyTest('Custodial Notes Journey - List Verification', !!foundNote, 
        foundNote ? 'Note found in list' : 'Note not found in list');
    } else {
      recordJourneyTest('Custodial Notes Journey - List Verification', false, 
        `Failed to retrieve notes list: ${allNotesResponse.status}`);
    }

    log('✅ Custodial Notes Journey Completed', 'success');

  } catch (error) {
    recordJourneyTest('Custodial Notes Journey - Overall', false, error.message);
  }
}

// Journey 4: Admin Workflow
async function testAdminJourney() {
  log('👨‍💼 Starting Admin Journey', 'info');
  
  try {
    // Step 1: Admin login
    const loginData = {
      username: 'admin',
      password: '7lGaEWFy3bDbL5NUAxg7zHihLQzWMBHfYu4O/THc3BM='
    };

    const loginResponse = await makeRequest(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      body: loginData
    });

    if (loginResponse.status !== 200 || !loginResponse.data.success) {
      recordJourneyTest('Admin Journey - Login', false, 
        `Failed to login: ${loginResponse.status}`);
      return;
    }

    const sessionToken = loginResponse.data.sessionToken;
    recordJourneyTest('Admin Journey - Login', true, 'Admin login successful');

    // Step 2: Access protected admin endpoint
    const adminResponse = await makeRequest(`${BASE_URL}/api/admin/inspections`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    if (adminResponse.status === 200 && adminResponse.data.success) {
      recordJourneyTest('Admin Journey - Access Protected Data', true, 
        `Retrieved ${adminResponse.data.data.length} inspections`);
    } else {
      recordJourneyTest('Admin Journey - Access Protected Data', false, 
        `Failed to access admin data: ${adminResponse.status}`);
    }

    // Step 3: Test unauthorized access (should fail)
    const unauthorizedResponse = await makeRequest(`${BASE_URL}/api/admin/inspections`);
    
    if (unauthorizedResponse.status === 401) {
      recordJourneyTest('Admin Journey - Unauthorized Access Blocked', true, 
        'Unauthorized access properly blocked');
    } else {
      recordJourneyTest('Admin Journey - Unauthorized Access Blocked', false, 
        `Unauthorized access not blocked: ${unauthorizedResponse.status}`);
    }

    log('✅ Admin Journey Completed', 'success');

  } catch (error) {
    recordJourneyTest('Admin Journey - Overall', false, error.message);
  }
}

// Journey 5: Data Consistency and Cross-Reference Journey
async function testDataConsistencyJourney() {
  log('🔗 Starting Data Consistency Journey', 'info');
  
  try {
    // Step 1: Create related data
    const buildingData = {
      inspectorName: 'Consistency Test Inspector',
      school: 'Consistency Test School',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'whole_building',
      buildingName: 'Consistency Test Building',
      locationDescription: 'Building for consistency testing',
      floors: 2,
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
      notes: 'Consistency test building'
    };

    const buildingResponse = await makeRequest(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      body: buildingData
    });

    if (buildingResponse.status !== 201) {
      recordJourneyTest('Data Consistency Journey - Create Building', false, 
        `Failed to create building: ${buildingResponse.status}`);
      return;
    }

    const buildingId = buildingResponse.data.id;
    recordJourneyTest('Data Consistency Journey - Create Building', true, 
      `Created building ID: ${buildingId}`);

    // Step 2: Create a room for the building
    const roomData = {
      buildingInspectionId: buildingId.toString(),
      roomType: 'classroom',
      roomIdentifier: 'C101',
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
      notes: 'Consistency test room'
    };

    const roomResponse = await makeRequest(`${BASE_URL}/api/room-inspections`, {
      method: 'POST',
      body: roomData
    });

    if (roomResponse.status !== 201) {
      recordJourneyTest('Data Consistency Journey - Create Room', false, 
        `Failed to create room: ${roomResponse.status}`);
      return;
    }

    const roomId = roomResponse.data.id;
    recordJourneyTest('Data Consistency Journey - Create Room', true, 
      `Created room ID: ${roomId}`);

    // Step 3: Verify relationship integrity
    const roomsForBuilding = await makeRequest(`${BASE_URL}/api/inspections/${buildingId}/rooms`);
    
    if (roomsForBuilding.status === 200 && Array.isArray(roomsForBuilding.data)) {
      const foundRoom = roomsForBuilding.data.find(r => r.id === roomId);
      recordJourneyTest('Data Consistency Journey - Relationship Integrity', !!foundRoom, 
        foundRoom ? 'Room properly linked to building' : 'Room not found in building');
    } else {
      recordJourneyTest('Data Consistency Journey - Relationship Integrity', false, 
        `Failed to verify relationship: ${roomsForBuilding.status}`);
    }

    // Step 4: Create a custodial note for the same school
    const noteData = {
      school: buildingData.school, // Same school
      date: new Date().toISOString().split('T')[0],
      location: 'Consistency Test Location',
      locationDescription: 'Location for consistency testing',
      notes: 'Consistency test note'
    };

    const noteResponse = await makeRequest(`${BASE_URL}/api/custodial-notes`, {
      method: 'POST',
      body: noteData
    });

    if (noteResponse.status === 201) {
      recordJourneyTest('Data Consistency Journey - Create Note', true, 
        `Created note ID: ${noteResponse.data.id}`);
    } else {
      recordJourneyTest('Data Consistency Journey - Create Note', false, 
        `Failed to create note: ${noteResponse.status}`);
    }

    // Step 5: Verify cross-reference data integrity
    const allInspections = await makeRequest(`${BASE_URL}/api/inspections`);
    const allNotes = await makeRequest(`${BASE_URL}/api/custodial-notes`);

    if (allInspections.status === 200 && allNotes.status === 200) {
      const schoolInspections = allInspections.data.filter(i => i.school === buildingData.school);
      const schoolNotes = allNotes.data.filter(n => n.school === buildingData.school);
      
      recordJourneyTest('Data Consistency Journey - Cross-Reference Integrity', 
        schoolInspections.length > 0 && schoolNotes.length > 0, 
        `Found ${schoolInspections.length} inspections and ${schoolNotes.length} notes for school`);
    } else {
      recordJourneyTest('Data Consistency Journey - Cross-Reference Integrity', false, 
        'Failed to verify cross-reference data');
    }

    log('✅ Data Consistency Journey Completed', 'success');

  } catch (error) {
    recordJourneyTest('Data Consistency Journey - Overall', false, error.message);
  }
}

// Main test runner
async function runE2EJourneyTests() {
  log('🚀 Starting End-to-End User Journey Tests', 'info');
  log(`📍 Testing against: ${BASE_URL}`, 'info');
  log('', 'info');

  // Run all journey tests
  await testSingleRoomInspectionJourney();
  log('', 'info');
  
  await testWholeBuildingInspectionJourney();
  log('', 'info');
  
  await testCustodialNotesJourney();
  log('', 'info');
  
  await testAdminJourney();
  log('', 'info');
  
  await testDataConsistencyJourney();
  log('', 'info');

  // Generate report
  generateJourneyReport();
}

function generateJourneyReport() {
  log('📊 Journey Test Results Summary', 'info');
  log('=' * 50, 'info');
  log(`Total Journey Tests: ${journeyResults.total}`, 'info');
  log(`Passed: ${journeyResults.passed}`, 'success');
  log(`Failed: ${journeyResults.failed}`, journeyResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((journeyResults.passed / journeyResults.total) * 100).toFixed(1)}%`, 'info');
  log('', 'info');

  if (journeyResults.failed > 0) {
    log('❌ Failed Journey Tests:', 'error');
    journeyResults.details
      .filter(test => !test.passed)
      .forEach(test => log(`  - ${test.testName}: ${test.details}`, 'error'));
    log('', 'info');
  }

  log('✅ All Journey Tests Completed', 'success');
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'journey-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: journeyResults.total,
      passed: journeyResults.passed,
      failed: journeyResults.failed,
      successRate: (journeyResults.passed / journeyResults.total) * 100
    },
    details: journeyResults.details
  }, null, 2));
  
  log(`📄 Detailed journey report saved to: ${reportPath}`, 'info');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runE2EJourneyTests().catch(error => {
    log(`💥 Journey test suite failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runE2EJourneyTests,
  journeyResults
};
