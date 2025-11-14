/**
 * Quick Accessibility Audit for Custodial Command
 * Focused tests for key WCAG 2.1 AAA compliance areas
 */

import { test, expect } from '@playwright/test';

test.describe('Quick Accessibility Audit', () => {
  const APP_URL = 'https://cacustodialcommand.up.railway.app/';

  test('Touch Target Size Compliance', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Get all interactive elements
    const interactiveElements = await page.locator(`
      button, a[href], input[type="button"], input[type="submit"],
      [role="button"], [onclick], [role="link"], .btn
    `).all();

    console.log(`Checking ${interactiveElements.length} interactive elements...`);

    const violations = [];

    for (let i = 0; i < interactiveElements.length; i++) {
      const element = interactiveElements[i];
      const boundingBox = await element.boundingBox();

      if (boundingBox) {
        const { width, height } = boundingBox;

        // WCAG AAA requires 44x44px minimum touch targets
        if (width < 44 || height < 44) {
          violations.push({
            element: await element.evaluate(el => ({
              tagName: el.tagName,
              className: el.className,
              textContent: el.textContent?.substring(0, 50),
              id: el.id
            })),
            width: Math.round(width),
            height: Math.round(height)
          });
        }
      }
    }

    console.log(`\nTouch Target Analysis Results:`);
    console.log(`Total interactive elements: ${interactiveElements.length}`);
    console.log(`Violations: ${violations.length}`);

    if (violations.length > 0) {
      console.log('\nViolations:');
      violations.forEach(violation => {
        console.log(`- ${violation.element.tagName} (${violation.width}x${violation.height}px): ${violation.element.textContent}`);
      });
    }

    expect(violations.length, `Found ${violations.length} touch target violations`).toBe(0);
  });

  test('Keyboard Navigation', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Get all focusable elements
    const focusableElements = await page.locator(`
      a[href], button, input, select, textarea,
      [tabindex]:not([tabindex="-1"]),
      [contenteditable="true"]
    `).all();

    console.log(`Testing keyboard navigation for ${focusableElements.length} focusable elements...`);

    let focusedCount = 0;
    let visibleFocusCount = 0;

    // Test Tab navigation through first 10 elements
    const testCount = Math.min(10, focusableElements.length);
    for (let i = 0; i < testCount; i++) {
      await page.keyboard.press('Tab');

      const hasFocused = await page.locator(':focus').count();
      if (hasFocused > 0) {
        focusedCount++;

        // Check for visible focus indicator
        const focused = page.locator(':focus');
        const computedStyle = await focused.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            outline: style.outline,
            outlineOffset: style.outlineOffset,
            boxShadow: style.boxShadow,
            backgroundColor: style.backgroundColor
          };
        });

        const hasFocusIndicator =
          computedStyle.outline !== 'none' ||
          computedStyle.boxShadow !== 'none' ||
          computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';

        if (hasFocusIndicator) {
          visibleFocusCount++;
        }
      }
    }

    console.log(`Elements successfully focused: ${focusedCount}/${testCount}`);
    console.log(`Elements with visible focus: ${visibleFocusCount}/${testCount}`);

    expect(focusedCount, 'Keyboard navigation should work').toBeGreaterThan(0);
    expect(visibleFocusCount, 'Focus should be visible').toBeGreaterThan(0);
  });

  test('Page Structure and Headings', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    console.log(`Found ${headings.length} headings`);

    if (headings.length > 0) {
      // First heading should be h1
      const firstHeading = await headings[0].evaluate(el => el.tagName);
      console.log(`First heading: ${firstHeading}`);
      expect(firstHeading).toBe('H1');

      // Check heading order for first few headings
      for (let i = 1; i < Math.min(3, headings.length); i++) {
        const prevLevel = parseInt(await headings[i-1].evaluate(el => el.tagName.substring(1)));
        const currLevel = parseInt(await headings[i].evaluate(el => el.tagName.substring(1)));

        // Should not skip more than one level
        expect(currLevel - prevLevel).toBeLessThanOrEqual(1);
      }
    }

    // Check for main landmark
    const mainExists = await page.locator('main').count();
    const hasAriaMain = await page.locator('[role="main"]').count();
    console.log(`Main landmark: main element (${mainExists}), role=main (${hasAriaMain})`);
    expect(mainExists + hasAriaMain).toBeGreaterThan(0);
  });

  test('Form Accessibility Labels', async ({ page }) => {
    await page.goto(APP_URL + '/custodial-inspection');
    await page.waitForLoadState('networkidle');

    // Check form labels
    const formInputs = await page.locator('input, select, textarea').all();
    console.log(`Checking ${formInputs.length} form elements for labels...`);

    let properlyLabeled = 0;
    let violations = [];

    for (const input of formInputs) {
      // Skip hidden inputs
      const type = await input.getAttribute('type');
      if (type === 'hidden') continue;

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
        while (parent && parent !== document.body) {
          if (parent.tagName === 'LABEL') return true;
          parent = parent.parentElement;
        }

        return false;
      }, input);

      if (hasLabel) {
        properlyLabeled++;
      } else {
        violations.push({
          element: await input.evaluate(el => ({
            tagName: el.tagName,
            type: el.type,
            placeholder: el.placeholder,
            name: el.name
          }))
        });
      }
    }

    console.log(`Properly labeled form elements: ${properlyLabeled}/${formInputs.length}`);
    if (violations.length > 0) {
      console.log('Form label violations:', violations);
    }

    const nonHiddenInputs = formInputs.filter(async (input) => {
      const type = await input.getAttribute('type');
      return type !== 'hidden';
    });

    if (nonHiddenInputs.length > 0) {
      const labelingPercentage = (properlyLabeled / nonHiddenInputs.length) * 100;
      expect(labelingPercentage, `Form labeling should be at least 90%, got ${labelingPercentage.toFixed(1)}%`).toBeGreaterThanOrEqual(90);
    }
  });

  test('Image Alt Text', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    const images = await page.locator('img').all();
    console.log(`Checking ${images.length} images for alt text...`);

    let violations = 0;

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Images should have alt text unless decorative
      if (role !== 'presentation' && role !== 'none') {
        if (alt === null) {
          violations++;
        }
      }
    }

    console.log(`Images without alt text: ${violations}`);
    expect(violations, `Found ${violations} images without alt text`).toBe(0);
  });

  test('Color Contrast - Basic Check', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Get main text elements
    const textElements = await page.locator('h1, h2, h3, p, span, div').all();
    console.log(`Checking color contrast for ${textElements.length} text elements...`);

    let lowContrastElements = 0;

    for (let i = 0; i < Math.min(20, textElements.length); i++) {
      const element = textElements[i];
      const textContent = await element.textContent();

      if (textContent && textContent.trim().length > 0) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          const contrast = await page.evaluate((el) => {
            const style = window.getComputedStyle(el);
            const textColor = style.color;
            const backgroundColor = style.backgroundColor;

            // Simple check for very low contrast combinations
            if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
              return 'unknown'; // Cannot determine contrast without background
            }

            // Basic color comparison
            const isLightText = textColor.includes('255') || textColor.includes('white');
            const isLightBg = backgroundColor.includes('255') || backgroundColor.includes('white');
            const isDarkText = textColor.includes('0') || textColor.includes('black');
            const isDarkBg = backgroundColor.includes('0') || backgroundColor.includes('black');

            if ((isLightText && isLightBg) || (isDarkText && isDarkBg)) {
              return 'low';
            }

            return 'good';
          }, element);

          if (contrast === 'low') {
            lowContrastElements++;
          }
        }
      }
    }

    console.log(`Elements with potential color contrast issues: ${lowContrastElements}`);
    expect(lowContrastElements, `Found ${lowContrastElements} elements with low contrast`).toBeLessThan(3);
  });

  test('Mobile Viewport Accessibility', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Check that touch targets are still adequate on mobile
    const buttons = await page.locator('button, a[href]').all();
    console.log(`Checking ${buttons.length} buttons/links on mobile viewport...`);

    let mobileViolations = 0;

    for (const button of buttons) {
      const boundingBox = await button.boundingBox();
      if (boundingBox) {
        const { width, height } = boundingBox;
        if (width < 44 || height < 44) {
          mobileViolations++;
        }
      }
    }

    console.log(`Mobile touch target violations: ${mobileViolations}`);
    expect(mobileViolations, `Found ${mobileViolations} mobile touch target violations`).toBeLessThan(2);
  });
});