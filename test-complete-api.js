import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import fs from 'fs';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

class ComprehensiveAPITester {
  constructor() {
    this.results = [];
    this.passedTests = 0;
    this.failedTests = 0;
    this.testData = {
      singleInspection: {
        inspectorName: 'API Test Inspector',
        school: 'ASA',
        date: new Date().toISOString().split('T')[0],
        inspectionType: 'single_room',
        locationDescription: 'API Test Location',
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
        notes: 'API test - single room inspection',
        images: []
      },
      buildingInspection: {
        inspectorName: 'API Test Inspector',
        school: 'LCA',
        date: new Date().toISOString().split('T')[0],
        inspectionType: 'whole_building',
        locationDescription: 'API Test Building',
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
        notes: 'API test - building inspection',
        images: []
      },
      custodialNote: {
        school: 'GWC',
        date: new Date().toISOString().split('T')[0],
        location: 'API Test Location',
        locationDescription: 'API Test Area',
        notes: 'API test - custodial note'
      },
      roomInspection: {
        buildingInspectionId: null, // Will be set after creating a building inspection
        roomType: 'classroom',
        roomIdentifier: 'API-TEST-RM-1',
        floors: 4,
        verticalHorizontalSurfaces: 3,
        ceiling: 4,
        customerSatisfaction: 5,
        notes: 'API test - room inspection'
      }
    };
    this.createdIds = {};
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
        if (body instanceof FormData) {
          options.body = body;
          // Don't set Content-Type header for FormData as it will be set automatically with boundary
          delete options.headers['Content-Type'];
        } else {
          options.body = JSON.stringify(body);
        }
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

  // Health check endpoints
  async testHealthCheck() {
    this.log('=== Testing Health Check Endpoints ===');
    await this.testEndpoint('Health Check', '/health');
    await this.testEndpoint('Metrics Endpoint', '/metrics');
  }

  // Inspection endpoints
  async testInspectionEndpoints() {
    this.log('=== Testing Inspection Endpoints ===');
    
    // Test creating single room inspection
    const singleResult = await this.testEndpoint(
      'Create Single Room Inspection', 
      '/api/inspections', 
      'POST', 
      this.testData.singleInspection
    );
    
    if (singleResult.success && singleResult.data.id) {
      this.createdIds.singleInspection = singleResult.data.id;
      this.log(`Created single inspection with ID: ${singleResult.data.id}`);
    }
    
    // Test creating building inspection
    const buildingResult = await this.testEndpoint(
      'Create Building Inspection', 
      '/api/inspections', 
      'POST', 
      this.testData.buildingInspection
    );
    
    if (buildingResult.success && buildingResult.data.id) {
      this.createdIds.buildingInspection = buildingResult.data.id;
      this.testData.roomInspection.buildingInspectionId = buildingResult.data.id;
      this.log(`Created building inspection with ID: ${buildingResult.data.id}`);
    }
    
    // Test getting all inspections
    await this.testEndpoint('Get All Inspections', '/api/inspections');
    
    // Test getting specific inspection if we have IDs
    if (this.createdIds.singleInspection) {
      await this.testEndpoint(
        'Get Specific Single Inspection', 
        `/api/inspections/${this.createdIds.singleInspection}`
      );
    }
    
    if (this.createdIds.buildingInspection) {
      await this.testEndpoint(
        'Get Specific Building Inspection', 
        `/api/inspections/${this.createdIds.buildingInspection}`
      );
    }
    
    // Test updating inspection
    if (this.createdIds.singleInspection) {
      const updateData = { notes: 'Updated via API test', isCompleted: true };
      await this.testEndpoint(
        'Update Inspection (PATCH)', 
        `/api/inspections/${this.createdIds.singleInspection}`, 
        'PATCH', 
        updateData
      );
    }
    
    // Test PUT update
    if (this.createdIds.singleInspection) {
      const updatedInspectionData = {
        ...this.testData.singleInspection,
        notes: 'Updated via PUT method',
        floors: 3
      };
      await this.testEndpoint(
        'Update Inspection (PUT)', 
        `/api/inspections/${this.createdIds.singleInspection}`, 
        'PUT', 
        updatedInspectionData
      );
    }
    
    // Test getting inspections with query parameters
    await this.testEndpoint('Get Inspections with Type Query', '/api/inspections?type=whole_building');
    await this.testEndpoint('Get Incomplete Inspections', '/api/inspections?type=whole_building&incomplete=true');
  }

  // Custodial notes endpoints
  async testCustodialNotesEndpoints() {
    this.log('=== Testing Custodial Notes Endpoints ===');
    
    // Test creating custodial note
    const noteResult = await this.testEndpoint(
      'Create Custodial Note', 
      '/api/custodial-notes', 
      'POST', 
      this.testData.custodialNote
    );
    
    if (noteResult.success && noteResult.data.id) {
      this.createdIds.custodialNote = noteResult.data.id;
      this.log(`Created custodial note with ID: ${noteResult.data.id}`);
    }
    
    // Test getting all custodial notes
    await this.testEndpoint('Get All Custodial Notes', '/api/custodial-notes');
    
    // Test getting specific custodial note
    if (this.createdIds.custodialNote) {
      await this.testEndpoint(
        'Get Specific Custodial Note', 
        `/api/custodial-notes/${this.createdIds.custodialNote}`
      );
    }
  }

  // Room inspection endpoints
  async testRoomInspectionEndpoints() {
    this.log('=== Testing Room Inspection Endpoints ===');
    
    // Test creating room inspection if we have a building inspection ID
    if (this.testData.roomInspection.buildingInspectionId) {
      const roomResult = await this.testEndpoint(
        'Create Room Inspection', 
        '/api/room-inspections', 
        'POST', 
        this.testData.roomInspection
      );
      
      if (roomResult.success && roomResult.data.id) {
        this.createdIds.roomInspection = roomResult.data.id;
        this.log(`Created room inspection with ID: ${roomResult.data.id}`);
      }
    } else {
      this.log('⚠️ Skipping room inspection creation - no building inspection ID available', 'WARNING');
    }
    
    // Test getting all room inspections
    await this.testEndpoint('Get All Room Inspections', '/api/room-inspections');
    
    // Test getting room inspections with building ID if we have both IDs
    if (this.testData.roomInspection.buildingInspectionId) {
      await this.testEndpoint(
        'Get Room Inspections by Building ID', 
        `/api/room-inspections?buildingInspectionId=${this.testData.roomInspection.buildingInspectionId}`
      );
    }
    
    // Test getting specific room inspection if created
    if (this.createdIds.roomInspection) {
      await this.testEndpoint(
        'Get Specific Room Inspection', 
        `/api/room-inspections/${this.createdIds.roomInspection}`
      );
    }
    
    // Test getting rooms for specific building inspection
    if (this.testData.roomInspection.buildingInspectionId) {
      await this.testEndpoint(
        'Get Rooms for Building Inspection', 
        `/api/inspections/${this.testData.roomInspection.buildingInspectionId}/rooms`
      );
    }
  }

  // File upload testing
  async testFileUpload() {
    this.log('=== Testing File Upload Functionality ===');
    
    // Create a simple image buffer for testing (base64 encoded 1x1 pixel PNG)
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('images', imageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    
    // Test with single room inspection
    if (this.createdIds.singleInspection) {
      await this.testEndpoint(
        'Submit Room Inspection with Image', 
        `/api/inspections/${this.createdIds.singleInspection}/rooms/${this.createdIds.roomInspection || 1}/submit`, 
        'POST',
        formData
      );
    }
  }

  // Admin endpoints testing (will test with invalid credentials to verify protection)
  async testAdminEndpoints() {
    this.log('=== Testing Admin Endpoints ===');
    
    // Test admin login with invalid credentials (should fail)
    await this.testEndpoint(
      'Admin Login (Invalid)', 
      '/api/admin/login', 
      'POST', 
      { username: 'invalid', password: 'invalid' }
    );
    
    // Test admin endpoints without authentication (should fail)
    await this.testEndpoint(
      'Get Admin Inspections (No Auth)', 
      '/api/admin/inspections'
    );
    
    // Test admin endpoints with invalid token (should fail)
    await this.testEndpoint(
      'Get Admin Inspections (Invalid Token)', 
      '/api/admin/inspections',
      'GET',
      null,
      { 'Authorization': 'Bearer invalid-token' }
    );
  }

  // Object storage endpoints
  async testObjectStorage() {
    this.log('=== Testing Object Storage Endpoints ===');
    
    // Test getting non-existent object (should fail)
    await this.testEndpoint(
      'Get Non-existent Object', 
      '/objects/invalid-filename.jpg'
    );
  }

  // Error handling tests
  async testErrorHandling() {
    this.log('=== Testing Error Handling ===');
    
    // Test invalid inspection ID
    await this.testEndpoint(
      'Get Inspection with Invalid ID', 
      '/api/inspections/999999'
    );
    
    // Test invalid custodial note ID
    await this.testEndpoint(
      'Get Custodial Note with Invalid ID', 
      '/api/custodial-notes/999999'
    );
    
    // Test invalid room inspection ID
    await this.testEndpoint(
      'Get Room Inspection with Invalid ID', 
      '/api/room-inspections/999999'
    );
    
    // Test invalid ID for update
    await this.testEndpoint(
      'Update Inspection with Invalid ID', 
      '/api/inspections/999999', 
      'PATCH', 
      { notes: 'test' }
    );
    
    // Test invalid ID for delete
    await this.testEndpoint(
      'Delete Inspection with Invalid ID', 
      '/api/inspections/999999', 
      'DELETE'
    );
  }

  // Test the submit-building-inspection alias endpoint
  async testBuildingInspectionAlias() {
    this.log('=== Testing Building Inspection Alias Endpoint ===');
    
    const aliasData = {
      ...this.testData.buildingInspection,
      inspectorName: 'Alias Test Inspector'
    };
    
    await this.testEndpoint(
      'Submit Building Inspection (Alias Endpoint)', 
      '/api/submit-building-inspection', 
      'POST', 
      aliasData
    );
  }

  // Cleanup created test data
  async cleanupTestData() {
    this.log('=== Cleaning Up Test Data ===');
    
    if (this.createdIds.singleInspection) {
      await this.testEndpoint(
        'Delete Single Inspection (Cleanup)', 
        `/api/inspections/${this.createdIds.singleInspection}`, 
        'DELETE'
      );
    }
    
    if (this.createdIds.buildingInspection) {
      await this.testEndpoint(
        'Delete Building Inspection (Cleanup)', 
        `/api/inspections/${this.createdIds.buildingInspection}`, 
        'DELETE'
      );
    }
    
    if (this.createdIds.custodialNote) {
      await this.testEndpoint(
        'Delete Custodial Note (Cleanup)', 
        `/api/custodial-notes/${this.createdIds.custodialNote}`, 
        'DELETE'
      );
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive API Testing Suite');
    this.log(`Testing against: ${BASE_URL}`);
    
    await this.testHealthCheck();
    await this.testInspectionEndpoints();
    await this.testCustodialNotesEndpoints();
    await this.testRoomInspectionEndpoints();
    await this.testFileUpload();
    await this.testAdminEndpoints();
    await this.testObjectStorage();
    await this.testErrorHandling();
    await this.testBuildingInspectionAlias();
    
    // Cleanup at the end
    await this.cleanupTestData();
    
    this.log('=== COMPREHENSIVE TEST RESULTS SUMMARY ===');
    this.log(`Total Tests: ${this.passedTests + this.failedTests}`);
    this.log(`Passed: ${this.passedTests}`);
    this.log(`Failed: ${this.failedTests}`);
    this.log(`Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
    
    if (this.failedTests === 0) {
      this.log('🎉 ALL API TESTS PASSED!', 'SUCCESS');
    } else {
      this.log('⚠️ Some API tests failed. Check the logs above for details.', 'WARNING');
    }
  }
}

// Run the tests
const tester = new ComprehensiveAPITester();
tester.runAllTests().catch(console.error);