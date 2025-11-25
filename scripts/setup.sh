#!/bin/bash

# Setup script for CI PDF Extractor

echo "🚀 Setting up CI PDF Extractor..."

# Create logs directory
mkdir -p logs
mkdir -p backend/logs
mkdir -p backend/python/logs

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install Python dependencies (if Python is available)
if command -v python3 &> /dev/null; then
    echo "📦 Setting up Python virtual environment..."
    cd backend/python
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "✅ Created Python virtual environment"
    fi
    echo "📦 Installing Python dependencies..."
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ../..
    echo "✅ Python dependencies installed"
fi

# Copy environment files
echo "⚙️ Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - Please configure your A79 API endpoint"
fi

# Install Playwright for E2E tests (optional)
read -p "Install Playwright for E2E tests? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installing Playwright..."
    npx playwright install --with-deps chromium
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure backend/.env with your A79 API endpoint"
echo "2. Run 'npm run dev:frontend' in one terminal"
echo "3. Run 'npm run dev:backend' in another terminal"
echo "4. Open http://localhost:3000 in your browser"

