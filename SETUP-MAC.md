# OnusOne P2P - Mac Setup Guide (No Docker Required)

## 🚀 Quick Start for Mac

### Prerequisites
- **Node.js 18+**: `brew install node`
- **npm 9+**: Comes with Node.js
- **Git**: `brew install git`

### Option 1: Automatic Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/mrobin88/onusone-p2p.git
cd onusone-p2p

# Run the automatic startup script
./start-local.sh
```

This will:
- ✅ Install all dependencies
- ✅ Build the shared library
- ✅ Start the node backend
- ✅ Start the frontend
- ✅ Open the application in your browser

### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/mrobin88/onusone-p2p.git
cd onusone-p2p

# Install all dependencies
npm run install:all

# Build shared library
cd shared && npm run build && cd ..

# Start the application
npm run dev
```

## 🌐 Access Your Application

Once running, you can access:

- **Frontend**: http://localhost:3000
- **Node API**: http://localhost:8888
- **Health Check**: http://localhost:8888/health

## 🔧 Development Commands

### Start Individual Services

```bash
# Start frontend only
cd frontend && npm run dev

# Start node only
cd node && npm run dev

# Start both (from root)
npm run dev
```

### Build Commands

```bash
# Build all components
npm run build:all

# Build individual components
cd shared && npm run build
cd ../node && npm run build
cd ../frontend && npm run build
```

### Test Commands

```bash
# Test all components
npm run test:all

# Test individual components
cd shared && npm test
cd ../node && npm test
cd ../frontend && npm test
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :8888

# Kill processes if needed
kill -9 <PID>
```

#### 2. Node Modules Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
cd shared && rm -rf node_modules package-lock.json && npm install
cd ../node && rm -rf node_modules package-lock.json && npm install
cd ../frontend && rm -rf node_modules package-lock.json && npm install
```

#### 3. TypeScript Errors
```bash
# Rebuild shared library
cd shared && npm run build
```

#### 4. Frontend Not Loading
```bash
# Check if Next.js is running
ps aux | grep "next dev"

# Restart frontend
cd frontend && npm run dev
```

#### 5. Node API Not Responding
```bash
# Check if node is running
ps aux | grep "tsx watch"

# Restart node
cd node && npm run dev
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# View detailed logs
tail -f logs/onusone-node.log
```

## 📱 Testing the Application

### Test the API
```bash
# Health check
curl http://localhost:8888/health

# Node info
curl http://localhost:8888/api/node

# Get messages
curl http://localhost:8888/api/messages

# Post a message
curl -X POST http://localhost:8888/api/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello OnusOne!","author":"testuser"}'
```

### Test the Frontend
```bash
# Open in browser
open http://localhost:3000

# Or use curl
curl http://localhost:3000
```

## 🔄 Development Workflow

### 1. Make Changes
- Edit files in `frontend/src/` for UI changes
- Edit files in `node/src/` for backend changes
- Edit files in `shared/src/` for shared logic

### 2. See Changes
- Frontend: Changes appear automatically (hot reload)
- Node: Restart with `Ctrl+C` then `npm run dev`

### 3. Test Changes
```bash
# Run tests
npm run test:all

# Check types
npm run type-check
```

## 🚀 Production Setup (Optional)

When you're ready for production:

### 1. Build for Production
```bash
# Build all components
npm run build:all
```

### 2. Start Production Services
```bash
# Start node in production mode
cd node && NODE_ENV=production npm start

# Start frontend in production mode
cd frontend && NODE_ENV=production npm start
```

### 3. Use PM2 for Process Management
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js
```

## 📊 Monitoring

### Check Service Status
```bash
# Check if services are running
ps aux | grep -E "(next|tsx)"

# Check ports
lsof -i :3000
lsof -i :8888
```

### View Logs
```bash
# Frontend logs
tail -f frontend/.next/server.log

# Node logs
tail -f node/logs/onusone-node.log
```

## 🎯 Next Steps

1. **Explore the codebase**: Check out the components in each directory
2. **Add features**: Start with the frontend UI or node API
3. **Set up CI/CD**: Push to GitHub to trigger the automated pipelines
4. **Deploy**: When ready, use the GitHub Actions for deployment

---

**OnusOne P2P** - Take back control. Use what you already have. 