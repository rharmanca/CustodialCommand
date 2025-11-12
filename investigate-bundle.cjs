const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Investigating React bundle issue...\n');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Intercept the main bundle to analyze it
  const bundleContent = [];
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('index-C8lZs5ns-v6.js')) {
      try {
        const text = await response.text();
        // Find the problematic line
        const lines = text.split('\n');
        console.log('📦 Main bundle has', lines.length, 'lines');
        console.log('📦 Bundle size:', (text.length / 1024).toFixed(2), 'KB\n');
        
        // Look for scheduler-related code
        const schedulerRefs = text.match(/scheduler|unstable_now/gi);
        console.log('🔍 Found', schedulerRefs ? schedulerRefs.length : 0, 'scheduler references\n');
      } catch (e) {}
    }
  });
  
  // Check what's actually loaded
  await page.goto('https://cacustodialcommand.up.railway.app/', {
    waitUntil: 'domcontentloaded'
  });
  
  // Check global objects before error
  const globals = await page.evaluate(() => {
    return {
      hasPerformance: typeof performance !== 'undefined',
      hasScheduler: typeof window.Scheduler !== 'undefined',
      performanceHasUnstableNow: typeof performance?.unstable_now === 'function',
      schedulerHasUnstableNow: typeof window.Scheduler?.unstable_now === 'function',
      reactLoaded: typeof React !== 'undefined',
      reactDOMLoaded: typeof ReactDOM !== 'undefined'
    };
  });
  
  console.log('🌐 Global Objects State:');
  console.log(JSON.stringify(globals, null, 2));
  console.log('');
  
  await browser.close();
  
  console.log('✅ Investigation complete');
})();
