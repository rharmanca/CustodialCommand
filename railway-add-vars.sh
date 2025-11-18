#!/bin/bash

echo "🚀 Setting Railway Environment Variables"
echo "========================================"
echo ""

# Create a temporary .env file with the variables
cat > .env.railway << 'EOF'
DATABASE_URL=postgresql://neondb_owner:npg_WwJEd5ILV7lq@ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NODE_ENV=production
EOF

echo "📝 Created .env.railway file with variables"
echo ""

echo "⚠️  IMPORTANT: Railway CLI doesn't support direct variable setting anymore."
echo ""
echo "You have 2 options:"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "OPTION 1: Use Railway Web Dashboard (Recommended)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "1. Run this command to open your Railway dashboard:"
echo "   railway open"
echo ""
echo "2. Go to the Variables tab"
echo ""
echo "3. Add these variables:"
echo "   DATABASE_URL = postgresql://neondb_owner:npg_WwJEd5ILV7lq@ep-aged-wind-ad9g7vhf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
echo "   NODE_ENV = production"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "OPTION 2: Deploy with Variables from File"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Run this command to deploy with the variables:"
echo "   railway up --environment production"
echo ""
echo "Then push the variables through the dashboard as shown above."
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📋 After setting variables, you can:"
echo "   - Check logs: railway logs"
echo "   - View status: railway status"
echo "   - Open app: railway open"
echo ""

# Try to open Railway dashboard
read -p "Press Enter to open Railway dashboard in your browser..."
railway open