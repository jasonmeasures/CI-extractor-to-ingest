#!/bin/bash

# Polling Comparison Test
# Tests A79 polling behavior and compares with our implementation

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load environment variables
if [ -f "backend/.env" ]; then
    while IFS='=' read -r key value || [ -n "$key" ]; do
        case "$key" in
            \#*|"") continue ;;
        esac
        key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        export "$key=$value"
    done < backend/.env
fi

A79_API_KEY="${A79_API_KEY:-sk-a79-wvymMMk2FdgHPGBP9mGakuGLnc/FZg3i}"
A79_BASE_URL="${A79_BASE_URL:-https://klearnow.prod.a79.ai/api/v1/public/workflow}"

# Test run_id from previous test or argument
TEST_RUN_ID="${1:-b7395e3e-1103-47fd-bae6-20f3c1fd7585}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 A79 POLLING COMPARISON TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Using Run ID: $TEST_RUN_ID"
echo ""

# Our polling configuration
echo "📊 Our Polling Configuration:"
echo "  Interval: 5s"
echo "  Timeout: 30s per poll"
echo "  Max Attempts: 120 (10 minutes)"
echo "  Status Checks: completed, succeeded"
echo ""

# Polling endpoints to test
declare -a endpoints=(
  "Primary (with output_var)|${A79_BASE_URL}/${TEST_RUN_ID}/status?output_var=final_display_output"
  "Primary (without output_var)|${A79_BASE_URL}/${TEST_RUN_ID}/status"
  "Simple run status|${A79_BASE_URL}/run/${TEST_RUN_ID}"
  "Run ID only|${A79_BASE_URL}/${TEST_RUN_ID}"
)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TESTING POLLING ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for endpoint_info in "${endpoints[@]}"; do
  IFS='|' read -r name url <<< "$endpoint_info"
  
  echo "Testing: $name"
  echo "  URL: $url"
  
  response=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
    -X GET "$url" \
    -H "Authorization: Bearer $A79_API_KEY" \
    -H "Content-Type: application/json" \
    -H "Accept: */*" \
    --max-time 10 2>&1)
  
  http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
  time_total=$(echo "$response" | grep "TIME:" | cut -d: -f2)
  response_body=$(echo "$response" | sed '/HTTP_CODE:/d' | sed '/TIME:/d')
  
  if [ "$http_code" = "200" ]; then
    echo "  ${GREEN}✅ Status: $http_code${NC}"
    echo "  ⏱️  Duration: ${time_total}s"
    
    # Parse JSON response
    status=$(echo "$response_body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('status', 'N/A'))" 2>/dev/null || echo "N/A")
    run_id=$(echo "$response_body" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('run_id', 'N/A'))" 2>/dev/null || echo "N/A")
    nodes_count=$(echo "$response_body" | python3 -c "import sys, json; data=json.load(sys.stdin); nodes=data.get('nodes', []); print(len(nodes) if isinstance(nodes, list) else 0)" 2>/dev/null || echo "0")
    has_output=$(echo "$response_body" | python3 -c "import sys, json; data=json.load(sys.stdin); print('Yes' if data.get('output') else 'No')" 2>/dev/null || echo "N/A")
    
    echo "  📋 Response Status: $status"
    echo "  🔑 Run ID: $run_id"
    echo "  📦 Nodes: $nodes_count"
    echo "  📤 Has Output: $has_output"
    
    # Check node details
    if [ "$nodes_count" != "0" ]; then
      echo "  📋 Node Details:"
      echo "$response_body" | python3 -c "
import sys, json
data = json.load(sys.stdin)
nodes = data.get('nodes', [])
for i, node in enumerate(nodes, 1):
    name = node.get('name', 'Unknown')
    run_status = node.get('run_status', 'N/A')
    has_output = 'Yes' if node.get('output') else 'No'
    print(f'     {i}. {name}: {run_status} (output: {has_output})')
" 2>/dev/null || echo "     (Could not parse nodes)"
    fi
    
    # Check completion status
    if [ "$status" = "completed" ] || [ "$status" = "succeeded" ]; then
      echo "  ${GREEN}✅ Status indicates completion${NC}"
    elif [ "$status" = "running" ] || [ "$status" = "pending" ] || [ "$status" = "processing" ]; then
      echo "  ${YELLOW}⏳ Status indicates still processing${NC}"
    fi
    
  else
    echo "  ${RED}❌ Status: $http_code${NC}"
    if [ -n "$response_body" ]; then
      echo "  Response: $(echo "$response_body" | head -c 200)"
    fi
  fi
  
  echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 RECOMMENDATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Our Implementation Checks:"
echo "  ✅ Status: 'completed' or 'succeeded'"
echo "  ✅ Handles: 'running', 'pending', 'processing'"
echo "  ✅ Polls every 5 seconds"
echo "  ✅ Max 120 attempts (10 minutes)"
echo ""
echo "Key Findings:"
echo "  • Primary endpoint: ${A79_BASE_URL}/{run_id}/status?output_var=final_display_output"
echo "  • Status values: 'running', 'succeeded', 'completed'"
echo "  • Response structure: {status, run_id, nodes[], output}"
echo "  • Nodes contain workflow steps with run_status and output"
echo ""

