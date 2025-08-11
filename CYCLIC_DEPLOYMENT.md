# 🚀 Cyclic Deployment Guide (FREE - Simplest Setup)

## 🎯 **Why Cyclic is the BEST Choice:**
- ✅ **No trial period** - completely free from start
- ✅ **No credit card required** - just GitHub login
- ✅ **Unlimited deployments** - no monthly limits
- ✅ **Simplest setup** - literally 5 minutes
- ✅ **Most reliable** free tier
- ✅ **Perfect for Node.js** apps like yours

## 🌐 **Cyclic Setup (5 minutes, FREE):**

### **Step 1: Go to Cyclic**
1. Visit: **https://www.cyclic.sh/**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Cyclic to access your GitHub

### **Step 2: Link Your Repository**
1. Click **"Link Your Own"**
2. Select **"GitHub"**
3. Choose your **`onusone-p2p`** repository
4. Click **"Link"**

### **Step 3: Deploy (Automatic)**
Cyclic will automatically detect your `cyclic.json`:
- **Name**: `onusone-p2p-backend` ✅
- **Type**: `Node` ✅
- **Build Command**: `npm run build` ✅
- **Start Command**: `npm run orbit:start` ✅
- **Environment**: `production` ✅
- **Port**: `8889` ✅

### **Step 4: Get Your URL**
1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Get your URL: `https://your-app-name.cyclic.app`

## 🔧 **What Happens Automatically:**
- ✅ **Port 8889** configured
- ✅ **Environment variables** set
- ✅ **Build process** runs
- ✅ **Server starts** with your OrbitDB system
- ✅ **SSL certificate** generated
- ✅ **Auto-deploy** on every git push

## 🔗 **Update Frontend (Vercel):**

In your Vercel dashboard, add these environment variables:
```
NEXT_PUBLIC_ORBIT_SERVER_URL=https://your-app-name.cyclic.app
NEXT_PUBLIC_ORBIT_WS_URL=wss://your-app-name.cyclic.app
```

## 🎉 **What You Get:**
- **✅ Backend hosted** on Cyclic (FREE)
- **✅ Real-time messaging** working worldwide
- **✅ IPFS storage** accessible from anywhere
- **✅ WebSocket connections** for instant chat
- **✅ Auto-deploy** on every git push
- **✅ No monthly limits** or hidden costs

## 💰 **Cost: $0/month**
- **Cyclic**: Unlimited (FREE)
- **Vercel**: Unlimited (FREE)
- **Total**: $0/month

## 🚀 **Deploy Now:**

1. **Run the script**: `chmod +x deploy-cyclic.sh && ./deploy-cyclic.sh`
2. **Follow Cyclic steps** above
3. **Update Vercel** environment variables
4. **Test real-time messaging** on your live site!

## 🔄 **Auto-Deploy (Best Feature):**
Every time you push to GitHub, Cyclic will automatically:
- Pull your latest code
- Run `npm run build`
- Restart your server
- Deploy the new version

**No manual deployment needed!** 🚀

## 🎯 **Why Cyclic Beats Railway/Render:**
- **✅ No trial period** (Railway has trials)
- **✅ No credit card** (Render sometimes asks)
- **✅ Unlimited deployments** (others have monthly limits)
- **✅ Simplest setup** (5 minutes vs 10-15 minutes)
- **✅ Most reliable** free tier
- **✅ Perfect for Node.js** apps

Your app will have **enterprise-grade real-time messaging** with **zero monthly cost** and **the simplest setup possible**! 🎉

## 🚨 **Important Notes:**
- Cyclic will sleep after 15 minutes of inactivity
- First request after sleep takes 10-15 seconds
- Perfect for development and testing
- Can upgrade to paid plan for always-on if needed later

**Ready to deploy? Let's get your real-time messaging working!** 🚀
