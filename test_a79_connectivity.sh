#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 A79 API CONNECTIVITY TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_KEY="sk-a79-wvymMMk2FdgHPGBP9mGakuGLnc/FZg3i"
ENDPOINT="https://klearnow.prod.a79.ai/api/v1/public/workflow/run"

echo "1️⃣ Testing DNS resolution..."
nslookup klearnow.prod.a79.ai | grep -A 2 "Name:" || echo "  ❌ DNS lookup failed"
echo ""

echo "2️⃣ Testing HTTPS connectivity..."
curl -I "https://klearnow.prod.a79.ai" --max-time 10 2>&1 | head -5 || echo "  ❌ HTTPS connection failed"
echo ""

echo "3️⃣ Testing A79 API endpoint with minimal payload..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: */*" \
  -d '{"agent_name":"Unified PDF Parser","agent_inputs":{"pdf_document":"dGVzdA==","custom_instructions":"Test"}}' \
  --max-time 60)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "  HTTP Status: $HTTP_CODE"
echo "  Response: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✅ API is responding correctly!"
elif [ "$HTTP_CODE" = "403" ]; then
  echo "  ⚠️  403 Forbidden - Check API key"
elif [ "$HTTP_CODE" = "500" ]; then
  echo "  ⚠️  500 Internal Server Error - A79 server issue"
elif [ "$HTTP_CODE" = "000" ] || [ -z "$HTTP_CODE" ]; then
  echo "  ❌ Connection timeout or failed"
else
  echo "  ⚠️  Unexpected status: $HTTP_CODE"
fi


