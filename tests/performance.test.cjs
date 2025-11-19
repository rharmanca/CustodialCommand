#!/usr/bin/env node

/**
 * Performance Testing Suite for Custodial Command
 * Tests response times, load handling, and system performance
 */

// TODO: [PERFORMANCE-MONITORING] Add performance degradation investigation
// Issue: 381% performance degradation detected (32ms → 154ms under sustained load)
// Fix: Add server-side performance monitoring middleware to track:
//   - Request duration per endpoint
//   - Memory usage trends
//   - Database query performance
//   - Endpoint-specific degradation patterns
// Location: Create server/middleware/performanceMonitor.ts
// Reference: Performance test - degradation from 32ms to 154ms (381%)
// NOTE: Do not change existing functionality, only add monitoring

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://cacustodialcommand.up.railway.app';
const CONCURRENT_REQUESTS = 10;
const LOAD_TEST_DURATION = 30000; // 30 seconds

// Performance results tracking
const performanceResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  metrics: {
    responseTimes: [],
    throughput: 0,
    errorRate: 0
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordPerformanceTest(testName, passed, details = '', metrics = {}) {
  performanceResults.total++;
  if (passed) {
    performanceResults.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    performanceResults.failed++;
    log(`FAIL: ${testName} - ${details}`, 'error');
  }
  performanceResults.details.push({ testName, passed, details, metrics });
}

// HTTP request helper with timing
function makeTimedRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 30000 // 30 second timeout for performance tests
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        try {
          const jsonData = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({ 
            status: res.statusCode, 
            headers: res.headers, 
            data: jsonData,
            responseTime,
            startTime,
            endTime
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            headers: res.headers, 
            data,
            responseTime,
            startTime,
            endTime
          });
        }
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      reject({ error, responseTime, startTime, endTime });
    });
    
    req.on('timeout', () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      reject({ error: new Error('Request timeout'), responseTime, startTime, endTime });
    });
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test 1: Basic Response Time Tests
async function testBasicResponseTimes() {
  log('⏱️ Testing Basic Response Times', 'info');
  
  const endpoints = [
    { name: 'Health Check', url: '/health' },
    { name: 'API Test', url: '/api/test' },
    { name: 'Get Inspections', url: '/api/inspections' },
    { name: 'Get Custodial Notes', url: '/api/custodial-notes' },
    { name: 'Home Page', url: '/' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeTimedRequest(`${BASE_URL}${endpoint.url}`);
      
      const passed = response.status >= 200 && response.status < 300;
      const responseTime = response.responseTime;
      
      // Performance thresholds
      const threshold = endpoint.url.includes('/api/') ? 2000 : 5000; // API: 2s, Pages: 5s
      const performancePassed = responseTime <= threshold;
      
      recordPerformanceTest(
        `Response Time - ${endpoint.name}`, 
        passed && performancePassed, 
        `Status: ${response.status}, Time: ${responseTime}ms (threshold: ${threshold}ms)`,
        { responseTime, threshold, status: response.status }
      );
      
      performanceResults.metrics.responseTimes.push({
        endpoint: endpoint.name,
        responseTime,
        status: response.status
      });
      
    } catch (error) {
      recordPerformanceTest(
        `Response Time - ${endpoint.name}`, 
        false, 
        `Request failed: ${error.error?.message || error.message}`,
        { responseTime: error.responseTime || 0 }
      );
    }
  }
}

// Test 2: Concurrent Request Handling
async function testConcurrentRequests() {
  log('🔄 Testing Concurrent Request Handling', 'info');
  
  const concurrentRequests = [];
  const startTime = Date.now();
  
  // Create multiple concurrent requests
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    concurrentRequests.push(
      makeTimedRequest(`${BASE_URL}/api/inspections`)
        .then(response => ({ success: true, response }))
        .catch(error => ({ success: false, error }))
    );
  }
  
  try {
    const results = await Promise.all(concurrentRequests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.filter(r => !r.success).length;
    const successRate = (successfulRequests / CONCURRENT_REQUESTS) * 100;
    
    // Calculate average response time for successful requests
    const successfulResponses = results
      .filter(r => r.success)
      .map(r => r.response.responseTime);
    const avgResponseTime = successfulResponses.length > 0 
      ? successfulResponses.reduce((a, b) => a + b, 0) / successfulResponses.length 
      : 0;
    
    const passed = successRate >= 90; // 90% success rate threshold
    
    recordPerformanceTest(
      'Concurrent Request Handling', 
      passed, 
      `${successfulRequests}/${CONCURRENT_REQUESTS} successful (${successRate.toFixed(1)}%), Avg time: ${avgResponseTime.toFixed(0)}ms`,
      { 
        totalRequests: CONCURRENT_REQUESTS,
        successfulRequests,
        failedRequests,
        successRate,
        avgResponseTime,
        totalTime
      }
    );
    
    performanceResults.metrics.throughput = CONCURRENT_REQUESTS / (totalTime / 1000); // requests per second
    performanceResults.metrics.errorRate = (failedRequests / CONCURRENT_REQUESTS) * 100;
    
  } catch (error) {
    recordPerformanceTest('Concurrent Request Handling', false, `Test failed: ${error.message}`);
  }
}

// Test 3: Load Testing with Sustained Requests
async function testSustainedLoad() {
  log('📈 Testing Sustained Load', 'info');
  
  const startTime = Date.now();
  const endTime = startTime + LOAD_TEST_DURATION;
  const requests = [];
  let requestCount = 0;
  let successCount = 0;
  let errorCount = 0;
  
  // Create a sustained load for the specified duration
  const loadInterval = setInterval(async () => {
    if (Date.now() >= endTime) {
      clearInterval(loadInterval);
      return;
    }
    
    requestCount++;
    
    try {
      const response = await makeTimedRequest(`${BASE_URL}/api/inspections`);
      if (response.status >= 200 && response.status < 300) {
        successCount++;
      } else {
        errorCount++;
      }
      requests.push({ responseTime: response.responseTime, status: response.status });
    } catch (error) {
      errorCount++;
      requests.push({ responseTime: error.responseTime || 0, status: 0 });
    }
  }, 100); // Make a request every 100ms
  
  // Wait for the load test to complete
  await new Promise(resolve => setTimeout(resolve, LOAD_TEST_DURATION + 1000));
  
  const actualDuration = Date.now() - startTime;
  const successRate = (successCount / requestCount) * 100;
  const avgResponseTime = requests.length > 0 
    ? requests.reduce((sum, req) => sum + req.responseTime, 0) / requests.length 
    : 0;
  const requestsPerSecond = requestCount / (actualDuration / 1000);
  
  const passed = successRate >= 95 && avgResponseTime <= 3000; // 95% success rate and <3s avg response
  
  recordPerformanceTest(
    'Sustained Load Test', 
    passed, 
    `${successCount}/${requestCount} successful (${successRate.toFixed(1)}%), Avg time: ${avgResponseTime.toFixed(0)}ms, RPS: ${requestsPerSecond.toFixed(1)}`,
    { 
      requestCount,
      successCount,
      errorCount,
      successRate,
      avgResponseTime,
      requestsPerSecond,
      duration: actualDuration
    }
  );
}

// Test 4: Database Performance Tests
async function testDatabasePerformance() {
  log('🗄️ Testing Database Performance', 'info');
  
  try {
    // Test 1: Large dataset retrieval
    const startTime = Date.now();
    const response = await makeTimedRequest(`${BASE_URL}/api/inspections`);
    const endTime = Date.now();
    
    if (response.status === 200 && Array.isArray(response.data)) {
      const dataSize = JSON.stringify(response.data).length;
      const recordCount = response.data.length;
      const responseTime = response.responseTime;
      
      // Performance thresholds
      const timeThreshold = recordCount > 100 ? 5000 : 2000; // More records = more time allowed
      const sizeThreshold = 10 * 1024 * 1024; // 10MB max response size
      
      const passed = responseTime <= timeThreshold && dataSize <= sizeThreshold;
      
      recordPerformanceTest(
        'Database Performance - Large Dataset', 
        passed, 
        `${recordCount} records, ${(dataSize / 1024).toFixed(1)}KB, ${responseTime}ms`,
        { recordCount, dataSize, responseTime, timeThreshold }
      );
    } else {
      recordPerformanceTest('Database Performance - Large Dataset', false, `Invalid response: ${response.status}`);
    }
    
    // Test 2: Create operation performance
    const createData = {
      inspectorName: 'Performance Test Inspector',
      school: 'Performance Test School',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationDescription: 'Performance test location',
      roomNumber: 'P101',
      locationCategory: 'classroom',
      buildingName: 'Performance Test Building',
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
      notes: 'Performance test inspection'
    };
    
    const createStartTime = Date.now();
    const createResponse = await makeTimedRequest(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      body: createData
    });
    const createEndTime = Date.now();
    
    const createPassed = createResponse.status === 201 && createResponse.responseTime <= 3000;
    recordPerformanceTest(
      'Database Performance - Create Operation', 
      createPassed, 
      `Created in ${createResponse.responseTime}ms`,
      { responseTime: createResponse.responseTime, status: createResponse.status }
    );
    
  } catch (error) {
    recordPerformanceTest('Database Performance', false, `Test failed: ${error.message}`);
  }
}

// Test 5: Memory and Resource Usage
async function testResourceUsage() {
  log('💾 Testing Resource Usage', 'info');
  
  try {
    // Test memory usage by making many requests and checking for degradation
    const initialResponse = await makeTimedRequest(`${BASE_URL}/api/inspections`);
    const initialTime = initialResponse.responseTime;
    
    // Make 50 requests to test for memory leaks or performance degradation
    const requests = [];
    for (let i = 0; i < 50; i++) {
      requests.push(makeTimedRequest(`${BASE_URL}/api/inspections`));
    }
    
    const results = await Promise.all(requests);
    const finalResponse = results[results.length - 1];
    const finalTime = finalResponse.responseTime;
    
    // Check for performance degradation (should not be more than 50% slower)
    const performanceDegradation = ((finalTime - initialTime) / initialTime) * 100;
    const passed = performanceDegradation <= 50;
    
    recordPerformanceTest(
      'Resource Usage - Performance Degradation', 
      passed, 
      `Initial: ${initialTime}ms, Final: ${finalTime}ms, Degradation: ${performanceDegradation.toFixed(1)}%`,
      { initialTime, finalTime, performanceDegradation }
    );
    
    // Test error rate consistency
    const errorCount = results.filter(r => r.status < 200 || r.status >= 300).length;
    const errorRate = (errorCount / results.length) * 100;
    const errorRatePassed = errorRate <= 5; // 5% error rate threshold
    
    recordPerformanceTest(
      'Resource Usage - Error Rate Consistency', 
      errorRatePassed, 
      `${errorCount}/${results.length} errors (${errorRate.toFixed(1)}%)`,
      { errorCount, totalRequests: results.length, errorRate }
    );
    
  } catch (error) {
    recordPerformanceTest('Resource Usage', false, `Test failed: ${error.message}`);
  }
}

// Test 6: File Upload Performance
async function testFileUploadPerformance() {
  log('📁 Testing File Upload Performance', 'info');
  
  try {
    // Create a test image
    const testImagePath = path.join(__dirname, '..', 'test-image.png');
    if (!fs.existsSync(testImagePath)) {
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
      fs.writeFileSync(testImagePath, pngData);
    }
    
    const FormData = require('form-data');
    const form = new FormData();
    form.append('images', fs.createReadStream(testImagePath), {
      filename: 'performance-test-image.png',
      contentType: 'image/png'
    });
    
    // Add required fields for inspection
    form.append('inspectorName', 'Performance Test Inspector');
    form.append('school', 'Performance Test School');
    form.append('date', new Date().toISOString().split('T')[0]);
    form.append('inspectionType', 'single_room');
    form.append('locationDescription', 'Performance test location');
    form.append('roomNumber', 'P101');
    form.append('locationCategory', 'classroom');
    form.append('buildingName', 'Performance Test Building');
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
    form.append('notes', 'Performance test with file upload');

    const startTime = Date.now();
    const response = await new Promise((resolve, reject) => {
      const isHttps = BASE_URL.startsWith('https://');
      const client = isHttps ? https : http;
      
      const url = new URL(`${BASE_URL}/api/inspections`);
      const options = {
        method: 'POST',
        headers: form.getHeaders(),
        timeout: 30000
      };

      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData, responseTime });
          } catch (e) {
            resolve({ status: res.statusCode, data, responseTime });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Upload timeout')));
      
      form.pipe(req);
    });

    const uploadPassed = response.status === 201 && response.responseTime <= 10000; // 10s threshold for file upload
    recordPerformanceTest(
      'File Upload Performance', 
      uploadPassed, 
      `Upload completed in ${response.responseTime}ms`,
      { responseTime: response.responseTime, status: response.status }
    );
    
  } catch (error) {
    recordPerformanceTest('File Upload Performance', false, `Upload failed: ${error.message}`);
  }
}

// Main test runner
async function runPerformanceTests() {
  log('🚀 Starting Performance Test Suite', 'info');
  log(`📍 Testing against: ${BASE_URL}`, 'info');
  log(`⚡ Concurrent requests: ${CONCURRENT_REQUESTS}`, 'info');
  log(`⏱️ Load test duration: ${LOAD_TEST_DURATION / 1000}s`, 'info');
  log('', 'info');

  // Run all performance tests
  await testBasicResponseTimes();
  log('', 'info');
  
  await testConcurrentRequests();
  log('', 'info');
  
  await testSustainedLoad();
  log('', 'info');
  
  await testDatabasePerformance();
  log('', 'info');
  
  await testResourceUsage();
  log('', 'info');
  
  await testFileUploadPerformance();
  log('', 'info');

  // Generate report
  generatePerformanceReport();
}

function generatePerformanceReport() {
  log('📊 Performance Test Results Summary', 'info');
  log('=' * 50, 'info');
  log(`Total Performance Tests: ${performanceResults.total}`, 'info');
  log(`Passed: ${performanceResults.passed}`, 'success');
  log(`Failed: ${performanceResults.failed}`, performanceResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((performanceResults.passed / performanceResults.total) * 100).toFixed(1)}%`, 'info');
  log('', 'info');

  // Performance metrics summary
  if (performanceResults.metrics.responseTimes.length > 0) {
    const avgResponseTime = performanceResults.metrics.responseTimes
      .reduce((sum, metric) => sum + metric.responseTime, 0) / performanceResults.metrics.responseTimes.length;
    log(`📈 Average Response Time: ${avgResponseTime.toFixed(0)}ms`, 'info');
  }
  
  if (performanceResults.metrics.throughput > 0) {
    log(`📈 Throughput: ${performanceResults.metrics.throughput.toFixed(1)} requests/second`, 'info');
  }
  
  if (performanceResults.metrics.errorRate > 0) {
    log(`📈 Error Rate: ${performanceResults.metrics.errorRate.toFixed(1)}%`, 'info');
  }
  
  log('', 'info');

  if (performanceResults.failed > 0) {
    log('❌ Failed Performance Tests:', 'error');
    performanceResults.details
      .filter(test => !test.passed)
      .forEach(test => log(`  - ${test.testName}: ${test.details}`, 'error'));
    log('', 'info');
  }

  log('✅ All Performance Tests Completed', 'success');
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'performance-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: performanceResults.total,
      passed: performanceResults.passed,
      failed: performanceResults.failed,
      successRate: (performanceResults.passed / performanceResults.total) * 100
    },
    metrics: performanceResults.metrics,
    details: performanceResults.details
  }, null, 2));
  
  log(`📄 Detailed performance report saved to: ${reportPath}`, 'info');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPerformanceTests().catch(error => {
    log(`💥 Performance test suite failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runPerformanceTests,
  performanceResults
};
