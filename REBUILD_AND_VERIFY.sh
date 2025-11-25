#!/bin/bash

# Rebuild and Verify A79 Integration
# This script verifies all connections and configurations

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 REBUILDING AND VERIFYING A79 INTEGRATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

echo "📋 STEP 1: Verifying Configuration Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check backend config
echo -n "  • Backend A79 config: "
if [ -f "backend/config/a79Endpoints.js" ]; then
    AGENT_NAME=$(grep -oP "agentName:.*'\K[^']+" backend/config/a79Endpoints.js | head -1)
    echo "${GREEN}✅ Found${NC} (Agent: $AGENT_NAME)"
else
    echo "${RED}❌ Missing${NC}"
    exit 1
fi

# Check frontend config
echo -n "  • Frontend API config: "
if [ -f "frontend/src/services/api.js" ]; then
    echo "${GREEN}✅ Found${NC}"
else
    echo "${RED}❌ Missing${NC}"
    exit 1
fi

# Check server port
echo -n "  • Backend server port: "
PORT=$(grep -oP "PORT.*\|\|\s*\K\d+" backend/server.js | head -1)
if [ "$PORT" = "7001" ]; then
    echo "${GREEN}✅ Correct (7001)${NC}"
else
    echo "${YELLOW}⚠️  Port is $PORT (should be 7001)${NC}"
fi

# Check vite proxy
echo -n "  • Frontend proxy config: "
if grep -q "localhost:7001" frontend/vite.config.js 2>/dev/null; then
    echo "${GREEN}✅ Correct${NC}"
else
    echo "${RED}❌ Incorrect or missing${NC}"
fi

echo ""
echo "📦 STEP 2: Installing Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backend dependencies
if [ -d "backend" ]; then
    echo "  • Installing backend dependencies..."
    cd backend
    if [ -f "package.json" ]; then
        npm install --silent
        echo "    ${GREEN}✅ Backend dependencies installed${NC}"
    fi
    cd ..
fi

# Frontend dependencies
if [ -d "frontend" ]; then
    echo "  • Installing frontend dependencies..."
    cd frontend
    if [ -f "package.json" ]; then
        npm install --silent
        echo "    ${GREEN}✅ Frontend dependencies installed${NC}"
    fi
    cd ..
fi

echo ""
echo "🔍 STEP 3: Verifying A79 Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd backend
node -e "
import('./config/a79Endpoints.js').then(m => {
  console.log('  • Agent Name:', m.A79_ENDPOINTS.agentName);
  console.log('  • Endpoint:', m.A79_ENDPOINTS.extract);
  console.log('  • Workflow ID:', m.A79_ENDPOINTS.workflowId || 'NONE (using agent)');
}).catch(e => {
  console.error('  ❌ Error:', e.message);
  process.exit(1);
});
" 2>/dev/null || echo "  ${YELLOW}⚠️  Could not verify (Node ES modules)${NC}"
cd ..

echo ""
echo "🚀 STEP 4: Checking Running Processes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check backend
BACKEND_PID=$(lsof -ti:7001 2>/dev/null || echo "")
if [ -n "$BACKEND_PID" ]; then
    echo "  • Backend: ${GREEN}✅ Running on port 7001 (PID: $BACKEND_PID)${NC}"
else
    echo "  • Backend: ${YELLOW}⚠️  Not running${NC}"
fi

# Check frontend
FRONTEND_PID=$(lsof -ti:3001 2>/dev/null || echo "")
if [ -n "$FRONTEND_PID" ]; then
    echo "  • Frontend: ${GREEN}✅ Running on port 3001 (PID: $FRONTEND_PID)${NC}"
else
    echo "  • Frontend: ${YELLOW}⚠️  Not running${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VERIFICATION COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Current Configuration Summary:"
echo "  • Agent: Unified PDF Parser"
echo "  • Endpoint: https://klearnow.prod.a79.ai/api/v1/public/workflow/run"
echo "  • Backend Port: 7001"
echo "  • Frontend Port: 3001"
echo "  • Timeout: 5 minutes (300000ms)"
echo ""
echo "🚀 To start servers:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""

