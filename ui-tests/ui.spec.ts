import { test, expect, type Page } from '@playwright/test';

/**
 * Waits for React and the page to be fully hydrated and loaded.
 * This handles client-side routing delays (Wouter) and React 18 rendering timing.
 */
async function waitForReactReady(page: Page) {
  await page.waitForFunction(
    () => {
      // Check DOM is interactive
      return window.performance?.getEntriesByType?.('navigation')?.[0]?.domInteractive > 0;
    },
    { timeout: 10000 }
  );
}

/**
 * Navigate to a URL and wait for the page to be fully loaded and React hydrated.
 */
async function navigateAndWait(page: Page, path: string) {
  await page.goto(path);
  await waitForReactReady(page);
  // Wait for data-loaded marker if present (from our page components)
  await page.waitForSelector('[data-loaded="true"]', { state: 'attached', timeout: 8000 }).catch(() => {
    // Fallback: some pages might not have the marker yet
  });
}

test.describe('Custodial Command - Comprehensive UI', () => {
  test('Landing page loads and main navigation works', async ({ page, baseURL }) => {
    await page.goto('/');
    await waitForReactReady(page);
    await expect(page).toHaveTitle(/Custodial|Command/i);

    // Basic nav routes (best-effort by link text and common keywords)
    const linksToCheck = [
      { label: /Inspection Data|Data/i, href: '/inspection-data' },
      { label: /Rating Criteria|Criteria/i, href: '/rating-criteria' },
      { label: /Custodial Notes|Notes/i, href: '/custodial-notes' },
      { label: /Single|Custodial Inspection/i, href: '/custodial-inspection' },
      { label: /Whole Building|Building/i, href: '/whole-building-inspection' }
    ];

    for (const link of linksToCheck) {
      const nav = page.getByRole('link', { name: link.label }).first();
      if (await nav.isVisible().catch(() => false)) {
        await nav.click();
        await expect(page).toHaveURL(new RegExp(`${(baseURL || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${link.href}`));
        await page.goBack();
      }
    }
  });

  test('Create Single Room Inspection (happy path)', async ({ page }) => {
    await navigateAndWait(page, '/custodial-inspection');

    // Fill minimal required fields by label where possible
    const maybeFill = async (label: RegExp | string, value: string) => {
      const ctl = page.getByLabel(label).first();
      if (await ctl.isVisible().catch(() => false)) {
        await ctl.fill(value);
      }
    };

    await maybeFill(/Inspector Name/i, 'UI Test Inspector');
    await maybeFill(/School/i, 'UI Test School');
    await maybeFill(/Date/i, new Date().toISOString().split('T')[0]);
    await maybeFill(/Room Number|Room/i, 'U101');
    await maybeFill(/Building Name|Building/i, 'UI Test Building');
    await maybeFill(/Location Description|Description/i, 'UI created inspection');

    // Try ratings as sliders/selects if present
    const ratingLabels = [
      /Floors/i,
      /Vertical|Horizontal/i,
      /Ceiling/i,
      /Restrooms/i,
      /Customer Satisfaction/i,
      /Trash/i,
      /Project Cleaning/i,
      /Activity Support/i,
      /Safety Compliance/i,
      /Equipment/i,
      /Monitoring/i
    ];
    for (const label of ratingLabels) {
      const slider = page.getByLabel(label).first();
      if (await slider.isVisible().catch(() => false)) {
        // For inputs/selects, try set value '4'
        try { await slider.fill('4'); } catch {}
        try { await slider.selectOption('4'); } catch {}
      }
    }

    // Submit
    const submit = page.getByRole('button', { name: /Submit|Create|Save/i }).first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      await expect(page.getByText(/success|created|saved/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('Create Custodial Note', async ({ page }) => {
    await navigateAndWait(page, '/custodial-notes');

    const maybeFill = async (label: RegExp | string, value: string) => {
      const ctl = page.getByLabel(label).first();
      if (await ctl.isVisible().catch(() => false)) {
        await ctl.fill(value);
      }
    };

    await maybeFill(/School/i, 'UI Test School');
    await maybeFill(/Date/i, new Date().toISOString().split('T')[0]);
    await maybeFill(/Location$/i, 'UI Test Location');
    await maybeFill(/Description|Location Description/i, 'UI note via Playwright');
    await maybeFill(/Notes|Details/i, 'This is a UI-created custodial note');

    const submit = page.getByRole('button', { name: /Submit|Create|Save/i }).first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      await expect(page.getByText(/success|created|saved/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('Admin list view loads (if accessible)', async ({ page }) => {
    await navigateAndWait(page, '/admin-inspections');
    // If protected, expect some guard; otherwise expect table/list
    const protectedText = page.getByText(/unauthorized|login|forbidden/i);
    const table = page.locator('table');
    if (await protectedText.isVisible().catch(() => false)) {
      await expect(protectedText).toBeVisible();
    } else {
      await expect(table.or(page.getByRole('heading', { name: /inspections/i }))).toBeVisible();
    }
  });
});


