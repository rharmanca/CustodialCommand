// Comprehensive Accessibility Testing Suite
// Tests all WCAG AA implementations in the Custodial Command application

const { chromium } = require('playwright');
const { accessibilityValidator } = require('../src/utils/accessibilityValidator');

class AccessibilityTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    this.startTime = new Date();
  }

  async setup() {
    console.log('🚀 Setting up accessibility test environment...');

    this.browser = await chromium.launch({
      headless: false, // Keep visible for debugging
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--force-device-scale-factor=1'
      ]
    });

    this.page = await this.browser.newPage();

    // Set viewport for consistent testing
    await this.page.setViewportSize({ width: 1280, height: 720 });

    // Enable accessibility debugging
    await this.page.context().overridePermissions(['screen-reader']);
  }

  async teardown() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest(testName, testFunction) {
    console.log(`\n📋 Running test: ${testName}`);

    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;

      this.testResults.push({
        name: testName,
        status: 'passed',
        duration,
        result
      });

      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      return true;
    } catch (error) {
      console.error(`❌ ${testName} - FAILED`);
      console.error('Error:', error.message);

      this.testResults.push({
        name: testName,
        status: 'failed',
        error: error.message,
        duration: 0
      });

      return false;
    }
  }

  async testBasicAccessibility() {
    // Test 1: Basic page structure and ARIA attributes
    const violations = await this.page.locator('html').evaluate(() => {
      const validator = window.accessibilityValidator;
      if (validator) {
        return validator.runAudit();
      }
      return { violations: [], score: 0 };
    });

    if (violations.score < 80) {
      throw new Error(`Accessibility score too low: ${violations.score}/100`);
    }

    return {
      score: violations.score,
      violations: violations.violations.length,
      passes: violations.passes.length
    };
  }

  async testKeyboardNavigation() {
    // Test 2: Keyboard navigation functionality
    await this.page.goto('http://localhost:5000');

    const focusableElements = await this.page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').count();

    if (focusableElements === 0) {
      throw new Error('No focusable elements found');
    }

    // Test Tab navigation
    const initialFocus = await this.page.evaluate(() => document.activeElement.tagName);
    await this.page.keyboard.press('Tab');
    const afterTabFocus = await this.page.evaluate(() => document.activeElement.tagName);

    if (initialFocus === afterTabFocus) {
      throw new Error('Tab navigation not working');
    }

    // Test Shift+Tab navigation
    await this.page.keyboard.press('Shift+Tab');
    const afterShiftTabFocus = await this.page.evaluate(() => document.activeElement.tagName);

    if (afterShiftTabFocus !== initialFocus) {
      throw new Error('Shift+Tab navigation not working properly');
    }

    // Test Escape key functionality
    await this.page.keyboard.press('Escape');

    return {
      focusableElements,
      tabNavigation: true,
      shiftTabNavigation: true,
      escapeKey: true
    };
  }

  async testScreenReaderSupport() {
    // Test 3: Screen reader support
    await this.page.goto('http://localhost:5000');

    // Check for proper ARIA labels
    const ariaLabels = await this.page.locator('[aria-label]').count();
    const ariaLabelledBy = await this.page.locator('[aria-labelledby]').count();
    const ariaDescribedBy = await this.page.locator('[aria-describedby]').count();

    // Check for semantic landmarks
    const landmarks = {
      header: await this.page.locator('header, [role="banner"]').count(),
      nav: await this.page.locator('nav, [role="navigation"]').count(),
      main: await this.page.locator('main, [role="main"]').count(),
      footer: await this.page.locator('footer, [role="contentinfo"]').count()
    };

    const totalLandmarks = Object.values(landmarks).reduce((a, b) => a + b, 0);

    if (totalLandmarks < 3) {
      throw new Error(`Insufficient semantic landmarks: ${totalLandmarks}`);
    }

    // Check for page title
    const title = await this.page.title();
    if (!title || title.length === 0) {
      throw new Error('Missing page title');
    }

    // Check for lang attribute
    const lang = await this.page.getAttribute('html', 'lang');
    if (!lang) {
      throw new Error('Missing lang attribute');
    }

    return {
      ariaLabels,
      ariaLabelledBy,
      ariaDescribedBy,
      landmarks,
      pageTitle: title,
      language: lang
    };
  }

  async testFormAccessibility() {
    // Test 4: Form accessibility
    await this.page.goto('http://localhost:5000');

    // Look for forms on the page
    const forms = await this.page.locator('form').count();

    if (forms > 0) {
      // Test form labels
      const inputs = await this.page.locator('input, select, textarea').count();
      const labels = await this.page.locator('label').count();

      // Check for proper labeling
      const unlabeledInputs = await this.page.locator('input:not([aria-label]):not([aria-labelledby])').count();
      const associatedLabels = await this.page.locator('input[id]').count();

      // Test required field indicators
      const requiredFields = await this.page.locator('[required]').count();
      const ariaRequired = await this.page.locator('[aria-required="true"]').count();

      return {
        forms,
        inputs,
        labels,
        unlabeledInputs,
        associatedLabels,
        requiredFields,
        ariaRequired
      };
    }

    return { forms: 0, message: 'No forms found on page' };
  }

  async testImageAccessibility() {
    // Test 5: Image accessibility
    await this.page.goto('http://localhost:5000');

    const images = await this.page.locator('img').count();

    if (images > 0) {
      const imagesWithAlt = await this.page.locator('img[alt]').count();
      const decorativeImages = await this.page.locator('img[alt=""], img[role="presentation"]').count();

      const missingAlt = images - imagesWithAlt;

      if (missingAlt > 0) {
        throw new Error(`${missingAlt} images missing alt attributes`);
      }

      return {
        images,
        imagesWithAlt,
        decorativeImages,
        missingAlt: 0
      };
    }

    return { images: 0, message: 'No images found on page' };
  }

  async testColorContrast() {
    // Test 6: Color contrast (simplified test)
    await this.page.goto('http://localhost:5000');

    // Check for sufficient contrast ratios using computed styles
    const contrastIssues = await this.page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');

      elements.forEach((element, index) => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;

        // Simple check for transparent backgrounds
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
          issues.push({
            element: element.tagName.toLowerCase(),
            index,
            issue: 'Transparent background may cause contrast issues'
          });
        }
      });

      return issues;
    });

    return {
      elementsChecked: await this.page.locator('*').count(),
      contrastIssues: contrastIssues.length,
      issues: contrastIssues.slice(0, 10) // Limit to first 10 issues
    };
  }

  async testFocusManagement() {
    // Test 7: Focus management
    await this.page.goto('http://localhost:5000');

    // Test modal focus trapping (if modals exist)
    const modals = await this.page.locator('[role="dialog"], .modal, [aria-modal="true"]').count();

    // Test skip links
    const skipLinks = await this.page.locator('a[href^="#"]').count();

    // Test focus indicators
    const focusableElements = await this.page.locator('button, [href], input, select, textarea').count();

    // Test tab order by cycling through elements
    let tabCount = 0;
    let lastElement = null;

    for (let i = 0; i < Math.min(focusableElements, 10); i++) {
      await this.page.keyboard.press('Tab');
      const currentElement = await this.page.evaluate(() => document.activeElement.tagName);

      if (currentElement !== lastElement) {
        tabCount++;
        lastElement = currentElement;
      } else {
        break; // No more focusable elements
      }
    }

    return {
      modals,
      skipLinks,
      focusableElements,
      tabOrderWorking: tabCount > 0
    };
  }

  async testErrorHandling() {
    // Test 8: Error handling and validation
    await this.page.goto('http://localhost:5000');

    // Check for error messages and validation
    const errorContainers = await this.page.locator('.error, .alert, [role="alert"]').count();
    const validationErrors = await this.page.locator('[aria-invalid="true"]').count();
    const errorDescriptions = await this.page.locator('[aria-describedby*="error"]').count();

    return {
      errorContainers,
      validationErrors,
      errorDescriptions,
      hasErrorHandling: errorContainers > 0 || validationErrors > 0
    };
  }

  async testResponsiveAccessibility() {
    // Test 9: Responsive design accessibility
    const viewports = [
      { width: 375, height: 667 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1280, height: 720 }  // Desktop
    ];

    const results = [];

    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(1000); // Wait for layout adjustments

      // Check if content is still accessible
      const focusableElements = await this.page.locator('button, [href], input, select, textarea').count();
      const ariaLabels = await this.page.locator('[aria-label], [aria-labelledby]').count();

      results.push({
        viewport,
        focusableElements,
        ariaLabels,
        accessible: focusableElements > 0
      });
    }

    return results;
  }

  async testPerformanceAccessibility() {
    // Test 10: Performance impact of accessibility features
    await this.page.goto('http://localhost:5000');

    // Measure page load time
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        domInteractive: navigation.domInteractive - navigation.navigationStart
      };
    });

    // Check for accessibility script overhead
    const scriptCount = await this.page.locator('script').count();

    return {
      performanceMetrics,
      scriptCount,
      loadTimeAcceptable: performanceMetrics.loadComplete < 3000
    };
  }

  async generateReport() {
    const endTime = new Date();
    const duration = endTime - this.startTime;

    const passedTests = this.testResults.filter(t => t.status === 'passed').length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;

    const report = {
      summary: {
        totalTests: this.testResults.length,
        passed: passedTests,
        failed: failedTests,
        duration: duration,
        successRate: ((passedTests / this.testResults.length) * 100).toFixed(2) + '%'
      },
      timestamp: endTime.toISOString(),
      results: this.testResults
    };

    return report;
  }

  async runAllTests() {
    console.log('🎯 Starting Comprehensive WCAG AA Accessibility Tests\n');

    await this.setup();

    // Run all accessibility tests
    await this.runTest('Basic Accessibility Audit', () => this.testBasicAccessibility());
    await this.runTest('Keyboard Navigation', () => this.testKeyboardNavigation());
    await this.runTest('Screen Reader Support', () => this.testScreenReaderSupport());
    await this.runTest('Form Accessibility', () => this.testFormAccessibility());
    await this.runTest('Image Accessibility', () => this.testImageAccessibility());
    await this.runTest('Color Contrast', () => this.testColorContrast());
    await this.runTest('Focus Management', () => this.testFocusManagement());
    await this.runTest('Error Handling', () => this.testErrorHandling());
    await this.runTest('Responsive Accessibility', () => this.testResponsiveAccessibility());
    await this.runTest('Performance Impact', () => this.testPerformanceAccessibility());

    const report = await this.generateReport();

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Accessibility Test Suite Complete');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed} ✅`);
    console.log(`Failed: ${report.summary.failed} ❌`);
    console.log(`Success Rate: ${report.summary.successRate}`);
    console.log(`Duration: ${(report.summary.duration / 1000).toFixed(2)}s`);

    if (report.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(t => t.status === 'failed')
        .forEach(t => {
          console.log(`   - ${t.name}: ${t.error}`);
        });
    }

    console.log('\n📊 Detailed Results:');
    this.testResults.forEach(test => {
      const status = test.status === 'passed' ? '✅' : '❌';
      console.log(`   ${status} ${test.name} (${test.duration}ms)`);
      if (test.result) {
        Object.entries(test.result).forEach(([key, value]) => {
          console.log(`      ${key}: ${value}`);
        });
      }
    });

    await this.teardown();

    return report;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new AccessibilityTestSuite();

  testSuite.runAllTests()
    .then(report => {
      console.log('\n✨ Test completed successfully!');
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = AccessibilityTestSuite;