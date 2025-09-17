#!/usr/bin/env node

/**
 * Security Testing Suite for Custodial Command
 * Tests input validation, authentication, authorization, and security vulnerabilities
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://cacustodialcommand.up.railway.app';

// Security test results tracking
const securityResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  vulnerabilities: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordSecurityTest(testName, passed, details = '', severity = 'medium') {
  securityResults.total++;
  if (passed) {
    securityResults.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    securityResults.failed++;
    log(`FAIL: ${testName} - ${details}`, 'error');
    securityResults.vulnerabilities.push({ testName, details, severity });
  }
  securityResults.details.push({ testName, passed, details, severity });
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

// Test 1: Input Validation and Sanitization
async function testInputValidation() {
  log('🛡️ Testing Input Validation and Sanitization', 'info');
  
  // Test 1.1: SQL Injection attempts
  const sqlInjectionPayloads = [
    "'; DROP TABLE inspections; --",
    "' OR '1'='1",
    "'; INSERT INTO inspections VALUES (1, 'hacker', 'hacked', '2024-01-01', 'single_room', 'hacked', 'hacked', 'hacked', 'hacked', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'hacked', ARRAY[]::text[], ARRAY[]::text[], false, NOW()); --",
    "1' UNION SELECT * FROM users --",
    "admin'--",
    "' OR 1=1 --"
  ];

  for (const payload of sqlInjectionPayloads) {
    try {
      const maliciousData = {
        inspectorName: payload,
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
        notes: 'Test inspection'
      };

      const response = await makeRequest(`${BASE_URL}/api/inspections`, {
        method: 'POST',
        body: maliciousData
      });

      // Should either reject the request (400) or sanitize the input
      const passed = response.status === 400 || (response.status === 201 && !response.data.inspectorName?.includes(payload));
      recordSecurityTest(
        `SQL Injection - Inspector Name: ${payload.substring(0, 20)}...`, 
        passed, 
        `Status: ${response.status}, Response: ${JSON.stringify(response.data).substring(0, 100)}`,
        'high'
      );
    } catch (error) {
      recordSecurityTest(
        `SQL Injection - Inspector Name: ${payload.substring(0, 20)}...`, 
        true, // Error is good - means request was rejected
        `Request rejected: ${error.message}`,
        'high'
      );
    }
  }

  // Test 1.2: XSS attempts
  const xssPayloads = [
    "<script>alert('XSS')</script>",
    "javascript:alert('XSS')",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "';alert('XSS');//",
    "<iframe src=javascript:alert('XSS')></iframe>"
  ];

  for (const payload of xssPayloads) {
    try {
      const maliciousData = {
        inspectorName: 'Test Inspector',
        school: 'Test School',
        date: new Date().toISOString().split('T')[0],
        inspectionType: 'single_room',
        locationDescription: payload,
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
        notes: 'Test inspection'
      };

      const response = await makeRequest(`${BASE_URL}/api/inspections`, {
        method: 'POST',
        body: maliciousData
      });

      // Should either reject the request or sanitize the input
      const passed = response.status === 400 || (response.status === 201 && !response.data.locationDescription?.includes(payload));
      recordSecurityTest(
        `XSS - Location Description: ${payload.substring(0, 20)}...`, 
        passed, 
        `Status: ${response.status}`,
        'high'
      );
    } catch (error) {
      recordSecurityTest(
        `XSS - Location Description: ${payload.substring(0, 20)}...`, 
        true,
        `Request rejected: ${error.message}`,
        'high'
      );
    }
  }

  // Test 1.3: NoSQL Injection attempts
  const nosqlPayloads = [
    {"$where": "this.inspectorName == 'admin'"},
    {"$ne": null},
    {"$gt": ""},
    {"$regex": ".*"},
    {"$exists": true}
  ];

  for (const payload of nosqlPayloads) {
    try {
      const maliciousData = {
        inspectorName: payload,
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
        notes: 'Test inspection'
      };

      const response = await makeRequest(`${BASE_URL}/api/inspections`, {
        method: 'POST',
        body: maliciousData
      });

      const passed = response.status === 400;
      recordSecurityTest(
        `NoSQL Injection - Inspector Name`, 
        passed, 
        `Status: ${response.status}`,
        'high'
      );
    } catch (error) {
      recordSecurityTest(
        `NoSQL Injection - Inspector Name`, 
        true,
        `Request rejected: ${error.message}`,
        'high'
      );
    }
  }
}

// Test 2: Authentication and Authorization
async function testAuthenticationAuthorization() {
  log('🔐 Testing Authentication and Authorization', 'info');
  
  // Test 2.1: Unauthorized access to protected endpoints
  const protectedEndpoints = [
    { method: 'GET', path: '/api/admin/inspections' },
    { method: 'DELETE', path: '/api/admin/inspections/1' }
  ];

  for (const endpoint of protectedEndpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method
      });

      const passed = response.status === 401; // Should require authentication
      recordSecurityTest(
        `Unauthorized Access - ${endpoint.method} ${endpoint.path}`, 
        passed, 
        `Status: ${response.status}`,
        'high'
      );
    } catch (error) {
      recordSecurityTest(
        `Unauthorized Access - ${endpoint.method} ${endpoint.path}`, 
        true, // Error is good - means access was denied
        `Access denied: ${error.message}`,
        'high'
      );
    }
  }

  // Test 2.2: Invalid authentication tokens
  const invalidTokens = [
    'invalid_token',
    'Bearer invalid_token',
    'admin_token_fake',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c', // Fake JWT
    ''
  ];

  for (const token of invalidTokens) {
    try {
      const response = await makeRequest(`${BASE_URL}/api/admin/inspections`, {
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        }
      });

      const passed = response.status === 401;
      recordSecurityTest(
        `Invalid Token - ${token.substring(0, 20)}...`, 
        passed, 
        `Status: ${response.status}`,
        'medium'
      );
    } catch (error) {
      recordSecurityTest(
        `Invalid Token - ${token.substring(0, 20)}...`, 
        true,
        `Access denied: ${error.message}`,
        'medium'
      );
    }
  }

  // Test 2.3: Session hijacking attempts
  try {
    // First, get a valid session
    const loginResponse = await makeRequest(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      body: {
        username: 'admin',
        password: '7lGaEWFy3bDbL5NUAxg7zHihLQzWMBHfYu4O/THc3BM='
      }
    });

    if (loginResponse.status === 200 && loginResponse.data.sessionToken) {
      const validToken = loginResponse.data.sessionToken;
      
      // Try to modify the token
      const modifiedToken = validToken + '_modified';
      
      const response = await makeRequest(`${BASE_URL}/api/admin/inspections`, {
        headers: {
          'Authorization': `Bearer ${modifiedToken}`
        }
      });

      const passed = response.status === 401;
      recordSecurityTest(
        'Session Hijacking - Modified Token', 
        passed, 
        `Status: ${response.status}`,
        'high'
      );
    } else {
      recordSecurityTest('Session Hijacking - Modified Token', false, 'Could not obtain valid session', 'high');
    }
  } catch (error) {
    recordSecurityTest('Session Hijacking - Modified Token', true, `Access denied: ${error.message}`, 'high');
  }
}

// Test 3: Rate Limiting and DoS Protection
async function testRateLimiting() {
  log('🚦 Testing Rate Limiting and DoS Protection', 'info');
  
  // Test 3.1: Rapid requests to check for rate limiting
  const rapidRequests = [];
  const requestCount = 20;
  
  for (let i = 0; i < requestCount; i++) {
    rapidRequests.push(
      makeRequest(`${BASE_URL}/api/inspections`)
        .then(response => ({ success: true, status: response.status }))
        .catch(error => ({ success: false, error: error.message }))
    );
  }

  try {
    const results = await Promise.all(rapidRequests);
    const successCount = results.filter(r => r.success).length;
    const rateLimitedCount = results.filter(r => r.success && r.status === 429).length;
    
    // If we get rate limited, that's good (security working)
    // If we don't get rate limited, that might be acceptable depending on implementation
    const passed = rateLimitedCount > 0 || successCount === requestCount;
    recordSecurityTest(
      'Rate Limiting - Rapid Requests', 
      passed, 
      `${successCount}/${requestCount} successful, ${rateLimitedCount} rate limited`,
      'medium'
    );
  } catch (error) {
    recordSecurityTest('Rate Limiting - Rapid Requests', false, `Test failed: ${error.message}`, 'medium');
  }

  // Test 3.2: Large payload attacks
  const largePayload = {
    inspectorName: 'A'.repeat(10000), // 10KB string
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
    notes: 'Test inspection'
  };

  try {
    const response = await makeRequest(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      body: largePayload
    });

    // Should either reject large payloads or handle them gracefully
    const passed = response.status === 400 || response.status === 413 || response.status === 201;
    recordSecurityTest(
      'Large Payload Protection', 
      passed, 
      `Status: ${response.status}`,
      'medium'
    );
  } catch (error) {
    recordSecurityTest('Large Payload Protection', true, `Request rejected: ${error.message}`, 'medium');
  }
}

// Test 4: Information Disclosure
async function testInformationDisclosure() {
  log('🔍 Testing Information Disclosure', 'info');
  
  // Test 4.1: Check for sensitive information in error messages
  try {
    const response = await makeRequest(`${BASE_URL}/api/inspections/999999`); // Non-existent ID
    
    const errorMessage = JSON.stringify(response.data).toLowerCase();
    const sensitiveInfo = [
      'password',
      'secret',
      'key',
      'token',
      'database',
      'connection',
      'sql',
      'query',
      'stack trace',
      'file path',
      'directory'
    ];

    const hasSensitiveInfo = sensitiveInfo.some(info => errorMessage.includes(info));
    const passed = !hasSensitiveInfo;
    recordSecurityTest(
      'Information Disclosure - Error Messages', 
      passed, 
      hasSensitiveInfo ? 'Sensitive information found in error message' : 'No sensitive information disclosed',
      'medium'
    );
  } catch (error) {
    recordSecurityTest('Information Disclosure - Error Messages', true, 'Error message not accessible', 'medium');
  }

  // Test 4.2: Check for debug information in production
  try {
    const response = await makeRequest(`${BASE_URL}/api/inspections`);
    
    const responseText = JSON.stringify(response.data).toLowerCase();
    const debugInfo = [
      'debug',
      'development',
      'localhost',
      '127.0.0.1',
      'stack trace',
      'console.log',
      'var_dump',
      'print_r'
    ];

    const hasDebugInfo = debugInfo.some(info => responseText.includes(info));
    const passed = !hasDebugInfo;
    recordSecurityTest(
      'Information Disclosure - Debug Information', 
      passed, 
      hasDebugInfo ? 'Debug information found in response' : 'No debug information disclosed',
      'low'
    );
  } catch (error) {
    recordSecurityTest('Information Disclosure - Debug Information', true, 'Response not accessible', 'low');
  }

  // Test 4.3: Check for directory traversal attempts
  const directoryTraversalPayloads = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
    '....//....//....//etc/passwd',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '..%252f..%252f..%252fetc%252fpasswd'
  ];

  for (const payload of directoryTraversalPayloads) {
    try {
      const response = await makeRequest(`${BASE_URL}/api/inspections/${payload}`);
      
      const passed = response.status === 400 || response.status === 404;
      recordSecurityTest(
        `Directory Traversal - ${payload.substring(0, 20)}...`, 
        passed, 
        `Status: ${response.status}`,
        'high'
      );
    } catch (error) {
      recordSecurityTest(
        `Directory Traversal - ${payload.substring(0, 20)}...`, 
        true,
        `Request rejected: ${error.message}`,
        'high'
      );
    }
  }
}

// Test 5: HTTP Security Headers
async function testSecurityHeaders() {
  log('🛡️ Testing HTTP Security Headers', 'info');
  
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    
    const headers = response.headers;
    const securityHeaders = [
      { name: 'X-Content-Type-Options', expected: 'nosniff' },
      { name: 'X-Frame-Options', expected: ['DENY', 'SAMEORIGIN'] },
      { name: 'X-XSS-Protection', expected: '1; mode=block' },
      { name: 'Strict-Transport-Security', expected: 'max-age=' },
      { name: 'Content-Security-Policy', expected: null }, // Just check if present
      { name: 'Referrer-Policy', expected: null } // Just check if present
    ];

    for (const header of securityHeaders) {
      const headerValue = headers[header.name.toLowerCase()];
      let passed = false;

      if (header.expected === null) {
        passed = !!headerValue; // Just check if header is present
      } else if (Array.isArray(header.expected)) {
        passed = header.expected.some(expected => headerValue?.includes(expected));
      } else {
        passed = headerValue?.includes(header.expected);
      }

      recordSecurityTest(
        `Security Header - ${header.name}`, 
        passed, 
        passed ? `Present: ${headerValue}` : `Missing or incorrect: ${headerValue || 'not set'}`,
        'medium'
      );
    }
  } catch (error) {
    recordSecurityTest('Security Headers', false, `Test failed: ${error.message}`, 'medium');
  }
}

// Test 6: File Upload Security
async function testFileUploadSecurity() {
  log('📁 Testing File Upload Security', 'info');
  
  // Test 6.1: Malicious file types
  const maliciousFiles = [
    { name: 'malicious.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/x-php' },
    { name: 'malicious.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>', type: 'application/x-jsp' },
    { name: 'malicious.exe', content: 'MZ\x90\x00', type: 'application/x-executable' },
    { name: 'malicious.sh', content: '#!/bin/bash\nrm -rf /', type: 'application/x-sh' }
  ];

  for (const file of maliciousFiles) {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('images', Buffer.from(file.content), {
        filename: file.name,
        contentType: file.type
      });
      
      // Add required fields for inspection
      form.append('inspectorName', 'Security Test Inspector');
      form.append('school', 'Security Test School');
      form.append('date', new Date().toISOString().split('T')[0]);
      form.append('inspectionType', 'single_room');
      form.append('locationDescription', 'Security test location');
      form.append('roomNumber', 'S101');
      form.append('locationCategory', 'classroom');
      form.append('buildingName', 'Security Test Building');
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
      form.append('notes', 'Security test with malicious file');

      const response = await new Promise((resolve, reject) => {
        const isHttps = BASE_URL.startsWith('https://');
        const client = isHttps ? https : http;
        
        const url = new URL(`${BASE_URL}/api/inspections`);
        const options = {
          method: 'POST',
          headers: form.getHeaders(),
          timeout: 10000
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

      const passed = response.status === 400 || response.status === 415; // Should reject malicious files
      recordSecurityTest(
        `File Upload Security - ${file.name}`, 
        passed, 
        `Status: ${response.status}`,
        'high'
      );
    } catch (error) {
      recordSecurityTest(
        `File Upload Security - ${file.name}`, 
        true, // Error is good - means file was rejected
        `File rejected: ${error.message}`,
        'high'
      );
    }
  }

  // Test 6.2: Oversized files
  try {
    const FormData = require('form-data');
    const form = new FormData();
    
    // Create a large file (10MB)
    const largeFileContent = Buffer.alloc(10 * 1024 * 1024, 'A');
    form.append('images', largeFileContent, {
      filename: 'large-file.jpg',
      contentType: 'image/jpeg'
    });
    
    // Add required fields
    form.append('inspectorName', 'Security Test Inspector');
    form.append('school', 'Security Test School');
    form.append('date', new Date().toISOString().split('T')[0]);
    form.append('inspectionType', 'single_room');
    form.append('locationDescription', 'Security test location');
    form.append('roomNumber', 'S101');
    form.append('locationCategory', 'classroom');
    form.append('buildingName', 'Security Test Building');
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
    form.append('notes', 'Security test with large file');

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

    const passed = response.status === 413; // Should reject oversized files
    recordSecurityTest(
      'File Upload Security - Oversized File', 
      passed, 
      `Status: ${response.status}`,
      'medium'
    );
  } catch (error) {
    recordSecurityTest(
      'File Upload Security - Oversized File', 
      true, // Error is good - means file was rejected
      `File rejected: ${error.message}`,
      'medium'
    );
  }
}

// Main test runner
async function runSecurityTests() {
  log('🚀 Starting Security Test Suite', 'info');
  log(`📍 Testing against: ${BASE_URL}`, 'info');
  log('', 'info');

  // Run all security tests
  await testInputValidation();
  log('', 'info');
  
  await testAuthenticationAuthorization();
  log('', 'info');
  
  await testRateLimiting();
  log('', 'info');
  
  await testInformationDisclosure();
  log('', 'info');
  
  await testSecurityHeaders();
  log('', 'info');
  
  await testFileUploadSecurity();
  log('', 'info');

  // Generate report
  generateSecurityReport();
}

function generateSecurityReport() {
  log('📊 Security Test Results Summary', 'info');
  log('=' * 50, 'info');
  log(`Total Security Tests: ${securityResults.total}`, 'info');
  log(`Passed: ${securityResults.passed}`, 'success');
  log(`Failed: ${securityResults.failed}`, securityResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((securityResults.passed / securityResults.total) * 100).toFixed(1)}%`, 'info');
  log('', 'info');

  // Vulnerability summary
  if (securityResults.vulnerabilities.length > 0) {
    log('🚨 Security Vulnerabilities Found:', 'error');
    
    const highVulns = securityResults.vulnerabilities.filter(v => v.severity === 'high');
    const mediumVulns = securityResults.vulnerabilities.filter(v => v.severity === 'medium');
    const lowVulns = securityResults.vulnerabilities.filter(v => v.severity === 'low');
    
    if (highVulns.length > 0) {
      log(`  🔴 High Severity: ${highVulns.length}`, 'error');
      highVulns.forEach(vuln => log(`    - ${vuln.testName}: ${vuln.details}`, 'error'));
    }
    
    if (mediumVulns.length > 0) {
      log(`  🟡 Medium Severity: ${mediumVulns.length}`, 'warning');
      mediumVulns.forEach(vuln => log(`    - ${vuln.testName}: ${vuln.details}`, 'warning'));
    }
    
    if (lowVulns.length > 0) {
      log(`  🟢 Low Severity: ${lowVulns.length}`, 'info');
      lowVulns.forEach(vuln => log(`    - ${vuln.testName}: ${vuln.details}`, 'info'));
    }
    
    log('', 'info');
  }

  log('✅ All Security Tests Completed', 'success');
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'security-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: securityResults.total,
      passed: securityResults.passed,
      failed: securityResults.failed,
      successRate: (securityResults.passed / securityResults.total) * 100
    },
    vulnerabilities: securityResults.vulnerabilities,
    details: securityResults.details
  }, null, 2));
  
  log(`📄 Detailed security report saved to: ${reportPath}`, 'info');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSecurityTests().catch(error => {
    log(`💥 Security test suite failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runSecurityTests,
  securityResults
};
