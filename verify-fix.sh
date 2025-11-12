#!/bin/bash

echo "🔍 Verifying React Scheduler Fix"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Ultimate patch exists
echo -n "1. Checking ultimate patch exists... "
if [ -f "patch-bundle-ultimate.cjs" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   ERROR: patch-bundle-ultimate.cjs not found!"
    exit 1
fi

# Check 2: package.json uses ultimate patch
echo -n "2. Checking package.json postbuild script... "
if grep -q "patch-bundle-ultimate.cjs" package.json; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   ERROR: package.json doesn't use ultimate patch!"
    exit 1
fi

# Check 3: Build directory exists
echo -n "3. Checking build directory... "
if [ -d "dist/public/assets" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} Build directory not found (run npm run build)"
fi

# Check 4: Bundle exists
echo -n "4. Checking for bundle file... "
BUNDLE=$(ls dist/public/assets/index-*.js 2>/dev/null | head -1)
if [ -n "$BUNDLE" ]; then
    echo -e "${GREEN}✓${NC}"
    echo "   Found: $(basename $BUNDLE)"
    
    # Check 5: Verify patches in bundle
    echo -n "5. Checking for eager initialization in bundle... "
    if grep -q "Eagerly initialized" "$BUNDLE"; then
        echo -e "${GREEN}✓${NC}"
        COUNT=$(grep -c "Eagerly initialized" "$BUNDLE")
        echo "   Found $COUNT eager initialization calls"
    else
        echo -e "${RED}✗${NC}"
        echo "   ERROR: Eager initialization not found in bundle!"
        echo "   Run: npm run build"
        exit 1
    fi
    
    # Check 6: Verify safety wrappers
    echo -n "6. Checking for safety wrappers... "
    if grep -q "__REACT_SCHEDULER_EXPORTS__" "$BUNDLE"; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC} Safety wrappers not found"
    fi
    
    # Check 7: Bundle size
    echo -n "7. Checking bundle size... "
    SIZE=$(wc -c < "$BUNDLE" | tr -d ' ')
    SIZE_MB=$(echo "scale=2; $SIZE / 1024 / 1024" | bc)
    echo -e "${GREEN}${SIZE_MB}MB${NC}"
    
else
    echo -e "${YELLOW}⚠${NC} No bundle found (run npm run build)"
fi

echo ""
echo "================================="
echo -e "${GREEN}✅ Verification Complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run: npm run build"
echo "  2. Test locally: npm start"
echo "  3. Deploy: git push origin main"
echo ""
