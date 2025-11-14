/**
 * Touch Target Diagnostic Test
 *
 * Identifies specific elements with touch target violations
 * and provides detailed information for fixes
 */

const { chromium } = require('playwright');

const TEST_URL = process.env.TEST_BASE_URL || 'https://cacustodialcommand.up.railway.app';

async function runDiagnostic() {
  console.log('\n========================================');
  console.log('  TOUCH TARGET DIAGNOSTIC TEST');
  console.log('========================================');
  console.log(`📍 Testing URL: ${TEST_URL}`);
  console.log(`📏 Minimum Size: 44x44px (WCAG 2.1 AAA)`);
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 } // iPhone SE size
  });
  const page = await context.newPage();

  try {
    // Navigate to homepage
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Analyze touch targets
    const analysis = await page.evaluate(() => {
      const results = {
        violations: [],
        passing: [],
        summary: {
          total: 0,
          violations: 0,
          passing: 0
        }
      };

      // Get all interactive elements
      const selectors = [
        'button',
        'a',
        'input[type="button"]',
        'input[type="submit"]',
        'input[type="checkbox"]',
        'input[type="radio"]',
        '[role="button"]',
        '[role="link"]'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
          // Skip hidden elements
          if (!el.offsetParent && el.tagName !== 'A') return;

          const rect = el.getBoundingClientRect();
          const computed = window.getComputedStyle(el);

          // Get element identification
          const id = el.id;
          const className = el.className;
          const text = el.textContent?.trim().substring(0, 50) || '';
          const ariaLabel = el.getAttribute('aria-label') || '';

          const elementInfo = {
            selector: selector,
            index: index,
            id: id || '',
            className: className || '',
            text: text,
            ariaLabel: ariaLabel,
            dimensions: {
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            },
            computed: {
              minWidth: computed.minWidth,
              minHeight: computed.minHeight,
              padding: computed.padding,
              display: computed.display
            },
            position: {
              top: Math.round(rect.top),
              left: Math.round(rect.left)
            }
          };

          results.summary.total++;

          if (rect.width < 44 || rect.height < 44) {
            results.violations.push({
              ...elementInfo,
              issue: rect.width < 44 && rect.height < 44
                ? 'Both width and height too small'
                : rect.width < 44
                  ? 'Width too small'
                  : 'Height too small',
              recommended: {
                width: Math.max(44, Math.round(rect.width)),
                height: Math.max(44, Math.round(rect.height))
              }
            });
            results.summary.violations++;
          } else {
            results.passing.push(elementInfo);
            results.summary.passing++;
          }
        });
      });

      return results;
    });

    // Display results
    console.log('📊 SUMMARY');
    console.log('━'.repeat(50));
    console.log(`Total Interactive Elements: ${analysis.summary.total}`);
    console.log(`✅ Passing (≥44x44px): ${analysis.summary.passing}`);
    console.log(`❌ Violations (<44x44px): ${analysis.summary.violations}`);
    console.log(`📈 Compliance Rate: ${((analysis.summary.passing / analysis.summary.total) * 100).toFixed(1)}%\n`);

    if (analysis.violations.length > 0) {
      console.log('❌ VIOLATIONS FOUND');
      console.log('━'.repeat(50));

      analysis.violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.selector.toUpperCase()}`);
        console.log(`   Issue: ${violation.issue}`);
        console.log(`   Current Size: ${violation.dimensions.width}x${violation.dimensions.height}px`);
        console.log(`   Recommended: ${violation.recommended.width}x${violation.recommended.height}px`);

        if (violation.id) {
          console.log(`   ID: #${violation.id}`);
        }
        if (violation.className) {
          console.log(`   Class: .${violation.className.split(' ').join('.')}`);
        }
        if (violation.ariaLabel) {
          console.log(`   Aria-Label: "${violation.ariaLabel}"`);
        }
        if (violation.text) {
          console.log(`   Text: "${violation.text}"`);
        }
        console.log(`   Position: top=${violation.position.top}px, left=${violation.position.left}px`);
        console.log(`   Computed minWidth: ${violation.computed.minWidth}`);
        console.log(`   Computed minHeight: ${violation.computed.minHeight}`);
      });

      console.log('\n\n🔧 RECOMMENDED FIXES');
      console.log('━'.repeat(50));
      console.log('Add to src/styles/accessibility-aaa.css:\n');

      // Generate CSS fixes
      const uniqueSelectors = new Set();
      analysis.violations.forEach(violation => {
        if (violation.id) {
          uniqueSelectors.add(`#${violation.id}`);
        } else if (violation.className) {
          const classes = violation.className.split(' ').filter(c => c);
          if (classes.length > 0) {
            uniqueSelectors.add(`.${classes[0]}`);
          }
        }
      });

      if (uniqueSelectors.size > 0) {
        uniqueSelectors.forEach(selector => {
          console.log(`${selector} {`);
          console.log(`  min-width: 44px !important;`);
          console.log(`  min-height: 44px !important;`);
          console.log(`}\n`);
        });
      }
    } else {
      console.log('✅ NO VIOLATIONS FOUND');
      console.log('━'.repeat(50));
      console.log('All interactive elements meet the 44x44px minimum size requirement!\n');
    }

    // Sample passing elements
    if (analysis.passing.length > 0) {
      console.log('\n✅ PASSING ELEMENTS (Sample)');
      console.log('━'.repeat(50));
      analysis.passing.slice(0, 5).forEach((element, index) => {
        console.log(`${index + 1}. ${element.selector}: ${element.dimensions.width}x${element.dimensions.height}px`);
        if (element.text) {
          console.log(`   Text: "${element.text.substring(0, 40)}"`);
        }
      });
      if (analysis.passing.length > 5) {
        console.log(`   ... and ${analysis.passing.length - 5} more passing elements`);
      }
    }

    console.log('\n========================================');
    console.log('  DIAGNOSTIC COMPLETE');
    console.log('========================================\n');

    // Save detailed report
    const fs = require('fs');
    fs.writeFileSync(
      './tests/touch-target-diagnostic-report.json',
      JSON.stringify(analysis, null, 2)
    );
    console.log('📄 Detailed report saved: ./tests/touch-target-diagnostic-report.json\n');

  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

runDiagnostic()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
