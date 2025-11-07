#!/usr/bin/env node

/**
 * Comprehensive API Tests for Custodial Command
 * Tests core API functionality, CRUD operations, and basic connectivity
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

// Test results tracking
const testResults = {
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

function recordTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    testResults.failed++;
    log(`FAIL: ${testName} - ${details}`, 'error');
  }
  testResults.details.push({ testName, passed, details });
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

// Test 1: API Health Check
async function testApiHealth() {
  log('🔍 Testing API Health Check', 'info');
  
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    
    if (response.status === 200 && response.data && response.data.status !== 'error') {
      recordTest('API Health Check', true, `Status: ${response.data.status || 'OK'}`);
    } else {
      recordTest('API Health Check', false, `Status: ${response.status} - Database: ${response.data?.database || 'unknown'}`);
    }
  } catch (error) {
    recordTest('API Health Check', false, error.message);
  }
}

// Test 2: Create Inspection
async function testCreateInspection() {
  log('🔍 Testing Create Inspection', 'info');
  
  try {
    const inspectionData = {
      inspectorName: 'Test Inspector',
      school: 'Test School',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationDescription: 'Test Location',
      roomNumber: 'T101',
      locationCategory: 'classroom',
      buildingName: 'Test Building',
      floors: 2,
      verticalHorizontalSurfaces: 4,
      ceiling: 4,
      restrooms: 2,
      customerSatisfaction: 4,
      trash: 4,
      projectCleaning: 4,
      activitySupport: 4,
      safetyCompliance: 4,
      equipment: 4,
      monitoring: 4,
      notes: 'Test inspection creation'
    };

    const response = await makeRequest(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      body: inspectionData
    });
    
    if (response.status === 201 && response.data && response.data.id) {
      recordTest('Create Inspection', true, `Created ID: ${response.data.id}`);
    } else {
      recordTest('Create Inspection', false, `Status: ${response.status}`);
    }
  } catch (error) {
    recordTest('Create Inspection', false, error.message);
  }
}

// Test 3: Get Inspection
async function testGetInspection() {
  log('🔍 Testing Get Inspection', 'info');
  
  try {
    // First create an inspection to get
    const createResponse = await makeRequest(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      body: {
        inspectorName: 'Test Inspector',
        school: 'Test School',
        inspectionType: 'single_room',
        roomNumber: 'T101'
      }
    });
    
    if (createResponse.status !== 201 || !createResponse.data || !createResponse.data.id) {
      recordTest('Get Inspection - Setup', false, 'Failed to create test inspection');
      return;
    }
    
    const inspectionId = createResponse.data.id;
    
    // Now retrieve it
    const getResponse = await makeRequest(`${BASE_URL}/api/inspections/${inspectionId}`);
    
    if (getResponse.status === 200 && getResponse.data && getResponse.data.id === inspectionId) {
      recordTest('Get Inspection', true, `Retrieved ID: ${inspectionId}`);
    } else {
      recordTest('Get Inspection', false, `Status: ${getResponse.status}`);
    }
  } catch (error) {
    recordTest('Get Inspection', false, error.message);
  }
}

// Test 4: Update Inspection
async function testUpdateInspection() {
  log('🔍 Testing Update Inspection', 'info');
  
  try {
    // Create an inspection first
    const createResponse = await makeRequest(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      body: {
        inspectorName: 'Test Inspector',
        school: 'Test School',
        inspectionType: 'single_room',
        roomNumber: 'T101'
      }
    });
    
    if (createResponse.status !== 201 || !createResponse.data || !createResponse.data.id) {
      recordTest('Update Inspection - Setup', false, 'Failed to create test inspection');
      return;
    }
    
    const inspectionId = createResponse.data.id;
    
    // Update it
    const updateResponse = await makeRequest(`${BASE_URL}/api/inspections/${inspectionId}`, {
      method: 'PATCH',
      body: { isCompleted: true, notes: 'Updated test inspection' }
    });
    
    if (updateResponse.status === 200) {
      recordTest('Update Inspection', true, `Updated ID: ${inspectionId}`);
    } else {
      recordTest('Update Inspection', false, `Status: ${updateResponse.status}`);
    }
    
    // Small delay to ensure database consistency before delete test
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    recordTest('Update Inspection', false, error.message);
  }
}

// Test 5: Delete Inspection
async function testDeleteInspection() {
  log('🔍 Testing Delete Inspection', 'info');
  
  try {
    // Create an inspection first
    const createResponse = await makeRequest(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      body: {
        inspectorName: 'Test Inspector',
        school: 'Test School',
        inspectionType: 'single_room',
        roomNumber: 'T101'
      }
    });
    
    if (createResponse.status !== 201 || !createResponse.data || !createResponse.data.id) {
      recordTest('Delete Inspection - Setup', false, 'Failed to create test inspection');
      return;
    }
    
    const inspectionId = createResponse.data.id;
    
    // Small delay to ensure database consistency before delete test
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify inspection exists before attempting delete
    log(`Verifying inspection ${inspectionId} exists before delete...`, 'info');
    const verifyResponse = await makeRequest(`${BASE_URL}/api/inspections/${inspectionId}`);
    
    if (verifyResponse.status === 200 && verifyResponse.data && verifyResponse.data.id === inspectionId) {
      log(`Inspection ${inspectionId} verified to exist`, 'success');
      
      // Additional delay to ensure database is fully ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Delete it
      log(`Attempting to delete inspection ${inspectionId}...`, 'info');
      const deleteResponse = await makeRequest(`${BASE_URL}/api/inspections/${inspectionId}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.status === 200 || deleteResponse.status === 204) {
        recordTest('Delete Inspection', true, `Deleted ID: ${inspectionId}`);
      } else {
        recordTest('Delete Inspection', false, `Status: ${deleteResponse.status} - Data: ${JSON.stringify(deleteResponse.data)}`);
      }
    } else {
      recordTest('Delete Inspection', false, `Inspection ${inspectionId} not found for delete - Status: ${verifyResponse.status}`);
    }
  } catch (error) {
    recordTest('Delete Inspection', false, error.message);
  }
}

// Test 6: List Inspections
async function testListInspections() {
  log('🔍 Testing List Inspections', 'info');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/inspections`);
    
    if (response.status === 200 && Array.isArray(response.data)) {
      recordTest('List Inspections', true, `Found ${response.data.length} inspections`);
    } else {
      recordTest('List Inspections', false, `Status: ${response.status}`);
    }
  } catch (error) {
    recordTest('List Inspections', false, error.message);
  }
}

// Main test runner
async function runComprehensiveTests() {
  logHeader('COMPREHENSIVE API TESTS');
  log('Description: Core API functionality, CRUD operations, and basic connectivity', 'info');
  
  const startTime = new Date();
  
  // Wait for server to be ready
  console.log('⏳ Waiting for server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Run all tests
  
  // Run all tests
  await testApiHealth();
  await testCreateInspection();
  await testGetInspection();
  await testUpdateInspection();
  await testDeleteInspection();
  await testListInspections();
  
  const endTime = new Date();
  const duration = endTime - startTime;
  const successRate = testResults.total > 0 ? (testResults.passed / testResults.total) * 100 : 0;
  
  // Display results
  log(`\nTests: ${testResults.passed}/${testResults.total} (${successRate.toFixed(1)}%)`, successRate >= 80 ? 'success' : 'error');
  log(`Duration: ${(duration / 1000).toFixed(1)}s`, 'info');
  
  if (testResults.failed > 0) {
    log('\nFailed Tests:', 'error');
    testResults.details.filter(test => !test.passed).forEach(test => {
      log(`  - ${test.testName}: ${test.details}`, 'error');
    });
  }
  
  // Save test report
  const reportPath = path.join(__dirname, 'test-report.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    duration: duration,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: successRate
    },
    results: testResults.details
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log(`\n📄 Test report saved to: ${reportPath}`, 'info');
  
  return successRate >= 80;
}

function logHeader(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Test suite failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveTests,
  testResults
};