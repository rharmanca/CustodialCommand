import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import { testData } from './test-data.js';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const CONCURRENT_REQUESTS = 10;  // Number of concurrent requests for load testing
const REQUEST_COUNT = 50;       // Total number of requests to send
const WARMUP_COUNT = 5;         // Number of warmup requests

class LoadPerformanceTester {
  constructor() {
    this.results = [];
    this.passedTests = 0;
    this.failedTests = 0;
    this.performanceData = {
      requests: [],
      responseTimes: [],
      errors: [],
      throughput: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0
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
      
      const startTime = performance.now();
      const response = await fetch(`${BASE_URL}${path}`, options);
      const responseTime = performance.now() - startTime;
      
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }
      
      const result = {
        success: response.ok,
        name,
        path,
        method,
        status: response.status,
        responseTime,
        data: responseData
      };
      
      this.performanceData.requests.push(result);
      this.performanceData.responseTimes.push(responseTime);
      
      if (response.ok) {
        this.log(`✅ ${name} - Status: ${response.status}, Time: ${responseTime.toFixed(2)}ms`, 'PASS');
        this.passedTests++;
      } else {
        this.log(`❌ ${name} - Status: ${response.status}, Error: ${JSON.stringify(responseData)}`, 'FAIL');
        this.failedTests++;
        this.performanceData.errors.push(result);
      }
      
      return result;
    } catch (error) {
      const result = {
        success: false,
        name,
        path,
        method,
        status: 0,
        responseTime: -1,
        error: error.message
      };
      
      this.performanceData.requests.push(result);
      this.performanceData.errors.push(result);
      
      this.log(`❌ ${name} - Error: ${error.message}`, 'FAIL');
      this.failedTests++;
      return result;
    }
  }

  // Calculate percentiles for performance metrics
  calculatePercentile(sortedValues, percentile) {
    if (sortedValues.length === 0) return 0;
    
    const index = Math.floor(percentile / 100 * (sortedValues.length - 1));
    return sortedValues[index];
  }

  // Calculate performance metrics
  calculateMetrics() {
    const sortedResponseTimes = [...this.performanceData.responseTimes].sort((a, b) => a - b);
    const totalRequests = this.performanceData.requests.length;
    const successfulRequests = totalRequests - this.performanceData.errors.length;
    
    this.performanceData.avgResponseTime = sortedResponseTimes.reduce((a, b) => a + b, 0) / sortedResponseTimes.length || 0;
    this.performanceData.p95ResponseTime = this.calculatePercentile(sortedResponseTimes, 95);
    this.performanceData.p99ResponseTime = this.calculatePercentile(sortedResponseTimes, 99);
    this.performanceData.successRate = (successfulRequests / totalRequests) * 100 || 0;
  }

  // Warmup requests to prime the server
  async runWarmup() {
    this.log('=== Running Warmup Requests ===');
    
    for (let i = 0; i < WARMUP_COUNT; i++) {
      await this.testEndpoint(
        `Warmup Request ${i + 1}`, 
        '/health'
      );
    }
    
    this.log(`✅ Completed ${WARMUP_COUNT} warmup requests`);
  }

  // Single request performance test
  async testSingleRequestPerformance() {
    this.log('=== Testing Single Request Performance ===');
    
    // Test basic endpoints
    await this.testEndpoint('Health Check', '/health');
    await this.testEndpoint('Get All Inspections', '/api/inspections');
    await this.testEndpoint('Get All Custodial Notes', '/api/custodial-notes');
    await this.testEndpoint('Root Path', '/');
    
    this.log('✅ Single request performance test completed');
  }

  // Concurrency/load test
  async runConcurrencyTest() {
    this.log(`=== Running Concurrency Test (${CONCURRENT_REQUESTS} concurrent requests) ===`);
    
    // Create multiple concurrent requests for the health endpoint
    const requests = [];
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
      requests.push(
        this.testEndpoint(
          `Concurrent Request ${i + 1}`, 
          '/health'
        )
      );
    }
    
    await Promise.all(requests);
    this.log(`✅ Completed ${CONCURRENT_REQUESTS} concurrent requests`);
  }

  // Load test with multiple requests
  async runLoadTest() {
    this.log(`=== Running Load Test (${REQUEST_COUNT} requests) ===`);
    
    const startTime = performance.now();
    
    // Send requests sequentially to measure performance under load
    for (let i = 0; i < REQUEST_COUNT; i++) {
      await this.testEndpoint(
        `Load Test Request ${i + 1}`, 
        '/api/inspections'
      );
      
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    const requestsCompleted = this.performanceData.requests.length - WARMUP_COUNT;
    this.performanceData.throughput = (requestsCompleted / (totalDuration / 1000)).toFixed(2);
    
    this.log(`✅ Completed ${REQUEST_COUNT} load test requests in ${(totalDuration/1000).toFixed(2)}s`);
    this.log(`Throughput: ${this.performanceData.throughput} requests/sec`);
  }

  // Stress test by sending many requests quickly
  async runStressTest() {
    this.log('=== Running Stress Test ===');
    
    // Group requests in batches to simulate load
    const batchSize = 5;
    const batchCount = 5;
    
    for (let batch = 0; batch < batchCount; batch++) {
      this.log(`Sending stress batch ${batch + 1}/${batchCount}`);
      
      const batchRequests = [];
      for (let i = 0; i < batchSize; i++) {
        batchRequests.push(
          this.testEndpoint(
            `Stress Request Batch${batch + 1}-${i + 1}`, 
            '/api/inspections'
          )
        );
      }
      
      await Promise.all(batchRequests);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.log(`✅ Completed stress test with ${batchCount * batchSize} requests`);
  }

  // Database performance test - test with data creation
  async runDatabasePerformanceTest() {
    this.log('=== Running Database Performance Test ===');
    
    // Test create performance
    const createTestData = {
      ...testData.singleRoomInspection,
      roomNumber: `PERF-TEST-${Date.now()}`,
      locationDescription: 'Performance test inspection',
      notes: 'Created during performance testing'
    };
    
    const createStart = performance.now();
    const createResult = await this.testEndpoint(
      'Performance: Create Inspection', 
      '/api/inspections', 
      'POST', 
      createTestData
    );
    const createDuration = performance.now() - createStart;
    
    if (createResult.success) {
      const inspectionId = createResult.data.id;
      
      // Test read performance
      const readStart = performance.now();
      await this.testEndpoint(
        'Performance: Read Inspection', 
        `/api/inspections/${inspectionId}`
      );
      const readDuration = performance.now() - readStart;
      
      // Test update performance
      const updateStart = performance.now();
      await this.testEndpoint(
        'Performance: Update Inspection', 
        `/api/inspections/${inspectionId}`, 
        'PATCH', 
        { notes: 'Updated during performance test' }
      );
      const updateDuration = performance.now() - updateStart;
      
      // Test delete performance
      const deleteStart = performance.now();
      await this.testEndpoint(
        'Performance: Delete Inspection', 
        `/api/inspections/${inspectionId}`, 
        'DELETE'
      );
      const deleteDuration = performance.now() - deleteStart;
      
      this.log(`Performance Results:`);
      this.log(`  Create: ${createDuration.toFixed(2)}ms`);
      this.log(`  Read: ${readDuration.toFixed(2)}ms`);
      this.log(`  Update: ${updateDuration.toFixed(2)}ms`);
      this.log(`  Delete: ${deleteDuration.toFixed(2)}ms`);
    }
  }

  // Memory and resource usage test
  async runResourceUsageTest() {
    this.log('=== Running Resource Usage Test ===');
    
    // Monitor the process memory usage
    const initialMemory = process.memoryUsage();
    this.log(`Initial Memory Usage: ${Math.round(initialMemory.heapUsed / 1024 / 1024)} MB used`);
    
    // Run a series of requests to see memory usage changes
    const requestCount = 20;
    for (let i = 0; i < requestCount; i++) {
      await this.testEndpoint(
        `Resource Test Request ${i + 1}`, 
        '/api/inspections'
      );
    }
    
    // Allow garbage collection
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalMemory = process.memoryUsage();
    this.log(`Final Memory Usage: ${Math.round(finalMemory.heapUsed / 1024 / 1024)} MB used`);
    
    const memoryDiff = Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024);
    this.log(`Memory Change: ${memoryDiff} MB over ${requestCount} requests`);
    
    if (memoryDiff > 10) {  // If more than 10MB increase
      this.log('⚠️ Significant memory increase detected - potential memory leak', 'WARNING');
    } else {
      this.log('✅ Memory usage appears stable');
    }
  }

  // Test API endpoint performance
  async testAPIEndpointPerformance() {
    this.log('=== Testing API Endpoint Performance ===');
    
    const endpoints = [
      { name: 'Health Check', path: '/health', method: 'GET' },
      { name: 'Get Inspections', path: '/api/inspections', method: 'GET' },
      { name: 'Get Custodial Notes', path: '/api/custodial-notes', method: 'GET' },
      { name: 'Get Room Inspections', path: '/api/room-inspections', method: 'GET' },
      { name: 'Create Inspection', path: '/api/inspections', method: 'POST', body: testData.singleRoomInspection },
      { name: 'Create Custodial Note', path: '/api/custodial-notes', method: 'POST', body: testData.custodialNotes },
    ];
    
    for (const endpoint of endpoints) {
      const start = performance.now();
      await this.testEndpoint(
        `API Perf: ${endpoint.name}`,
        endpoint.path,
        endpoint.method,
        endpoint.body
      );
      const duration = performance.now() - start;
      
      this.log(`  ${endpoint.name}: ${duration.toFixed(2)}ms`);
    }
  }

  // Test with realistic user workflows
  async testRealisticWorkflows() {
    this.log('=== Testing Realistic User Workflows ===');
    
    // Simulate a common user workflow: get data, create record, update record
    const workflowStartTime = performance.now();
    
    // Step 1: Get all inspections
    await this.testEndpoint('Workflow: Get Inspections', '/api/inspections');
    
    // Step 2: Create a new inspection
    const newInspection = {
      ...testData.singleRoomInspection,
      roomNumber: `WORKFLOW-${Date.now()}`,
      notes: 'Created during workflow performance test'
    };
    
    const createResult = await this.testEndpoint(
      'Workflow: Create Inspection', 
      '/api/inspections', 
      'POST', 
      newInspection
    );
    
    if (createResult.success && createResult.data.id) {
      // Step 3: Update the created inspection
      await this.testEndpoint(
        'Workflow: Update Inspection', 
        `/api/inspections/${createResult.data.id}`, 
        'PATCH', 
        { notes: 'Updated during workflow test' }
      );
      
      // Step 4: Get the updated inspection
      await this.testEndpoint(
        'Workflow: Get Updated Inspection', 
        `/api/inspections/${createResult.data.id}`
      );
    }
    
    const workflowDuration = performance.now() - workflowStartTime;
    this.log(`✅ Complete workflow test: ${workflowDuration.toFixed(2)}ms`);
  }

  // Performance benchmarking
  async runPerformanceBenchmark() {
    this.log('=== Running Performance Benchmark ===');
    
    // Define performance thresholds
    const thresholds = {
      maxResponseTime: 2000,  // 2 seconds
      minThroughput: 10,      // 10 requests/second
      minSuccessRate: 95      // 95% success rate
    };
    
    this.log('Performance Thresholds:');
    this.log(`  Max Response Time: ${thresholds.maxResponseTime}ms`);
    this.log(`  Min Throughput: ${thresholds.minThroughput} req/sec`);
    this.log(`  Min Success Rate: ${thresholds.minSuccessRate}%`);
    
    // Calculate metrics
    this.calculateMetrics();
    
    // Evaluate against thresholds
    const maxResponseTime = Math.max(...this.performanceData.responseTimes);
    const avgResponseTime = this.performanceData.avgResponseTime;
    const p95ResponseTime = this.performanceData.p95ResponseTime;
    const successRate = this.performanceData.successRate;
    const throughput = this.performanceData.throughput;
    
    this.log('\nPerformance Results:');
    this.log(`  Max Response Time: ${maxResponseTime.toFixed(2)}ms`);
    this.log(`  Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    this.log(`  P95 Response Time: ${p95ResponseTime.toFixed(2)}ms`);
    this.log(`  Success Rate: ${successRate.toFixed(2)}%`);
    this.log(`  Throughput: ${throughput} req/sec`);
    
    // Check against thresholds
    const performanceIssues = [];
    
    if (maxResponseTime > thresholds.maxResponseTime) {
      performanceIssues.push(`Max response time (${maxResponseTime.toFixed(2)}ms) exceeds threshold (${thresholds.maxResponseTime}ms)`);
    }
    
    if (throughput < thresholds.minThroughput) {
      performanceIssues.push(`Throughput (${throughput} req/sec) below threshold (${thresholds.minThroughput} req/sec)`);
    }
    
    if (successRate < thresholds.minSuccessRate) {
      performanceIssues.push(`Success rate (${successRate.toFixed(2)}%) below threshold (${thresholds.minSuccessRate}%)`);
    }
    
    if (performanceIssues.length === 0) {
      this.log('✅ Performance meets all thresholds!', 'PASS');
    } else {
      performanceIssues.forEach(issue => {
        this.log(`❌ ${issue}`, 'FAIL');
      });
    }
  }

  // Generate performance report
  generatePerformanceReport() {
    this.log('\n=== DETAILED PERFORMANCE REPORT ===');
    
    this.calculateMetrics();
    
    this.log('Summary Metrics:');
    this.log(`  Total Requests: ${this.performanceData.requests.length}`);
    this.log(`  Successful Requests: ${this.performanceData.requests.length - this.performanceData.errors.length}`);
    this.log(`  Failed Requests: ${this.performanceData.errors.length}`);
    this.log(`  Success Rate: ${this.performanceData.successRate.toFixed(2)}%`);
    this.log(`  Average Response Time: ${this.performanceData.avgResponseTime.toFixed(2)}ms`);
    this.log(`  P95 Response Time: ${this.performanceData.p95ResponseTime.toFixed(2)}ms`);
    this.log(`  P99 Response Time: ${this.performanceData.p99ResponseTime.toFixed(2)}ms`);
    this.log(`  Throughput: ${this.performanceData.throughput} requests/sec`);
    this.log(`  Total Test Duration: ${(performance.now() - this.testStartTime)/1000.toFixed(2)}s`);
    
    // Response time distribution
    const responseTimeBuckets = {
      '<100ms': 0,
      '100-250ms': 0,
      '250-500ms': 0,
      '500ms-1s': 0,
      '1s-2s': 0,
      '>2s': 0
    };
    
    this.performanceData.responseTimes.forEach(time => {
      if (time < 100) responseTimeBuckets['<100ms']++;
      else if (time < 250) responseTimeBuckets['100-250ms']++;
      else if (time < 500) responseTimeBuckets['250-500ms']++;
      else if (time < 1000) responseTimeBuckets['500ms-1s']++;
      else if (time < 2000) responseTimeBuckets['1s-2s']++;
      else responseTimeBuckets['>2s']++;
    });
    
    this.log('\nResponse Time Distribution:');
    Object.entries(responseTimeBuckets).forEach(([bucket, count]) => {
      const percentage = ((count / this.performanceData.responseTimes.length) * 100).toFixed(2);
      this.log(`  ${bucket}: ${count} (${percentage}%)`);
    });
    
    // Error details
    if (this.performanceData.errors.length > 0) {
      this.log('\nError Details:');
      this.performanceData.errors.slice(0, 5).forEach(error => {
        this.log(`  - ${error.name}: ${error.status || 'Network Error'}`);
      });
      
      if (this.performanceData.errors.length > 5) {
        this.log(`  ... and ${this.performanceData.errors.length - 5} more errors`);
      }
    }
  }

  async runAllLoadPerformanceTests() {
    this.testStartTime = performance.now();
    
    this.log('🚀 Starting Load and Performance Testing');
    this.log(`Testing against: ${BASE_URL}`);
    this.log(`Concurrency: ${CONCURRENT_REQUESTS}, Total Requests: ${REQUEST_COUNT}`);
    
    await this.runWarmup();
    await this.testSingleRequestPerformance();
    await this.runConcurrencyTest();
    await this.runLoadTest();
    await this.runStressTest();
    await this.runDatabasePerformanceTest();
    await this.runResourceUsageTest();
    await this.testAPIEndpointPerformance();
    await this.testRealisticWorkflows();
    await this.runPerformanceBenchmark();
    
    this.generatePerformanceReport();
    
    this.log('\n=== LOAD & PERFORMANCE TEST RESULTS ===');
    this.log(`Total Tests: ${this.passedTests + this.failedTests}`);
    this.log(`Passed: ${this.passedTests}`);
    this.log(`Failed: ${this.failedTests}`);
    this.log(`Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
    
    this.log('\n=== PERFORMANCE RECOMMENDATIONS ===');
    this.log('• Optimize slow endpoints identified in testing');
    this.log('• Implement caching for frequently accessed data');
    this.log('• Add database indexes for common query patterns');
    this.log('• Monitor server resource usage during peak loads');
    this.log('• Implement rate limiting to prevent server overload');
    this.log('• Consider adding CDN for static assets');
    this.log('• Optimize database queries for better performance');
    this.log('• Scale horizontally if needed for better throughput');
  }
}

// Run the load and performance tests
const tester = new LoadPerformanceTester();
tester.runAllLoadPerformanceTests().catch(console.error);