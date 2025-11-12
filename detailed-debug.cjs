const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  
  // Capture detailed error information
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  await page.goto('https://cacustodialcommand.up.railway.app/', {
    waitUntil: 'networkidle0',
    timeout: 30000
  }).catch(() => {});
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('=== DETAILED ERROR INFORMATION ===\n');
  errors.forEach((err, i) => {
    console.log(`Error ${i + 1}:`);
    console.log('Message:', err.message);
    console.log('Stack:', err.stack);
    console.log('\n---\n');
  });
  
  await browser.close();
})();
