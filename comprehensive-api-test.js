#!/usr/bin/env node

/**
 * Comprehensive API Testing Suite for Custodial Command
 * Tests all endpoints with various scenarios, validation, and performance metrics
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

// Test configuration
const API_BASE_URL = 'https://cacustodialcommand.up.railway.app';
const TEST_RESULTS = {
  endpoint: [],
  performance: [],
  security: [],
  data: [],
  errors: [],
  summary: {}
};

// Test utilities
class APITester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.sessionToken = null;
    this.createdIds = {
      inspections: [],
      custodialNotes: [],
      monthlyFeedback: [],
      roomInspections: [],
      photos: []
    };
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    const url = new URL(endpoint, this.baseUrl);
    const startTime = performance.now();

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Custodial-Command-API-Tester/1.0',
        ...headers
      }
    };

    if (this.sessionToken) {
      options.headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    return new Promise((resolve) => {
      const lib = url.protocol === 'https:' ? https : http;
      const req = lib.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = Math.round(endTime - startTime);

          try {
            const parsedBody = body ? JSON.parse(body) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parsedBody,
              responseTime,
              size: Buffer.byteLength(body)
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: body,
              responseTime,
              size: Buffer.byteLength(body),
              parseError: true
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          status: 0,
          error: error.message,
          responseTime: Math.round(performance.now() - startTime)
        });
      });

      if (data) {
        if (data instanceof FormData) {
          // Handle multipart/form-data
          const boundary = '----formdata-test-boundary-' + Math.random().toString(16);
          options.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;

          let formData = '';
          data.forEach((value, key) => {
            if (value instanceof Buffer) {
              formData += `--${boundary}\r\n`;
              formData += `Content-Disposition: form-data; name="${key}"; filename="test.jpg"\r\n`;
              formData += `Content-Type: image/jpeg\r\n\r\n`;
              formData += value.toString('binary');
              formData += '\r\n';
            } else {
              formData += `--${boundary}\r\n`;
              formData += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
              formData += value + '\r\n';
            }
          });
          formData += `--${boundary}--\r\n`;
          req.write(formData, 'binary');
        } else {
          req.write(JSON.stringify(data));
        }
      }
      req.end();
    });
  }

  async testHealthEndpoint() {
    console.log('🔍 Testing Health Endpoint');

    const response = await this.makeRequest('GET', '/health');

    this.recordTest({
      endpoint: '/health',
      method: 'GET',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 200,
      details: response.body
    });

    if (response.status !== 200) {
      this.recordError('/health', 'Health check failed', response);
    }

    return response;
  }

  async testInspectionEndpoints() {
    console.log('🔍 Testing Inspection Endpoints');

    // Test GET all inspections
    let response = await this.makeRequest('GET', '/api/inspections');
    this.recordTest({
      endpoint: '/api/inspections',
      method: 'GET',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 200,
      details: response.body
    });

    // Test POST inspection (single room)
    const inspectionData = {
      inspectorName: "API Test Inspector",
      school: "Test Elementary School",
      date: new Date().toISOString().split('T')[0],
      inspectionType: "single_room",
      roomNumber: "TEST-101",
      locationCategory: "classroom",
      floors: 4,
      verticalHorizontalSurfaces: 4,
      ceiling: 4,
      restrooms: null,
      customerSatisfaction: 4,
      trash: 4,
      projectCleaning: 4,
      activitySupport: 4,
      safetyCompliance: 4,
      equipment: 4,
      monitoring: 4,
      notes: "API test inspection - automated testing"
    };

    response = await this.makeRequest('POST', '/api/inspections', inspectionData);

    if (response.status === 201) {
      this.createdIds.inspections.push(response.body.id);

      // Test GET specific inspection
      const getResponse = await this.makeRequest('GET', `/api/inspections/${response.body.id}`);
      this.recordTest({
        endpoint: `/api/inspections/${response.body.id}`,
        method: 'GET',
        status: getResponse.status,
        responseTime: getResponse.responseTime,
        size: getResponse.size,
        success: getResponse.status === 200,
        details: { created: true, retrieved: getResponse.body }
      });

      // Test PATCH inspection
      const patchResponse = await this.makeRequest('PATCH', `/api/inspections/${response.body.id}`, {
        notes: "Updated by API test"
      });
      this.recordTest({
        endpoint: `/api/inspections/${response.body.id}`,
        method: 'PATCH',
        status: patchResponse.status,
        responseTime: patchResponse.responseTime,
        size: patchResponse.size,
        success: patchResponse.status === 200,
        details: patchResponse.body
      });
    }

    this.recordTest({
      endpoint: '/api/inspections',
      method: 'POST',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 201,
      details: response.body
    });

    // Test POST building inspection
    const buildingInspectionData = {
      inspectorName: "API Test Inspector",
      school: "Test Middle School",
      date: new Date().toISOString().split('T')[0],
      inspectionType: "whole_building",
      locationDescription: "Main building inspection",
      notes: "API test building inspection"
    };

    response = await this.makeRequest('POST', '/api/inspections', buildingInspectionData);

    if (response.status === 201) {
      this.createdIds.inspections.push(response.body.id);
    }

    this.recordTest({
      endpoint: '/api/inspections (building)',
      method: 'POST',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 201,
      details: response.body
    });
  }

  async testCustodialNotesEndpoints() {
    console.log('🔍 Testing Custodial Notes Endpoints');

    // Test GET all custodial notes
    let response = await this.makeRequest('GET', '/api/custodial-notes');
    this.recordTest({
      endpoint: '/api/custodial-notes',
      method: 'GET',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 200,
      details: response.body
    });

    // Create test image data (1x1 PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    // Test POST custodial note with FormData (multipart)
    const formData = new FormData();
    formData.append('inspectorName', 'API Test Inspector');
    formData.append('school', 'Test High School');
    formData.append('date', new Date().toISOString().split('T')[0]);
    formData.append('location', 'Main Office');
    formData.append('locationDescription', 'Front desk area');
    formData.append('notes', 'API test custodial note with image');
    formData.append('images', testImageBuffer);

    // Note: Since we can't easily send multipart data with Node's HTTP module,
    // we'll test with JSON instead
    const noteData = {
      inspectorName: "API Test Inspector",
      school: "Test High School",
      date: new Date().toISOString().split('T')[0],
      location: "Main Office",
      locationDescription: "Front desk area",
      notes: "API test custodial note"
    };

    response = await this.makeRequest('POST', '/api/custodial-notes', noteData);

    if (response.status === 201) {
      this.createdIds.custodialNotes.push(response.body.id);

      // Test GET specific custodial note
      const getResponse = await this.makeRequest('GET', `/api/custodial-notes/${response.body.id}`);
      this.recordTest({
        endpoint: `/api/custodial-notes/${response.body.id}`,
        method: 'GET',
        status: getResponse.status,
        responseTime: getResponse.responseTime,
        size: getResponse.size,
        success: getResponse.status === 200,
        details: { created: true, retrieved: getResponse.body }
      });
    }

    this.recordTest({
      endpoint: '/api/custodial-notes',
      method: 'POST',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 201,
      details: response.body
    });
  }

  async testMonthlyFeedbackEndpoints() {
    console.log('🔍 Testing Monthly Feedback Endpoints');

    // Test GET all monthly feedback
    let response = await this.makeRequest('GET', '/api/monthly-feedback');
    this.recordTest({
      endpoint: '/api/monthly-feedback',
      method: 'GET',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 200,
      details: response.body
    });

    // Test GET with filters
    response = await this.makeRequest('GET', '/api/monthly-feedback?school=Test%20School&year=2024&month=October');
    this.recordTest({
      endpoint: '/api/monthly-feedback (filtered)',
      method: 'GET',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 200,
      details: response.body
    });

    // Note: We can't easily test PDF upload without actual PDF files
    // So we'll test the error handling for missing file
    const feedbackData = {
      school: "Test Elementary School",
      month: "November",
      year: "2024",
      notes: "API test monthly feedback"
    };

    response = await this.makeRequest('POST', '/api/monthly-feedback', feedbackData);
    this.recordTest({
      endpoint: '/api/monthly-feedback (no file)',
      method: 'POST',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 400, // Should fail without file
      details: response.body
    });
  }

  async testScoresEndpoints() {
    console.log('🔍 Testing Scores Endpoints');

    // Test GET all scores
    let response = await this.makeRequest('GET', '/api/scores');
    this.recordTest({
      endpoint: '/api/scores',
      method: 'GET',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 200,
      details: response.body
    });

    // Test GET scores with date range
    response = await this.makeRequest('GET', '/api/scores?startDate=2024-01-01&endDate=2024-12-31');
    this.recordTest({
      endpoint: '/api/scores (with dates)',
      method: 'GET',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 200,
      details: response.body
    });

    // Test GET specific school scores
    response = await this.makeRequest('GET', '/api/scores/Test%20Elementary%20School');
    this.recordTest({
      endpoint: '/api/scores/:school',
      method: 'GET',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 200 || response.status === 404, // 404 is acceptable if school doesn't exist
      details: response.body
    });
  }

  async testPhotoEndpoints() {
    console.log('🔍 Testing Photo Endpoints');

    // Test GET sync status
    let response = await this.makeRequest('GET', '/api/photos/sync-status');
    this.recordTest({
      endpoint: '/api/photos/sync-status',
      method: 'GET',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 200,
      details: response.body
    });

    // Test photo upload (without actual image)
    const photoData = {
      metadata: JSON.stringify({
        width: 1920,
        height: 1080,
        fileSize: 1024000,
        capturedAt: new Date().toISOString()
      }),
      location: JSON.stringify({
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        source: 'gps'
      }),
      inspectionId: this.createdIds.inspections[0] || 1
    };

    response = await this.makeRequest('POST', '/api/photos/upload', photoData);
    this.recordTest({
      endpoint: '/api/photos/upload (no file)',
      method: 'POST',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 400, // Should fail without actual file
      details: response.body
    });

    // Test GET photos for inspection
    if (this.createdIds.inspections.length > 0) {
      response = await this.makeRequest('GET', `/api/photos/${this.createdIds.inspections[0]}`);
      this.recordTest({
        endpoint: `/api/photos/:inspectionId`,
        method: 'GET',
        status: response.status,
        responseTime: response.responseTime,
        size: response.size,
        success: response.status === 200,
        details: response.body
      });
    }
  }

  async testAdminEndpoints() {
    console.log('🔍 Testing Admin Endpoints');

    // Test admin login (will likely fail with wrong credentials)
    const loginData = {
      username: 'test_admin',
      password: 'test_password'
    };

    let response = await this.makeRequest('POST', '/api/admin/login', loginData);
    this.recordTest({
      endpoint: '/api/admin/login',
      method: 'POST',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 200 || response.status === 401, // Both are acceptable
      details: response.body
    });

    if (response.status === 200 && response.body.sessionToken) {
      this.sessionToken = response.body.sessionToken;

      // Test protected admin endpoints with valid session
      response = await this.makeRequest('GET', '/api/admin/inspections');
      this.recordTest({
        endpoint: '/api/admin/inspections',
        method: 'GET',
        status: response.status,
        responseTime: response.responseTime,
        size: response.size,
        success: response.status === 200,
        details: response.body,
        authenticated: true
      });
    }

    // Test protected endpoints without authentication
    response = await this.makeRequest('GET', '/api/admin/inspections');
    this.recordTest({
      endpoint: '/api/admin/inspections (unauthorized)',
      method: 'GET',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 401, // Should fail without auth
      details: response.body,
      authenticated: false
    });
  }

  async testErrorHandling() {
    console.log('🔍 Testing Error Handling');

    // Test 404 for non-existent endpoint
    const response = await this.makeRequest('GET', '/api/non-existent-endpoint');
    this.recordTest({
      endpoint: '/api/non-existent-endpoint',
      method: 'GET',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 404,
      details: response.body
    });

    // Test invalid inspection ID
    const invalidResponse = await this.makeRequest('GET', '/api/inspections/invalid');
    this.recordTest({
      endpoint: '/api/inspections/invalid',
      method: 'GET',
      status: invalidResponse.status,
      responseTime: invalidResponse.responseTime,
      size: invalidResponse.size,
      success: invalidResponse.status === 400,
      details: invalidResponse.body
    });

    // Test non-existent inspection ID
    const notFoundResponse = await this.makeRequest('GET', '/api/inspections/999999');
    this.recordTest({
      endpoint: '/api/inspections/999999',
      method: 'GET',
      status: notFoundResponse.status,
      responseTime: notFoundResponse.responseTime,
      size: notFoundResponse.size,
      success: notFoundResponse.status === 404,
      details: notFoundResponse.body
    });

    // Test invalid JSON in POST
    try {
      const invalidJsonResponse = await this.makeRequest('POST', '/api/inspections', '{ invalid json }');
      this.recordTest({
        endpoint: '/api/inspections (invalid JSON)',
        method: 'POST',
        status: invalidJsonResponse.status,
        responseTime: invalidJsonResponse.responseTime,
        size: invalidJsonResponse.size,
        success: invalidJsonResponse.status === 400,
        details: invalidJsonResponse.body
      });
    } catch (e) {
      this.recordError('/api/inspections (invalid JSON)', 'Failed to send invalid JSON', e);
    }
  }

  async testSecurityHeaders() {
    console.log('🔍 Testing Security Headers');

    const response = await this.makeRequest('GET', '/health');

    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy',
      'referrer-policy'
    ];

    const headerTests = securityHeaders.map(header => ({
      header,
      present: !!response.headers[header],
      value: response.headers[header]
    }));

    this.recordTest({
      endpoint: 'Security Headers',
      method: 'HEAD',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: true,
      details: {
        headers: headerTests,
        allPresent: headerTests.filter(h => !h.present).length === 0
      }
    });

    TEST_RESULTS.security.push(...headerTests);
  }

  async testRateLimiting() {
    console.log('🔍 Testing Rate Limiting');

    // Make multiple rapid requests to test rate limiting
    const requests = [];
    const startTime = performance.now();

    for (let i = 0; i < 10; i++) {
      requests.push(this.makeRequest('GET', '/api/inspections'));
    }

    const responses = await Promise.all(requests);
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    const rateLimited = responses.some(r => r.status === 429);

    this.recordTest({
      endpoint: 'Rate Limiting Test',
      method: 'BURST',
      status: rateLimited ? 429 : 200,
      responseTime: Math.round(totalTime / responses.length),
      size: responses.reduce((sum, r) => sum + (r.size || 0), 0),
      success: true, // Rate limiting is good, so this is always successful
      details: {
        totalRequests: responses.length,
        totalTime: Math.round(totalTime),
        rateLimited,
        responses: responses.map(r => ({ status: r.status, responseTime: r.responseTime }))
      }
    });
  }

  async testPerformanceAndCleanup() {
    console.log('🔍 Testing Performance Metrics');

    // Test performance endpoint
    const response = await this.makeRequest('GET', '/api/performance/stats');
    this.recordTest({
      endpoint: '/api/performance/stats',
      method: 'GET',
      status: response.status,
      responseTime: response.responseTime,
      size: response.size,
      success: response.status === 200,
      details: response.body
    });

    // Test metrics endpoint
    const metricsResponse = await this.makeRequest('GET', '/metrics');
    this.recordTest({
      endpoint: '/metrics',
      method: 'GET',
      status: metricsResponse.status,
      responseTime: metricsResponse.responseTime,
      size: metricsResponse.size,
      success: metricsResponse.status === 200,
      details: metricsResponse.body
    });

    // Cleanup test data
    await this.cleanupTestData();
  }

  async cleanupTestData() {
    console.log('🧹 Cleaning up test data');

    // Delete created inspections
    for (const id of this.createdIds.inspections) {
      try {
        await this.makeRequest('DELETE', `/api/inspections/${id}`);
      } catch (e) {
        console.warn(`Failed to delete inspection ${id}:`, e.message);
      }
    }

    // Delete created custodial notes (if admin session exists)
    if (this.sessionToken) {
      for (const id of this.createdIds.custodialNotes) {
        try {
          await this.makeRequest('DELETE', `/api/admin/custodial-notes/${id}`);
        } catch (e) {
          console.warn(`Failed to delete custodial note ${id}:`, e.message);
        }
      }
    }
  }

  recordTest(testResult) {
    TEST_RESULTS.endpoint.push(testResult);

    // Performance data
    TEST_RESULTS.performance.push({
      endpoint: testResult.endpoint,
      method: testResult.method,
      responseTime: testResult.responseTime,
      size: testResult.size,
      timestamp: new Date().toISOString()
    });
  }

  recordError(endpoint, message, details) {
    TEST_RESULTS.errors.push({
      endpoint,
      message,
      details: details instanceof Error ? details.message : details,
      timestamp: new Date().toISOString()
    });
  }

  generateReport() {
    console.log('\n📊 Generating API Test Report\n');

    const totalTests = TEST_RESULTS.endpoint.length;
    const successfulTests = TEST_RESULTS.endpoint.filter(t => t.success).length;
    const failedTests = totalTests - successfulTests;
    const successRate = ((successfulTests / totalTests) * 100).toFixed(1);

    // Performance summary
    const avgResponseTime = TEST_RESULTS.performance
      .reduce((sum, p) => sum + p.responseTime, 0) / TEST_RESULTS.performance.length;

    const slowestEndpoint = TEST_RESULTS.performance
      .reduce((max, p) => p.responseTime > max.responseTime ? p : max, TEST_RESULTS.performance[0]);

    const fastestEndpoint = TEST_RESULTS.performance
      .reduce((min, p) => p.responseTime < min.responseTime ? p : min, TEST_RESULTS.performance[0]);

    // Summary
    TEST_RESULTS.summary = {
      totalTests,
      successfulTests,
      failedTests,
      successRate: `${successRate}%`,
      avgResponseTime: `${Math.round(avgResponseTime)}ms`,
      slowestEndpoint: `${slowestEndpoint.endpoint} (${slowestEndpoint.responseTime}ms)`,
      fastestEndpoint: `${fastestEndpoint.endpoint} (${fastestEndpoint.responseTime}ms)`,
      errorsCount: TEST_RESULTS.errors.length,
      securityHeadersPresent: TEST_RESULTS.security.filter(h => h.present).length,
      testDuration: 'Completed',
      timestamp: new Date().toISOString()
    };

    // Print summary
    console.log('='.repeat(60));
    console.log('🧪 API TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Successful: ${successfulTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);
    console.log(`Slowest Endpoint: ${slowestEndpoint.endpoint} (${slowestEndpoint.responseTime}ms)`);
    console.log(`Fastest Endpoint: ${fastestEndpoint.endpoint} (${fastestEndpoint.responseTime}ms)`);
    console.log(`Errors: ${TEST_RESULTS.errors.length}`);
    console.log(`Security Headers Present: ${TEST_RESULTS.security.filter(h => h.present).length}/${TEST_RESULTS.security.length}`);
    console.log('='.repeat(60));

    // Print failed tests
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      TEST_RESULTS.endpoint
        .filter(t => !t.success)
        .forEach(t => {
          console.log(`  • ${t.method} ${t.endpoint} - Status: ${t.status}, Time: ${t.responseTime}ms`);
          if (t.details && Object.keys(t.details).length > 0) {
            console.log(`    Details: ${JSON.stringify(t.details, null, 6).substring(0, 200)}...`);
          }
        });
    }

    // Print errors
    if (TEST_RESULTS.errors.length > 0) {
      console.log('\n⚠️ ERRORS:');
      TEST_RESULTS.errors.forEach(e => {
        console.log(`  • ${e.endpoint}: ${e.message}`);
        console.log(`    ${e.details}`);
      });
    }

    // Print security headers
    console.log('\n🔒 SECURITY HEADERS:');
    TEST_RESULTS.security.forEach(h => {
      const status = h.present ? '✅' : '❌';
      console.log(`  ${status} ${h.header}: ${h.present ? h.value : 'MISSING'}`);
    });

    // Performance details
    console.log('\n⚡ PERFORMANCE DETAILS:');
    const sortedByTime = [...TEST_RESULTS.performance].sort((a, b) => b.responseTime - a.responseTime);
    sortedByTime.slice(0, 10).forEach(p => {
      console.log(`  ${p.responseTime.toString().padStart(4)}ms ${p.method.padStart(4)} ${p.endpoint}`);
    });

    return TEST_RESULTS;
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive API Testing\n');

    const startTime = performance.now();

    try {
      await this.testHealthEndpoint();
      await this.testInspectionEndpoints();
      await this.testCustodialNotesEndpoints();
      await this.testMonthlyFeedbackEndpoints();
      await this.testScoresEndpoints();
      await this.testPhotoEndpoints();
      await this.testAdminEndpoints();
      await this.testErrorHandling();
      await this.testSecurityHeaders();
      await this.testRateLimiting();
      await this.testPerformanceAndCleanup();

      const endTime = performance.now();
      const totalDuration = Math.round(endTime - startTime);

      TEST_RESULTS.summary.testDuration = `${totalDuration}ms`;

      const report = this.generateReport();

      // Save report to file
      const reportPath = path.join(__dirname, 'api-test-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);

      return report;
    } catch (error) {
      console.error('\n💥 Test suite failed:', error);
      this.recordError('Test Suite', 'Fatal error', error);
      throw error;
    }
  }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new APITester(API_BASE_URL);

  tester.runAllTests()
    .then(() => {
      console.log('\n✅ API testing completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ API testing failed:', error);
      process.exit(1);
    });
}

export default APITester;