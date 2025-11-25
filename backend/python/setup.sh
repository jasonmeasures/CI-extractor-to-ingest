#!/bin/bash

# Python Backend Setup Script

echo "🐍 Setting up Python backend..."

# Check if we're in the right directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: Please run this script from backend/python directory"
    echo "   cd backend/python"
    echo "   ./setup.sh"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "To activate the virtual environment in the future:"
echo "  cd backend/python"
echo "  source venv/bin/activate"
echo ""
echo "To run the server:"
echo "  python app.py"
echo ""
echo "To deactivate:"
echo "  deactivate"

