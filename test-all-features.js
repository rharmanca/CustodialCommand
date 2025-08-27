
import express from 'express';
import fetch from 'node-fetch';

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
      notes: 'Test building inspection',
      images: []
    };

    await this.testEndpoint('Create Building Inspection', '/api/inspections', 'POST', testBuildingInspection);
  }

  async testAPIEndpoints() {
    await this.log('=== Testing API Endpoints ===');
    
    await this.testEndpoint('Health Check', '/health');
    await this.testEndpoint('Get Inspections', '/api/inspections');
    await this.testEndpoint('Get Custodial Notes', '/api/custodial-notes');
  }

  async runAllTests() {
    await this.log('🚀 Starting Comprehensive Feature Testing');
    await this.log(`Testing against: ${BASE_URL}`);
    
    await this.testAPIEndpoints();
    await this.testDatabaseOperations();
    
    await this.log('=== TEST RESULTS SUMMARY ===');
    await this.log(`Total Tests: ${this.passedTests + this.failedTests}`);
    await this.log(`Passed: ${this.passedTests}`);
    await this.log(`Failed: ${this.failedTests}`);
    await this.log(`Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
    
    if (this.failedTests === 0) {
      await this.log('🎉 ALL TESTS PASSED!', 'SUCCESS');
    } else {
      await this.log('⚠️ Some tests failed. Check the logs above for details.', 'WARNING');
    }
  }
}

// Run the tests
const tester = new FeatureTester();
tester.runAllTests().catch(console.error);
