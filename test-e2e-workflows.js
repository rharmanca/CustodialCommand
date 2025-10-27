import fetch from 'node-fetch';
import { testData } from './test-data.js';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

class EndToEndWorkflowTester {
  constructor() {
    this.results = [];
    this.passedTests = 0;
    this.failedTests = 0;
    this.workflowData = {};
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${status}: ${message}`;
    console.log(logMessage);
    this.results.push({ timestamp, status, message });
  }

  async testEndpoint(name, path, method = 'GET', body = null, headers = {}) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}${path}`, options);
      const responseTime = Date.now() - startTime;
      
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }
      
      if (response.ok) {
        this.log(`✅ ${name} - Status: ${response.status}, Time: ${responseTime}ms`, 'PASS');
        this.passedTests++;
        return { success: true, data: responseData, status: response.status };
      } else {
        this.log(`❌ ${name} - Status: ${response.status}, Error: ${JSON.stringify(responseData)}`, 'FAIL');
        this.failedTests++;
        return { success: false, data: responseData, status: response.status };
      }
    } catch (error) {
      this.log(`❌ ${name} - Error: ${error.message}`, 'FAIL');
      this.failedTests++;
      return { success: false, error: error.message };
    }
  }

  // Single Room Inspection Workflow
  async testSingleRoomInspectionWorkflow() {
    this.log('=== Testing Single Room Inspection Workflow ===');
    
    // Step 1: Create a single room inspection
    this.log('Step 1: Creating single room inspection...');
    const singleRoomData = {
      ...testData.singleRoomInspection,
      roomNumber: `E2E-SINGLE-${Date.now()}`,
      locationDescription: 'E2E Test Single Room Inspection',
      notes: 'Created during end-to-end workflow test'
    };
    
    const createResult = await this.testEndpoint(
      'Create Single Room Inspection', 
      '/api/inspections', 
      'POST', 
      singleRoomData
    );
    
    if (!createResult.success) {
      this.log('❌ Failed to create single room inspection', 'FAIL');
      return false;
    }
    
    const inspectionId = createResult.data.id;
    this.workflowData.singleRoomInspectionId = inspectionId;
    this.log(`Created inspection with ID: ${inspectionId}`);
    
    // Step 2: Retrieve the created inspection
    this.log('Step 2: Retrieving created inspection...');
    const getResult = await this.testEndpoint(
      'Retrieve Single Room Inspection', 
      `/api/inspections/${inspectionId}`
    );
    
    if (!getResult.success) {
      this.log('❌ Failed to retrieve single room inspection', 'FAIL');
      return false;
    }
    
    // Verify the retrieved data matches what we sent
    const retrieved = getResult.data;
    if (retrieved.roomNumber !== singleRoomData.roomNumber) {
      this.log('❌ Retrieved data does not match created data', 'FAIL');
      return false;
    } else {
      this.log('✅ Retrieved data matches created data');
    }
    
    // Step 3: Update the inspection
    this.log('Step 3: Updating inspection...');
    const updateData = {
      notes: 'Updated during end-to-end workflow test',
      isCompleted: true,
      floors: 4
    };
    
    const updateResult = await this.testEndpoint(
      'Update Single Room Inspection', 
      `/api/inspections/${inspectionId}`, 
      'PATCH', 
      updateData
    );
    
    if (!updateResult.success) {
      this.log('❌ Failed to update single room inspection', 'FAIL');
      return false;
    }
    
    // Step 4: Verify the update
    this.log('Step 4: Verifying update...');
    const verifyResult = await this.testEndpoint(
      'Verify Updated Inspection', 
      `/api/inspections/${inspectionId}`
    );
    
    if (!verifyResult.success) {
      this.log('❌ Failed to verify updated inspection', 'FAIL');
      return false;
    }
    
    const updatedInspection = verifyResult.data;
    if (updatedInspection.notes !== updateData.notes || updatedInspection.isCompleted !== true) {
      this.log('❌ Update verification failed', 'FAIL');
      return false;
    } else {
      this.log('✅ Update verified successfully');
    }
    
    // Step 5: List all inspections to include this one
    this.log('Step 5: Listing all inspections...');
    const listResult = await this.testEndpoint(
      'List All Inspections', 
      '/api/inspections'
    );
    
    if (!listResult.success) {
      this.log('❌ Failed to list inspections', 'FAIL');
      return false;
    }
    
    // Verify our inspection is in the list
    const foundInList = listResult.data.some(insp => insp.id === inspectionId);
    if (!foundInList) {
      this.log('❌ Created inspection not found in list', 'FAIL');
      return false;
    } else {
      this.log('✅ Created inspection found in list');
    }
    
    this.log('✅ Single Room Inspection Workflow Completed Successfully');
    return true;
  }

  // Building Inspection Workflow
  async testBuildingInspectionWorkflow() {
    this.log('=== Testing Building Inspection Workflow ===');
    
    // Step 1: Create a building inspection
    this.log('Step 1: Creating building inspection...');
    const buildingData = {
      ...testData.buildingInspection,
      locationDescription: `E2E Building Test ${Date.now()}`,
      notes: 'Created during end-to-end building inspection workflow test'
    };
    
    const createResult = await this.testEndpoint(
      'Create Building Inspection', 
      '/api/inspections', 
      'POST', 
      buildingData
    );
    
    if (!createResult.success) {
      this.log('❌ Failed to create building inspection', 'FAIL');
      return false;
    }
    
    const buildingInspectionId = createResult.data.id;
    this.workflowData.buildingInspectionId = buildingInspectionId;
    this.log(`Created building inspection with ID: ${buildingInspectionId}`);
    
    // Step 2: Create a room inspection for this building
    this.log('Step 2: Creating room inspection for the building...');
    const roomData = {
      ...testData.roomInspection,
      buildingInspectionId: buildingInspectionId,
      roomType: 'classroom',
      roomIdentifier: `E2E-Room-${Date.now()}`,
      notes: 'Room inspection as part of building workflow'
    };
    
    const roomResult = await this.testEndpoint(
      'Create Room Inspection', 
      '/api/room-inspections', 
      'POST', 
      roomData
    );
    
    if (!roomResult.success) {
      this.log('❌ Failed to create room inspection', 'FAIL');
      return false;
    }
    
    const roomInspectionId = roomResult.data.id;
    this.workflowData.roomInspectionId = roomInspectionId;
    this.log(`Created room inspection with ID: ${roomInspectionId}`);
    
    // Step 3: Get all rooms for the building inspection
    this.log('Step 3: Getting rooms for building inspection...');
    const getRoomsResult = await this.testEndpoint(
      'Get Rooms for Building Inspection', 
      `/api/inspections/${buildingInspectionId}/rooms`
    );
    
    if (!getRoomsResult.success) {
      this.log('❌ Failed to get rooms for building inspection', 'FAIL');
      return false;
    }
    
    // Verify the room is associated with the building
    const roomFound = getRoomsResult.data.some(room => room.id === roomInspectionId);
    if (!roomFound) {
      this.log('❌ Created room not found in building inspection', 'FAIL');
      return false;
    } else {
      this.log('✅ Room correctly associated with building inspection');
    }
    
    // Step 4: Update the room inspection
    this.log('Step 4: Updating room inspection...');
    const roomUpdateData = {
      responses: JSON.stringify({
        'floors': 5,
        'verticalHorizontalSurfaces': 4,
        'ceiling': 5,
        'customerSatisfaction': 4,
        'trash': 5
      }),
      images: JSON.stringify(['/test/image.jpg']),
      updatedAt: new Date().toISOString(),
      isCompleted: true
    };
    
    const roomUpdateResult = await this.testEndpoint(
      'Update Room Inspection', 
      `/api/room-inspections/${roomInspectionId}`, 
      'PATCH', 
      roomUpdateData
    );
    
    if (!roomUpdateResult.success) {
      this.log('❌ Failed to update room inspection', 'FAIL');
      return false;
    }
    
    // Step 5: Complete the building inspection
    this.log('Step 5: Completing building inspection...');
    const completeBuildingData = {
      isCompleted: true,
      verifiedRooms: ['classroom', 'restroom', 'hallway']  // Example completed room types
    };
    
    const completeResult = await this.testEndpoint(
      'Complete Building Inspection', 
      `/api/inspections/${buildingInspectionId}`, 
      'PATCH', 
      completeBuildingData
    );
    
    if (!completeResult.success) {
      this.log('❌ Failed to complete building inspection', 'FAIL');
      return false;
    }
    
    this.log('✅ Building Inspection Workflow Completed Successfully');
    return true;
  }

  // Custodial Notes Workflow
  async testCustodialNotesWorkflow() {
    this.log('=== Testing Custodial Notes Workflow ===');
    
    // Step 1: Create a custodial note
    this.log('Step 1: Creating custodial note...');
    const noteData = {
      ...testData.custodialNotes,
      location: `E2E-NOTE-${Date.now()}`,
      notes: 'Custodial issue reported during end-to-end workflow test'
    };
    
    const createResult = await this.testEndpoint(
      'Create Custodial Note', 
      '/api/custodial-notes', 
      'POST', 
      noteData
    );
    
    if (!createResult.success) {
      this.log('❌ Failed to create custodial note', 'FAIL');
      return false;
    }
    
    const noteId = createResult.data.id;
    this.workflowData.custodialNoteId = noteId;
    this.log(`Created custodial note with ID: ${noteId}`);
    
    // Step 2: Retrieve the created custodial note
    this.log('Step 2: Retrieving created custodial note...');
    const getResult = await this.testEndpoint(
      'Retrieve Custodial Note', 
      `/api/custodial-notes/${noteId}`
    );
    
    if (!getResult.success) {
      this.log('❌ Failed to retrieve custodial note', 'FAIL');
      return false;
    }
    
    // Verify the retrieved data matches what we sent
    const retrieved = getResult.data;
    if (retrieved.location !== noteData.location) {
      this.log('❌ Retrieved custodial note data does not match created data', 'FAIL');
      return false;
    } else {
      this.log('✅ Retrieved custodial note data matches created data');
    }
    
    // Step 3: List all custodial notes to include this one
    this.log('Step 3: Listing all custodial notes...');
    const listResult = await this.testEndpoint(
      'List All Custodial Notes', 
      '/api/custodial-notes'
    );
    
    if (!listResult.success) {
      this.log('❌ Failed to list custodial notes', 'FAIL');
      return false;
    }
    
    // Verify our note is in the list
    const foundInList = listResult.data.some(note => note.id === noteId);
    if (!foundInList) {
      this.log('❌ Created custodial note not found in list', 'FAIL');
      return false;
    } else {
      this.log('✅ Created custodial note found in list');
    }
    
    this.log('✅ Custodial Notes Workflow Completed Successfully');
    return true;
  }

  // Data Retrieval and Verification Workflow
  async testDataRetrievalWorkflow() {
    this.log('=== Testing Data Retrieval and Verification Workflow ===');
    
    // Step 1: Get all inspections
    this.log('Step 1: Retrieving all inspections...');
    const inspectionsResult = await this.testEndpoint(
      'Get All Inspections', 
      '/api/inspections'
    );
    
    if (!inspectionsResult.success) {
      this.log('❌ Failed to retrieve all inspections', 'FAIL');
      return false;
    }
    
    // Step 2: Get all custodial notes
    this.log('Step 2: Retrieving all custodial notes...');
    const notesResult = await this.testEndpoint(
      'Get All Custodial Notes', 
      '/api/custodial-notes'
    );
    
    if (!notesResult.success) {
      this.log('❌ Failed to retrieve all custodial notes', 'FAIL');
      return false;
    }
    
    // Step 3: Get all room inspections
    this.log('Step 3: Retrieving all room inspections...');
    const roomsResult = await this.testEndpoint(
      'Get All Room Inspections', 
      '/api/room-inspections'
    );
    
    if (!roomsResult.success) {
      this.log('❌ Failed to retrieve all room inspections', 'FAIL');
      return false;
    }
    
    // Step 4: Verify data consistency
    this.log('Step 4: Verifying data consistency...');
    const expectedInspectionIds = [
      this.workflowData.singleRoomInspectionId,
      this.workflowData.buildingInspectionId
    ].filter(id => id !== undefined);
    
    const actualInspectionIds = inspectionsResult.data.map(i => i.id);
    const allExpectedFound = expectedInspectionIds.every(id => actualInspectionIds.includes(id));
    
    if (!allExpectedFound) {
      this.log(`❌ Not all expected inspections found. Expected: ${expectedInspectionIds}, Actual IDs: ${actualInspectionIds}`, 'FAIL');
      return false;
    } else {
      this.log('✅ All expected inspections found in the system');
    }
    
    // Verify custodial note is present
    if (this.workflowData.custodialNoteId) {
      const noteExists = notesResult.data.some(note => note.id === this.workflowData.custodialNoteId);
      if (!noteExists) {
        this.log('❌ Expected custodial note not found', 'FAIL');
        return false;
      } else {
        this.log('✅ Expected custodial note found in the system');
      }
    }
    
    // Verify room inspection is present
    if (this.workflowData.roomInspectionId) {
      const roomExists = roomsResult.data.some(room => room.id === this.workflowData.roomInspectionId);
      if (!roomExists) {
        this.log('❌ Expected room inspection not found', 'FAIL');
        return false;
      } else {
        this.log('✅ Expected room inspection found in the system');
      }
    }
    
    this.log('✅ Data Retrieval and Verification Workflow Completed Successfully');
    return true;
  }

  // Complete End-to-End Workflow
  async runCompleteWorkflow() {
    this.log('=== Starting Complete End-to-End Workflow ===');
    
    // Run each workflow and track success
    const results = [];
    
    results.push(await this.testSingleRoomInspectionWorkflow());
    results.push(await this.testBuildingInspectionWorkflow());
    results.push(await this.testCustodialNotesWorkflow());
    results.push(await this.testDataRetrievalWorkflow());
    
    // Calculate overall success
    const successfulWorkflows = results.filter(r => r).length;
    const totalWorkflows = results.length;
    
    this.log('=== END-TO-END WORKFLOW TEST RESULTS ===');
    this.log(`Workflows Completed: ${successfulWorkflows}/${totalWorkflows}`);
    this.log(`Success Rate: ${((successfulWorkflows / totalWorkflows) * 100).toFixed(1)}%`);
    
    if (successfulWorkflows === totalWorkflows) {
      this.log('🎉 ALL END-TO-END WORKFLOWS PASSED!', 'SUCCESS');
    } else {
      this.log('⚠️ Some end-to-end workflows failed. See logs above for details.', 'WARNING');
    }
    
    // Log the IDs of created items for potential cleanup
    this.log('=== CREATED ITEMS IDs ===');
    Object.entries(this.workflowData).forEach(([key, value]) => {
      this.log(`${key}: ${value}`);
    });
    
    return successfulWorkflows === totalWorkflows;
  }

  // Complex workflow: Create and manage a complete building inspection
  async testComplexBuildingWorkflow() {
    this.log('=== Testing Complex Building Inspection Workflow ===');
    
    // Step 1: Create a building inspection
    const buildingData = {
      inspectorName: 'E2E Complex Test Inspector',
      school: 'ASA',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'whole_building',
      locationDescription: `Complex Building Test ${Date.now()}`,
      isCompleted: false,
      floors: null,
      notes: 'Complex workflow building inspection'
    };
    
    const buildingResult = await this.testEndpoint(
      'Create Main Building Inspection for Complex Workflow', 
      '/api/inspections', 
      'POST', 
      buildingData
    );
    
    if (!buildingResult.success) {
      this.log('❌ Failed to create main building inspection for complex workflow', 'FAIL');
      return false;
    }
    
    const mainBuildingId = buildingResult.data.id;
    this.log(`Created main building inspection: ${mainBuildingId}`);
    
    // Step 2: Create multiple room inspections for this building
    const roomTypes = ['classroom', 'restroom', 'hallway', 'office', 'storage'];
    const createdRoomIds = [];
    
    for (const roomType of roomTypes) {
      const roomData = {
        buildingInspectionId: mainBuildingId,
        roomType: roomType,
        roomIdentifier: `Room-${roomType}-${Date.now()}`,
        floors: 4,
        verticalHorizontalSurfaces: 3,
        ceiling: 4,
        customerSatisfaction: 5,
        notes: `Room inspection for ${roomType}`
      };
      
      const roomResult = await this.testEndpoint(
        `Create ${roomType} Room Inspection`, 
        '/api/room-inspections', 
        'POST', 
        roomData
      );
      
      if (!roomResult.success) {
        this.log(`❌ Failed to create ${roomType} room inspection`, 'FAIL');
        continue;
      }
      
      createdRoomIds.push(roomResult.data.id);
      this.log(`Created ${roomType} room inspection: ${roomResult.data.id}`);
    }
    
    // Step 3: Verify that all rooms are associated with the building
    const roomsForBuildingResult = await this.testEndpoint(
      'Get All Rooms for Building', 
      `/api/inspections/${mainBuildingId}/rooms`
    );
    
    if (!roomsForBuildingResult.success) {
      this.log('❌ Failed to get rooms for building', 'FAIL');
      return false;
    }
    
    if (roomsForBuildingResult.data.length < roomTypes.length) {
      this.log(`❌ Expected ${roomTypes.length} rooms but only found ${roomsForBuildingResult.data.length}`, 'FAIL');
    } else {
      this.log(`✅ Found ${roomsForBuildingResult.data.length} rooms for the building`);
    }
    
    // Step 4: Update the building inspection to mark as completed
    const completeBuildingResult = await this.testEndpoint(
      'Mark Building Inspection as Complete', 
      `/api/inspections/${mainBuildingId}`, 
      'PATCH', 
      { isCompleted: true, verifiedRooms: roomTypes }
    );
    
    if (!completeBuildingResult.success) {
      this.log('❌ Failed to mark building inspection as complete', 'FAIL');
      return false;
    }
    
    // Step 5: Verify the building inspection is marked as completed
    const verifyBuildingResult = await this.testEndpoint(
      'Verify Building Inspection Completion', 
      `/api/inspections/${mainBuildingId}`
    );
    
    if (!verifyBuildingResult.success) {
      this.log('❌ Failed to verify building inspection completion', 'FAIL');
      return false;
    }
    
    if (!verifyBuildingResult.data.isCompleted) {
      this.log('❌ Building inspection was not marked as completed', 'FAIL');
      return false;
    } else {
      this.log('✅ Building inspection correctly marked as completed');
    }
    
    this.log('✅ Complex Building Inspection Workflow Completed Successfully');
    return true;
  }

  async runAllEndToEndTests() {
    this.log('🚀 Starting Comprehensive End-to-End Workflow Testing');
    this.log(`Testing against: ${BASE_URL}`);
    
    // Run the complete standard workflow
    const standardWorkflowSuccess = await this.runCompleteWorkflow();
    
    // Run the complex workflow
    const complexWorkflowSuccess = await this.testComplexBuildingWorkflow();
    
    // Overall results
    this.log('=== COMPREHENSIVE END-TO-END TEST RESULTS ===');
    this.log(`Total Tests: ${this.passedTests + this.failedTests}`);
    this.log(`Passed: ${this.passedTests}`);
    this.log(`Failed: ${this.failedTests}`);
    this.log(`Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
    
    if (this.failedTests === 0) {
      this.log('🎉 ALL END-TO-END TESTS PASSED!', 'SUCCESS');
    } else {
      this.log('⚠️ Some end-to-end tests failed. Check the logs above for details.', 'WARNING');
    }
  }
}

// Run the end-to-end workflow tests
const tester = new EndToEndWorkflowTester();
tester.runAllEndToEndTests().catch(console.error);