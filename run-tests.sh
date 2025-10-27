#!/bin/bash

# Comprehensive Test Runner for Custodial Command
# This script provides an easy way to run all tests with proper setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_URL=${TEST_URL:-"https://cacustodialcommand.up.railway.app"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"7lGaEWFy3bDbL5NUAxg7zHihLQzWMBHfYu4O/THc3BM="}

echo -e "${BLUE}🧪 Custodial Command Comprehensive Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "Testing against: ${YELLOW}${TEST_URL}${NC}"
echo -e "Start time: ${YELLOW}$(date)${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js to run tests.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm to run tests.${NC}"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not found. Installing...${NC}"
    npm install
fi

# Create tests directory if it doesn't exist
mkdir -p tests

# Set environment variables
export TEST_URL
export ADMIN_PASSWORD

# Function to run a test suite
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    local test_description="$3"
    
    echo -e "\n${BLUE}📋 Running ${test_name}${NC}"
    echo -e "${BLUE}Description: ${test_description}${NC}"
    echo -e "${BLUE}Command: ${test_command}${NC}"
    echo ""
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ ${test_name} completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ ${test_name} failed${NC}"
        return 1
    fi
}

# Parse command line arguments
case "${1:-all}" in
    "all"|"comprehensive")
        echo -e "${BLUE}🚀 Running Complete Test Suite${NC}"
        run_test_suite "Master Test Runner" "node tests/run-all-tests.cjs" "Complete test suite with all test types"
        ;;
    "api"|"forms")
        echo -e "${BLUE}🚀 Running API Tests${NC}"
        run_test_suite "Comprehensive API Tests" "node comprehensive-test.cjs" "Core API functionality and CRUD operations"
        ;;
    "e2e"|"journey")
        echo -e "${BLUE}🚀 Running End-to-End Tests${NC}"
        run_test_suite "End-to-End User Journey Tests" "node tests/e2e-user-journey.test.cjs" "Complete user workflows and business processes"
        ;;
    "performance"|"perf")
        echo -e "${BLUE}🚀 Running Performance Tests${NC}"
        run_test_suite "Performance Tests" "node tests/performance.test.cjs" "Response times, load handling, and system performance"
        ;;
    "security"|"sec")
        echo -e "${BLUE}🚀 Running Security Tests${NC}"
        run_test_suite "Security Tests" "node tests/security.test.cjs" "Input validation, authentication, and security vulnerabilities"
        ;;
    "mobile"|"pwa")
        echo -e "${BLUE}🚀 Running Mobile and PWA Tests${NC}"
        run_test_suite "Mobile and PWA Tests" "node tests/mobile-pwa.test.cjs" "Progressive Web App functionality and mobile responsiveness"
        ;;
    "health")
        echo -e "${BLUE}🚀 Running Health Check${NC}"
        run_test_suite "Health Check" "node comprehensive-test.cjs" "Basic server and database connectivity"
        ;;
    "help"|"-h"|"--help")
        echo -e "${BLUE}Custodial Command Test Runner${NC}"
        echo ""
        echo "Usage: $0 [test_type]"
        echo ""
        echo "Available test types:"
        echo "  all, comprehensive  - Run complete test suite (default)"
        echo "  api, forms          - Run API functionality tests"
        echo "  e2e, journey        - Run end-to-end user journey tests"
        echo "  performance, perf   - Run performance tests"
        echo "  security, sec       - Run security tests"
        echo "  mobile, pwa         - Run mobile and PWA tests"
        echo "  health              - Run basic health check"
        echo "  help                - Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  TEST_URL            - URL to test against (default: https://cacustodialcommand.up.railway.app)"
        echo "  ADMIN_PASSWORD      - Admin password for security tests"
        echo ""
        echo "Examples:"
        echo "  $0                  # Run all tests"
        echo "  $0 api              # Run only API tests"
        echo "  $0 performance      # Run only performance tests"
        echo "  TEST_URL=http://localhost:5000 $0  # Test against local server"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Unknown test type: $1${NC}"
        echo -e "Run '$0 help' for available options"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Test execution completed!${NC}"
echo -e "End time: ${YELLOW}$(date)${NC}"

# Check for test reports
echo ""
echo -e "${BLUE}📄 Test Reports Generated:${NC}"
for report in tests/*-report.json master-test-report.json test-report.json; do
    if [ -f "$report" ]; then
        echo -e "  ${GREEN}✅ $report${NC}"
    fi
done

echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo -e "  - Check the JSON report files for detailed results"
echo -e "  - Use 'npm run test:comprehensive' for the same functionality"
echo -e "  - Set TEST_URL environment variable to test different environments"
echo -e "  - Run individual test suites for faster feedback during development"
