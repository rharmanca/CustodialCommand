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

// Fix the scheduler module by adding the missing export parameter
// The issue: Vite bundles the scheduler as (function(){...})() instead of (function(e){...})(exports)
// Solution: Replace the IIFE wrapper to include the export parameter

// Find the scheduler module IIFE
const schedulerPattern = /\(function\(\){typeof __REACT_DEVTOOLS_GLOBAL_HOOK__!="undefined"&&typeof __REACT_DEVTOOLS_GLOBAL_HOOK__\.registerInternalModuleStart=="function"&&__REACT_DEVTOOLS_GLOBAL_HOOK__\.registerInternalModuleStart\(new Error\);/;

if (schedulerPattern.test(content)) {
  // Replace the IIFE to include export parameter 'e'
  content = content.replace(
    /\(function\(\){(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__)/g,
    '(function(e){$1'
  );
  
  console.log('✅ Added export parameter to scheduler IIFE');
} else {
  console.log('⚠️  Scheduler pattern not found - trying alternative fix');
  
  // Alternative: wrap all e.unstable_* assignments in safety checks
  content = content.replace(
    /e\.unstable_/g,
    '(typeof e!=="undefined"?e:window.__REACT_SCHEDULER_EXPORTS__).unstable_'
  );
}

if (content.length !== originalSize) {
  fs.writeFileSync(bundleFile, content);
  console.log('✅ Bundle patched successfully!');
  console.log('📊 Size change:', content.length - originalSize, 'bytes');
} else {
  console.log('⚠️  Pattern not found - bundle may have changed');
}
