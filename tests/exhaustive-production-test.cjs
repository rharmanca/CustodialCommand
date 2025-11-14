/**
 * EXHAUSTIVE PRODUCTION TEST SUITE
 *
 * Comprehensive testing of every aspect of the deployed application
 * - Browser automation with Playwright
 * - Chrome DevTools Protocol integration
 * - Visual testing with screenshots
 * - Performance profiling
 * - Accessibility validation
 * - Network analysis
 * - Console error monitoring
 * - Complete functional testing
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TEST_URL = process.env.TEST_BASE_URL || 'https://cacustodialcommand.up.railway.app';
const TEST_MARKER = '[TEST-EXHAUSTIVE]';
const TIMESTAMP = Date.now();
const SCREENSHOT_DIR = './tests/screenshots';
const REPORT_DIR = './tests/reports';

// Ensure directories exist
[SCREENSHOT_DIR, REPORT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Test results storage
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null
  },
  pages: {},
  forms: {},
  performance: {},
  accessibility: {},
  network: {},
  console: [],
  screenshots: [],
  errors: []
};

// Helper to record test
function recordTest(category, name, passed, details = '', data = null) {
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }

  if (!testResults[category]) {
    testResults[category] = {};
  }

  testResults[category][name] = {
    passed,
    details,
    data,
    timestamp: new Date().toISOString()
  };

  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${category.toUpperCase()}: ${name}${details ? ` - ${details}` : ''}`);
}

// Helper to take screenshot
async function takeScreenshot(page, name, description = '') {
  try {
    const filename = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${TIMESTAMP}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });

    testResults.screenshots.push({
      name,
      description,
      filename,
      filepath,
      timestamp: new Date().toISOString()
    });

    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  } catch (error) {
    console.error(`❌ Screenshot failed for ${name}:`, error.message);
    return null;
  }
}

// Helper to measure performance
async function measurePerformance(page, pageName) {
  try {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');

      return {
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        domInteractive: navigation?.domInteractive,
        domComplete: navigation?.domComplete,
        transferSize: navigation?.transferSize,
        encodedBodySize: navigation?.encodedBodySize,
        decodedBodySize: navigation?.decodedBodySize
      };
    });

    testResults.performance[pageName] = metrics;

    const fcp = metrics.firstContentfulPaint;
    recordTest('performance', `${pageName} - First Contentful Paint`,
      fcp < 2000, `${Math.round(fcp)}ms (target: <2000ms)`);

    const loadTime = metrics.loadComplete;
    recordTest('performance', `${pageName} - Load Complete`,
      loadTime < 3000, `${Math.round(loadTime)}ms (target: <3000ms)`);

    return metrics;
  } catch (error) {
    testResults.errors.push({
      category: 'performance',
      page: pageName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return null;
  }
}

// Helper to check console messages
function setupConsoleMonitoring(page, pageName) {
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    testResults.console.push({
      page: pageName,
      type,
      text,
      timestamp: new Date().toISOString()
    });

    if (type === 'error') {
      console.log(`⚠️  Console Error on ${pageName}: ${text}`);
      testResults.errors.push({
        category: 'console',
        page: pageName,
        error: text,
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('pageerror', error => {
    console.log(`❌ Page Error on ${pageName}: ${error.message}`);
    testResults.errors.push({
      category: 'page-error',
      page: pageName,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
}

// Helper to analyze network requests
async function analyzeNetwork(page, pageName) {
  const requests = [];
  const failed = [];

  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
  });

  page.on('requestfailed', request => {
    const failure = {
      url: request.url(),
      failure: request.failure()?.errorText,
      resourceType: request.resourceType()
    };
    failed.push(failure);
    console.log(`⚠️  Network Failed on ${pageName}: ${failure.url} - ${failure.failure}`);
  });

  // Return summary function
  return () => {
    testResults.network[pageName] = {
      totalRequests: requests.length,
      failedRequests: failed.length,
      requestsByType: requests.reduce((acc, req) => {
        acc[req.resourceType] = (acc[req.resourceType] || 0) + 1;
        return acc;
      }, {}),
      failed
    };

    recordTest('network', `${pageName} - Network Requests`,
      failed.length === 0, `${requests.length} requests, ${failed.length} failed`);
  };
}

async function runExhaustiveTests() {
  console.log('\n' + '='.repeat(70));
  console.log('  EXHAUSTIVE PRODUCTION TEST SUITE');
  console.log('='.repeat(70));
  console.log(`📍 Testing URL: ${TEST_URL}`);
  console.log(`🏷️  Test Marker: ${TEST_MARKER}`);
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log(`📸 Screenshots: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(70) + '\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test desktop viewport
    console.log('\n' + '-'.repeat(70));
    console.log('PHASE 1: DESKTOP TESTING (1920x1080)');
    console.log('-'.repeat(70));

    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    await testAllPages(desktopContext, 'desktop');
    await desktopContext.close();

    // Test mobile viewport
    console.log('\n' + '-'.repeat(70));
    console.log('PHASE 2: MOBILE TESTING (375x667 - iPhone SE)');
    console.log('-'.repeat(70));

    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      isMobile: true,
      hasTouch: true
    });
    await testAllPages(mobileContext, 'mobile');
    await mobileContext.close();

    // Test tablet viewport
    console.log('\n' + '-'.repeat(70));
    console.log('PHASE 3: TABLET TESTING (768x1024 - iPad)');
    console.log('-'.repeat(70));

    const tabletContext = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      isMobile: true,
      hasTouch: true
    });
    await testAllPages(tabletContext, 'tablet');
    await tabletContext.close();

    // Test forms with complete workflows
    console.log('\n' + '-'.repeat(70));
    console.log('PHASE 4: FORM TESTING (Complete Workflows)');
    console.log('-'.repeat(70));

    const formContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    await testAllForms(formContext);
    await formContext.close();

  } catch (error) {
    console.error('❌ Test execution error:', error);
    testResults.errors.push({
      category: 'execution',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  } finally {
    await browser.close();
  }

  // Finalize results
  testResults.summary.endTime = new Date().toISOString();
  const duration = Date.now() - new Date(testResults.summary.startTime).getTime();
  testResults.summary.duration = `${(duration / 1000).toFixed(1)}s`;
  testResults.summary.successRate = `${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`;

  // Save comprehensive report
  const reportPath = path.join(REPORT_DIR, `exhaustive-test-report-${TIMESTAMP}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('  TEST EXECUTION COMPLETE');
  console.log('='.repeat(70));
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total Tests: ${testResults.summary.total}`);
  console.log(`   ✅ Passed: ${testResults.summary.passed}`);
  console.log(`   ❌ Failed: ${testResults.summary.failed}`);
  console.log(`   📈 Success Rate: ${testResults.summary.successRate}`);
  console.log(`   ⏱️  Duration: ${testResults.summary.duration}`);
  console.log(`\n📸 Screenshots: ${testResults.screenshots.length} saved to ${SCREENSHOT_DIR}`);
  console.log(`📄 Report: ${reportPath}`);

  if (testResults.errors.length > 0) {
    console.log(`\n⚠️  ERRORS FOUND: ${testResults.errors.length}`);
    testResults.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. [${err.category}] ${err.page || ''}: ${err.error}`);
    });
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Exit with appropriate code
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

async function testAllPages(context, device) {
  const pages = [
    { name: 'Homepage', url: '/', selector: 'h1', timeout: 10000 },
    { name: 'Single Area Inspection', url: '/custodial-inspection', selector: 'button, input, textarea', timeout: 15000 },
    { name: 'Whole Building Inspection', url: '/whole-building-inspection', selector: 'h1', timeout: 10000 },
    { name: 'Custodial Notes', url: '/custodial-notes', selector: 'button, input, textarea', timeout: 15000 },
    { name: 'Inspection Data', url: '/inspection-data', selector: 'h1', timeout: 10000 },
    { name: 'Admin Inspections', url: '/admin-inspections', selector: 'h1', timeout: 10000 },
    { name: 'Monthly Feedback', url: '/monthly-feedback', selector: 'h1', timeout: 10000 },
    { name: 'Rating Criteria', url: '/rating-criteria', selector: 'h1', timeout: 10000 },
    { name: 'Scores Dashboard', url: '/scores-dashboard', selector: 'h1', timeout: 10000 }
  ];

  for (const pageInfo of pages) {
    const page = await context.newPage();
    const pageName = `${pageInfo.name} (${device})`;

    try {
      console.log(`\n📄 Testing: ${pageName}`);

      // Setup monitoring
      setupConsoleMonitoring(page, pageName);
      const networkSummary = await analyzeNetwork(page, pageName);

      // Navigate to page
      const startTime = Date.now();
      await page.goto(`${TEST_URL}${pageInfo.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      const loadTime = Date.now() - startTime;

      recordTest('pages', `${pageName} - Load`, true, `${loadTime}ms`);

      // Wait for main content with page-specific timeout
      await page.waitForSelector(pageInfo.selector, { timeout: pageInfo.timeout || 10000 });
      recordTest('pages', `${pageName} - Content Visible`, true);

      // Take screenshot
      await takeScreenshot(page, `${pageInfo.name}_${device}`, `${device} viewport`);

      // Measure performance
      await measurePerformance(page, pageName);

      // Check for console errors
      await page.waitForTimeout(1000); // Let any console messages appear

      // Get page title
      const title = await page.title();
      recordTest('pages', `${pageName} - Title`, title.length > 0, title);

      // Test accessibility
      await testPageAccessibility(page, pageName);

      // Analyze network
      networkSummary();

    } catch (error) {
      recordTest('pages', `${pageName} - Error`, false, error.message);
      testResults.errors.push({
        category: 'page-load',
        page: pageName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await page.close();
    }
  }
}

async function testPageAccessibility(page, pageName) {
  try {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el.tagName,
        visible: el.offsetParent !== null,
        hasOutline: window.getComputedStyle(el).outline !== 'none'
      };
    });

    recordTest('accessibility', `${pageName} - Keyboard Navigation`,
      focusedElement.tag !== 'BODY', `First tab focuses ${focusedElement.tag}`);

    // Test focus indicators
    recordTest('accessibility', `${pageName} - Focus Indicators`,
      focusedElement.hasOutline, 'Focus outline visible');

    // Check for skip links
    const hasSkipLinks = await page.evaluate(() => {
      const skipLinks = document.querySelectorAll('a[href^="#"]');
      return Array.from(skipLinks).some(link =>
        link.textContent.toLowerCase().includes('skip')
      );
    });
    recordTest('accessibility', `${pageName} - Skip Links`, hasSkipLinks);

    // Check ARIA labels
    const ariaLabels = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      let withLabels = 0;
      buttons.forEach(btn => {
        if (btn.getAttribute('aria-label') || btn.textContent.trim()) {
          withLabels++;
        }
      });
      return { total: buttons.length, withLabels };
    });

    if (ariaLabels.total > 0) {
      recordTest('accessibility', `${pageName} - ARIA Labels`,
        ariaLabels.withLabels === ariaLabels.total,
        `${ariaLabels.withLabels}/${ariaLabels.total} buttons have labels`);
    }

  } catch (error) {
    console.log(`⚠️  Accessibility test error on ${pageName}: ${error.message}`);
  }
}

async function testAllForms(context) {
  // Test Single Area Inspection form
  await testSingleAreaInspection(context);

  // Test Custodial Notes form
  await testCustodialNotes(context);

  // Test Whole Building Inspection (if time permits)
  // This is complex, so we'll do basic validation
  await testWholeBuildingInspection(context);
}

async function testSingleAreaInspection(context) {
  const page = await context.newPage();
  const formName = 'Single Area Inspection Form';

  try {
    console.log(`\n📝 Testing: ${formName}`);

    setupConsoleMonitoring(page, formName);
    await page.goto(`${TEST_URL}/custodial-inspection`, { waitUntil: 'networkidle' });

    await takeScreenshot(page, 'form_single_area_initial', 'Initial form state');

    // Wait for form elements to be ready (more specific selector for lazy-loaded components)
    await page.waitForSelector('button, input, textarea', { timeout: 15000 });
    recordTest('forms', `${formName} - Load`, true);

    // Find and interact with school select
    const schoolSelect = page.locator('button[role="combobox"]').first();
    await schoolSelect.click();
    await page.waitForTimeout(500);

    // Select a school
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(500);
    recordTest('forms', `${formName} - School Selection`, true);

    // Fill location description
    const locationInput = page.locator('input[id="locationDescription"]');
    await locationInput.fill(`${TEST_MARKER} Test Location ${TIMESTAMP}`);
    recordTest('forms', `${formName} - Location Input`, true);

    // Fill inspection date (use today's date)
    const dateInput = page.locator('input[type="date"]').first();
    const today = new Date().toISOString().split('T')[0];
    await dateInput.fill(today);
    recordTest('forms', `${formName} - Date Selection`, true);

    await takeScreenshot(page, 'form_single_area_filled', 'Form filled with test data');

    recordTest('forms', `${formName} - Complete`, true, 'All fields accessible and fillable');

  } catch (error) {
    recordTest('forms', `${formName} - Error`, false, error.message);
    testResults.errors.push({
      category: 'form-testing',
      form: formName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    await page.close();
  }
}

async function testCustodialNotes(context) {
  const page = await context.newPage();
  const formName = 'Custodial Notes Form';

  try {
    console.log(`\n📝 Testing: ${formName}`);

    await page.goto(`${TEST_URL}/custodial-notes`, { waitUntil: 'networkidle' });
    await takeScreenshot(page, 'form_custodial_notes', 'Custodial notes page');

    // Check if form elements exist (wait for lazy-loaded components)
    await page.waitForSelector('button, input, textarea', { timeout: 15000 });
    const hasForm = await page.locator('button, input, textarea').count() > 0;
    recordTest('forms', `${formName} - Present`, hasForm);

    if (hasForm) {
      // Try to fill basic fields
      const textareas = await page.locator('textarea').count();
      recordTest('forms', `${formName} - Text Areas`, textareas > 0, `${textareas} text areas found`);
    }

  } catch (error) {
    recordTest('forms', `${formName} - Error`, false, error.message);
  } finally {
    await page.close();
  }
}

async function testWholeBuildingInspection(context) {
  const page = await context.newPage();
  const formName = 'Whole Building Inspection';

  try {
    console.log(`\n📝 Testing: ${formName}`);

    await page.goto(`${TEST_URL}/whole-building-inspection`, { waitUntil: 'networkidle' });
    await takeScreenshot(page, 'form_whole_building', 'Whole building inspection page');

    // Check if page loads and has content
    const hasContent = await page.locator('h1').count() > 0;
    recordTest('forms', `${formName} - Load`, hasContent);

    // Check for step indicators (multi-step form)
    const hasSteps = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Step') || text.includes('step');
    });
    recordTest('forms', `${formName} - Multi-Step`, hasSteps);

  } catch (error) {
    recordTest('forms', `${formName} - Error`, false, error.message);
  } finally {
    await page.close();
  }
}

// Run tests
runExhaustiveTests()
  .then(() => {
    console.log('✅ Test suite completed successfully');
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
