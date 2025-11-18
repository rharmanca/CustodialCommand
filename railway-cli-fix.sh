#!/bin/bash

echo "🚀 Railway CLI Environment Variable Setup"
echo "========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed!"
    echo ""
    echo "Install it with:"
    echo "  macOS: brew install railway"
    echo "  or"
    echo "  npm install -g @railway/cli"
    echo ""
    exit 1
fi

echo "✅ Railway CLI detected"
echo ""

# Login to Railway if needed
echo "📝 Ensuring you're logged in to Railway..."
railway login

echo ""
echo "🔗 Linking to your Railway project..."
echo "Select your CustodialCommand project when prompted:"
railway link

echo ""
echo "⚙️ Setting DATABASE_URL environment variable..."

# Set the DATABASE_URL
railway variables set DATABASE_URL="postgresql://neondb_owner:npg_WwJEd5ILV7lq@ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Set NODE_ENV if not already set
echo ""
echo "⚙️ Setting NODE_ENV to production..."
railway variables set NODE_ENV="production"

echo ""
echo "📋 Current Railway environment variables:"
railway variables

echo ""
echo "🔄 Triggering redeployment..."
railway up

echo ""
echo "✅ Environment variables set and deployment triggered!"
echo ""
echo "📊 You can check the deployment status with:"
echo "  railway logs"
echo ""
echo "🌐 Once deployed, get your app URL with:"
echo "  railway open"