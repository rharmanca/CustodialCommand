/**
 * Comprehensive Production Testing Suite
 * Tests every feature on deployed application: https://cacustodialcommand.up.railway.app
 * Uses clearly marked test data: "[TEST]" prefix for easy identification and cleanup
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.TEST_BASE_URL || 'https://cacustodialcommand.up.railway.app';
const TEST_MARKER = '[TEST]';
const TEST_TIMESTAMP = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Test data markers for easy cleanup
const TEST_DATA = {
  singleAreaInspection: {
    schoolName: `${TEST_MARKER} Test School ${TEST_TIMESTAMP}`,
    areaName: `${TEST_MARKER} Test Classroom 101`,
    inspectorName: `${TEST_MARKER} Test Inspector`,
    notes: `${TEST_MARKER} Comprehensive production test - Safe to delete`
  },
  custodialNotes: {
    schoolName: `${TEST_MARKER} Test School ${TEST_TIMESTAMP}`,
    concernTitle: `${TEST_MARKER} Test Concern`,
    description: `${TEST_MARKER} Production test data - Please remove`,
    reportedBy: `${TEST_MARKER} Test Reporter`
  },
  wholeBuildingInspection: {
    schoolName: `${TEST_MARKER} Test Building ${TEST_TIMESTAMP}`,
    buildingName: `${TEST_MARKER} Main Building`,
    inspectorName: `${TEST_MARKER} Test Inspector`,
    roomName: `${TEST_MARKER} Test Room 201`
  }
};

console.log('\\n' + '='.repeat(70));
console.log('  COMPREHENSIVE PRODUCTION TESTING SUITE');
console.log('='.repeat(70));
console.log(`📍 Testing URL: ${BASE_URL}`);
console.log(`🏷️  Test Marker: ${TEST_MARKER}`);
console.log(`📅 Test Date: ${TEST_TIMESTAMP}`);
console.log(`⚠️  All test data is marked and safe to delete\\n`);

async function runComprehensiveTests() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    tests: []
  };

  const recordTest = (name, passed, details = '') => {
    testResults.total++;
    if (passed) {
      testResults.passed++;
      console.log(`✅ ${name}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${name}`);
      if (details) console.log(`   Details: ${details}`);
    }
    testResults.tests.push({ name, passed, details, timestamp: new Date().toISOString() });
  };

  try {
    // =================================================================
    // TEST 1: Homepage and Navigation
    // =================================================================
    console.log('\\n' + '-'.repeat(70));
    console.log('TEST SUITE 1: Homepage and Navigation');
    console.log('-'.repeat(70));

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    recordTest('Homepage loads successfully', true);

    // Check page title
    const title = await page.title();
    recordTest('Page has title', title.length > 0, `Title: "${title}"`);

    // Check main heading
    const mainHeading = await page.locator('h1').first().textContent();
    recordTest('Main heading visible', mainHeading && mainHeading.length > 0, `Heading: "${mainHeading}"`);

    // Test navigation buttons
    const navButtons = [
      'Single Area Inspection',
      'Whole Building Inspection',
      'Custodial Notes',
      'View Inspection Data',
      'Rating Criteria Reference'
    ];

    for (const buttonText of navButtons) {
      const button = page.locator(`button:has-text("${buttonText}")`).first();
      const isVisible = await button.isVisible().catch(() => false);
      recordTest(`Navigation: "${buttonText}" button visible`, isVisible);
    }

    // =================================================================
    // TEST 2: Accessibility Features
    // =================================================================
    console.log('\\n' + '-'.repeat(70));
    console.log('TEST SUITE 2: Accessibility Features (AAA Compliance)');
    console.log('-'.repeat(70));

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el.tagName,
        hasOutline: window.getComputedStyle(el).outline !== 'none'
      };
    });
    recordTest('Keyboard navigation: First Tab focuses element', focusedElement.tag !== 'BODY');
    recordTest('Focus indicators visible', focusedElement.hasOutline);

    // Test touch target sizes
    const touchTargets = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a');
      const violations = [];
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          violations.push({ width: rect.width, height: rect.height });
        }
      });
      return { total: buttons.length, violations: violations.length };
    });
    recordTest('Touch targets ≥44x44px', touchTargets.violations === 0,
      `${touchTargets.total} elements checked, ${touchTargets.violations} violations`);

    // Check for accessibility CSS
    const hasAccessibilityCSS = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      return styles.some(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          return rules.some(rule => rule.cssText && rule.cssText.includes('focus-visible'));
        } catch (e) {
          return false;
        }
      });
    });
    recordTest('Accessibility CSS loaded', hasAccessibilityCSS);

    // =================================================================
    // TEST 3: Single Area Inspection Form
    // =================================================================
    console.log('\\n' + '-'.repeat(70));
    console.log('TEST SUITE 3: Single Area Inspection Form');
    console.log('-'.repeat(70));

    // Navigate to Single Area Inspection
    await page.click('button:has-text("Single Area Inspection")');
    await page.waitForTimeout(2000);

    recordTest('Single Area Inspection page loads', await page.url().includes('/custodial-inspection'));

    // Fill out form with test data
    const schoolInput = page.locator('input[name="schoolName"], input[placeholder*="school"], input[placeholder*="School"]').first();
    const areaInput = page.locator('input[name="areaName"], input[placeholder*="area"], input[placeholder*="Area"]').first();
    const inspectorInput = page.locator('input[name="inspectorName"], input[placeholder*="inspector"], input[placeholder*="Inspector"]').first();

    await schoolInput.fill(TEST_DATA.singleAreaInspection.schoolName);
    recordTest('School name field filled', true);

    await areaInput.fill(TEST_DATA.singleAreaInspection.areaName);
    recordTest('Area name field filled', true);

    await inspectorInput.fill(TEST_DATA.singleAreaInspection.inspectorName);
    recordTest('Inspector name field filled', true);

    // Test rating sliders/inputs (1-5 scale)
    const ratingCategories = [
      'floors', 'vertical-surfaces', 'horizontal-surfaces', 'ceilings',
      'restrooms', 'customer-satisfaction', 'trash', 'project-cleaning',
      'activity-support', 'safety-compliance'
    ];

    for (const category of ratingCategories) {
      const slider = page.locator(`input[name="${category}"], input[id*="${category}"]`).first();
      const exists = await slider.count() > 0;
      if (exists) {
        await slider.fill('4'); // Set rating to 4
        recordTest(`Rating for ${category} set`, true);
      }
    }

    // Add notes
    const notesField = page.locator('textarea[name="notes"], textarea[placeholder*="notes"], textarea[placeholder*="Notes"]').first();
    const notesExists = await notesField.count() > 0;
    if (notesExists) {
      await notesField.fill(TEST_DATA.singleAreaInspection.notes);
      recordTest('Notes field filled', true);
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Check for success message or confirmation
    const successVisible = await page.locator('text=/success|submitted|thank you/i').isVisible().catch(() => false);
    recordTest('Single Area Inspection submitted successfully', successVisible);

    // =================================================================
    // TEST 4: Inspection Data Viewing
    // =================================================================
    console.log('\\n' + '-'.repeat(70));
    console.log('TEST SUITE 4: Inspection Data Viewing');
    console.log('-'.repeat(70));

    // Go back to home
    const backButton = page.locator('button:has-text("Back"), button:has-text("Home")').first();
    const hasBackButton = await backButton.isVisible().catch(() => false);
    if (hasBackButton) {
      await backButton.click();
      await page.waitForTimeout(1000);
    } else {
      await page.goto(BASE_URL);
    }

    // Navigate to Inspection Data
    await page.click('button:has-text("View Inspection Data")');
    await page.waitForTimeout(2000);

    recordTest('Inspection Data page loads', await page.url().includes('/inspection-data'));

    // Check for data table
    const hasTable = await page.locator('table, [role="table"]').isVisible().catch(() => false);
    recordTest('Data table visible', hasTable);

    // Check for our test data
    const testDataVisible = await page.locator(`text=${TEST_MARKER}`).isVisible().catch(() => false);
    recordTest('Test inspection data appears in list', testDataVisible);

    // Test search/filter if available
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"], input[type="search"]').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);
    if (hasSearch) {
      await searchInput.fill(TEST_MARKER);
      await page.waitForTimeout(1000);
      const filteredResults = await page.locator(`text=${TEST_MARKER}`).count();
      recordTest('Search/filter functionality works', filteredResults > 0, `Found ${filteredResults} results`);
    }

    // Test export functionality if available
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    const hasExport = await exportButton.isVisible().catch(() => false);
    recordTest('Export button available', hasExport);

    // =================================================================
    // TEST 5: Custodial Notes (Concern Reporting)
    // =================================================================
    console.log('\\n' + '-'.repeat(70));
    console.log('TEST SUITE 5: Custodial Notes (Concern Reporting)');
    console.log('-'.repeat(70));

    // Navigate back to home
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    // Navigate to Custodial Notes
    await page.click('button:has-text("Custodial Notes")');
    await page.waitForTimeout(2000);

    recordTest('Custodial Notes page loads', await page.url().includes('/custodial-notes'));

    // Fill out concern form
    const concernSchool = page.locator('input[name="schoolName"], input[placeholder*="school"]').first();
    await concernSchool.fill(TEST_DATA.custodialNotes.schoolName);
    recordTest('Concern: School name filled', true);

    const concernTitle = page.locator('input[name="concernTitle"], input[name="title"], input[placeholder*="title"]').first();
    const hasConcernTitle = await concernTitle.count() > 0;
    if (hasConcernTitle) {
      await concernTitle.fill(TEST_DATA.custodialNotes.concernTitle);
      recordTest('Concern: Title filled', true);
    }

    const concernDesc = page.locator('textarea[name="description"], textarea[placeholder*="description"]').first();
    const hasDesc = await concernDesc.count() > 0;
    if (hasDesc) {
      await concernDesc.fill(TEST_DATA.custodialNotes.description);
      recordTest('Concern: Description filled', true);
    }

    // Submit concern
    const concernSubmit = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await concernSubmit.click();
    await page.waitForTimeout(2000);

    const concernSuccess = await page.locator('text=/success|submitted|reported/i').isVisible().catch(() => false);
    recordTest('Custodial concern submitted successfully', concernSuccess);

    // =================================================================
    // TEST 6: Whole Building Inspection
    // =================================================================
    console.log('\\n' + '-'.repeat(70));
    console.log('TEST SUITE 6: Whole Building Inspection');
    console.log('-'.repeat(70));

    // Navigate back to home
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    // Navigate to Whole Building Inspection
    await page.click('button:has-text("Whole Building Inspection")');
    await page.waitForTimeout(2000);

    recordTest('Whole Building Inspection page loads',
      await page.url().includes('/whole-building-inspection'));

    // Fill out building info
    const buildingSchool = page.locator('input[name="schoolName"], input[placeholder*="school"]').first();
    await buildingSchool.fill(TEST_DATA.wholeBuildingInspection.schoolName);
    recordTest('Building: School name filled', true);

    const buildingName = page.locator('input[name="buildingName"], input[placeholder*="building"]').first();
    const hasBuildingName = await buildingName.count() > 0;
    if (hasBuildingName) {
      await buildingName.fill(TEST_DATA.wholeBuildingInspection.buildingName);
      recordTest('Building: Building name filled', true);
    }

    // Test room selection/multi-step form
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    const hasContinue = await continueButton.isVisible().catch(() => false);
    if (hasContinue) {
      await continueButton.click();
      await page.waitForTimeout(1000);
      recordTest('Building: Advanced to room selection', true);
    }

    // =================================================================
    // TEST 7: Rating Criteria Reference
    // =================================================================
    console.log('\\n' + '-'.repeat(70));
    console.log('TEST SUITE 7: Rating Criteria Reference');
    console.log('-'.repeat(70));

    // Navigate back to home
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    // Navigate to Rating Criteria
    await page.click('button:has-text("Rating Criteria Reference")');
    await page.waitForTimeout(2000);

    recordTest('Rating Criteria page loads', await page.url().includes('/rating-criteria'));

    // Check for rating criteria content
    const criteriaHeadings = await page.locator('h2, h3').count();
    recordTest('Rating criteria content visible', criteriaHeadings > 0, `${criteriaHeadings} headings found`);

    // Check for rating scale descriptions
    const ratingDescriptions = await page.locator('text=/1|2|3|4|5/').count();
    recordTest('Rating scale descriptions present', ratingDescriptions > 0);

    // =================================================================
    // TEST 8: Mobile Responsiveness
    // =================================================================
    console.log('\\n' + '-'.repeat(70));
    console.log('TEST SUITE 8: Mobile Responsiveness');
    console.log('-'.repeat(70));

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    // Check for mobile navigation
    const mobileNav = await page.locator('.mobile-bottom-nav, [class*="mobile"]').isVisible().catch(() => false);
    recordTest('Mobile bottom navigation visible', mobileNav);

    // Check touch target sizes on mobile
    const mobileTouchTargets = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a');
      const violations = [];
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          violations.push({ width: rect.width, height: rect.height });
        }
      });
      return { total: buttons.length, violations: violations.length };
    });
    recordTest('Mobile touch targets adequate', mobileTouchTargets.violations === 0,
      `${mobileTouchTargets.total} elements, ${mobileTouchTargets.violations} violations`);

    // Test mobile menu if available
    const hamburger = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], .hamburger').first();
    const hasHamburger = await hamburger.isVisible().catch(() => false);
    if (hasHamburger) {
      await hamburger.click();
      await page.waitForTimeout(500);
      recordTest('Mobile hamburger menu opens', true);
    }

    // =================================================================
    // TEST 9: Performance and Load Times
    // =================================================================
    console.log('\\n' + '-'.repeat(70));
    console.log('TEST SUITE 9: Performance and Load Times');
    console.log('-'.repeat(70));

    // Reset to desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Test page load performance
    const pages = [
      { name: 'Homepage', url: BASE_URL },
      { name: 'Single Area Inspection', url: `${BASE_URL}/custodial-inspection` },
      { name: 'Inspection Data', url: `${BASE_URL}/inspection-data` }
    ];

    for (const testPage of pages) {
      const startTime = Date.now();
      await page.goto(testPage.url, { waitUntil: 'networkidle', timeout: 30000 });
      const loadTime = Date.now() - startTime;

      recordTest(`${testPage.name} loads in reasonable time`, loadTime < 5000,
        `Load time: ${loadTime}ms`);
    }

    // =================================================================
    // TEST 10: Error Handling and Edge Cases
    // =================================================================
    console.log('\\n' + '-'.repeat(70));
    console.log('TEST SUITE 10: Error Handling and Edge Cases');
    console.log('-'.repeat(70));

    // Test invalid routes
    await page.goto(`${BASE_URL}/nonexistent-page`);
    await page.waitForTimeout(1000);

    const has404Handler = await page.locator('text=/not found|404/i').isVisible().catch(() => false);
    recordTest('404 page handler exists', has404Handler || await page.url() === BASE_URL);

    // Test form validation
    await page.goto(`${BASE_URL}/custodial-inspection`);
    await page.waitForTimeout(1000);

    // Try to submit empty form
    const emptySubmit = page.locator('button[type="submit"]').first();
    await emptySubmit.click();
    await page.waitForTimeout(1000);

    // Check for validation messages
    const hasValidation = await page.locator('[aria-invalid="true"], .error, text=/required|invalid/i').isVisible().catch(() => false);
    recordTest('Form validation works for empty submission', hasValidation);

  } catch (error) {
    console.error('\\n❌ Test execution error:', error.message);
    recordTest('Test suite execution', false, error.message);
  } finally {
    await browser.close();
  }

  // =================================================================
  // FINAL REPORT
  // =================================================================
  console.log('\\n' + '='.repeat(70));
  console.log('  COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`\\n📊 Overall Results:`);
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  console.log(`\\n🏷️  Test Data Cleanup Instructions:`);
  console.log(`   All test data is marked with: "${TEST_MARKER}"`);
  console.log(`   Date: ${TEST_TIMESTAMP}`);
  console.log(`   To remove: Filter inspection data by "${TEST_MARKER}" and delete entries`);

  console.log('\\n' + '='.repeat(70));

  // Save detailed results
  const fs = require('fs');
  const reportPath = './tests/production-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    testRun: {
      url: BASE_URL,
      timestamp: new Date().toISOString(),
      testMarker: TEST_MARKER,
      testDate: TEST_TIMESTAMP
    },
    results: testResults,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1) + '%'
    }
  }, null, 2));

  console.log(`\\n📄 Detailed report saved: ${reportPath}\\n`);

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
runComprehensiveTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
