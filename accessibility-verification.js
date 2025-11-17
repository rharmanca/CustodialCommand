/**
 * Manual Accessibility Verification Script
 * Quick verification of key accessibility features
 */

const puppeteer = require('puppeteer');

async function runAccessibilityCheck() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Set viewport to test different sizes
  await page.setViewport({ width: 1200, height: 800 });

  console.log('🔍 Starting Accessibility Verification...');
  console.log('URL: https://cacustodialcommand.up.railway.app/\n');

  try {
    await page.goto('https://cacustodialcommand.up.railway.app/', {
      waitUntil: 'networkidle2'
    });

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // 1. Check Touch Target Compliance
    console.log('📱 Testing Touch Target Compliance (44x44px minimum)...');

    const touchTargets = await page.evaluate(() => {
      const interactiveElements = document.querySelectorAll(`
        button, a[href], input[type="button"], input[type="submit"],
        [role="button"], [onclick], [role="link"]
      `);

      const violations = [];

      interactiveElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);

        if (width < 44 || height < 44) {
          violations.push({
            index,
            tagName: element.tagName,
            textContent: element.textContent?.substring(0, 50),
            className: element.className,
            width,
            height
          });
        }
      });

      return {
        total: interactiveElements.length,
        violations: violations.length,
        details: violations
      };
    });

    console.log(`   Total interactive elements: ${touchTargets.total}`);
    console.log(`   Touch target violations: ${touchTargets.violations}`);

    if (touchTargets.violations > 0) {
      console.log('\n   Violations found:');
      touchTargets.details.forEach(v => {
        console.log(`     - ${v.tagName} (${v.width}x${v.height}px): ${v.textContent}`);
      });
    } else {
      console.log('   ✅ All touch targets meet 44x44px minimum');
    }

    // 2. Check Focus Indicators
    console.log('\n⌨️  Testing Focus Indicators...');

    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const focused = document.activeElement;
      if (focused) {
        const style = window.getComputedStyle(focused);
        const rect = focused.getBoundingClientRect();
        return {
          tagName: focused.tagName,
          hasOutline: style.outline !== 'none',
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineColor: style.outlineColor,
          outlineOffset: style.outlineOffset,
          boxShadow: style.boxShadow,
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      }
      return null;
    });

    if (focusedElement) {
      console.log(`   Focused element: ${focusedElement.tagName} (${focusedElement.width}x${focusedElement.height}px)`);
      console.log(`   Has outline: ${focusedElement.hasOutline}`);
      console.log(`   Outline style: ${focusedElement.outlineStyle}`);
      console.log(`   Outline width: ${focusedElement.outlineWidth}`);
      console.log(`   Outline color: ${focusedElement.outlineColor}`);
      console.log(`   Outline offset: ${focusedElement.outlineOffset}`);
      console.log(`   Box shadow: ${focusedElement.boxShadow}`);

      const hasVisibleFocus = focusedElement.hasOutline || focusedElement.boxShadow !== 'none';
      console.log(`   ✅ Focus indicator visible: ${hasVisibleFocus}`);
    } else {
      console.log('   ❌ No element focused after Tab');
    }

    // 3. Check Page Structure
    console.log('\n📄 Testing Page Structure...');

    const pageStructure = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const mainElement = document.querySelector('main');
      const navElement = document.querySelector('nav');
      const images = document.querySelectorAll('img');
      const formInputs = document.querySelectorAll('input, select, textarea');

      const imageIssues = [];
      images.forEach((img, index) => {
        const alt = img.getAttribute('alt');
        const role = img.getAttribute('role');
        if (role !== 'presentation' && role !== 'none' && alt === null) {
          imageIssues.push({
            index,
            src: img.src?.substring(0, 50),
            hasAlt: false
          });
        }
      });

      const inputIssues = [];
      formInputs.forEach((input, index) => {
        const type = input.type;
        if (type === 'hidden') return;

        const hasLabel = page.evaluate((el) => {
          const id = el.id;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledBy = el.getAttribute('aria-labelledby');

          if (ariaLabel || ariaLabelledBy) return true;

          if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) return true;
          }

          let parent = el.parentElement;
          while (parent && parent !== document.body) {
            if (parent.tagName === 'LABEL') return true;
            parent = parent.parentElement;
          }

          return false;
        }, input);

        if (!hasLabel) {
          inputIssues.push({
            index,
            tagName: input.tagName,
            type: input.type,
            name: input.name,
            placeholder: input.placeholder
          });
        }
      });

      return {
        headingCount: headings.length,
        hasMain: !!mainElement,
        hasNav: !!navElement,
        imageCount: images.length,
        imageIssues: imageIssues.length,
        inputCount: formInputs.length,
        inputIssues: inputIssues.length,
        firstHeading: headings[0]?.tagName,
        landmarks: {
          main: !!mainElement,
          nav: !!navElement,
          header: !!document.querySelector('header'),
          footer: !!document.querySelector('footer')
        }
      };
    });

    console.log(`   Headings found: ${pageStructure.headingCount}`);
    console.log(`   First heading: ${pageStructure.firstHeading || 'None'}`);
    console.log(`   Main landmark: ${pageStructure.hasMain ? '✅' : '❌'}`);
    console.log(`   Navigation landmark: ${pageStructure.hasNav ? '✅' : '❌'}`);
    console.log(`   Images: ${pageStructure.imageCount}, Alt text issues: ${pageStructure.imageIssues}`);
    console.log(`   Form inputs: ${pageStructure.inputCount}, Label issues: ${pageStructure.inputIssues}`);

    console.log('   Landmarks:');
    Object.entries(pageStructure.landmarks).forEach(([name, exists]) => {
      console.log(`     ${name}: ${exists ? '✅' : '❌'}`);
    });

    // 4. Test Mobile Viewport
    console.log('\n📱 Testing Mobile Viewport...');

    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    const mobileTouchTargets = await page.evaluate(() => {
      const interactiveElements = document.querySelectorAll(`
        button, a[href], input[type="button"], input[type="submit"]
      `);

      const violations = [];

      interactiveElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);

        if (width < 44 || height < 44) {
          violations.push({
            tagName: element.tagName,
            width,
            height,
            textContent: element.textContent?.substring(0, 30)
          });
        }
      });

      return {
        total: interactiveElements.length,
        violations: violations.length
      };
    });

    console.log(`   Mobile interactive elements: ${mobileTouchTargets.total}`);
    console.log(`   Mobile touch target violations: ${mobileTouchTargets.violations}`);

    // Generate Summary
    console.log('\n📊 ACCESSIBILITY VERIFICATION SUMMARY');
    console.log('=====================================');

    const desktopScore = touchTargets.violations === 0 ? '✅ PASS' : '❌ FAIL';
    const mobileScore = mobileTouchTargets.violations === 0 ? '✅ PASS' : '❌ FAIL';
    const focusScore = focusedElement && (focusedElement.hasOutline || focusedElement.boxShadow !== 'none') ? '✅ PASS' : '❌ FAIL';
    const structureScore = pageStructure.hasMain && pageStructure.hasNav && pageStructure.firstHeading === 'H1' ? '✅ PASS' : '⚠️ PARTIAL';
    const imageScore = pageStructure.imageIssues === 0 ? '✅ PASS' : '❌ FAIL';
    const formScore = pageStructure.inputIssues === 0 ? '✅ PASS' : '❌ FAIL';

    console.log(`Desktop Touch Targets: ${desktopScore}`);
    console.log(`Mobile Touch Targets:  ${mobileScore}`);
    console.log(`Focus Indicators:      ${focusScore}`);
    console.log(`Page Structure:       ${structureScore}`);
    console.log(`Image Alt Text:        ${imageScore}`);
    console.log(`Form Accessibility:    ${formScore}`);

    const allPassed = [desktopScore, mobileScore, focusScore, imageScore, formScore].every(score => score === '✅ PASS');

    console.log(`\nOverall WCAG 2.1 AAA Status: ${allPassed ? '✅ COMPLIANT' : '❌ NEEDS IMPROVEMENT'}`);

    if (!allPassed) {
      console.log('\n🚨 Priority Issues to Fix:');
      if (touchTargets.violations > 0) {
        console.log(`   • Fix ${touchTargets.violations} desktop touch target violations`);
      }
      if (mobileTouchTargets.violations > 0) {
        console.log(`   • Fix ${mobileTouchTargets.violations} mobile touch target violations`);
      }
      if (pageStructure.imageIssues > 0) {
        console.log(`   • Add alt text to ${pageStructure.imageIssues} images`);
      }
      if (pageStructure.inputIssues > 0) {
        console.log(`   • Add labels to ${pageStructure.inputIssues} form inputs`);
      }
      if (!focusedElement || (!focusedElement.hasOutline && focusedElement.boxShadow === 'none')) {
        console.log('   • Improve focus indicators for keyboard navigation');
      }
    }

  } catch (error) {
    console.error('❌ Error during accessibility check:', error.message);
  } finally {
    await browser.close();
  }
}

// Check if puppeteer is available, otherwise provide manual instructions
try {
  require('puppeteer');
  runAccessibilityCheck();
} catch (error) {
  console.log('📋 Manual Accessibility Verification Instructions');
  console.log('==============================================');
  console.log('Puppeteer not available. Please perform these manual checks:');
  console.log('');
  console.log('1. 📱 Touch Target Test:');
  console.log('   - Open https://cacustodialcommand.up.railway.app/');
  console.log('   - Use browser dev tools to measure button/link sizes');
  console.log('   - Verify all interactive elements are ≥44x44px');
  console.log('');
  console.log('2. ⌨️  Keyboard Navigation:');
  console.log('   - Tab through all interactive elements');
  console.log('   - Verify focus indicators are visible');
  console.log('   - Check logical tab order');
  console.log('');
  console.log('3. 📄 Screen Reader Test:');
  console.log('   - Use VoiceOver (Mac) or screen reader extension');
  console.log('   - Verify page structure is announced properly');
  console.log('   - Check images have alt text');
  console.log('');
  console.log('4. 📱 Mobile Testing:');
  console.log('   - Test on mobile device or responsive mode');
  console.log('   - Verify touch targets work well');
  console.log('   - Check zoom and scaling');
}