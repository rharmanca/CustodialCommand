import puppeteer from 'puppeteer';

console.log('🧪 Testing with fresh browser (no cache)...\n');

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-cache', '--disable-application-cache']
});

const page = await browser.newPage();
await page.setCacheEnabled(false);

const errors = [];
page.on('pageerror', error => {
  errors.push(error.message);
});

console.log('📱 Loading page with cache disabled...');
await page.goto('https://cacustodialcommand.up.railway.app/', {
  waitUntil: 'networkidle2',
  timeout: 30000
});

await new Promise(resolve => setTimeout(resolve, 3000));

const rootHasContent = await page.evaluate(() => {
  const root = document.getElementById('root');
  return root && root.children.length > 0;
});

console.log('\n📊 Results:');
console.log(`   Root has content: ${rootHasContent}`);
console.log(`   Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\n❌ Errors found:');
  errors.forEach((err, i) => console.log(`   ${i+1}. ${err}`));
} else {
  console.log('\n✅ No errors! App loaded successfully!');
}

await browser.close();
