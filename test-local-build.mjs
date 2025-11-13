import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

console.log('🚀 Starting local server...\n');

// Start the server
const server = spawn('npm', ['start'], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'production' }
});

// Wait for server to start
await new Promise(resolve => setTimeout(resolve, 5000));

console.log('🧪 Testing local build...\n');

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  await page.goto('http://localhost:5000', { 
    waitUntil: 'networkidle2',
    timeout: 15000 
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const rootHasContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root && root.children.length > 0;
  });
  
  console.log('📊 Results:');
  console.log(`   Root has content: ${rootHasContent}`);
  console.log(`   Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((err, i) => console.log(`   ${i+1}. ${err}`));
  } else if (rootHasContent) {
    console.log('\n✅ SUCCESS! App loaded correctly!');
  } else {
    console.log('\n⚠️  No errors but root is empty');
  }
} catch (e) {
  console.log('❌ Test failed:', e.message);
} finally {
  await browser.close();
  server.kill();
  process.exit(errors.length === 0 && rootHasContent ? 0 : 1);
}
