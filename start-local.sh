#!/bin/bash

# OnusOne P2P Local Development Startup Script
# No Docker required - just Node.js and npm

echo "🚀 Starting OnusOne P2P Local Development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Build shared library first
echo "📦 Building shared library..."
cd shared
npm ci
npm run build
cd ..

# Start node backend in background
echo "🔧 Starting node backend..."
cd node
npm ci
npm run dev &
NODE_PID=$!
cd ..

# Wait a moment for node to start
sleep 3

# Start frontend in background
echo "🌐 Starting frontend..."
cd frontend
npm ci
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

echo ""
echo "🎉 OnusOne P2P is starting up!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Node API: http://localhost:8888"
echo "❤️  Health Check: http://localhost:8888/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $NODE_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait 