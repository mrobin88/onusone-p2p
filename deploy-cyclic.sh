#!/bin/bash

# 🚀 Cyclic Deployment Script for OnusOne P2P
# Deploy your backend to Cyclic (FREE, unlimited, simplest setup)

echo "🚀 Setting up Cyclic deployment for OnusOne P2P..."

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

# Go back to root
cd ..

# Create cyclic.json for easy deployment
cat > cyclic.json << 'EOF'
{
  "name": "onusone-p2p-backend",
  "type": "node",
  "buildCommand": "npm run build",
  "startCommand": "npm run orbit:start",
  "env": {
    "NODE_ENV": "production",
    "PORT": "8889"
  }
}
EOF

echo "✅ Created cyclic.json configuration"

echo ""
echo "🌐 Cyclic Setup Steps (FREE, unlimited, no credit card):"
echo "1. Go to: https://www.cyclic.sh/"
echo "2. Click 'Sign Up' and choose 'GitHub'"
echo "3. Authorize Cyclic to access your GitHub"
echo "4. Click 'Link Your Own' → 'GitHub'"
echo "5. Select your 'onusone-p2p' repository"
echo "6. Cyclic will auto-detect cyclic.json"
echo "7. Click 'Deploy'"
echo ""
echo "🔧 Cyclic will automatically:"
echo "   - Use cyclic.json for configuration"
echo "   - Set PORT=8889"
echo "   - Run npm run build"
echo "   - Start with npm run orbit:start"
echo "   - Generate SSL certificate"
echo ""
echo "📱 After deployment, Cyclic will give you:"
echo "   https://your-app-name.cyclic.app"
echo ""
echo "🔗 Update your frontend environment variables:"
echo "   NEXT_PUBLIC_ORBIT_SERVER_URL=https://your-app-name.cyclic.app"
echo "   NEXT_PUBLIC_ORBIT_WS_URL=wss://your-app-name.cyclic.app"
echo ""
echo "💡 Cyclic FREE tier gives you:"
echo "   - Unlimited deployments"
echo "   - Auto-deploy from GitHub"
echo   - Custom domains"
echo "   - SSL certificates"
echo "   - No credit card required!"
echo "   - No trial period!"
echo ""
echo "🚀 Ready to deploy! Follow the steps above."
echo ""
echo "🎯 Why Cyclic is the best choice:"
echo "   - Simplest setup - 5 minutes"
echo "   - Most reliable free tier"
echo "   - No hidden limits"
echo "   - Great for Node.js apps"
