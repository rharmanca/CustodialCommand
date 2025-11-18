#!/bin/bash

# Railway Setup Script for CustodialCommand
# This script will guide you through setting up Railway environment variables

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Railway Setup for CustodialCommand Deployment         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed!"
    echo ""
    echo "Install it with one of these commands:"
    echo "  brew install railway        (macOS with Homebrew)"
    echo "  npm install -g @railway/cli (with npm)"
    echo "  curl -fsSL https://railway.app/install.sh | sh (direct install)"
    echo ""
    exit 1
fi

echo "✅ Railway CLI is installed"
echo ""

# Check if logged in
echo "📝 Checking Railway login status..."
railway whoami 2>/dev/null
if [ $? -ne 0 ]; then
    echo "You need to login to Railway first."
    echo "Running: railway login"
    railway login
fi

echo ""
echo "🔗 Linking to your Railway project..."
echo ""
echo "IMPORTANT: Select your CustodialCommand project from the list"
railway link

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project. Please try again."
    exit 1
fi

echo ""
echo "✅ Project linked successfully!"
echo ""

# Create the environment variables file
cat > railway-vars.txt << 'EOF'
DATABASE_URL=postgresql://neondb_owner:npg_WwJEd5ILV7lq@ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NODE_ENV=production
EOF

echo "═══════════════════════════════════════════════════════════════════"
echo "                    SETTING ENVIRONMENT VARIABLES"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Railway CLI no longer supports setting variables via command line."
echo "You need to add them through the web dashboard."
echo ""
echo "📋 I've prepared your variables in 'railway-vars.txt'"
echo ""
echo "Steps to add them:"
echo "1. Opening your Railway dashboard now..."
railway open
echo ""
echo "2. Click on your service (CustodialCommand)"
echo "3. Go to the 'Variables' tab"
echo "4. Click 'Raw Editor' button"
echo "5. Paste these lines:"
echo ""
echo "---COPY EVERYTHING BELOW THIS LINE---"
cat railway-vars.txt
echo "---COPY EVERYTHING ABOVE THIS LINE---"
echo ""
echo "6. Click 'Update Variables'"
echo "7. Railway will automatically redeploy"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "                    AFTER ADDING VARIABLES"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Run these commands to verify:"
echo ""
echo "# Check deployment logs:"
echo "railway logs"
echo ""
echo "# Watch logs in real-time:"
echo "railway logs -f"
echo ""
echo "# Check if variables are set:"
echo "railway variables"
echo ""
echo "# Force a redeploy if needed:"
echo "railway up"
echo ""
echo "# Open your deployed app:"
echo "railway open"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📌 Variables have been saved to 'railway-vars.txt' for your reference"
echo ""