# OnusOne P2P App - Deployment Guide

## 🚀 Quick Deploy to Vercel

### Option 1: Automated Deployment (Recommended)
```bash
# From the project root directory
./deploy-vercel.sh
```

### Option 2: Manual Deployment
```bash
# Navigate to frontend directory
cd frontend

# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Install dependencies
npm install

# Build the project
npm run build

# Deploy
vercel --prod
```

---

## 📋 Prerequisites

### Required Tools
- **Node.js**: Version 18+ (check with `node --version`)
- **npm**: Version 8+ (check with `npm --version`)
- **Git**: For version control
- **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

### Environment Setup
- **Vercel CLI**: Install globally with `npm install -g vercel`
- **Project Access**: Ensure you have access to the Vercel project

---

## 🔧 Configuration Files

### Vercel Configuration (`frontend/vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

### Next.js Configuration (`frontend/next.config.js`)
```javascript
const nextConfig = {
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true }
}
```

---

## 🚨 Common Deployment Issues

### Build Failures
**Problem**: Build fails during deployment
**Solutions**:
- Check Node.js version compatibility
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Verify all dependencies are in `package.json`
- Check for TypeScript errors: `npm run type-check`

### Environment Variables
**Problem**: Missing environment variables
**Solutions**:
- Create `.env.local` file in frontend directory
- Add required variables to Vercel dashboard
- Check `env.template` for required variables

### Wallet Connection Issues
**Problem**: Wallet not connecting after deployment
**Solutions**:
- Verify domain is whitelisted in wallet settings
- Check HTTPS is enabled (Vercel provides this)
- Test with different wallets (Phantom, Solflare)

### API Endpoint Issues
**Problem**: API calls failing
**Solutions**:
- Check API routes are properly configured
- Verify CORS settings for external APIs
- Test API endpoints locally before deployment

---

## 🔍 Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved (or ignored in config)
- [ ] ESLint passes: `npm run lint`
- [ ] Build succeeds locally: `npm run build`
- [ ] Tests pass: `npm test`

### Dependencies
- [ ] All dependencies in `package.json`
- [ ] No conflicting peer dependencies
- [ ] Lock file committed (`package-lock.json`)

### Configuration
- [ ] Environment variables configured
- [ ] API endpoints updated for production
- [ ] Wallet connection settings verified
- [ ] CORS settings configured

---

## 🌐 Post-Deployment Verification

### Basic Functionality
- [ ] App loads without errors
- [ ] Wallet connection works
- [ ] Navigation functions properly
- [ ] Content posting works
- [ ] User authentication functions

### Performance
- [ ] Page load times acceptable
- [ ] No console errors
- [ ] Responsive design works
- [ ] PWA features functional

### Security
- [ ] HTTPS enabled
- [ ] Security headers present
- [ ] Wallet transactions secure
- [ ] No sensitive data exposed

---

## 🛠️ Troubleshooting

### Deployment Hangs
```bash
# Cancel deployment
Ctrl+C

# Clear Vercel cache
vercel --clear-cache

# Retry deployment
vercel --prod
```

### Build Timeout
```bash
# Increase build timeout in vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### Memory Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📱 Mobile Deployment

### PWA Configuration
- Ensure `next-pwa` is properly configured
- Test service worker functionality
- Verify manifest.json settings

### Responsive Design
- Test on various screen sizes
- Verify touch interactions work
- Check mobile wallet integration

---

## 🔄 Continuous Deployment

### GitHub Integration
1. Connect GitHub repository to Vercel
2. Enable automatic deployments on push
3. Configure branch protection rules
4. Set up preview deployments for PRs

### Environment Management
- **Development**: `vercel --dev`
- **Staging**: `vercel --staging`
- **Production**: `vercel --prod`

---

## 📊 Monitoring & Analytics

### Vercel Analytics
- Enable Vercel Analytics in dashboard
- Monitor performance metrics
- Track user engagement

### Error Tracking
- Set up error monitoring
- Configure alerting for critical issues
- Monitor wallet connection success rates

---

## 🆘 Getting Help

### Vercel Support
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Vercel Status](https://vercel-status.com)

### Project Support
- Check `USER_FLOW_GUIDE.md` for user issues
- Review GitHub issues and discussions
- Contact project maintainers

---

## 🎯 Success Metrics

### Deployment Success
- [ ] Zero build errors
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security scan passed

### User Experience
- [ ] Wallet connection >95% success rate
- [ ] Post creation <2 second response time
- [ ] Page load <3 seconds
- [ ] Mobile responsiveness verified

---

*This guide covers the complete deployment process from local development to production deployment on Vercel. For user-facing issues, refer to `USER_FLOW_GUIDE.md`.*
