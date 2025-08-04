# OnusOne P2P - API Keys & Services Checklist

## 🔑 **Required API Keys for Deployment**

### **Priority 1: Essential for P2P Network**

#### **1. IPFS Services (Choose One)**
```env
# Option A: Pinata (Recommended for beginners)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
# Cost: $20/month for 100GB
# Sign up: https://pinata.cloud/

# Option B: Infura IPFS (Enterprise)
INFURA_PROJECT_ID=your_infura_project_id
INFURA_PROJECT_SECRET=your_infura_secret
INFURA_IPFS_ENDPOINT=https://ipfs.infura.io:5001
# Cost: $50/month for starter plan
# Sign up: https://infura.io/

# Option C: Web3.Storage (Free tier available)
WEB3_STORAGE_API_TOKEN=your_web3_storage_token
# Cost: Free up to 5GB, then $5/TB/month
# Sign up: https://web3.storage/
```

#### **2. Blockchain RPC Services**
```env
# Solana Mainnet (Production)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# Free tier: 100 requests/second
# Paid: Use Alchemy or Quicknode

# Alchemy Solana (Recommended)
ALCHEMY_SOLANA_API_KEY=your_alchemy_key
ALCHEMY_SOLANA_RPC=https://solana-mainnet.g.alchemy.com/v2/your_key
# Cost: Free tier 300M compute units/month
# Sign up: https://alchemy.com/

# Alternative: QuickNode
QUICKNODE_SOLANA_URL=https://your-endpoint.solana-mainnet.quiknode.pro/your_key/
# Cost: $9/month starter plan
# Sign up: https://quicknode.com/
```

### **Priority 2: Cloud Infrastructure**

#### **3. Bootstrap Node Hosting (Choose One)**
```env
# Option A: DigitalOcean (Simple)
DO_ACCESS_TOKEN=your_digitalocean_token
# Cost: $6/month per droplet (need 2-3)
# Sign up: https://digitalocean.com/

# Option B: AWS (Scalable)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
# Cost: $5-15/month per EC2 instance
# Sign up: https://aws.amazon.com/

# Option C: Linode (Developer-friendly)
LINODE_API_TOKEN=your_linode_token
# Cost: $5/month per node
# Sign up: https://linode.com/
```

#### **4. Domain & CDN**
```env
# Cloudflare (Recommended for DNS + CDN)
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ZONE_ID=your_zone_id
# Cost: Free tier available, Pro $20/month
# Sign up: https://cloudflare.com/

# Domain Registration
# Cost: $10-15/year
# Providers: Namecheap, Google Domains, Cloudflare
```

### **Priority 3: Monitoring & Analytics**

#### **5. Error Tracking**
```env
# Sentry (Error monitoring)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_public_sentry_dsn
# Cost: Free tier 5K errors/month, $26/month for more
# Sign up: https://sentry.io/
```

#### **6. Analytics (Optional)**
```env
# PostHog (Privacy-focused analytics)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
# Cost: Free tier 1M events/month
# Sign up: https://posthog.com/

# Alternative: Plausible Analytics
PLAUSIBLE_DOMAIN=your_domain.com
# Cost: $9/month for 10K pageviews
# Sign up: https://plausible.io/
```

### **Priority 4: Advanced Features**

#### **7. Real-time Communication**
```env
# Pusher (Real-time updates)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=us2
# Cost: Free tier 100 connections, $49/month for more
# Sign up: https://pusher.com/

# Alternative: Ably
ABLY_API_KEY=your_ably_key
# Cost: Free tier 3M messages/month
# Sign up: https://ably.com/
```

#### **8. Email Services**
```env
# SendGrid (Transactional emails)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@your-domain.com
# Cost: Free tier 100 emails/day, $15/month for 50K
# Sign up: https://sendgrid.com/

# Alternative: Resend
RESEND_API_KEY=your_resend_key
# Cost: Free tier 3K emails/month, $20/month for 50K
# Sign up: https://resend.com/
```

---

## 📋 **Setup Priority Order**

### **Week 1: Core P2P Infrastructure**
1. ✅ **IPFS Service** (Pinata or Web3.Storage)
2. ✅ **Blockchain RPC** (Alchemy Solana)
3. ✅ **Bootstrap Hosting** (DigitalOcean droplets)
4. ✅ **Domain Registration** + Cloudflare

### **Week 2: Monitoring & Reliability**
5. ✅ **Error Tracking** (Sentry)
6. ✅ **Analytics** (PostHog)
7. ✅ **Real-time Services** (Pusher)

### **Week 3: Production Polish**
8. ✅ **Email Services** (SendGrid)
9. ✅ **Advanced Monitoring** (Grafana Cloud)
10. ✅ **Security Services** (Cloudflare Pro)

---

## 💰 **Cost Breakdown**

### **Minimal P2P Setup:**
```
IPFS (Web3.Storage): $0 (free tier)
Solana RPC (Alchemy): $0 (free tier)
Bootstrap Nodes (DO): $18/month (3x $6)
Domain: $12/year
Total: ~$20/month + $12/year
```

### **Production Setup:**
```
IPFS (Pinata): $20/month
Solana RPC (Alchemy): $49/month
Bootstrap Nodes (AWS): $45/month
Cloudflare Pro: $20/month
Sentry: $26/month
PostHog: $0 (free tier)
Domain: $12/year
Total: ~$160/month + $12/year
```

### **Enterprise Setup:**
```
IPFS (Infura): $50/month
Blockchain (QuickNode): $49/month
Cloud Infrastructure: $200/month
CDN & Security: $100/month
Monitoring Suite: $150/month
Email & Comms: $50/month
Total: ~$599/month
```

---

## 🛠️ **Environment Configuration**

### **Create `.env.production`:**
```bash
# Copy this template and fill in your keys
cp node/env.example node/.env.production

# Required environment variables:
NODE_ENV=production
IPFS_PINNING_SERVICE=pinata
PINATA_API_KEY=your_key_here
BLOCKCHAIN_RPC_URL=your_rpc_here
SENTRY_DSN=your_sentry_dsn
```

### **Security Best Practices:**
```bash
# Never commit API keys to git
echo "*.env*" >> .gitignore

# Use different keys for dev/staging/prod
# Rotate keys every 90 days
# Use least-privilege access
# Monitor API key usage
```

---

## 🚀 **Quick Start Commands**

### **1. Get Essential Keys:**
```bash
# Sign up for these services first:
# 1. Pinata.cloud (IPFS)
# 2. Alchemy.com (Solana RPC)
# 3. DigitalOcean.com (Hosting)
# 4. Cloudflare.com (DNS)
```

### **2. Configure Environment:**
```bash
# Copy and edit environment file
cd onusone-p2p/node
cp env.example .env.production
nano .env.production
```

### **3. Deploy Bootstrap Infrastructure:**
```bash
# Deploy to DigitalOcean
npm run deploy:bootstrap

# Configure DNS
npm run setup:dns

# Start monitoring
npm run setup:monitoring
```

---

## ✅ **Verification Checklist**

- [ ] IPFS service account created and API keys obtained
- [ ] Blockchain RPC service configured and tested
- [ ] Bootstrap node infrastructure deployed
- [ ] Domain registered and DNS configured
- [ ] SSL certificates installed
- [ ] Monitoring services connected
- [ ] Error tracking configured
- [ ] Environment variables secured
- [ ] Backup systems in place
- [ ] Network connectivity tested

---

**Next Step: Follow the deployment instructions in `DEPLOYMENT-STRATEGY.md` to set up your P2P infrastructure!**