import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create screenshots directory if it doesn't exist
const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function analyzeAllPages() {
  console.log('🎨 Starting comprehensive page-by-page analysis...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log(`Browser ${msg.type()}: ${msg.text()}`);
  });

  const pages = [
    {
      name: 'homepage',
      url: 'http://localhost:4173/',
      description: 'Main landing page'
    },
    {
      name: 'custodial-inspection',
      url: 'http://localhost:4173/custodial-inspection',
      description: 'Single room inspection form'
    },
    {
      name: 'whole-building-inspection',
      url: 'http://localhost:4173/whole-building-inspection',
      description: 'Building inspection workflow'
    },
    {
      name: 'inspection-data',
      url: 'http://localhost:4173/inspection-data',
      description: 'Data and reports dashboard'
    },
    {
      name: 'admin-inspections',
      url: 'http://localhost:4173/admin-inspections',
      description: 'Admin inspection panel'
    }
  ];

  const analysisResults = {
    timestamp: new Date().toISOString(),
    pages: [],
    crossPageAnalysis: {}
  };

  for (const pageInfo of pages) {
    console.log(`\n📱 Analyzing: ${pageInfo.name} - ${pageInfo.description}`);

    try {
      await page.goto(pageInfo.url, {
        waitUntil: 'networkidle',
        timeout: 15000
      });

      // Wait for content to load
      await page.waitForTimeout(2000);

      const pageAnalysis = {
        name: pageInfo.name,
        url: pageInfo.url,
        description: pageInfo.description,
        screenshots: [],
        contentAnalysis: {},
        formAnalysis: null,
        accessibility: {},
        performance: {}
      };

      // Capture desktop screenshots
      await page.screenshot({
        path: path.join(screenshotDir, `${pageInfo.name}-desktop-full.png`),
        fullPage: true
      });

      await page.screenshot({
        path: path.join(screenshotDir, `${pageInfo.name}-desktop-viewport.png`),
        fullPage: false
      });

      // Test responsive design
      const viewports = [
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile-large', width: 414, height: 896 },
        { name: 'mobile-small', width: 375, height: 667 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: path.join(screenshotDir, `${pageInfo.name}-${viewport.name}.png`),
          fullPage: true
        });
      }

      // Reset to desktop for content analysis
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      // Content analysis
      pageAnalysis.contentAnalysis = await page.evaluate(() => {
        const title = document.title;
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => ({ tag: h.tagName, text: h.textContent.trim() }));

        const buttons = Array.from(document.querySelectorAll('button'))
          .map(b => ({ text: b.textContent.trim(), disabled: b.disabled }));

        const links = Array.from(document.querySelectorAll('a[href]'))
          .map(a => ({ text: a.textContent.trim(), href: a.href }));

        const images = Array.from(document.querySelectorAll('img'))
          .map(img => ({ src: img.src, alt: img.alt, width: img.width, height: img.height }));

        const mainContent = document.querySelector('main') || document.querySelector('#main-content');
        const hasMainContent = !!mainContent;

        return {
          title,
          headings,
          buttonsCount: buttons.length,
          linksCount: links.length,
          imagesCount: images.length,
          hasMainContent,
          buttons: buttons.slice(0, 10), // Limit to first 10 for brevity
          images
        };
      });

      // Form analysis
      const forms = await page.$$('form');
      if (forms.length > 0) {
        console.log(`  📋 Found ${forms.length} forms on ${pageInfo.name}`);

        pageAnalysis.formAnalysis = await page.evaluate(() => {
          const forms = Array.from(document.querySelectorAll('form'));
          return forms.map((form, index) => {
            const inputs = form.querySelectorAll('input, textarea, select');
            const buttons = form.querySelectorAll('button[type="submit"], input[type="submit"]');

            return {
              index,
              inputCount: inputs.length,
              submitButtons: buttons.length,
              hasValidation: form.noValidate === false,
              inputTypes: Array.from(inputs).map(input => input.type || input.tagName.toLowerCase())
            };
          });
        });

        // Capture form screenshots
        for (let i = 0; i < Math.min(forms.length, 3); i++) {
          await forms[i].scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          await page.screenshot({
            path: path.join(screenshotDir, `${pageInfo.name}-form-${i + 1}.png`)
          });
        }
      }

      // Accessibility analysis for this page
      pageAnalysis.accessibility = await page.evaluate(() => {
        const hasSkipLinks = document.querySelectorAll('a[href^="#"]').length > 0;
        const images = document.querySelectorAll('img');
        const hasAltText = Array.from(images).every(img => img.alt || img.role === 'presentation' || img.width === 0);
        const hasAriaLabels = document.querySelectorAll('[aria-label], [aria-labelledby]').length;
        const hasSemanticHTML = document.querySelectorAll('main, header, nav, section, article, aside, footer').length;
        const hasFocusableElements = document.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])').length;

        // Check heading hierarchy
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const hasProperHeadingStructure = headings.length > 0 &&
          (!headings.some(h => h.tagName === 'H1') || headings.filter(h => h.tagName === 'H1').length === 1);

        return {
          hasSkipLinks,
          hasAltText,
          ariaLabelsCount: hasAriaLabels,
          semanticElementsCount: hasSemanticHTML,
          focusableElementsCount: hasFocusableElements,
          hasProperHeadingStructure,
          headingsCount: headings.length
        };
      });

      // Performance metrics
      pageAnalysis.performance = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        return {
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };
      });

      // Test keyboard navigation
      try {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(500);
        const focusedElement = await page.evaluate(() => {
          const active = document.activeElement;
          return active ? active.tagName + (active.textContent ? ': ' + active.textContent.substring(0, 20) : '') : 'none';
        });
        pageAnalysis.accessibility.keyboardNavigationTest = focusedElement;
      } catch (error) {
        pageAnalysis.accessibility.keyboardNavigationTest = 'failed';
      }

      analysisResults.pages.push(pageAnalysis);
      console.log(`  ✅ Analysis complete for ${pageInfo.name}`);

    } catch (error) {
      console.error(`  ❌ Error analyzing ${pageInfo.name}:`, error.message);

      // Try to capture error state
      try {
        await page.screenshot({
          path: path.join(screenshotDir, `${pageInfo.name}-error-state.png`)
        });
      } catch (screenshotError) {
        console.error('Could not capture error screenshot');
      }

      analysisResults.pages.push({
        name: pageInfo.name,
        url: pageInfo.url,
        error: error.message,
        screenshots: [`${pageInfo.name}-error-state.png`]
      });
    }
  }

  // Cross-page analysis
  console.log('\n📊 Performing cross-page analysis...');

  analysisResults.crossPageAnalysis = {
    totalPages: analysisResults.pages.length,
    accessiblePages: analysisResults.pages.filter(p => p.accessibility?.hasAltText).length,
    pagesWithForms: analysisResults.pages.filter(p => p.formAnalysis && p.formAnalysis.length > 0).length,
    pagesWithSemanticHTML: analysisResults.pages.filter(p => p.accessibility?.semanticElementsCount > 0).length,
    averageLoadTime: analysisResults.pages
      .filter(p => p.performance?.loadTime)
      .reduce((sum, p) => sum + p.performance.loadTime, 0) / analysisResults.pages.filter(p => p.performance?.loadTime).length
  };

  // Save comprehensive analysis
  const reportPath = path.join(__dirname, 'comprehensive-page-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(analysisResults, null, 2));

  console.log('\n📊 Comprehensive analysis complete!');
  console.log('📸 Screenshots saved to:', screenshotDir);
  console.log('📄 Report saved to:', reportPath);

  await browser.close();
}

// Run the comprehensive analysis
analyzeAllPages().catch(console.error);