#!/bin/bash

# 🚀 OrbitDB Server Deployment Script
# Deploy your real-time messaging system to the cloud

echo "🚀 Deploying OrbitDB Server to the cloud..."

# Check if we have the necessary files
if [ ! -f "node/package.json" ]; then
    echo "❌ Error: node/package.json not found. Run this from the project root."
    exit 1
fi

# Build the project
echo "📦 Building project..."
cd node
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Create deployment package
echo "📦 Creating deployment package..."
cd ..
tar -czf orbit-deployment.tar.gz \
    node/dist/ \
    node/package.json \
    node/package-lock.json \
    node/src/messaging/ \
    node/src/utils/ \
    node/src/orbit-server.ts

echo "✅ Deployment package created: orbit-deployment.tar.gz"

echo ""
echo "🌐 Next Steps:"
echo "1. Upload orbit-deployment.tar.gz to your cloud server"
echo "2. Extract and run: npm install && npm run orbit:start"
echo "3. Update your frontend to point to your server IP:8889"
echo ""
echo "💡 Recommended hosting:"
echo "   - DigitalOcean: $5/month (droplet)"
echo "   - Railway: $5/month (easy deployment)"
echo "   - Render: $7/month (good for Node.js)"
echo ""
echo "🔗 Your frontend on Vercel will connect to this server for real-time messaging!"
