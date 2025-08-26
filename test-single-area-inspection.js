
const BASE_URL = 'http://0.0.0.0:5000';

// Test utilities
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testApiEndpoint(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.text();
    
    return {
      status: response.status,
      ok: response.ok,
      data: responseData ? JSON.parse(responseData) : null
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Test data generators
function createValidInspectionData() {
  return {
    school: 'ASA',
    date: new Date().toISOString().split('T')[0],
    inspectionType: 'single_room',
    locationDescription: 'Main Building, Second Floor',
    roomNumber: 'TEST-101',
    locationCategory: 'classroom',
    floors: 4,
    verticalHorizontalSurfaces: 5,
    ceiling: 3,
    restrooms: 4,
    customerSatisfaction: 5,
    trash: 3,
    projectCleaning: 4,
    activitySupport: 5,
    safetyCompliance: 4,
    equipment: 3,
    monitoring: 4,
    notes: 'Test inspection with all fields filled',
    images: []
  };
}

function createMinimalInspectionData() {
  return {
    school: 'LCA',
    date: new Date().toISOString().split('T')[0],
    inspectionType: 'single_room',
    locationDescription: 'Test Location',
    roomNumber: 'MIN-001',
    locationCategory: 'classroom',
    floors: 0,
    verticalHorizontalSurfaces: 0,
    ceiling: 0,
    restrooms: 0,
    customerSatisfaction: 0,
    trash: 0,
    projectCleaning: 0,
    activitySupport: 0,
    safetyCompliance: 0,
    equipment: 0,
    monitoring: 0,
    notes: '',
    images: []
  };
}

function createIncompleteInspectionData() {
  return {
    school: 'GWC',
    date: new Date().toISOString().split('T')[0],
    inspectionType: 'single_room',
    locationDescription: 'Incomplete Test',
    // Missing roomNumber
    locationCategory: 'cafeteria',
    floors: 3,
    verticalHorizontalSurfaces: 4,
    // Missing some ratings
    notes: 'Incomplete test data',
    images: []
  };
}

// Test functions
async function testValidSubmission() {
  console.log('\n🧪 Testing Valid Submission...');
  const data = createValidInspectionData();
  
  console.log('Data being submitted:', JSON.stringify(data, null, 2));
  
  const result = await testApiEndpoint('/api/inspections', 'POST', data);
  
  if (result.ok) {
    console.log('✅ Valid submission successful');
    console.log('Response:', result.data);
    return result.data;
  } else {
    console.log('❌ Valid submission failed');
    console.log('Status:', result.status);
    console.log('Response:', result.data);
    return null;
  }
}

async function testMinimalSubmission() {
  console.log('\n🧪 Testing Minimal Data Submission...');
  const data = createMinimalInspectionData();
  
  const result = await testApiEndpoint('/api/inspections', 'POST', data);
  
  if (result.ok) {
    console.log('✅ Minimal submission successful');
    console.log('Response:', result.data);
    return result.data;
  } else {
    console.log('❌ Minimal submission failed');
    console.log('Status:', result.status);
    console.log('Response:', result.data);
    return null;
  }
}

async function testIncompleteSubmission() {
  console.log('\n🧪 Testing Incomplete Data Submission...');
  const data = createIncompleteInspectionData();
  
  const result = await testApiEndpoint('/api/inspections', 'POST', data);
  
  if (!result.ok && result.status >= 400) {
    console.log('✅ Incomplete submission properly rejected');
    console.log('Status:', result.status);
    console.log('Response:', result.data);
    return true;
  } else {
    console.log('❌ Incomplete submission should have been rejected');
    console.log('Status:', result.status);
    console.log('Response:', result.data);
    return false;
  }
}

async function testAllSchools() {
  console.log('\n🧪 Testing All School Options...');
  const schools = ['ASA', 'LCA', 'GWC', 'OA', 'CBR', 'WLC'];
  const results = [];
  
  for (const school of schools) {
    console.log(`Testing school: ${school}`);
    const data = createValidInspectionData();
    data.school = school;
    data.roomNumber = `${school}-TEST-001`;
    
    const result = await testApiEndpoint('/api/inspections', 'POST', data);
    results.push({ school, success: result.ok, status: result.status });
    
    if (result.ok) {
      console.log(`✅ ${school} submission successful`);
    } else {
      console.log(`❌ ${school} submission failed: ${result.status}`);
    }
    
    await delay(100); // Small delay between requests
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 School test results: ${successCount}/${schools.length} successful`);
  return results;
}

async function testAllLocationCategories() {
  console.log('\n🧪 Testing All Location Categories...');
  const categories = [
    'exterior', 'gym_bleachers', 'classroom', 'cafeteria',
    'utility_storage', 'admin_office', 'hallway', 'stairwell',
    'restroom', 'staff_single_restroom'
  ];
  const results = [];
  
  for (const category of categories) {
    console.log(`Testing category: ${category}`);
    const data = createValidInspectionData();
    data.locationCategory = category;
    data.roomNumber = `${category.toUpperCase()}-001`;
    
    const result = await testApiEndpoint('/api/inspections', 'POST', data);
    results.push({ category, success: result.ok, status: result.status });
    
    if (result.ok) {
      console.log(`✅ ${category} submission successful`);
    } else {
      console.log(`❌ ${category} submission failed: ${result.status}`);
    }
    
    await delay(100);
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 Category test results: ${successCount}/${categories.length} successful`);
  return results;
}

async function testRatingValues() {
  console.log('\n🧪 Testing Rating Values (0-5)...');
  const inspectionCategories = [
    'floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms',
    'customerSatisfaction', 'trash', 'projectCleaning', 'activitySupport',
    'safetyCompliance', 'equipment', 'monitoring'
  ];
  
  // Test each rating value (0-5) for each category
  for (let rating = 0; rating <= 5; rating++) {
    console.log(`Testing rating value: ${rating}`);
    const data = createValidInspectionData();
    
    // Set all categories to this rating
    inspectionCategories.forEach(category => {
      data[category] = rating;
    });
    
    data.roomNumber = `RATING-${rating}-TEST`;
    data.notes = `Testing all categories with rating ${rating}`;
    
    const result = await testApiEndpoint('/api/inspections', 'POST', data);
    
    if (result.ok) {
      console.log(`✅ Rating ${rating} submission successful`);
    } else {
      console.log(`❌ Rating ${rating} submission failed: ${result.status}`);
      console.log('Response:', result.data);
    }
    
    await delay(100);
  }
}

async function testInvalidData() {
  console.log('\n🧪 Testing Invalid Data Handling...');
  
  const invalidTests = [
    {
      name: 'Missing school',
      data: { ...createValidInspectionData(), school: '' }
    },
    {
      name: 'Missing date',
      data: { ...createValidInspectionData(), date: '' }
    },
    {
      name: 'Invalid date format',
      data: { ...createValidInspectionData(), date: 'invalid-date' }
    },
    {
      name: 'Invalid rating (negative)',
      data: { ...createValidInspectionData(), floors: -5 }
    },
    {
      name: 'Invalid rating (too high)',
      data: { ...createValidInspectionData(), floors: 10 }
    },
    {
      name: 'Invalid school',
      data: { ...createValidInspectionData(), school: 'INVALID_SCHOOL' }
    }
  ];
  
  const results = [];
  
  for (const test of invalidTests) {
    console.log(`Testing: ${test.name}`);
    const result = await testApiEndpoint('/api/inspections', 'POST', test.data);
    
    const shouldBeRejected = !result.ok && result.status >= 400;
    results.push({ 
      test: test.name, 
      properlyRejected: shouldBeRejected, 
      status: result.status 
    });
    
    if (shouldBeRejected) {
      console.log(`✅ ${test.name} properly rejected (${result.status})`);
    } else {
      console.log(`❌ ${test.name} should have been rejected but wasn't`);
    }
    
    await delay(100);
  }
  
  const properRejections = results.filter(r => r.properlyRejected).length;
  console.log(`\n📊 Invalid data test results: ${properRejections}/${invalidTests.length} properly rejected`);
  return results;
}

async function testDataRetrieval() {
  console.log('\n🧪 Testing Data Retrieval...');
  
  // First create a test inspection
  const testData = createValidInspectionData();
  testData.roomNumber = 'RETRIEVAL-TEST-001';
  
  const createResult = await testApiEndpoint('/api/inspections', 'POST', testData);
  
  if (!createResult.ok) {
    console.log('❌ Could not create test inspection for retrieval test');
    return false;
  }
  
  const inspectionId = createResult.data.id;
  console.log(`Created test inspection with ID: ${inspectionId}`);
  
  // Test getting all inspections
  const getAllResult = await testApiEndpoint('/api/inspections', 'GET');
  if (getAllResult.ok) {
    console.log('✅ Get all inspections successful');
    console.log(`Found ${getAllResult.data.length} total inspections`);
  } else {
    console.log('❌ Get all inspections failed');
  }
  
  // Test getting specific inspection
  const getOneResult = await testApiEndpoint(`/api/inspections/${inspectionId}`, 'GET');
  if (getOneResult.ok) {
    console.log('✅ Get specific inspection successful');
    console.log('Retrieved inspection:', getOneResult.data.school, getOneResult.data.roomNumber);
  } else {
    console.log('❌ Get specific inspection failed');
  }
  
  return getAllResult.ok && getOneResult.ok;
}

async function testServerHealth() {
  console.log('\n🧪 Testing Server Health...');
  
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      console.log('✅ Server health check passed');
      return true;
    } else {
      console.log(`❌ Server health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Server health check error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Single Area Inspection Tests\n');
  console.log(`Testing against: ${BASE_URL}`);
  
  const results = {
    serverHealth: false,
    validSubmission: false,
    minimalSubmission: false,
    incompleteHandling: false,
    schoolTests: [],
    categoryTests: [],
    invalidDataTests: [],
    dataRetrieval: false
  };
  
  try {
    // Test server health first
    results.serverHealth = await testServerHealth();
    
    if (!results.serverHealth) {
      console.log('❌ Server health check failed - aborting tests');
      return results;
    }
    
    // Core functionality tests
    results.validSubmission = await testValidSubmission();
    results.minimalSubmission = await testMinimalSubmission();
    results.incompleteHandling = await testIncompleteSubmission();
    
    // Comprehensive feature tests
    results.schoolTests = await testAllSchools();
    results.categoryTests = await testAllLocationCategories();
    await testRatingValues();
    results.invalidDataTests = await testInvalidData();
    results.dataRetrieval = await testDataRetrieval();
    
    // Summary
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
    console.log('=====================================');
    console.log(`Server Health: ${results.serverHealth ? '✅' : '❌'}`);
    console.log(`Valid Submission: ${results.validSubmission ? '✅' : '❌'}`);
    console.log(`Minimal Submission: ${results.minimalSubmission ? '✅' : '❌'}`);
    console.log(`Incomplete Handling: ${results.incompleteHandling ? '✅' : '❌'}`);
    console.log(`School Tests: ${results.schoolTests.filter(t => t.success).length}/${results.schoolTests.length} ✅`);
    console.log(`Category Tests: ${results.categoryTests.filter(t => t.success).length}/${results.categoryTests.length} ✅`);
    console.log(`Invalid Data Tests: ${results.invalidDataTests.filter(t => t.properlyRejected).length}/${results.invalidDataTests.length} ✅`);
    console.log(`Data Retrieval: ${results.dataRetrieval ? '✅' : '❌'}`);
    
    const totalPassed = [
      results.serverHealth,
      results.validSubmission,
      results.minimalSubmission,
      results.incompleteHandling,
      results.dataRetrieval
    ].filter(Boolean).length;
    
    console.log(`\n🎯 Overall Score: ${totalPassed}/5 core tests passed`);
    
    if (totalPassed === 5) {
      console.log('🎉 ALL CORE TESTS PASSED - Single Area Inspection form is working correctly!');
    } else {
      console.log('⚠️  Some tests failed - review the results above');
    }
    
  } catch (error) {
    console.error('❌ Test suite encountered an error:', error);
  }
  
  return results;
}

// Additional manual test scenarios
async function testManualScenarios() {
  console.log('\n🧪 Manual Test Scenarios for UI Verification');
  console.log('==========================================');
  console.log('Please manually test these scenarios in the browser:');
  console.log('');
  console.log('1. Form Validation:');
  console.log('   - Try submitting without selecting a school');
  console.log('   - Try submitting without entering a date');
  console.log('   - Try submitting without any ratings');
  console.log('');
  console.log('2. Rating System:');
  console.log('   - Click stars to set ratings 1-5');
  console.log('   - Use "Not Rated" button');
  console.log('   - Verify rating descriptions appear');
  console.log('');
  console.log('3. Draft System:');
  console.log('   - Fill out partial form and wait for auto-save');
  console.log('   - Refresh page and check for resume dialog');
  console.log('   - Test manual save button');
  console.log('');
  console.log('4. Image Upload:');
  console.log('   - Upload 1-5 images');
  console.log('   - Test camera capture (mobile)');
  console.log('   - Remove uploaded images');
  console.log('');
  console.log('5. Form Submission:');
  console.log('   - Submit complete form');
  console.log('   - Verify success toast notification');
  console.log('   - Check form resets after submission');
  console.log('');
  console.log('6. Mobile Responsiveness:');
  console.log('   - Test on mobile device or resize browser');
  console.log('   - Verify touch-friendly controls');
  console.log('   - Check collapsible sections work');
}

// Run tests
if (require.main === module) {
  runAllTests().then(() => {
    testManualScenarios();
    console.log('\n✨ Testing complete!');
  });
}

module.exports = {
  runAllTests,
  testValidSubmission,
  testMinimalSubmission,
  testServerHealth
};
