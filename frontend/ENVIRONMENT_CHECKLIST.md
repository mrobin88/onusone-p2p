# 🔒 Environment Variables Security Checklist

## 🚨 CRITICAL SECURITY ISSUES - IMMEDIATE ACTION REQUIRED

### 1. EXPOSED PRIVATE KEYS (ROTATE IMMEDIATELY)
- [ ] **TREASURY_PRIVATE_KEY** - Currently exposed in logs, COMPROMISED
- [ ] **STRIPE_SECRET_KEY** - Live key exposed, COMPROMISED  
- [ ] **PINATA_SECRET_KEY** - Currently exposed, COMPROMISED

### 2. SWITCH TO TEST KEYS
- [ ] **STRIPE_SECRET_KEY** - Change from `sk_live_` to `sk_test_`
- [ ] **STRIPE_WEBHOOK_SECRET** - Change from `sk_live_` to `sk_test_`
- [ ] **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** - Change from `rk_live_` to `rk_test_`

## ✅ CURRENTLY SET (ENCRYPTED)
- [x] NEXTAUTH_SECRET
- [x] NEXTAUTH_URL
- [x] AUTH_TRUST_HOST
- [x] NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY
- [x] NEXT_PUBLIC_TOKEN_MINT
- [x] NEXT_PUBLIC_TOKEN_SYMBOL
- [x] NEXT_PUBLIC_TREASURY_ADDRESS
- [x] PINATA_API_KEY
- [x] REDIS_URL

## ❌ MISSING OR EMPTY (CRITICAL)
- [ ] **NEXT_PUBLIC_PROGRAM_ID** - Required for Solana program interactions
- [ ] **KV_REST_API_URL** - Required for database operations
- [ ] **KV_REST_API_TOKEN** - Required for database authentication
- [ ] **CRON_SECRET** - Required for cron job security
- [ ] **ADMIN_API_KEY** - Required for admin endpoints
- [ ] **SOLANA_RPC** - Required for Solana RPC fallback

## 🔧 REQUIRED ACTIONS

### Step 1: Rotate Compromised Keys
```bash
# Generate new treasury private key
solana-keygen new --outfile new-treasury-keypair.json

# Update in Vercel dashboard
vercel env add TREASURY_PRIVATE_KEY
```

### Step 2: Switch to Test Keys
```bash
# Get test keys from Stripe dashboard
# Update in Vercel dashboard
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET  
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

### Step 3: Add Missing Variables
```bash
# Add program ID
vercel env add NEXT_PUBLIC_PROGRAM_ID

# Add KV database credentials
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN

# Add security keys
vercel env add CRON_SECRET
vercel env add ADMIN_API_KEY
```

### Step 4: Verify All Variables
```bash
# Check current status
vercel env ls

# Test build locally
npm run build
```

## 🛡️ SECURITY BEST PRACTICES

1. **Never commit .env files** to version control
2. **Use test keys** for development and staging
3. **Rotate keys regularly** (every 90 days)
4. **Use environment-specific values** (dev/staging/prod)
5. **Monitor for exposed secrets** in logs and public repos
6. **Use Vercel's encryption** for all sensitive values

## 📋 DEPLOYMENT CHECKLIST

- [ ] All compromised keys rotated
- [ ] Test keys configured for development
- [ ] Missing environment variables added
- [ ] Local build successful
- [ ] Vercel deployment successful
- [ ] Environment health check passed
