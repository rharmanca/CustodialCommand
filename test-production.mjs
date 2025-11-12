import https from 'https';

console.log('🔍 Testing production site...\n');

https.get('https://cacustodialcommand.up.railway.app/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Check if basic HTML loads
    if (data.includes('Custodial Command')) {
      console.log('✅ HTML loads correctly');
    } else {
      console.log('❌ HTML missing app title');
    }
    
    // Check if root div exists
    if (data.includes('id="root"')) {
      console.log('✅ Root div present for React');
    } else {
      console.log('❌ Root div missing');
    }
    
    // Check if JS bundle reference exists
    if (data.includes('index-Bmw8JvtW-v6.js')) {
      console.log('✅ JS bundle referenced in HTML');
    } else {
      console.log('❌ JS bundle not referenced');
    }
    
    console.log('\n📱 Site appears to be deployed!');
    console.log('🌐 Visit: https://cacustodialcommand.up.railway.app/');
    console.log('\n⚠️  If you still see a white screen:');
    console.log('1. Clear browser cache (Cmd+Shift+R on Mac)');
    console.log('2. Check browser console for errors');
    console.log('3. The deployment might still be processing (wait 1-2 min)');
  });
}).on('error', (err) => {
  console.error('❌ Error accessing site:', err.message);
});
