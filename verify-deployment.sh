#!/bin/bash

echo "🔍 Verifying Railway Deployment"
echo "================================"
echo ""

# Get the deployment URL
echo "📱 Getting your Railway app URL..."
RAILWAY_URL=$(railway open --json 2>/dev/null | grep -o '"url":"[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$RAILWAY_URL" ]; then
    echo "Could not auto-detect URL. Please enter your Railway app URL:"
    echo "(e.g., https://custodialcommand.up.railway.app)"
    read -p "URL: " RAILWAY_URL
fi

echo "Using URL: $RAILWAY_URL"
echo ""

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local description=$2

    echo -n "Checking $description... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL$endpoint" 2>/dev/null)

    if [ "$response" = "200" ]; then
        echo "✅ OK (200)"
        return 0
    elif [ "$response" = "404" ]; then
        echo "⚠️  Not Found (404)"
        return 1
    elif [ "$response" = "503" ]; then
        echo "❌ Service Unavailable (503)"
        return 1
    else
        echo "⚠️  Response: $response"
        return 1
    fi
}

echo "🏥 Health Checks"
echo "----------------"

# Check health endpoint
check_endpoint "/health" "Health endpoint"

# Check if health returns JSON
echo -n "Checking health response format... "
health_response=$(curl -s "$RAILWAY_URL/health" 2>/dev/null)
if echo "$health_response" | grep -q '"status"'; then
    echo "✅ Valid JSON"

    # Extract status from JSON
    if echo "$health_response" | grep -q '"status":"ok"'; then
        echo "  └─ Status: ✅ OK"
    else
        echo "  └─ Status: ⚠️ Not OK"
    fi

    # Check database status
    if echo "$health_response" | grep -q '"database":{"connected":true}'; then
        echo "  └─ Database: ✅ Connected"
    else
        echo "  └─ Database: ❌ Not Connected"
    fi
else
    echo "⚠️  Not JSON"
fi

echo ""
echo "📄 Page Checks"
echo "--------------"

# Check main page
check_endpoint "/" "Main page"

# Check API endpoints
check_endpoint "/api/inspections" "Inspections API"
check_endpoint "/api/custodial-notes" "Custodial Notes API"
check_endpoint "/api/monthly-feedback" "Monthly Feedback API"
check_endpoint "/api/building-scores" "Building Scores API"

echo ""
echo "📊 Railway Logs (Last 10 lines)"
echo "--------------------------------"
railway logs --limit 10 2>/dev/null | tail -10

echo ""
echo "🎯 Summary"
echo "----------"

# Open in browser
echo "Opening your app in the browser..."
if [ -n "$RAILWAY_URL" ]; then
    echo "URL: $RAILWAY_URL"

    # Try to open in default browser
    if command -v open &> /dev/null; then
        open "$RAILWAY_URL"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$RAILWAY_URL"
    else
        echo "Please open this URL in your browser: $RAILWAY_URL"
    fi
fi

echo ""
echo "✅ Deployment verification complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Check if all pages load correctly in the browser"
echo "2. Try submitting a test inspection"
echo "3. Monitor logs with: railway logs -f"
echo ""
echo "🚨 If pages still don't load:"
echo "1. Check browser console for errors (F12 → Console)"
echo "2. Clear browser cache and cookies"
echo "3. Try incognito/private browsing mode"