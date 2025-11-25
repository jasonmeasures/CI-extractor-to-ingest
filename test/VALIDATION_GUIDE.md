# Validation Guide

## Quick Validation

Run the complete validation suite:
```bash
./test/run_all_tests.sh
```

Or run individual tests:
```bash
# Direct A79 API test (bypasses our code)
./test/test_a79_direct.sh

# Compare request format
node test/compare_request_format.js

# Test response parsing
node test/test_response_parsing.js

# Full integration validation
node test/validate_integration.js
```

## Test PDF

### Option 1: Use Existing PDF
Place any commercial invoice PDF at:
```
test/test_invoice.pdf
```

### Option 2: Create Test PDF
```bash
# Install reportlab (Python)
pip3 install reportlab

# Or use the create script
./test/create_test_pdf.sh
```

### Option 3: Manual Creation
Create a simple PDF with:
- Invoice header
- Line items with SKU, description, quantity, price
- Save as `test/test_invoice.pdf`

## Validation Checklist

### ✅ Pre-Test Checks
- [ ] Backend is running on port 7001
- [ ] Frontend is running on port 3001
- [ ] Test PDF exists at `test/test_invoice.pdf`
- [ ] A79 API key is configured

### ✅ Direct A79 Test
- [ ] Run `./test/test_a79_direct.sh`
- [ ] Should get HTTP 200/201
- [ ] Should receive `run_id`
- [ ] Check `test/request_payload.json` for request format
- [ ] Check `test/response.json` for response structure

### ✅ Request Format Comparison
- [ ] Run `node test/compare_request_format.js`
- [ ] Compare with Clear Audit 7501 payload (if available)
- [ ] Verify structure matches exactly

### ✅ Response Parsing
- [ ] Run `node test/test_response_parsing.js`
- [ ] All parsing tests should pass
- [ ] Verify error handling works

### ✅ Integration Test
- [ ] Run `node test/validate_integration.js`
- [ ] Backend health check passes
- [ ] End-to-end extraction works
- [ ] Line items are extracted correctly

## Interpreting Results

### Direct A79 Test Fails
**If HTTP 403:**
- Check API key in `backend/.env` or `backend/services/a79Service.js`
- Verify endpoint URL
- Compare headers with Clear Audit 7501

**If HTTP 502/Timeout:**
- A79 API may be slow
- Check network connectivity
- Verify A79 API status

**If No run_id:**
- Check response structure
- Verify agent name is correct
- Check for error messages in response

### Request Format Mismatch
- Compare `test/request_payload.json` with Clear Audit 7501
- Check field names match exactly
- Verify nested structure is correct
- Check base64 encoding format

### Response Parsing Fails
- A79 response structure may have changed
- Update parsing logic in `backend/services/a79Service.js`
- Add support for new response format

### Integration Test Fails
- Check backend logs: `backend/logs/combined.log`
- Verify backend is running
- Check A79 API connectivity
- Review error messages

## Next Steps

1. **If all tests pass**: Integration is working correctly
2. **If direct test passes but integration fails**: Issue is in our code
3. **If direct test fails**: Issue is with A79 API or configuration
4. **If request format differs**: Update request format to match Clear Audit 7501
5. **If parsing fails**: Update parsing logic for new response format

## Capturing Clear Audit 7501 Request

To compare with Clear Audit 7501:

1. **Browser DevTools**:
   - Open Clear Audit 7501
   - Network tab → Find A79 request
   - Copy request payload
   - Save to `test/clear_audit_7501_payload.json`

2. **Request Format**:
   ```json
   {
     "agent_name": "...",
     "agent_inputs": {
       "pdf_document": "...",
       "custom_instructions": "..."
     }
   }
   ```

3. **Headers**:
   - Authorization: Bearer <key>
   - Content-Type: application/json
   - Accept: */*

## Troubleshooting

### Test Scripts Not Executable
```bash
chmod +x test/*.sh
chmod +x test/*.js
```

### Module Not Found
```bash
cd backend && npm install
```

### PDF Creation Fails
```bash
pip3 install reportlab
# Or manually create test_invoice.pdf
```

### Backend Not Running
```bash
cd backend && npm run dev
```

