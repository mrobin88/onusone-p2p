# 🚀 Render Environment Variables - Essential Only

## ⚠️ SECURITY WARNING
**DO NOT copy the compromised keys from Vercel!** You need to regenerate these.

## 🔑 Essential Variables for Render Backend:

### **1. Supabase Database**
```bash
SUPABASE_URL=https://vzkdahthvksbcaqymuyz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2RhaHRodmtzYmNhaXltdXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNTk0NjksImV4cCI6MjA3MDUzNTQ2OX0.n8uTn2WWbtlvO08mNYcGQs7gcAWXRnEKVpLBaILxl0Y
```

### **2. Solana Network (Production)**
```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
```

### **3. ONU Token (After Mainnet Deployment)**
```bash
ONU_TOKEN_MINT=YOUR_NEW_MAINNET_TOKEN_ADDRESS
```

### **4. App Configuration**
```bash
NODE_ENV=production
PORT=8888
```

## 🚨 **REGENERATE THESE (Don't Copy from Vercel):**

### **1. New Treasury Wallet**
```bash
# Generate a NEW treasury wallet for Render
TREASURY_PRIVATE_KEY=YOUR_NEW_BASE58_PRIVATE_KEY
TREASURY_ADDRESS=YOUR_NEW_PUBLIC_KEY
```

### **2. New Stripe Keys**
```bash
# Get NEW keys from Stripe dashboard
STRIPE_SECRET_KEY=sk_live_YOUR_NEW_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_NEW_SECRET
```

### **3. New IPFS Keys (Optional)**
```bash
# Use Infura IPFS instead of Pinata
IPFS_INFURA_PROJECT_ID=YOUR_INFURA_PROJECT_ID
IPFS_INFURA_PROJECT_SECRET=YOUR_INFURA_PROJECT_SECRET
```

## 📋 **Steps to Secure Your App:**

1. **Immediately regenerate** compromised keys
2. **Deploy ONU token to mainnet** (not devnet)
3. **Create new treasury wallet** for Render
4. **Get new Stripe keys** from dashboard
5. **Add only the essential variables** above to Render

## 💡 **Why These Are Essential:**

- **Supabase**: Your database (already working)
- **Solana**: Blockchain connection (needs mainnet)
- **ONU Token**: Your token contract (needs deployment)
- **Treasury**: Token distribution (needs new wallet)
- **Stripe**: Payment processing (needs new keys)

## 🔒 **Security Best Practices:**

- **Never commit** private keys to git
- **Use different keys** for different environments
- **Rotate keys** regularly
- **Monitor for unauthorized usage**

---

**Next Step**: Regenerate compromised keys before adding anything to Render!
