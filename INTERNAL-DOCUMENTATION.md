# OnusOne P2P - Internal Technical Documentation

## System Overview

OnusOne P2P is a decentralized messaging network built on Solana blockchain with peer-to-peer infrastructure. The system implements a pay-per-message model where content automatically expires based on engagement metrics.

## Architecture

### Core Components

**Frontend Application**
- Next.js React application deployed on Vercel
- Solana wallet integration (Phantom/Solflare)
- Real-time P2P network status monitoring
- Content decay visualization and management

**P2P Node Network**
- Node.js backend with WebSocket support
- Message broadcasting and relay system
- Distributed storage with IPFS integration planned
- Automatic peer discovery and connection management

**Blockchain Integration**
- Solana SPL token (ONU) for network operations
- Smart contract-based reputation system
- Automated token economics and decay mechanisms
- Real-time transaction verification

**Metadata Management**
- Django backend for compliance and audit trails
- PostgreSQL database for regulatory requirements
- Policy enforcement and data access controls

### Technical Stack

**Frontend**
- Next.js 13+ with TypeScript
- Tailwind CSS for styling
- Solana Web3.js for blockchain operations
- WebSocket client for real-time P2P communication

**Backend**
- Node.js with Express
- TypeScript for type safety
- WebSocket server for P2P messaging
- Mock storage (production: Vercel KV + IPFS)

**Blockchain**
- Solana mainnet integration
- SPL token standard
- Custom smart contracts for reputation and economics

**Infrastructure**
- Vercel for frontend hosting
- Docker containerization for P2P nodes
- GitHub Actions for CI/CD
- Environment-based configuration management

## Implementation Status

### Completed Features

**Authentication System**
- Solana wallet connection
- NextAuth fallback for non-crypto users
- Secure session management
- Rate limiting and abuse prevention

**Token Economics**
- ONU token minting and distribution
- Staking mechanism for content creation
- Automatic decay algorithm based on engagement
- Emergency economic controls (daily limits, max stakes)

**P2P Infrastructure**
- Real-time node connectivity
- Message broadcasting system
- Network health monitoring
- Automatic failover and reconnection

**Content Management**
- Board-based posting system
- Decay scoring algorithm
- Engagement tracking
- Automatic content expiration

### In Development

**Distributed Storage**
- IPFS integration for content addressing
- Node-based message persistence
- Cross-node synchronization
- Storage incentive mechanisms

**Advanced P2P Features**
- libp2p protocol integration
- Peer discovery and routing
- Message relay incentives
- Network topology optimization

**Enhanced Economics**
- Dynamic pricing models
- Content marketplace features
- Cross-chain token bridges
- Advanced staking mechanisms

## Economic Model

### Token Distribution

**ONU Token (Solana SPL)**
- Total Supply: 1,000,000 ONU
- Circulating Supply: Limited for testing
- Mint Authority: Controlled by smart contract
- Burn Mechanism: Transaction fees and decay

**Staking Requirements**
- Minimum Stake: 5 ONU per message
- Maximum Stake: 50 ONU per message
- Daily User Limit: 200 ONU
- Total User Stakes: 2,000 ONU maximum

**Reward Distribution**
- Node Operators: 80% of message fees
- Network Treasury: 15% for development
- Burn Pool: 5% for deflationary pressure

### Content Decay Algorithm

**Decay Factors**
- Initial Stake Amount
- User Engagement (likes, comments, shares)
- Time Since Posting
- Network Activity Level
- User Reputation Score

**Decay Calculation**
```typescript
decayScore = (baseStake * engagementMultiplier) / (timeFactor * reputationMultiplier)
```

**Expiration Triggers**
- Decay score below threshold
- Maximum time limit reached
- User reputation penalty
- Network capacity constraints

## Security Implementation

### Authentication Security
- Wallet signature verification
- Session token management
- Rate limiting per wallet address
- Input sanitization and validation

### Network Security
- WebSocket connection encryption
- Message integrity verification
- Peer authentication protocols
- DDoS protection measures

### Economic Security
- Smart contract-based token operations
- Multi-signature treasury controls
- Automated fraud detection
- Emergency economic shutdown capabilities

## Development Workflow

### Local Development Setup

**Prerequisites**
- Node.js 18+
- Solana CLI tools
- Docker and Docker Compose
- PostgreSQL (for metadata backend)

**Environment Configuration**
```bash
# Frontend (.env.local)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_TOKEN_MINT=your-token-mint
NEXT_PUBLIC_TREASURY_ADDRESS=your-treasury

# P2P Node (.env)
NODE_PORT=8888
P2P_NETWORK_ID=onusone-mainnet
STORAGE_PATH=./data
```

**Startup Commands**
```bash
# Frontend
cd frontend && npm run dev

# P2P Node
cd node && npm run start

# Metadata Backend
cd metadata && python manage.py runserver
```

### Testing Procedures

**Unit Tests**
- Component testing with Jest
- Smart contract testing with Anchor
- API endpoint testing with Supertest
- P2P network testing with mock peers

**Integration Tests**
- End-to-end wallet flows
- Cross-node message broadcasting
- Token economics validation
- Network failure scenarios

**Performance Tests**
- Load testing for P2P nodes
- Blockchain transaction throughput
- Content decay algorithm efficiency
- Network scaling capabilities

## Deployment Strategy

### Production Environment

**Frontend Deployment**
- Vercel automatic deployments
- Environment-specific builds
- Performance monitoring and analytics
- Error tracking and reporting

**P2P Node Deployment**
- Docker containers on cloud providers
- Load balancer configuration
- Health check monitoring
- Automatic scaling policies

**Blockchain Integration**
- Solana mainnet deployment
- Smart contract verification
- Multi-signature wallet setup
- Emergency response procedures

### Monitoring and Maintenance

**System Health Monitoring**
- Node uptime and performance
- Network connectivity status
- Token economics metrics
- User engagement analytics

**Alert Systems**
- Critical failure notifications
- Economic threshold alerts
- Security incident reporting
- Performance degradation warnings

**Backup and Recovery**
- Database backup procedures
- Smart contract upgrade processes
- Node recovery protocols
- Emergency shutdown procedures

## API Reference

### Frontend API Endpoints

**Authentication**
- POST /api/auth/wallet-register
- POST /api/auth/link-wallet
- GET /api/auth/session

**Content Management**
- POST /api/posts
- GET /api/posts
- POST /api/posts/engage
- DELETE /api/posts/[id]

**P2P Network**
- GET /api/presence
- POST /api/presence
- GET /api/presence-count

**Token Operations**
- POST /api/stake/create-tx
- POST /api/stake/confirm
- GET /api/tokenomics/stats

### P2P Node API

**Network Status**
- GET /api/status
- GET /api/peers
- GET /api/health

**Message Operations**
- POST /api/broadcast
- GET /api/messages
- POST /api/subscribe

**Node Management**
- POST /api/connect
- POST /api/disconnect
- GET /api/metrics

## Troubleshooting

### Common Issues

**Wallet Connection Problems**
- Check Solana network configuration
- Verify wallet extension installation
- Clear browser cache and cookies
- Check network connectivity

**P2P Connection Failures**
- Verify node server status
- Check firewall and port configurations
- Validate WebSocket support
- Review network configuration

**Token Transaction Errors**
- Confirm sufficient SOL balance
- Verify token account creation
- Check transaction fee requirements
- Validate smart contract state

### Debug Procedures

**Network Diagnostics**
- Node health check endpoints
- Peer connection status
- Message broadcast verification
- Storage system validation

**Economic Validation**
- Token balance verification
- Stake calculation validation
- Decay algorithm testing
- Reward distribution verification

**Performance Analysis**
- Response time monitoring
- Throughput measurement
- Resource utilization tracking
- Bottleneck identification

## Future Development

### Phase 1: Core Infrastructure
- Complete IPFS integration
- Advanced P2P protocols
- Enhanced security measures
- Performance optimization

### Phase 2: Economic Features
- Dynamic pricing models
- Content marketplace
- Advanced staking mechanisms
- Cross-chain integration

### Phase 3: Scale and Adoption
- Mobile application
- Enterprise features
- Advanced analytics
- Global deployment

## Contact and Support

**Development Team**
- Technical issues: GitHub Issues
- Feature requests: GitHub Discussions
- Security concerns: Direct communication
- Documentation updates: Pull requests

**Emergency Procedures**
- Critical failures: Immediate notification
- Economic issues: Emergency shutdown
- Security incidents: Incident response
- Network outages: Status page updates
