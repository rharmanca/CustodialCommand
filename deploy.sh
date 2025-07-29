#!/bin/bash

# Deployment script for Shared Service Command app
# This script prepares the application for deployment

echo "🔧 Starting deployment build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create dist directory structure
echo "📁 Creating build directories..."
mkdir -p dist
mkdir -p server/public

# Build the client application
echo "🏗️ Building client application..."
cd client && VITE_APP_MODE=production npx vite build --config ../vite.config.ts
cd ..

# Copy client build to server public directory
echo "📁 Copying client build to server public directory..."
cp -r client/dist/* server/public/ 2>/dev/null || true

# Compile TypeScript server files
echo "⚙️ Building server application..."
npx tsc --project tsconfig.json --outDir dist/server --declaration false
cp start.js dist/
cp package*.json dist/

# Set NODE_ENV for production
echo "🌍 Setting production environment..."
export NODE_ENV=production

echo "✅ Build process completed successfully!"
echo ""
echo "🚀 To start the production server manually, run:"
echo "    NODE_ENV=production node dist/start.js"
echo ""
echo "📋 For Replit deployment, ensure your .replit file includes:"
echo "    [deployment]"
echo "    run = [\"node\", \"dist/start.js\"]"
echo "    build = [\"./deploy.sh\"]"
echo "    install = [\"npm\", \"install\"]"