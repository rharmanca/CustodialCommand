const puppeteer = require('puppeteer-core');
const chromeLauncher = require('chrome-launcher');

async function checkConsoleErrors() {
  console.log('🚀 Launching Chrome to check console errors...\n');
  
  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });
  
  try {
    // Connect Puppeteer
    const browser = await puppeteer.connect({
      browserURL: `http://localhost:${chrome.port}`,
      defaultViewport: { width: 1280, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Capture console messages
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push(`[${type.toUpperCase()}] ${text}`);
      if (type === 'error') {
        errors.push(text);
      }
    });
    
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    page.on('requestfailed', request => {
      errors.push(`Request Failed: ${request.url()} - ${request.failure().errorText}`);
    });
    
    console.log('📱 Navigating to https://cacustodialcommand.up.railway.app/');
    
    // Navigate to the page
    await page.goto('https://cacustodialcommand.up.railway.app/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait a bit for any delayed errors
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if React root has content
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML : 'No root element';
    });
    
    // Get page title
    const title = await page.title();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 BROWSER INSPECTION RESULTS');
    console.log('='.repeat(60));
    
    console.log('\n📄 Page Info:');
    console.log('   Title:', title);
    console.log('   Root element content:', rootContent.substring(0, 100) + (rootContent.length > 100 ? '...' : ''));
    console.log('   Root is empty:', rootContent.trim() === '');
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    } else {
      console.log('\n✅ No JavaScript errors detected');
    }
    
    if (consoleMessages.length > 0) {
      console.log('\n📝 Console Messages:');
      consoleMessages.forEach(msg => {
        console.log('   ' + msg);
      });
    }
    
    // Try to get React-specific info
    const reactInfo = await page.evaluate(() => {
      return {
        hasReact: typeof window.React !== 'undefined',
        hasReactDOM: typeof window.ReactDOM !== 'undefined',
        scheduler: typeof window.__REACT_SCHEDULER_EXPORTS__ !== 'undefined',
        schedulerKeys: window.__REACT_SCHEDULER_EXPORTS__ ? Object.keys(window.__REACT_SCHEDULER_EXPORTS__) : []
      };
    });
    
    console.log('\n⚛️ React Status:');
    console.log('   React loaded:', reactInfo.hasReact);
    console.log('   ReactDOM loaded:', reactInfo.hasReactDOM);
    console.log('   Scheduler exports:', reactInfo.scheduler);
    console.log('   Scheduler functions:', reactInfo.schedulerKeys.join(', ') || 'none');
    
    console.log('\n' + '='.repeat(60));
    
    if (errors.length > 0) {
      console.log('\n🎯 DIAGNOSIS: Found errors that are preventing the app from loading!');
      console.log('The main error appears to be:', errors[0]);
    } else if (rootContent.trim() === '') {
      console.log('\n🎯 DIAGNOSIS: No errors but React is not mounting. Possible silent failure.');
    } else {
      console.log('\n🎯 DIAGNOSIS: App appears to be loading correctly!');
    }
    
    await browser.close();
    
  } finally {
    await chrome.kill();
  }
}

checkConsoleErrors().catch(console.error);
