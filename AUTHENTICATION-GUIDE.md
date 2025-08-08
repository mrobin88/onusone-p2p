# 🔐 OnusOne P2P Authentication Guide

## 🎯 **What We've Built**

We've completely removed the hardcoded `admin/admin` credentials and implemented a proper user authentication system with crypto wallet linking capabilities.

### ✅ **New Features:**
- **User Registration** - Create accounts with username, email, and password
- **Secure Login** - Password-based authentication with bcrypt hashing
- **Crypto Wallet Linking** - Link Solana wallets to your account
- **Account Management** - View profile, reputation, and wallet info
- **Session Management** - Persistent login sessions

---

## 🚀 **How to Use the New System**

### **1. User Registration**
Visit: `http://localhost:3000/auth/register`

**Required Fields:**
- **Username** (minimum 3 characters)
- **Email** (valid email format)
- **Password** (minimum 6 characters)
- **Wallet Address** (optional - can be added later)

**Example Registration:**
```
Username: alice
Email: alice@example.com
Password: mysecurepassword123
Wallet Address: (leave empty for now)
```

### **2. User Login**
Visit: `http://localhost:3000/auth/login`

**Login with your registered credentials:**
```
Username: alice
Password: mysecurepassword123
```

### **3. Link Crypto Wallet**
After logging in, visit: `http://localhost:3000/account`

**Two ways to link your wallet:**

#### **Option A: Auto-link from connected wallet**
1. Click "Connect Wallet" button
2. Connect your Phantom/Solflare wallet
3. Click "Link Connected Wallet"

#### **Option B: Manual wallet address entry**
1. Enter your wallet address manually
2. Click "Link Manual Address"

---

## 🔧 **Technical Implementation**

### **Backend API Endpoints**

#### **Registration** (`/api/auth/register`)
```typescript
POST /api/auth/register
{
  "username": "alice",
  "email": "alice@example.com", 
  "password": "mysecurepassword123",
  "walletAddress": "optional_solana_address"
}
```

#### **Login** (`/api/auth/[...nextauth]`)
```typescript
POST /api/auth/login
{
  "username": "alice",
  "password": "mysecurepassword123"
}
```

#### **Link Wallet** (`/api/auth/link-wallet`)
```typescript
POST /api/auth/link-wallet
{
  "walletAddress": "solana_wallet_address"
}
```

### **Database Storage (Vercel KV)**
```typescript
// User data structure
{
  id: "user_1234567890_abc123",
  username: "alice",
  email: "alice@example.com",
  passwordHash: "bcrypt_hashed_password",
  walletAddress: "solana_wallet_address",
  createdAt: "2024-01-01T00:00:00.000Z",
  reputationScore: 0,
  isActive: true
}
```

---

## 🛡️ **Security Features**

### **Password Security**
- **bcrypt hashing** with 12 salt rounds
- **Minimum 6 characters** required
- **No plain text storage**

### **Session Security**
- **JWT tokens** for session management
- **Secure cookie storage**
- **Automatic session expiry**

### **Wallet Security**
- **Address validation** (basic format checking)
- **One wallet per account** (prevents duplicate linking)
- **Secure storage** in Vercel KV

### **Input Validation**
- **Username**: 3+ characters, unique
- **Email**: Valid format, unique
- **Password**: 6+ characters
- **Wallet Address**: Valid Solana format

---

## 🎨 **User Experience**

### **Registration Flow**
1. User visits `/auth/register`
2. Fills out registration form
3. System validates input
4. Account created in Vercel KV
5. Redirected to login page
6. Success message shown

### **Login Flow**
1. User visits `/auth/login`
2. Enters credentials
3. NextAuth validates against KV
4. Session created
5. Redirected to home page

### **Wallet Linking Flow**
1. User visits `/account`
2. Connects wallet or enters address
3. System validates wallet address
4. Wallet linked to account
5. Success message shown

---

## 🔄 **Migration from Old System**

### **What Changed:**
- ❌ Removed hardcoded `admin/admin` credentials
- ❌ Removed demo quick login button
- ✅ Added proper user registration
- ✅ Added secure password authentication
- ✅ Added crypto wallet linking
- ✅ Added account management page

### **For Existing Users:**
- **No migration needed** - old sessions will expire
- **New users** must register with the new system
- **All features** work with new authentication

---

## 🚨 **Is This Sketchy?**

### **No, this is actually MORE secure:**

#### **Before (Sketchy):**
```javascript
// Hardcoded credentials - VERY UNSAFE
if (username === 'admin' && password === 'admin') {
  // Grant access
}
```

#### **After (Secure):**
```javascript
// Proper authentication with bcrypt
const passwordValid = await bcrypt.compare(password, user.passwordHash);
if (passwordValid && user.isActive) {
  // Grant access
}
```

### **Security Improvements:**
- ✅ **No hardcoded passwords**
- ✅ **Proper password hashing**
- ✅ **User account validation**
- ✅ **Session management**
- ✅ **Input sanitization**
- ✅ **Rate limiting ready**

---

## 🧪 **Testing the System**

### **Create Test Account:**
```bash
# Visit: http://localhost:3000/auth/register
Username: testuser
Email: test@example.com
Password: testpass123
```

### **Login Test:**
```bash
# Visit: http://localhost:3000/auth/login
Username: testuser
Password: testpass123
```

### **Link Wallet Test:**
```bash
# Visit: http://localhost:3000/account
# Connect wallet or enter test address
```

---

## 🔮 **Future Enhancements**

### **Planned Features:**
- [ ] **Email verification** for new accounts
- [ ] **Password reset** functionality
- [ ] **Two-factor authentication** (2FA)
- [ ] **Social login** (Google, GitHub)
- [ ] **Account deletion** with data cleanup
- [ ] **Profile customization** (avatar, bio)
- [ ] **Privacy settings** (public/private profiles)

### **Security Enhancements:**
- [ ] **Rate limiting** on auth endpoints
- [ ] **IP-based blocking** for suspicious activity
- [ ] **Audit logging** for security events
- [ ] **Account recovery** options

---

## 📞 **Support**

### **Common Issues:**

#### **"Username already exists"**
- Try a different username
- Usernames are case-insensitive

#### **"Email already registered"**
- Use a different email address
- Or try logging in if you already have an account

#### **"Invalid wallet address"**
- Ensure it's a valid Solana address
- Check for typos in the address

#### **"Wallet already linked"**
- Each wallet can only be linked to one account
- Contact support if you need to change wallets

### **Getting Help:**
- **GitHub Issues**: Report bugs or feature requests
- **Documentation**: Check this guide for common solutions
- **Community**: Ask questions in the P2P network

---

**🎉 The new authentication system is more secure, user-friendly, and ready for production use!**
