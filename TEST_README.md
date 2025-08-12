# 🧪 Core P2P System Test

Simple, minimal test file to verify your P2P messaging system works.

## 🚀 Quick Test

```bash
# Test your core P2P functionality
npm run test:core
```

## 📋 What It Tests

1. **✅ Backend Health** - Local and Render backend status
2. **✅ Message Creation** - Can create and store messages
3. **✅ Decay System** - Content decay over time
4. **✅ Staking System** - User staking and rewards

## 🎯 Test Results

- **Green** = System working ✅
- **Yellow** = Warning (non-critical) ⚠️
- **Red** = System broken ❌

## 🔧 Configuration

Edit `test-core-p2p.js` to change:
- Backend URLs
- Test timeouts
- Test endpoints

## 🚨 What to Fix

If tests fail:
1. **Backend Health** → Check if backend is running
2. **Message Creation** → Check database/API endpoints
3. **Decay System** → Check decay algorithm
4. **Staking System** → Check staking endpoints

## 💡 Usage

```bash
# Test everything
npm run test:core

# Test specific functionality
node test-core-p2p.js

# Import in other tests
const { runTests } = require('./test-core-p2p.js');
```

## 🎉 Success

When all tests pass:
- ✅ Your P2P system is ready
- ✅ Users can send messages
- ✅ Decay system works
- ✅ Staking rewards function
- ✅ Time to launch! 🚀
