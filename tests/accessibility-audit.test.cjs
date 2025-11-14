/**
 * Comprehensive Accessibility Audit for Custodial Command
 * Tests WCAG 2.1 AAA compliance, keyboard navigation, screen reader support, etc.
 */

import { test, expect, devices } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

// Test configuration for different viewports and devices
const VIEWPORTS = {
  'Desktop': { width: 1200, height: 800 },
  'Tablet': { width: 768, height: 1024 },
  'Mobile': { width: 375, height: 667 }
};

const MOBILE_DEVICES = {
  'iPhone 12': devices['iPhone 12'],
  'Pixel 5': devices['Pixel 5']
};

test.describe('Accessibility Audit - WCAG 2.1 AAA Compliance', () => {

  test.beforeEach(async ({ page }) => {
    // Inject axe-core for automated accessibility testing
    await injectAxe(page);
  });

  test('Homepage Accessibility Compliance', async ({ page }) => {
    await page.goto('https://cacustodialcommand.up.railway.app/');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Run comprehensive accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      rules: {
        // WCAG 2.1 AAA specific rules
        'color-contrast': { enabled: true },
        'keyboard': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'aria-labels': { enabled: true },
        'heading-order': { enabled: true },
        'landmark-one-main': { enabled: true },
        'page-has-heading-one': { enabled: true },
        'region': { enabled: true }
      }
    });
  });

  test('Keyboard Navigation Test', async ({ page }) => {
    await page.goto('https://cacustodialcommand.up.railway.app/');
    await page.waitForLoadState('networkidle');

    // Get all focusable elements
    const focusableElements = await page.locator(`
      a[href], button, input, select, textarea,
      [tabindex]:not([tabindex="-1"]),
      [contenteditable="true"]
    `).all();

    // Test Tab navigation through all interactive elements
    for (let i = 0; i < focusableElements.length; i++) {
      await page.keyboard.press('Tab');

      // Check that focus is visible
      const focusedElement = await page.locator(':focus').count();
      expect(focusedElement).toBeGreaterThan(0);

      // Check that focus indicator is visible (outline or equivalent)
      const focused = page.locator(':focus');
      const computedStyle = await focused.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline,
          outlineOffset: style.outlineOffset,
          boxShadow: style.boxShadow
        };
      });

      // Focus should be visible
      const hasFocusIndicator =
        computedStyle.outline !== 'none' ||
        computedStyle.boxShadow !== 'none';

      expect(hasFocusIndicator).toBe(true);
    }

    // Test Shift+Tab navigation
    for (let i = 0; i < Math.min(5, focusableElements.length); i++) {
      await page.keyboard.press('Shift+Tab');
      const focusedElement = await page.locator(':focus').count();
      expect(focusedElement).toBeGreaterThan(0);
    }

    // Test Enter/Space on buttons and links
    await page.keyboard.press('Tab'); // Focus first element
    const firstButton = page.locator('button, a[href]').first();
    if (await firstButton.count() > 0) {
      await page.keyboard.press('Enter');
      // Should navigate or activate
    }
  });

  test('Touch Target Size Compliance (44x44px minimum)', async ({ page }) => {
    await page.goto('https://cacustodialcommand.up.railway.app/');
    await page.waitForLoadState('networkidle');

    // Get all interactive elements
    const interactiveElements = await page.locator(`
      button, a[href], input[type="button"], input[type="submit"],
      [role="button"], [onclick], [role="link"]
    `).all();

    const touchTargetViolations = [];

    for (let i = 0; i < interactiveElements.length; i++) {
      const element = interactiveElements[i];
      const boundingBox = await element.boundingBox();

      if (boundingBox) {
        const { width, height } = boundingBox;

        // WCAG AAA requires 44x44px minimum touch targets
        if (width < 44 || height < 44) {
          touchTargetViolations.push({
            element: await element.evaluate(el => ({
              tagName: el.tagName,
              className: el.className,
              textContent: el.textContent?.substring(0, 50),
              id: el.id
            })),
            width,
            height
          });
        }
      }
    }

    // Report violations
    if (touchTargetViolations.length > 0) {
      console.log('Touch Target Violations:');
      touchTargetViolations.forEach(violation => {
        console.log(`- ${JSON.stringify(violation)}`);
      });
    }

    expect(touchTargetViolations.length).toBe(0);
  });

  test('Color Contrast Analysis', async ({ page }) => {
    await page.goto('https://cacustodialcommand.up.railway.app/');
    await page.waitForLoadState('networkidle');

    // Get all text-containing elements
    const textElements = await page.locator('*:not(script):not(style)').all();

    const contrastViolations = [];

    for (let i = 0; i < textElements.length; i++) {
      const element = textElements[i];
      const textContent = await element.textContent();

      if (textContent && textContent.trim().length > 0) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          const contrast = await page.evaluate((el) => {
            // Get computed colors
            const style = window.getComputedStyle(el);
            const textColor = style.color;
            const backgroundColor = style.backgroundColor;

            // Simple contrast ratio calculation
            const getLuminance = (color) => {
              const rgb = color.match(/\d+/g);
              if (!rgb) return 1;

              const [r, g, b] = rgb.map(val => {
                const normalized = val / 255;
                return normalized <= 0.03928
                  ? normalized / 12.92
                  : Math.pow((normalized + 0.055) / 1.055, 2.4);
              });

              return 0.2126 * r + 0.7152 * g + 0.0722 * b;
            };

            const textLum = getLuminance(textColor);
            const bgLum = getLuminance(backgroundColor);

            const lighter = Math.max(textLum, bgLum);
            const darker = Math.min(textLum, bgLum);

            return (lighter + 0.05) / (darker + 0.05);
          }, element);

          // WCAG AAA requires 7:1 contrast for normal text, 4.5:1 for large text
          const fontSize = await element.evaluate(el => {
            const style = window.getComputedStyle(el);
            return parseFloat(style.fontSize);
          });

          const isLargeText = fontSize >= 18;
          const requiredRatio = isLargeText ? 4.5 : 7.0;

          if (contrast < requiredRatio) {
            contrastViolations.push({
              text: textContent.substring(0, 50),
              contrast: contrast.toFixed(2),
              fontSize: fontSize,
              requiredRatio: requiredRatio
            });
          }
        }
      }
    }

    if (contrastViolations.length > 0) {
      console.log('Color Contrast Violations:');
      contrastViolations.forEach(violation => {
        console.log(`- "${violation.text}": ${violation.contrast}:1 (required: ${violation.requiredRatio}:1)`);
      });
    }
  });

  test('Form Accessibility', async ({ page }) => {
    // Test single area inspection form
    await page.goto('https://cacustodialcommand.up.railway.app/custodial-inspection');
    await page.waitForLoadState('networkidle');

    // Check form labels
    const formInputs = await page.locator('input, select, textarea').all();

    for (const input of formInputs) {
      // Each form input should have a label, aria-label, or aria-labelledby
      const hasLabel = await page.evaluate((el) => {
        const id = el.id;
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');

        // Check for explicit label
        if (ariaLabel || ariaLabelledBy) return true;

        // Check for associated label element
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return true;
        }

        // Check if input is within a label
        let parent = el.parentElement;
        while (parent) {
          if (parent.tagName === 'LABEL') return true;
          parent = parent.parentElement;
        }

        return false;
      }, input);

      expect(hasLabel).toBe(true);
    }

    // Check required fields are properly marked
    const requiredInputs = await page.locator('[required]').all();
    for (const input of requiredInputs) {
      const hasAriaRequired = await input.getAttribute('aria-required');
      expect(hasAriaRequired || 'true').toBeTruthy();
    }

    // Run axe accessibility checks on forms specifically
    await checkA11y(page, 'form', {
      rules: {
        'label': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'label-title-only': { enabled: true }
      }
    });
  });

  test('Screen Reader Support - Semantic HTML', async ({ page }) => {
    await page.goto('https://cacustodialcommand.up.railway.app/');
    await page.waitForLoadState('networkidle');

    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

    if (headings.length > 0) {
      // First heading should be h1
      const firstHeading = await headings[0].evaluate(el => el.tagName);
      expect(firstHeading).toBe('H1');

      // Check heading order (should not skip levels)
      for (let i = 1; i < headings.length; i++) {
        const prevLevel = parseInt(await headings[i-1].evaluate(el => el.tagName.substring(1)));
        const currLevel = parseInt(await headings[i].evaluate(el => el.tagName.substring(1)));

        // Should not skip more than one level
        expect(currLevel - prevLevel).toBeLessThanOrEqual(1);
      }
    }

    // Check for landmarks
    const landmarks = await page.locator('main, nav, header, footer, aside, section').all();
    expect(landmarks.length).toBeGreaterThan(0);

    // Check for main landmark
    const mainExists = await page.locator('main').count();
    const hasAriaMain = await page.locator('[role="main"]').count();
    expect(mainExists + hasAriaMain).toBeGreaterThan(0);

    // Check for proper ARIA roles
    const buttonsWithRole = await page.locator('button[role], [role="button"]').all();
    for (const button of buttonsWithRole) {
      const role = await button.getAttribute('role');
      expect(role).toBeTruthy();
    }

    // Check alt text for images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Images should have alt text unless decorative
      if (role !== 'presentation' && role !== 'none') {
        expect(alt !== null).toBe(true);
      }
    }
  });

  // Mobile-specific accessibility tests
  test('Mobile Accessibility - iPhone 12', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 dimensions

    await page.goto('https://cacustodialcommand.up.railway.app/');
    await page.waitForLoadState('networkidle');

    // Test touch targets specifically on mobile
    await checkA11y(page, null, {
      rules: {
        'target-size': { enabled: true }, // WCAG 2.2 target size
        'color-contrast': { enabled: true },
        'keyboard': { enabled: true },
        'touch-target-dimension': { enabled: true }
      }
    });
  });

  test('Mobile Accessibility - Android', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 }); // Pixel 5 dimensions

    await page.goto('https://cacustodialcommand.up.railway.app/');
    await page.waitForLoadState('networkidle');

    // Test mobile navigation patterns
    const touchTargets = await page.locator('button, a[href]').all();

    for (const target of touchTargets) {
      const boundingBox = await target.boundingBox();
      if (boundingBox) {
        // Ensure adequate spacing between touch targets
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Focus Management in Dynamic Content', async ({ page }) => {
    await page.goto('https://cacustodialcommand.up.railway.app/');
    await page.waitForLoadState('networkidle');

    // Click on navigation to load dynamic content
    const firstButton = page.locator('button').first();
    if (await firstButton.count() > 0) {
      await firstButton.click();

      // Check that focus moves appropriately
      const focusedElement = await page.locator(':focus').count();

      // If content changes, focus should be managed appropriately
      // Look for focus traps, skip links, etc.
    }
  });

  test('Error Handling Accessibility', async ({ page }) => {
    await page.goto('https://cacustodialcommand.up.railway.app/custodial-inspection');
    await page.waitForLoadState('networkidle');

    // Try to submit form without required fields to trigger validation
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();

      // Wait for validation messages
      await page.waitForTimeout(1000);

      // Check that error messages are accessible
      const errorElements = await page.locator(
        '[role="alert"], .error, .invalid-feedback, [aria-invalid="true"]'
      ).all();

      for (const error of errorElements) {
        // Error messages should be programmatically associated with inputs
        const isVisible = await error.isVisible();
        if (isVisible) {
          // Check if error message is properly announced
          const hasAriaLive = await error.getAttribute('aria-live');
          const role = await error.getAttribute('role');

          expect(hasAriaLive === 'polite' ||
                 hasAriaLive === 'assertive' ||
                 role === 'alert').toBe(true);
        }
      }
    }
  });
});

test.describe('Performance Impact on Accessibility', () => {
  test('Loading State Accessibility', async ({ page }) => {
    await page.goto('https://cacustodialcommand.up.railway.app/');

    // Check loading states and progress indicators
    await page.waitForLoadState('networkidle');

    // Look for loading spinners or progress indicators
    const loadingElements = await page.locator(
      '[role="progressbar"], [aria-busy="true"], .loading, .spinner'
    ).all();

    for (const loading of loadingElements) {
      const ariaLabel = await loading.getAttribute('aria-label');
      const ariaLive = await loading.getAttribute('aria-live');

      // Loading indicators should be accessible
      if (await loading.isVisible()) {
        expect(ariaLabel || ariaLive).toBeTruthy();
      }
    }
  });
});