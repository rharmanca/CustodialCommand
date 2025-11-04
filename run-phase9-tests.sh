#!/bin/bash

# Phase 9 Feature Testing Script
# Runs Playwright tests for all 5 Speed & Efficiency features

echo "🚀 Starting Phase 9 Speed & Efficiency Feature Tests"
echo "=================================================="
echo ""
echo "Testing features on: https://cacustodialcommand.up.railway.app/"
echo ""

# Create test-results directory if it doesn't exist
mkdir -p test-results

# Run the Playwright tests
npx playwright test test-phase9-features.spec.ts --headed

# Check if tests passed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All Phase 9 tests PASSED!"
    echo ""
    echo "Screenshots saved to test-results/:"
    ls -lh test-results/phase9-*.png 2>/dev/null
else
    echo ""
    echo "❌ Some tests FAILED. Check output above for details."
    echo ""
    echo "Screenshots (if any) saved to test-results/:"
    ls -lh test-results/phase9-*.png 2>/dev/null
fi

echo ""
echo "=================================================="
echo "Testing complete!"
