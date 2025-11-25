# Current A79 Integration Configuration
## Generated: $(date)

## Backend Configuration

### A79 Endpoints (`backend/config/a79Endpoints.js`)
- **Base URL**: `https://klearnow.prod.a79.ai/api/v1/public/workflow`
- **Extract Endpoint**: `https://klearnow.prod.a79.ai/api/v1/public/workflow/run`
- **Agent Name**: `Unified PDF Parser` (matching Clear Audit 7501)
- **Workflow ID**: None (using agent-based requests)
- **Dashboard URL**: `https://klearnow.prod.a79.ai`

### A79 Service (`backend/services/a79Service.js`)
- **API Key**: `sk-a79-wvymMMk2FdgHPGBP9mGakuGLnc/FZg3i` (39 chars)
- **Initial Timeout**: 300000ms (5 minutes) - matching Clear Audit 7501
- **Poll Timeout**: 30000ms (30 seconds per poll)
- **Poll Interval**: 5000ms (5 seconds)
- **Max Poll Attempts**: 120 (10 minutes total)

### Request Format
```json
{
  "agent_name": "Unified PDF Parser",
  "agent_inputs": {
    "pdf_document": "<base64_encoded_pdf>",
    "custom_instructions": "<enhanced_instructions>"
  }
}
```

### Headers
- `Authorization: Bearer <api_key>`
- `Content-Type: application/json`
- `Accept: */*`

## Frontend Configuration

### API Service (`frontend/src/services/api.js`)
- **Backend Proxy**: `/api/extract` (routes to `http://localhost:7001/api/extract`)
- **Direct A79**: Not used (always uses backend proxy)

### Vite Config (`frontend/vite.config.js`)
- **Proxy Target**: `http://localhost:7001`
- **Proxy Path**: `/api`

## Server Configuration

### Backend Server (`backend/server.js`)
- **Port**: 7001 (changed from 7000 due to Apple AirTunes conflict)
- **CORS**: Enabled for `http://localhost:3001`
- **Body Size Limit**: 50MB

### Frontend Server
- **Port**: 3001 (Vite dev server)
- **Proxy**: Routes `/api/*` to `http://localhost:7001`

## Key Features

1. **SKU Handling**: Empty string if no part number (never generates "ITEM-N")
2. **Cache Clearing**: Optional flag to force fresh extraction
3. **PDF Validation**: Checks magic bytes before processing
4. **Error Handling**: Detailed logging and specific error messages
5. **Polling**: Async workflow support with status polling

## Recent Changes Summary

### Last 3 Days:
1. Removed API settings UI - hardcoded to use backend proxy
2. Fixed SKU generation - now leaves empty instead of "ITEM-N"
3. Improved timeout handling - better error messages
4. Added PDF validation - checks magic bytes
5. Changed port from 7000 to 7001 (AirTunes conflict)
6. Increased timeout from 2min to 5min (matching Clear Audit 7501)
7. Reverted to "Unified PDF Parser" (matching Clear Audit 7501)

