#!/bin/bash

# Run All Tests
# Executes all test scripts in sequence

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 RUNNING ALL TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$(dirname "$0")"
cd ..

# Test 1: Direct A79 API Test
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}TEST 1: Direct A79 API Test${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ -f "test/test_a79_direct.sh" ]; then
    bash test/test_a79_direct.sh
else
    echo "${YELLOW}⚠️  test_a79_direct.sh not found${NC}"
fi
echo ""

# Test 2: Request Format Comparison
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}TEST 2: Request Format Comparison${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ -f "test/compare_request_format.js" ]; then
    node test/compare_request_format.js
else
    echo "${YELLOW}⚠️  compare_request_format.js not found${NC}"
fi
echo ""

# Test 3: Response Parsing Test
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}TEST 3: Response Parsing Test${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ -f "test/test_response_parsing.js" ]; then
    node test/test_response_parsing.js
else
    echo "${YELLOW}⚠️  test_response_parsing.js not found${NC}"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL TESTS COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "  1. Review test results above"
echo "  2. Check test/request_payload.json for request format"
echo "  3. Check test/response.json for A79 response"
echo "  4. Compare with Clear Audit 7501 if issues persist"
echo ""

