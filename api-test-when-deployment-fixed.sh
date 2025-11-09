#!/bin/bash

# API Testing Script for Custodial Command
# Run this script when the Railway deployment is fixed

API_BASE="https://cacustodialcommand.up.railway.app"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
REPORT_FILE="api-test-results-$(date +%Y%m%d_%H%M%S).log"

echo "========================================="
echo "Custodial Command API Testing"
echo "Timestamp: $TIMESTAMP"
echo "API Base: $API_BASE"
echo "========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local description="$4"

    echo "Testing: $description"
    echo "Method: $method $endpoint"

    if [[ -n "$data" ]]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}\nSIZE:%{size_download}" \
                  -X "$method" \
                  -H "Content-Type: application/json" \
                  -d "$data" \
                  "$API_BASE$endpoint")
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}\nSIZE:%{size_download}" \
                  -X "$method" \
                  "$API_BASE$endpoint")
    fi

    # Extract status code and response time
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    time_total=$(echo "$response" | grep "TIME:" | cut -d: -f2)
    size_download=$(echo "$response" | grep "SIZE:" | cut -d: -f2)

    # Extract response body
    body=$(echo "$response" | sed '/HTTP_CODE:/,$d')

    echo "Status: $http_code"
    echo "Response Time: ${time_total}s"
    echo "Size: $size_download bytes"
    echo "Response: ${body:0:200}..."
    echo "---"

    # Log to file
    echo "[$TIMESTAMP] $method $endpoint - Status: $http_code, Time: ${time_total}s" >> "$REPORT_FILE"
    echo "$body" >> "$REPORT_FILE"
    echo "---" >> "$REPORT_FILE"
}

# Test Data
INSPECTION_DATA='{
    "inspectorName": "API Test Inspector",
    "school": "Test Elementary School",
    "date": "'$(date +%Y-%m-%d)'",
    "inspectionType": "single_room",
    "roomNumber": "TEST-101",
    "locationCategory": "classroom",
    "floors": 4,
    "verticalHorizontalSurfaces": 4,
    "ceiling": 4,
    "customerSatisfaction": 4,
    "trash": 4,
    "projectCleaning": 4,
    "activitySupport": 4,
    "safetyCompliance": 4,
    "equipment": 4,
    "monitoring": 4,
    "notes": "API test inspection"
}'

NOTE_DATA='{
    "inspectorName": "API Test Inspector",
    "school": "Test High School",
    "date": "'$(date +%Y-%m-%d)'",
    "location": "Main Office",
    "locationDescription": "Front desk area",
    "notes": "API test custodial note"
}'

LOGIN_DATA='{
    "username": "test_admin",
    "password": "test_password"
}'

# Core Tests
echo "=== CORE APPLICATION TESTS ==="
test_endpoint "GET" "/health" "" "Health Check"
test_endpoint "GET" "/metrics" "" "Metrics Endpoint"

# Inspection Tests
echo "=== INSPECTION TESTS ==="
test_endpoint "GET" "/api/inspections" "" "Get All Inspections"
test_endpoint "POST" "/api/inspections" "$INSPECTION_DATA" "Create Single Room Inspection"

# Custodial Notes Tests
echo "=== CUSTODIAL NOTES TESTS ==="
test_endpoint "GET" "/api/custodial-notes" "" "Get All Custodial Notes"
test_endpoint "POST" "/api/custodial-notes" "$NOTE_DATA" "Create Custodial Note"

# Analytics Tests
echo "=== ANALYTICS TESTS ==="
test_endpoint "GET" "/api/scores" "" "Get All Scores"
test_endpoint "GET" "/api/scores?startDate=2024-01-01&endDate=2024-12-31" "" "Get Scores with Date Range"

# Monthly Feedback Tests
echo "=== MONTHLY FEEDBACK TESTS ==="
test_endpoint "GET" "/api/monthly-feedback" "" "Get Monthly Feedback"
test_endpoint "GET" "/api/monthly-feedback?school=Test%20School&year=2024&month=October" "" "Get Filtered Feedback"

# Admin Tests
echo "=== ADMIN TESTS ==="
test_endpoint "POST" "/api/admin/login" "$LOGIN_DATA" "Admin Login"

# Error Handling Tests
echo "=== ERROR HANDLING TESTS ==="
test_endpoint "GET" "/api/non-existent-endpoint" "" "404 Not Found"
test_endpoint "GET" "/api/inspections/999999" "" "Non-existent Inspection"
test_endpoint "POST" "/api/inspections" '{"invalid": "json"}' "Invalid JSON"

# Security Headers Test
echo "=== SECURITY HEADERS TEST ==="
echo "Checking security headers..."
headers=$(curl -s -I "$API_BASE/health")
echo "$headers"
echo ""

# Performance Test
echo "=== PERFORMANCE TEST ==="
echo "Running 10 concurrent requests..."
start_time=$(date +%s.%N)

for i in {1..10}; do
    curl -s "$API_BASE/health" > /dev/null &
done
wait

end_time=$(date +%s.%N)
total_time=$(echo "$end_time - $start_time" | bc)
echo "10 concurrent requests completed in ${total_time}s"

echo ""
echo "========================================="
echo "API Testing Complete"
echo "Results saved to: $REPORT_FILE"
echo "========================================="

# Summary
total_tests=$(grep -c "HTTP_CODE:" "$REPORT_FILE")
successful_tests=$(grep "HTTP_CODE: 2[0-9][0-9]" "$REPORT_FILE" | wc -l)
failed_tests=$((total_tests - successful_tests))

echo "SUMMARY:"
echo "Total Tests: $total_tests"
echo "Successful: $successful_tests"
echo "Failed: $failed_tests"

if [[ $successful_tests -gt 0 ]]; then
    success_rate=$(echo "scale=1; $successful_tests * 100 / $total_tests" | bc)
    echo "Success Rate: ${success_rate}%"
fi

echo ""
echo "🔍 Review the log file for detailed results: $REPORT_FILE"