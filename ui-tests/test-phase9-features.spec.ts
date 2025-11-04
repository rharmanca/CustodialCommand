import { test, expect } from '@playwright/test';

/**
 * Phase 9 Speed & Efficiency Features Test Suite
 *
 * Tests all 5 features added in Phase 9:
 * 1. Default Date to Today
 * 2. Remember Inspector Name
 * 3. Remember Last School
 * 4. Recent Locations Dropdown
 * 5. "Report Another Issue" Dialog
 */

const PRODUCTION_URL = 'https://cacustodialcommand.up.railway.app/';
const TEST_INSPECTOR_NAME = 'Gemini Test User';
const TEST_SCHOOL = 'WLC';
const TEST_LOCATION_1 = 'Test Location 1';
const TEST_LOCATION_2 = 'Test Location 2';

test.describe('Phase 9: Speed & Efficiency Features', () => {

  // Helper function to scroll form into view
  const scrollToForm = async (page: any) => {
    // Scroll down a moderate amount to reveal the form (not to bottom)
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
  };

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure clean state
    await page.goto(PRODUCTION_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('Feature 1: Default Date to Today ⏰', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // Click "Report A Custodial Concern" button
    await page.click('text=Report A Custodial Concern');

    // Wait for form to load
    await page.waitForSelector('input[type="date"]');

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get the date field value
    const dateValue = await page.inputValue('input[type="date"]');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/phase9-feature1-default-date.png',
      fullPage: true
    });

    // Verify date is set to today
    expect(dateValue).toBe(today);

    console.log(`✅ Feature 1 PASS: Date field pre-filled with ${dateValue}`);
  });

  test('Feature 2: Remember Inspector Name 📝', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // Click "Report A Custodial Concern"
    await page.click('text=Report A Custodial Concern');
    await scrollToForm(page);
    await page.waitForSelector('input[placeholder*="Inspector"]');

    // Fill out the form
    await page.fill('input[placeholder*="Inspector"]', TEST_INSPECTOR_NAME);
    await page.selectOption('select', TEST_SCHOOL);
    await page.fill('input[placeholder*="Location"]', TEST_LOCATION_1);
    await page.fill('textarea', 'First test');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for success (either dialog or redirect)
    await page.waitForTimeout(2000);

    // Navigate back to home
    const homeButton = page.locator('text=Return to Home').or(page.locator('text=Home'));
    if (await homeButton.isVisible()) {
      await homeButton.click();
    } else {
      await page.goto(PRODUCTION_URL);
    }

    // Click "Report A Custodial Concern" again
    await page.click('text=Report A Custodial Concern');
    await scrollToForm(page);
    await page.waitForSelector('input[placeholder*="Inspector"]');

    // Get the inspector name value
    const inspectorName = await page.inputValue('input[placeholder*="Inspector"]');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/phase9-feature2-remember-name.png',
      fullPage: true
    });

    // Verify inspector name is pre-filled
    expect(inspectorName).toBe(TEST_INSPECTOR_NAME);

    console.log(`✅ Feature 2 PASS: Inspector name pre-filled with "${inspectorName}"`);
  });

  test('Feature 3: Remember Last School 🏫', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // Click "Report A Custodial Concern"
    await page.click('text=Report A Custodial Concern');
    await scrollToForm(page);
    await page.waitForSelector('select');

    // Fill and submit first report
    await page.fill('input[placeholder*="Inspector"]', TEST_INSPECTOR_NAME);
    await page.selectOption('select', TEST_SCHOOL);
    await page.fill('input[placeholder*="Location"]', TEST_LOCATION_1);
    await page.fill('textarea', 'Test for school memory');
    await page.click('button[type="submit"]');

    // Wait and navigate back
    await page.waitForTimeout(2000);
    const homeButton = page.locator('text=Return to Home').or(page.locator('text=Home'));
    if (await homeButton.isVisible()) {
      await homeButton.click();
    } else {
      await page.goto(PRODUCTION_URL);
    }

    // Return to form
    await page.click('text=Report A Custodial Concern');
    await scrollToForm(page);
    await page.waitForSelector('select');

    // Get selected school value
    const selectedSchool = await page.inputValue('select');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/phase9-feature3-remember-school.png',
      fullPage: true
    });

    // Verify school is pre-selected
    expect(selectedSchool).toBe(TEST_SCHOOL);

    console.log(`✅ Feature 3 PASS: School pre-selected as "${selectedSchool}"`);
  });

  test('Feature 4: Recent Locations Dropdown 📍', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // Submit first report with Location 1
    await page.click('text=Report A Custodial Concern');
    await scrollToForm(page);
    await page.waitForSelector('input[placeholder*="Inspector"]');
    await page.fill('input[placeholder*="Inspector"]', TEST_INSPECTOR_NAME);
    await page.selectOption('select', TEST_SCHOOL);
    await page.fill('input[placeholder*="Location"]', TEST_LOCATION_1);
    await page.fill('textarea', 'First location test');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate back and submit second report with Location 2
    const homeButton1 = page.locator('text=Return to Home').or(page.locator('text=Home'));
    if (await homeButton1.isVisible()) {
      await homeButton1.click();
    } else {
      await page.goto(PRODUCTION_URL);
    }

    await page.click('text=Report A Custodial Concern');
    await scrollToForm(page);
    await page.waitForSelector('input[placeholder*="Location"]');
    await page.fill('input[placeholder*="Location"]', TEST_LOCATION_2);
    await page.fill('textarea', 'Second location test');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate back to form
    const homeButton2 = page.locator('text=Return to Home').or(page.locator('text=Home'));
    if (await homeButton2.isVisible()) {
      await homeButton2.click();
    } else {
      await page.goto(PRODUCTION_URL);
    }

    await page.click('text=Report A Custodial Concern');
    await scrollToForm(page);
    await page.waitForSelector('input[placeholder*="Location"]');

    // Look for location chips (blue pills above location field)
    const locationChips = page.locator('[class*="chip"], [class*="pill"], button:has-text("Test Location")');

    // Take screenshot showing chips
    await page.screenshot({
      path: 'test-results/phase9-feature4-location-chips.png',
      fullPage: true
    });

    // Verify chips exist
    const chipsCount = await locationChips.count();
    expect(chipsCount).toBeGreaterThan(0);

    // Click on "Test Location 1" chip
    await page.click(`text=${TEST_LOCATION_1}`);

    // Wait a moment for the field to fill
    await page.waitForTimeout(500);

    // Verify location field is filled
    const locationValue = await page.inputValue('input[placeholder*="Location"]');

    // Take screenshot after clicking chip
    await page.screenshot({
      path: 'test-results/phase9-feature4-chip-clicked.png',
      fullPage: true
    });

    expect(locationValue).toBe(TEST_LOCATION_1);

    console.log(`✅ Feature 4 PASS: Found ${chipsCount} location chips, clicking filled field with "${locationValue}"`);
  });

  test('Feature 5: "Report Another Issue" Dialog 🔄', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // Submit a report
    await page.click('text=Report A Custodial Concern');
    await scrollToForm(page);
    await page.waitForSelector('input[placeholder*="Inspector"]');
    await page.fill('input[placeholder*="Inspector"]', TEST_INSPECTOR_NAME);
    await page.selectOption('select', TEST_SCHOOL);
    await page.fill('input[placeholder*="Location"]', TEST_LOCATION_1);
    await page.fill('textarea', 'Testing report another dialog');
    await page.click('button[type="submit"]');

    // Wait for success animation (3 seconds as specified)
    await page.waitForTimeout(3000);

    // Look for "Report Another Issue?" dialog
    const dialogTitle = page.locator('text=Report Another Issue?');
    await expect(dialogTitle).toBeVisible();

    // Take screenshot of dialog
    await page.screenshot({
      path: 'test-results/phase9-feature5-dialog.png',
      fullPage: true
    });

    // Verify dialog buttons exist
    const reportAnotherButton = page.locator('text=Report Another Issue Here');
    const returnHomeButton = page.locator('text=Return to Home');

    await expect(reportAnotherButton).toBeVisible();
    await expect(returnHomeButton).toBeVisible();

    console.log('✅ Feature 5 Part 1 PASS: Dialog appears with correct buttons');

    // Click "Report Another Issue Here"
    await reportAnotherButton.click();

    // Wait for form to load and scroll to it
    await scrollToForm(page);
    await page.waitForSelector('input[placeholder*="Inspector"]');

    // Verify form pre-fills
    const inspectorName = await page.inputValue('input[placeholder*="Inspector"]');
    const selectedSchool = await page.inputValue('select');
    const locationValue = await page.inputValue('input[placeholder*="Location"]');
    const notesValue = await page.inputValue('textarea');
    const dateValue = await page.inputValue('input[type="date"]');

    // Take screenshot of pre-filled form
    await page.screenshot({
      path: 'test-results/phase9-feature5-prefilled-form.png',
      fullPage: true
    });

    // Verify pre-fills
    expect(inspectorName).toBe(TEST_INSPECTOR_NAME);
    expect(selectedSchool).toBe(TEST_SCHOOL);
    expect(locationValue).toBe(TEST_LOCATION_1);
    expect(notesValue).toBe(''); // Notes should be empty
    expect(dateValue).toBeTruthy(); // Date should be filled

    console.log('✅ Feature 5 Part 2 PASS: Form pre-fills correctly (notes empty)');

    // Submit another report
    await page.fill('textarea', 'Second report via dialog');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // This time click "Return to Home"
    await page.click('text=Return to Home');

    // Verify navigation to home page
    await page.waitForURL(PRODUCTION_URL);
    await expect(page.locator('text=Report A Custodial Concern')).toBeVisible();

    // Take screenshot of home page
    await page.screenshot({
      path: 'test-results/phase9-feature5-home.png',
      fullPage: true
    });

    console.log('✅ Feature 5 Part 3 PASS: Return to Home navigates correctly');
  });
});
