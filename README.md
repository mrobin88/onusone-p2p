out# OnusOne P2P - Real Web3 Messaging Network

**Pay-per-message network where content disappears automatically. No accounts, no tracking, just wallet → post → earn.**

🏷️ **Token**: ONU (Solana SPL)  
🌐 **Live**: https://onusone-p2p.vercel.app  
💰 **Model**: Pay small ONU fee → Post message → Content auto-expires → Nodes earn rewards

## 🚀 **What Actually Works**

### ✅ **Live Features**
- **Wallet Authentication** (Phantom/Solflare)
- **Real Token Staking** (Solana SPL tokens)
- **Content Decay System** (messages auto-expire)
- **Node Reward Network** (hosts get paid)
- **Emergency Economics** (sustainable token supply)

### ⚡ **Quick Test**
```bash
1. Visit: https://onusone-p2p.vercel.app
2. Connect Solana wallet  
3. Post message (costs ~5-10 ONU)
4. Watch content decay based on engagement
5. Nodes earn ONU for hosting your message
```

## 💰 **Real Economics (No BS)**

### **User Flow**
1. **Connect Wallet** → No signup required
2. **Pay ONU Fee** → ~$0.50 per message  
3. **Message Goes Live** → Distributed to nodes
4. **Content Expires** → Based on stakes/engagement
5. **Nodes Get Paid** → 80% of fees go to hosts

### **Current Limits (Emergency Economics)**
- **Max Stake Per Post**: 50 ONU (was unlimited)
- **Daily User Limit**: 200 ONU (prevents whales)  
- **Total User Stakes**: 2,000 ONU max
- **Transaction Fees**: 10 ONU (burns tokens)
- **No Free Tokens**: All ONU must be earned

## 🏗️ **Real Tech Stack**

### **What's Actually Running**
- **Frontend**: Next.js on Vercel
- **Auth**: Solana wallet connection + NextAuth fallback  
- **Storage**: Mock KV (production would use Vercel KV)
- **Blockchain**: Solana mainnet for real token operations
- **P2P**: Node.js backends with real message relay

### **What's NOT Running (Yet)**
- ❌ PostgreSQL/Redis (using mock storage)
- ❌ IPFS (direct Solana transactions instead)  
- ❌ libp2p (custom P2P implementation)
- ❌ Kubernetes (deployed on Vercel)

## 🚨 **The Truth About Current Features**

### **✅ What Actually Works**
- **Wallet Connect**: Real Solana wallet integration
- **Token Staking**: Actual SPL token transfers 
- **Message Posting**: With decay scoring system
- **Node Rewards**: P2P backends get paid for hosting
- **Content Expiry**: Messages disappear based on engagement
- **Emergency Economics**: Sustainable tokenomics (prevents depletion)

### **🚧 What's Simulated/Mock**
- **User Storage**: Uses mock storage (resets on deploy)
- **Message Persistence**: Mock storage, not permanent IPFS
- **P2P Discovery**: Simplified node connection model
- **Token Distribution**: Limited circulating supply for testing

### **🔧 Local Development (If You Want to Contribute)**
```bash
# Clone and install
git clone https://github.com/mrobin88/onusone-p2p.git
cd onusone-p2p
npm install

# Start development
npm run dev
# Frontend: localhost:3000
# P2P Node: localhost:8888
```

### **Environment Setup**
```bash
# Required for auth (create frontend/.env.local):
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional Solana config:
NEXT_PUBLIC_TOKEN_MINT="your-token-mint"
NEXT_PUBLIC_TREASURY_ADDRESS="your-treasury"
```

## 🎯 **Current Roadmap (Realistic)**

### **Phase 1: Core Economics ✅ DONE**
- [x] Real Solana wallet integration
- [x] Actual token staking with SPL transfers
- [x] Content decay algorithm working
- [x] Sustainable tokenomics (emergency fixes)
- [x] Basic P2P node network

### **Phase 2: Real P2P Infrastructure 🚧 NEXT**
- [ ] Replace mock storage with distributed node storage
- [ ] IPFS content addressing for messages
- [ ] True peer discovery and routing
- [ ] Node operator staking and slashing
- [ ] Message relay incentives

### **Phase 3: Scale Economics 📋 FUTURE**
- [ ] Dynamic pricing based on network load
- [ ] Content markets (boost/promote messages)
- [ ] Node operator rewards scaling
- [ ] Cross-chain token bridges
- [ ] Mobile app for mainstream adoption

## 🚨 **What We're NOT Building**
- ❌ Traditional social media features
- ❌ User profiles and permanent accounts  
- ❌ Advertising or data harvesting
- ❌ Free tiers or freemium models
- ❌ Complex governance tokens

## ⚠️ **Risks & Limitations**

### **🚨 Current Risks**
- **Mock Storage**: Data resets on server restarts
- **Limited Testing**: Emergency economics need more validation  
- **Centralized Frontend**: Vercel hosts the UI (not decentralized)
- **Token Distribution**: Small circulating supply for testing
- **No Mobile App**: Desktop/web browser only

### **🛡️ Security Measures Actually Implemented**
- **Real Solana Verification**: All stakes verified on-chain
- **Rate Limiting**: Prevents spam and abuse
- **Input Sanitization**: XSS/injection protection
- **Emergency Economics**: Prevents token depletion
- **No Private Keys**: User wallets stay in user control

### **💰 Financial Disclaimers**
- **Early Stage**: This is experimental Web3 infrastructure
- **Token Risk**: ONU tokens may lose value
- **Network Risk**: P2P network may have downtime
- **Testing Phase**: Use small amounts only
- **No Guarantees**: Content may be lost during development

## 📞 **Support & Contact**

### **🐛 Issues**
- Found a bug? [Open GitHub Issue](https://github.com/mrobin88/onusone-p2p/issues)
- Feature request? [GitHub Discussions](https://github.com/mrobin88/onusone-p2p/discussions)

### **💬 Community**
- **Testing**: Help test the live platform
- **Feedback**: Share your experience with the economic model
- **Development**: Contribute to real P2P infrastructure

### **⚠️ Current Status: EXPERIMENTAL**

This is a **working prototype** of a sustainable Web3 messaging network. The core economics are functional, but we're still building toward true decentralization.

**What works**: Wallet auth, token staking, content decay, node rewards  
**What's next**: Replace mock storage with distributed node network

---

## 🔥 **The Vision**

**Stop building centralized platforms with Web3 marketing.** 

Build **real decentralized infrastructure** where:
- Users pay for network usage (not ads)
- Content expires naturally (no permanent data hoarding)  
- Node operators earn real rewards (not empty governance tokens)
- Network scales through economics (not venture capital)

**OnusOne P2P** - Pay per message. Content disappears. Nodes get paid. That's it.

**Ready to test it?** → https://onusone-p2p.vercel.app 🚀