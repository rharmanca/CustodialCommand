import https from 'https';
import { URL } from 'url';

console.log('🔍 Testing Bundle Loading...\n');

// First, get the HTML
const getContent = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve(data));
  }).on('error', reject);
});

try {
  // Get the main page
  const html = await getContent('https://cacustodialcommand.up.railway.app/');
  console.log('✅ HTML loaded successfully');
  
  // Check for script tag
  const scriptMatch = html.match(/<script[^>]*src="([^"]*index[^"]*\.js)"/);
  if (scriptMatch) {
    console.log('✅ Found script tag:', scriptMatch[1]);
    
    // Try to load the script
    const scriptUrl = new URL(scriptMatch[1], 'https://cacustodialcommand.up.railway.app/').href;
    console.log('📦 Loading bundle from:', scriptUrl);
    
    const bundle = await getContent(scriptUrl);
    console.log('✅ Bundle loaded, size:', bundle.length, 'bytes');
    
    // Check for scheduler patterns
    const hasScheduler = bundle.includes('scheduler.development.js');
    const hasIIFEWithParam = bundle.includes('(function(e){');
    const hasIIFEWithoutParam = bundle.includes('(function(){');
    const hasUnstableNow = bundle.includes('unstable_now');
    
    console.log('\n📊 Bundle Analysis:');
    console.log('   Has scheduler:', hasScheduler);
    console.log('   Has IIFE with parameter:', hasIIFEWithParam);
    console.log('   Has IIFE without parameter:', hasIIFEWithoutParam);
    console.log('   Has unstable_now:', hasUnstableNow);
    
    // Count problematic patterns
    const problemCount = (bundle.match(/\(function\(\)\{/g) || []).length;
    console.log('   Unpatched IIFEs found:', problemCount);
    
    if (problemCount > 10) {
      console.log('\n❌ PROBLEM: Many unpatched IIFEs found!');
      console.log('   The patch may not be working correctly.');
    }
    
    // Check for our patches
    const hasEagerInit = bundle.includes('Eagerly initialized');
    const hasExportInit = bundle.includes('Export function');
    
    console.log('\n🔧 Patch Status:');
    console.log('   Has eager initialization:', hasEagerInit);
    console.log('   Has export initialization:', hasExportInit);
    
  } else {
    console.log('❌ No script tag found in HTML!');
  }
  
  // Check for root div
  const hasRoot = html.includes('id="root"');
  console.log('\n📱 HTML Status:');
  console.log('   Has root div:', hasRoot);
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
