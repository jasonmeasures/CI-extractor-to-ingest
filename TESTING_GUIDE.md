# A79 API Testing Guide

## Quick Test Workflow (~5 minutes)

### Step 1: Test A79 API Connection

```bash
curl -X POST http://localhost:7000/api/debug/test-a79 | jq
```

**Expected:** Should return status 200 with `run_id` if working, or 403 if there's an issue.

### Step 2: Test with a PDF

```bash
./test_a79.sh sample_invoice.pdf
```

**What it does:**
- Converts PDF to base64
- Sends to backend `/api/extract`
- Saves response to `a79_response.json`
- Shows summary

### Step 3: Check the Response

```bash
cat a79_response.json | jq
```

**Look for:**
- `line_items` array with extracted data
- Each item should have: `sku`, `description`, `hts_code`, `quantity`, `unit_price`, etc.

### Step 4: Test Frontend Tool (Optional)

```bash
python3 -m http.server 8000
```

Then open: http://localhost:8000/ci_pdf_extractor_a79.html

---

## Debugging 403 Errors

### Compare curl vs axios requests:

```bash
curl http://localhost:7000/api/debug/compare-requests | jq
```

This shows side-by-side comparison of:
- **curl request** (working - returns 200)
- **axios request** (what backend uses - may return 403)

### Check Backend Logs:

```bash
tail -f backend/logs/combined.log
```

Look for:
- `=== A79 API REQUEST DEBUG ===` - Shows exact request being sent
- `A79 API returned error status 403` - Shows exact error from A79

### View Configuration:

```bash
curl http://localhost:7000/api/debug/config | jq
```

---

## What Success Looks Like

Your terminal should show:

```
✅ A79 API is responding
✅ Extracted 5 line items
✅ All data quality checks passed
Total Value: $125,750.00
```

---

## Troubleshooting

### Backend not responding?

```bash
# Check if backend is running
ps aux | grep nodemon

# Restart backend
cd backend
npm run dev
```

### 403 Forbidden Error?

1. **Check the comparison endpoint:**
   ```bash
   curl http://localhost:7000/api/debug/compare-requests | jq
   ```

2. **Check backend logs:**
   ```bash
   tail -n 100 backend/logs/combined.log | grep -A 10 "403\|A79 API"
   ```

3. **Share the output** - The logs will show exactly what's different between working curl and failing axios.

---

## Test Script Details

The `test_a79.sh` script:
- ✅ Converts PDF to base64
- ✅ Creates proper request payload
- ✅ Sends to backend `/api/extract`
- ✅ Saves full response to `a79_response.json`
- ✅ Shows summary with line item count

