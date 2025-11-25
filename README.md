# Commercial Invoice PDF Extractor - Full Stack Application

Complete frontend and backend solution for extracting line items from commercial invoice PDFs using A79 API.

## 🏗️ Project Structure

```
.
├── frontend/          # React frontend application
├── backend/           # Node.js/Express backend API
│   └── python/        # Python/FastAPI alternative backend
├── tests/             # QA automation tests
│   ├── frontend/      # Frontend unit tests (Jest)
│   ├── backend/       # Backend API tests (Jest)
│   ├── e2e/           # End-to-end tests (Playwright)
│   └── python/        # Python backend tests (pytest)
├── debug/             # Debug utilities
└── docs/              # Documentation

```

## 🚀 Quick Start

**👉 See [GETTING_STARTED.md](./GETTING_STARTED.md) for complete setup instructions**

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ (for Python backend - optional)
- A79 API endpoint configured

### Quick Setup

1. **Install dependencies:**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Start backend (Node.js):**
   ```bash
   cd backend
   npm run dev
   ```
   Backend runs on http://localhost:7001

3. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on http://localhost:3001

### Backend Setup (Python)

```bash
cd backend/python
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (create .env file)
# Run the server
python app.py
```

## 📦 Dependencies

### Frontend
- React 18
- Vite
- Axios
- Tailwind CSS (via CDN in HTML version)

### Backend (Node.js)
- Express
- Multer (file uploads)
- Winston (logging)
- Axios (HTTP client)

### Backend (Python)
- FastAPI
- Uvicorn
- Pydantic
- httpx

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### Backend Tests (Node.js)
```bash
cd backend
npm test
npm run test:coverage
```

### E2E Tests
```bash
npm install -g @playwright/test
npx playwright install
npx playwright test
```

### Python Tests
```bash
cd backend/python
pytest tests/
```

## 🐛 Debugging

### Debug Mode (Node.js)
```bash
cd backend
npm run debug
# Then attach debugger on port 9229
```

### Debug Utilities
See `debug/debug-utils.js` for validation and logging utilities.

### Debug Endpoints
- `GET /api/debug/config` - View configuration
- `POST /api/debug/test-a79` - Test A79 connection

## 📝 Environment Variables

### Backend (.env)
```
PORT=7000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
A79_API_ENDPOINT=https://your-a79-api.com/api/extract-invoice
A79_API_KEY=your-api-key
A79_TIMEOUT=60000
LOG_LEVEL=info
```

## 🔧 Configuration

1. Configure A79 API endpoint in Settings panel (frontend)
2. Set environment variables in backend `.env` file
3. Update A79 system prompt (see `A79_SYSTEM_PROMPT.md`)

## 📊 API Endpoints

### POST /api/extract
Upload PDF file and extract line items

### POST /api/extract/base64
Extract from base64 encoded PDF

### GET /api/health
Health check endpoint

### GET /api/debug/config (dev only)
View current configuration

## 🎯 Features

- ✅ Modern React frontend with responsive UI
- ✅ Node.js/Express backend API
- ✅ Python/FastAPI alternative backend
- ✅ File upload handling
- ✅ Base64 document support
- ✅ Error handling and validation
- ✅ Comprehensive logging
- ✅ Debug utilities
- ✅ QA automation (Jest, Playwright, pytest)
- ✅ CSV export functionality

## 📚 Documentation

### 🎯 Start Here
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Step-by-step setup and installation guide ⭐ **START HERE**
- **[FINAL_SUMMARY.md](./FINAL_SUMMARY.md)** - Complete package summary and implementation guide
- **[A79_ENHANCEMENTS.md](./A79_ENHANCEMENTS.md)** - What's new in A79 v2.0 (enhanced features)
- **[A79_QUICK_REFERENCE.md](./A79_QUICK_REFERENCE.md)** - Quick reference card for enhanced features
- **[INDEX.md](./INDEX.md)** - Complete documentation index

### 🔧 Core Documentation
- `SETUP_GUIDE.md` - Step-by-step setup instructions
- `SETUP_COMPLETE.md` - Detailed setup guide
- `TESTING_GUIDE.md` - Comprehensive testing guide

### ⚙️ A79 API Documentation
- **[A79_SYSTEM_PROMPT.md](./A79_SYSTEM_PROMPT.md)** - Enhanced system prompt for A79 (v2.0) ✏️ **ACTION REQUIRED**
- `A79_ENDPOINTS.md` - A79 API endpoint configuration
- `A79_JSON_SCHEMA.md` - Response format specification
- `README_A79_INTEGRATION.md` - Integration details

### 📚 Additional Documentation
- `README_PDF_EXTRACTOR.md` - Direct AI guide
- `VERSION_COMPARISON.md` - Version comparison

## 🔒 Security

- Helmet.js for security headers
- CORS configuration
- File size limits (10MB)
- Input validation
- Error sanitization

## 📈 Monitoring

- Winston logging to files and console
- Request/response logging
- Error tracking
- Performance metrics

## 🤝 Contributing

1. Follow existing code style
2. Write tests for new features
3. Update documentation
4. Run linter before committing

## 📄 License

Built for KlearNow Customs Processing

