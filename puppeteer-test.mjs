import puppeteer from 'puppeteer';

console.log('🚀 Launching browser to check console errors...\n');

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

try {
  const page = await browser.newPage();
  
  // Capture all console messages
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push(`[${type}] ${text}`);
    if (type === 'error') {
      errors.push(text);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}\n${error.stack}`);
  });
  
  page.on('requestfailed', request => {
    errors.push(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
  });
  
  console.log('📱 Navigating to production site...');
  
  await page.goto('https://cacustodialcommand.up.railway.app/', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  // Wait a bit for React to mount
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check if React mounted
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      exists: !!root,
      innerHTML: root ? root.innerHTML : '',
      hasChildren: root ? root.children.length > 0 : false
    };
  });
  
  // Get page title
  const title = await page.title();
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 BROWSER INSPECTION RESULTS');
  console.log('='.repeat(70));
  
  console.log('\n📄 Page Info:');
  console.log('   Title:', title);
  console.log('   Root exists:', rootContent.exists);
  console.log('   Root has children:', rootContent.hasChildren);
  console.log('   Root content length:', rootContent.innerHTML.length);
  
  if (rootContent.innerHTML.length > 0) {
    console.log('   Root preview:', rootContent.innerHTML.substring(0, 200) + '...');
  }
  
  console.log('\n📝 Console Messages (' + consoleMessages.length + ' total):');
  consoleMessages.forEach(msg => {
    console.log('   ' + msg);
  });
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND (' + errors.length + ' total):');
    errors.forEach((err, i) => {
      console.log(`\n   ERROR ${i + 1}:`);
      console.log('   ' + err.split('\n').join('\n   '));
    });
  } else {
    console.log('\n✅ No JavaScript errors detected');
  }
  
  // Check for React
  const reactInfo = await page.evaluate(() => {
    return {
      hasReact: typeof window.React !== 'undefined',
      hasReactDOM: typeof window.ReactDOM !== 'undefined',
      hasScheduler: typeof window.__REACT_SCHEDULER_EXPORTS__ !== 'undefined',
      hasCf: typeof window.__cf !== 'undefined',
      schedulerPatched: typeof window.__SCHEDULER_PATCHED__ !== 'undefined'
    };
  });
  
  console.log('\n⚛️ React Status:');
  console.log('   React loaded:', reactInfo.hasReact);
  console.log('   ReactDOM loaded:', reactInfo.hasReactDOM);
  console.log('   Scheduler exports:', reactInfo.hasScheduler);
  console.log('   Global cf:', reactInfo.hasCf);
  console.log('   Scheduler patched:', reactInfo.schedulerPatched);
  
  console.log('\n' + '='.repeat(70));
  
  if (errors.length > 0) {
    console.log('\n🎯 DIAGNOSIS: JavaScript errors are preventing the app from loading!');
    console.log('Main issue:', errors[0]);
  } else if (!rootContent.hasChildren) {
    console.log('\n🎯 DIAGNOSIS: No errors but React is not mounting to #root');
    console.log('This suggests a silent failure in React initialization');
  } else {
    console.log('\n🎯 DIAGNOSIS: App appears to be loading correctly!');
  }
  
  // Take a screenshot
  await page.screenshot({ path: '/Users/rharman/CustodialCommand/screenshot.png', fullPage: true });
  console.log('\n📸 Screenshot saved to: ~/CustodialCommand/screenshot.png');
  
} catch (error) {
  console.error('\n❌ Browser test failed:', error.message);
  console.error(error.stack);
} finally {
  await browser.close();
}
