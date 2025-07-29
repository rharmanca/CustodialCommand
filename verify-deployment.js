#!/usr/bin/env node

// Deployment verification script
import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying deployment configuration...\n');

const checks = [
  {
    name: '.replit file exists with deployment section',
    check: () => {
      const replitFile = fs.readFileSync('.replit', 'utf8');
      return replitFile.includes('[deployment]') && replitFile.includes('deploymentTarget = "cloudrun"');
    }
  },
  {
    name: 'replit-deploy.json configured correctly',
    check: () => {
      const config = JSON.parse(fs.readFileSync('replit-deploy.json', 'utf8'));
      return config.run === 'node production-start.js' && config.build === 'node build-deploy.js';
    }
  },
  {
    name: 'production-start.js exists',
    check: () => fs.existsSync('production-start.js')
  },
  {
    name: 'build-deploy.js exists',
    check: () => fs.existsSync('build-deploy.js')
  },
  {
    name: 'server/public directory has built assets',
    check: () => {
      return fs.existsSync('server/public') && 
             fs.existsSync('server/public/index.html') && 
             fs.existsSync('server/public/assets');
    }
  },
  {
    name: 'package.json has required dependencies',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.dependencies.express && pkg.dependencies.react && (pkg.dependencies.vite || pkg.devDependencies.vite);
    }
  }
];

let allPassed = true;

checks.forEach(({ name, check }) => {
  try {
    const passed = check();
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (!passed) allPassed = false;
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error.message}`);
    allPassed = false;
  }
});

console.log(`\n${allPassed ? '🚀' : '⚠️'} Deployment ${allPassed ? 'READY' : 'NEEDS ATTENTION'}`);

if (allPassed) {
  console.log('\n📋 Deployment Summary:');
  console.log('   - Install: npm install');
  console.log('   - Build: node build-deploy.js');
  console.log('   - Run: node production-start.js');
  console.log('   - Target: Replit Cloud Run');
  console.log('   - Port: 5000 (or $PORT)');
}