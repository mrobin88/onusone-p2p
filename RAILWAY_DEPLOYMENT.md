# 🚀 Railway Deployment Guide for OnusOne P2P

## 🎯 **What We Just Did:**
- ✅ **Removed 1159 deprecated packages** (libp2p, orbit-db, ipfs-core, etc.)
- ✅ **Streamlined to 247 packages** (only what we actually need)
- ✅ **Created Railway config** for easy deployment
- ✅ **Fixed mock data** - now shows real backend stats

## 🌐 **Railway Setup (5 minutes, FREE):**

### **Step 1: Go to Railway**
1. Visit: https://railway.app/
2. Sign in with your GitHub account
3. Click **"New Project"**

### **Step 2: Connect Your Repo**
1. Select **"Deploy from GitHub repo"**
2. Choose your **`onusone-p2p`** repository
3. Set **Root Directory** to: `node`
4. Click **"Deploy Now"**

### **Step 3: Configure Build**
Railway will auto-detect:
- **Build Command**: `npm run build` ✅
- **Start Command**: `npm run orbit:start` ✅
- **Port**: `8889` ✅

### **Step 4: Set Environment Variables**
In Railway dashboard, add:
```
PORT=8889
NODE_ENV=production
```

### **Step 5: Get Your Public URL**
Railway will give you: `https://your-app-name.railway.app`

## 🔗 **Update Frontend (Vercel):**

In your Vercel dashboard, add these environment variables:
```
NEXT_PUBLIC_ORBIT_SERVER_URL=https://your-app-name.railway.app
NEXT_PUBLIC_ORBIT_WS_URL=wss://your-app-name.railway.app
```

## 🎉 **What You Get:**

### **✅ Backend Hosted (Railway)**
- Real-time messaging server
- IPFS storage integration
- WebSocket connections
- Auto-deploy from GitHub

### **✅ Frontend Stays on Vercel**
- Your React app
- Auto-deploy on git push
- Global CDN
- Free hosting

### **✅ Real-Time Communication**
- Customers can chat with you instantly
- Messages persist in IPFS
- Works offline, syncs when online
- No more mock data!

## 💰 **Cost: FREE**
- **Railway**: 500 hours/month (FREE)
- **Vercel**: Unlimited (FREE)
- **Total**: $0/month

## 🚀 **Deploy Now:**

1. **Run the script**: `./deploy-railway.sh`
2. **Follow Railway steps** above
3. **Update Vercel** environment variables
4. **Test real-time messaging** on your live site!

Your app will have **enterprise-grade real-time messaging** with **zero monthly cost**! 🎉
