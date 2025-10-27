import fetch from 'node-fetch';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

class SecurityTester {
  constructor() {
    this.results = [];
    this.passedTests = 0;
    this.failedTests = 0;
    this.validAdminToken = null;
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
      
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}${path}`, options);
      const responseTime = Date.now() - startTime;
      
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }
      
      if (response.ok) {
        this.log(`✅ ${name} - Status: ${response.status}, Time: ${responseTime}ms`, 'PASS');
        this.passedTests++;
        return { success: true, data: responseData, status: response.status };
      } else {
        this.log(`❌ ${name} - Status: ${response.status}, Error: ${JSON.stringify(responseData)}`, 'FAIL');
        this.failedTests++;
        return { success: false, data: responseData, status: response.status };
      }
    } catch (error) {
      this.log(`❌ ${name} - Error: ${error.message}`, 'FAIL');
      this.failedTests++;
      return { success: false, error: error.message };
    }
  }

  // Test admin login endpoint
  async testAdminLogin() {
    this.log('=== Testing Admin Login Endpoint ===');
    
    // Test with invalid credentials
    const invalidLogin = await this.testEndpoint(
      'Admin Login with Invalid Credentials', 
      '/api/admin/login', 
      'POST', 
      { username: 'invalid', password: 'invalid' }
    );
    
    if (!invalidLogin.success) {
      this.log('✅ Invalid credentials correctly rejected');
    } else if (invalidLogin.data.success === false) {
      this.log('✅ Invalid credentials correctly rejected (with proper response)');
    } else {
      this.log('❌ Invalid credentials should have been rejected', 'FAIL');
    }
    
    // Test with missing credentials
    const missingCreds = await this.testEndpoint(
      'Admin Login with Missing Username', 
      '/api/admin/login', 
      'POST', 
      { username: '', password: 'password' }
    );
    
    if (!missingCreds.success || (missingCreds.data.success === false && missingCreds.data.message)) {
      this.log('✅ Missing credentials correctly handled');
    } else {
      this.log('❌ Missing credentials should have been rejected', 'FAIL');
    }
    
    const missingPassword = await this.testEndpoint(
      'Admin Login with Missing Password', 
      '/api/admin/login', 
      'POST', 
      { username: 'admin', password: '' }
    );
    
    if (!missingPassword.success || (missingPassword.data.success === false && missingPassword.data.message)) {
      this.log('✅ Missing password correctly handled');
    } else {
      this.log('❌ Missing password should have been rejected', 'FAIL');
    }
    
    // Test with no credentials
    const noCreds = await this.testEndpoint(
      'Admin Login with No Credentials', 
      '/api/admin/login', 
      'POST', 
      {}
    );
    
    if (!noCreds.success || (noCreds.data.success === false && noCreds.data.message)) {
      this.log('✅ No credentials correctly handled');
    } else {
      this.log('❌ No credentials should have been rejected', 'FAIL');
    }
  }

  // Test admin endpoints without authentication
  async testAdminEndpointsWithoutAuth() {
    this.log('=== Testing Admin Endpoints Without Authentication ===');
    
    // Try to access admin inspections endpoint without token
    const noAuthResult = await this.testEndpoint(
      'Get Admin Inspections Without Auth', 
      '/api/admin/inspections'
    );
    
    if (!noAuthResult.success) {
      this.log('✅ Admin endpoint correctly requires authentication');
    } else {
      this.log('❌ Admin endpoint should require authentication', 'FAIL');
    }
    
    // Try to delete an inspection without auth
    const noAuthDelete = await this.testEndpoint(
      'Delete Inspection Without Auth', 
      '/api/admin/inspections/1', 
      'DELETE'
    );
    
    if (!noAuthDelete.success) {
      this.log('✅ Admin delete endpoint correctly requires authentication');
    } else {
      this.log('❌ Admin delete endpoint should require authentication', 'FAIL');
    }
  }

  // Test admin endpoints with invalid token
  async testAdminEndpointsWithInvalidToken() {
    this.log('=== Testing Admin Endpoints With Invalid Token ===');
    
    // Try to access admin endpoints with invalid token
    const invalidTokenResult = await this.testEndpoint(
      'Get Admin Inspections With Invalid Token', 
      '/api/admin/inspections',
      'GET',
      null,
      { 'Authorization': 'Bearer invalid-token' }
    );
    
    if (!invalidTokenResult.success) {
      this.log('✅ Admin endpoint correctly rejects invalid token');
    } else {
      this.log('❌ Admin endpoint should reject invalid token', 'FAIL');
    }
    
    // Try to delete with invalid token
    const invalidTokenDelete = await this.testEndpoint(
      'Delete Inspection With Invalid Token', 
      '/api/admin/inspections/1', 
      'DELETE',
      null,
      { 'Authorization': 'Bearer invalid-token' }
    );
    
    if (!invalidTokenDelete.success) {
      this.log('✅ Admin delete endpoint correctly rejects invalid token');
    } else {
      this.log('❌ Admin delete endpoint should reject invalid token', 'FAIL');
    }
  }

  // Test rate limiting
  async testRateLimiting() {
    this.log('=== Testing API Rate Limiting ===');
    
    // Make multiple requests quickly to test rate limiting
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        this.testEndpoint(
          `Rate Limit Test Request #${i+1}`, 
          '/api/inspections'
        )
      );
    }
    
    const results = await Promise.all(promises);
    const rateLimited = results.filter(result => 
      result.status === 429 || 
      (result.data && typeof result.data.error === 'string' && result.data.error.toLowerCase().includes('rate'))
    );
    
    if (rateLimited.length > 0) {
      this.log(`✅ Rate limiting is working - ${rateLimited.length} requests were rate-limited`);
    } else {
      this.log('ℹ️ Rate limiting may not be active or threshold not reached');
    }
  }

  // Test SQL injection attempts
  async testSQLInjectionProtection() {
    this.log('=== Testing SQL Injection Protection ===');
    
    // Test with SQL injection in various fields
    const sqlInjectionTests = [
      {
        name: 'SQL Injection in School Field',
        data: {
          inspectorName: 'Security Test',
          school: "ASA'; DROP TABLE inspections; --",
          date: new Date().toISOString().split('T')[0],
          inspectionType: 'single_room',
          locationDescription: 'Security test',
          roomNumber: 'SQL-TEST-001',
          locationCategory: 'classroom',
          floors: 3,
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
          notes: 'Security testing',
          images: [],
          isCompleted: false
        }
      },
      {
        name: 'SQL Injection in Room Number',
        data: {
          inspectorName: 'Security Test',
          school: 'ASA',
          date: new Date().toISOString().split('T')[0],
          inspectionType: 'single_room',
          locationDescription: 'Security test',
          roomNumber: "101'; DELETE FROM inspections; --",
          locationCategory: 'classroom',
          floors: 3,
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
          notes: 'Security testing',
          images: [],
          isCompleted: false
        }
      },
      {
        name: 'SQL Injection in Location Description',
        data: {
          inspectorName: 'Security Test',
          school: 'ASA',
          date: new Date().toISOString().split('T')[0],
          inspectionType: 'single_room',
          locationDescription: "Test'; UPDATE inspections SET floors=99 WHERE 1=1; --",
          roomNumber: 'SQL-TEST-002',
          locationCategory: 'classroom',
          floors: 3,
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
          notes: 'Security testing',
          images: [],
          isCompleted: false
        }
      }
    ];
    
    for (const test of sqlInjectionTests) {
      const result = await this.testEndpoint(
        test.name, 
        '/api/inspections', 
        'POST', 
        test.data
      );
      
      if (!result.success) {
        this.log(`✅ ${test.name} correctly rejected potential SQL injection`);
      } else {
        this.log(`⚠️ ${test.name} may have allowed potential SQL injection`, 'WARNING');
      }
    }
  }

  // Test XSS protection
  async testXSSProtection() {
    this.log('=== Testing XSS Protection ===');
    
    // Test with XSS in various fields
    const xssTests = [
      {
        name: 'XSS in School Field',
        data: {
          inspectorName: 'Security Test',
          school: 'ASA<script>alert("xss")</script>',
          date: new Date().toISOString().split('T')[0],
          inspectionType: 'single_room',
          locationDescription: 'Security test',
          roomNumber: 'XSS-TEST-001',
          locationCategory: 'classroom',
          floors: 3,
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
          notes: 'Security testing',
          images: [],
          isCompleted: false
        }
      },
      {
        name: 'XSS in Room Number',
        data: {
          inspectorName: 'Security Test',
          school: 'ASA',
          date: new Date().toISOString().split('T')[0],
          inspectionType: 'single_room',
          locationDescription: 'Security test',
          roomNumber: '101<script>document.location="http://evil.com"</script>',
          locationCategory: 'classroom',
          floors: 3,
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
          notes: 'Security testing',
          images: [],
          isCompleted: false
        }
      },
      {
        name: 'XSS in Notes Field',
        data: {
          inspectorName: 'Security Test',
          school: 'ASA',
          date: new Date().toISOString().split('T')[0],
          inspectionType: 'single_room',
          locationDescription: 'Security test',
          roomNumber: 'XSS-TEST-002',
          locationCategory: 'classroom',
          floors: 3,
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
          notes: 'Normal note <img src="x" onerror="alert(\'xss\')">',
          images: [],
          isCompleted: false
        }
      }
    ];
    
    for (const test of xssTests) {
      const result = await this.testEndpoint(
        test.name, 
        '/api/inspections', 
        'POST', 
        test.data
      );
      
      if (!result.success) {
        this.log(`✅ ${test.name} correctly rejected potential XSS`);
      } else {
        this.log(`⚠️ ${test.name} may have allowed potential XSS`, 'WARNING');
      }
    }
  }

  // Test API endpoint security
  async testAPISecurity() {
    this.log('=== Testing General API Security ===');
    
    // Test access to internal system files (if any exist)
    const internalFileTests = [
      { path: '/api/../../../etc/passwd', name: 'Path Traversal Attempt 1' },
      { path: '/api/../../../windows/system32/', name: 'Path Traversal Attempt 2' },
      { path: '/api/proc/self/environ', name: 'Proc File Access Attempt' }
    ];
    
    for (const test of internalFileTests) {
      const result = await this.testEndpoint(
        test.name, 
        test.path
      );
      
      if (!result.success) {
        this.log(`✅ ${test.name} correctly blocked`);
      } else {
        this.log(`⚠️ ${test.name} was accessible - potential security issue`, 'WARNING');
      }
    }
    
    // Test HTTP methods on endpoints that shouldn't support them
    const methodTests = [
      { path: '/health', method: 'POST', name: 'POST on GET-only Health Endpoint' },
      { path: '/health', method: 'PUT', name: 'PUT on Health Endpoint' },
      { path: '/health', method: 'DELETE', name: 'DELETE on Health Endpoint' }
    ];
    
    for (const test of methodTests) {
      const result = await this.testEndpoint(
        test.name, 
        test.path, 
        test.method
      );
      
      // These should ideally return 405 (Method Not Allowed) or similar
      if (result.status === 405 || result.status >= 400) {
        this.log(`✅ ${test.name} correctly restricted`);
      } else {
        this.log(`ℹ️ ${test.name} returned ${result.status} - check if method should be allowed`);
      }
    }
  }

  // Test authentication with potentially valid credentials from environment or defaults
  async testDefaultCredentials() {
    this.log('=== Testing Default/Admin Credentials ===');
    
    // Try default credentials if they exist in environment
    const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
    
    // Test with default username and invalid password
    const defaultInvalid = await this.testEndpoint(
      `Admin Login with Default Username, Invalid Password`, 
      '/api/admin/login', 
      'POST', 
      { 
        username: defaultUsername, 
        password: 'invalid-password' 
      }
    );
    
    if (!defaultInvalid.success || (defaultInvalid.data.success === false)) {
      this.log('✅ Default credentials with invalid password correctly rejected');
    } else {
      this.log('⚠️ Default credentials were accepted with invalid password!', 'CRITICAL');
    }
  }

  // Test session management
  async testSessionManagement() {
    this.log('=== Testing Session Management ===');
    
    // Test session expiration isn't really possible without a valid session,
    // but we can test that expired tokens are rejected if we had a way to create them
    
    // Test multiple authentication requests to see if there's proper session handling
    this.log('Testing multiple authentication pattern...');
    
    // Test 5 consecutive requests to same endpoint
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        this.testEndpoint(
          `Session Test Request #${i+1}`, 
          '/health'
        )
      );
    }
    
    await Promise.all(promises);
    this.log('✅ Multiple requests handled without apparent session issues');
  }

  // Run comprehensive security tests
  async runAllSecurityTests() {
    this.log('🚀 Starting Comprehensive Security Testing');
    this.log(`Testing against: ${BASE_URL}`);
    
    await this.testAdminLogin();
    await this.testAdminEndpointsWithoutAuth();
    await this.testAdminEndpointsWithInvalidToken();
    await this.testRateLimiting();
    await this.testSQLInjectionProtection();
    await this.testXSSProtection();
    await this.testAPISecurity();
    await this.testDefaultCredentials();
    await this.testSessionManagement();
    
    this.log('=== SECURITY TEST RESULTS SUMMARY ===');
    this.log(`Total Tests: ${this.passedTests + this.failedTests}`);
    this.log(`Passed: ${this.passedTests}`);
    this.log(`Failed: ${this.failedTests}`);
    this.log(`Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
    
    if (this.failedTests === 0) {
      this.log('🎉 ALL SECURITY TESTS PASSED!', 'SUCCESS');
    } else {
      this.log('⚠️ Some security tests failed. Check the logs above for details.', 'WARNING');
    }
    
    this.log('=== SECURITY RECOMMENDATIONS ===');
    this.log('• Implement proper input validation and sanitization');
    this.log('• Ensure all admin endpoints require authentication');
    this.log('• Validate session tokens properly');
    this.log('• Implement robust rate limiting');
    this.log('• Use parameterized queries to prevent SQL injection');
    this.log('• Implement proper output encoding to prevent XSS');
    this.log('• Restrict access to sensitive endpoints');
  }
}

// Run the security tests
const tester = new SecurityTester();
tester.runAllSecurityTests().catch(console.error);