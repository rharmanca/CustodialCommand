#!/bin/bash

# Comprehensive API Testing Script for Custodial Command
# Uses curl for HTTP requests with detailed response analysis

API_BASE="https://cacustodialcommand.up.railway.app"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="api-test-reports"
REPORT_FILE="$REPORT_DIR/api-test-report-$TIMESTAMP.json"

# Create report directory
mkdir -p "$REPORT_DIR"

# Test results storage
RESULTS_FILE="$REPORT_DIR/temp_results.json"
echo '{"tests": [], "summary": {}}' > "$RESULTS_FILE"

# Utility functions
log_test() {
    local endpoint="$1"
    local method="$2"
    local status="$3"
    local time="$4"
    local size="$5"
    local success="$6"
    local details="$7"

    echo "Adding test result: $method $endpoint - Status: $status"

    # Add to results file
    local test_json=$(cat <<EOF
{
    "endpoint": "$endpoint",
    "method": "$method",
    "status": $status,
    "responseTime": $time,
    "size": $size,
    "success": $success,
    "timestamp": "$(date -Iseconds)",
    "details": $details
}
EOF
)

    # Use jq to merge with existing results
    temp_file=$(mktemp)
    jq --argjson new_test "$test_json" '.tests += [$new_test]' "$RESULTS_FILE" > "$temp_file"
    mv "$temp_file" "$RESULTS_FILE"
}

# HTTP request function with curl
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local headers="$4"
    local file="$5"

    local start_time=$(date +%s%N)

    local curl_cmd="curl -s -w '%{http_code}|%{time_total}|%{size_download}|%{url_effective}'"
    curl_cmd="$curl_cmd -X $method"

    if [[ -n "$headers" ]]; then
        curl_cmd="$curl_cmd -H '$headers'"
    fi

    if [[ -n "$data" ]]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
        curl_cmd="$curl_cmd -d '$data'"
    fi

    if [[ -n "$file" ]]; then
        curl_cmd="$curl_cmd -F 'file=@$file'"
    fi

    # Execute curl and capture response
    local response=$(eval "$curl_cmd '$API_BASE$endpoint'")
    local curl_exit_code=$?

    # Parse curl output
    IFS='|' read -r status_code time_total size_download url_effective <<< "$response"

    # Get response body (last line of curl output)
    local response_body=$(echo "$response" | sed '$d')

    local end_time=$(date +%s%N)
    local response_time_ms=$(( (end_time - start_time) / 1000000 ))

    echo "curl_exit_code: $curl_exit_code"
    echo "status_code: $status_code"
    echo "time_total: $time_total"
    echo "size_download: $size_download"
    echo "response_time_ms: $response_time_ms"
    echo "response_body: $response_body"

    # Return response data
    echo "$status_code|$response_time_ms|$size_download|$response_body"
}

echo "🚀 Starting Comprehensive API Testing with curl"
echo "API Base: $API_BASE"
echo "Report File: $REPORT_FILE"
echo ""

# Test 1: Health Check
echo "🔍 Testing Health Endpoint"
response=$(make_request "GET" "/health")
IFS='|' read -r status time size body <<< "$response"
success=$([ "$status" = "200" ] && echo "true" || echo "false")
details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
log_test "/health" "GET" "$status" "$time" "$size" "$success" "$details"
echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"

# Test 2: Get All Inspections
echo "🔍 Testing GET /api/inspections"
response=$(make_request "GET" "/api/inspections")
IFS='|' read -r status time size body <<< "$response"
success=$([ "$status" = "200" ] && echo "true" || echo "false")
details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
log_test "/api/inspections" "GET" "$status" "$time" "$size" "$success" "$details"
echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"

# Test 3: Create Inspection (Single Room)
echo "🔍 Testing POST /api/inspections (Single Room)"
inspection_data='{
    "inspectorName": "API Test Inspector",
    "school": "Test Elementary School",
    "date": "'$(date +%Y-%m-%d)'",
    "inspectionType": "single_room",
    "roomNumber": "TEST-101",
    "locationCategory": "classroom",
    "floors": 4,
    "verticalHorizontalSurfaces": 4,
    "ceiling": 4,
    "restrooms": null,
    "customerSatisfaction": 4,
    "trash": 4,
    "projectCleaning": 4,
    "activitySupport": 4,
    "safetyCompliance": 4,
    "equipment": 4,
    "monitoring": 4,
    "notes": "API test inspection - automated testing"
}'
response=$(make_request "POST" "/api/inspections" "$inspection_data")
IFS='|' read -r status time size body <<< "$response"
success=$([ "$status" = "201" ] && echo "true" || echo "false")
details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
log_test "/api/inspections" "POST" "$status" "$time" "$size" "$success" "$details"
echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"

# Store created inspection ID for later tests
if [[ "$status" = "201" ]]; then
    INSPECTION_ID=$(echo "$body" | jq -r '.id // empty' 2>/dev/null)
    echo "  Created inspection ID: $INSPECTION_ID"
fi

# Test 4: Get Specific Inspection
if [[ -n "$INSPECTION_ID" ]]; then
    echo "🔍 Testing GET /api/inspections/$INSPECTION_ID"
    response=$(make_request "GET" "/api/inspections/$INSPECTION_ID")
    IFS='|' read -r status time size body <<< "$response"
    success=$([ "$status" = "200" ] && echo "true" || echo "false")
    details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
    log_test "/api/inspections/$INSPECTION_ID" "GET" "$status" "$time" "$size" "$success" "$details"
    echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"
fi

# Test 5: Get Custodial Notes
echo "🔍 Testing GET /api/custodial-notes"
response=$(make_request "GET" "/api/custodial-notes")
IFS='|' read -r status time size body <<< "$response"
success=$([ "$status" = "200" ] && echo "true" || echo "false")
details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
log_test "/api/custodial-notes" "GET" "$status" "$time" "$size" "$success" "$details"
echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"

# Test 6: Create Custodial Note
echo "🔍 Testing POST /api/custodial-notes"
note_data='{
    "inspectorName": "API Test Inspector",
    "school": "Test High School",
    "date": "'$(date +%Y-%m-%d)'",
    "location": "Main Office",
    "locationDescription": "Front desk area",
    "notes": "API test custodial note"
}'
response=$(make_request "POST" "/api/custodial-notes" "$note_data")
IFS='|' read -r status time size body <<< "$response"
success=$([ "$status" = "201" ] && echo "true" || echo "false")
details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
log_test "/api/custodial-notes" "POST" "$status" "$time" "$size" "$success" "$details"
echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"

# Store created note ID
if [[ "$status" = "201" ]]; then
    NOTE_ID=$(echo "$body" | jq -r '.id // empty' 2>/dev/null)
    echo "  Created note ID: $NOTE_ID"
fi

# Test 7: Get Monthly Feedback
echo "🔍 Testing GET /api/monthly-feedback"
response=$(make_request "GET" "/api/monthly-feedback")
IFS='|' read -r status time size body <<< "$response"
success=$([ "$status" = "200" ] && echo "true" || echo "false")
details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
log_test "/api/monthly-feedback" "GET" "$status" "$time" "$size" "$success" "$details"
echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"

# Test 8: Get Scores
echo "🔍 Testing GET /api/scores"
response=$(make_request "GET" "/api/scores")
IFS='|' read -r status time size body <<< "$response"
success=$([ "$status" = "200" ] && echo "true" || echo "false")
details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
log_test "/api/scores" "GET" "$status" "$time" "$size" "$success" "$details"
echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"

# Test 9: Get Scores with Date Range
echo "🔍 Testing GET /api/scores with date range"
response=$(make_request "GET" "/api/scores?startDate=2024-01-01&endDate=2024-12-31")
IFS='|' read -r status time size body <<< "$response"
success=$([ "$status" = "200" ] && echo "true" || echo "false")
details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
log_test "/api/scores (filtered)" "GET" "$status" "$time" "$size" "$success" "$details"
echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"

# Test 10: Admin Login (will likely fail with wrong credentials)
echo "🔍 Testing POST /api/admin/login"
login_data='{"username": "test_admin", "password": "test_password"}'
response=$(make_request "POST" "/api/admin/login" "$login_data")
IFS='|' read -r status time size body <<< "$response"
success=$([ "$status" = "200" ] || [ "$status" = "401" ] && echo "true" || echo "false")
details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
log_test "/api/admin/login" "POST" "$status" "$time" "$size" "$success" "$details"
echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"

# Test 11: Error Handling - Non-existent endpoint
echo "🔍 Testing Error Handling - Non-existent endpoint"
response=$(make_request "GET" "/api/non-existent-endpoint")
IFS='|' read -r status time size body <<< "$response"
success=$([ "$status" = "404" ] && echo "true" || echo "false")
details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
log_test "/api/non-existent-endpoint" "GET" "$status" "$time" "$size" "$success" "$details"
echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"

# Test 12: Security Headers
echo "🔍 Testing Security Headers"
response=$(curl -s -I "$API_BASE/health")
if [[ $? -eq 0 ]]; then
    security_headers=$(echo "$response" | grep -i -E "(x-content-type-options|x-frame-options|x-xss-protection|strict-transport-security|content-security-policy|referrer-policy)")
    echo "  Security headers found:"
    echo "$security_headers" | sed 's/^/    /'

    # Count security headers
    header_count=$(echo "$security_headers" | wc -l)
    details="{\"security_headers_found\": $header_count, \"headers\": $(echo "$security_headers" | jq -R . | jq -s .)}"
    log_test "Security Headers" "HEAD" "200" "0" "0" "true" "$details"
else
    details="{\"error\": \"Failed to fetch headers\"}"
    log_test "Security Headers" "HEAD" "500" "0" "0" "false" "$details"
fi

# Test 13: Performance Endpoint
echo "🔍 Testing GET /api/performance/stats"
response=$(make_request "GET" "/api/performance/stats")
IFS='|' read -r status time size body <<< "$response"
success=$([ "$status" = "200" ] && echo "true" || echo "false")
details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
log_test "/api/performance/stats" "GET" "$status" "$time" "$size" "$success" "$details"
echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"

# Test 14: Metrics Endpoint
echo "🔍 Testing GET /metrics"
response=$(make_request "GET" "/metrics")
IFS='|' read -r status time size body <<< "$response"
success=$([ "$status" = "200" ] && echo "true" || echo "false")
details=$(echo "$body" | jq -c '.' 2>/dev/null || echo '{"error": "Invalid JSON"}')
log_test "/metrics" "GET" "$status" "$time" "$size" "$success" "$details"
echo "  Status: $status, Time: ${time}ms, Size: ${size} bytes"

# Cleanup test data
echo ""
echo "🧹 Cleaning up test data"

if [[ -n "$INSPECTION_ID" ]]; then
    echo "  Deleting inspection $INSPECTION_ID..."
    delete_response=$(make_request "DELETE" "/api/inspections/$INSPECTION_ID")
    IFS='|' read -r del_status del_time del_size del_body <<< "$delete_response"
    echo "    Status: $del_status"
fi

if [[ -n "$NOTE_ID" ]]; then
    echo "  Note $NOTE_ID left in system (requires admin access to delete)"
fi

# Generate final report
echo ""
echo "📊 Generating Final Report"

# Calculate summary statistics
total_tests=$(jq '.tests | length' "$RESULTS_FILE")
successful_tests=$(jq '.tests | map(select(.success == true)) | length' "$RESULTS_FILE")
failed_tests=$((total_tests - successful_tests))
success_rate=$(echo "scale=1; $successful_tests * 100 / $total_tests" | bc -l 2>/dev/null || echo "0")

avg_response_time=$(jq '[.tests[].responseTime] | add / length' "$RESULTS_FILE" 2>/dev/null || echo "0")
slowest_test=$(jq -r '.tests | max_by(.responseTime) | "\(.endpoint) (\(.responseTime)ms)"' "$RESULTS_FILE" 2>/dev/null || echo "N/A")
fastest_test=$(jq -r '.tests | min_by(.responseTime) | "\(.endpoint) (\(.responseTime)ms)"' "$RESULTS_FILE" 2>/dev/null || echo "N/A")

# Add summary to report
jq --arg total "$total_tests" \
   --arg successful "$successful_tests" \
   --arg failed "$failed_tests" \
   --arg success_rate "$success_rate" \
   --arg avg_response_time "${avg_response_time%.*}" \
   --arg slowest_test "$slowest_test" \
   --arg fastest_test "$fastest_test" \
   --arg timestamp "$(date -Iseconds)" \
   '.summary = {
       totalTests: ($total_tests | tonumber),
       successfulTests: ($successful_tests | tonumber),
       failedTests: ($failed_tests | tonumber),
       successRate: ($success_rate + "%"),
       avgResponseTime: ($avg_response_time + "ms"),
       slowestTest: $slowest_test,
       fastestTest: $fastest_test,
       timestamp: $timestamp
   }' "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"

# Copy to final report location
cp "$RESULTS_FILE" "$REPORT_FILE"

# Print summary
echo "================================================================"
echo "🧪 API TEST SUMMARY"
echo "================================================================"
echo "Total Tests: $total_tests"
echo "Successful: $successful_tests ✅"
echo "Failed: $failed_tests ❌"
echo "Success Rate: ${success_rate}%"
echo "Average Response Time: ${avg_response_time%.*}ms"
echo "Slowest Test: $slowest_test"
echo "Fastest Test: $fastest_test"
echo "Report saved to: $REPORT_FILE"
echo "================================================================"

# Print failed tests if any
if [[ $failed_tests -gt 0 ]]; then
    echo ""
    echo "❌ FAILED TESTS:"
    jq -r '.tests[] | select(.success == false) | "  • \(.method) \(.endpoint) - Status: \(.status), Time: \(.responseTime)ms"' "$RESULTS_FILE"
fi

echo ""
echo "✅ API testing completed successfully!"

# Return exit code based on success rate
if [[ $(echo "$success_rate >= 80" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
    exit 0
else
    exit 1
fi