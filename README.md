# OnusOne P2P - Decentralized Discussion Network

> **A Web3 social platform where content survives based on community engagement**

## 🌟 Vision

OnusOne P2P is a fully decentralized discussion platform where:
- **Content naturally decays** unless the community keeps it alive
- **Users contribute compute power** to run the network
- **Weekly bounties** reward community curation and AI summaries
- **No central authority** controls the conversation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React PWA     │    │   P2P Node      │    │   Blockchain    │
│   Frontend      │◄──►│   (Node.js)     │◄──►│   (Solana)      │
│                 │    │                 │    │                 │
│ • User Interface│    │ • libp2p Network│    │ • Bounty System │
│ • Web3 Wallet   │    │ • IPFS Storage  │    │ • Token Economy │
│ • Message UI    │    │ • Decay Engine  │    │ • Governance    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Directory Structure

```
onusone-p2p/
├── frontend/          # React PWA with Web3 integration
├── node/             # P2P node software (Node.js + libp2p)
├── blockchain/       # Smart contracts (Solana/Anchor)
├── shared/           # Common types and utilities
└── docs/            # Network documentation
```

## 🔥 Core Innovation: Decay Algorithm

Messages start with a score of 100 and lose 1 point per hour. Engagement boosts the score:
- **Reply**: +5 points
- **Reaction**: +2 points  
- **Share**: +3 points

Only messages with score > 0 remain visible. This creates a **living information ecosystem** where valuable content naturally survives.

## 🚀 Quick Start

### For Users (Run a Light Node):
```bash
# Install OnusOne CLI
npm install -g @onusone/cli

# Join the network
onusone join --storage 1GB

# Start contributing
onusone start
```

### For Contributors (Run a Full Node):
```bash
# Clone and setup
git clone https://github.com/onusone/p2p-network
cd p2p-network

# Install dependencies
npm install

# Configure your node
cp .env.example .env
# Edit .env with your settings

# Start the network node
npm run node:start

# Start the frontend
npm run frontend:dev
```

## 💰 Economic Model

### **Storage Contribution**
- Earn tokens for hosting encrypted message chunks
- Rate: 10 tokens per GB per month

### **Compute Contribution**  
- Earn bounties for weekly summaries
- Rate: 100-500 tokens per quality summary

### **Network Health**
- Uptime bonuses: +10% for 99.9% availability
- Early adopter multiplier: 2x for first 1000 nodes

## 🎯 Roadmap

- **Q1 2025**: MVP with basic P2P messaging
- **Q2 2025**: IPFS integration and decay system
- **Q3 2025**: Blockchain bounties and governance
- **Q4 2025**: Mobile apps and mass adoption

## 🤝 Contributing

We're building the future of decentralized social media. Join us:

1. **Run a node** - Help scale the network
2. **Contribute code** - Frontend, backend, or blockchain
3. **Create content** - Test the decay algorithm
4. **Spread the word** - Grow the community

## 🔗 Links

- **Website**: https://onusone.network
- **Documentation**: https://docs.onusone.network  
- **Discord**: https://discord.gg/onusone
- **Twitter**: https://twitter.com/onusone_network

---

*Built with ❤️ by the OnusOne community*