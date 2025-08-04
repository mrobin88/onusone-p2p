#!/usr/bin/env node

/**
 * OnusOne P2P Environment Setup Script
 * Interactive setup for API keys and configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 OnusOne P2P Environment Setup\n');

const questions = [
  {
    key: 'NODE_ENV',
    question: 'Environment (development/production)',
    default: 'development',
    required: true
  },
  {
    key: 'P2P_PORT',
    question: 'P2P Network Port',
    default: '8887',
    required: true
  },
  {
    key: 'HTTP_PORT',
    question: 'HTTP API Port',
    default: '8888',
    required: true
  },
  {
    key: 'PINATA_API_KEY',
    question: 'Pinata API Key (IPFS pinning)',
    default: '',
    required: false,
    help: 'Sign up at https://pinata.cloud/'
  },
  {
    key: 'PINATA_SECRET_API_KEY',
    question: 'Pinata Secret Key',
    default: '',
    required: false
  },
  {
    key: 'ALCHEMY_SOLANA_API_KEY',
    question: 'Alchemy Solana API Key',
    default: '',
    required: false,
    help: 'Sign up at https://alchemy.com/'
  },
  {
    key: 'SENTRY_DSN',
    question: 'Sentry DSN (error tracking)',
    default: '',
    required: false,
    help: 'Sign up at https://sentry.io/'
  },
  {
    key: 'DO_ACCESS_TOKEN',
    question: 'DigitalOcean API Token (for bootstrap nodes)',
    default: '',
    required: false,
    help: 'Create at https://cloud.digitalocean.com/account/api/tokens'
  }
];

async function askQuestion(question) {
  return new Promise((resolve) => {
    const prompt = question.help 
      ? `${question.question} (${question.help})`
      : question.question;
    
    const defaultText = question.default ? ` [${question.default}]` : '';
    
    rl.question(`${prompt}${defaultText}: `, (answer) => {
      resolve(answer.trim() || question.default);
    });
  });
}

async function setupEnvironment() {
  console.log('Please provide the following configuration:\n');
  
  const config = {};
  
  for (const question of questions) {
    if (question.help) {
      console.log(`\n💡 ${question.help}`);
    }
    
    const answer = await askQuestion(question);
    
    if (question.required && !answer) {
      console.log(`❌ ${question.key} is required`);
      process.exit(1);
    }
    
    if (answer) {
      config[question.key] = answer;
    }
  }
  
  return config;
}

function generateEnvFile(config) {
  const envPath = path.join(__dirname, '../node/.env');
  
  let envContent = `# OnusOne P2P Node Configuration
# Generated on ${new Date().toISOString()}

# Network Configuration
NODE_ENV=${config.NODE_ENV}
P2P_PORT=${config.P2P_PORT}
HTTP_PORT=${config.HTTP_PORT}

# Node Identity
NODE_ID=
WALLET_ADDRESS=

# Networking
BOOTSTRAP_NODES=
MAX_PEERS=50
ENABLE_MDNS=true
ENABLE_WEBSOCKETS=false

# Storage Configuration
STORAGE_PATH=./data
MAX_STORAGE_GB=100
IPFS_API_URL=http://localhost:5001
ENABLE_IPFS_PINNING=true

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Database
DB_PATH=./data/messages.db
DB_BACKUP_INTERVAL=3600000

# Decay Algorithm
DECAY_UPDATE_INTERVAL=60000
DECAY_RATE_PER_HOUR=1
INITIAL_MESSAGE_SCORE=100

# Performance
ENABLE_METRICS=true
METRICS_INTERVAL=30000
MAX_MEMORY_MB=2048

# Security
ENABLE_MESSAGE_SIGNING=true
REQUIRE_PEER_VERIFICATION=false
MAX_MESSAGE_SIZE=10000
RATE_LIMIT_PER_SECOND=10

`;

  // Add API keys if provided
  if (config.PINATA_API_KEY) {
    envContent += `
# IPFS Pinning Service
PINATA_API_KEY=${config.PINATA_API_KEY}
PINATA_SECRET_API_KEY=${config.PINATA_SECRET_API_KEY}
`;
  }

  if (config.ALCHEMY_SOLANA_API_KEY) {
    envContent += `
# Blockchain RPC
ALCHEMY_SOLANA_API_KEY=${config.ALCHEMY_SOLANA_API_KEY}
SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/${config.ALCHEMY_SOLANA_API_KEY}
`;
  }

  if (config.SENTRY_DSN) {
    envContent += `
# Error Tracking
SENTRY_DSN=${config.SENTRY_DSN}
`;
  }

  if (config.DO_ACCESS_TOKEN) {
    envContent += `
# Cloud Infrastructure
DO_ACCESS_TOKEN=${config.DO_ACCESS_TOKEN}
`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`\n✅ Environment file created: ${envPath}`);
}

function generateFrontendEnv(config) {
  const frontendEnvPath = path.join(__dirname, '../frontend/.env.local');
  
  const frontendEnv = `# OnusOne P2P Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:${config.HTTP_PORT}
NEXT_PUBLIC_P2P_PORT=${config.P2P_PORT}
NEXT_PUBLIC_NETWORK_ENV=${config.NODE_ENV}
`;

  if (config.SENTRY_DSN) {
    const publicSentryDsn = config.SENTRY_DSN.replace(/\/\/[^@]+@/, '//PUBLIC_KEY@');
    frontendEnv += `NEXT_PUBLIC_SENTRY_DSN=${publicSentryDsn}\n`;
  }

  fs.writeFileSync(frontendEnvPath, frontendEnv);
  console.log(`✅ Frontend environment file created: ${frontendEnvPath}`);
}

function showNextSteps(config) {
  console.log('\n🎉 Environment setup complete!\n');
  
  console.log('📋 Next steps:');
  console.log('1. Review your configuration files:');
  console.log('   - node/.env');
  console.log('   - frontend/.env.local');
  
  if (!config.PINATA_API_KEY) {
    console.log('\n⚠️  Missing IPFS service:');
    console.log('   - Sign up at https://pinata.cloud/');
    console.log('   - Get API keys for content pinning');
    console.log('   - Re-run: npm run setup:env');
  }
  
  if (!config.DO_ACCESS_TOKEN) {
    console.log('\n⚠️  Missing cloud provider:');
    console.log('   - Sign up at https://digitalocean.com/');
    console.log('   - Create API token for bootstrap nodes');
    console.log('   - Re-run: npm run setup:env');
  }
  
  console.log('\n🚀 Ready to deploy:');
  console.log('   npm run deploy:bootstrap    # Deploy P2P network');
  console.log('   npm run test:p2p-network   # Test connectivity');
  console.log('   npm run deploy:production  # Full deployment');
}

async function main() {
  try {
    const config = await setupEnvironment();
    generateEnvFile(config);
    generateFrontendEnv(config);
    showNextSteps(config);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}