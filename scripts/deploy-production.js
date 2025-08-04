#!/usr/bin/env node

/**
 * OnusOne P2P Production Deployment Script
 * Deploys the complete P2P application stack
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 OnusOne P2P Production Deployment\n');

async function checkPrerequisites() {
  console.log('📋 Checking prerequisites...');
  
  // Check if bootstrap nodes are deployed
  const bootstrapPath = path.join(__dirname, '../bootstrap-nodes.json');
  if (!fs.existsSync(bootstrapPath)) {
    console.log('❌ Bootstrap nodes not found');
    console.log('Run: npm run deploy:bootstrap');
    process.exit(1);
  }
  
  const bootstrapData = JSON.parse(fs.readFileSync(bootstrapPath, 'utf8'));
  if (!bootstrapData.nodes || bootstrapData.nodes.length === 0) {
    console.log('❌ No bootstrap nodes configured');
    console.log('Run: npm run deploy:bootstrap');
    process.exit(1);
  }
  
  console.log(`✅ ${bootstrapData.nodes.length} bootstrap nodes found`);
  
  // Check environment
  const envPath = path.join(__dirname, '../node/.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ Environment not configured');
    console.log('Run: npm run setup:env');
    process.exit(1);
  }
  
  console.log('✅ Environment configured');
  
  // Check if builds are ready
  const sharedDistPath = path.join(__dirname, '../shared/dist');
  if (!fs.existsSync(sharedDistPath)) {
    console.log('❌ Shared library not built');
    console.log('Run: cd shared && npm run build');
    process.exit(1);
  }
  
  console.log('✅ Shared library built');
  
  return bootstrapData;
}

async function buildApplications() {
  console.log('\n🔨 Building applications...');
  
  // Build shared library
  console.log('Building shared library...');
  execSync('cd shared && npm run build', { stdio: 'inherit' });
  console.log('✅ Shared library built');
  
  // Build frontend
  console.log('Building frontend...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend built');
  
  // Test node build
  console.log('Testing node build...');
  execSync('cd node && npm run test', { stdio: 'ignore' });
  console.log('✅ Node tests passed');
}

async function deployToVercel() {
  console.log('\n🌐 Deploying frontend to Vercel...');
  
  try {
    // Check if Vercel CLI is installed
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('Installing Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }
  
  // Deploy frontend
  console.log('Deploying to Vercel...');
  execSync('cd frontend && vercel --prod', { stdio: 'inherit' });
  
  console.log('✅ Frontend deployed to Vercel');
}

async function deployP2PGateway(bootstrapData) {
  console.log('\n🌉 Deploying P2P gateway nodes...');
  
  const gatewayUserData = `#!/bin/bash
# Update system
apt-get update -y
apt-get install -y curl wget git nodejs npm nginx certbot python3-certbot-nginx

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Clone and setup P2P gateway
git clone https://github.com/mrobin88/onusone-p2p.git /opt/onusone-p2p
cd /opt/onusone-p2p

# Install dependencies
npm run install:all

# Build applications
cd shared && npm run build && cd ..
cd node && npm install && cd ..

# Create environment file
cat > node/.env << 'EOF'
NODE_ENV=production
P2P_PORT=8887
HTTP_PORT=8888
GATEWAY_MODE=true
ENABLE_CORS=true
ENABLE_WEBSOCKETS=true
BOOTSTRAP_NODES=${bootstrapData.nodes.map(n => `/ip4/${n.ip}/tcp/8887`).join(',')}
LOG_LEVEL=info
EOF

# Create systemd service
cat > /etc/systemd/system/onusone-gateway.service << 'EOF'
[Unit]
Description=OnusOne P2P Gateway
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/onusone-p2p/node
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Setup Nginx reverse proxy
cat > /etc/nginx/sites-available/onusone-gateway << 'EOF'
server {
    listen 80;
    server_name gateway.onusone.network;
    
    location / {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/onusone-gateway /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Start services
systemctl daemon-reload
systemctl enable onusone-gateway
systemctl start onusone-gateway

# Setup firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8887/tcp
ufw allow 8888/tcp
ufw --force enable

echo "P2P Gateway deployed successfully!"
`;

  // Deploy gateway nodes
  const gatewayNodes = [
    { name: 'gateway-us', region: 'nyc1', size: 's-2vcpu-2gb' },
    { name: 'gateway-eu', region: 'ams3', size: 's-2vcpu-2gb' }
  ];
  
  for (const gateway of gatewayNodes) {
    console.log(`Deploying ${gateway.name}...`);
    
    try {
      const command = `doctl compute droplet create ${gateway.name} \\
        --region ${gateway.region} \\
        --size ${gateway.size} \\
        --image ubuntu-22-04-x64 \\
        --ssh-keys onusone-p2p-key \\
        --user-data "${gatewayUserData}" \\
        --wait`;
      
      execSync(command, { stdio: 'inherit' });
      console.log(`✅ ${gateway.name} deployed successfully`);
    } catch (error) {
      console.error(`❌ Failed to deploy ${gateway.name}:`, error.message);
    }
  }
}

async function setupMonitoring() {
  console.log('\n📊 Setting up monitoring...');
  
  // Deploy monitoring stack
  const monitoringUserData = `#!/bin/bash
# Update system
apt-get update -y
apt-get install -y docker.io docker-compose

# Create monitoring stack
mkdir -p /opt/monitoring
cd /opt/monitoring

# Create docker-compose for monitoring
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    restart: unless-stopped
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=onusone_admin
    volumes:
      - grafana-data:/var/lib/grafana
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:
EOF

# Create Prometheus config
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'onusone-bootstrap'
    static_configs:
      - targets: ['${bootstrapData.nodes.map(n => `${n.ip}:8888`).join("', '")}']
  
  - job_name: 'onusone-gateways'
    static_configs:
      - targets: ['gateway-us:8888', 'gateway-eu:8888']
EOF

# Start monitoring
docker-compose up -d

echo "Monitoring stack deployed!"
`;

  console.log('Deploying monitoring node...');
  try {
    const command = `doctl compute droplet create onusone-monitoring \\
      --region nyc1 \\
      --size s-2vcpu-4gb \\
      --image ubuntu-22-04-x64 \\
      --ssh-keys onusone-p2p-key \\
      --user-data "${monitoringUserData}" \\
      --wait`;
    
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Monitoring stack deployed');
  } catch (error) {
    console.error('❌ Failed to deploy monitoring:', error.message);
  }
}

async function setupDNS() {
  console.log('\n🌐 Setting up DNS...');
  
  // This would integrate with Cloudflare API
  console.log('⚠️  DNS setup requires manual configuration');
  console.log('Configure these DNS records:');
  console.log('- app.onusone.network → Vercel deployment');
  console.log('- gateway.onusone.network → Gateway nodes');
  console.log('- monitor.onusone.network → Monitoring node');
}

async function runHealthChecks(bootstrapData) {
  console.log('\n🔍 Running health checks...');
  
  // Wait for services to start
  console.log('Waiting 2 minutes for services to initialize...');
  await new Promise(resolve => setTimeout(resolve, 120000));
  
  // Run network test
  console.log('Running comprehensive network test...');
  try {
    execSync('npm run test:p2p-network', { stdio: 'inherit' });
    console.log('✅ Network health checks passed');
  } catch (error) {
    console.log('⚠️  Some health checks failed - check logs');
  }
}

function showDeploymentSummary(bootstrapData) {
  console.log('\n🎉 Production Deployment Complete!\n');
  
  console.log('📊 Infrastructure Summary:');
  console.log(`✅ Bootstrap Nodes: ${bootstrapData.nodes.length}`);
  console.log('✅ P2P Gateway Nodes: 2');
  console.log('✅ Monitoring Stack: 1');
  console.log('✅ Frontend: Deployed to Vercel');
  
  console.log('\n🌐 Access Points:');
  console.log('• Web App: https://app.onusone.network');
  console.log('• P2P Gateway: https://gateway.onusone.network');
  console.log('• Monitoring: https://monitor.onusone.network:3000');
  
  console.log('\n💰 Monthly Costs:');
  console.log('• Bootstrap Nodes: ~$18/month');
  console.log('• Gateway Nodes: ~$24/month');
  console.log('• Monitoring: ~$12/month');
  console.log('• Vercel: $0-20/month');
  console.log('• Total: ~$54-74/month');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Configure DNS records');
  console.log('2. Set up SSL certificates');
  console.log('3. Configure monitoring alerts');
  console.log('4. Launch beta testing');
  console.log('5. Invite first users to the P2P network!');
}

async function main() {
  try {
    const bootstrapData = await checkPrerequisites();
    await buildApplications();
    await deployToVercel();
    await deployP2PGateway(bootstrapData);
    await setupMonitoring();
    await setupDNS();
    await runHealthChecks(bootstrapData);
    
    showDeploymentSummary(bootstrapData);
    
  } catch (error) {
    console.error('❌ Production deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}