#!/bin/bash

# Test script using the specific PDF file
# Tests the exact file the user wants to process

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📤 Testing Specific PDF File${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# PDF file path
TEST_PDF="$PROJECT_ROOT/CI from EFP-2513059-7.pdf"

if [ ! -f "$TEST_PDF" ]; then
    echo -e "${RED}❌ PDF file not found: $TEST_PDF${NC}"
    exit 1
fi

echo "📄 PDF File: $TEST_PDF"
echo "   Size: $(ls -lh "$TEST_PDF" | awk '{print $5}')"
echo ""

# Load environment variables
if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    echo "📋 Loading environment variables..."
    while IFS='=' read -r key value || [ -n "$key" ]; do
        case "$key" in
            \#*|"") continue ;;
        esac
        key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        export "$key=$value"
    done < "$PROJECT_ROOT/backend/.env"
    echo "✅ Environment variables loaded"
else
    echo -e "${RED}❌ backend/.env file not found${NC}"
    exit 1
fi

# Check required variables
if [ -z "$A79_API_KEY" ]; then
    echo -e "${RED}❌ A79_API_KEY not set in .env${NC}"
    exit 1
fi

AGENT_NAME="${A79_AGENT_NAME:-Unified PDF Parser}"
ENDPOINT="${A79_API_ENDPOINT:-https://klearnow.prod.a79.ai/api/v1/public/workflow/run}"

echo "🔧 Configuration:"
echo "   Endpoint: $ENDPOINT"
echo "   Agent: $AGENT_NAME"
echo "   API Key: ${A79_API_KEY:0:15}... (length: ${#A79_API_KEY})"
echo ""

# Convert PDF to base64
echo "📄 Converting PDF to base64..."
BASE64_PDF=$(base64 -i "$TEST_PDF" 2>/dev/null || base64 "$TEST_PDF" 2>/dev/null)
if [ -z "$BASE64_PDF" ]; then
    echo -e "${RED}❌ Failed to convert PDF to base64${NC}"
    exit 1
fi

echo "✅ PDF converted (${#BASE64_PDF} characters)"
echo ""

# Build request payload
PAYLOAD=$(cat <<EOF
{
  "agent_name": "$AGENT_NAME",
  "agent_inputs": {
    "pdf_document": "$BASE64_PDF",
    "custom_instructions": "Extract all line items from this commercial invoice. Return as JSON array."
  }
}
EOF
)

# Save payload for inspection
echo "$PAYLOAD" > test/test_specific_pdf_payload.json
echo "💾 Request payload saved to: test/test_specific_pdf_payload.json"
echo "   Payload size: $(echo "$PAYLOAD" | wc -c | tr -d ' ') bytes"
echo ""

# Send request to A79 API using stdin (like our backend code)
echo "📤 Sending request to A79 API (using stdin)..."
echo ""

RESPONSE=$(echo "$PAYLOAD" | curl -s -w "\n%{http_code}" \
  -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $A79_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: */*" \
  --data @- \
  --max-time 30)

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📥 Response:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ HTTP Status: $HTTP_CODE OK${NC}"
    echo ""
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    
    # Extract run_id if present
    RUN_ID=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('run_id', 'NOT FOUND'))" 2>/dev/null || echo "NOT FOUND")
    
    if [ "$RUN_ID" != "NOT FOUND" ] && [ -n "$RUN_ID" ]; then
        echo ""
        echo -e "${GREEN}✅ Run ID: $RUN_ID${NC}"
        echo ""
        echo "🔗 Check in A79 Dashboard:"
        echo "   https://klearnow.prod.a79.ai/workflow/runs/$RUN_ID"
        echo ""
        echo "📊 Status endpoint:"
        echo "   https://klearnow.prod.a79.ai/api/v1/public/workflow/$RUN_ID/status?output_var=final_display_output"
    fi
else
    echo -e "${RED}❌ HTTP Status: $HTTP_CODE${NC}"
    echo ""
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

