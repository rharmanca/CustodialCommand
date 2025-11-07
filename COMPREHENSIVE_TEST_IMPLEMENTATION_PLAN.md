# 🧪 Custodial Command - Comprehensive Test Implementation Plan

**Project**: Custodial Command
**Base URL**: https://cacustodialcommand.up.railway.app
**Tech Stack**: React, TypeScript, Playwright, Drizzle ORM, Express
**Current Test File**: `/tests/custodial-improvements.spec.ts`
**Created**: 2025-10-31

---

## 📋 Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Complete Test Strategy](#complete-test-strategy)
3. [Priority Implementation Roadmap](#priority-implementation-roadmap)
4. [Detailed Test Specifications](#detailed-test-specifications)
5. [Test Data Requirements](#test-data-requirements)
6. [Environment Setup](#environment-setup)
7. [Acceptance Criteria](#acceptance-criteria)
8. [Known Issues & Workarounds](#known-issues--workarounds)

---

## 🎯 Current State Assessment

### ✅ What's Already Tested

**File**: `/tests/custodial-improvements.spec.ts` (119 lines)

**Coverage Includes**:
- ✅ Section headers visibility (Home, Submit Inspections, View & Reports)
- ✅ Button icons with emoji identifiers (6 buttons tested)
- ✅ Breadcrumb navigation on inspection forms
- ✅ Image upload button touch targets (44px minimum)
- ✅ Star rating touch targets (42-44px minimum)
- ✅ Basic form element visibility and interaction

**Test Suites**:
1. `Custodial Command Improvements Verification` - Visual/UX improvements
2. `Form Interaction Testing` - Basic form interaction flow

### ❌ What's Missing (Critical Gaps)

**Functional Coverage**:
- ❌ No actual form submission with data validation
- ❌ No image upload functionality testing
- ❌ No form validation error testing
- ❌ No authentication/authorization testing
- ❌ No data persistence verification
- ❌ No error state handling

**User Journey Coverage**:
- ❌ No complete end-to-end user flows
- ❌ No multi-step process testing (building inspections)
- ❌ No report generation testing
- ❌ No data view/filtering testing

**Quality Coverage**:
- ❌ No accessibility testing
- ❌ No visual regression testing
- ❌ No performance benchmarking
- ❌ No cross-browser validation (config exists but tests don't use it)
- ❌ No mobile-specific test scenarios

### 🎯 Project Context

**Application Purpose**: School custodial inspection tracking system for 6 schools (ASA, LCA, GWC, OA, CBR, WLC)

**Key User Flows**:
1. Single Room/Area Inspection
2. Whole Building Inspection
3. Custodial Concern Reporting
4. Data & Reports Viewing
5. Monthly Feedback Reports
6. Rating Criteria Reference

**Important Features**:
- Offline-first PWA functionality
- Image upload with compression
- Star rating system (1-5 stars)
- Multi-category inspection (11 categories)
- Auto-save drafts
- Mobile-optimized touch targets

---

## 🎯 Complete Test Strategy

### Test Pyramid Structure

```
                    🔺 E2E Tests (10%)
                   /   \
                  /     \
                 /       \
                / Integration \
               /   Tests (30%)  \
              /___________________\
             /                     \
            /   Unit Tests (60%)    \
           /_________________________\
```

### Test Categories & Priorities

**Priority 1 - Critical (MUST HAVE)** 🔴
- Complete form submission flows
- Data persistence validation
- Form validation error handling
- Authentication/authorization
- Image upload functionality
- Core user journeys

**Priority 2 - Important (SHOULD HAVE)** 🟡
- Cross-browser compatibility
- Mobile viewport testing
- Report generation
- Data filtering/search
- Offline functionality
- Multi-step workflows

**Priority 3 - Nice to Have (COULD HAVE)** 🟢
- Accessibility (a11y) testing
- Visual regression testing
- Performance benchmarking
- Load testing
- Analytics validation
- Error tracking validation

---

## 🗺️ Priority Implementation Roadmap

### Phase 1: Critical Functionality (Week 1)

**Goal**: Ensure core features work correctly

**Tests to Create**:

1. **`tests/form-submission.spec.ts`** (Priority 1)
   - Complete single area inspection submission
   - Complete building inspection submission
   - Complete custodial note submission
   - Verify data appears in database
   - Verify success messages
   - Test with all required fields
   - Test with optional fields
   - Test image upload integration

2. **`tests/form-validation.spec.ts`** (Priority 1)
   - Required field validation
   - Invalid input handling
   - Date validation
   - School dropdown validation
   - Rating input validation (1-5 range)
   - Character limit validation
   - Error message display
   - Error state clearing

3. **`tests/authentication.spec.ts`** (Priority 1) - IF AUTH EXISTS
   - Login functionality
   - Logout functionality
   - Protected route access
   - Session persistence
   - Invalid credential handling
   - Admin access restrictions

### Phase 2: User Journeys (Week 2)

**Goal**: Validate complete user workflows

**Tests to Create**:

4. **`tests/user-journey-single-inspection.spec.ts`** (Priority 2)
   - Navigate to form
   - Fill all fields
   - Upload image
   - Submit form
   - Verify in data view
   - Edit inspection (if available)
   - Delete inspection (if available)

5. **`tests/user-journey-building-inspection.spec.ts`** (Priority 2)
   - Start building inspection
   - Add multiple rooms
   - Complete all room ratings
   - Submit complete building
   - Verify all rooms saved
   - View building report

6. **`tests/data-views.spec.ts`** (Priority 2)
   - View inspection data page
   - Filter by school
   - Filter by date range
   - Search functionality
   - Sort columns
   - Pagination (if exists)
   - Export data (if exists)

7. **`tests/reports.spec.ts`** (Priority 2)
   - Generate monthly report
   - Verify report data accuracy
   - Download report (if available)
   - Email report (if available)
   - Report filtering options

### Phase 3: Quality & Cross-Platform (Week 3)

**Goal**: Ensure quality across devices and browsers

**Tests to Create**:

8. **`tests/mobile-specific.spec.ts`** (Priority 2)
   - Touch target sizes (44px minimum)
   - Swipe gestures (if any)
   - Mobile keyboard handling
   - Camera integration for images
   - Responsive layout breakpoints
   - PWA installation flow
   - Offline mode functionality

9. **`tests/cross-browser.spec.ts`** (Priority 2)
   - Leverage existing Playwright projects
   - Test critical flows in:
     - Desktop Chrome
     - Desktop Firefox
     - Desktop Safari (WebKit)
     - Mobile Chrome (Pixel 7)
     - Mobile Safari (iPhone 14)

10. **`tests/accessibility.spec.ts`** (Priority 3)
    - Install `@axe-core/playwright`
    - Keyboard navigation
    - Screen reader compatibility
    - ARIA labels
    - Focus management
    - Color contrast
    - Form label associations

### Phase 4: Advanced Testing (Week 4)

**Goal**: Performance, visual regression, and edge cases

**Tests to Create**:

11. **`tests/visual-regression.spec.ts`** (Priority 3)
    - Home page screenshot
    - Inspection form screenshots
    - Data view screenshots
    - Reports screenshots
    - Mobile vs desktop layouts
    - Different themes (if applicable)

12. **`tests/performance.spec.ts`** (Priority 3)
    - Page load times
    - Time to Interactive (TTI)
    - First Contentful Paint (FCP)
    - Largest Contentful Paint (LCP)
    - Form submission speed
    - Image upload speed
    - Lighthouse score validation

13. **`tests/offline-functionality.spec.ts`** (Priority 2)
    - Fill form while online
    - Go offline
    - Submit form (should queue)
    - Return online
    - Verify form syncs
    - Test offline indicator
    - Test service worker

14. **`tests/edge-cases.spec.ts`** (Priority 2)
    - Very long text inputs
    - Special characters in inputs
    - Large image uploads
    - Rapid form submissions
    - Concurrent users (if applicable)
    - Browser back/forward navigation
    - Page refresh during form fill

---

## 📝 Detailed Test Specifications

### Test File 1: `tests/form-submission.spec.ts`

**Purpose**: Validate complete form submission flows with real data

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://cacustodialcommand.up.railway.app';

test.describe('Form Submission - Single Area Inspection', () => {

  test('should successfully submit a complete single area inspection', async ({ page }) => {
    // Navigate to single area inspection
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /🔍 Single Area Inspection/i }).click();
    await page.waitForLoadState('networkidle');

    // Fill basic information
    await page.selectOption('select[name="school"]', 'ASA');
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="date"]', today);
    await page.fill('input[name="inspectorName"]', 'Test Inspector');
    await page.fill('input[name="locationDescription"]', 'Room 101 - Math Classroom');

    // Fill ratings (assuming star rating buttons)
    // Rate each category with 4 stars
    const ratingCategories = [
      'floors', 'vertical', 'ceiling', 'restrooms', 'customerSatisfaction',
      'trash', 'projectCleaning', 'activitySupport', 'safetyCompliance',
      'equipment', 'monitoring'
    ];

    for (const category of ratingCategories) {
      const starButton = page.locator(`[data-category="${category}"]`).locator('button').nth(3); // 4th star
      await starButton.click();
    }

    // Add notes
    await page.fill('textarea[name="notes"]', 'Test inspection submitted via automated test');

    // Optional: Upload image
    // await page.setInputFiles('input[type="file"]', './test-fixtures/test-image.jpg');

    // Submit form
    await page.getByRole('button', { name: /Submit/i }).click();

    // Verify success
    await expect(page.getByText(/success|submitted|created/i)).toBeVisible({ timeout: 10000 });

    // Verify redirect or confirmation
    await page.waitForLoadState('networkidle');
  });

  test('should submit inspection with minimum required fields only', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    // Fill only required fields
    await page.selectOption('select[name="school"]', 'LCA');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="locationDescription"]', 'Quick test');

    // Rate only required categories (if any are required)
    // ... minimal ratings

    await page.getByRole('button', { name: /Submit/i }).click();
    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 10000 });
  });

  test('should handle image upload correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    // Fill minimal form
    await page.selectOption('select[name="school"]', 'GWC');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="locationDescription"]', 'Image upload test');

    // Upload test image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-fixtures/test-inspection.jpg');

    // Verify image preview appears (adjust selector as needed)
    await expect(page.locator('img[alt*="preview"]')).toBeVisible();

    // Submit with image
    await page.getByRole('button', { name: /Submit/i }).click();
    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Form Submission - Building Inspection', () => {

  test('should submit complete building inspection with multiple rooms', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /🏢 Building Inspection/i }).click();
    await page.waitForLoadState('networkidle');

    // Fill building information
    await page.selectOption('select[name="school"]', 'OA');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="buildingName"]', 'Main Building');
    await page.fill('input[name="inspectorName"]', 'Building Inspector');

    // Add first room
    await page.fill('input[name="roomNumber"]', '101');
    // Fill ratings for room 101
    // ... fill all ratings

    // Add second room (if multi-room functionality exists)
    await page.getByRole('button', { name: /Add Room|Add Another/i }).click();
    await page.fill('input[name="roomNumber"]', '102');
    // Fill ratings for room 102

    // Submit entire building inspection
    await page.getByRole('button', { name: /Submit Building|Submit All/i }).click();
    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Form Submission - Custodial Note', () => {

  test('should submit custodial concern/note successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /📝 Report A Custodial Concern/i }).click();
    await page.waitForLoadState('networkidle');

    await page.selectOption('select[name="school"]', 'CBR');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="location"]', 'Cafeteria');
    await page.fill('textarea[name="description"]', 'Spill in cafeteria needs immediate attention');

    await page.getByRole('button', { name: /Submit/i }).click();
    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 10000 });
  });
});
```

**Key Points**:
- Adjust selectors based on actual form implementation
- Add test fixture images in `tests/test-fixtures/`
- Verify success messages match actual application text
- Add cleanup after tests if needed

---

### Test File 2: `tests/form-validation.spec.ts`

**Purpose**: Ensure form validation works correctly

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://cacustodialcommand.up.railway.app';

test.describe('Form Validation - Required Fields', () => {

  test('should show error when submitting without required school selection', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    // Fill all fields EXCEPT school
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="locationDescription"]', 'Test location');

    // Try to submit
    await page.getByRole('button', { name: /Submit/i }).click();

    // Should show validation error
    await expect(page.getByText(/school.*required/i)).toBeVisible();
    // OR check for HTML5 validation
    const schoolSelect = page.locator('select[name="school"]');
    await expect(schoolSelect).toHaveAttribute('required', '');
  });

  test('should show error when submitting without date', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    await page.selectOption('select[name="school"]', 'ASA');
    await page.fill('input[name="locationDescription"]', 'Test location');

    await page.getByRole('button', { name: /Submit/i }).click();

    await expect(page.getByText(/date.*required/i)).toBeVisible();
  });

  test('should show error when submitting without location description', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    await page.selectOption('select[name="school"]', 'ASA');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);

    await page.getByRole('button', { name: /Submit/i }).click();

    await expect(page.getByText(/location.*required/i)).toBeVisible();
  });
});

test.describe('Form Validation - Input Constraints', () => {

  test('should reject future dates', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureDateString = futureDate.toISOString().split('T')[0];

    await page.selectOption('select[name="school"]', 'ASA');
    await page.fill('input[name="date"]', futureDateString);
    await page.fill('input[name="locationDescription"]', 'Test');

    await page.getByRole('button', { name: /Submit/i }).click();

    await expect(page.getByText(/future date|invalid date/i)).toBeVisible();
  });

  test('should enforce character limits on text fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    const longText = 'A'.repeat(1000); // Very long text

    await page.fill('input[name="locationDescription"]', longText);

    // Check if input is limited by maxLength attribute
    const actualValue = await page.inputValue('input[name="locationDescription"]');
    expect(actualValue.length).toBeLessThanOrEqual(500); // Adjust based on actual limit
  });

  test('should only allow valid school selections', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    const schoolSelect = page.locator('select[name="school"]');
    const options = await schoolSelect.locator('option').allTextContents();

    // Verify only valid schools are available
    const validSchools = ['ASA', 'LCA', 'GWC', 'OA', 'CBR', 'WLC'];
    for (const school of validSchools) {
      expect(options.some(opt => opt.includes(school))).toBeTruthy();
    }
  });
});

test.describe('Form Validation - Rating Validation', () => {

  test('should only accept ratings between 1-5', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    // Try to input invalid rating directly (if numeric input exists)
    const ratingInput = page.locator('input[name="floors"]');
    if (await ratingInput.count() > 0) {
      await ratingInput.fill('10'); // Invalid rating
      await expect(ratingInput).toHaveValue('5'); // Should be capped at 5

      await ratingInput.fill('0'); // Invalid rating
      await expect(ratingInput).toHaveValue('1'); // Should be minimum 1
    }
  });
});

test.describe('Form Validation - Error Message Display', () => {

  test('should clear error messages after correcting input', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    // Submit empty form to trigger errors
    await page.getByRole('button', { name: /Submit/i }).click();

    // Verify error appears
    const errorMessage = page.getByText(/required/i).first();
    await expect(errorMessage).toBeVisible();

    // Fix the error
    await page.selectOption('select[name="school"]', 'ASA');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="locationDescription"]', 'Fixed');

    // Error should disappear
    await expect(errorMessage).not.toBeVisible();
  });
});

test.describe('Form Validation - Image Upload', () => {

  test('should reject non-image files', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    const fileInput = page.locator('input[type="file"]');

    // Try to upload a text file
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Not an image')
    });

    // Should show error
    await expect(page.getByText(/invalid file|image only|wrong file type/i)).toBeVisible();
  });

  test('should reject oversized images', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    // Create a large fake file (adjust size based on app limits)
    const largeBuffer = Buffer.alloc(20 * 1024 * 1024); // 20MB

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer
    });

    await expect(page.getByText(/too large|file size|exceeds/i)).toBeVisible();
  });
});
```

---

### Test File 3: `tests/data-persistence.spec.ts`

**Purpose**: Verify submitted data appears correctly in database/views

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://cacustodialcommand.up.railway.app';

test.describe('Data Persistence - Inspection Data View', () => {

  test('should display submitted inspection in data view', async ({ page }) => {
    // Create unique identifier for this test
    const testId = `TEST-${Date.now()}`;

    // Step 1: Submit inspection
    await page.goto(`${BASE_URL}/custodial-inspection`);
    await page.selectOption('select[name="school"]', 'ASA');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="locationDescription"]', testId);
    await page.fill('textarea[name="notes"]', 'Automated test inspection');

    // Fill minimal ratings
    // ... fill ratings

    await page.getByRole('button', { name: /Submit/i }).click();
    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 10000 });

    // Step 2: Navigate to data view
    await page.goto(`${BASE_URL}/inspection-data`);
    await page.waitForLoadState('networkidle');

    // Step 3: Verify inspection appears in list
    await expect(page.getByText(testId)).toBeVisible({ timeout: 5000 });
  });

  test('should filter inspections by school', async ({ page }) => {
    await page.goto(`${BASE_URL}/inspection-data`);

    // Apply school filter
    await page.selectOption('select[name="filterSchool"]', 'LCA');
    await page.getByRole('button', { name: /Filter|Apply/i }).click();

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Verify all visible inspections are from LCA
    const inspectionRows = page.locator('table tbody tr');
    const count = await inspectionRows.count();

    for (let i = 0; i < count; i++) {
      const schoolCell = inspectionRows.nth(i).locator('td').nth(1); // Adjust column index
      await expect(schoolCell).toContainText('LCA');
    }
  });

  test('should filter inspections by date range', async ({ page }) => {
    await page.goto(`${BASE_URL}/inspection-data`);

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    await page.fill('input[name="dateFrom"]', sevenDaysAgo.toISOString().split('T')[0]);
    await page.fill('input[name="dateTo"]', today.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /Filter|Apply/i }).click();

    await page.waitForLoadState('networkidle');

    // Verify results are within date range
    const inspectionRows = page.locator('table tbody tr');
    expect(await inspectionRows.count()).toBeGreaterThan(0);
  });
});

test.describe('Data Persistence - Edit Functionality', () => {

  test('should edit existing inspection', async ({ page }) => {
    // Create inspection first
    const originalText = `Original-${Date.now()}`;
    const updatedText = `Updated-${Date.now()}`;

    // Create
    await page.goto(`${BASE_URL}/custodial-inspection`);
    await page.selectOption('select[name="school"]', 'GWC');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="locationDescription"]', originalText);
    await page.getByRole('button', { name: /Submit/i }).click();
    await expect(page.getByText(/success/i)).toBeVisible();

    // Navigate to data view
    await page.goto(`${BASE_URL}/inspection-data`);
    await page.getByText(originalText).click(); // Click to view/edit

    // Edit
    await page.getByRole('button', { name: /Edit/i }).click();
    await page.fill('input[name="locationDescription"]', updatedText);
    await page.getByRole('button', { name: /Save|Update/i }).click();

    // Verify update
    await expect(page.getByText(updatedText)).toBeVisible();
    await expect(page.getByText(originalText)).not.toBeVisible();
  });
});
```

---

### Test File 4: `tests/user-journey-complete.spec.ts`

**Purpose**: Test complete end-to-end user workflows

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://cacustodialcommand.up.railway.app';

test.describe('Complete User Journey - Single Inspection', () => {

  test('should complete full inspection workflow: create → view → edit → delete', async ({ page }) => {
    const uniqueId = `Journey-${Date.now()}`;

    // 1. Navigate to home
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Custodial|Command/i);

    // 2. Access single area inspection form
    await page.getByRole('button', { name: /🔍 Single Area Inspection/i }).click();
    await page.waitForLoadState('networkidle');

    // 3. Verify breadcrumb
    await expect(page.getByText('Home')).toBeVisible();
    await expect(page.getByText('Single Area Inspection')).toBeVisible();

    // 4. Fill complete form
    await page.selectOption('select[name="school"]', 'WLC');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="inspectorName"]', 'Journey Tester');
    await page.fill('input[name="locationDescription"]', uniqueId);

    // Fill all rating categories
    const categories = ['floors', 'vertical', 'ceiling', 'restrooms',
                       'customerSatisfaction', 'trash', 'projectCleaning',
                       'activitySupport', 'safetyCompliance', 'equipment', 'monitoring'];

    for (const category of categories) {
      // Click 4th star for each category
      await page.locator(`[data-category="${category}"] button`).nth(3).click();
    }

    await page.fill('textarea[name="notes"]', 'Complete journey test with all fields filled');

    // 5. Submit form
    await page.getByRole('button', { name: /Submit/i }).click();
    await expect(page.getByText(/success|submitted/i)).toBeVisible({ timeout: 10000 });

    // 6. Navigate to data view
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /📊 View Data & Reports/i }).click();
    await page.waitForLoadState('networkidle');

    // 7. Find submitted inspection
    await expect(page.getByText(uniqueId)).toBeVisible({ timeout: 5000 });

    // 8. View details
    await page.getByText(uniqueId).click();
    await expect(page.getByText('Journey Tester')).toBeVisible();
    await expect(page.getByText('WLC')).toBeVisible();

    // 9. Edit inspection (if available)
    const editButton = page.getByRole('button', { name: /Edit/i });
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.fill('textarea[name="notes"]', 'Updated notes during journey test');
      await page.getByRole('button', { name: /Save|Update/i }).click();
      await expect(page.getByText('Updated notes during journey test')).toBeVisible();
    }

    // 10. Delete inspection (if available) - CLEANUP
    const deleteButton = page.getByRole('button', { name: /Delete/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      // Confirm deletion
      await page.getByRole('button', { name: /Confirm|Yes|Delete/i }).click();
      await expect(page.getByText(uniqueId)).not.toBeVisible();
    }
  });
});

test.describe('Complete User Journey - Building Inspection', () => {

  test('should complete multi-room building inspection', async ({ page }) => {
    const buildingId = `Building-${Date.now()}`;

    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /🏢 Building Inspection/i }).click();
    await page.waitForLoadState('networkidle');

    // Fill building details
    await page.selectOption('select[name="school"]', 'ASA');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="buildingName"]', buildingId);
    await page.fill('input[name="inspectorName"]', 'Building Inspector');

    // Add Room 101
    await page.fill('input[name="roomNumber"]', '101');
    // Fill ratings for room 101
    // ... (similar to single inspection)

    // Add Room 102 (if multi-room supported)
    const addRoomButton = page.getByRole('button', { name: /Add Room/i });
    if (await addRoomButton.isVisible()) {
      await addRoomButton.click();
      await page.fill('input[name="roomNumber"]', '102');
      // Fill ratings for room 102
    }

    // Submit building inspection
    await page.getByRole('button', { name: /Submit/i }).click();
    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 15000 });

    // Verify in data view
    await page.goto(`${BASE_URL}/inspection-data`);
    await expect(page.getByText(buildingId)).toBeVisible();
  });
});

test.describe('Complete User Journey - Monthly Report', () => {

  test('should generate and view monthly feedback report', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /📄 Monthly Feedback Reports/i }).click();
    await page.waitForLoadState('networkidle');

    // Select report parameters
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString();

    await page.selectOption('select[name="month"]', currentMonth);
    await page.selectOption('select[name="year"]', currentYear);
    await page.selectOption('select[name="school"]', 'All Schools'); // or specific school

    // Generate report
    await page.getByRole('button', { name: /Generate|View Report/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify report displays
    await expect(page.getByText(/Report|Summary/i)).toBeVisible();
    await expect(page.locator('table, chart, .report-data')).toBeVisible();

    // Test download (if available)
    const downloadButton = page.getByRole('button', { name: /Download|Export|PDF/i });
    if (await downloadButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await downloadButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf'); // or .xlsx
    }
  });
});
```

---

### Test File 5: `tests/accessibility.spec.ts`

**Purpose**: Ensure application is accessible

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = 'https://cacustodialcommand.up.railway.app';

test.describe('Accessibility Testing', () => {

  test('home page should not have accessibility violations', async ({ page }) => {
    await page.goto(BASE_URL);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('inspection form should not have accessibility violations', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(BASE_URL);

    // Tab through main navigation buttons
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Enter to activate button
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // Should navigate to new page
    expect(page.url()).not.toBe(BASE_URL);
  });

  test('form inputs should have proper labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    // Check school select has label
    const schoolSelect = page.locator('select[name="school"]');
    const schoolId = await schoolSelect.getAttribute('id');
    const schoolLabel = page.locator(`label[for="${schoolId}"]`);
    await expect(schoolLabel).toBeVisible();

    // Check date input has label
    const dateInput = page.locator('input[name="date"]');
    const dateId = await dateInput.getAttribute('id');
    const dateLabel = page.locator(`label[for="${dateId}"]`);
    await expect(dateLabel).toBeVisible();
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto(BASE_URL);

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
      expect(alt.length).toBeGreaterThan(0);
    }
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto(BASE_URL);

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute('aria-label') || await button.textContent();
      expect(name).not.toBeNull();
      expect(name.trim().length).toBeGreaterThan(0);
    }
  });
});
```

---

### Test File 6: `tests/mobile-specific.spec.ts`

**Purpose**: Mobile-specific functionality

```typescript
import { test, expect, devices } from '@playwright/test';

const BASE_URL = 'https://cacustodialcommand.up.railway.app';

test.use(devices['iPhone 14']);

test.describe('Mobile - Touch Targets', () => {

  test('all interactive elements should meet 44px minimum touch target', async ({ page }) => {
    await page.goto(BASE_URL);

    const buttons = page.locator('button, a[role="button"]');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test.describe('Mobile - Camera Integration', () => {

  test('should allow camera capture for images', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);

    await page.goto(`${BASE_URL}/custodial-inspection`);

    const cameraButton = page.locator('label[for="camera-capture"]');
    await expect(cameraButton).toBeVisible();

    // Note: Actual camera capture testing requires real device or emulator
    // This just verifies the button exists
  });
});

test.describe('Mobile - Responsive Layout', () => {

  test('should display mobile-optimized layout', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check viewport
    const viewportSize = page.viewportSize();
    expect(viewportSize.width).toBeLessThan(768); // Mobile breakpoint

    // Verify mobile navigation (hamburger menu, etc.)
    const mobileMenu = page.locator('[aria-label="Menu"], .mobile-menu, .hamburger');
    // await expect(mobileMenu).toBeVisible(); // If hamburger exists
  });

  test('forms should be scrollable and usable on mobile', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    // Fill form on mobile
    await page.selectOption('select[name="school"]', 'ASA');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Submit button should be accessible
    await expect(page.getByRole('button', { name: /Submit/i })).toBeVisible();
  });
});

test.describe('Mobile - PWA Installation', () => {

  test('should display PWA install prompt elements', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check manifest link exists
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveCount(1);

    // Check service worker registration
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swRegistered).toBeTruthy();
  });
});
```

---

### Test File 7: `tests/performance.spec.ts`

**Purpose**: Performance benchmarking

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://cacustodialcommand.up.railway.app';

test.describe('Performance Metrics', () => {

  test('home page should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('form submission should complete within 5 seconds', async ({ page }) => {
    await page.goto(`${BASE_URL}/custodial-inspection`);

    // Fill minimal form
    await page.selectOption('select[name="school"]', 'ASA');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="locationDescription"]', 'Performance test');

    const startTime = Date.now();
    await page.getByRole('button', { name: /Submit/i }).click();
    await expect(page.getByText(/success/i)).toBeVisible();
    const submitTime = Date.now() - startTime;

    expect(submitTime).toBeLessThan(5000);
  });

  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    await page.goto(BASE_URL);

    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries);
        });
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      });
    });

    console.log('Performance Metrics:', metrics);
    // Add assertions based on metrics
  });
});

test.describe('Lighthouse Performance', () => {

  test('should achieve minimum Lighthouse scores', async ({ page }) => {
    // Note: Requires @playwright/test lighthouse plugin
    // This is a placeholder showing the concept

    await page.goto(BASE_URL);

    // Run Lighthouse audit
    // const lighthouseResult = await lighthouse(page.url(), { ... });

    // Assert scores
    // expect(lighthouseResult.lhr.categories.performance.score).toBeGreaterThan(0.9);
    // expect(lighthouseResult.lhr.categories.accessibility.score).toBeGreaterThan(0.9);
    // expect(lighthouseResult.lhr.categories['best-practices'].score).toBeGreaterThan(0.9);
  });
});
```

---

### Test File 8: `tests/offline-functionality.spec.ts`

**Purpose**: Test PWA offline capabilities

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://cacustodialcommand.up.railway.app';

test.describe('Offline Functionality', () => {

  test('should queue form submission when offline', async ({ page, context }) => {
    // Go online and load the app
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Navigate to form
    await page.getByRole('button', { name: /🔍 Single Area Inspection/i }).click();

    // Fill form
    await page.selectOption('select[name="school"]', 'ASA');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="locationDescription"]', 'Offline test');

    // Go offline
    await context.setOffline(true);

    // Try to submit
    await page.getByRole('button', { name: /Submit/i }).click();

    // Should show offline message or queued message
    await expect(page.getByText(/offline|queued|sync later/i)).toBeVisible({ timeout: 5000 });

    // Go back online
    await context.setOffline(false);

    // Wait for sync (if background sync supported)
    await page.waitForTimeout(3000);

    // Verify sync occurred
    await expect(page.getByText(/synced|sent|success/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show offline indicator when disconnected', async ({ page, context }) => {
    await page.goto(BASE_URL);

    // Go offline
    await context.setOffline(true);

    // Reload page
    await page.reload();

    // Should show offline indicator or offline page
    await expect(page.getByText(/offline|no connection|disconnected/i)).toBeVisible();
  });

  test('should cache pages for offline viewing', async ({ page, context }) => {
    // Load page while online
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Load rating criteria page
    await page.getByRole('button', { name: /ℹ️ Rating Criteria Guide/i }).click();
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Navigate back to home
    await page.goto(BASE_URL);

    // Should still load from cache
    await expect(page.getByText(/Custodial|Command/i)).toBeVisible();
  });
});
```

---

## 🗂️ Test Data Requirements

### Test Fixtures Directory Structure

```
tests/
├── test-fixtures/
│   ├── images/
│   │   ├── test-inspection.jpg (valid JPEG, < 5MB)
│   │   ├── test-inspection.png (valid PNG, < 5MB)
│   │   ├── large-image.jpg (> 10MB for size validation)
│   │   └── invalid-file.txt (for type validation)
│   ├── test-data.json
│   └── mock-inspections.json
└── helpers/
    ├── test-helpers.ts
    ├── data-generators.ts
    └── cleanup-utils.ts
```

### Test Data JSON Example

**`tests/test-fixtures/test-data.json`**:
```json
{
  "schools": ["ASA", "LCA", "GWC", "OA", "CBR", "WLC"],
  "validInspection": {
    "school": "ASA",
    "date": "2025-01-15",
    "inspectorName": "Test Inspector",
    "locationDescription": "Room 101 - Math Classroom",
    "ratings": {
      "floors": 4,
      "verticalSurfaces": 4,
      "ceiling": 5,
      "restrooms": 3,
      "customerSatisfaction": 4,
      "trash": 5,
      "projectCleaning": 4,
      "activitySupport": 4,
      "safetyCompliance": 5,
      "equipment": 4,
      "monitoring": 4
    },
    "notes": "Automated test inspection"
  },
  "invalidInspections": [
    {
      "description": "Missing school",
      "data": {
        "date": "2025-01-15",
        "locationDescription": "Test"
      }
    },
    {
      "description": "Future date",
      "data": {
        "school": "ASA",
        "date": "2026-01-01",
        "locationDescription": "Test"
      }
    }
  ]
}
```

### Helper Functions

**`tests/helpers/test-helpers.ts`**:
```typescript
import { Page } from '@playwright/test';

export async function fillBasicInspectionForm(page: Page, data: any) {
  await page.selectOption('select[name="school"]', data.school);
  await page.fill('input[name="date"]', data.date);
  await page.fill('input[name="inspectorName"]', data.inspectorName);
  await page.fill('input[name="locationDescription"]', data.locationDescription);
  if (data.notes) {
    await page.fill('textarea[name="notes"]', data.notes);
  }
}

export async function fillAllRatings(page: Page, ratings: any) {
  for (const [category, rating] of Object.entries(ratings)) {
    const starIndex = (rating as number) - 1;
    await page.locator(`[data-category="${category}"] button`).nth(starIndex).click();
  }
}

export function generateUniqueId(prefix: string = 'TEST'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function submitFormAndVerifySuccess(page: Page) {
  await page.getByRole('button', { name: /Submit/i }).click();
  await page.waitForSelector('text=/success|submitted/i', { timeout: 10000 });
}

export async function navigateToDataView(page: Page, baseUrl: string) {
  await page.goto(baseUrl);
  await page.getByRole('button', { name: /📊 View Data & Reports/i }).click();
  await page.waitForLoadState('networkidle');
}
```

### Test Image Requirements

Create test images:
```bash
# In tests/test-fixtures/images/
# Create valid test images (use any image editor or download sample images)
# - test-inspection.jpg (e.g., 1920x1080, ~500KB)
# - test-inspection.png (e.g., 1024x768, ~300KB)

# Create oversized image for validation testing
# - large-image.jpg (> 10MB)

# Create invalid file
echo "Not an image" > invalid-file.txt
```

---

## ⚙️ Environment Setup

### Prerequisites

```bash
# Ensure Node.js 18+ is installed
node --version

# Ensure Playwright is installed
npm list @playwright/test

# Install Playwright browsers
npx playwright install

# Install axe-core for accessibility testing
npm install --save-dev @axe-core/playwright
```

### Playwright Configuration

**Current**: `playwright.config.ts` is already configured with:
- 5 browser projects (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari)
- Base URL: `https://cacustodialcommand.up.railway.app`
- Retries: 2 in CI, 0 locally
- Timeout: 60 seconds
- Screenshots on failure
- Video on failure

**Recommended Additions**:

```typescript
// Add to playwright.config.ts
export default defineConfig({
  // ... existing config

  // Add test fixtures directory
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Add these:
    testIdAttribute: 'data-testid', // If using test IDs
    actionTimeout: 10000, // Individual action timeout
  },

  // Add global setup/teardown if needed
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
});
```

### Running Tests

```bash
# Run all tests
npm run ui:test

# Run specific test file
npx playwright test tests/form-submission.spec.ts

# Run in headed mode (see browser)
npm run ui:test:headed

# Run specific browser
npx playwright test --project=chromium

# Run mobile tests only
npx playwright test --project=mobile-chrome --project=mobile-safari

# Run with debugging
npx playwright test --debug

# Generate test report
npm run ui:test:report

# Run tests in parallel
npx playwright test --workers=4

# Run tests matching pattern
npx playwright test -g "form submission"
```

### Environment Variables

```bash
# .env.test (create this file)
TEST_URL=https://cacustodialcommand.up.railway.app
TEST_ADMIN_USERNAME=admin
TEST_ADMIN_PASSWORD=your_password
DATABASE_URL=your_test_db_url # If testing against local DB

# CI environment (.github/workflows/test.yml)
TEST_URL=${{ secrets.TEST_URL }}
```

---

## ✅ Acceptance Criteria

### Phase 1 Complete When:
- [ ] All form submission tests pass (single, building, note)
- [ ] All form validation tests pass (required fields, constraints)
- [ ] Data persistence verified (submissions appear in data view)
- [ ] Authentication tests pass (if applicable)
- [ ] Image upload functionality tested
- [ ] All tests run in CI/CD pipeline

### Phase 2 Complete When:
- [ ] Complete user journey tests pass (create → view → edit → delete)
- [ ] Building inspection multi-room workflow tested
- [ ] Monthly report generation tested
- [ ] Data filtering and search tested
- [ ] All user-facing features have E2E coverage

### Phase 3 Complete When:
- [ ] Mobile-specific tests pass on iOS and Android simulators
- [ ] All tests pass in Chrome, Firefox, and Safari
- [ ] Touch target size requirements met (44px minimum)
- [ ] PWA installation flow tested
- [ ] Offline functionality verified

### Phase 4 Complete When:
- [ ] Accessibility score > 95% (axe-core)
- [ ] Keyboard navigation fully functional
- [ ] Visual regression baseline established
- [ ] Performance benchmarks documented (< 3s page load)
- [ ] Lighthouse scores documented (Performance > 90)

### Overall Test Suite Success Metrics:
- [ ] **Coverage**: > 80% critical path coverage
- [ ] **Reliability**: < 5% flaky test rate
- [ ] **Speed**: Full suite runs in < 15 minutes
- [ ] **Maintainability**: Tests follow DRY principles with helper functions
- [ ] **Documentation**: All tests have clear descriptions and comments

---

## 🐛 Known Issues & Workarounds

### Issue 1: Star Rating Selectors Fragile
**Problem**: Current selector `page.locator('button').filter({ has: page.locator('svg') })` is too broad

**Workaround**:
```typescript
// Use data attributes or more specific selectors
const starButton = page.locator('[data-category="floors"] [data-star="4"]');
// OR use aria-label
const starButton = page.locator('[aria-label*="4 stars"]');
```

### Issue 2: Timing Issues with Form Submission
**Problem**: Success message may appear before page fully updates

**Workaround**:
```typescript
// Wait for network idle AND success message
await Promise.all([
  page.waitForLoadState('networkidle'),
  page.waitForSelector('text=/success/i', { timeout: 10000 })
]);
```

### Issue 3: Image Upload Testing Limitations
**Problem**: Cannot fully test camera capture in headless browsers

**Workaround**:
```typescript
// Use file input simulation
await page.setInputFiles('input[type="file"]', {
  name: 'test.jpg',
  mimeType: 'image/jpeg',
  buffer: fs.readFileSync('./tests/test-fixtures/images/test-inspection.jpg')
});
```

### Issue 4: Offline Testing Flakiness
**Problem**: Service worker registration timing can be inconsistent

**Workaround**:
```typescript
// Wait for service worker to be ready
await page.evaluate(() => {
  return navigator.serviceWorker.ready;
});

// Then set offline
await context.setOffline(true);
```

### Issue 5: Cross-Browser Date Input Differences
**Problem**: Date input format varies between browsers

**Workaround**:
```typescript
// Use ISO format consistently
const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
await page.fill('input[name="date"]', date);
```

### Issue 6: Dynamic Content Loading
**Problem**: Content may load dynamically, causing timing issues

**Workaround**:
```typescript
// Use waitForSelector with specific timeout
await page.waitForSelector('[data-loaded="true"]', {
  state: 'attached',
  timeout: 10000
});

// Or wait for specific network request to complete
await page.waitForResponse(resp =>
  resp.url().includes('/api/inspections') && resp.status() === 200
);
```

---

## 📊 Test Execution Checklist

Before running tests:
- [ ] Application is deployed and accessible at test URL
- [ ] Database is in known state (or tests handle cleanup)
- [ ] Test fixtures are in place (images, data files)
- [ ] Environment variables configured
- [ ] Playwright browsers installed

After running tests:
- [ ] Review test report
- [ ] Check for flaky tests (rerun failed tests)
- [ ] Update test data if needed
- [ ] Clean up test data from database
- [ ] Document any new issues found

---

## 🎯 Success Metrics

### Test Coverage Goals
- **Critical Paths**: 100% coverage
- **User Journeys**: 90% coverage
- **UI Components**: 80% coverage
- **Edge Cases**: 70% coverage

### Quality Metrics
- **Pass Rate**: > 95%
- **Flakiness**: < 5%
- **Execution Time**: < 15 minutes
- **Maintenance**: < 2 hours/week

### Performance Benchmarks
- **Home Page Load**: < 2 seconds
- **Form Submission**: < 3 seconds
- **Data View Load**: < 2 seconds
- **Report Generation**: < 5 seconds

---

## 📚 Additional Resources

### Documentation Links
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Axe-core Playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [Web.dev Performance](https://web.dev/performance/)

### Project-Specific Docs
- [IMPROVEMENT_RECOMMENDATIONS.md](./IMPROVEMENT_RECOMMENDATIONS.md) - Overall improvements
- [UX_IMPROVEMENTS_SUMMARY.md](./UX_IMPROVEMENTS_SUMMARY.md) - UX features
- [COMPREHENSIVE_TESTING_GUIDE.md](./COMPREHENSIVE_TESTING_GUIDE.md) - Testing strategy
- [README.md](./README.md) - Project overview

---

## 🚀 Quick Start Commands

```bash
# Clone/navigate to project
cd /Users/rharman/CustodialCommand

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install accessibility testing
npm install --save-dev @axe-core/playwright

# Create test fixtures directory
mkdir -p tests/test-fixtures/images
mkdir -p tests/helpers

# Run existing tests to verify setup
npm run ui:test

# Run specific priority tests
npx playwright test tests/form-submission.spec.ts
npx playwright test tests/form-validation.spec.ts
npx playwright test tests/user-journey-complete.spec.ts

# View test report
npm run ui:test:report
```

---

## 📝 Notes for Next LLM Session

**Context**: This is a school custodial inspection tracking application with 6 schools. The current test file (`tests/custodial-improvements.spec.ts`) covers basic UI improvements but lacks comprehensive functional testing.

**Current State**:
- ✅ Basic UI/UX tests exist
- ✅ Playwright configured with 5 browser projects
- ❌ No form submission tests
- ❌ No data persistence validation
- ❌ No user journey tests

**Priority Actions**:
1. Create `tests/form-submission.spec.ts` first
2. Create `tests/form-validation.spec.ts` second
3. Create `tests/data-persistence.spec.ts` third
4. Then work through Phase 2-4 tests

**Important Selectors to Verify**:
- School dropdown: `select[name="school"]`
- Date input: `input[name="date"]`
- Location: `input[name="locationDescription"]`
- Star ratings: Verify actual implementation (may need data attributes)
- Submit button: `button` with text "Submit"

**Test Data**:
- Schools: ASA, LCA, GWC, OA, CBR, WLC
- Rating scale: 1-5 stars
- 11 rating categories

**Gotchas**:
- Service worker timing for offline tests
- Star rating selector fragility
- Cross-browser date input format differences
- Dynamic content loading timing

---

**Document Version**: 1.0
**Last Updated**: 2025-10-31
**Status**: Ready for Implementation
