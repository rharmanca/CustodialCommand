#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Custodial Command Application
 * Tests all features, API endpoints, database operations, and data flow
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://cacustodialcommand.up.railway.app';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.png');

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
      timeout: 10000
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

// Create test image if it doesn't exist
function createTestImage() {
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    // Create a simple 1x1 PNG image
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc.
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // compressed data
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // end of data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
      0xAE, 0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(TEST_IMAGE_PATH, pngData);
    log('Created test image', 'info');
  }
}

// Test functions
async function testHealthCheck() {
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    const passed = response.status === 200 && 
                  response.data.status === 'ok' && 
                  response.data.database === 'connected';
    recordTest('Health Check', passed, 
      passed ? 'Server and database connected' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    recordTest('Health Check', false, error.message);
    return null;
  }
}

async function testBasicAPI() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/test`);
    const passed = response.status === 200 && response.data.message === 'API is working!';
    recordTest('Basic API Test', passed, 
      passed ? 'API responding correctly' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    recordTest('Basic API Test', false, error.message);
    return null;
  }
}

async function testGetInspections() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/inspections`);
    const passed = response.status === 200 && Array.isArray(response.data);
    recordTest('GET Inspections', passed, 
      passed ? `Retrieved ${response.data.length} inspections` : `Status: ${response.status}`);
    return response.data;
  } catch (error) {
    recordTest('GET Inspections', false, error.message);
    return [];
  }
}

async function testCreateInspection() {
  try {
    const inspectionData = {
      inspectorName: 'Test Inspector',
      school: 'Test School',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationDescription: 'Test Location',
      roomNumber: '101',
      locationCategory: 'classroom',
      buildingName: 'Test Building',
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
      notes: 'Test inspection created by automated test suite'
    };

    const response = await makeRequest(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      body: inspectionData
    });

    const passed = response.status === 201 && response.data.id;
    recordTest('Create Single Room Inspection', passed, 
      passed ? `Created inspection ID: ${response.data.id}` : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    recordTest('Create Single Room Inspection', false, error.message);
    return null;
  }
}

async function testCreateWholeBuildingInspection() {
  try {
    const inspectionData = {
      inspectorName: 'Test Inspector',
      school: 'Test School',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'whole_building',
      buildingName: 'Test Building',
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
      notes: 'Test whole building inspection',
      verifiedRooms: ['101', '102', '103']
    };

    const response = await makeRequest(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      body: inspectionData
    });

    const passed = response.status === 201 && response.data.id;
    recordTest('Create Whole Building Inspection', passed, 
      passed ? `Created inspection ID: ${response.data.id}` : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    recordTest('Create Whole Building Inspection', false, error.message);
    return null;
  }
}

async function testGetSpecificInspection(inspectionId) {
  if (!inspectionId) {
    recordTest('GET Specific Inspection', false, 'No inspection ID provided');
    return null;
  }

  try {
    const response = await makeRequest(`${BASE_URL}/api/inspections/${inspectionId}`);
    const passed = response.status === 200 && response.data.id === inspectionId;
    recordTest('GET Specific Inspection', passed, 
      passed ? `Retrieved inspection ${inspectionId}` : `Status: ${response.status}`);
    return response.data;
  } catch (error) {
    recordTest('GET Specific Inspection', false, error.message);
    return null;
  }
}

async function testGetCustodialNotes() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/custodial-notes`);
    const passed = response.status === 200 && Array.isArray(response.data);
    recordTest('GET Custodial Notes', passed, 
      passed ? `Retrieved ${response.data.length} custodial notes` : `Status: ${response.status}`);
    return response.data;
  } catch (error) {
    recordTest('GET Custodial Notes', false, error.message);
    return [];
  }
}

async function testCreateCustodialNote() {
  try {
    const noteData = {
      school: 'Test School',
      date: new Date().toISOString().split('T')[0],
      location: 'Test Location',
      locationDescription: 'Test Location Description',
      notes: 'Test custodial note created by automated test suite'
    };

    const response = await makeRequest(`${BASE_URL}/api/custodial-notes`, {
      method: 'POST',
      body: noteData
    });

    const passed = response.status === 201 && response.data.id;
    recordTest('Create Custodial Note', passed, 
      passed ? `Created note ID: ${response.data.id}` : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    recordTest('Create Custodial Note', false, error.message);
    return null;
  }
}

async function testCreateRoomInspection(buildingInspectionId) {
  if (!buildingInspectionId) {
    recordTest('Create Room Inspection', false, 'No building inspection ID provided');
    return null;
  }

  try {
    const roomData = {
      buildingInspectionId: buildingInspectionId.toString(),
      roomType: 'classroom',
      roomNumber: '201',
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
      notes: 'Test room inspection'
    };

    const response = await makeRequest(`${BASE_URL}/api/room-inspections`, {
      method: 'POST',
      body: roomData
    });

    const passed = response.status === 201 && response.data.id;
    recordTest('Create Room Inspection', passed, 
      passed ? `Created room inspection ID: ${response.data.id}` : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    recordTest('Create Room Inspection', false, error.message);
    return null;
  }
}

async function testAdminLogin() {
  try {
    const loginData = {
      username: 'admin',
      password: '7lGaEWFy3bDbL5NUAxg7zHihLQzWMBHfYu4O/THc3BM='
    };

    const response = await makeRequest(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      body: loginData
    });

    const passed = response.status === 200 && response.data.success;
    recordTest('Admin Login', passed, 
      passed ? 'Admin login successful' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    recordTest('Admin Login', false, error.message);
    return null;
  }
}

async function testFileUpload() {
  try {
    createTestImage();
    
    const FormData = require('form-data');
    const form = new FormData();
    form.append('images', fs.createReadStream(TEST_IMAGE_PATH), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    
    // Add required fields for inspection
    form.append('inspectorName', 'Test Inspector');
    form.append('school', 'Test School');
    form.append('date', new Date().toISOString().split('T')[0]);
    form.append('inspectionType', 'single_room');
    form.append('locationDescription', 'Test Location');
    form.append('roomNumber', '101');
    form.append('locationCategory', 'classroom');
    form.append('buildingName', 'Test Building');
    form.append('floors', '4');
    form.append('verticalHorizontalSurfaces', '4');
    form.append('ceiling', '4');
    form.append('restrooms', '4');
    form.append('customerSatisfaction', '4');
    form.append('trash', '4');
    form.append('projectCleaning', '4');
    form.append('activitySupport', '4');
    form.append('safetyCompliance', '4');
    form.append('equipment', '4');
    form.append('monitoring', '4');
    form.append('notes', 'Test inspection with image upload');

    const response = await new Promise((resolve, reject) => {
      const isHttps = BASE_URL.startsWith('https://');
      const client = isHttps ? https : http;
      
      const url = new URL(`${BASE_URL}/api/inspections`);
      const options = {
        method: 'POST',
        headers: form.getHeaders(),
        timeout: 15000
      };

      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Upload timeout')));
      
      form.pipe(req);
    });

    const passed = response.status === 201 && response.data.id;
    recordTest('File Upload with Inspection', passed, 
      passed ? `Created inspection with image ID: ${response.data.id}` : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    recordTest('File Upload with Inspection', false, error.message);
    return null;
  }
}

async function testFileServing() {
  try {
    // Create a test image and upload it
    createTestImage();
    
    const FormData = require('form-data');
    const form = new FormData();
    form.append('images', fs.createReadStream(TEST_IMAGE_PATH), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    
    // Add required fields for inspection
    form.append('inspectorName', 'Test Inspector');
    form.append('school', 'Test School');
    form.append('date', new Date().toISOString().split('T')[0]);
    form.append('inspectionType', 'single_room');
    form.append('locationDescription', 'Test Location');
    form.append('roomNumber', '101');
    form.append('locationCategory', 'classroom');
    form.append('buildingName', 'Test Building');
    form.append('floors', '4');
    form.append('verticalHorizontalSurfaces', '4');
    form.append('ceiling', '4');
    form.append('restrooms', '4');
    form.append('customerSatisfaction', '4');
    form.append('trash', '4');
    form.append('projectCleaning', '4');
    form.append('activitySupport', '4');
    form.append('safetyCompliance', '4');
    form.append('equipment', '4');
    form.append('monitoring', '4');
    form.append('notes', 'Test inspection for file serving');

    const uploadResponse = await new Promise((resolve, reject) => {
      const isHttps = BASE_URL.startsWith('https://');
      const client = isHttps ? https : http;
      
      const url = new URL(`${BASE_URL}/api/inspections`);
      const options = {
        method: 'POST',
        headers: form.getHeaders(),
        timeout: 15000
      };

      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Upload timeout')));
      
      form.pipe(req);
    });

    if (uploadResponse.status !== 201) {
      recordTest('File Serving', false, `Upload failed with status ${uploadResponse.status}: ${JSON.stringify(uploadResponse.data)}`);
      return null;
    }

    // The response should contain the inspection data with images
    // Let's get the inspection by ID to get the images
    const inspectionId = uploadResponse.data.id;
    const inspectionResponse = await makeRequest(`${BASE_URL}/api/inspections/${inspectionId}`);
    
    if (inspectionResponse.status !== 200 || !inspectionResponse.data.images || inspectionResponse.data.images.length === 0) {
      recordTest('File Serving', false, 'Failed to retrieve inspection with image');
      return null;
    }

    const imageUrl = inspectionResponse.data.images[0];
    const filename = imageUrl.split('/').pop();
    
    const response = await makeRequest(`${BASE_URL}/uploads/${filename}`);
    const passed = response.status === 200 && response.headers['content-type']?.includes('image');
    recordTest('File Serving', passed, 
      passed ? `Successfully served image: ${filename}` : `Status: ${response.status}, Content-Type: ${response.headers['content-type']}`);
    return response.data;
  } catch (error) {
    recordTest('File Serving', false, error.message);
    return null;
  }
}

async function testFrontendPages() {
  const pages = [
    { name: 'Home Page', path: '/' },
    { name: 'Custodial Inspection', path: '/custodial-inspection' },
    { name: 'Whole Building Inspection', path: '/whole-building-inspection' },
    { name: 'Custodial Notes', path: '/custodial-notes' },
    { name: 'Inspection Data', path: '/inspection-data' },
    { name: 'Admin Inspections', path: '/admin-inspections' },
    { name: 'Rating Criteria', path: '/rating-criteria' }
  ];

  for (const page of pages) {
    try {
      const response = await makeRequest(`${BASE_URL}${page.path}`);
      const passed = response.status === 200 && response.data.includes('<!DOCTYPE html>');
      recordTest(`Frontend Page: ${page.name}`, passed, 
        passed ? `Page loads successfully` : `Status: ${response.status}`);
    } catch (error) {
      recordTest(`Frontend Page: ${page.name}`, false, error.message);
    }
  }
}

async function testDatabaseConsistency() {
  try {
    // Get all inspections and custodial notes
    const [inspections, notes] = await Promise.all([
      makeRequest(`${BASE_URL}/api/inspections`),
      makeRequest(`${BASE_URL}/api/custodial-notes`)
    ]);

    const inspectionsValid = inspections.status === 200 && Array.isArray(inspections.data);
    const notesValid = notes.status === 200 && Array.isArray(notes.data);

    // Check data structure consistency
    let dataStructureValid = true;
    let structureDetails = '';

    if (inspectionsValid && inspections.data.length > 0) {
      const inspection = inspections.data[0];
      const requiredFields = ['id', 'inspectorName', 'school', 'date', 'inspectionType'];
      const missingFields = requiredFields.filter(field => !(field in inspection));
      
      if (missingFields.length > 0) {
        dataStructureValid = false;
        structureDetails += `Missing inspection fields: ${missingFields.join(', ')}. `;
      }
    }

    if (notesValid && notes.data.length > 0) {
      const note = notes.data[0];
      const requiredFields = ['id', 'school', 'date', 'location', 'notes'];
      const missingFields = requiredFields.filter(field => !(field in note));
      
      if (missingFields.length > 0) {
        dataStructureValid = false;
        structureDetails += `Missing note fields: ${missingFields.join(', ')}. `;
      }
    }

    const passed = inspectionsValid && notesValid && dataStructureValid;
    recordTest('Database Consistency', passed, 
      passed ? `Inspections: ${inspections.data.length}, Notes: ${notes.data.length}` : structureDetails);
    
    return { inspections: inspections.data, notes: notes.data };
  } catch (error) {
    recordTest('Database Consistency', false, error.message);
    return { inspections: [], notes: [] };
  }
}

// Main test runner
async function runComprehensiveTests() {
  log('🚀 Starting Comprehensive Test Suite for Custodial Command', 'info');
  log(`📍 Testing against: ${BASE_URL}`, 'info');
  log('', 'info');

  // Test 1: Basic connectivity and health
  log('📋 Phase 1: Basic Connectivity Tests', 'info');
  const healthData = await testHealthCheck();
  await testBasicAPI();
  log('', 'info');

  // Test 2: API endpoints
  log('📋 Phase 2: API Endpoint Tests', 'info');
  const existingInspections = await testGetInspections();
  const existingNotes = await testGetCustodialNotes();
  log('', 'info');

  // Test 3: Data creation
  log('📋 Phase 3: Data Creation Tests', 'info');
  const singleInspection = await testCreateInspection();
  const wholeBuildingInspection = await testCreateWholeBuildingInspection();
  const custodialNote = await testCreateCustodialNote();
  
  if (wholeBuildingInspection) {
    await testCreateRoomInspection(wholeBuildingInspection.id);
  }
  log('', 'info');

  // Test 4: Data retrieval
  log('📋 Phase 4: Data Retrieval Tests', 'info');
  if (singleInspection) {
    await testGetSpecificInspection(singleInspection.id);
  }
  log('', 'info');

  // Test 5: File operations
  log('📋 Phase 5: File Operations Tests', 'info');
  await testFileServing();
  log('', 'info');

  // Test 6: Admin features
  log('📋 Phase 6: Admin Features Tests', 'info');
  await testAdminLogin();
  log('', 'info');

  // Test 7: Frontend pages
  log('📋 Phase 7: Frontend Page Tests', 'info');
  await testFrontendPages();
  log('', 'info');

  // Test 8: Database consistency
  log('📋 Phase 8: Database Consistency Tests', 'info');
  await testDatabaseConsistency();
  log('', 'info');

  // Generate report
  generateTestReport();
}

function generateTestReport() {
  log('📊 Test Results Summary', 'info');
  log('=' * 50, 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info');
  log('', 'info');

  if (testResults.failed > 0) {
    log('❌ Failed Tests:', 'error');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => log(`  - ${test.testName}: ${test.details}`, 'error'));
    log('', 'info');
  }

  log('✅ All Tests Completed', 'success');
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: (testResults.passed / testResults.total) * 100
    },
    details: testResults.details
  }, null, 2));
  
  log(`📄 Detailed report saved to: ${reportPath}`, 'info');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    log(`💥 Test suite failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveTests,
  testResults
};
