const fs = require('fs');
const path = require('path');

console.log('🔧 ULTIMATE React Scheduler Patch v3.0\n');
console.log('This patch fixes:');
console.log('  1. IIFE parameter passing');
console.log('  2. Lazy initialization race condition');
console.log('  3. Missing export object');
console.log('  4. Eager initialization enforcement\n');

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
let patchesApplied = [];

// ============================================================================
// PATCH 1: Fix IIFE parameter (function(){ -> function(e){)
// ============================================================================
let iifePatchCount = 0;
content = content.replace(
  /\(function\(\){(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__)/g,
  (match, captureGroup) => {
    iifePatchCount++;
    return '(function(e){' + captureGroup;
  }
);

if (iifePatchCount > 0) {
  patchesApplied.push(`✅ PATCH 1: Fixed ${iifePatchCount} IIFE parameter(s)`);
}

// ============================================================================
// PATCH 2: Fix IIFE invocation (})()})(cf)) -> })(cf))
// ============================================================================
let invocationPatchCount = 0;
const originalContent = content;
content = content.replace(
  /}\)\(\)\}\)\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)\)/g,
  (match, varName) => {
    invocationPatchCount++;
    return `})(${varName}))`;
  }
);

if (invocationPatchCount > 0) {
  patchesApplied.push(`✅ PATCH 2: Fixed ${invocationPatchCount} IIFE invocation(s)`);
}

// ============================================================================
// PATCH 3: Add eager initialization
// Find the pattern: function lM(){return wy||(wy=1,...),cf}
// And force it to execute immediately
// ============================================================================
let eagerInitCount = 0;

// Pattern 1: Look for the lazy init wrapper
const lazyInitPattern = /var\s+([a-zA-Z_$][a-zA-Z0-9_$]*);\s*function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\(\)\{return\s+\1\|\|/g;
let lazyMatches = [];
let match;

while ((match = lazyInitPattern.exec(content)) !== null) {
  lazyMatches.push({
    flag: match[1],
    funcName: match[2],
    index: match.index
  });
}

if (lazyMatches.length > 0) {
  // For each lazy init function, add an immediate invocation after its definition
  // We need to do this in reverse order to preserve indices
  for (let i = lazyMatches.length - 1; i >= 0; i--) {
    const m = lazyMatches[i];
    
    // Find the end of the function (next function or variable declaration)
    const funcStart = m.index;
    const funcPattern = new RegExp(`function\\s+${m.funcName}\\([^)]*\\)\\{`, 'g');
    funcPattern.lastIndex = funcStart;
    
    if (funcPattern.exec(content)) {
      // Find the matching closing brace
      let braceCount = 1;
      let pos = funcPattern.lastIndex;
      
      while (braceCount > 0 && pos < content.length) {
        if (content[pos] === '{') braceCount++;
        if (content[pos] === '}') braceCount--;
        pos++;
      }
      
      if (braceCount === 0) {
        // Insert eager initialization right after the function definition
        const eagerInit = `;(function(){try{${m.funcName}();console.log('[Scheduler] Eagerly initialized ${m.funcName}()')}catch(e){console.error('[Scheduler] Init error:',e)}})()`;
        content = content.slice(0, pos) + eagerInit + content.slice(pos);
        eagerInitCount++;
      }
    }
  }
  
  if (eagerInitCount > 0) {
    patchesApplied.push(`✅ PATCH 3: Added eager initialization to ${eagerInitCount} function(s)`);
  }
}

// ============================================================================
// PATCH 4: Add safety wrapper for all unstable_now assignments
// ============================================================================
let safetyWrapperCount = 0;
const unstableNowPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*)\.unstable_now\s*=/g;
let unstableMatches = [];

while ((match = unstableNowPattern.exec(content)) !== null) {
  unstableMatches.push({
    varName: match[1],
    index: match.index,
    fullMatch: match[0]
  });
}

// Replace in reverse order to preserve indices
for (let i = unstableMatches.length - 1; i >= 0; i--) {
  const m = unstableMatches[i];
  const safeAssignment = `(${m.varName}||window.__REACT_SCHEDULER_EXPORTS__||{}).unstable_now=`;
  content = content.slice(0, m.index) + safeAssignment + content.slice(m.index + m.fullMatch.length);
  safetyWrapperCount++;
}

if (safetyWrapperCount > 0) {
  patchesApplied.push(`✅ PATCH 4: Added safety wrapper to ${safetyWrapperCount} unstable_now assignment(s)`);
}

// ============================================================================
// PATCH 5: Force scheduler export to be eager
// Find: function yoe(){return _y||(_y=1,uf.exports=lM()),uf.exports}
// Make it execute lM() immediately
// ============================================================================
let exportPatchCount = 0;
const exportPattern = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\(\)\{return\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\|\|\(([a-zA-Z_$][a-zA-Z0-9_$]*)=1,([a-zA-Z_$][a-zA-Z0-9_$]*)\.exports=([a-zA-Z_$][a-zA-Z0-9_$]*)\(\)\),\4\.exports\}/g;

content = content.replace(exportPattern, (match, funcName, flag, flagAssign, exportsObj, initFunc) => {
  exportPatchCount++;
  // Add immediate initialization after the function
  return match + `;(function(){try{${funcName}();console.log('[Scheduler] Export function ${funcName}() pre-initialized')}catch(e){console.error('[Scheduler] Export init error:',e)}})()`;
});

if (exportPatchCount > 0) {
  patchesApplied.push(`✅ PATCH 5: Added eager export initialization to ${exportPatchCount} function(s)`);
}

// ============================================================================
// Write patched file and report
// ============================================================================
if (content.length !== originalSize) {
  fs.writeFileSync(bundleFile, content);
  console.log('\n' + '='.repeat(70));
  console.log('🎉 BUNDLE PATCHED SUCCESSFULLY!');
  console.log('='.repeat(70));
  console.log('\n📊 Statistics:');
  console.log(`   Original size: ${originalSize.toLocaleString()} bytes`);
  console.log(`   Patched size:  ${content.length.toLocaleString()} bytes`);
  console.log(`   Size change:   ${(content.length - originalSize > 0 ? '+' : '')}${(content.length - originalSize).toLocaleString()} bytes`);
  console.log('\n🔧 Patches Applied:');
  patchesApplied.forEach(p => console.log(`   ${p}`));
  console.log('\n✅ The scheduler should now initialize eagerly and prevent race conditions!');
  console.log('='.repeat(70) + '\n');
} else {
  console.log('\n⚠️  WARNING: No changes made to bundle');
  console.log('This could mean:');
  console.log('  1. The bundle structure has changed');
  console.log('  2. The patterns don\'t match');
  console.log('  3. The issue is elsewhere\n');
  console.log('💡 Recommendation: Check the bundle manually or review the build process');
}
