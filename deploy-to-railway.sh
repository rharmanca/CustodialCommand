#!/bin/bash

# Railway Deployment Script for Custodial Command
# This script automates the deployment process to Railway

echo "🚀 Railway Deployment for Custodial Command"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        *)
            echo "$message"
            ;;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "INFO" "Checking prerequisites..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_status "ERROR" "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_status "SUCCESS" "Found package.json"

# Check if Railway CLI is installed
if command_exists railway; then
    print_status "SUCCESS" "Railway CLI found"
else
    print_status "ERROR" "Railway CLI not found. Please install it with: npm install -g @railway/cli"
    exit 1
fi

# Check if we're logged into Railway
print_status "INFO" "Checking Railway authentication..."

if railway whoami >/dev/null 2>&1; then
    print_status "SUCCESS" "Authenticated with Railway"
else
    print_status "WARNING" "Not authenticated with Railway. Please run 'railway login' first."
    read -p "Would you like to login now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway login
        if railway whoami >/dev/null 2>&1; then
            print_status "SUCCESS" "Successfully authenticated with Railway"
        else
            print_status "ERROR" "Failed to authenticate with Railway"
            exit 1
        fi
    else
        print_status "ERROR" "Railway authentication required for deployment"
        exit 1
    fi
fi

# Check if Railway project is linked
print_status "INFO" "Checking Railway project link..."

if [ -f "railway.json" ]; then
    print_status "SUCCESS" "railway.json found"
else
    print_status "WARNING" "railway.json not found. Creating a new one..."
    
    # Create railway.json
    cat > railway.json << EOF
{
  "projectId": "",
  "services": [
    {
      "name": "custodial-command",
      "env": "production",
      "buildCommand": "npm run build",
      "startCommand": "npm start",
      "healthCheckPath": "/health"
    }
  ]
}
EOF
    print_status "SUCCESS" "Created railway.json"
fi

# Run pre-deployment checks
print_status "INFO" "Running pre-deployment checks..."

# Check for TypeScript errors
print_status "INFO" "Checking for TypeScript errors..."
if npm run check >/dev/null 2>&1; then
    print_status "SUCCESS" "No TypeScript errors found"
else
    print_status "ERROR" "TypeScript errors found. Please fix them before deploying."
    npm run check
    exit 1
fi

# Run build to ensure it works
print_status "INFO" "Building application..."
BUILD_OUTPUT=$(npm run build 2>&1)
if echo "$BUILD_OUTPUT" | grep -q "built in"; then
    print_status "SUCCESS" "Application built successfully"
else
    print_status "ERROR" "Build failed. Please check the build process."
    echo "$BUILD_OUTPUT"
    exit 1
fi

# Check environment variables
print_status "INFO" "Checking environment variables..."

# Check if DATABASE_URL is set
if [ -n "$DATABASE_URL" ] || grep -q "DATABASE_URL=" .env 2>/dev/null; then
    print_status "SUCCESS" "DATABASE_URL is set"
else
    print_status "WARNING" "DATABASE_URL not set. Please ensure it's set in Railway dashboard."
fi

# Check if ADMIN_USERNAME is set
if [ -n "$ADMIN_USERNAME" ] || grep -q "ADMIN_USERNAME=" .env 2>/dev/null; then
    print_status "SUCCESS" "ADMIN_USERNAME is set"
else
    print_status "WARNING" "ADMIN_USERNAME not set. Default will be 'admin'."
fi

# Check if ADMIN_PASSWORD is set
if [ -n "$ADMIN_PASSWORD" ] || grep -q "ADMIN_PASSWORD=" .env 2>/dev/null; then
    print_status "SUCCESS" "ADMIN_PASSWORD is set"
else
    print_status "WARNING" "ADMIN_PASSWORD not set. Please set it in Railway dashboard for security."
fi

# Check if SESSION_SECRET is set
if [ -n "$SESSION_SECRET" ] || grep -q "SESSION_SECRET=" .env 2>/dev/null; then
    print_status "SUCCESS" "SESSION_SECRET is set"
else
    print_status "WARNING" "SESSION_SECRET not set. A random one will be generated."
fi

# Prepare for deployment
print_status "INFO" "Preparing for deployment..."

# Show what will be deployed
echo ""
print_status "INFO" "Deployment Summary:"
print_status "INFO" "==================="
print_status "INFO" "Project directory: $(pwd)"
print_status "INFO" "Build directory: dist/"
print_status "INFO" "Public assets: dist/public/"
print_status "INFO" "Main entry point: dist/index.js"

# Check if there are uncommitted changes
if git status --porcelain >/dev/null 2>&1; then
    UNCOMMITTED_CHANGES=$(git status --porcelain | wc -l)
    if [ "$UNCOMMITTED_CHANGES" -gt 0 ]; then
        print_status "WARNING" "$UNCOMMITTED_CHANGES uncommitted changes found"
        git status --porcelain | head -5
        if [ "$UNCOMMITTED_CHANGES" -gt 5 ]; then
            echo "  ... and $(($UNCOMMITTED_CHANGES - 5)) more files"
        fi
        echo ""
        read -p "Continue with deployment anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "INFO" "Deployment cancelled by user"
            exit 0
        fi
    else
        print_status "SUCCESS" "No uncommitted changes"
    fi
else
    print_status "WARNING" "Not in a git repository"
fi

# Deployment confirmation
echo ""
print_status "INFO" "Ready to deploy to Railway!"
print_status "INFO" "============================"
print_status "INFO" "This will:"
print_status "INFO" "  - Build your application"
print_status "INFO" "  - Deploy to Railway"
print_status "INFO" "  - Start the server with your environment variables"

read -p "Proceed with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "INFO" "Deployment cancelled by user"
    exit 0
fi

# Deploy to Railway
print_status "INFO" "Starting deployment to Railway..."
print_status "INFO" "This may take a few minutes..."

# Run the deployment
DEPLOY_OUTPUT_FILE="/tmp/railway-deploy-output.log"
railway up >"$DEPLOY_OUTPUT_FILE" 2>&1 &
DEPLOY_PID=$!

# Show progress
while kill -0 $DEPLOY_PID 2>/dev/null; do
    echo -n "."
    sleep 2
done

echo ""

# Check deployment result
wait $DEPLOY_PID
DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    print_status "SUCCESS" "Deployment to Railway completed successfully!"
    
    # Show deployment URL if available
    DEPLOY_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.railway\.app' "$DEPLOY_OUTPUT_FILE" | head -1)
    if [ -n "$DEPLOY_URL" ]; then
        print_status "SUCCESS" "Your application is now available at: $DEPLOY_URL"
    fi
    
    # Show additional info
    echo ""
    print_status "INFO" "💡 Deployment Tips:"
    print_status "INFO" "1. Check your Railway dashboard for logs and monitoring"
    print_status "INFO" "2. Set environment variables in Railway dashboard if needed"
    print_status "INFO" "3. Monitor your application health at /health endpoint"
    print_status "INFO" "4. Check database connections and migrations if needed"
    
else
    print_status "ERROR" "Deployment to Railway failed!"
    print_status "ERROR" "Check the output below for details:"
    echo ""
    cat "$DEPLOY_OUTPUT_FILE"
    
    echo ""
    print_status "INFO" "💡 Troubleshooting Tips:"
    print_status "INFO" "1. Check Railway logs: railway logs"
    print_status "INFO" "2. Verify environment variables in Railway dashboard"
    print_status "INFO" "3. Check database connection settings"
    print_status "INFO" "4. Ensure all required dependencies are in package.json"
    print_status "INFO" "5. Check for any build errors in the output above"
fi

# Cleanup
rm -f "$DEPLOY_OUTPUT_FILE"

echo ""
print_status "SUCCESS" "Railway deployment script completed!"

exit $DEPLOY_EXIT_CODE