const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture all console messages
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });
  
  // Capture errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.toString()}`);
  });
  
  // Capture failed requests
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
  });
  
  try {
    console.log('Loading page...');
    await page.goto('https://cacustodialcommand.up.railway.app/', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    // Check basic page state
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check if root exists and has content
    const rootInfo = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        hasContent: root && root.innerHTML.trim().length > 0,
        content: root ? root.innerHTML.substring(0, 100) : null
      };
    });
    
    console.log('Root element info:', rootInfo);
    
    // Wait a bit more for potential async loading
    await page.waitForTimeout(3000);
    
    // Check again
    const rootInfoAfter = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        hasContent: root && root.innerHTML.trim().length > 0,
        content: root ? root.innerHTML.substring(0, 100) : null
      };
    });
    
    console.log('Root element after wait:', rootInfoAfter);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
