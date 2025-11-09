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

async function performVisualAnalysis() {
  console.log('🎨 Starting comprehensive visual UI/UX analysis...');

  const browser = await chromium.launch({
    headless: false, // Set to true for headless mode
    slowMo: 100
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // Enable for better screenshot quality
    deviceScaleFactor: 2,
    // Capture console errors and warnings
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log(`Browser ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`Page error: ${error.message}`);
  });

  try {
    console.log('📱 Navigating to Custodial Command application...');
    await page.goto('http://localhost:4173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for the app to load
    await page.waitForTimeout(3000);

    console.log('📸 Capturing homepage screenshots...');

    // Desktop homepage
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage-desktop-full.png'),
      fullPage: true
    });

    await page.screenshot({
      path: path.join(screenshotDir, 'homepage-desktop-viewport.png'),
      fullPage: false
    });

    // Test responsive design
    console.log('📱 Testing responsive design...');

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage-tablet.png'),
      fullPage: true
    });

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotDir, 'homepage-mobile.png'),
      fullPage: true
    });

    // Analyze color scheme and design system
    console.log('🎨 Analyzing design system...');

    const designAnalysis = await page.evaluate(() => {
      const computedStyles = getComputedStyle(document.body);
      const rootStyles = getComputedStyle(document.documentElement);

      // Extract CSS custom properties (design tokens)
      const cssVariables = {};
      for (let i = 0; i < document.documentElement.style.length; i++) {
        const property = document.documentElement.style[i];
        if (property.startsWith('--')) {
          cssVariables[property] = getComputedStyle(document.documentElement).getPropertyValue(property);
        }
      }

      // Analyze main colors
      const mainColors = {
        background: rootStyles.getPropertyValue('--background') || computedStyles.backgroundColor,
        foreground: rootStyles.getPropertyValue('--foreground') || computedStyles.color,
        primary: rootStyles.getPropertyValue('--primary') || '#000000',
        secondary: rootStyles.getPropertyValue('--secondary') || '#666666',
        accent: rootStyles.getPropertyValue('--accent') || '#0066cc'
      };

      // Font analysis
      const fonts = {
        body: computedStyles.fontFamily,
        heading: computedStyles.fontFamily,
        sizes: {
          base: computedStyles.fontSize,
          heading: '16px' // Will be extracted from h1 elements
        }
      };

      // Component analysis
      const buttons = document.querySelectorAll('button');
      const forms = document.querySelectorAll('form');
      const inputs = document.querySelectorAll('input, textarea, select');

      return {
        colors: mainColors,
        cssVariables,
        fonts,
        componentCounts: {
          buttons: buttons.length,
          forms: forms.length,
          inputs: inputs.length
        },
        pageTitle: document.title,
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        hasThemeColor: !!document.querySelector('meta[name="theme-color"]'),
        hasViewportMeta: !!document.querySelector('meta[name="viewport"]')
      };
    });

    console.log('Design Analysis:', designAnalysis);

    // Navigation analysis
    console.log('🧭 Analyzing navigation structure...');

    const navAnalysis = await page.evaluate(() => {
      const navElements = document.querySelectorAll('nav, header nav, .nav, .navigation');
      const links = document.querySelectorAll('a[href]');
      const buttons = document.querySelectorAll('button');

      const navigationItems = [];
      links.forEach(link => {
        if (link.textContent.trim()) {
          navigationItems.push({
            text: link.textContent.trim(),
            href: link.href,
            type: 'link'
          });
        }
      });

      buttons.forEach(button => {
        if (button.textContent.trim()) {
          navigationItems.push({
            text: button.textContent.trim(),
            type: 'button',
            hasOnClick: !!button.onclick
          });
        }
      });

      return {
        navElementsCount: navElements.length,
        navigationItems,
        hasMainNav: navElements.length > 0
      };
    });

    console.log('Navigation Analysis:', navAnalysis);

    // Accessibility analysis
    console.log('♿ Analyzing accessibility features...');

    const accessibilityAnalysis = await page.evaluate(() => {
      const hasSkipLinks = !!document.querySelector('a[href^="#"]');
      const hasAltText = Array.from(document.querySelectorAll('img')).every(img => img.alt || img.role === 'presentation');
      const hasAriaLabels = document.querySelectorAll('[aria-label], [aria-labelledby]').length;
      const hasSemanticHTML = document.querySelectorAll('main, header, nav, section, article, aside, footer').length;
      const hasFocusManagement = document.querySelectorAll(':focus').length > 0;

      // Check color contrast (simplified)
      const bodyStyles = getComputedStyle(document.body);
      const backgroundColor = bodyStyles.backgroundColor;
      const textColor = bodyStyles.color;

      return {
        hasSkipLinks,
        hasAltText,
        ariaLabelsCount: hasAriaLabels,
        semanticElementsCount: hasSemanticHTML,
        hasFocusManagement,
        colors: {
          background: backgroundColor,
          text: textColor
        }
      };
    });

    console.log('Accessibility Analysis:', accessibilityAnalysis);

    // Try to interact with different elements
    console.log('🖱️ Testing interactive elements...');

    const interactiveElements = await page.$$('button, a[href], input, select, textarea');
    console.log(`Found ${interactiveElements.length} interactive elements`);

    // Hover states
    const buttons = await page.$$('button');
    for (let i = 0; i < Math.min(buttons.length, 3); i++) {
      await buttons[i].hover();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotDir, `button-hover-${i + 1}.png`)
      });
    }

    // Form analysis (if forms exist)
    const forms = await page.$$('form');
    if (forms.length > 0) {
      console.log(`📋 Found ${forms.length} forms, analyzing...`);

      for (let i = 0; i < forms.length; i++) {
        const form = forms[i];
        await form.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        // Capture form screenshot
        await page.screenshot({
          path: path.join(screenshotDir, `form-${i + 1}.png`)
        });

        // Analyze form fields
        const formFields = await form.$$('input, textarea, select');
        console.log(`Form ${i + 1} has ${formFields.length} fields`);
      }
    }

    // PWA features analysis
    console.log('📱 Analyzing PWA features...');

    const pwaAnalysis = await page.evaluate(() => {
      return {
        hasServiceWorker: 'serviceWorker' in navigator,
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        hasThemeColor: !!document.querySelector('meta[name="theme-color"]'),
        hasAppleMeta: !!document.querySelector('meta[name="apple-mobile-web-app-capable"]'),
        hasViewportMeta: !!document.querySelector('meta[name="viewport"]'),
        isInstallable: 'beforeinstallprompt' in window
      };
    });

    console.log('PWA Analysis:', pwaAnalysis);

    // Performance metrics
    console.log('⚡ Collecting performance metrics...');

    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');

      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });

    console.log('Performance Metrics:', performanceMetrics);

    // Create comprehensive analysis report
    const analysisReport = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:4173',
      designSystem: designAnalysis,
      navigation: navAnalysis,
      accessibility: accessibilityAnalysis,
      pwa: pwaAnalysis,
      performance: performanceMetrics,
      screenshots: {
        desktopFull: 'homepage-desktop-full.png',
        desktopViewport: 'homepage-desktop-viewport.png',
        tablet: 'homepage-tablet.png',
        mobile: 'homepage-mobile.png'
      }
    };

    // Save analysis report
    const reportPath = path.join(__dirname, 'visual-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(analysisReport, null, 2));

    console.log('📊 Analysis complete! Report saved to:', reportPath);
    console.log('📸 Screenshots saved to:', screenshotDir);

  } catch (error) {
    console.error('❌ Error during analysis:', error);

    // Try to capture error state
    try {
      await page.screenshot({
        path: path.join(screenshotDir, 'error-state.png')
      });
      console.log('📸 Error state screenshot captured');
    } catch (screenshotError) {
      console.error('Could not capture error screenshot:', screenshotError);
    }
  } finally {
    await browser.close();
  }
}

// Run the analysis
performVisualAnalysis().catch(console.error);