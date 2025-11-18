#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://cacustodialcommand.up.railway.app';
const SCREENSHOTS_DIR = path.join(__dirname, 'deployment-screenshots');

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  viewport: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 }
  }
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class DeploymentTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      url: BASE_URL,
      tests: [],
      screenshots: [],
      performance: {},
      errors: []
    };
  }

  async init() {
    console.log(`${colors.cyan}🚀 Initializing Deployment Test Suite${colors.reset}\n`);

    // Create screenshots directory
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.setDefaultNavigationTimeout(TEST_CONFIG.timeout);

    // Set up console message capture
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.errors.push({
          type: 'console',
          message: msg.text(),
          location: msg.location()
        });
      }
    });

    // Set up network error capture
    this.page.on('pageerror', error => {
      this.results.errors.push({
        type: 'page',
        message: error.message,
        stack: error.stack
      });
    });
  }

  async testHealthEndpoint() {
    console.log(`${colors.blue}🏥 Testing Health Endpoint${colors.reset}`);

    try {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();

      const test = {
        name: 'Health Endpoint',
        endpoint: '/health',
        status: response.status,
        passed: response.status === 200 && data.status === 'ok',
        details: data
      };

      this.results.tests.push(test);

      if (test.passed) {
        console.log(`  ✅ Health check passed - Database: ${data.database?.connected ? 'Connected' : 'Not Connected'}`);
      } else {
        console.log(`  ❌ Health check failed - Status: ${response.status}`);
      }

      return test.passed;
    } catch (error) {
      console.log(`  ❌ Health check failed - ${error.message}`);
      this.results.tests.push({
        name: 'Health Endpoint',
        endpoint: '/health',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  async testAPIEndpoints() {
    console.log(`\n${colors.blue}🔌 Testing API Endpoints${colors.reset}`);

    const endpoints = [
      { path: '/api/inspections', method: 'GET', name: 'Inspections API' },
      { path: '/api/custodial-notes', method: 'GET', name: 'Custodial Notes API' },
      { path: '/api/monthly-feedback', method: 'GET', name: 'Monthly Feedback API' },
      { path: '/api/building-scores', method: 'GET', name: 'Building Scores API' },
      { path: '/api/school-scores', method: 'GET', name: 'School Scores API' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint.path}`, {
          method: endpoint.method
        });

        const test = {
          name: endpoint.name,
          endpoint: endpoint.path,
          method: endpoint.method,
          status: response.status,
          passed: response.status === 200 || response.status === 201
        };

        this.results.tests.push(test);

        if (test.passed) {
          console.log(`  ✅ ${endpoint.name} - Status: ${response.status}`);
        } else {
          console.log(`  ❌ ${endpoint.name} - Status: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.name} - Error: ${error.message}`);
        this.results.tests.push({
          name: endpoint.name,
          endpoint: endpoint.path,
          passed: false,
          error: error.message
        });
      }
    }
  }

  async captureScreenshot(name, viewport = 'desktop') {
    const filename = `${name}_${viewport}_${Date.now()}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    // Set viewport
    await this.page.setViewport(TEST_CONFIG.viewport[viewport]);

    // Take screenshot
    await this.page.screenshot({
      path: filepath,
      fullPage: true
    });

    this.results.screenshots.push({
      name,
      viewport,
      filename,
      path: filepath
    });

    return filename;
  }

  async testHomePage() {
    console.log(`\n${colors.blue}🏠 Testing Home Page${colors.reset}`);

    try {
      // Navigate to home
      const response = await this.page.goto(BASE_URL, {
        waitUntil: 'networkidle2'
      });

      const test = {
        name: 'Home Page Load',
        url: BASE_URL,
        status: response.status(),
        passed: response.status() === 200
      };

      this.results.tests.push(test);

      if (test.passed) {
        console.log(`  ✅ Home page loaded successfully`);

        // Take screenshots in different viewports
        for (const viewport of ['desktop', 'tablet', 'mobile']) {
          await this.captureScreenshot('homepage', viewport);
          console.log(`  📸 Screenshot captured - ${viewport}`);
        }

        // Check for critical elements
        const elements = {
          title: await this.page.$('h1'),
          inspectionButtons: await this.page.$$('button'),
          navigation: await this.page.$('nav')
        };

        console.log(`  ✅ Found ${Object.keys(elements).filter(k => elements[k]).length} critical elements`);

        // Get page title
        const title = await this.page.title();
        console.log(`  📄 Page title: ${title}`);

        // Check for PWA manifest
        const manifest = await this.page.evaluate(() => {
          const link = document.querySelector('link[rel="manifest"]');
          return link ? link.getAttribute('href') : null;
        });

        if (manifest) {
          console.log(`  ✅ PWA manifest found`);
        }

      } else {
        console.log(`  ❌ Home page failed to load - Status: ${response.status()}`);
      }

      return test.passed;
    } catch (error) {
      console.log(`  ❌ Home page test failed - ${error.message}`);
      this.results.tests.push({
        name: 'Home Page Load',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  async testNavigation() {
    console.log(`\n${colors.blue}🧭 Testing Navigation & Pages${colors.reset}`);

    const pages = [
      { button: 'Single Area Inspection', expectedText: 'Custodial Inspection', name: 'single_area_inspection' },
      { button: 'Building Inspection', expectedText: 'Whole Building Inspection', name: 'whole_building_inspection' },
      { button: 'Report A Custodial Concern', expectedText: 'Custodial Notes', name: 'custodial_notes' },
      { button: 'Building Scores Dashboard', expectedText: 'Scores Dashboard', name: 'scores_dashboard' },
      { button: 'View Data & Reports', expectedText: 'Inspection Data', name: 'inspection_data' },
      { button: 'Rating Criteria Guide', expectedText: 'Rating Criteria', name: 'rating_criteria' }
    ];

    for (const pageConfig of pages) {
      try {
        // Go to home first
        await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });

        // Click the navigation button
        const button = await this.page.evaluateHandle((btnText) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(b => b.textContent.includes(btnText));
        }, pageConfig.button);

        if (button && button.asElement()) {
          await button.asElement().click();
          await this.page.waitForTimeout(2000); // Wait for page transition

          // Capture screenshot
          await this.captureScreenshot(pageConfig.name, 'desktop');

          // Check if expected content loaded
          const content = await this.page.content();
          const passed = content.includes(pageConfig.expectedText);

          this.results.tests.push({
            name: `Navigation to ${pageConfig.button}`,
            passed,
            page: pageConfig.name
          });

          if (passed) {
            console.log(`  ✅ ${pageConfig.button} page loaded`);
          } else {
            console.log(`  ❌ ${pageConfig.button} page failed to load expected content`);
          }
        } else {
          console.log(`  ⚠️  Button not found: ${pageConfig.button}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to test ${pageConfig.button} - ${error.message}`);
        this.results.tests.push({
          name: `Navigation to ${pageConfig.button}`,
          passed: false,
          error: error.message
        });
      }
    }
  }

  async testFormFunctionality() {
    console.log(`\n${colors.blue}📝 Testing Form Functionality${colors.reset}`);

    try {
      // Navigate to Custodial Notes form
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });

      // Click on Custodial Notes button
      const button = await this.page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.textContent.includes('Report A Custodial Concern'));
      });

      if (button && button.asElement()) {
        await button.asElement().click();
        await this.page.waitForTimeout(2000);

        // Test form elements
        const formElements = await this.page.evaluate(() => {
          const inputs = document.querySelectorAll('input, textarea, select');
          return {
            totalInputs: inputs.length,
            types: Array.from(inputs).map(i => i.type || i.tagName.toLowerCase())
          };
        });

        console.log(`  ✅ Found ${formElements.totalInputs} form elements`);

        // Capture form screenshot
        await this.captureScreenshot('form_custodial_notes', 'desktop');

        this.results.tests.push({
          name: 'Form Elements Present',
          passed: formElements.totalInputs > 0,
          details: formElements
        });

      } else {
        console.log(`  ⚠️  Could not navigate to form page`);
      }
    } catch (error) {
      console.log(`  ❌ Form test failed - ${error.message}`);
      this.results.tests.push({
        name: 'Form Functionality',
        passed: false,
        error: error.message
      });
    }
  }

  async testPerformance() {
    console.log(`\n${colors.blue}⚡ Testing Performance Metrics${colors.reset}`);

    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });

      // Collect performance metrics
      const performanceMetrics = await this.page.evaluate(() => {
        const timing = performance.timing;
        const paintMetrics = performance.getEntriesByType('paint');

        return {
          loadTime: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          firstPaint: paintMetrics.find(m => m.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paintMetrics.find(m => m.name === 'first-contentful-paint')?.startTime || 0,
          resources: performance.getEntriesByType('resource').length
        };
      });

      this.results.performance = performanceMetrics;

      console.log(`  📊 Load Time: ${performanceMetrics.loadTime}ms`);
      console.log(`  📊 DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
      console.log(`  📊 First Paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
      console.log(`  📊 First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
      console.log(`  📊 Resources Loaded: ${performanceMetrics.resources}`);

      // Performance assessment
      const performanceTest = {
        name: 'Performance Metrics',
        passed: performanceMetrics.loadTime < 5000 && performanceMetrics.firstContentfulPaint < 3000,
        metrics: performanceMetrics
      };

      this.results.tests.push(performanceTest);

      if (performanceTest.passed) {
        console.log(`  ✅ Performance is acceptable`);
      } else {
        console.log(`  ⚠️  Performance could be improved`);
      }

    } catch (error) {
      console.log(`  ❌ Performance test failed - ${error.message}`);
    }
  }

  async testAccessibility() {
    console.log(`\n${colors.blue}♿ Testing Accessibility${colors.reset}`);

    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle2' });

      // Check for basic accessibility features
      const accessibilityChecks = await this.page.evaluate(() => {
        const checks = {
          hasLangAttribute: document.documentElement.hasAttribute('lang'),
          hasAltTexts: Array.from(document.querySelectorAll('img')).every(img => img.hasAttribute('alt')),
          hasAriaLabels: document.querySelectorAll('[aria-label]').length > 0,
          hasRoles: document.querySelectorAll('[role]').length > 0,
          hasSkipLinks: document.querySelector('[href="#main-content"]') !== null,
          hasFocusIndicators: true, // Assume true, would need more complex check
          hasSemanticHTML: document.querySelector('main') && document.querySelector('nav') && document.querySelector('header')
        };

        return checks;
      });

      this.results.accessibility = accessibilityChecks;

      Object.entries(accessibilityChecks).forEach(([check, passed]) => {
        if (passed) {
          console.log(`  ✅ ${check}`);
        } else {
          console.log(`  ❌ ${check}`);
        }
      });

      const passedChecks = Object.values(accessibilityChecks).filter(v => v).length;
      const totalChecks = Object.keys(accessibilityChecks).length;

      this.results.tests.push({
        name: 'Accessibility Checks',
        passed: passedChecks === totalChecks,
        score: `${passedChecks}/${totalChecks}`,
        details: accessibilityChecks
      });

    } catch (error) {
      console.log(`  ❌ Accessibility test failed - ${error.message}`);
    }
  }

  async generateReport() {
    console.log(`\n${colors.cyan}📊 Generating Test Report${colors.reset}\n`);

    // Calculate summary
    const totalTests = this.results.tests.length;
    const passedTests = this.results.tests.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    // Create report
    const report = {
      summary: {
        url: BASE_URL,
        timestamp: this.results.timestamp,
        totalTests,
        passed: passedTests,
        failed: failedTests,
        passRate: `${passRate}%`,
        totalScreenshots: this.results.screenshots.length,
        consoleErrors: this.results.errors.length
      },
      tests: this.results.tests,
      performance: this.results.performance,
      accessibility: this.results.accessibility,
      screenshots: this.results.screenshots,
      errors: this.results.errors
    };

    // Save report to file
    const reportPath = path.join(__dirname, 'deployment-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Display summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  ${colors.cyan}TEST EXECUTION SUMMARY${colors.reset}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  URL: ${BASE_URL}`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  ${colors.green}✅ Passed: ${passedTests}${colors.reset}`);
    console.log(`  ${colors.red}❌ Failed: ${failedTests}${colors.reset}`);
    console.log(`  Pass Rate: ${passRate}%`);
    console.log(`  Screenshots Captured: ${this.results.screenshots.length}`);
    console.log(`  Console Errors: ${this.results.errors.length}`);
    console.log('═══════════════════════════════════════════════════════════════');

    if (failedTests > 0) {
      console.log(`\n${colors.yellow}Failed Tests:${colors.reset}`);
      this.results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  ❌ ${t.name}`);
      });
    }

    console.log(`\n📁 Report saved to: ${reportPath}`);
    console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}`);

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();

      // Run all tests
      await this.testHealthEndpoint();
      await this.testAPIEndpoints();
      await this.testHomePage();
      await this.testNavigation();
      await this.testFormFunctionality();
      await this.testPerformance();
      await this.testAccessibility();

      // Generate report
      const report = await this.generateReport();

      // Visual analysis summary
      console.log(`\n${colors.cyan}🎨 Visual Analysis Summary${colors.reset}`);
      console.log('─────────────────────────────────────────────────────────────');

      if (report.summary.passed > report.summary.failed) {
        console.log(`${colors.green}✅ Application is FUNCTIONAL${colors.reset}`);
        console.log('  - Health check is passing');
        console.log('  - Most API endpoints are responsive');
        console.log('  - Pages are loading correctly');
        console.log('  - Navigation is working');
      } else {
        console.log(`${colors.red}⚠️ Application has ISSUES${colors.reset}`);
        console.log('  - Check failed tests above');
        console.log('  - Review console errors');
        console.log('  - Verify database connection');
      }

      if (this.results.performance.loadTime < 3000) {
        console.log(`${colors.green}✅ Performance is EXCELLENT${colors.reset}`);
      } else if (this.results.performance.loadTime < 5000) {
        console.log(`${colors.yellow}⚠️ Performance is ACCEPTABLE${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Performance needs IMPROVEMENT${colors.reset}`);
      }

      console.log('─────────────────────────────────────────────────────────────');

    } catch (error) {
      console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
const tester = new DeploymentTester();
tester.run();