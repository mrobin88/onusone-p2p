#!/bin/bash

echo "🚀 Deploying Frontend to Render..."

# Build the production version
echo "📦 Building production version..."
npm run build:production

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Static files created in 'out/' directory"
    echo ""
    echo "🌐 To deploy to Render:"
    echo "1. Push this code to GitHub"
    echo "2. Render will automatically build and deploy"
    echo "3. Your frontend will be available at: https://onusone-p2p-frontend.onrender.com"
    echo ""
    echo "🔑 Environment variables needed in Render:"
    echo "- NEXT_PUBLIC_BACKEND_URL: https://onusone-p2p-backend.onrender.com"
    echo "- NEXT_PUBLIC_SOLANA_RPC_URL: https://api.devnet.solana.com"
    echo "- NEXT_PUBLIC_SOLANA_NETWORK: devnet"
    echo "- NEXT_PUBLIC_ONU_TOKEN_MINT: [Your ONU Token Mint]"
    echo "- NEXT_PUBLIC_TREASURY_ADDRESS: [Your Treasury Address]"
else
    echo "❌ Build failed!"
    exit 1
fi
