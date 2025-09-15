#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Bundle Analysis Script
 * Analyzes the built bundle to identify optimization opportunities
 */

const DIST_DIR = path.join(__dirname, '..', 'dist');
const PUBLIC_DIR = path.join(DIST_DIR, 'public');

function analyzeBundle() {
  console.log('🔍 Analyzing bundle size and structure...\n');

  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.log('❌ Dist directory not found. Please run "npm run build" first.');
    return;
  }

  // Analyze main bundle
  const mainBundlePath = path.join(PUBLIC_DIR, 'assets');
  if (fs.existsSync(mainBundlePath)) {
    const files = fs.readdirSync(mainBundlePath);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    const cssFiles = files.filter(file => file.endsWith('.css'));
    
    console.log('📦 Bundle Analysis:');
    console.log('==================');
    
    let totalJsSize = 0;
    let totalCssSize = 0;
    
    jsFiles.forEach(file => {
      const filePath = path.join(mainBundlePath, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalJsSize += stats.size;
      
      console.log(`📄 ${file}: ${sizeKB} KB`);
    });
    
    cssFiles.forEach(file => {
      const filePath = path.join(mainBundlePath, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalCssSize += stats.size;
      
      console.log(`🎨 ${file}: ${sizeKB} KB`);
    });
    
    console.log('\n📊 Summary:');
    console.log(`Total JS: ${(totalJsSize / 1024).toFixed(2)} KB`);
    console.log(`Total CSS: ${(totalCssSize / 1024).toFixed(2)} KB`);
    console.log(`Total Assets: ${((totalJsSize + totalCssSize) / 1024).toFixed(2)} KB`);
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    
    if (totalJsSize > 500 * 1024) { // 500KB
      console.log('⚠️  JavaScript bundle is large. Consider:');
      console.log('   - Code splitting with React.lazy()');
      console.log('   - Tree shaking unused code');
      console.log('   - Dynamic imports for heavy components');
    }
    
    if (totalCssSize > 100 * 1024) { // 100KB
      console.log('⚠️  CSS bundle is large. Consider:');
      console.log('   - Purge unused CSS');
      console.log('   - CSS-in-JS for component-specific styles');
      console.log('   - Critical CSS inlining');
    }
    
    if (jsFiles.length > 5) {
      console.log('⚠️  Many JS chunks detected. Consider:');
      console.log('   - Consolidating small chunks');
      console.log('   - Optimizing chunk splitting strategy');
    }
    
    // Check for vendor bundle
    const vendorFile = jsFiles.find(file => file.includes('vendor'));
    if (vendorFile) {
      const vendorPath = path.join(mainBundlePath, vendorFile);
      const vendorStats = fs.statSync(vendorPath);
      const vendorSizeKB = (vendorStats.size / 1024).toFixed(2);
      
      console.log(`\n📚 Vendor bundle: ${vendorSizeKB} KB`);
      
      if (vendorStats.size > 300 * 1024) { // 300KB
        console.log('⚠️  Large vendor bundle. Consider:');
        console.log('   - Splitting vendor chunks by library');
        console.log('   - Using CDN for large libraries');
        console.log('   - Tree shaking unused library code');
      }
    }
    
  } else {
    console.log('❌ Assets directory not found in dist/public');
  }

  // Analyze HTML file
  const htmlPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(htmlPath)) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const htmlSize = (htmlContent.length / 1024).toFixed(2);
    
    console.log(`\n📄 index.html: ${htmlSize} KB`);
    
    // Check for inline scripts/styles
    const inlineScripts = (htmlContent.match(/<script[^>]*>[\s\S]*?<\/script>/g) || []).length;
    const inlineStyles = (htmlContent.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).length;
    
    if (inlineScripts > 0) {
      console.log(`   Inline scripts: ${inlineScripts}`);
    }
    if (inlineStyles > 0) {
      console.log(`   Inline styles: ${inlineStyles}`);
    }
  }

  // Check for service worker
  const swPath = path.join(PUBLIC_DIR, 'sw.js');
  if (fs.existsSync(swPath)) {
    const swStats = fs.statSync(swPath);
    const swSizeKB = (swStats.size / 1024).toFixed(2);
    console.log(`\n🔧 Service Worker: ${swSizeKB} KB`);
  }

  // Check for manifest
  const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifestStats = fs.statSync(manifestPath);
    const manifestSizeKB = (manifestStats.size / 1024).toFixed(2);
    console.log(`📱 PWA Manifest: ${manifestSizeKB} KB`);
  }

  console.log('\n✅ Bundle analysis complete!');
}

// Run analysis
analyzeBundle();
