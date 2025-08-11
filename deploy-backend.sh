#!/bin/bash

# OnusOne P2P Backend Deployment Script
# This script deploys the P2P backend node to make the network functional

set -e

echo "🚀 Deploying OnusOne P2P Backend Node..."

# Configuration
BACKEND_PORT=8888
NODE_ENV=${NODE_ENV:-production}
DOCKER_IMAGE_NAME="onusone/p2p-node"
CONTAINER_NAME="onusone-p2p-backend"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build the backend node
echo "🔨 Building P2P backend node..."
cd node
npm install
npm run build
cd ..

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t $DOCKER_IMAGE_NAME -f node/Dockerfile .

# Stop existing container if running
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    echo "🛑 Stopping existing container..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Create network if it doesn't exist
if ! docker network ls | grep -q onusone-network; then
    echo "🌐 Creating Docker network..."
    docker network create onusone-network
fi

# Run the backend node
echo "🚀 Starting P2P backend node..."
docker run -d \
    --name $CONTAINER_NAME \
    --network onusone-network \
    -p $BACKEND_PORT:$BACKEND_PORT \
    -e NODE_ENV=$NODE_ENV \
    -e NODE_PORT=$BACKEND_PORT \
    -e P2P_PORT=$((BACKEND_PORT + 1)) \
    -e HTTP_PORT=$BACKEND_PORT \
    -e ENABLE_WEBSOCKETS=true \
    -e ENABLE_MDNS=true \
    -e LOG_LEVEL=info \
    -e ENABLE_METRICS=true \
    --restart unless-stopped \
    $DOCKER_IMAGE_NAME

# Wait for container to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -f http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    echo "✅ Backend node is running successfully!"
    echo "🌐 Health check: http://localhost:$BACKEND_PORT/health"
    echo "🔌 WebSocket endpoint: ws://localhost:$BACKEND_PORT/ws/edge-node"
    echo "📊 API status: http://localhost:$BACKEND_PORT/api/status"
else
    echo "❌ Backend failed to start. Checking logs..."
    docker logs $CONTAINER_NAME
    exit 1
fi

echo ""
echo "🎯 Next steps:"
echo "1. Add environment variable to Vercel:"
echo "   NEXT_PUBLIC_P2P_BACKEND_URL=http://YOUR_SERVER_IP:$BACKEND_PORT"
echo "2. Deploy this script to your cloud server"
echo "3. Run: chmod +x deploy-backend.sh && ./deploy-backend.sh"
echo "4. Update frontend to use the new backend URL"
echo ""
echo "🌍 Your P2P network will now be accessible to external users!"
