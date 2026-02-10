#!/bin/bash
# Performance Testing Script for Custodial Command API
# Usage: ./performance-test.sh [BASE_URL]

BASE_URL=${1:-"https://cacustodialcommand.up.railway.app"}
ITERATIONS=5

echo "=================================="
echo "Performance Testing Script"
echo "Base URL: $BASE_URL"
echo "Iterations per endpoint: $ITERATIONS"
echo "=================================="
echo ""

# Create curl format file for timing
cat > /tmp/curl-format.txt << 'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local total_time=0
    local min_time=999999
    local max_time=0

    echo "Testing: $name"
    echo "URL: $url"
    echo "---"

    for i in $(seq 1 $ITERATIONS); do
        # Get total time from curl
        response_time=$(curl -w "%{time_total}" -o /dev/null -s "$url" 2>/dev/null)

        if [ -n "$response_time" ]; then
            # Convert to milliseconds (bash arithmetic)
            time_ms=$(echo "$response_time * 1000" | bc -l 2>/dev/null || echo "0")
            time_ms_int=${time_ms%.*}

            total_time=$(echo "$total_time + $time_ms_int" | bc 2>/dev/null || echo "$total_time")

            if [ "$time_ms_int" -lt "$min_time" ]; then
                min_time=$time_ms_int
            fi

            if [ "$time_ms_int" -gt "$max_time" ]; then
                max_time=$time_ms_int
            fi

            echo "  Run $i: ${time_ms_int}ms"
        else
            echo "  Run $i: FAILED"
        fi

        # Small delay between requests
        sleep 0.5
    done

    # Calculate average
    if [ "$ITERATIONS" -gt 0 ] && [ "$total_time" -gt 0 ]; then
        avg_time=$(echo "$total_time / $ITERATIONS" | bc -l 2>/dev/null || echo "0")
        avg_time_int=${avg_time%.*}
        echo "  Average: ${avg_time_int}ms | Min: ${min_time}ms | Max: ${max_time}ms"
    else
        echo "  No valid responses"
    fi
    echo ""
}

# Test endpoints
echo "=== Baseline Endpoints ==="
test_endpoint "Health Check" "$BASE_URL/api/health"

echo "=== Optimized Endpoints ==="
test_endpoint "Room Inspections (paginated, default)" "$BASE_URL/api/room-inspections"
test_endpoint "Room Inspections (paginated, limit=20)" "$BASE_URL/api/room-inspections?limit=20"
test_endpoint "Room Inspections (filtered)" "$BASE_URL/api/room-inspections?roomType=classroom"

test_endpoint "Inspections (paginated, default)" "$BASE_URL/api/inspections"
test_endpoint "Inspections (paginated, limit=20)" "$BASE_URL/api/inspections?limit=20"
test_endpoint "Inspections (filtered)" "$BASE_URL/api/inspections?school=Livingston"

test_endpoint "Monthly Feedback (paginated)" "$BASE_URL/api/monthly-feedback"
test_endpoint "Custodial Notes (paginated)" "$BASE_URL/api/custodial-notes"

echo "=== Single Record Endpoints ==="
test_endpoint "Single Room Inspection" "$BASE_URL/api/room-inspections/1"
test_endpoint "Single Inspection" "$BASE_URL/api/inspections/1"

echo "=================================="
echo "Performance Testing Complete"
echo "=================================="

# Cleanup
rm -f /tmp/curl-format.txt
