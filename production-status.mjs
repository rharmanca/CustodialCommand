import https from 'https';

console.log('\n🔍 COMPREHENSIVE PRODUCTION STATUS CHECK\n' + '='.repeat(60));

// Check main page
https.get('https://cacustodialcommand.up.railway.app/', (res) => {
  console.log('📱 Main Page:');
  console.log('   Status Code:', res.statusCode);
  console.log('   Headers:', {
    'content-type': res.headers['content-type'],
    'content-length': res.headers['content-length']
  });
  
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    // Check for React app indicators
    const hasRoot = html.includes('id="root"');
    const hasBundle = html.includes('index-Bmw8JvtW-v6.js');
    const hasPolyfill = html.includes('__REACT_SCHEDULER_EXPORTS__');
    const hasVite = html.includes('__vite');
    
    console.log('\n✅ HTML Checks:');
    console.log('   React root div:', hasRoot ? 'FOUND' : 'MISSING');
    console.log('   JS bundle link:', hasBundle ? 'FOUND' : 'MISSING');
    console.log('   Scheduler polyfill:', hasPolyfill ? 'FOUND' : 'MISSING');
    console.log('   Vite injection:', hasVite ? 'FOUND' : 'MISSING');
    
    // Check for error messages in HTML
    if (html.includes('error') || html.includes('Error')) {
      console.log('\n⚠️  Potential errors found in HTML');
    }
    
    // Check API health
    https.get('https://cacustodialcommand.up.railway.app/api/health', (res2) => {
      let apiData = '';
      res2.on('data', chunk => apiData += chunk);
      res2.on('end', () => {
        console.log('\n🔌 API Status:');
        console.log('   Status Code:', res2.statusCode);
        if (apiData) {
          try {
            const parsed = JSON.parse(apiData);
            if (parsed.error) {
              console.log('   API Response: Error -', parsed.error);
              console.log('   Available endpoints:', parsed.availableEndpoints?.length || 0);
            } else {
              console.log('   API Response:', 'Healthy');
            }
          } catch {
            console.log('   API Response:', apiData.substring(0, 100));
          }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 DIAGNOSIS:');
        
        if (hasRoot && hasBundle && hasPolyfill) {
          console.log('✅ All React components present in HTML');
          console.log('✅ Bundle is linked correctly');
          console.log('✅ Scheduler polyfill is in place');
          console.log('\n🎯 The app SHOULD be working!');
          console.log('\n⚡ If you still see a white screen:');
          console.log('   1. Clear ALL browser data for the site');
          console.log('   2. Try incognito/private mode');
          console.log('   3. Check browser console for client-side errors');
          console.log('   4. The app might require authentication to display content');
        } else {
          console.log('❌ Missing critical components');
          console.log('   The deployment might be incomplete');
        }
        
        console.log('\n🌐 Direct link: https://cacustodialcommand.up.railway.app/');
        console.log('📝 Note: The "No auth credentials" error suggests the app');
        console.log('   requires login. The React app may be working but showing');
        console.log('   a login screen or auth-gated content.');
      });
    }).on('error', err => {
      console.log('API Error:', err.message);
    });
  });
}).on('error', err => {
  console.log('Main page error:', err.message);
});
