import puppeteer from 'puppeteer';

console.log('🎯 Final Verification Test\n');

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
const consoleMessages = [];

page.on('pageerror', error => errors.push(error.message));
page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));

await page.goto('https://cacustodialcommand.up.railway.app/', {
  waitUntil: 'networkidle2',
  timeout: 30000
});

await new Promise(resolve => setTimeout(resolve, 3000));

const pageInfo = await page.evaluate(() => {
  const root = document.getElementById('root');
  return {
    title: document.title,
    rootExists: !!root,
    rootHasChildren: root ? root.children.length > 0 : false,
    rootChildCount: root ? root.children.length : 0,
    bodyClasses: document.body.className,
    hasReactRoot: !!document.querySelector('[data-reactroot]') || root?.children.length > 0
  };
});

await page.screenshot({ path: 'production-screenshot.png', fullPage: false });

console.log('📊 Production App Status:');
console.log('========================');
console.log(`Title: ${pageInfo.title}`);
console.log(`Root exists: ${pageInfo.rootExists}`);
console.log(`Root has children: ${pageInfo.rootHasChildren}`);
console.log(`Root child count: ${pageInfo.rootChildCount}`);
console.log(`React mounted: ${pageInfo.hasReactRoot}`);
console.log(`\nErrors: ${errors.length}`);
console.log(`Console messages: ${consoleMessages.length}`);

if (errors.length > 0) {
  console.log('\n❌ JavaScript Errors:');
  errors.forEach((err, i) => console.log(`  ${i+1}. ${err}`));
}

if (consoleMessages.length > 0) {
  console.log('\n📝 Console Output (first 5):');
  consoleMessages.slice(0, 5).forEach(msg => console.log(`  ${msg}`));
}

await browser.close();

if (errors.length === 0 && pageInfo.rootHasChildren) {
  console.log('\n✅ ✅ ✅ SUCCESS! Production app is working! ✅ ✅ ✅');
  console.log('Screenshot saved to: production-screenshot.png');
} else {
  console.log('\n❌ Issues detected');
  process.exit(1);
}
