#!/bin/bash

# 🚀 Railway Deployment Script for OnusOne P2P
# Deploy your backend to Railway (FREE tier)

echo "🚀 Setting up Railway deployment for OnusOne P2P..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if we're in the right directory
if [ ! -f "node/package.json" ]; then
    echo "❌ Error: node/package.json not found. Run this from the project root."
    exit 1
fi

echo "📦 Building project..."
cd node
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Go back to root
cd ..

echo ""
echo "🌐 Railway Setup Steps:"
echo "1. Go to: https://railway.app/"
echo "2. Sign in with GitHub"
echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
echo "4. Select your 'onusone-p2p' repository"
echo "5. Set root directory to: node"
echo "6. Set build command to: npm run build"
echo "7. Set start command to: npm run orbit:start"
echo ""
echo "🔧 Environment Variables to set in Railway:"
echo "   - PORT=8889"
echo "   - NODE_ENV=production"
echo "   - DATABASE_URL=your_supabase_url (if using Supabase)"
echo ""
echo "📱 After deployment, Railway will give you a public URL like:"
echo "   https://your-app-name.railway.app"
echo ""
echo "🔗 Update your frontend environment variables:"
echo "   NEXT_PUBLIC_ORBIT_SERVER_URL=https://your-app-name.railway.app"
echo "   NEXT_PUBLIC_ORBIT_WS_URL=wss://your-app-name.railway.app"
echo ""
echo "💡 Railway FREE tier gives you:"
echo "   - 500 hours/month"
echo "   - Auto-deploy from GitHub"
echo "   - Custom domains"
echo "   - SSL certificates"
echo ""
echo "🚀 Ready to deploy! Follow the steps above."
