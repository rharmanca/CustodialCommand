const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // Capture network failures
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
  });
  
  // Capture JavaScript errors
  const jsErrors = [];
  page.on('pageerror', error => {
    jsErrors.push(error.toString());
  });
  
  try {
    console.log('Navigating to the application...');
    await page.goto('https://cacustodialcommand.up.railway.app/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait a bit for React to potentially render
    await page.waitForTimeout(5000);
    
    // Check if root div has content
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        hasChildren: root ? root.children.length > 0 : false,
        innerHTML: root ? root.innerHTML.substring(0, 200) : null
      };
    });
    
    console.log('\n=== PAGE ANALYSIS ===');
    console.log('Root element:', rootContent);
    
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      if (msg.location) {
        console.log(`  Location: ${msg.location.url}:${msg.location.lineNumber}`);
      }
    });
    
    console.log('\n=== FAILED REQUESTS ===');
    failedRequests.forEach(req => {
      console.log(`Failed: ${req.url}`);
      console.log(`  Error: ${req.failure ? req.failure.errorText : 'Unknown'}`);
    });
    
    console.log('\n=== JAVASCRIPT ERRORS ===');
    jsErrors.forEach(error => {
      console.log(`JS Error: ${error}`);
    });
    
  } catch (error) {
    console.error('Navigation failed:', error.message);
  } finally {
    await browser.close();
  }
})();
