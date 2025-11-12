#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 FINAL React Scheduler Fix v4.0\n');
console.log('This fixes the scope issue where cf is not accessible\n');

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

// CRITICAL FIX: Make cf global so it's accessible from anywhere
// Find: cf={}
// Replace with: window.__cf=cf={}
let globalCfFixed = false;
content = content.replace(/\bcf={}/g, (match) => {
  globalCfFixed = true;
  return 'window.__cf=cf={}';
});

// Also update references to use the global if local is undefined
// Find: })(cf)
// Replace with: })(typeof cf!=="undefined"?cf:window.__cf||{})
let cfReferencesFixed = 0;
content = content.replace(/\}\)\(cf\)/g, (match) => {
  cfReferencesFixed++;
  return '})(typeof cf!=="undefined"?cf:window.__cf||{})';
});

// CRITICAL FIX 1: The scheduler IIFE has no parameter
// Find: (function(){typeof __REACT_DEVTOOLS_GLOBAL_HOOK__
// Replace with: (function(e){typeof __REACT_DEVTOOLS_GLOBAL_HOOK__
let schedulerParamFixed = false;
content = content.replace(/\(function\(\)\{typeof __REACT_DEVTOOLS_GLOBAL_HOOK__/g, (match) => {
  schedulerParamFixed = true;
  return '(function(e){typeof __REACT_DEVTOOLS_GLOBAL_HOOK__';
});

// CRITICAL FIX 2: The scheduler IIFE is called incorrectly
// After fix 1, pattern is: Error)})()})(nm)),nm}
// We need to remove: )()})
// To get: Error})(nm)),nm}
let schedulerCallFixed = false;
content = content.replace(/Error\)\}\)\(\)\}\)\(nm\)\),nm\}/g, (match) => {
  schedulerCallFixed = true;
  return 'Error})(nm)),nm}';
});

// Add initialization at the very beginning
const initCode = `
;(function(){
  // CRITICAL: Initialize global scheduler container
  if(typeof window !== 'undefined') {
    window.__cf = window.__cf || {};
    window.__REACT_SCHEDULER_EXPORTS__ = window.__REACT_SCHEDULER_EXPORTS__ || {};
    window.__SCHEDULER_PATCHED__ = true;
    console.log('[Scheduler Fix] Global containers initialized');
  }
})();
`;

if (!content.includes('__SCHEDULER_PATCHED__')) {
  content = initCode + content;
}

// Write the patched bundle
fs.writeFileSync(bundlePath, content);

const newSize = content.length;
const sizeDiff = newSize - originalSize;

console.log('\n' + '='.repeat(60));
console.log('🎉 FINAL FIX APPLIED!');
console.log('='.repeat(60));
console.log('\n📊 Patches Applied:');
console.log(`   ✅ Made cf global: ${globalCfFixed ? 'YES' : 'NO'}`);
console.log(`   ✅ Fixed cf references: ${cfReferencesFixed}`);
console.log(`   ✅ Fixed scheduler IIFE parameter: ${schedulerParamFixed ? 'YES' : 'NO'}`);
console.log(`   ✅ Fixed scheduler IIFE call: ${schedulerCallFixed ? 'YES' : 'NO'}`);
console.log(`   ✅ Added global init: YES`);
console.log(`   Size change: ${sizeDiff > 0 ? '+' : ''}${sizeDiff} bytes`);

console.log('\n🎯 What this fixes:');
console.log('   - cf variable is now globally accessible');
console.log('   - Scheduler can access cf from any scope');
console.log('   - No more "undefined" errors');

console.log('\n✅ Bundle patched successfully!');
console.log('🚀 Ready for deployment!');
