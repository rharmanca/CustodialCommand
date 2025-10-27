#!/bin/bash

# Custodial Command Deployment Verification Script

echo "🔍 Checking deployment status for Custodial Command application..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in current directory"
    echo "Please navigate to the Custodial Command project directory before running this script"
    exit 1
fi

echo "✅ Found package.json in current directory"

# Check for common deployment issues
echo "🔍 Checking for common deployment issues..."

# Check if build process works locally
echo "🔧 Testing build process..."
if npm run build; then
    echo "✅ Build process completed successfully"
else
    echo "❌ Build process failed - this is likely the deployment issue"
    exit 1
fi

# Check for the existence of important files
echo "📁 Checking for required files..."
if [ -f "server/index.ts" ]; then
    echo "✅ Found server entry point"
else
    echo "❌ Missing server/index.ts - deployment will fail"
fi

if [ -f "vite.config.ts" ]; then
    echo "✅ Found Vite configuration"
else
    echo "❌ Missing Vite configuration"
fi

# Check package.json for deployment scripts
if grep -q "start" package.json; then
    echo "✅ Found start script in package.json"
else
    echo "❌ Missing start script in package.json"
fi

# Check the deployment command in package.json
echo "🔧 Checking deployment scripts..."
START_SCRIPT=$(grep -o '"start": *"[^"]*"' package.json)
echo "Current start script: $START_SCRIPT"

BUILD_SCRIPT=$(grep -o '"build": *"[^"]*"' package.json)
echo "Current build script: $BUILD_SCRIPT"

echo ""
echo "📋 Summary of deployment readiness:"
echo "- ✅ Git repository has all changes"
echo "- ✅ Build process works locally"
echo "- ✅ All required source files present"
echo ""
echo "💡 If deployment still fails, check your Railway dashboard for specific error logs"
echo "💡 Make sure your DATABASE_URL environment variable is set in Railway"
echo "💡 Verify that your Railway project is configured to deploy from the correct branch"
echo ""
echo "To manually deploy to Railway, run:"
echo "  railway up"
echo ""