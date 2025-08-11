# 🚀 Quick Deploy to Vercel

## ⚡ 5-Minute Deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy (from project root)
```bash
./deploy-vercel.sh
```

**OR manually:**
```bash
cd frontend
npm install
npm run build
vercel --prod
```

---

## 🔧 Required Setup

### Environment Variables (in Vercel Dashboard)
- `NEXT_PUBLIC_SOLANA_RPC_URL`: Solana RPC endpoint
- `NEXT_PUBLIC_SOLANA_NETWORK`: devnet/mainnet
- `NEXT_PUBLIC_TOKEN_MINT`: Your ONU token address
- `NEXT_PUBLIC_TREASURY_ADDRESS`: Treasury wallet address

### Wallet Configuration
- Ensure your domain is whitelisted in wallet settings
- Test with Phantom and Solflare wallets

---

## ✅ Post-Deployment Checklist

- [ ] App loads without errors
- [ ] Wallet connection works
- [ ] Can create posts
- [ ] Can reply to posts
- [ ] Staking functionality works
- [ ] Mobile responsive

---

## 🆘 Need Help?

- **Deployment Issues**: Check `DEPLOYMENT_README.md`
- **User Issues**: Check `USER_FLOW_GUIDE.md`
- **Vercel Support**: [vercel.com/docs](https://vercel.com/docs)

---

## 📱 Share Your App

Once deployed, share the Vercel URL with users and direct them to `USER_FLOW_GUIDE.md` for complete instructions!
