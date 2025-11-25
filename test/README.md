# Test Suite for A79 Integration

## Overview

This test suite helps diagnose why the A79 API integration fails in this application but works in Clear Audit 7501.

## Quick Start

```bash
# Run all tests
./test/run_all_tests.sh

# Or run individual tests
./test/test_a79_direct.sh
node test/compare_request_format.js
node test/test_response_parsing.js
```

## Test Files

### 1. `test_a79_direct.sh`
**Purpose**: Test A79 API directly with curl, bypassing our code

**What it does**:
- Creates/uses test PDF
- Converts to base64
- Sends curl request matching Clear Audit 7501 format
- Captures and displays response

**Usage**:
```bash
./test/test_a79_direct.sh
```

**Output**:
- `test/request_payload.json` - The request sent to A79
- `test/response.json` - The response from A79
- Console output with HTTP status and run_id

---

### 2. `compare_request_format.js`
**Purpose**: Compare our request format with Clear Audit 7501

**What it does**:
- Loads our request payload
- Compares structure with Clear Audit 7501 payload (if available)
- Checks for differences in:
  - Field names
  - Nested structure
  - Base64 encoding

**Usage**:
```bash
node test/compare_request_format.js
```

**Requirements**:
- `test/request_payload.json` (created by test_a79_direct.sh)
- `test/clear_audit_7501_payload.json` (optional - capture from Clear Audit 7501)

---

### 3. `test_response_parsing.js`
**Purpose**: Test our response parsing logic

**What it does**:
- Tests parsing with various A79 response formats
- Verifies we handle all known response structures
- Checks error handling

**Usage**:
```bash
node test/test_response_parsing.js
```

---

### 4. `run_all_tests.sh`
**Purpose**: Run all tests in sequence

**Usage**:
```bash
./test/run_all_tests.sh
```

## Test PDF

A test PDF (`test_invoice.pdf`) is automatically created if Python's `reportlab` is available.

If not, you can:
1. Use any commercial invoice PDF
2. Place it at `test/test_invoice.pdf`
3. Or modify `test_a79_direct.sh` to use a different file

## Capturing Clear Audit 7501 Payload

To compare with Clear Audit 7501:

1. **Using browser DevTools**:
   - Open Clear Audit 7501
   - Open Network tab
   - Upload a PDF
   - Find the A79 API request
   - Copy request payload
   - Save to `test/clear_audit_7501_payload.json`

2. **Using curl**:
   - Capture the exact curl command Clear Audit 7501 uses
   - Save payload to `test/clear_audit_7501_payload.json`

## Expected Results

### Successful Test
- HTTP 200/201 status
- `run_id` in response
- Can poll for status successfully

### Common Issues

**403 Forbidden**:
- Check API key
- Verify endpoint URL
- Compare headers with Clear Audit 7501

**Timeout**:
- A79 workflows can take 2-5 minutes
- Check timeout settings
- Verify network connectivity

**No run_id**:
- Check response structure
- Verify agent name
- Check for error messages in response

## Test Results Location

- `test/request_payload.json` - Request sent to A79
- `test/response.json` - Response from A79
- Console output - Test results and diagnostics

## Troubleshooting

### Test PDF not found
```bash
# Create manually or install reportlab
pip3 install reportlab
```

### Permission denied
```bash
chmod +x test/*.sh
chmod +x test/*.js
```

### Node modules not found
```bash
# Install dependencies
cd backend && npm install
```

## Next Steps After Testing

1. **If direct curl test works**:
   - Issue is in our code, not A79 API
   - Compare request format with our implementation
   - Check headers and payload structure

2. **If direct curl test fails**:
   - Issue is with A79 API or configuration
   - Verify API key and endpoint
   - Check A79 API status

3. **If parsing test fails**:
   - Response structure is different than expected
   - Update parsing logic in `a79Service.js`
   - Add support for new response format

