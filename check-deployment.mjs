import https from 'https';

console.log('🔍 Checking Latest Deployment...\n');

const getContent = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve(data));
  }).on('error', reject);
});

try {
  const bundle = await getContent('https://cacustodialcommand.up.railway.app/assets/index-Bmw8JvtW-v6.js');
  
  console.log('📦 Bundle size:', bundle.length, 'bytes');
  
  // Check for our fixes
  const hasGlobalCf = bundle.includes('window.__cf=cf={}');
  const hasSchedulerPatched = bundle.includes('__SCHEDULER_PATCHED__');
  const hasSchedulerFix = bundle.includes('[Scheduler Fix]');
  
  console.log('\n🔧 Fix Status:');
  console.log('   Global cf fix:', hasGlobalCf ? '✅ DEPLOYED' : '❌ NOT DEPLOYED');
  console.log('   Scheduler patched flag:', hasSchedulerPatched ? '✅ DEPLOYED' : '❌ NOT DEPLOYED');
  console.log('   Scheduler fix message:', hasSchedulerFix ? '✅ DEPLOYED' : '❌ NOT DEPLOYED');
  
  if (hasGlobalCf && hasSchedulerPatched) {
    console.log('\n🎉 FINAL FIX IS DEPLOYED!');
    console.log('The app should now work. Try:');
    console.log('1. Visit https://cacustodialcommand.up.railway.app/');
    console.log('2. Hard refresh (Cmd+Shift+R)');
    console.log('3. Check if the app loads!');
  } else {
    console.log('\n⚠️  Fix not yet deployed');
    console.log('Railway may still be building or the deployment failed.');
    console.log('Check Railway dashboard for build status.');
  }
  
  // Check for memory issues in the bundle
  const bundleSize = bundle.length;
  const bundleSizeMB = (bundleSize / 1024 / 1024).toFixed(2);
  console.log('\n📊 Bundle Analysis:');
  console.log('   Size:', bundleSizeMB, 'MB');
  
  if (bundleSize > 1300000) {
    console.log('   ⚠️  Bundle is quite large, which may contribute to memory pressure');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
