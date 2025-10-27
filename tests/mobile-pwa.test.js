#!/usr/bin/env node

/**
 * Mobile and PWA Testing Suite for Custodial Command
 * Tests Progressive Web App functionality, mobile responsiveness, and offline capabilities
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://cacustodialcommand.up.railway.app';

// Mobile/PWA test results tracking
const mobileResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  pwaFeatures: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordMobileTest(testName, passed, details = '', feature = 'general') {
  mobileResults.total++;
  if (passed) {
    mobileResults.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    mobileResults.failed++;
    log(`FAIL: ${testName} - ${details}`, 'error');
  }
  mobileResults.details.push({ testName, passed, details, feature });
  mobileResults.pwaFeatures.push({ testName, passed, feature });
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
        'User-Agent': options.userAgent || 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
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

// Test 1: PWA Manifest and Service Worker
async function testPWAManifest() {
  log('📱 Testing PWA Manifest and Service Worker', 'info');
  
  // Test 1.1: Check for manifest.json
  try {
    const response = await makeRequest(`${BASE_URL}/manifest.json`);
    
    if (response.status === 200 && response.data) {
      const manifest = response.data;
      
      // Check required PWA manifest fields
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      const hasRequiredFields = requiredFields.every(field => manifest[field]);
      
      recordMobileTest(
        'PWA Manifest - Required Fields', 
        hasRequiredFields, 
        hasRequiredFields ? 'All required fields present' : `Missing fields: ${requiredFields.filter(f => !manifest[f]).join(', ')}`,
        'manifest'
      );
      
      // Check display mode
      const displayMode = manifest.display;
      const validDisplayModes = ['standalone', 'fullscreen', 'minimal-ui'];
      const validDisplay = validDisplayModes.includes(displayMode);
      
      recordMobileTest(
        'PWA Manifest - Display Mode', 
        validDisplay, 
        validDisplay ? `Display mode: ${displayMode}` : `Invalid display mode: ${displayMode}`,
        'manifest'
      );
      
      // Check icons
      if (manifest.icons && Array.isArray(manifest.icons)) {
        const hasRequiredSizes = manifest.icons.some(icon => 
          icon.sizes && (icon.sizes.includes('192x192') || icon.sizes.includes('512x512'))
        );
        
        recordMobileTest(
          'PWA Manifest - Icons', 
          hasRequiredSizes, 
          hasRequiredSizes ? `Found ${manifest.icons.length} icons with required sizes` : 'Missing required icon sizes (192x192 or 512x512)',
          'manifest'
        );
      } else {
        recordMobileTest('PWA Manifest - Icons', false, 'No icons found in manifest', 'manifest');
      }
      
    } else {
      recordMobileTest('PWA Manifest - File Access', false, `Manifest not accessible: ${response.status}`, 'manifest');
    }
  } catch (error) {
    recordMobileTest('PWA Manifest - File Access', false, `Manifest request failed: ${error.message}`, 'manifest');
  }

  // Test 1.2: Check for service worker
  try {
    const response = await makeRequest(`${BASE_URL}/sw.js`);
    
    const hasServiceWorker = response.status === 200;
    recordMobileTest(
      'PWA Service Worker - File Access', 
      hasServiceWorker, 
      hasServiceWorker ? 'Service worker file accessible' : `Service worker not accessible: ${response.status}`,
      'service-worker'
    );
    
    if (hasServiceWorker) {
      // Check if service worker contains basic PWA functionality
      const swContent = response.data;
      const hasCacheStrategy = swContent.includes('cache') || swContent.includes('Cache');
      const hasFetchHandler = swContent.includes('fetch') || swContent.includes('Fetch');
      
      recordMobileTest(
        'PWA Service Worker - Cache Strategy', 
        hasCacheStrategy, 
        hasCacheStrategy ? 'Cache strategy implemented' : 'No cache strategy found',
        'service-worker'
      );
      
      recordMobileTest(
        'PWA Service Worker - Fetch Handler', 
        hasFetchHandler, 
        hasFetchHandler ? 'Fetch handler implemented' : 'No fetch handler found',
        'service-worker'
      );
    }
  } catch (error) {
    recordMobileTest('PWA Service Worker - File Access', false, `Service worker request failed: ${error.message}`, 'service-worker');
  }
}

// Test 2: Mobile Responsiveness and Touch Interface
async function testMobileResponsiveness() {
  log('📱 Testing Mobile Responsiveness', 'info');
  
  // Test 2.1: Check viewport meta tag
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    
    if (response.status === 200 && response.data) {
      const htmlContent = response.data;
      const hasViewportMeta = htmlContent.includes('viewport') && htmlContent.includes('width=device-width');
      
      recordMobileTest(
        'Mobile Responsiveness - Viewport Meta Tag', 
        hasViewportMeta, 
        hasViewportMeta ? 'Viewport meta tag present' : 'Viewport meta tag missing or incorrect',
        'responsive'
      );
      
      // Check for touch-friendly elements
      const hasTouchFriendly = htmlContent.includes('touch') || htmlContent.includes('mobile') || htmlContent.includes('responsive');
      
      recordMobileTest(
        'Mobile Responsiveness - Touch-Friendly Design', 
        hasTouchFriendly, 
        hasTouchFriendly ? 'Touch-friendly design elements found' : 'No touch-friendly design elements detected',
        'responsive'
      );
    } else {
      recordMobileTest('Mobile Responsiveness - Page Access', false, `Page not accessible: ${response.status}`, 'responsive');
    }
  } catch (error) {
    recordMobileTest('Mobile Responsiveness - Page Access', false, `Page request failed: ${error.message}`, 'responsive');
  }

  // Test 2.2: Test with different mobile user agents
  const mobileUserAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  ];

  for (const userAgent of mobileUserAgents) {
    try {
      const response = await makeRequest(`${BASE_URL}/`, { userAgent });
      
      const passed = response.status === 200;
      const deviceType = userAgent.includes('iPhone') ? 'iPhone' : 
                        userAgent.includes('iPad') ? 'iPad' : 
                        userAgent.includes('Android') ? 'Android' : 'Mobile';
      
      recordMobileTest(
        `Mobile Responsiveness - ${deviceType}`, 
        passed, 
        passed ? `${deviceType} page loads successfully` : `${deviceType} page failed to load: ${response.status}`,
        'responsive'
      );
    } catch (error) {
      recordMobileTest(
        `Mobile Responsiveness - ${userAgent.includes('iPhone') ? 'iPhone' : userAgent.includes('Android') ? 'Android' : 'Mobile'}`, 
        false, 
        `Request failed: ${error.message}`,
        'responsive'
      );
    }
  }
}

// Test 3: PWA Installation and Offline Functionality
async function testPWAInstallation() {
  log('📱 Testing PWA Installation Features', 'info');
  
  // Test 3.1: Check for install prompts and PWA detection
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    
    if (response.status === 200 && response.data) {
      const htmlContent = response.data;
      
      // Check for PWA installation detection
      const hasInstallDetection = htmlContent.includes('beforeinstallprompt') || 
                                 htmlContent.includes('appinstalled') ||
                                 htmlContent.includes('PWA') ||
                                 htmlContent.includes('install');
      
      recordMobileTest(
        'PWA Installation - Detection', 
        hasInstallDetection, 
        hasInstallDetection ? 'PWA installation detection found' : 'No PWA installation detection found',
        'installation'
      );
      
      // Check for offline functionality indicators
      const hasOfflineSupport = htmlContent.includes('offline') || 
                               htmlContent.includes('cache') ||
                               htmlContent.includes('service worker');
      
      recordMobileTest(
        'PWA Installation - Offline Support', 
        hasOfflineSupport, 
        hasOfflineSupport ? 'Offline functionality indicators found' : 'No offline functionality indicators found',
        'installation'
      );
    } else {
      recordMobileTest('PWA Installation - Page Access', false, `Page not accessible: ${response.status}`, 'installation');
    }
  } catch (error) {
    recordMobileTest('PWA Installation - Page Access', false, `Page request failed: ${error.message}`, 'installation');
  }
}

// Test 4: Mobile API Performance
async function testMobileAPIPerformance() {
  log('📱 Testing Mobile API Performance', 'info');
  
  // Test 4.1: API response times on mobile
  const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
  
  const apiEndpoints = [
    '/api/inspections',
    '/api/custodial-notes',
    '/health'
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const startTime = Date.now();
      const response = await makeRequest(`${BASE_URL}${endpoint}`, { userAgent: mobileUserAgent });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Mobile performance threshold: 3 seconds
      const passed = response.status >= 200 && response.status < 300 && responseTime <= 3000;
      
      recordMobileTest(
        `Mobile API Performance - ${endpoint}`, 
        passed, 
        `Status: ${response.status}, Time: ${responseTime}ms`,
        'performance'
      );
    } catch (error) {
      recordMobileTest(
        `Mobile API Performance - ${endpoint}`, 
        false, 
        `Request failed: ${error.message}`,
        'performance'
      );
    }
  }
}

// Test 5: Mobile Form Functionality
async function testMobileFormFunctionality() {
  log('📱 Testing Mobile Form Functionality', 'info');
  
  // Test 5.1: Create inspection with mobile user agent
  const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
  
  try {
    const inspectionData = {
      inspectorName: 'Mobile Test Inspector',
      school: 'Mobile Test School',
      date: new Date().toISOString().split('T')[0],
      inspectionType: 'single_room',
      locationDescription: 'Mobile test location',
      roomNumber: 'M101',
      locationCategory: 'classroom',
      buildingName: 'Mobile Test Building',
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
      notes: 'Mobile form test inspection'
    };

    const response = await makeRequest(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      body: inspectionData,
      userAgent: mobileUserAgent
    });

    const passed = response.status === 201 && response.data.id;
    recordMobileTest(
      'Mobile Form - Create Inspection', 
      passed, 
      passed ? `Created inspection ID: ${response.data.id}` : `Failed: ${response.status}`,
      'forms'
    );
  } catch (error) {
    recordMobileTest('Mobile Form - Create Inspection', false, `Request failed: ${error.message}`, 'forms');
  }

  // Test 5.2: Create custodial note with mobile user agent
  try {
    const noteData = {
      school: 'Mobile Test School',
      date: new Date().toISOString().split('T')[0],
      location: 'Mobile Test Location',
      locationDescription: 'Mobile test location description',
      notes: 'Mobile form test custodial note'
    };

    const response = await makeRequest(`${BASE_URL}/api/custodial-notes`, {
      method: 'POST',
      body: noteData,
      userAgent: mobileUserAgent
    });

    const passed = response.status === 201 && response.data.id;
    recordMobileTest(
      'Mobile Form - Create Custodial Note', 
      passed, 
      passed ? `Created note ID: ${response.data.id}` : `Failed: ${response.status}`,
      'forms'
    );
  } catch (error) {
    recordMobileTest('Mobile Form - Create Custodial Note', false, `Request failed: ${error.message}`, 'forms');
  }
}

// Test 6: PWA Security and HTTPS
async function testPWASecurity() {
  log('📱 Testing PWA Security', 'info');
  
  // Test 6.1: HTTPS requirement
  const isHttps = BASE_URL.startsWith('https://');
  recordMobileTest(
    'PWA Security - HTTPS', 
    isHttps, 
    isHttps ? 'App served over HTTPS' : 'App not served over HTTPS (required for PWA)',
    'security'
  );

  // Test 6.2: Security headers for PWA
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    
    if (response.status === 200) {
      const headers = response.headers;
      
      // Check for security headers important for PWA
      const hasContentSecurityPolicy = !!headers['content-security-policy'];
      const hasXFrameOptions = !!headers['x-frame-options'];
      const hasXContentTypeOptions = !!headers['x-content-type-options'];
      
      recordMobileTest(
        'PWA Security - Content Security Policy', 
        hasContentSecurityPolicy, 
        hasContentSecurityPolicy ? 'CSP header present' : 'CSP header missing',
        'security'
      );
      
      recordMobileTest(
        'PWA Security - X-Frame-Options', 
        hasXFrameOptions, 
        hasXFrameOptions ? 'X-Frame-Options header present' : 'X-Frame-Options header missing',
        'security'
      );
      
      recordMobileTest(
        'PWA Security - X-Content-Type-Options', 
        hasXContentTypeOptions, 
        hasXContentTypeOptions ? 'X-Content-Type-Options header present' : 'X-Content-Type-Options header missing',
        'security'
      );
    } else {
      recordMobileTest('PWA Security - Headers', false, `Page not accessible: ${response.status}`, 'security');
    }
  } catch (error) {
    recordMobileTest('PWA Security - Headers', false, `Request failed: ${error.message}`, 'security');
  }
}

// Test 7: PWA Accessibility
async function testPWAAccessibility() {
  log('📱 Testing PWA Accessibility', 'info');
  
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    
    if (response.status === 200 && response.data) {
      const htmlContent = response.data;
      
      // Check for accessibility features
      const hasAltText = htmlContent.includes('alt=');
      const hasAriaLabels = htmlContent.includes('aria-');
      const hasSemanticHTML = htmlContent.includes('<main>') || htmlContent.includes('<nav>') || htmlContent.includes('<header>');
      const hasFormLabels = htmlContent.includes('<label') || htmlContent.includes('for=');
      
      recordMobileTest(
        'PWA Accessibility - Alt Text', 
        hasAltText, 
        hasAltText ? 'Alt text found for images' : 'No alt text found for images',
        'accessibility'
      );
      
      recordMobileTest(
        'PWA Accessibility - ARIA Labels', 
        hasAriaLabels, 
        hasAriaLabels ? 'ARIA labels found' : 'No ARIA labels found',
        'accessibility'
      );
      
      recordMobileTest(
        'PWA Accessibility - Semantic HTML', 
        hasSemanticHTML, 
        hasSemanticHTML ? 'Semantic HTML elements found' : 'No semantic HTML elements found',
        'accessibility'
      );
      
      recordMobileTest(
        'PWA Accessibility - Form Labels', 
        hasFormLabels, 
        hasFormLabels ? 'Form labels found' : 'No form labels found',
        'accessibility'
      );
    } else {
      recordMobileTest('PWA Accessibility - Page Access', false, `Page not accessible: ${response.status}`, 'accessibility');
    }
  } catch (error) {
    recordMobileTest('PWA Accessibility - Page Access', false, `Request failed: ${error.message}`, 'accessibility');
  }
}

// Main test runner
async function runMobilePWATests() {
  log('🚀 Starting Mobile and PWA Test Suite', 'info');
  log(`📍 Testing against: ${BASE_URL}`, 'info');
  log('', 'info');

  // Run all mobile/PWA tests
  await testPWAManifest();
  log('', 'info');
  
  await testMobileResponsiveness();
  log('', 'info');
  
  await testPWAInstallation();
  log('', 'info');
  
  await testMobileAPIPerformance();
  log('', 'info');
  
  await testMobileFormFunctionality();
  log('', 'info');
  
  await testPWASecurity();
  log('', 'info');
  
  await testPWAAccessibility();
  log('', 'info');

  // Generate report
  generateMobilePWAReport();
}

function generateMobilePWAReport() {
  log('📊 Mobile and PWA Test Results Summary', 'info');
  log('=' * 50, 'info');
  log(`Total Mobile/PWA Tests: ${mobileResults.total}`, 'info');
  log(`Passed: ${mobileResults.passed}`, 'success');
  log(`Failed: ${mobileResults.failed}`, mobileResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((mobileResults.passed / mobileResults.total) * 100).toFixed(1)}%`, 'info');
  log('', 'info');

  // PWA feature summary
  const features = ['manifest', 'service-worker', 'responsive', 'installation', 'performance', 'forms', 'security', 'accessibility'];
  log('📱 PWA Feature Coverage:', 'info');
  
  features.forEach(feature => {
    const featureTests = mobileResults.pwaFeatures.filter(t => t.feature === feature);
    const passedTests = featureTests.filter(t => t.passed).length;
    const totalTests = featureTests.length;
    const coverage = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    const status = coverage >= 80 ? 'success' : coverage >= 60 ? 'warning' : 'error';
    log(`  ${feature}: ${passedTests}/${totalTests} (${coverage.toFixed(1)}%)`, status);
  });
  
  log('', 'info');

  if (mobileResults.failed > 0) {
    log('❌ Failed Mobile/PWA Tests:', 'error');
    mobileResults.details
      .filter(test => !test.passed)
      .forEach(test => log(`  - ${test.testName}: ${test.details}`, 'error'));
    log('', 'info');
  }

  log('✅ All Mobile and PWA Tests Completed', 'success');
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'mobile-pwa-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: mobileResults.total,
      passed: mobileResults.passed,
      failed: mobileResults.failed,
      successRate: (mobileResults.passed / mobileResults.total) * 100
    },
    pwaFeatures: mobileResults.pwaFeatures,
    details: mobileResults.details
  }, null, 2));
  
  log(`📄 Detailed mobile/PWA report saved to: ${reportPath}`, 'info');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runMobilePWATests().catch(error => {
    log(`💥 Mobile/PWA test suite failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runMobilePWATests,
  mobileResults
};
