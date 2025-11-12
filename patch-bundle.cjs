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

// Fix the scheduler module by adding the missing export parameter AND fixing the invocation
// The issue: Vite bundles as (function(){...})()})(exports) instead of (function(e){...})(exports)
// The inner () doesn't pass the export object to the function!

// Find and fix ALL scheduler modules (there can be multiple)
const schedulerPattern = /\(function\(\){typeof __REACT_DEVTOOLS_GLOBAL_HOOK__!="undefined"&&typeof __REACT_DEVTOOLS_GLOBAL_HOOK__\.registerInternalModuleStart=="function"&&__REACT_DEVTOOLS_GLOBAL_HOOK__\.registerInternalModuleStart\(new Error\);/g;

let matchCount = 0;

// Step 1: Add export parameter 'e' to ALL function signatures
content = content.replace(
  /\(function\(\){(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__)/g,
  (match, captureGroup) => {
    matchCount++;
    return '(function(e){' + captureGroup; // Replace (function(){ with (function(e){
  }
);

// Step 2: Fix ALL invocations to pass the export object
// Change })()})(something)) to })(something))
// This pattern can appear multiple times with different variable names
content = content.replace(
  /}\)\(\)\}\)\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)\)/g,
  '})($1))'
);

if (matchCount > 0) {
  console.log(`✅ Fixed ${matchCount} scheduler IIFE(s) - signature and invocation`);
} else {
  console.log('⚠️  No scheduler patterns found - trying alternative fix');
  
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
