# OnusOne P2P Network - Setup Guide

🚀 **Welcome to the future of decentralized discussions!**

## 🎯 What We've Built

You now have a complete **Web3 P2P social network** with:

### ✅ **Core Features:**
- **Decay Algorithm** - Content dies unless community keeps it alive
- **P2P Networking** - No central servers, fully distributed
- **IPFS Storage** - Decentralized content storage
- **Web3 Integration** - Solana wallet support for bounties
- **Real-time Messaging** - Live discussions across network nodes
- **Weekly Bounties** - Community rewards for content curation

### 🏗️ **Architecture Completed:**
```
📱 React PWA Frontend ↔ 🌐 P2P Node (Node.js) ↔ 🔗 Blockchain (Solana)
                              ↕
                        💾 IPFS Storage
```

## 🛠️ **Installation & Setup**

### **Prerequisites:**
```bash
# Required software
- Node.js 18+ 
- npm 8+
- Git
- IPFS Desktop (optional but recommended)
```

### **1. Clone & Install:**
```bash
# Navigate to your P2P project
cd /mnt/z/onusone-p2p

# Install all dependencies
npm run install:all

# This installs:
# - Root package management
# - Shared library dependencies  
# - P2P node dependencies
# - Frontend dependencies
```

### **2. Configure Environment:**
```bash
# Copy environment template
cp node/env.example node/.env

# Edit configuration (optional - defaults work for development)
nano node/.env
```

Key settings you might want to change:
```env
P2P_PORT=8887          # P2P network port
HTTP_PORT=8888         # API server port  
MAX_STORAGE_GB=100     # Storage contribution
LOG_LEVEL=info         # Logging verbosity
IPFS_API_URL=http://localhost:5001  # IPFS connection
```

### **3. Build Shared Library:**
```bash
# Build the shared library first
cd shared
npm run build
cd ..
```

### **4. Start Your Node:**
```bash
# Terminal 1: Start the P2P node
cd node
npm run dev

# You should see:
# [INFO] Starting OnusOne P2P Node...
# [INFO] Node started with PeerId: 12D3KooW...
# [INFO] HTTP API server running on port 8888
# [INFO] OnusOne P2P Node is running
```

### **5. Start Frontend:**
```bash
# Terminal 2: Start the React frontend
cd frontend  
npm run dev

# Frontend will be available at:
# http://localhost:3000
```

## 🎮 **How to Use**

### **As a User:**
1. **Open** `http://localhost:3000`
2. **Connect** your Solana wallet (optional)
3. **Join** discussion boards like `/finance`, `/tech`, `/work`
4. **Post** messages that start with 100 decay points
5. **Engage** with quality content to keep it alive
6. **Watch** noise naturally disappear over time

### **As a Node Operator:**
1. **Contribute storage** - Your node stores encrypted message chunks
2. **Provide compute** - Generate weekly summaries for bounties
3. **Earn rewards** - Get tokens for network contributions
4. **Monitor health** - Check `/health` endpoint for node status

## 🔍 **Monitoring Your Node**

### **Health Check:**
```bash
curl http://localhost:8888/health
```

### **View Logs:**
```bash
# Real-time logs
tail -f node/logs/onusone-node.log

# Error logs only
tail -f node/logs/onusone-error.log
```

### **Network Status:**
```bash
# API endpoints available:
GET /health                              # Node status
GET /api/boards/:board/messages         # Get board messages
POST /api/messages                      # Create new message

# Example: Get finance board messages
curl http://localhost:8888/api/boards/finance/messages
```

## 🌍 **Joining the Network**

### **Connect to Other Nodes:**
Your node automatically discovers and connects to other OnusOne nodes using:
- **Bootstrap nodes** - Initial network entry points
- **mDNS discovery** - Find local network nodes
- **DHT routing** - Distributed hash table for peer discovery

### **Become a Bootstrap Node:**
```bash
# Advanced: Run as a bootstrap node for others
NODE_ENV=bootstrap npm start
```

## 🔧 **Troubleshooting**

### **Common Issues:**

**Port Already in Use:**
```bash
# Check what's using your ports
netstat -tulpn | grep 8887
netstat -tulpn | grep 8888

# Kill processes if needed
sudo kill -9 <PID>
```

**IPFS Connection Failed:**
```bash
# Install IPFS Desktop or start IPFS daemon
ipfs daemon

# Or use our mock IPFS for development
echo "MOCK_IPFS=true" >> node/.env
```

**No Network Peers:**
```bash
# Check firewall settings
sudo ufw allow 8887

# Try different bootstrap nodes in .env
```

**Frontend Build Errors:**
```bash
# Clear caches and reinstall
rm -rf frontend/node_modules frontend/.next
cd frontend && npm install
```

## 🎁 **What's Next?**

### **Phase 2 Development:**
1. **Mobile App** - React Native version
2. **Blockchain Integration** - Solana smart contracts for bounties
3. **Advanced AI** - Better weekly summary generation
4. **Governance** - Community voting on network upgrades

### **Contributing:**
1. **Run a node** - Help scale the network
2. **Submit code** - Improve the protocol
3. **Create content** - Test the decay algorithm
4. **Spread the word** - Grow the community

## 🎯 **Architecture Deep Dive**

### **Decay Algorithm (Core Innovation):**
```typescript
// Messages start with 100 points
message.decayScore = 100

// Lose 1 point per hour naturally
decayScore -= (hoursSinceLastEngagement * 1)

// Gain points from engagement:
// - Reply: +5 points
// - Reaction: +2 points  
// - Share: +3 points

// Only visible if decayScore > 0
message.isVisible = decayScore > 0
```

### **Network Protocol:**
- **libp2p** for peer-to-peer networking
- **Gossipsub** for message broadcasting
- **Kad-DHT** for peer and content discovery
- **IPFS** for distributed storage
- **SQLite** for local message indexing

### **Security Model:**
- **Message signing** - Cryptographic proof of authorship
- **Content addressing** - IPFS hashes prevent tampering
- **Peer verification** - Reputation-based trust system
- **Rate limiting** - Spam prevention

---

## 🚀 **You're Ready!**

Your **OnusOne P2P Network** is now running! You've built:

✅ A fully decentralized social platform  
✅ An innovative content curation algorithm  
✅ A sustainable economic model  
✅ A censorship-resistant communication system  

**Next step:** Fire up your node and start the revolution! 🔥

---

*Built with ❤️ by the OnusOne community*