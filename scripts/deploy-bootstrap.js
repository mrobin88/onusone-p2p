#!/usr/bin/env node

/**
 * OnusOne P2P Bootstrap Node Deployment Script
 * Deploys 3 bootstrap nodes for P2P network discovery
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 OnusOne P2P Bootstrap Deployment\n');

// Configuration
const config = {
  nodes: [
    { name: 'bootstrap-1', region: 'nyc1', size: 's-1vcpu-1gb' },
    { name: 'bootstrap-2', region: 'sfo3', size: 's-1vcpu-1gb' },
    { name: 'bootstrap-3', region: 'ams3', size: 's-1vcpu-1gb' }
  ],
  sshKeyName: 'onusone-p2p-key'
};

async function checkRequirements() {
  console.log('📋 Checking requirements...');
  
  // Check if DigitalOcean CLI is installed
  try {
    execSync('doctl version', { stdio: 'ignore' });
    console.log('✅ DigitalOcean CLI found');
  } catch (error) {
    console.log('❌ DigitalOcean CLI not found');
    console.log('Install with: brew install doctl');
    console.log('Then authenticate: doctl auth init');
    process.exit(1);
  }

  // Check if authenticated
  try {
    execSync('doctl account get', { stdio: 'ignore' });
    console.log('✅ DigitalOcean authenticated');
  } catch (error) {
    console.log('❌ Not authenticated with DigitalOcean');
    console.log('Run: doctl auth init');
    process.exit(1);
  }

  // Check environment variables
  const envPath = path.join(__dirname, '../node/.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ Environment file not found');
    console.log('Run: npm run setup:env');
    process.exit(1);
  }
  console.log('✅ Environment configured');
}

async function createSSHKey() {
  console.log('\n🔑 Setting up SSH key...');
  
  try {
    // Check if key already exists
    execSync(`doctl compute ssh-key get ${config.sshKeyName}`, { stdio: 'ignore' });
    console.log('✅ SSH key already exists');
    return;
  } catch (error) {
    // Key doesn't exist, create it
  }

  const keyPath = path.join(process.env.HOME, '.ssh', 'onusone_p2p_rsa');
  
  if (!fs.existsSync(keyPath)) {
    console.log('Creating new SSH key...');
    execSync(`ssh-keygen -t rsa -b 4096 -f ${keyPath} -N "" -C "onusone-p2p-bootstrap"`);
  }

  console.log('Adding SSH key to DigitalOcean...');
  execSync(`doctl compute ssh-key import ${config.sshKeyName} --public-key-file ${keyPath}.pub`);
  console.log('✅ SSH key configured');
}

async function deployBootstrapNodes() {
  console.log('\n🌐 Deploying bootstrap nodes...');

  const userDataScript = `#!/bin/bash
# Update system
apt-get update -y
apt-get install -y curl wget git nodejs npm docker.io

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Clone and setup P2P node
git clone https://github.com/mrobin88/onusone-p2p.git /opt/onusone-p2p
cd /opt/onusone-p2p/node
npm install

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
P2P_PORT=8887
HTTP_PORT=8888
BOOTSTRAP_MODE=true
ENABLE_MDNS=false
ENABLE_WEBSOCKETS=true
LOG_LEVEL=info
EOF

# Create systemd service
cat > /etc/systemd/system/onusone-bootstrap.service << 'EOF'
[Unit]
Description=OnusOne P2P Bootstrap Node
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

# Start service
systemctl daemon-reload
systemctl enable onusone-bootstrap
systemctl start onusone-bootstrap

# Setup firewall
ufw allow 22/tcp
ufw allow 8887/tcp
ufw allow 8888/tcp
ufw --force enable

echo "Bootstrap node deployed successfully!"
`;

  const promises = config.nodes.map(async (node, index) => {
    console.log(`Deploying ${node.name}...`);
    
    try {
      const command = `doctl compute droplet create ${node.name} \\
        --region ${node.region} \\
        --size ${node.size} \\
        --image ubuntu-22-04-x64 \\
        --ssh-keys ${config.sshKeyName} \\
        --user-data "${userDataScript}" \\
        --wait`;
      
      execSync(command, { stdio: 'inherit' });
      console.log(`✅ ${node.name} deployed successfully`);
      
      // Get IP address
      const ipCommand = `doctl compute droplet get ${node.name} --format PublicIPv4 --no-header`;
      const ip = execSync(ipCommand, { encoding: 'utf8' }).trim();
      
      return { name: node.name, ip, region: node.region };
    } catch (error) {
      console.error(`❌ Failed to deploy ${node.name}:`, error.message);
      return null;
    }
  });

  const results = await Promise.all(promises);
  const successful = results.filter(r => r !== null);
  
  console.log('\n📊 Deployment Results:');
  successful.forEach(node => {
    console.log(`✅ ${node.name}: ${node.ip} (${node.region})`);
  });

  return successful;
}

async function updateBootstrapConfig(nodes) {
  console.log('\n⚙️  Updating bootstrap configuration...');
  
  const bootstrapNodes = nodes.map(node => 
    `/ip4/${node.ip}/tcp/8887/p2p/12D3KooW${node.name.replace('-', '').toUpperCase()}Bootstrap`
  );

  // Update environment file
  const envPath = path.join(__dirname, '../node/.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  const bootstrapLine = `BOOTSTRAP_NODES=${bootstrapNodes.join(',')}`;
  
  if (envContent.includes('BOOTSTRAP_NODES=')) {
    envContent = envContent.replace(/BOOTSTRAP_NODES=.*/, bootstrapLine);
  } else {
    envContent += `\n${bootstrapLine}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  
  // Create bootstrap nodes list file
  const bootstrapConfig = {
    nodes: nodes.map(node => ({
      name: node.name,
      ip: node.ip,
      region: node.region,
      multiaddr: `/ip4/${node.ip}/tcp/8887`,
      healthCheck: `http://${node.ip}:8888/health`
    })),
    updated: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../bootstrap-nodes.json'),
    JSON.stringify(bootstrapConfig, null, 2)
  );
  
  console.log('✅ Bootstrap configuration updated');
}

async function verifyDeployment(nodes) {
  console.log('\n🔍 Verifying deployment...');
  
  // Wait for nodes to start
  console.log('Waiting 60 seconds for nodes to initialize...');
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  for (const node of nodes) {
    try {
      const healthUrl = `http://${node.ip}:8888/health`;
      console.log(`Checking ${node.name} health...`);
      
      // Use curl to check health (cross-platform)
      execSync(`curl -f ${healthUrl}`, { stdio: 'ignore', timeout: 10000 });
      console.log(`✅ ${node.name} is healthy`);
    } catch (error) {
      console.log(`⚠️  ${node.name} health check failed (may still be starting)`);
    }
  }
}

async function main() {
  try {
    await checkRequirements();
    await createSSHKey();
    const nodes = await deployBootstrapNodes();
    
    if (nodes.length === 0) {
      console.log('❌ No nodes were deployed successfully');
      process.exit(1);
    }
    
    await updateBootstrapConfig(nodes);
    await verifyDeployment(nodes);
    
    console.log('\n🎉 Bootstrap deployment complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run test:p2p-network');
    console.log('2. Run: npm run deploy:production');
    console.log('\n💰 Monthly cost: ~$18 (3 nodes × $6/month)');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}