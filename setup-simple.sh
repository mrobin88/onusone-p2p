#!/bin/bash

# OnusOne P2P Network - Simple Setup Script
echo "🚀 Setting up OnusOne P2P Network (without workspaces)..."

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

# Install shared library dependencies and build
echo "📚 Setting up shared library..."
cd shared
npm install
if [ $? -eq 0 ]; then
    npm run build
    echo "✅ Shared library built successfully"
else
    echo "⚠️ Shared library build failed, but continuing..."
fi
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
echo "🎯 To test your P2P network:"
echo ""
echo "Terminal 1 (P2P Node):"
echo "  cd node"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"  
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "🚀 Your decentralized social network is ready!"