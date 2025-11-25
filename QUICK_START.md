# Quick Start Guide - A79 Integration

## 🚀 Current Status

**✅ Both servers are running:**
- Backend: Port 7001 ✅
- Frontend: Port 3001 ✅
- A79 Agent: "Unified PDF Parser" ✅
- Configuration: Verified ✅

## 📋 What Changed in Last 3 Days

### Day 1-2: Initial Setup & Fixes
1. **Removed API Settings UI** - Hardcoded to use backend proxy (`/api/extract`)
2. **Fixed Port Conflict** - Changed from 7000 to 7001 (Apple AirTunes was using 7000)
3. **Fixed SKU Generation** - Now leaves SKU empty instead of generating "ITEM-N"

### Day 3: A79 Integration Improvements
4. **Increased Timeout** - From 2 minutes to 5 minutes (matching Clear Audit 7501)
5. **Reverted Agent Name** - Back to "Unified PDF Parser" (matching Clear Audit 7501)
6. **Added PDF Validation** - Checks magic bytes before processing
7. **Improved Error Handling** - Better timeout and error messages

## 🔧 Current Configuration

### Backend (`backend/`)
- **Port**: 7001
- **A79 Agent**: "Unified PDF Parser"
- **A79 Endpoint**: `https://klearnow.prod.a79.ai/api/v1/public/workflow/run`
- **Timeout**: 5 minutes (300000ms)
- **API Key**: Configured in `backend/services/a79Service.js`

### Frontend (`frontend/`)
- **Port**: 3001
- **API Endpoint**: `/api/extract` (proxies to backend)
- **No Settings UI**: API config is hardcoded

## 🔄 Request Flow

```
User uploads PDF
    ↓
Frontend (Port 3001)
    ↓ POST /api/extract
Backend Proxy (Vite)
    ↓ POST http://localhost:7001/api/extract
Backend (Port 7001)
    ↓ POST to A79 API
A79 API (klearnow.prod.a79.ai)
    ↓ Returns run_id
Backend polls for status
    ↓ Returns line_items
Frontend displays results
```

## 📝 Key Files

| File | Purpose |
|------|---------|
| `backend/config/a79Endpoints.js` | A79 endpoint configuration |
| `backend/services/a79Service.js` | A79 API integration logic |
| `backend/server.js` | Express server (port 7001) |
| `frontend/src/services/api.js` | Frontend API client |
| `frontend/vite.config.js` | Vite proxy configuration |
| `frontend/src/App.jsx` | Main React component |

## 🎯 How to Use

**👉 See [GETTING_STARTED.md](./GETTING_STARTED.md) for complete step-by-step instructions**

Quick start:
1. Install dependencies: `cd frontend && npm install && cd ../backend && npm install`
2. Start backend: `cd backend && npm run dev` (runs on port 7001)
3. Start frontend: `cd frontend && npm run dev` (runs on port 3001)
4. Open browser: http://localhost:3001
5. Upload PDF and wait for results (2-5 minutes)

## 🔍 Troubleshooting

### Backend not starting?
- Check if port 7001 is available: `lsof -i:7001`
- Check logs: `backend/logs/combined.log`

### Frontend not connecting?
- Verify backend is running on port 7001
- Check browser console for errors
- Verify proxy config in `frontend/vite.config.js`

### A79 API errors?
- Check API key in `backend/services/a79Service.js`
- Verify endpoint: `https://klearnow.prod.a79.ai/api/v1/public/workflow/run`
- Check timeout (should be 5 minutes)
- Review logs: `backend/logs/combined.log`

### Timeout errors?
- A79 workflows can take 2-5 minutes
- Timeout is set to 5 minutes (300000ms)
- If still timing out, check A79 API status

## 📊 Verification

Run the verification script:
```bash
./REBUILD_AND_VERIFY.sh
```

This will check:
- ✅ Configuration files exist
- ✅ Dependencies installed
- ✅ A79 configuration correct
- ✅ Servers running

## 📚 More Information

- **Full Configuration**: See `CONFIGURATION_SUMMARY.md`
- **A79 Integration**: See `README_A79_INTEGRATION.md`
- **Logs**: `backend/logs/combined.log`

