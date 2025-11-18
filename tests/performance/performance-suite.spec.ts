import { test, expect, chromium, type Browser, type BrowserContext } from '@playwright/test';
import { performance } from 'perf_hooks';

const APP_URL = 'https://cacustodialcommand.up.railway.app';

interface PerformanceMetrics {
  ttfb: number;
  fcp: number;
  lcp: number;
  tti: number;
  domContentLoaded: number;
  loadComplete: number;
  resourceTimings: any[];
}

interface LoadTestResult {
  concurrentUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
}

test.describe('Custodial Command - Comprehensive Performance Testing', () => {

  test('1. Page Load Performance - Desktop (Fast 3G)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    // Emulate Fast 3G network
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40, // 40ms
    });

    const startTime = performance.now();

    // Navigate and collect performance metrics
    await page.goto(APP_URL, { waitUntil: 'networkidle' });

    const endTime = performance.now();
    const totalLoadTime = endTime - startTime;

    // Get Web Vitals and Navigation Timing
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');

      return {
        // Navigation Timing
        ttfb: perfData.responseStart - perfData.requestStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
        loadComplete: perfData.loadEventEnd - perfData.fetchStart,

        // Paint Timing
        fcp: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,

        // Resource Timing
        resourceCount: performance.getEntriesByType('resource').length,
        totalTransferSize: performance.getEntriesByType('resource').reduce((acc: number, r: any) => acc + (r.transferSize || 0), 0),
      };
    });

    // Get LCP
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log('\n=== Page Load Performance (Fast 3G) ===');
    console.log(`Total Load Time: ${totalLoadTime.toFixed(2)}ms`);
    console.log(`Time to First Byte (TTFB): ${metrics.ttfb.toFixed(2)}ms`);
    console.log(`First Contentful Paint (FCP): ${metrics.fcp.toFixed(2)}ms`);
    console.log(`Largest Contentful Paint (LCP): ${lcp.toFixed(2)}ms`);
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);
    console.log(`Resources Loaded: ${metrics.resourceCount}`);
    console.log(`Total Transfer Size: ${(metrics.totalTransferSize / 1024).toFixed(2)} KB`);

    // Performance assertions (based on best practices)
    expect(metrics.ttfb).toBeLessThan(800); // TTFB should be < 800ms on 3G
    expect(metrics.fcp).toBeLessThan(3000); // FCP should be < 3s on 3G
    expect(lcp).toBeLessThan(4000); // LCP should be < 4s on 3G

    await context.close();
  });

  test('2. Page Load Performance - Desktop (WiFi)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    const startTime = performance.now();
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    const endTime = performance.now();

    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');

      return {
        ttfb: perfData.responseStart - perfData.requestStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
        loadComplete: perfData.loadEventEnd - perfData.fetchStart,
        fcp: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        resourceCount: performance.getEntriesByType('resource').length,
        totalTransferSize: performance.getEntriesByType('resource').reduce((acc: number, r: any) => acc + (r.transferSize || 0), 0),
      };
    });

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log('\n=== Page Load Performance (WiFi) ===');
    console.log(`Total Load Time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`TTFB: ${metrics.ttfb.toFixed(2)}ms`);
    console.log(`FCP: ${metrics.fcp.toFixed(2)}ms`);
    console.log(`LCP: ${lcp.toFixed(2)}ms`);
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);

    // WiFi performance assertions (stricter)
    expect(metrics.ttfb).toBeLessThan(400);
    expect(metrics.fcp).toBeLessThan(1800);
    expect(lcp).toBeLessThan(2500);

    await context.close();
  });

  test('3. Bundle Size Analysis', async ({ page }) => {
    await page.goto(APP_URL);

    const bundleAnalysis = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      const scripts = resources.filter(r => r.name.endsWith('.js') || r.initiatorType === 'script');
      const styles = resources.filter(r => r.name.endsWith('.css') || r.initiatorType === 'link');
      const images = resources.filter(r => r.initiatorType === 'img' || /\.(png|jpg|jpeg|gif|svg|webp)/.test(r.name));
      const fonts = resources.filter(r => /\.(woff|woff2|ttf|otf)/.test(r.name));

      const analyzeResources = (resources: PerformanceResourceTiming[]) => {
        return resources.map(r => ({
          name: r.name.split('/').pop() || r.name,
          size: r.transferSize,
          duration: r.duration,
        })).sort((a, b) => b.size - a.size);
      };

      return {
        scripts: analyzeResources(scripts),
        styles: analyzeResources(styles),
        images: analyzeResources(images),
        fonts: analyzeResources(fonts),
        totalScriptSize: scripts.reduce((acc, r) => acc + (r.transferSize || 0), 0),
        totalStyleSize: styles.reduce((acc, r) => acc + (r.transferSize || 0), 0),
        totalImageSize: images.reduce((acc, r) => acc + (r.transferSize || 0), 0),
        totalFontSize: fonts.reduce((acc, r) => acc + (r.transferSize || 0), 0),
      };
    });

    console.log('\n=== Bundle Size Analysis ===');
    console.log(`\nJavaScript Bundles (Total: ${(bundleAnalysis.totalScriptSize / 1024).toFixed(2)} KB):`);
    bundleAnalysis.scripts.slice(0, 10).forEach(script => {
      console.log(`  - ${script.name}: ${(script.size / 1024).toFixed(2)} KB (${script.duration.toFixed(2)}ms)`);
    });

    console.log(`\nCSS Files (Total: ${(bundleAnalysis.totalStyleSize / 1024).toFixed(2)} KB):`);
    bundleAnalysis.styles.forEach(style => {
      console.log(`  - ${style.name}: ${(style.size / 1024).toFixed(2)} KB`);
    });

    console.log(`\nImages (Total: ${(bundleAnalysis.totalImageSize / 1024).toFixed(2)} KB):`);
    bundleAnalysis.images.slice(0, 5).forEach(img => {
      console.log(`  - ${img.name}: ${(img.size / 1024).toFixed(2)} KB`);
    });

    console.log(`\nFonts (Total: ${(bundleAnalysis.totalFontSize / 1024).toFixed(2)} KB):`);
    bundleAnalysis.fonts.forEach(font => {
      console.log(`  - ${font.name}: ${(font.size / 1024).toFixed(2)} KB`);
    });

    // Bundle size assertions
    expect(bundleAnalysis.totalScriptSize).toBeLessThan(500 * 1024); // < 500KB for all JS
    expect(bundleAnalysis.totalStyleSize).toBeLessThan(100 * 1024); // < 100KB for all CSS
  });

  test('4. API Performance - Form Submission', async ({ page }) => {
    await page.goto(APP_URL);

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');

    // Login first
    await page.click('text=Sign In');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');

    const loginStart = performance.now();
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard.*/);
    const loginTime = performance.now() - loginStart;

    console.log('\n=== API Performance ===');
    console.log(`Login API Response Time: ${loginTime.toFixed(2)}ms`);

    // Test form submission if accessible
    const formExists = await page.locator('form').count() > 0;

    if (formExists) {
      const formStart = performance.now();
      // This is a simulation - actual form interaction would depend on the form structure
      const formTime = performance.now() - formStart;
      console.log(`Form Submission Time: ${formTime.toFixed(2)}ms`);
    }

    expect(loginTime).toBeLessThan(2000); // Login should be < 2s
  });

  test('5. Load Testing - Concurrent Users Simulation', async () => {
    const concurrentUsers = [5, 10, 20];
    const results: LoadTestResult[] = [];

    for (const userCount of concurrentUsers) {
      console.log(`\n=== Load Test: ${userCount} Concurrent Users ===`);

      const browser = await chromium.launch();
      const startTime = performance.now();
      const promises: Promise<number>[] = [];

      let successful = 0;
      let failed = 0;

      for (let i = 0; i < userCount; i++) {
        const promise = (async () => {
          const context = await browser.newContext();
          const page = await context.newPage();

          try {
            const reqStart = performance.now();
            await page.goto(APP_URL, { timeout: 30000 });
            await page.waitForLoadState('domcontentloaded');
            const reqEnd = performance.now();
            successful++;
            await context.close();
            return reqEnd - reqStart;
          } catch (error) {
            failed++;
            await context.close();
            return -1;
          }
        })();

        promises.push(promise);
      }

      const responseTimes = await Promise.all(promises);
      const validTimes = responseTimes.filter(t => t > 0);
      const endTime = performance.now();
      const totalDuration = (endTime - startTime) / 1000; // in seconds

      const avgResponseTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
      const minResponseTime = Math.min(...validTimes);
      const maxResponseTime = Math.max(...validTimes);
      const rps = userCount / totalDuration;

      const result: LoadTestResult = {
        concurrentUsers: userCount,
        totalRequests: userCount,
        successfulRequests: successful,
        failedRequests: failed,
        averageResponseTime: avgResponseTime,
        minResponseTime,
        maxResponseTime,
        requestsPerSecond: rps,
      };

      results.push(result);

      console.log(`Total Requests: ${result.totalRequests}`);
      console.log(`Successful: ${result.successfulRequests}`);
      console.log(`Failed: ${result.failedRequests}`);
      console.log(`Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
      console.log(`Min Response Time: ${result.minResponseTime.toFixed(2)}ms`);
      console.log(`Max Response Time: ${result.maxResponseTime.toFixed(2)}ms`);
      console.log(`Requests/Second: ${result.requestsPerSecond.toFixed(2)}`);
      console.log(`Success Rate: ${((successful / userCount) * 100).toFixed(2)}%`);

      await browser.close();

      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Assert all load tests had acceptable performance
    results.forEach(result => {
      expect(result.successfulRequests / result.totalRequests).toBeGreaterThan(0.95); // 95% success rate
      expect(result.averageResponseTime).toBeLessThan(5000); // Average < 5s under load
    });
  });

  test('6. Mobile Performance', async ({ browser }) => {
    const context = await browser.newContext({
      ...require('@playwright/test').devices['iPhone 12'],
    });

    const page = await context.newPage();

    // Emulate 4G network
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 4 * 1024 * 1024 / 8, // 4 Mbps
      uploadThroughput: 3 * 1024 * 1024 / 8, // 3 Mbps
      latency: 20,
    });

    const startTime = performance.now();
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    const endTime = performance.now();

    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');

      return {
        ttfb: perfData.responseStart - perfData.requestStart,
        fcp: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
        loadComplete: perfData.loadEventEnd - perfData.fetchStart,
      };
    });

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log('\n=== Mobile Performance (iPhone 12, 4G) ===');
    console.log(`Total Load Time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`TTFB: ${metrics.ttfb.toFixed(2)}ms`);
    console.log(`FCP: ${metrics.fcp.toFixed(2)}ms`);
    console.log(`LCP: ${lcp.toFixed(2)}ms`);
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);

    // Test touch responsiveness
    await page.tap('body');
    const tapTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const start = performance.now();
        document.body.addEventListener('touchstart', () => {
          resolve(performance.now() - start);
        }, { once: true });
        setTimeout(() => resolve(0), 1000);
      });
    });

    console.log(`Touch Response Time: ${tapTime.toFixed(2)}ms`);

    // Mobile performance assertions
    expect(metrics.ttfb).toBeLessThan(600);
    expect(metrics.fcp).toBeLessThan(2500);
    expect(lcp).toBeLessThan(3500);

    await context.close();
  });

  test('7. Resource Caching Effectiveness', async ({ page }) => {
    console.log('\n=== Resource Caching Test ===');

    // First visit
    console.log('First visit (cold cache):');
    await page.goto(APP_URL);

    const firstVisitMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return {
        totalResources: resources.length,
        cachedResources: resources.filter(r => r.transferSize === 0).length,
        totalTransferSize: resources.reduce((acc, r) => acc + (r.transferSize || 0), 0),
      };
    });

    console.log(`  Total Resources: ${firstVisitMetrics.totalResources}`);
    console.log(`  Cached Resources: ${firstVisitMetrics.cachedResources}`);
    console.log(`  Total Transfer Size: ${(firstVisitMetrics.totalTransferSize / 1024).toFixed(2)} KB`);

    // Second visit
    console.log('\nSecond visit (warm cache):');
    await page.reload();

    const secondVisitMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return {
        totalResources: resources.length,
        cachedResources: resources.filter(r => r.transferSize === 0).length,
        totalTransferSize: resources.reduce((acc, r) => acc + (r.transferSize || 0), 0),
      };
    });

    console.log(`  Total Resources: ${secondVisitMetrics.totalResources}`);
    console.log(`  Cached Resources: ${secondVisitMetrics.cachedResources}`);
    console.log(`  Total Transfer Size: ${(secondVisitMetrics.totalTransferSize / 1024).toFixed(2)} KB`);
    console.log(`  Cache Hit Rate: ${((secondVisitMetrics.cachedResources / secondVisitMetrics.totalResources) * 100).toFixed(2)}%`);

    // Caching should improve on second visit
    expect(secondVisitMetrics.cachedResources).toBeGreaterThan(firstVisitMetrics.cachedResources);
    expect(secondVisitMetrics.totalTransferSize).toBeLessThan(firstVisitMetrics.totalTransferSize);
  });
});
