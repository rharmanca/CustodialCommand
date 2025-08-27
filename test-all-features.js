
import express from('express');
import fetch from('node-fetch');

// Test configuration
const BASE_URL = 'http://0.0.0.0:5000';
const TEST_TIMEOUT = 30000;

class FeatureTester {
  constructor() {
    this.results = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${status}: ${message}`;
    console.log(logMessage);
    this.results.push({ timestamp, status, message });
  }

  async testEndpoint(name, path, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      };
      
      if (body) options.body = JSON.stringify(body);
      
      const response = await fetch(`${BASE_URL}${path}`, options);
      const responseTime = Date.now();
      
      if (response.ok) {
        await this.log(`✅ ${name} - Status: ${response.status} - Response time: ${responseTime}ms`, 'PASS');
        this.passedTests++;
        return true;
      } else {
        await this.log(`❌ ${name} - Status: ${response.status}`, 'FAIL');
        this.failedTests++;
        return false;
      }
    } catch (error) {
      await this.log(`❌ ${name} - Error: ${error.message}`, 'FAIL');
      this.failedTests++;
      return false;
    }
  }

  async testDatabaseOperations() {
    await this.log('=== Testing Database Operations ===');
    
    // Test creating a single room inspection (matching current schema)
    const testSingleInspection = {
      inspectorName: 'Test Inspector',
      school: 'ASA',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationDescription: 'Test Location',
      roomNumber: 'TEST-101',
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
      notes: 'Test inspection created by automated test',
      images: []
    };

    await this.testEndpoint('Create Single Inspection', '/api/inspections', 'POST', testSingleInspection);
    
    // Test creating a whole building inspection
    const testBuildingInspection = {
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

    await this.testEndpoint('Create Building Inspection', '/api/inspections', 'POST', testBuildingInspection);
    await this.testEndpoint('Get All Inspections', '/api/inspections');
    
    // Test whole building inspection
    const buildingInspection = {
      school: 'Test Building School',
      inspection_type: 'building',
      total_rooms: 5,
      verified_rooms: ['101', '102'],
      floors: 4,
      vertical_horizontal_surfaces: 5,
      ceiling: 4,
      restrooms: 5,
      customer_satisfaction: 4,
      trash: 5,
      project_cleaning: 4,
      activity_support: 5,
      safety: 4,
      equipment: 5,
      monitoring: 4,
      concerns: 'Building inspection test'
    };

    await this.testEndpoint('Create Building Inspection', '/api/inspections', 'POST', buildingInspection);
    
    // Test custodial notes
    const testNote = {
      school: 'Test School',
      room_number: 'NOTE-TEST',
      category: 'General',
      concerns: 'This is a test note from automated testing',
      priority: 'medium'
    };

    await this.testEndpoint('Create Custodial Note', '/api/custodial-notes', 'POST', testNote);
    await this.testEndpoint('Get Custodial Notes', '/api/custodial-notes');
  }

  async testAPIEndpoints() {
    await this.log('=== Testing API Endpoints ===');
    
    // Core API endpoints
    await this.testEndpoint('Health Check', '/health');
    await this.testEndpoint('Metrics', '/metrics');
    await this.testEndpoint('Get Inspections', '/api/inspections');
    await this.testEndpoint('Get Room Inspections', '/api/room-inspections');
    await this.testEndpoint('Get Custodial Notes', '/api/custodial-notes');
  }

  async testFrontendPages() {
    await this.log('=== Testing Frontend Pages ===');
    
    // Test main application pages
    await this.testEndpoint('Main App', '/');
    await this.testEndpoint('Custodial Inspection Page', '/?page=custodial-inspection');
    await this.testEndpoint('Whole Building Inspection', '/?page=whole-building-inspection');
    await this.testEndpoint('Rating Criteria', '/?page=rating-criteria');
    await this.testEndpoint('Inspection Data', '/?page=inspection-data');
    await this.testEndpoint('Custodial Notes', '/?page=custodial-notes');
    await this.testEndpoint('Admin Inspections', '/?page=admin-inspections');
  }

  async testValidationFunctions() {
    await this.log('=== Testing Validation Functions ===');
    
    // Test with invalid data
    const invalidInspection = {
      school: '', // Empty school name
      room_number: '',
      floors: 10, // Invalid rating (should be 1-5)
      inspection_type: 'invalid_type'
    };

    const response = await this.testEndpoint('Validation Test (Should Fail)', '/api/inspections', 'POST', invalidInspection);
    if (!response) {
      await this.log('✅ Validation correctly rejected invalid data', 'PASS');
      this.passedTests++;
    } else {
      await this.log('❌ Validation failed to reject invalid data', 'FAIL');
      this.failedTests++;
    }
  }

  async testSecurityFeatures() {
    await this.log('=== Testing Security Features ===');
    
    // Test rate limiting (make multiple rapid requests)
    const rateLimitPromises = [];
    for (let i = 0; i < 20; i++) {
      rateLimitPromises.push(fetch(`${BASE_URL}/api/inspections`));
    }
    
    try {
      const responses = await Promise.all(rateLimitPromises);
      const rateLimited = responses.some(res => res.status === 429);
      
      if (rateLimited) {
        await this.log('✅ Rate limiting is working', 'PASS');
        this.passedTests++;
      } else {
        await this.log('⚠️  Rate limiting may not be configured', 'WARN');
      }
    } catch (error) {
      await this.log(`⚠️  Rate limit test error: ${error.message}`, 'WARN');
    }

    // Test security headers
    try {
      const response = await fetch(`${BASE_URL}/`);
      const hasSecurityHeaders = response.headers.get('x-frame-options') || 
                                response.headers.get('x-content-type-options');
      
      if (hasSecurityHeaders) {
        await this.log('✅ Security headers present', 'PASS');
        this.passedTests++;
      } else {
        await this.log('⚠️  Security headers may be missing', 'WARN');
      }
    } catch (error) {
      await this.log(`❌ Security header test failed: ${error.message}`, 'FAIL');
      this.failedTests++;
    }
  }

  async testPerformance() {
    await this.log('=== Testing Performance ===');
    
    const startTime = Date.now();
    
    // Test multiple concurrent requests
    const concurrentPromises = [];
    for (let i = 0; i < 10; i++) {
      concurrentPromises.push(fetch(`${BASE_URL}/api/inspections`));
    }
    
    try {
      await Promise.all(concurrentPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      if (totalTime < 5000) {
        await this.log(`✅ Performance test passed - ${totalTime}ms for 10 concurrent requests`, 'PASS');
        this.passedTests++;
      } else {
        await this.log(`⚠️  Performance test slow - ${totalTime}ms for 10 concurrent requests`, 'WARN');
      }
    } catch (error) {
      await this.log(`❌ Performance test failed: ${error.message}`, 'FAIL');
      this.failedTests++;
    }
  }

  async testPWAFeatures() {
    await this.log('=== Testing PWA Features ===');
    
    await this.testEndpoint('PWA Manifest', '/manifest.json');
    await this.testEndpoint('Service Worker', '/sw.js');
    await this.testEndpoint('PWA Icon 192', '/icon-192x192.svg');
    await this.testEndpoint('PWA Icon 512', '/icon-512x512.svg');
  }

  async runAllTests() {
    await this.log('🚀 Starting Comprehensive Feature Test Suite');
    await this.log(`Testing application at: ${BASE_URL}`);
    
    const startTime = Date.now();
    
    try {
      // Wait for server to be ready
      await this.log('Waiting for server to be ready...');
      let serverReady = false;
      let attempts = 0;
      
      while (!serverReady && attempts < 10) {
        try {
          const response = await fetch(`${BASE_URL}/health`, { timeout: 2000 });
          if (response.ok) {
            serverReady = true;
            await this.log('✅ Server is ready');
          }
        } catch (error) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (!serverReady) {
        await this.log('❌ Server is not responding. Please start the application first.', 'FAIL');
        return;
      }

      // Run all test suites
      await this.testAPIEndpoints();
      await this.testFrontendPages();
      await this.testDatabaseOperations();
      await this.testValidationFunctions();
      await this.testSecurityFeatures();
      await this.testPerformance();
      await this.testPWAFeatures();

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      await this.log('=== TEST SUMMARY ===');
      await this.log(`Total Tests: ${this.passedTests + this.failedTests}`);
      await this.log(`Passed: ${this.passedTests}`);
      await this.log(`Failed: ${this.failedTests}`);
      await this.log(`Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(2)}%`);
      await this.log(`Total Time: ${totalTime}ms`);

      if (this.failedTests === 0) {
        await this.log('🎉 All tests passed! Your application is working correctly.', 'SUCCESS');
      } else {
        await this.log(`⚠️  ${this.failedTests} tests failed. Please review the issues above.`, 'WARNING');
      }

    } catch (error) {
      await this.log(`❌ Test suite failed: ${error.message}`, 'FAIL');
    }
  }
}

// Run the tests
const tester = new FeatureTester();
tester.runAllTests().catch(console.error);
