# OnusOne P2P - Decentralized Discussion Network

A Web3 social platform where content survives based on community engagement. Take back control. Use what you already have.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Git

### Local Development
```bash
# Clone the repository
git clone https://github.com/mrobin88/onusone-p2p.git
cd onusone-p2p

# Install all dependencies
npm run install:all

# Start the application
npm run dev
```

**Access the application:**
- Frontend: http://localhost:3000
- Node API: http://localhost:8888
- Health Check: http://localhost:8888/health

### Docker Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🏗️ Architecture

### Components
- **Frontend**: React/Next.js application
- **Node**: P2P backend with HTTP API
- **Shared**: TypeScript library with common types and utilities
- **Monitoring**: Prometheus + Grafana for metrics

### Tech Stack
- **Frontend**: React, Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **P2P**: libp2p, IPFS integration
- **Database**: PostgreSQL, Redis
- **Infrastructure**: Docker, Kubernetes ready

## 🔧 Development

### Project Structure
```
onusone-p2p/
├── frontend/          # React/Next.js frontend
├── node/             # P2P backend server
├── shared/           # Shared TypeScript library
├── .github/          # GitHub Actions workflows
├── docker-compose.yml # Local development
└── README.md
```

### Available Scripts
```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Build all components
npm run build:all

# Run tests
npm run test:all

# Lint code
npm run lint:all
```

### Individual Component Scripts
```bash
# Frontend
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests

# Node
cd node
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests

# Shared
cd shared
npm run build        # Build library
npm run test         # Run tests
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows

#### 1. **CI Pipeline** (`.github/workflows/ci.yml`)
- **Triggers**: Push to main/develop, Pull Requests
- **Jobs**:
  - Build & test shared library
  - Build & test node backend
  - Build & test frontend
  - Integration tests
  - Security audit
  - Code quality checks

#### 2. **Deploy Pipeline** (`.github/workflows/deploy.yml`)
- **Triggers**: Push to main, Manual deployment
- **Environments**: Staging, Production
- **Features**:
  - Automated builds
  - Docker image creation
  - Kubernetes deployment
  - Health checks

#### 3. **Release Pipeline** (`.github/workflows/release.yml`)
- **Triggers**: Git tags (v*)
- **Features**:
  - Automated releases
  - Changelog generation
  - Asset uploads
  - Team notifications

### Deployment Options

#### Docker Deployment
```bash
# Build images
docker build -t onusone/node ./node
docker build -t onusone/frontend ./frontend

# Run with docker-compose
docker-compose up -d
```

#### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n onusone
```

## 🔐 Security

### Security Features
- **Dependency scanning**: Automated npm audit
- **Code quality**: ESLint, TypeScript strict mode
- **Container security**: Non-root users, minimal base images
- **Network security**: CORS configuration, rate limiting

### Environment Variables
```bash
# Node Environment
NODE_ENV=production
HTTP_PORT=8888
DATABASE_URL=postgresql://user:pass@localhost:5432/onusone
REDIS_URL=redis://localhost:6379

# Frontend Environment
NEXT_PUBLIC_API_URL=http://localhost:8888
NEXT_PUBLIC_NETWORK_ID=1
```

## 📊 Monitoring

### Metrics & Health Checks
- **Health Endpoint**: `GET /health`
- **Node Info**: `GET /api/node`
- **Metrics**: Prometheus endpoints
- **Logging**: Structured JSON logs

### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards (http://localhost:3001)
- **Health Checks**: Automated service monitoring

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test:all`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Tests**: Unit and integration tests required

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/mrobin88/onusone-p2p/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mrobin88/onusone-p2p/discussions)
- **Documentation**: [Wiki](https://github.com/mrobin88/onusone-p2p/wiki)

### Troubleshooting

#### Common Issues
1. **Port conflicts**: Change ports in docker-compose.yml
2. **Build failures**: Clear node_modules and reinstall
3. **Database connection**: Check PostgreSQL is running
4. **P2P issues**: Check network connectivity

#### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# View detailed logs
docker-compose logs -f node
```

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] Basic P2P messaging
- [x] Content decay algorithm
- [x] Web3 integration ready
- [x] Modern React frontend

### Phase 2: Advanced Features 🚧
- [ ] Real-time P2P networking
- [ ] IPFS content storage
- [ ] Advanced decay algorithms
- [ ] Mobile app

### Phase 3: Scale & Performance 📋
- [ ] Horizontal scaling
- [ ] Performance optimization
- [ ] Advanced monitoring
- [ ] Enterprise features

---

**OnusOne P2P** - Take back control. Use what you already have.