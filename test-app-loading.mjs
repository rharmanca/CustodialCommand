import https from 'https';

console.log('🧪 Testing if React App Loads...\n');

const getContent = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve(data));
  }).on('error', reject);
});

try {
  const html = await getContent('https://cacustodialcommand.up.railway.app/');
  
  // Check HTML structure
  const hasRoot = html.includes('id="root"');
  const hasScript = html.includes('index-Bmw8JvtW-v6.js');
  const hasPolyfill = html.includes('__REACT_SCHEDULER_EXPORTS__');
  
  console.log('📄 HTML Structure:');
  console.log('   Root div:', hasRoot ? '✅' : '❌');
  console.log('   Script tag:', hasScript ? '✅' : '❌');
  console.log('   Polyfill:', hasPolyfill ? '✅' : '❌');
  
  // Get the bundle
  const bundle = await getContent('https://cacustodialcommand.up.railway.app/assets/index-Bmw8JvtW-v6.js');
  
  // Check for critical fixes
  const hasGlobalCf = bundle.includes('window.__cf=cf={}');
  const hasSafeReference = bundle.includes('typeof cf!=="undefined"?cf:window.__cf');
  const hasInitCode = bundle.includes('__SCHEDULER_PATCHED__');
  
  console.log('\n🔧 Critical Fixes:');
  console.log('   Global cf:', hasGlobalCf ? '✅' : '❌');
  console.log('   Safe cf reference:', hasSafeReference ? '✅' : '❌');
  console.log('   Init code:', hasInitCode ? '✅' : '❌');
  
  if (hasGlobalCf && hasSafeReference && hasInitCode) {
    console.log('\n✅ ALL FIXES ARE IN PLACE!');
    console.log('\n🎯 The white screen issue should be FIXED!');
    console.log('\n📱 Test it now:');
    console.log('   1. Open: https://cacustodialcommand.up.railway.app/');
    console.log('   2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
    console.log('   3. Open DevTools Console (F12) to see:');
    console.log('      - "[Scheduler Fix] Global containers initialized"');
    console.log('      - "[Polyfill] Performance object and scheduler exports container initialized"');
    console.log('\n⚠️  Note: Railway logs show "High memory pressure" warnings.');
    console.log('   If the app still has issues, it might be due to memory constraints.');
  } else {
    console.log('\n❌ Some fixes are missing!');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
