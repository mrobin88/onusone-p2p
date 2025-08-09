# 🔗 Anchor Node Setup Guide

## Your Hardware: Linux Mint Laptop (Perfect!)

### **System Requirements (You Meet These):**
- ✅ **8GB RAM**: More than sufficient (needs 2GB minimum)
- ✅ **Always-on capability**: Essential for network stability
- ✅ **Stable internet**: Required for message relay
- ✅ **Linux OS**: Optimal for node software

---

## **Step 1: Prepare Your Linux Laptop**

### Install Required Software:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git (if not already installed)
sudo apt install git -y

# Verify installations
node --version  # Should be v18+
npm --version
git --version
```

### Clone the Project:
```bash
# Create a directory for the node
mkdir ~/onusone-anchor
cd ~/onusone-anchor

# Clone the repository
git clone https://github.com/mrobin88/onusone-p2p.git
cd onusone-p2p/node

# Install dependencies
npm install

# Build the TypeScript
npm run build
```

---

## **Step 2: Configure the Anchor Node**

### Create Environment File:
```bash
# Copy example environment
cp env.example .env

# Edit with your settings
nano .env
```

### Environment Variables:
```env
# Port for the anchor node (default: 8888)
PORT=8888

# Database path (SQLite)
DATABASE_PATH=./data/anchor.db

# Network settings
MAX_PEERS=50
BOOTSTRAP_NODES=

# Wallet for node earnings (your Solana wallet)
NODE_WALLET=YourSolanaWalletAddressHere

# Security
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000
```

---

## **Step 3: Run the Anchor Node**

### Start the Node:
```bash
# Start in development mode
npm run start:dev

# OR start in production mode
npm run start

# OR run in background with PM2
npm install -g pm2
pm2 start src/start-node.ts --name "onusone-anchor"
pm2 startup  # Configure auto-start on boot
pm2 save
```

### Check if Running:
```bash
# Test local connection
curl http://localhost:8888/health

# Check logs
pm2 logs onusone-anchor  # If using PM2
```

---

## **Step 4: Network Configuration**

### Find Your Laptop's IP:
```bash
# Get local IP address
hostname -I
# Example output: 192.168.1.100

# Or use
ip addr show
```

### Configure Router (Port Forwarding):
1. **Access your router admin panel** (usually 192.168.1.1)
2. **Find "Port Forwarding" or "Virtual Server"**
3. **Add rule:**
   - **Service Name**: OnusOne Anchor
   - **External Port**: 8888
   - **Internal IP**: Your laptop's IP (e.g., 192.168.1.100)
   - **Internal Port**: 8888
   - **Protocol**: TCP

### Test External Access:
```bash
# From another device, test:
curl http://YOUR_EXTERNAL_IP:8888/health

# Or use online tools like:
# https://www.yougetsignal.com/tools/open-ports/
```

---

## **Step 5: Update Frontend to Use Your Anchor**

### On Your Main Computer:
```bash
# Edit the frontend P2P config
cd onusone-p2p/frontend
nano lib/p2p-client.ts
```

### Change the Node URL:
```typescript
// Before:
NODE_URL: process.env.NEXT_PUBLIC_P2P_NODE_URL || 'http://localhost:8888',

// After:
NODE_URL: process.env.NEXT_PUBLIC_P2P_NODE_URL || 'http://YOUR_LAPTOP_IP:8888',
```

### Re-enable Auto-Connect:
```typescript
// In pages/boards/[slug].tsx, change:
autoConnect: false, // Change back to true
```

---

## **Step 6: Test the Full Network**

### Verify Connection:
1. **Anchor node running** on Linux laptop
2. **Frontend connects** to your anchor node
3. **Messages get stored** in SQLite database
4. **P2P status shows "Connected"** in browser

### Monitor the Network:
```bash
# On the Linux laptop, check logs:
pm2 logs onusone-anchor

# Monitor database:
sqlite3 ./data/anchor.db
.tables
SELECT * FROM messages LIMIT 10;
.quit
```

---

## **🎯 Success Criteria:**

✅ **Anchor node boots successfully**
✅ **Port 8888 accessible from internet**
✅ **Frontend connects without errors**
✅ **Messages persist in SQLite database**
✅ **No more "connection refused" errors**

---

## **Next Steps After Anchor Works:**

1. **Add more anchor nodes** (friends' computers)
2. **Build mobile edge nodes** (phones, tablets)
3. **Implement node earnings** (ONU token payouts)
4. **Add IPFS integration** for content storage
5. **Scale the network** with automatic peer discovery

---

## **Troubleshooting:**

### Node Won't Start:
```bash
# Check if port is in use
sudo netstat -tulpn | grep 8888

# Check Node.js version
node --version  # Must be v16+

# Check for errors
npm run start:dev
```

### Can't Connect from Frontend:
- **Firewall**: `sudo ufw allow 8888`
- **Router**: Verify port forwarding
- **ISP**: Some block port 8888, try 443 or 80

### Database Issues:
```bash
# Reset database
rm -rf ./data/anchor.db
# Restart node (will recreate tables)
```

---

**Your old laptop is perfect for this! Once running, you'll have a real decentralized network anchor that stores messages and earns ONU tokens.**
