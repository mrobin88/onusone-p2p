# 🧊 ICE BOX: Self-Host OnusOne Anchor Node - Your Gaming Rig Setup

**STATUS: FUTURE ROADMAP INTEL - NOT IMMEDIATE IMPLEMENTATION**

## 🎮 **Your Hardware (Perfect for This!)**

**CPU**: Intel i7-4770K (4 cores, 8 threads) ✅  
**RAM**: 32GB ✅ (overkill, only need 4GB)  
**Storage**: 6TB ✅ (could host millions of messages)  
**Network**: Home internet ✅

**This is actually BETTER than cloud VPS:**
- More storage than any VPS
- More RAM than $50/month VPS  
- Zero monthly costs
- You control everything

---

## 🚀 **Setup Your Anchor Node**

### **Step 1: Linux Setup**
```bash
# Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs sqlite3 nginx

# Clone the node software
git clone https://github.com/mrobin88/onusone-p2p.git
cd onusone-p2p/node
npm install
```

### **Step 2: Configure as Anchor Node**
```bash
# Create production config
cat > anchor-config.json << EOF
{
  "nodeId": "anchor-main-$(hostname)",
  "port": 8888,
  "dataDir": "/home/$(whoami)/onusone-data",
  "isBootstrap": true,
  "location": "Home-Primary",
  "maxStorage": 1000000,
  "maxBandwidth": 1000,
  "walletFile": "./anchor-wallet.json",
  "bootstrapNodes": []
}
EOF
```

### **Step 3: Create Startup Script**
```bash
# Create service script
cat > start-anchor.sh << 'EOF'
#!/bin/bash
cd /home/$(whoami)/onusone-p2p/node

# Generate or load wallet
if [ ! -f anchor-wallet.json ]; then
    echo "Generating new anchor node wallet..."
    node -e "
        const { Keypair } = require('@solana/web3.js');
        const fs = require('fs');
        const wallet = Keypair.generate();
        fs.writeFileSync('anchor-wallet.json', JSON.stringify(Array.from(wallet.secretKey)));
        console.log('Anchor wallet:', wallet.publicKey.toString());
    "
fi

# Start the node
npm run start-node -- \
  --port 8888 \
  --data-dir /home/$(whoami)/onusone-data \
  --bootstrap true \
  --location "Home-Primary" \
  --max-storage 1000000 \
  --max-bandwidth 1000

EOF

chmod +x start-anchor.sh
```

### **Step 4: Setup Port Forwarding**
```bash
# Your router needs to forward these ports to your gaming rig:
Port 8888 (HTTP API)
Port 8889 (WebSocket P2P)
Port 80/443 (optional, for domain)

# Find your local IP
ip addr show | grep 192.168
# Forward ports: 8888 -> [YOUR_LOCAL_IP]:8888
```

---

## 🌐 **Network Access Options**

### **Option 1: Direct IP Access**
```bash
# Find your public IP
curl ifconfig.me

# Friends connect to: http://[YOUR_IP]:8888
# Example: http://73.123.45.67:8888/api/node/status
```

### **Option 2: Dynamic DNS (Recommended)**
```bash
# Free services like NoIP, DuckDNS
# Set up: mrobin-node.ddns.net -> Your IP
# Auto-updates when IP changes

# Install ddclient for auto-updates
sudo apt-get install ddclient
```

### **Option 3: Ngrok Tunnel (Easiest)**
```bash
# Install ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin

# Create secure tunnel
ngrok http 8888
# Gets: https://abc123.ngrok.io -> your local :8888
```

---

## 💰 **Economics: Your Gaming Rig as Network Infrastructure**

### **Your Node Earns:**
```
Base Rate: 2 ONU per hour
24/7 Operation: 48 ONU per day
Monthly: ~1,440 ONU
At $0.50 per ONU: ~$720/month

MINUS electricity (~$30/month)
NET PROFIT: ~$690/month
```

### **What Your Node Does:**
- **Stores messages** in SQLite database
- **Relays content** to other nodes/users
- **Provides API** for frontend connections
- **Earns rewards** for network participation

### **Storage Capacity:**
```
6TB = 6,000,000 MB
Average message = 1KB
Your rig can store: 6 BILLION messages
That's like 10 years of Twitter content!
```

---

## 🔧 **Production Setup**

### **Create SystemD Service**
```bash
# Create service file
sudo cat > /etc/systemd/system/onusone-anchor.service << EOF
[Unit]
Description=OnusOne Anchor Node
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=/home/$(whoami)/onusone-p2p/node
ExecStart=/home/$(whoami)/onusone-p2p/node/start-anchor.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable onusone-anchor
sudo systemctl start onusone-anchor
```

### **Setup Nginx Reverse Proxy** (Optional)
```bash
# Install nginx
sudo apt-get install nginx

# Create config
sudo cat > /etc/nginx/sites-available/onusone << EOF
server {
    listen 80;
    server_name your-domain.com;  # or your IP
    
    location / {
        proxy_pass http://localhost:8888;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    location /ws {
        proxy_pass http://localhost:8889;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/onusone /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🚀 **Launch Sequence**

### **Step 1: Basic Setup (30 minutes)**
```bash
1. Install Linux on gaming rig
2. Clone repository and install dependencies  
3. Run start-anchor.sh
4. Set up port forwarding on router
```

### **Step 2: Network Integration (1 hour)**
```bash
1. Update frontend to connect to your node
2. Test API endpoints work externally
3. Verify message storage and retrieval
```

### **Step 3: Production Hardening (2 hours)**
```bash
1. Set up SystemD service for auto-restart
2. Configure Nginx reverse proxy
3. Set up monitoring and logs
4. Create backup scripts
```

---

## 🎯 **Your Gaming Rig vs Cloud VPS**

### **Your Setup:**
- **Cost**: $0/month (just electricity)
- **Storage**: 6TB (vs 20GB VPS)
- **RAM**: 32GB (vs 2GB VPS)
- **Control**: 100% ownership
- **Reliability**: Your internet uptime

### **Cloud VPS:**
- **Cost**: $50-100/month
- **Storage**: 20-50GB max
- **RAM**: 2-4GB typically
- **Control**: Shared/limited
- **Reliability**: 99.9% uptime

**Your rig is actually BETTER for this use case!**

---

## 🔥 **Next Steps**

Want me to:

1. **Update the node package.json** with all dependencies?
2. **Create the complete startup scripts** for your Linux box?
3. **Modify the frontend** to connect to your anchor node?
4. **Set up automatic earnings tracking** for your node?

**Your 4770K with 6TB storage could literally be the backbone of the entire OnusOne network!** 🎮🚀

This is way cooler than paying Vercel - you become the actual infrastructure owner.
