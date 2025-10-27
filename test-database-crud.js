import fetch from 'node-fetch';
import { testData } from './test-data.js';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

class DatabaseCRUDTester {
  constructor() {
    this.results = [];
    this.passedTests = 0;
    this.failedTests = 0;
    this.createdIds = {
      inspections: [],
      custodialNotes: [],
      roomInspections: []
    };
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

  // Test CREATE operations
  async testCreateOperations() {
    this.log('=== Testing CREATE Operations ===');
    
    // Test creating single room inspection
    const singleResult = await this.testEndpoint(
      'Create Single Room Inspection', 
      '/api/inspections', 
      'POST', 
      {
        ...testData.singleRoomInspection,
        roomNumber: 'CRUD-TEST-001',
        notes: 'CRUD test - Create operation'
      }
    );
    
    if (singleResult.success && singleResult.data.id) {
      this.createdIds.inspections.push(singleResult.data.id);
      this.log(`Created single inspection with ID: ${singleResult.data.id}`);
    }
    
    // Test creating building inspection
    const buildingResult = await this.testEndpoint(
      'Create Building Inspection', 
      '/api/inspections', 
      'POST', 
      {
        ...testData.buildingInspection,
        locationDescription: 'CRUD Test Building',
        notes: 'CRUD test - Building inspection create'
      }
    );
    
    if (buildingResult.success && buildingResult.data.id) {
      this.createdIds.inspections.push(buildingResult.data.id);
      this.log(`Created building inspection with ID: ${buildingResult.data.id}`);
    }
    
    // Test creating custodial note
    const noteResult = await this.testEndpoint(
      'Create Custodial Note', 
      '/api/custodial-notes', 
      'POST', 
      {
        ...testData.custodialNotes,
        location: 'CRUD-TEST-Area',
        notes: 'CRUD test - Custodial note creation'
      }
    );
    
    if (noteResult.success && noteResult.data.id) {
      this.createdIds.custodialNotes.push(noteResult.data.id);
      this.log(`Created custodial note with ID: ${noteResult.data.id}`);
    }
    
    // Test creating room inspection
    if (this.createdIds.inspections.length > 0) {
      const roomResult = await this.testEndpoint(
        'Create Room Inspection', 
        '/api/room-inspections', 
        'POST', 
        {
          ...testData.roomInspection,
          buildingInspectionId: this.createdIds.inspections[0],
          roomIdentifier: 'CRUD-ROOM-001',
          notes: 'CRUD test - Room inspection creation'
        }
      );
      
      if (roomResult.success && roomResult.data.id) {
        this.createdIds.roomInspections.push(roomResult.data.id);
        this.log(`Created room inspection with ID: ${roomResult.data.id}`);
      }
    }
  }

  // Test READ operations
  async testReadOperations() {
    this.log('=== Testing READ Operations ===');
    
    // Test reading all inspections
    await this.testEndpoint('Read All Inspections', '/api/inspections');
    
    // Test reading all custodial notes
    await this.testEndpoint('Read All Custodial Notes', '/api/custodial-notes');
    
    // Test reading all room inspections
    await this.testEndpoint('Read All Room Inspections', '/api/room-inspections');
    
    // Test reading specific records if we have IDs
    if (this.createdIds.inspections.length > 0) {
      await this.testEndpoint(
        'Read Specific Inspection', 
        `/api/inspections/${this.createdIds.inspections[0]}`
      );
    }
    
    if (this.createdIds.custodialNotes.length > 0) {
      await this.testEndpoint(
        'Read Specific Custodial Note', 
        `/api/custodial-notes/${this.createdIds.custodialNotes[0]}`
      );
    }
    
    if (this.createdIds.roomInspections.length > 0) {
      await this.testEndpoint(
        'Read Specific Room Inspection', 
        `/api/room-inspections/${this.createdIds.roomInspections[0]}`
      );
    }
    
    // Test reading inspections with filters
    await this.testEndpoint('Read Inspections with Type Filter', '/api/inspections?type=whole_building');
    await this.testEndpoint('Read Inspections with Incomplete Filter', '/api/inspections?type=whole_building&incomplete=true');
    
    // Test reading room inspections by building ID
    if (this.createdIds.inspections.length > 0) {
      await this.testEndpoint(
        'Read Room Inspections by Building ID', 
        `/api/room-inspections?buildingInspectionId=${this.createdIds.inspections[0]}`
      );
    }
    
    // Test reading rooms for a specific building inspection
    if (this.createdIds.inspections.length > 0) {
      await this.testEndpoint(
        'Read Rooms for Building Inspection', 
        `/api/inspections/${this.createdIds.inspections[0]}/rooms`
      );
    }
  }

  // Test UPDATE operations
  async testUpdateOperations() {
    this.log('=== Testing UPDATE Operations ===');
    
    // Test PATCH update for inspection
    if (this.createdIds.inspections.length > 0) {
      const updateData = {
        notes: 'Updated via CRUD PATCH test',
        isCompleted: true,
        floors: 4
      };
      
      const patchResult = await this.testEndpoint(
        'Update Inspection (PATCH)', 
        `/api/inspections/${this.createdIds.inspections[0]}`, 
        'PATCH', 
        updateData
      );
      
      if (patchResult.success) {
        this.log(`Inspection ${this.createdIds.inspections[0]} updated successfully with PATCH`);
      }
    }
    
    // Test PUT update for inspection
    if (this.createdIds.inspections.length > 0) {
      const putData = {
        ...testData.singleRoomInspection,
        roomNumber: 'CRUD-TEST-001-UPDATED',
        notes: 'Updated via CRUD PUT test',
        floors: 2,
        isCompleted: true
      };
      
      const putResult = await this.testEndpoint(
        'Update Inspection (PUT)', 
        `/api/inspections/${this.createdIds.inspections[0]}`, 
        'PUT', 
        putData
      );
      
      if (putResult.success) {
        this.log(`Inspection ${this.createdIds.inspections[0]} updated successfully with PUT`);
      }
    }
    
    // Test updating room inspection
    if (this.createdIds.roomInspections.length > 0 && this.createdIds.inspections.length > 0) {
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
        `/api/room-inspections/${this.createdIds.roomInspections[0]}`, 
        'PATCH', 
        roomUpdateData
      );
      
      if (roomUpdateResult.success) {
        this.log(`Room inspection ${this.createdIds.roomInspections[0]} updated successfully`);
      }
    }
  }

  // Test DELETE operations
  async testDeleteOperations() {
    this.log('=== Testing DELETE Operations ===');
    
    // Test DELETE for inspection (create a new one first for testing)
    const deleteTestData = {
      ...testData.singleRoomInspection,
      roomNumber: 'CRUD-DELETE-TEST',
      notes: 'CRUD test - Will be deleted'
    };
    
    const createResult = await this.testEndpoint(
      'Create Inspection for Deletion Test', 
      '/api/inspections', 
      'POST', 
      deleteTestData
    );
    
    if (createResult.success && createResult.data.id) {
      const deleteId = createResult.data.id;
      this.log(`Created inspection ${deleteId} for deletion test`);
      
      // Now delete it
      const deleteResult = await this.testEndpoint(
        'Delete Inspection', 
        `/api/inspections/${deleteId}`, 
        'DELETE'
      );
      
      if (deleteResult.success) {
        this.log(`Inspection ${deleteId} deleted successfully`);
      }
    }
    
    // Test DELETE for custodial note
    const deleteNoteData = {
      ...testData.custodialNotes,
      location: 'CRUD-DELETE-TEST',
      notes: 'CRUD test - Custodial note to be deleted'
    };
    
    const createNoteResult = await this.testEndpoint(
      'Create Custodial Note for Deletion Test', 
      '/api/custodial-notes', 
      'POST', 
      deleteNoteData
    );
    
    if (createNoteResult.success && createNoteResult.data.id) {
      const deleteNoteId = createNoteResult.data.id;
      this.log(`Created custodial note ${deleteNoteId} for deletion test`);
      
      // Now delete it
      const deleteNoteResult = await this.testEndpoint(
        'Delete Custodial Note', 
        `/api/custodial-notes/${deleteNoteId}`, 
        'DELETE'
      );
      
      if (deleteNoteResult.success) {
        this.log(`Custodial note ${deleteNoteId} deleted successfully`);
      }
    }
  }

  // Test edge cases and error conditions
  async testEdgeCases() {
    this.log('=== Testing Edge Cases and Error Conditions ===');
    
    // Test creating with invalid data
    await this.testEndpoint(
      'Create with Missing Required Fields', 
      '/api/inspections', 
      'POST', 
      { school: 'TEST' }  // Missing required fields
    );
    
    // Test reading non-existent records
    await this.testEndpoint('Read Non-existent Inspection', '/api/inspections/999999');
    await this.testEndpoint('Read Non-existent Custodial Note', '/api/custodial-notes/999999');
    await this.testEndpoint('Read Non-existent Room Inspection', '/api/room-inspections/999999');
    
    // Test updating non-existent records
    await this.testEndpoint(
      'Update Non-existent Inspection (PATCH)', 
      '/api/inspections/999999', 
      'PATCH', 
      { notes: 'test' }
    );
    
    await this.testEndpoint(
      'Update Non-existent Inspection (PUT)', 
      '/api/inspections/999999', 
      'PUT', 
      testData.singleRoomInspection
    );
    
    // Test deleting non-existent records
    await this.testEndpoint('Delete Non-existent Inspection', '/api/inspections/999999', 'DELETE');
    await this.testEndpoint('Delete Non-existent Custodial Note', '/api/custodial-notes/999999', 'DELETE');
    
    // Test validation errors
    const invalidInspection = {
      ...testData.singleRoomInspection,
      school: '', // Required field
      date: ''    // Required field
    };
    
    await this.testEndpoint(
      'Create with Invalid Data (Validation Error)', 
      '/api/inspections', 
      'POST', 
      invalidInspection
    );
  }

  // Test data integrity after operations
  async testDataIntegrity() {
    this.log('=== Testing Data Integrity ===');
    
    // Fetch all inspections and verify they have required fields
    const getAllResult = await this.testEndpoint('Get All Inspections for Integrity Check', '/api/inspections');
    
    if (getAllResult.success && Array.isArray(getAllResult.data)) {
      this.log(`Found ${getAllResult.data.length} inspections for integrity check`);
      
      for (const inspection of getAllResult.data) {
        // Verify required fields exist
        const requiredFields = ['id', 'school', 'date', 'inspectionType'];
        for (const field of requiredFields) {
          if (!(field in inspection)) {
            this.log(`❌ Missing required field '${field}' in inspection ${inspection.id || 'unknown'}`, 'FAIL');
            this.failedTests++;
          } else {
            this.passedTests++;
          }
        }
      }
    }
    
    // Fetch all custodial notes and verify they have required fields
    const getAllNotesResult = await this.testEndpoint('Get All Custodial Notes for Integrity Check', '/api/custodial-notes');
    
    if (getAllNotesResult.success && Array.isArray(getAllNotesResult.data)) {
      this.log(`Found ${getAllNotesResult.data.length} custodial notes for integrity check`);
      
      for (const note of getAllNotesResult.data) {
        // Verify required fields exist
        const requiredFields = ['id', 'school', 'date', 'location'];
        for (const field of requiredFields) {
          if (!(field in note)) {
            this.log(`❌ Missing required field '${field}' in custodial note ${note.id || 'unknown'}`, 'FAIL');
            this.failedTests++;
          } else {
            this.passedTests++;
          }
        }
      }
    }
  }

  // Run comprehensive CRUD tests
  async runAllCRUDTests() {
    this.log('🚀 Starting Comprehensive Database CRUD Testing');
    this.log(`Testing against: ${BASE_URL}`);
    
    await this.testCreateOperations();
    await this.testReadOperations();
    await this.testUpdateOperations();
    await this.testDeleteOperations();
    await this.testEdgeCases();
    await this.testDataIntegrity();
    
    this.log('=== DATABASE CRUD TEST RESULTS SUMMARY ===');
    this.log(`Total Tests: ${this.passedTests + this.failedTests}`);
    this.log(`Passed: ${this.passedTests}`);
    this.log(`Failed: ${this.failedTests}`);
    this.log(`Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
    
    if (this.failedTests === 0) {
      this.log('🎉 ALL DATABASE CRUD TESTS PASSED!', 'SUCCESS');
    } else {
      this.log('⚠️ Some database CRUD tests failed. Check the logs above for details.', 'WARNING');
    }
    
    this.log(`Created IDs:`, this.createdIds);
  }
}

// Run the CRUD tests
const tester = new DatabaseCRUDTester();
tester.runAllCRUDTests().catch(console.error);