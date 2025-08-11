#!/bin/bash

# 🚀 Render Deployment Script for OnusOne P2P
# Deploy your backend to Render (FREE tier, no credit card required)

echo "🚀 Setting up Render deployment for OnusOne P2P..."

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

# Create render.yaml for easy deployment
cd ..
cat > render.yaml << 'EOF'
services:
  - type: web
    name: onusone-p2p-backend
    env: node
    plan: free
    buildCommand: npm run build
    startCommand: npm run orbit:start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8889
EOF

echo "✅ Created render.yaml configuration"

echo ""
echo "🌐 Render Setup Steps (FREE, no credit card):"
echo "1. Go to: https://render.com/"
echo "2. Sign in with GitHub"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Connect your 'onusone-p2p' repository"
echo "5. Render will auto-detect the render.yaml file"
echo "6. Click 'Create Web Service'"
echo ""
echo "🔧 Render will automatically:"
echo "   - Use render.yaml for configuration"
echo "   - Set PORT=8889"
echo "   - Run npm run build"
echo "   - Start with npm run orbit:start"
echo ""
echo "📱 After deployment, Render will give you:"
echo "   https://your-app-name.onrender.com"
echo ""
echo "🔗 Update your frontend environment variables:"
echo "   NEXT_PUBLIC_ORBIT_SERVER_URL=https://your-app-name.onrender.com"
echo "   NEXT_PUBLIC_ORBIT_WS_URL=wss://your-app-name.onrender.com"
echo ""
echo "💡 Render FREE tier gives you:"
echo "   - 750 hours/month (enough for full-time)"
echo "   - Auto-deploy from GitHub"
echo "   - Custom domains"
echo "   - SSL certificates"
echo "   - No credit card required!"
echo ""
echo "🚀 Ready to deploy! Follow the steps above."
