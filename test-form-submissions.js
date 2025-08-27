import fetch from 'node-fetch';

const BASE_URL = 'http://0.0.0.0:5000';

class FormSubmissionTester {
  constructor() {
    this.results = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${status}: ${message}`;
    console.log(logMessage);
    this.results.push({ timestamp, status, message });
  }

  async testHealthCheck() {
    this.log('=== Testing Server Health ===');
    
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        this.log(`✅ Health check passed - Status: ${response.status}`, 'PASS');
        this.log(`Server info: ${JSON.stringify(data)}`, 'INFO');
        this.passedTests++;
        return true;
      } else {
        this.log(`❌ Health check failed - Status: ${response.status}`, 'FAIL');
        this.failedTests++;
        return false;
      }
    } catch (error) {
      this.log(`❌ Health check error: ${error.message}`, 'FAIL');
      this.failedTests++;
      return false;
    }
  }

  async testSingleRoomInspection() {
    this.log('=== Testing Single Room Inspection Submission ===');
    
    const testData = {
      inspectorName: 'Form Test Inspector',
      school: 'ASA',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationDescription: 'Test Classroom',
      roomNumber: 'FORM-TEST-101',
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
      notes: 'Form submission test - single room inspection',
      images: []
    };

    try {
      this.log('Sending single room inspection data...');
      const response = await fetch(`${BASE_URL}/api/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      if (response.ok) {
        this.log(`✅ Single room inspection submitted successfully - Status: ${response.status}`, 'PASS');
        this.log(`Response: ${JSON.stringify(responseData)}`, 'INFO');
        this.passedTests++;
        return responseData;
      } else {
        this.log(`❌ Single room inspection failed - Status: ${response.status}`, 'FAIL');
        this.log(`Error: ${JSON.stringify(responseData)}`, 'ERROR');
        this.failedTests++;
        return null;
      }
    } catch (error) {
      this.log(`❌ Single room inspection error: ${error.message}`, 'FAIL');
      this.failedTests++;
      return null;
    }
  }

  async testBuildingInspection() {
    this.log('=== Testing Building Inspection Submission ===');
    
    const testData = {
      inspectorName: 'Form Test Inspector',
      school: 'LCA',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'whole_building',
      locationDescription: 'Whole Building Test',
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
      notes: 'Form submission test - building inspection',
      images: []
    };

    try {
      this.log('Sending building inspection data...');
      const response = await fetch(`${BASE_URL}/api/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      if (response.ok) {
        this.log(`✅ Building inspection submitted successfully - Status: ${response.status}`, 'PASS');
        this.log(`Response: ${JSON.stringify(responseData)}`, 'INFO');
        this.passedTests++;
        return responseData;
      } else {
        this.log(`❌ Building inspection failed - Status: ${response.status}`, 'FAIL');
        this.log(`Error: ${JSON.stringify(responseData)}`, 'ERROR');
        this.failedTests++;
        return null;
      }
    } catch (error) {
      this.log(`❌ Building inspection error: ${error.message}`, 'FAIL');
      this.failedTests++;
      return null;
    }
  }

  async testCustodialNotes() {
    this.log('=== Testing Custodial Notes Submission ===');
    
    const testData = {
      school: 'GWC',
      date: new Date().toISOString().split('T')[0],
      location: 'Test Location',
      locationDescription: 'Form Test Area',
      notes: 'Form submission test - custodial note'
    };

    try {
      this.log('Sending custodial note data...');
      const response = await fetch(`${BASE_URL}/api/custodial-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      if (response.ok) {
        this.log(`✅ Custodial note submitted successfully - Status: ${response.status}`, 'PASS');
        this.log(`Response: ${JSON.stringify(responseData)}`, 'INFO');
        this.passedTests++;
        return responseData;
      } else {
        this.log(`❌ Custodial note failed - Status: ${response.status}`, 'FAIL');
        this.log(`Error: ${JSON.stringify(responseData)}`, 'ERROR');
        this.failedTests++;
        return null;
      }
    } catch (error) {
      this.log(`❌ Custodial note error: ${error.message}`, 'FAIL');
      this.failedTests++;
      return null;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Form Submission Test Suite');
    this.log(`Testing against: ${BASE_URL}`);
    
    // Test server health first
    const healthOk = await this.testHealthCheck();
    
    if (!healthOk) {
      this.log('❌ Server health check failed. Stopping tests.', 'ERROR');
      return;
    }
    
    // Test all form submissions
    await this.testSingleRoomInspection();
    await this.testBuildingInspection();
    await this.testCustodialNotes();
    
    // Summary
    this.log('=== TEST RESULTS SUMMARY ===');
    this.log(`Total Tests: ${this.passedTests + this.failedTests}`);
    this.log(`Passed: ${this.passedTests}`);
    this.log(`Failed: ${this.failedTests}`);
    this.log(`Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
    
    if (this.failedTests === 0) {
      this.log('🎉 ALL FORM SUBMISSION TESTS PASSED!', 'SUCCESS');
    } else {
      this.log('⚠️ Some form submission tests failed. Check the logs above.', 'WARNING');
    }
  }
}

// Run the tests
const tester = new FormSubmissionTester();
tester.runAllTests().catch(console.error);
