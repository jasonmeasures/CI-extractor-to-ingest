#!/bin/bash

# Test A79 API with a PDF file
# Usage: ./test_a79.sh sample_invoice.pdf

if [ -z "$1" ]; then
    echo "Usage: ./test_a79.sh <pdf_file>"
    exit 1
fi

PDF_FILE="$1"

if [ ! -f "$PDF_FILE" ]; then
    echo "Error: PDF file not found: $PDF_FILE"
    exit 1
fi

echo "📄 Testing A79 API with: $PDF_FILE"
echo ""

# Convert PDF to base64
echo "📤 Converting PDF to base64..."
if command -v base64 >/dev/null 2>&1; then
    BASE64_PDF=$(base64 "$PDF_FILE" 2>/dev/null)
else
    echo "❌ Error: base64 command not found"
    exit 1
fi

if [ -z "$BASE64_PDF" ]; then
    echo "❌ Error: Failed to convert PDF to base64"
    exit 1
fi

echo "✅ PDF converted (${#BASE64_PDF} characters)"
echo ""

# Create request payload
PAYLOAD=$(cat <<EOF
{
  "document": "$BASE64_PDF",
  "document_type": "commercial_invoice",
  "extract_fields": [
    "line_items",
    "sku",
    "description",
    "hts_code",
    "country_of_origin",
    "quantity",
    "unit_price",
    "total_value",
    "weight",
    "unit_of_measure"
  ],
  "format": "line_items"
}
EOF
)

# Send request to backend
echo "🚀 Sending request to backend..."
RESPONSE=$(curl -s -X POST http://localhost:7001/api/extract \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\nHTTP_CODE:%{http_code}")

# Extract HTTP code
HTTP_CODE=$(echo "$RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

# Save response
echo "$RESPONSE_BODY" > a79_response.json

echo ""
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Request successful (HTTP $HTTP_CODE)"
    echo ""
    echo "📊 Response summary:"
    echo "$RESPONSE_BODY" | jq -r '
      if .line_items then
        "Line items: " + (.line_items | length | tostring) + "\n" +
        "First item SKU: " + (.line_items[0].sku // "N/A") + "\n" +
        "First item Description: " + (.line_items[0].description // "N/A" | .[0:50]) + "..."
      else
        "Response: " + (. | tostring | .[0:200])
      end
    ' 2>/dev/null || echo "$RESPONSE_BODY" | head -n 20
else
    echo "❌ Request failed (HTTP $HTTP_CODE)"
    echo ""
    echo "Error response:"
    echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
fi

echo ""
echo "📄 Full response saved to: a79_response.json"

