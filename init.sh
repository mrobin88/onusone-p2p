#!/bin/bash

# OnusOne P2P Network - Quick Setup Script
echo "🚀 Setting up OnusOne P2P Network..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the onusone-p2p directory"
    exit 1
fi

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git add .
    git commit -m "🚀 Initial OnusOne P2P network with decay algorithm"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install shared library dependencies
echo "📚 Setting up shared library..."
cd shared
npm install
npm run build
cd ..

# Install node dependencies
echo "🌐 Setting up P2P node..."
cd node
npm install

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    cp env.example .env
    echo "⚙️  Environment file created at node/.env"
fi

cd ..

# Install frontend dependencies
echo "📱 Setting up frontend..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Terminal 1: cd node && npm run dev"
echo "2. Terminal 2: cd frontend && npm run dev"
echo "3. Open http://localhost:3000"
echo ""
echo "🚀 Your P2P social network is ready to launch!"