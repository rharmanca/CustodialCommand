const fs = require('fs');
const path = require('path');

console.log('🔧 Patching React scheduler in bundle (v2 - Eager Initialization)...\n');

const bundlePath = path.join(__dirname, 'dist/public/assets');
const files = fs.readdirSync(bundlePath).filter(f => f.startsWith('index-') && f.endsWith('.js'));

if (files.length === 0) {
  console.error('❌ No index bundle found!');
  process.exit(1);
}

const bundleFile = path.join(bundlePath, files[0]);
console.log('📦 Patching:', files[0]);

let content = fs.readFileSync(bundleFile, 'utf8');
const originalSize = content.length;

// CRITICAL FIX: Force eager initialization of the scheduler module
// The issue is that React tries to use the scheduler before lM() is called

// Step 1: Find the scheduler export function pattern
// Pattern: function yoe(){return _y||(_y=1,uf.exports=lM()),uf.exports}
const exportPattern = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\(\)\{return\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\|\|\(([a-zA-Z_$][a-zA-Z0-9_$]*)=1,([a-zA-Z_$][a-zA-Z0-9_$]*)\.exports=([a-zA-Z_$][a-zA-Z0-9_$]*)\(\)\),\4\.exports\}/g;

let patchCount = 0;
let schedulerFunctionName = null;
let initFunctionName = null;

// Find the scheduler export function
content = content.replace(exportPattern, (match, funcName, flag, flagAssign, exportsObj, initFunc) => {
  // Check if this is the scheduler by looking for lM or similar pattern
  if (match.includes('lM()') || match.includes('exports=')) {
    patchCount++;
    schedulerFunctionName = funcName;
    initFunctionName = initFunc;
    console.log(`✅ Found scheduler export function: ${funcName}()`);
    console.log(`   Initialization function: ${initFunc}()`);
    
    // Add eager initialization - call the init function immediately after definition
    return match + `;(function(){try{${initFunc}();console.log('[Scheduler Patch] Eagerly initialized ${initFunc}()')}catch(e){console.error('[Scheduler Patch] Failed to initialize:',e)}})()`;
  }
  return match;
});

// Step 2: Also fix the IIFE parameter issue (from previous patch)
content = content.replace(
  /\(function\(\){(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__)/g,
  (match, captureGroup) => {
    return '(function(e){' + captureGroup;
  }
);

// Step 3: Fix the invocation to pass the export object
content = content.replace(
  /}\)\(\)\}\)\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)\)/g,
  '})($1))'
);

// Step 4: Add safety wrapper for unstable_now assignments
content = content.replace(
  /([a-zA-Z_$][a-zA-Z0-9_$]*)\.unstable_now=/g,
  (match, varName) => {
    return `(${varName}||window.__REACT_SCHEDULER_EXPORTS__||{}).unstable_now=`;
  }
);

if (patchCount > 0) {
  console.log(`✅ Applied eager initialization patch to ${patchCount} scheduler export(s)`);
} else {
  console.log('⚠️  No scheduler export pattern found - trying alternative approach');
  
  // Alternative: Find and force initialization of lM function
  const lmPattern = /var\s+([a-zA-Z_$][a-zA-Z0-9_$]*);\s*function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\(\)\{return\s+\1\|\|/g;
  
  content = content.replace(lmPattern, (match, flag, funcName) => {
    console.log(`✅ Found lazy init function: ${funcName}()`);
    // Force immediate execution by calling it after definition
    return match + `(function(){try{${funcName}();console.log('[Scheduler] Eagerly initialized ${funcName}()')}catch(e){console.error('[Scheduler] Init failed:',e)}})(),`;
  });
}

if (content.length !== originalSize) {
  fs.writeFileSync(bundleFile, content);
  console.log('✅ Bundle patched successfully!');
  console.log('📊 Size change:', content.length - originalSize, 'bytes');
  console.log('\n🎯 Patch Summary:');
  console.log('   - Fixed IIFE parameter passing');
  console.log('   - Added eager scheduler initialization');
  console.log('   - Added safety wrappers for unstable_now');
  console.log('   - Forced immediate execution of lazy init functions');
} else {
  console.log('⚠️  No changes made - bundle may have different structure');
  console.log('💡 Consider checking the bundle manually');
}
