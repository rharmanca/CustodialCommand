import https from 'https';

console.log('\n🔍 DEBUGGING PRODUCTION ISSUE\n' + '='.repeat(60));

// First, let's see what the actual JS bundle starts with
https.get('https://cacustodialcommand.up.railway.app/assets/index-Bmw8JvtW-v6.js', (res) => {
  let jsContent = '';
  let chunks = 0;
  
  res.on('data', chunk => {
    if (chunks < 5) {  // Only get first few chunks
      jsContent += chunk.toString();
      chunks++;
    }
  });
  
  res.on('end', () => {
    console.log('📦 Bundle Analysis:');
    console.log('   Size:', res.headers['content-length'], 'bytes');
    
    // Check for our patches
    const hasIIFEFix = jsContent.includes('(function(e){');
    const hasScheduler = jsContent.includes('scheduler') || jsContent.includes('unstable_');
    
    console.log('   IIFE Fix present:', hasIIFEFix ? 'YES' : 'NO');
    console.log('   Scheduler code found:', hasScheduler ? 'YES' : 'NO');
    
    // Check first 200 chars to see structure
    console.log('\n📝 Bundle starts with:');
    console.log(jsContent.substring(0, 200));
    
    // Now check the HTML
    https.get('https://cacustodialcommand.up.railway.app/', (res2) => {
      let html = '';
      res2.on('data', chunk => html += chunk);
      res2.on('end', () => {
        // Extract script tags
        const scriptTags = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
        
        console.log('\n📄 HTML Analysis:');
        console.log('   Script tags found:', scriptTags.length);
        
        // Check for module scripts
        const moduleScripts = scriptTags.filter(s => s.includes('type="module"'));
        console.log('   Module scripts:', moduleScripts.length);
        
        // Look for error handling
        const hasErrorHandling = html.includes('onerror') || html.includes('catch');
        console.log('   Error handling:', hasErrorHandling ? 'YES' : 'NO');
        
        // Check if there's any inline JS that might be failing
        const inlineScripts = scriptTags.filter(s => !s.includes('src='));
        console.log('   Inline scripts:', inlineScripts.length);
        
        if (inlineScripts.length > 0) {
          console.log('\n📜 Inline script content:');
          inlineScripts.forEach((script, i) => {
            const content = script.replace(/<\/?script[^>]*>/gi, '').trim();
            console.log(`   Script ${i + 1}: ${content.substring(0, 100)}...`);
          });
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 HYPOTHESIS:');
        console.log('The bundle is loading but React is not mounting.');
        console.log('This could be because:');
        console.log('1. The scheduler patch is not complete');
        console.log('2. There\'s a different runtime error');
        console.log('3. The module loading order is wrong');
        console.log('\nNEXT STEP: Check browser console for actual errors!');
      });
    });
  });
});
