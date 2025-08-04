# OnusOne P2P - Quick Start Guide

## 🚀 **Get Your P2P Network Running in 30 Minutes**

### **Step 1: Environment Setup (5 minutes)**
```bash
# Clone and install
git clone https://github.com/mrobin88/onusone-p2p.git
cd onusone-p2p
npm run install:all

# Interactive environment setup
npm run setup:env
```

**What you'll need:**
- ✅ **Pinata API Key** (free tier) - https://pinata.cloud/
- ✅ **DigitalOcean Token** ($18/month) - https://digitalocean.com/
- ✅ **Alchemy Solana Key** (free tier) - https://alchemy.com/

### **Step 2: Deploy Bootstrap Network (10 minutes)**
```bash
# Deploy 3 bootstrap nodes for P2P discovery
npm run deploy:bootstrap

# This creates:
# - 3 VPS instances ($6/month each)
# - P2P discovery network
# - Network health monitoring
```

### **Step 3: Test P2P Network (5 minutes)**
```bash
# Start local development
npm run dev

# In another terminal, test the network
npm run test:p2p-network
```

### **Step 4: Production Deployment (10 minutes)**
```bash
# Deploy complete P2P stack
npm run deploy:production

# This creates:
# - Frontend on Vercel (free)
# - P2P gateway nodes
# - Monitoring dashboard
# - Complete P2P network
```

---

## 🎯 **What You Get**

### **✅ True P2P Social Network**
- **Content Decay**: Bad content dies automatically
- **Reputation System**: Quality contributors get influence
- **Censorship Resistant**: Distributed across many nodes
- **Community Owned**: No corporate control

### **✅ Production Infrastructure**
- **Bootstrap Nodes**: Help peers discover each other
- **IPFS Storage**: Decentralized content distribution
- **Web Gateway**: Easy access for new users
- **Monitoring**: Real-time network health

### **✅ Smart Deployment Strategy**
- **Hybrid Approach**: Web + P2P for easy onboarding
- **Cost Effective**: ~$50-75/month total
- **Scalable**: Grows with your user base
- **Migration Path**: From web to pure P2P

---

## 💰 **Cost Breakdown**

### **Development (Free)**
- Local development: $0
- Testing: $0
- Free tier services: $0

### **Production (~$60/month)**
- Bootstrap nodes: $18/month (3×$6)
- Gateway nodes: $24/month (2×$12)
- Monitoring: $12/month
- IPFS pinning: $10/month
- Domain: $15/year

**Total: ~$64/month + $15/year**

---

## 🔧 **Commands Reference**

### **Setup Commands**
```bash
npm run setup:env          # Interactive environment setup
npm run install:all        # Install all dependencies
npm run clean              # Clean all node_modules
npm run reset              # Clean and reinstall
```

### **Development Commands**
```bash
npm run dev                # Start local development
npm run node:dev           # Start P2P node only
npm run frontend:dev       # Start frontend only
npm run test               # Run all tests
npm run lint               # Check code quality
```

### **Deployment Commands**
```bash
npm run deploy:bootstrap   # Deploy P2P bootstrap network
npm run deploy:production  # Deploy complete production stack
npm run test:p2p-network   # Test network connectivity
npm run monitor:network    # Monitor network health
```

---

## 🚨 **Troubleshooting**

### **Environment Issues**
```bash
# Missing API keys
npm run setup:env

# Permission issues
chmod +x scripts/*.js

# Dependencies issues
npm run reset
```

### **Network Issues**
```bash
# Test connectivity
npm run test:p2p-network

# Check bootstrap nodes
doctl compute droplet list

# Check local node
curl http://localhost:8888/health
```

### **Deployment Issues**
```bash
# Check DigitalOcean auth
doctl auth list

# Check environment
cat node/.env

# Check build status
cd shared && npm run build
cd frontend && npm run build
```

---

## 📚 **Next Steps After Deployment**

### **1. Customize Your Network**
- Edit `node/.env` for configuration
- Modify `shared/src/p2p.ts` for P2P behavior
- Update `frontend/pages` for UI changes

### **2. Add Features**
- Blockchain integration (Solana ready)
- Token rewards for node operators
- Advanced reputation algorithms
- Mobile app (PWA ready)

### **3. Scale Your Network**
- Add more bootstrap nodes
- Deploy regional gateways
- Implement CDN for static assets
- Add load balancers

### **4. Community Building**
- Invite beta users
- Create governance proposals
- Set up community forums
- Launch token distribution

---

## 🎉 **You're Ready!**

**Your P2P social network is now live and running!**

- **Web Access**: https://your-vercel-app.vercel.app
- **P2P Nodes**: Connect directly to the network
- **Monitoring**: Check network health
- **Community**: Start building your decentralized community

**Welcome to the future of social networking - decentralized, community-owned, and censorship-resistant!** 🌐