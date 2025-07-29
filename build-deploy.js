#!/usr/bin/env node

// Build script for deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Starting deployment build process...');

try {
  // Build the client application
  console.log('🏗️ Building client application...');
  execSync('cd client && vite build --config ../vite.config.ts --outDir ../server/public', { stdio: 'inherit' });
  
  // Verify build output exists
  const publicDir = './server/public';
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    console.log(`✅ Client build completed. Files: ${files.join(', ')}`);
  } else {
    throw new Error('Client build output not found in server/public');
  }

  // Copy production server file
  console.log('📋 Preparing production server...');
  if (fs.existsSync('./production-start.js')) {
    console.log('✅ Production server file ready');
  } else {
    throw new Error('production-start.js not found');
  }

  console.log('✅ Deployment build completed successfully!');
  console.log('🚀 Ready for deployment with:');
  console.log('   - Run command: node production-start.js');
  console.log('   - Static files: server/public/*');
  console.log('   - Port: 5000 (or $PORT)');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}