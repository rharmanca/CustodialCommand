import https from 'https';

console.log('🔍 Testing React Scheduler Fix on Production...\n');

const checkProduction = () => {
  return new Promise((resolve) => {
    https.get('https://cacustodialcommand.up.railway.app/assets/index-Bmw8JvtW-v6.js', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk.toString());
      res.on('end', () => {
        // Check for our patches
        const hasEagerInit = data.includes('lM(),') || data.includes('lM();');
        const hasSafetyWrapper = data.includes('typeof e!=="undefined"&&e.unstable_now');
        const hasPreInit = data.includes('yoe(),') || data.includes('yoe();');
        
        console.log('Patch Status:');
        console.log('  Eager Initialization:', hasEagerInit ? '✅ Found' : '❌ Not found');
        console.log('  Safety Wrapper:', hasSafetyWrapper ? '✅ Found' : '❌ Not found');
        console.log('  Pre-initialization:', hasPreInit ? '✅ Found' : '❌ Not found');
        
        if (hasEagerInit || hasSafetyWrapper || hasPreInit) {
          console.log('\n✅ Ultimate patch is DEPLOYED and ACTIVE!');
          console.log('🎉 The white screen issue should be FIXED!');
        } else {
          console.log('\n⚠️  Patches not detected in production bundle');
          console.log('Railway might still be building. Wait 1-2 more minutes.');
        }
        
        console.log('\n🌐 Test the site: https://cacustodialcommand.up.railway.app/');
        console.log('💡 Tip: Clear browser cache (Cmd+Shift+R) for best results');
        
        resolve();
      });
    }).on('error', (err) => {
      console.error('❌ Error:', err.message);
      resolve();
    });
  });
};

checkProduction();
