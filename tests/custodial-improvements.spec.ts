import { test, expect } from '@playwright/test';

const BASE_URL = 'https://cacustodialcommand.up.railway.app';

test.describe('Custodial Command Improvements Verification', () => {

  test('should display section headers and button icons on home page', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Verify section headers
    await expect(page.getByText('Submit Inspections')).toBeVisible();
    await expect(page.getByText('View & Reports')).toBeVisible();

    // Verify button icons are present
    await expect(page.getByRole('button', { name: /📝 Report A Custodial Concern/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /🔍 Single Area Inspection/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /🏢 Building Inspection/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /📊 View Data & Reports/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /📄 Monthly Feedback Reports/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ℹ️ Rating Criteria Guide/i })).toBeVisible();
  });

  test('should have breadcrumb navigation on inspection form', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Click Single Area Inspection
    await page.getByRole('button', { name: /🔍 Single Area Inspection/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify breadcrumb is present
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(breadcrumb).toBeVisible();

    // Verify breadcrumb contains Home and current page
    await expect(breadcrumb.getByText('Home')).toBeVisible();
    await expect(breadcrumb.getByText('Single Area Inspection')).toBeVisible();
  });

  test('should have mobile-optimized image upload buttons with 44px touch targets', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /🔍 Single Area Inspection/i }).click();
    await page.waitForLoadState('networkidle');

    // Find image upload section
    const uploadButton = page.locator('label[for="image-upload"]');
    const cameraButton = page.locator('label[for="camera-capture"]');

    await expect(uploadButton).toBeVisible();
    await expect(cameraButton).toBeVisible();

    // Check that buttons have adequate height (should be at least 44px)
    const uploadBox = await uploadButton.boundingBox();
    const cameraBox = await cameraButton.boundingBox();

    expect(uploadBox?.height).toBeGreaterThanOrEqual(44);
    expect(cameraBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('should display star ratings with proper touch targets', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /🔍 Single Area Inspection/i }).click();
    await page.waitForLoadState('networkidle');

    // Scroll down to the ratings section
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Find a star rating button - look for the Star SVG elements inside buttons
    const starButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(starButton).toBeVisible({ timeout: 10000 });

    // Verify touch target size (allowing for small rounding differences)
    const box = await starButton.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(42);
    expect(box?.height).toBeGreaterThanOrEqual(42);
  });
});

test.describe('Form Interaction Testing', () => {

  test('should load form and allow interaction with form elements', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /🔍 Single Area Inspection/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify form loads (use heading role to avoid multiple matches)
    await expect(page.getByRole('heading', { name: 'Submit Inspection' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible();

    // Find and verify school select exists
    const schoolSelect = page.locator('select').first();
    await expect(schoolSelect).toBeVisible();

    // Verify we can see form fields
    const locationInput = page.locator('input').first();
    await expect(locationInput).toBeVisible();

    // Scroll to see ratings
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);

    // Verify star rating buttons exist and are interactive
    const starButtons = page.locator('button').filter({ has: page.locator('svg') });
    const starCount = await starButtons.count();
    expect(starCount).toBeGreaterThan(0);

    // Click a star button to verify interactivity
    await starButtons.first().click();

    // Verify notes textarea exists
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(500);
    const notesField = page.locator('textarea');
    await expect(notesField.first()).toBeVisible();
  });
});
