# A79 API Test Plan
**Purpose**: Diagnose why A79 API fails in this app but works in Clear Audit 7501

## 🎯 Test Objectives

1. **Compare Request Format** - Verify our request matches Clear Audit 7501 exactly
2. **Test A79 API Directly** - Bypass our code to test raw A79 API
3. **Validate Response Parsing** - Ensure we parse A79 responses correctly
4. **Compare Headers** - Verify headers match working implementation
5. **Test Timeout Behavior** - Understand timeout vs actual processing time

## 📋 Test Cases

### Test 1: Direct A79 API Test (curl)
**Purpose**: Test A79 API with minimal request, bypassing our code

**Steps**:
1. Create minimal test PDF
2. Convert to base64
3. Send curl request matching Clear Audit 7501 format exactly
4. Verify response structure

**Expected**: Should get `run_id` immediately, then poll for results

**Script**: `test/test_a79_direct.sh`

---

### Test 2: Request Format Comparison
**Purpose**: Compare our request payload with Clear Audit 7501 format

**Steps**:
1. Capture our request payload (JSON)
2. Compare with Clear Audit 7501 format
3. Check for differences in:
   - Field names
   - Nested structure
   - Custom instructions format
   - Base64 encoding

**Script**: `test/compare_request_format.js`

---

### Test 3: Headers Comparison
**Purpose**: Verify headers match exactly

**Check**:
- `Authorization` format
- `Content-Type` value
- `Accept` value
- Any additional headers Clear Audit 7501 uses

**Script**: `test/compare_headers.js`

---

### Test 4: Response Parsing Test
**Purpose**: Verify we parse A79 responses correctly

**Steps**:
1. Use known good A79 response (from Clear Audit 7501 if possible)
2. Test our parsing logic
3. Verify we extract `line_items` correctly

**Script**: `test/test_response_parsing.js`

---

### Test 5: Timeout vs Processing Time
**Purpose**: Understand if timeout is the issue

**Steps**:
1. Send request to A79
2. Log time to get `run_id`
3. Log time for each poll attempt
4. Calculate total processing time
5. Compare with timeout setting

**Script**: `test/test_timing.js`

---

### Test 6: Agent Name Validation
**Purpose**: Verify "Unified PDF Parser" agent exists and is accessible

**Steps**:
1. Test with exact agent name
2. Test with different case variations
3. Check if workflow ID is needed instead

**Script**: `test/test_agent_name.js`

---

### Test 7: Base64 Encoding Validation
**Purpose**: Ensure PDF encoding matches Clear Audit 7501

**Steps**:
1. Compare base64 encoding method
2. Check for data URL prefixes
3. Verify encoding matches exactly

**Script**: `test/test_base64_encoding.js`

---

### Test 8: Polling Logic Test
**Purpose**: Verify polling endpoint and logic

**Steps**:
1. Get `run_id` from A79
2. Test each polling endpoint
3. Verify status check logic
4. Test response structure variations

**Script**: `test/test_polling.js`

---

### Test 9: Error Response Analysis
**Purpose**: Capture and analyze A79 error responses

**Steps**:
1. Send request
2. Capture full error response
3. Compare with Clear Audit 7501 error handling
4. Identify specific error codes/messages

**Script**: `test/test_error_responses.js`

---

### Test 10: End-to-End Integration Test
**Purpose**: Full flow test with logging

**Steps**:
1. Upload test PDF through frontend
2. Log every step:
   - Frontend → Backend request
   - Backend → A79 request
   - A79 response
   - Polling attempts
   - Final response parsing
3. Compare with Clear Audit 7501 logs

**Script**: `test/test_e2e.js`

## 🔍 Diagnostic Checklist

- [ ] Request payload structure matches Clear Audit 7501
- [ ] Headers match exactly
- [ ] Base64 encoding is correct
- [ ] Agent name is correct
- [ ] Endpoint URL is correct
- [ ] API key is valid
- [ ] Timeout is sufficient
- [ ] Polling logic is correct
- [ ] Response parsing handles all formats
- [ ] Error handling captures full details

## 📊 Success Criteria

1. **Direct curl test** returns `run_id` successfully
2. **Request format** matches Clear Audit 7501 exactly
3. **Headers** are identical
4. **Response parsing** handles all A79 response formats
5. **Polling** completes successfully
6. **End-to-end** test extracts line items correctly

## 🚨 Failure Analysis

If tests fail, check:
1. **403 Forbidden**: API key or endpoint issue
2. **Timeout**: Processing takes longer than expected
3. **Parsing Error**: Response structure different than expected
4. **Agent Not Found**: Agent name or workflow ID issue
5. **Network Error**: Connection or DNS issue

## 📝 Test Results Template

```
Test Case: [Name]
Date: [Date]
Status: [PASS/FAIL]
Request: [JSON payload]
Response: [JSON response]
Error: [If any]
Notes: [Observations]
```

