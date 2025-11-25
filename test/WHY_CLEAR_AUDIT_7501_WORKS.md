# Why Clear Audit 7501 Works But Our Code Doesn't

## 🔍 Critical Discovery

**The direct curl test WORKS** - we get `run_id` in 1.25 seconds ✅
**Our backend code TIMES OUT** - no response after 75 seconds ❌

This means:
- ✅ A79 API is working
- ✅ Request format is correct  
- ✅ Agent name is correct
- ❌ **Something in our code is different from Clear Audit 7501**

## 🎯 Key Difference: Request Method

### Clear Audit 7501 (Python)
```python
requests.post(url, data=json.dumps(payload), headers=headers)
```

**Important**: `data=json.dumps(payload)` sends JSON as a **STRING** in the body
- Content-Type header: `application/json`
- Body: JSON string (not object)

### Our Code (Node.js/Axios)
```javascript
axios.post(url, payload, {headers, timeout})
```

**Important**: Axios automatically JSON.stringifies the object
- Content-Type header: `application/json`  
- Body: JSON string (auto-converted)

**Both should be equivalent**, but there might be subtle differences.

## 🔍 Potential Issues

### 1. **Timeout Configuration**
- Our timeout: 300000ms (5 minutes)
- But we're timing out after ~75 seconds
- **Issue**: The timeout might be on the CONNECTION, not the request

### 2. **Axios vs Python Requests**
- Python `requests` might handle timeouts differently
- Python `requests` might have different connection pooling
- Python `requests` might retry automatically

### 3. **Request Body Encoding**
- Python `data=json.dumps()` explicitly creates a string
- Axios auto-converts - might have encoding issues
- **Test**: Try sending JSON string explicitly

### 4. **Connection Handling**
- Python `requests` might reuse connections
- Axios might create new connections each time
- Could affect how A79 API handles the request

### 5. **Error Handling**
- Python `requests` might handle errors differently
- Our code might be throwing before getting response
- **Check**: Are we catching errors too early?

## 🧪 What to Test

### Test 1: Send JSON as String (Like Python)
```javascript
// Instead of:
axios.post(url, payload, {...})

// Try:
axios.post(url, JSON.stringify(payload), {
  headers: {
    'Content-Type': 'application/json',
    ...
  }
})
```

### Test 2: Check Axios Config
- Remove `maxContentLength` and `maxBodyLength`
- Check if `validateStatus` is causing issues
- Try without custom timeout first

### Test 3: Compare Network Behavior
- Use `curl` to capture exact request Clear Audit 7501 sends
- Compare headers byte-by-byte
- Compare body encoding

### Test 4: Check for Retries
- Python `requests` might retry automatically
- Our code might not retry
- A79 API might need retries for slow responses

## 💡 Most Likely Cause

Based on the evidence:
1. ✅ Direct curl works (1.25s response)
2. ❌ Our axios code times out (75s, no response)
3. ✅ Request format is correct
4. ✅ Headers are correct

**Most likely**: **Axios timeout behavior** or **connection handling**

The timeout is happening on the **initial connection**, not during processing. This suggests:
- Axios might be waiting for a response that never comes
- Python `requests` might handle this differently
- There might be a connection pool or keep-alive difference

## 🔧 Recommended Fix

### Option 1: Match Python Exactly
Send JSON as string explicitly:
```javascript
const payloadString = JSON.stringify(requestPayload)
submitResponse = await axios.post(
  this.endpoint,
  payloadString,  // Send as string, not object
  {
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': '*/*'
    },
    timeout: this.timeout
  }
)
```

### Option 2: Use Node.js `https` Module
Bypass axios entirely and use native Node.js:
```javascript
const https = require('https')
const payloadString = JSON.stringify(requestPayload)
// ... send with https.request()
```

### Option 3: Check Axios Version/Config
- Update axios to latest version
- Check if there are known issues with A79 API
- Try different axios config options

## 📊 Comparison Table

| Aspect | Clear Audit 7501 | Our Code | Status |
|--------|-----------------|----------|--------|
| Language | Python | Node.js | ⚠️ Different |
| HTTP Library | `requests` | `axios` | ⚠️ Different |
| Request Body | `data=json.dumps()` | `payload` (auto) | ⚠️ Different |
| Timeout | Unknown | 300000ms | ❓ Unknown |
| Retries | Unknown | None | ❓ Unknown |
| Connection Pool | Unknown | Default | ❓ Unknown |
| Headers | Same | Same | ✅ Match |
| Payload Format | Same | Same | ✅ Match |
| Endpoint | Same | Same | ✅ Match |

## 🎯 Next Steps

1. **Test sending JSON as string** (Option 1 above)
2. **Compare exact network requests** (use Wireshark/tcpdump)
3. **Check if Python requests retries** automatically
4. **Test with different timeout values**
5. **Try native Node.js https** instead of axios

The fact that curl works but axios doesn't suggests it's an **axios-specific issue**, not an A79 API issue.

