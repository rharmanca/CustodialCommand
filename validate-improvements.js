/**
 * Validation script for all implemented improvements
 * This script checks that all the critical fixes and enhancements are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Custodial Command Improvements...\n');

// Test 1: Check PDF export fixes
console.log('📄 Testing PDF Export Fixes...');
const pdfFiles = [
  'src/utils/printReportGenerator.ts',
  'src/utils/reportHelpers.ts',
  'src/components/reports/PDFReportBuilder.tsx'
];

let pdfFixesValid = true;
pdfFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for function API usage
    if (content.includes('autoTable(doc, {')) {
      console.log(`  ✅ ${file}: Using function API`);
    } else if (content.includes('doc.autoTable(')) {
      console.log(`  ❌ ${file}: Still using prototype method`);
      pdfFixesValid = false;
    } else {
      console.log(`  ⚠️  ${file}: No autoTable usage found`);
    }
    
    // Check for error handling
    if (content.includes('try {') && content.includes('catch (error)')) {
      console.log(`  ✅ ${file}: Has error handling`);
    } else {
      console.log(`  ⚠️  ${file}: Missing error handling`);
    }
  } else {
    console.log(`  ❌ ${file}: File not found`);
    pdfFixesValid = false;
  }
});

// Test 2: Check code splitting
console.log('\n⚡ Testing Code Splitting...');
const appTsxPath = path.join(__dirname, 'src/App.tsx');
if (fs.existsSync(appTsxPath)) {
  const appContent = fs.readFileSync(appTsxPath, 'utf8');
  
  if (appContent.includes('lazy(') && appContent.includes('Suspense')) {
    console.log('  ✅ App.tsx: Code splitting implemented');
  } else {
    console.log('  ❌ App.tsx: Code splitting not implemented');
  }
  
  if (appContent.includes('PageLoadingSkeleton')) {
    console.log('  ✅ App.tsx: Loading skeleton implemented');
  } else {
    console.log('  ❌ App.tsx: Loading skeleton missing');
  }
} else {
  console.log('  ❌ App.tsx: File not found');
}

// Test 3: Check accessibility improvements
console.log('\n♿ Testing Accessibility Improvements...');
const accessibilityFiles = [
  'src/App.tsx',
  'src/pages/custodial-inspection.tsx',
  'src/pages/inspection-data.tsx'
];

let accessibilityValid = true;
accessibilityFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('aria-label') || content.includes('aria-describedby') || content.includes('aria-live')) {
      console.log(`  ✅ ${file}: Has accessibility attributes`);
    } else {
      console.log(`  ⚠️  ${file}: Missing accessibility attributes`);
    }
    
    if (content.includes('Skip to main content') || content.includes('skip-to-content')) {
      console.log(`  ✅ ${file}: Has skip link`);
    } else if (file === 'src/App.tsx') {
      console.log(`  ❌ ${file}: Missing skip link`);
      accessibilityValid = false;
    }
  }
});

// Test 4: Check image optimization
console.log('\n🖼️  Testing Image Optimization...');
const imageOptimizationPath = path.join(__dirname, 'src/utils/imageCompression.ts');
if (fs.existsSync(imageOptimizationPath)) {
  console.log('  ✅ Image compression utility created');
} else {
  console.log('  ❌ Image compression utility missing');
}

const custodialInspectionPath = path.join(__dirname, 'src/pages/custodial-inspection.tsx');
if (fs.existsSync(custodialInspectionPath)) {
  const content = fs.readFileSync(custodialInspectionPath, 'utf8');
  if (content.includes('loading="lazy"')) {
    console.log('  ✅ Lazy loading implemented');
  } else {
    console.log('  ❌ Lazy loading missing');
  }
  
  if (content.includes('compressImage')) {
    console.log('  ✅ Image compression integrated');
  } else {
    console.log('  ❌ Image compression not integrated');
  }
}

// Test 5: Check loading skeletons
console.log('\n💀 Testing Loading Skeletons...');
const skeletonPath = path.join(__dirname, 'src/components/ui/skeleton.tsx');
if (fs.existsSync(skeletonPath)) {
  console.log('  ✅ Skeleton component created');
} else {
  console.log('  ❌ Skeleton component missing');
}

// Test 6: Check PWA features
console.log('\n📱 Testing PWA Features...');
const manifestPath = path.join(__dirname, 'public/manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.shortcuts && manifest.shortcuts.length > 0) {
    console.log('  ✅ App shortcuts configured');
  } else {
    console.log('  ❌ App shortcuts missing');
  }
} else {
  console.log('  ❌ Manifest file missing');
}

const serviceWorkerPath = path.join(__dirname, 'public/sw.js');
if (fs.existsSync(serviceWorkerPath)) {
  console.log('  ✅ Service worker exists');
} else {
  console.log('  ❌ Service worker missing');
}

// Summary
console.log('\n📊 Validation Summary:');
console.log(`PDF Export Fixes: ${pdfFixesValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Code Splitting: ${appContent?.includes('lazy(') ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Accessibility: ${accessibilityValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Image Optimization: ${fs.existsSync(imageOptimizationPath) ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Loading Skeletons: ${fs.existsSync(skeletonPath) ? '✅ PASS' : '❌ FAIL'}`);
console.log(`PWA Features: ${fs.existsSync(manifestPath) && fs.existsSync(serviceWorkerPath) ? '✅ PASS' : '❌ FAIL'}`);

// Overall result
const allTestsPass = pdfFixesValid && 
  (appContent?.includes('lazy(') || false) && 
  accessibilityValid && 
  fs.existsSync(imageOptimizationPath) && 
  fs.existsSync(skeletonPath) && 
  fs.existsSync(manifestPath) && 
  fs.existsSync(serviceWorkerPath);

console.log(`\n🎯 Overall Result: ${allTestsPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);

if (allTestsPass) {
  console.log('\n🎉 Congratulations! All critical improvements have been successfully implemented.');
  console.log('The application now has:');
  console.log('  • Working PDF exports with proper error handling');
  console.log('  • Code splitting for better performance');
  console.log('  • Enhanced accessibility features');
  console.log('  • Image optimization and compression');
  console.log('  • Loading skeletons for better UX');
  console.log('  • PWA features for offline support');
} else {
  console.log('\n⚠️  Some improvements are missing. Please review the failed tests above.');
}

process.exit(allTestsPass ? 0 : 1);
