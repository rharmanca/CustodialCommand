const fs = require('fs');
const path = require('path');

console.log('🔧 Patching React scheduler in bundle...\n');

const bundlePath = path.join(__dirname, 'dist/public/assets');
const files = fs.readdirSync(bundlePath).filter(f => f.startsWith('index-') && f.endsWith('.js'));

if (files.length === 0) {
  console.error('❌ No index bundle found!');
  process.exit(1);
}

const bundleFile = path.join(bundlePath, files[0]);
console.log('📦 Patching:', files[0]);

let content = fs.readFileSync(bundleFile, 'utf8');

// Find and fix the scheduler export issue
// The pattern is: e.unstable_now=function(){...}
// We need to ensure 'e' exists before this assignment

const originalSize = content.length;

// Wrap the scheduler initialization in a safety check
// Match the entire if-else block to avoid syntax errors
content = content.replace(
  /var p=typeof performance=="object"&&typeof performance\.now=="function";if\(p\){var g=performance;e\.unstable_now=function\(\){return g\.now\(\)}}else{/g,
  'var p=typeof performance=="object"&&typeof performance.now=="function";if(p){var g=performance;if(typeof e!=="undefined"){e.unstable_now=function(){return g.now()}}}else{'
);

if (content.length !== originalSize) {
  fs.writeFileSync(bundleFile, content);
  console.log('✅ Bundle patched successfully!');
  console.log('📊 Size change:', content.length - originalSize, 'bytes');
} else {
  console.log('⚠️  Pattern not found - bundle may have changed');
}
