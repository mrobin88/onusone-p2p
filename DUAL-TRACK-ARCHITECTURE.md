# OnusOne P2P - Dual-Track Architecture

## 🎯 **Architecture Overview**

### **Track 1: P2P/Blockchain Version** 🚀
- **Backend**: Node.js with libp2p networking
- **Frontend**: React/Next.js (current onusone-p2p)
- **Database**: Decentralized (IPFS + local storage)
- **Auth**: Web3 wallet authentication
- **Focus**: Decentralized, blockchain, Web3, content decay
- **Status**: ✅ Working foundation

### **Track 2: Classic Django Version** 🏗️
- **Backend**: Django (lamp_lighter)
- **Frontend**: Next.js (lamp_lighter frontend)
- **Database**: PostgreSQL/MySQL
- **Auth**: Traditional Django auth
- **Focus**: Traditional, functional, proven, rapid development
- **Status**: 🔄 Ready for integration

## 🏗️ **Project Structure**

```
/Users/matthewrobin/Projects/
├── onusone-p2p/          # Track 1: P2P/Blockchain Version
│   ├── frontend/         # React/Next.js
│   ├── node/            # Node.js P2P backend
│   ├── shared/          # TypeScript library
│   └── .github/         # CI/CD pipelines
│
├── lamp_lighter/         # Track 2: Classic Django Version
│   ├── app/
│   │   ├── backend/     # Django backend
│   │   │   ├── topics/  # Board/topic system
│   │   │   ├── messages/ # Messaging system
│   │   │   ├── users/   # User management
│   │   │   └── friends/ # Social features
│   │   └── frontend/    # Next.js frontend
│   └── ...
│
└── shared-docs/         # Shared documentation
```

## 🚀 **Track 1: P2P/Blockchain Development**

### **Current Status** ✅
- Frontend: React/Next.js with board system
- Backend: Node.js with HTTP API
- CI/CD: GitHub Actions ready
- Local dev: Working startup script

### **Next Steps** 🔄
1. **Real P2P Messaging**
   ```typescript
   // node/src/p2p/messaging.ts
   class P2PMessaging {
     async sendMessage(message: Message): Promise<void>;
     async receiveMessage(message: Message): Promise<void>;
     async broadcastMessage(message: Message): Promise<void>;
   }
   ```

2. **Blockchain Integration**
   ```solidity
   // contracts/OnusOneToken.sol
   contract OnusOneToken is ERC20 {
     mapping(address => uint256) public reputation;
     function awardReputation(address user, uint256 amount) external;
   }
   ```

3. **Content Decay Algorithm**
   ```typescript
   // shared/src/decay.ts
   class DecayEngine {
     calculateDecayScore(message: Message): number;
     applyEngagement(message: Message, engagement: Engagement): void;
   }
   ```

## 🏗️ **Track 2: Django Classic Development**

### **Current Status** 🔄
- Backend: Django with topics, messages, users, friends
- Frontend: Next.js (needs integration)
- Database: PostgreSQL ready
- Auth: Django auth system

### **Integration Plan** 📋

#### **Step 1: Setup Django Backend**
```bash
cd lamp_lighter/app/backend
python -m venv venv
source venv/bin/activate  # On Mac
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### **Step 2: Connect Frontend to Django**
```typescript
// lamp_lighter/app/frontend/src/api/django.ts
const DJANGO_API_URL = 'http://localhost:8000/api';

export const djangoApi = {
  getBoards: () => fetch(`${DJANGO_API_URL}/topics/`),
  getMessages: (topicId: string) => fetch(`${DJANGO_API_URL}/messages/?topic=${topicId}`),
  postMessage: (data: any) => fetch(`${DJANGO_API_URL}/messages/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
};
```

#### **Step 3: Django Models Integration**
```python
# lamp_lighter/app/backend/topics/models.py
class Topic(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

# lamp_lighter/app/backend/messages/models.py
class Message(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    content = models.TextField()
    author = models.ForeignKey('users.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField('users.User', related_name='liked_messages')
```

## 🔄 **Development Workflow**

### **Parallel Development**
```bash
# Terminal 1: P2P Track
cd onusone-p2p
./start-local.sh

# Terminal 2: Django Track
cd lamp_lighter/app/backend
python manage.py runserver

# Terminal 3: Django Frontend
cd lamp_lighter/app/frontend
npm run dev
```

### **Shared Components**
```typescript
// Both tracks can share:
- UI components (React)
- Type definitions
- API interfaces
- Utility functions
```

## 🎯 **Feature Parity Goals**

### **Core Features (Both Tracks)**
- [ ] Board/topic system with slugs
- [ ] Message posting and reading
- [ ] User authentication
- [ ] Real-time updates
- [ ] Message engagement (likes, replies)

### **P2P Track Unique Features**
- [ ] Decentralized messaging
- [ ] Content decay algorithm
- [ ] Web3 wallet integration
- [ ] Blockchain reputation system
- [ ] IPFS content storage

### **Django Track Unique Features**
- [ ] Traditional user management
- [ ] Social features (friends, follows)
- [ ] Advanced moderation tools
- [ ] Analytics and insights
- [ ] Email notifications

## 🚀 **Deployment Strategy**

### **P2P Track Deployment**
```bash
# Production: Decentralized
- IPFS for content storage
- Ethereum for reputation
- libp2p for messaging
- Docker containers
```

### **Django Track Deployment**
```bash
# Production: Traditional
- PostgreSQL database
- Redis for caching
- Nginx for serving
- AWS/GCP/Azure hosting
```

## 📊 **Success Metrics**

### **P2P Track Metrics**
- Number of active P2P nodes
- Content decay effectiveness
- Blockchain transaction volume
- Network decentralization score

### **Django Track Metrics**
- User engagement rates
- Message response times
- Database performance
- Traditional web metrics

## 🎯 **Immediate Next Steps**

### **Week 1: Foundation**
1. **Setup Django Track**
   ```bash
   cd lamp_lighter/app/backend
   python manage.py runserver
   # Test Django backend
   ```

2. **Connect Frontend**
   ```bash
   cd lamp_lighter/app/frontend
   npm install
   npm run dev
   # Test frontend integration
   ```

3. **Create Shared Components**
   ```typescript
   // Create shared UI components
   // Both tracks can use the same React components
   ```

### **Week 2: Feature Development**
1. **Board System** (Both tracks)
2. **Message System** (Both tracks)
3. **User Authentication** (Both tracks)

### **Week 3: Differentiation**
1. **P2P Track**: Real P2P messaging
2. **Django Track**: Social features
3. **Shared**: UI/UX improvements

## 🤔 **Key Decisions**

### **1. Shared vs Separate Codebases**
- **Option A**: Completely separate (current)
- **Option B**: Shared frontend, different backends
- **Option C**: Shared components library

### **2. Database Strategy**
- **P2P Track**: Decentralized storage
- **Django Track**: Traditional database
- **Sync Strategy**: Manual or automated?

### **3. Authentication Strategy**
- **P2P Track**: Web3 wallets
- **Django Track**: Traditional auth
- **Cross-track**: Same user identity?

---

**Ready to start?** Let's begin with setting up the Django track and then work on feature parity between both versions! 