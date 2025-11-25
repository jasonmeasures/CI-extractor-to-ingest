#!/bin/bash

# Direct A79 API Test
# Tests A79 API directly with curl, matching Clear Audit 7501 format exactly

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 DIRECT A79 API TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Load environment variables (handle spaces properly)
if [ -f "backend/.env" ]; then
    # Read .env file and export variables, handling spaces in values
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Skip comments and empty lines
        case "$key" in
            \#*|"") continue ;;
        esac
        # Remove leading/trailing whitespace and quotes
        key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        export "$key=$value"
    done < backend/.env
fi

# A79 Configuration (with proper defaults)
A79_ENDPOINT="${A79_API_ENDPOINT:-https://klearnow.prod.a79.ai/api/v1/public/workflow/run}"
A79_API_KEY="${A79_API_KEY:-sk-a79-wvymMMk2FdgHPGBP9mGakuGLnc/FZg3i}"
AGENT_NAME="${A79_AGENT_NAME:-Unified PDF Parser}"

echo "📋 Configuration:"
echo "  Endpoint: $A79_ENDPOINT"
echo "  API Key: ${A79_API_KEY:0:15}..."
echo "  Agent: $AGENT_NAME"
echo ""

# Create minimal test PDF (or use provided one)
TEST_PDF="test/test_invoice.pdf"
if [ ! -f "$TEST_PDF" ]; then
    echo "${YELLOW}⚠️  Test PDF not found: $TEST_PDF${NC}"
    echo "   Creating minimal test PDF..."
    
    # Create a minimal PDF using Python if available
    python3 -c "
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
c = canvas.Canvas('$TEST_PDF', pagesize=letter)
c.drawString(100, 750, 'Test Commercial Invoice')
c.drawString(100, 700, 'Item 1: Test Product')
c.drawString(100, 650, 'SKU: TEST001')
c.drawString(100, 600, 'Quantity: 10')
c.drawString(100, 550, 'Price: \$100.00')
c.save()
" 2>/dev/null || {
        echo "${RED}❌ Could not create test PDF. Please provide test_invoice.pdf${NC}"
        exit 1
    }
fi

# Convert PDF to base64
echo "📄 Converting PDF to base64..."
BASE64_PDF=$(base64 -i "$TEST_PDF" 2>/dev/null || base64 "$TEST_PDF" 2>/dev/null)
if [ -z "$BASE64_PDF" ]; then
    echo "${RED}❌ Failed to convert PDF to base64${NC}"
    exit 1
fi

echo "✅ PDF converted (${#BASE64_PDF} characters)"
echo ""

# Build request payload (matching Clear Audit 7501 format)
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
echo "$PAYLOAD" > test/request_payload.json
echo "💾 Request payload saved to: test/request_payload.json"
echo ""

# Send request to A79 API
echo "📤 Sending request to A79 API..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}" \
  -X POST "$A79_ENDPOINT" \
  -H "Authorization: Bearer $A79_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: */*" \
  -d "$PAYLOAD" \
  --max-time 300)

# Extract HTTP code and time
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
TIME_TOTAL=$(echo "$RESPONSE" | grep "TIME_TOTAL:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d' | sed '/TIME_TOTAL:/d')

# Save response
echo "$RESPONSE_BODY" > test/response.json
echo "💾 Response saved to: test/response.json"
echo ""

# Display results
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESULTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "${GREEN}✅ HTTP Status: $HTTP_CODE${NC}"
    echo "⏱️  Response Time: ${TIME_TOTAL}s"
    echo ""
    
    # Parse response
    RUN_ID=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('run_id', 'N/A'))" 2>/dev/null || echo "N/A")
    STATUS=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('status', 'N/A'))" 2>/dev/null || echo "N/A")
    
    echo "📋 Response Details:"
    echo "  Run ID: $RUN_ID"
    echo "  Status: $STATUS"
    echo ""
    
    if [ "$RUN_ID" != "N/A" ] && [ "$RUN_ID" != "" ]; then
        echo "${GREEN}✅ Successfully received run_id: $RUN_ID${NC}"
        echo ""
        echo "🔍 Next: Poll for status using:"
        echo "   curl -X GET \"https://klearnow.prod.a79.ai/api/v1/public/workflow/$RUN_ID/status?output_var=final_display_output\" \\"
        echo "     -H \"Authorization: Bearer $A79_API_KEY\""
    else
        echo "${YELLOW}⚠️  No run_id in response${NC}"
        echo "   Full response:"
        echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
    fi
else
    echo "${RED}❌ HTTP Status: $HTTP_CODE${NC}"
    echo "⏱️  Response Time: ${TIME_TOTAL}s"
    echo ""
    echo "📋 Error Response:"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
    
    case "$HTTP_CODE" in
        403)
            echo "${RED}❌ 403 Forbidden - Check API key and endpoint${NC}"
            ;;
        404)
            echo "${RED}❌ 404 Not Found - Check endpoint URL${NC}"
            ;;
        500)
            echo "${RED}❌ 500 Server Error - A79 API issue${NC}"
            ;;
        502)
            echo "${RED}❌ 502 Bad Gateway - Timeout or connection issue${NC}"
            ;;
        *)
            echo "${RED}❌ Unexpected status code${NC}"
            ;;
    esac
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

