# A79 Integration Configuration Summary
**Last Updated:** $(date)

## 🎯 Current Setup

### Architecture
```
Frontend (Port 3001) → Backend Proxy (/api/extract) → Backend (Port 7001) → A79 API
```

### Key Configuration Files

#### 1. Backend A79 Endpoints (`backend/config/a79Endpoints.js`)
- **Agent Name**: `Unified PDF Parser` (matching Clear Audit 7501)
- **Endpoint**: `https://klearnow.prod.a79.ai/api/v1/public/workflow/run`
- **Workflow ID**: None (using agent-based requests)

#### 2. Backend A79 Service (`backend/services/a79Service.js`)
- **API Key**: `sk-a79-wvymMMk2FdgHPGBP9mGakuGLnc/FZg3i` (39 chars)
- **Initial Timeout**: 300000ms (5 minutes) - matching Clear Audit 7501
- **Poll Timeout**: 30000ms (30 seconds per poll)
- **Poll Interval**: 5000ms (5 seconds)
- **Max Poll Attempts**: 120 (10 minutes total)

#### 3. Backend Server (`backend/server.js`)
- **Port**: 7001 (changed from 7000 due to Apple AirTunes conflict)
- **CORS**: Enabled for `http://localhost:3001`
- **Body Size Limit**: 50MB

#### 4. Frontend API Service (`frontend/src/services/api.js`)
- **Endpoint**: `/api/extract` (always uses backend proxy)
- **Timeout**: 300000ms (5 minutes)

#### 5. Frontend Vite Config (`frontend/vite.config.js`)
- **Port**: 3001
- **Proxy Target**: `http://localhost:7001`
- **Proxy Path**: `/api`

#### 6. Frontend App (`frontend/src/App.jsx`)
- **API Config**: Hardcoded to use `/api/extract` (backend proxy)
- **No Settings UI**: API configuration removed from UI

## 📤 Request Flow

### Frontend → Backend
```json
{
  "document": "<base64_pdf>",
  "document_type": "commercial_invoice",
  "extract_fields": ["sku", "description", "hts_code", ...],
  "format": "line_items",
  "clear_cache": false
}
```

### Backend → A79 API
```json
{
  "agent_name": "Unified PDF Parser",
  "agent_inputs": {
    "pdf_document": "<base64_pdf>",
    "custom_instructions": "<enhanced_instructions>"
  }
}
```

### Headers (Backend → A79)
```
Authorization: Bearer sk-a79-wvymMMk2FdgHPGBP9mGakuGLnc/FZg3i
Content-Type: application/json
Accept: */*
```

## 🔄 Response Flow

### A79 API → Backend
- Returns `run_id` immediately
- Backend polls `/status` endpoint until `status: "succeeded"` or `"completed"`
- Extracts line items from nested response structure

### Backend → Frontend
```json
{
  "line_items": [
    {
      "sku": "",
      "description": "...",
      "hts_code": "...",
      ...
    }
  ]
}
```

## 🎨 Key Features

1. **SKU Handling**: Empty string if no part number (never generates "ITEM-N")
2. **Cache Clearing**: Optional `clear_cache` flag to force fresh extraction
3. **PDF Validation**: Checks magic bytes (`%PDF`) before processing
4. **Error Handling**: Detailed logging and specific error messages
5. **Async Polling**: Supports long-running A79 workflows with status polling
6. **Timeout Handling**: 5-minute timeout matching Clear Audit 7501

## 📝 Recent Changes (Last 3 Days)

1. ✅ **Removed API Settings UI** - Hardcoded to use backend proxy
2. ✅ **Fixed SKU Generation** - Now leaves empty instead of "ITEM-N"
3. ✅ **Improved Timeout Handling** - Better error messages for timeouts
4. ✅ **Added PDF Validation** - Checks magic bytes before processing
5. ✅ **Changed Port** - From 7000 to 7001 (Apple AirTunes conflict)
6. ✅ **Increased Timeout** - From 2min to 5min (matching Clear Audit 7501)
7. ✅ **Reverted Agent Name** - Back to "Unified PDF Parser" (matching Clear Audit 7501)

## 🚀 Starting the Application

### Backend
```bash
cd backend
npm run dev
# Server runs on http://localhost:7001
```

### Frontend
```bash
cd frontend
npm run dev
# App runs on http://localhost:3001
```

## 🔍 Troubleshooting

### Port Conflicts
- **7000**: Used by Apple AirTunes → Use 7001 instead
- **3001**: Frontend port (can be changed in `vite.config.js`)

### Timeout Issues
- A79 workflows can take 2-5 minutes
- Timeout is set to 5 minutes (300000ms)
- Check logs: `backend/logs/combined.log`

### A79 API Errors
- **403**: Check API key and endpoint
- **502**: Usually timeout - check A79 API status
- **workflow_execution_failed**: Invalid file type or PDF corruption

### Logs Location
- **Backend**: `backend/logs/combined.log`
- **Backend Errors**: `backend/logs/error.log`

## 📊 Verification Checklist

- [ ] Backend runs on port 7001
- [ ] Frontend runs on port 3001
- [ ] Frontend proxy routes `/api/*` to `http://localhost:7001`
- [ ] A79 agent name is "Unified PDF Parser"
- [ ] A79 endpoint is `https://klearnow.prod.a79.ai/api/v1/public/workflow/run`
- [ ] API key is configured (39 chars)
- [ ] Timeout is 5 minutes (300000ms)
- [ ] SKU field is empty when no part number exists

## 🔗 Related Files

- `backend/config/a79Endpoints.js` - A79 endpoint configuration
- `backend/config/a79Instructions.js` - Custom instructions for A79
- `backend/services/a79Service.js` - A79 API integration service
- `backend/routes/extract.js` - Extraction API routes
- `frontend/src/services/api.js` - Frontend API client
- `frontend/src/App.jsx` - Main application component

