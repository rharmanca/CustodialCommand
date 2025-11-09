import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Create screenshots directory
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }

  const baseUrl = 'https://cacustodialcommand.up.railway.app';

  try {
    console.log('Capturing screenshots of Custodial Command application...');

    // Homepage
    console.log('Capturing homepage...');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: path.join(screenshotDir, '01-homepage-desktop.png'),
      fullPage: true
    });

    // Mobile view of homepage
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: path.join(screenshotDir, '01-homepage-mobile.png'),
      fullPage: true
    });

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Try to find and navigate to different sections
    const links = await page.$$eval('a', links =>
      links.map(link => ({ text: link.textContent.trim(), href: link.href }))
    );

    console.log('Found links:', links);

    // Try common navigation patterns
    const possibleRoutes = [
      '/inspection',
      '/single-area',
      '/whole-building',
      '/custodial-notes',
      '/data',
      '/reports',
      '/admin',
      '/criteria',
      '/dashboard'
    ];

    for (const route of possibleRoutes) {
      try {
        console.log(`Trying route: ${route}`);
        await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 10000 });

        // Check if page loaded successfully (not 404)
        const title = await page.title();
        const hasContent = await page.$('body') !== null;

        if (hasContent && !title.includes('404') && !title.includes('Not Found')) {
          const routeName = route.replace('/', '') || 'home';
          console.log(`✓ Capturing: ${routeName}`);
          await page.screenshot({
            path: path.join(screenshotDir, `02-${routeName}-desktop.png`),
            fullPage: true
          });

          // Mobile version
          await page.setViewportSize({ width: 375, height: 812 });
          await page.screenshot({
            path: path.join(screenshotDir, `02-${routeName}-mobile.png`),
            fullPage: true
          });
          await page.setViewportSize({ width: 1920, height: 1080 });
        } else {
          console.log(`✗ Route not found: ${route}`);
        }
      } catch (error) {
        console.log(`✗ Error accessing ${route}:`, error.message);
      }
    }

    // Try to find forms and interactive elements
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    // Look for buttons and try clicking them
    const buttons = await page.$$('button, .btn, [role="button"]');
    console.log(`Found ${buttons.length} buttons`);

    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      try {
        const button = buttons[i];
        const buttonText = await button.textContent();
        console.log(`Clicking button: ${buttonText}`);

        await button.click();
        await page.waitForTimeout(2000); // Wait for navigation

        const routeName = `button-${i}-${buttonText.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        await page.screenshot({
          path: path.join(screenshotDir, `03-${routeName}.png`),
          fullPage: true
        });

        // Go back
        await page.goBack();
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log(`Error with button ${i}:`, error.message);
      }
    }

    console.log('Screenshot capture completed!');

  } catch (error) {
    console.error('Error during screenshot capture:', error);
  } finally {
    await browser.close();
  }
}

captureScreenshots().catch(console.error);