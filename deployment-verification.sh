#!/bin/bash

# Deployment Verification Script for Custodial Command
# This script verifies that the application has been built and deployed correctly

echo "🔍 Deployment Verification for Custodial Command"
echo "==================================================="

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

# Check Node.js version
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "SUCCESS" "Node.js $NODE_VERSION available"
else
    print_status "ERROR" "Node.js not found. Please install Node.js to run this application."
    exit 1
fi

# Check if build directory exists
print_status "INFO" "Checking build artifacts..."

if [ -d "dist" ]; then
    print_status "SUCCESS" "dist directory found"
    
    # Check if dist/index.js exists
    if [ -f "dist/index.js" ]; then
        print_status "SUCCESS" "dist/index.js found ($(du -h dist/index.js | cut -f1))"
    else
        print_status "ERROR" "dist/index.js not found"
    fi
    
    # Check if public directory exists
    if [ -d "dist/public" ]; then
        print_status "SUCCESS" "dist/public directory found"
        
        # Check key files
        if [ -f "dist/public/index.html" ]; then
            print_status "SUCCESS" "dist/public/index.html found"
        else
            print_status "WARNING" "dist/public/index.html not found"
        fi
    else
        print_status "WARNING" "dist/public directory not found"
    fi
else
    print_status "ERROR" "dist directory not found. Please run 'npm run build' first."
    exit 1
fi

# Check if database URL is set (required for the app to start)
print_status "INFO" "Checking environment variables..."
if [ -f ".env" ]; then
    print_status "SUCCESS" ".env file found"
    
    if grep -q "DATABASE_URL=" .env; then
        print_status "SUCCESS" "DATABASE_URL found in .env file"
    else
        print_status "WARNING" "DATABASE_URL not found in .env file (required for database operations)"
    fi
else
    print_status "WARNING" ".env file not found (create one with DATABASE_URL for database operations)"
fi

# Check build process
print_status "INFO" "Verifying build process..."

# Run TypeScript check to ensure types are correct
print_status "INFO" "Running TypeScript check..."
if npm run check >/dev/null 2>&1; then
    print_status "SUCCESS" "TypeScript check passed"
else
    print_status "ERROR" "TypeScript check failed"
fi

# Run build to ensure it still works
print_status "INFO" "Testing build process..."
BUILD_OUTPUT=$(npm run build 2>&1)
if echo "$BUILD_OUTPUT" | grep -q "built in"; then
    print_status "SUCCESS" "Build process completed successfully"
else
    print_status "ERROR" "Build process failed"
    echo "$BUILD_OUTPUT"
fi

# Check dependencies
print_status "INFO" "Checking dependencies..."
REQUIRED_PACKAGES=("express" "react" "drizzle-orm" "zod")
MISSING_PACKAGES=()

for PACKAGE in "${REQUIRED_PACKAGES[@]}"; do
    if npm list "$PACKAGE" >/dev/null 2>&1; then
        print_status "SUCCESS" "Dependency $PACKAGE found"
    else
        print_status "WARNING" "Dependency $PACKAGE not found"
        MISSING_PACKAGES+=("$PACKAGE")
    fi
done

# Summary
echo ""
echo "📊 Deployment Verification Summary"
echo "=================================="

if [ ${#MISSING_PACKAGES[@]} -eq 0 ]; then
    print_status "SUCCESS" "All required dependencies are present"
else
    print_status "WARNING" "${#MISSING_PACKAGES[@]} dependencies are missing or not properly installed"
fi

# Check for common deployment issues
print_status "INFO" "Checking for common deployment issues..."

# Check if there are any TypeScript errors
TS_ERRORS=$(npm run check 2>&1 | grep -c "TS[0-9]" || true)
if [ "$TS_ERRORS" -eq 0 ]; then
    print_status "SUCCESS" "No TypeScript errors found"
else
    print_status "WARNING" "$TS_ERRORS TypeScript errors found"
fi

# Check if there are any missing type definitions
MISSING_TYPES=$(npm run check 2>&1 | grep -c "Cannot find module" || true)
if [ "$MISSING_TYPES" -eq 0 ]; then
    print_status "SUCCESS" "All type definitions are available"
else
    print_status "WARNING" "$MISSING_TYPES missing type definitions found"
fi

echo ""
print_status "INFO" "💡 Recommendations:"
print_status "INFO" "1. Ensure DATABASE_URL is properly set in your environment"
print_status "INFO" "2. If deploying to Railway, verify environment variables are set in the dashboard"
print_status "INFO" "3. Test the application locally with 'npm start' before deploying"
print_status "INFO" "4. Check Railway logs if deployment still fails"

echo ""
print_status "SUCCESS" "Deployment verification completed!"
echo "You can now deploy to Railway with 'railway up' or use the Railway dashboard."

exit 0