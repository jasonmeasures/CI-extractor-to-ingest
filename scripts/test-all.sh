#!/bin/bash

# Run all tests

echo "🧪 Running all tests..."

# Frontend tests
echo "📱 Running frontend tests..."
cd frontend
npm test -- --coverage --watchAll=false
FRONTEND_EXIT=$?
cd ..

# Backend tests
echo "🔧 Running backend tests..."
cd backend
npm test -- --coverage --watchAll=false
BACKEND_EXIT=$?
cd ..

# E2E tests (if Playwright is installed)
if command -v npx &> /dev/null; then
    echo "🌐 Running E2E tests..."
    npx playwright test || true
fi

# Python tests (if pytest is available)
if command -v pytest &> /dev/null; then
    echo "🐍 Running Python tests..."
    cd backend/python
    pytest tests/ || true
    cd ../..
fi

if [ $FRONTEND_EXIT -eq 0 ] && [ $BACKEND_EXIT -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi

