#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 AGGRESSIVE IIFE Patcher v1.0\n');
console.log('This will patch ALL IIFEs that might be causing issues\n');

// Find the bundle file
const distPath = path.join(__dirname, 'dist', 'public', 'assets');
const files = fs.readdirSync(distPath);
const bundleFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));

if (!bundleFile) {
  console.error('❌ Bundle file not found!');
  process.exit(1);
}

const bundlePath = path.join(distPath, bundleFile);
console.log('📦 Patching:', bundleFile);

// Read the bundle
let content = fs.readFileSync(bundlePath, 'utf8');
const originalSize = content.length;

// Count issues before
const beforeCount = (content.match(/\(function\(\)\{/g) || []).length;
console.log(`\n🔍 Found ${beforeCount} IIFEs without parameters`);

// PATCH 1: Fix scheduler-related IIFEs specifically
let schedulerPatches = 0;
content = content.replace(
  /\(function\(\)\{(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__)/g,
  (match, captureGroup) => {
    schedulerPatches++;
    return `(function(e){${captureGroup}`;
  }
);

// PATCH 2: Fix any IIFE that references 'exports' or 'module'
let exportPatches = 0;
content = content.replace(
  /\(function\(\)\{([^}]*(?:exports|module\.exports|window\.__)[^}]*)\}/g,
  (match, body) => {
    if (!body.includes('document.createElement')) { // Skip DOM manipulation IIFEs
      exportPatches++;
      return `(function(e){${body}}`;
    }
    return match;
  }
);

// PATCH 3: Fix IIFE invocations - change })() to })(window||{})
let invocationPatches = 0;
content = content.replace(
  /\}\)\(\);/g,
  () => {
    invocationPatches++;
    return '})(window||{});';
  }
);

// PATCH 4: Ensure scheduler exports are available globally
if (!content.includes('window.__SCHEDULER_INITIALIZED__')) {
  const schedulerInit = `
;(function(){
  if(typeof window !== 'undefined' && !window.__SCHEDULER_INITIALIZED__) {
    window.__SCHEDULER_INITIALIZED__ = true;
    window.__REACT_SCHEDULER_EXPORTS__ = window.__REACT_SCHEDULER_EXPORTS__ || {};
    console.log('[Patcher] Scheduler exports initialized');
  }
})();`;
  content = schedulerInit + content;
}

// Count after
const afterCount = (content.match(/\(function\(\)\{/g) || []).length;

// Write the patched bundle
fs.writeFileSync(bundlePath, content);

const newSize = content.length;
const sizeDiff = newSize - originalSize;

console.log('\n' + '='.repeat(60));
console.log('✅ PATCHING COMPLETE!');
console.log('='.repeat(60));
console.log('\n📊 Results:');
console.log(`   Scheduler patches: ${schedulerPatches}`);
console.log(`   Export-related patches: ${exportPatches}`);
console.log(`   Invocation patches: ${invocationPatches}`);
console.log(`   Remaining unpatched IIFEs: ${afterCount} (was ${beforeCount})`);
console.log(`   Size change: ${sizeDiff > 0 ? '+' : ''}${sizeDiff} bytes`);

if (afterCount > 0) {
  console.log('\n⚠️  Some IIFEs remain unpatched (likely safe DOM manipulation)');
} else {
  console.log('\n🎉 All IIFEs have been patched!');
}

console.log('\n📦 Bundle patched successfully!');
console.log('🚀 Ready for deployment!');
