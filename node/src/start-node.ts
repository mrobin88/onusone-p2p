#!/usr/bin/env node
/**
 * Start OnusOne Network Node
 * This is the actual executable that people run to join the network
 */

import { createNetworkNode } from './real-network-node';
import { Keypair } from '@solana/web3.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface StartupConfig {
  port?: number;
  dataDir?: string;
  walletFile?: string;
  isBootstrap?: boolean;
  location?: string;
  maxStorage?: number;
  maxBandwidth?: number;
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     OnusOne P2P Network                     ║
║                     Real Network Node                       ║
╚══════════════════════════════════════════════════════════════╝

🚀 Starting your OnusOne network node...
💰 Earn ONU tokens by hosting messages
🌐 Help build the decentralized future

`);

  // Parse command line arguments
  const config = parseArgs();
  
  // Load or generate wallet
  const walletKeypair = loadOrCreateWallet(config.walletFile);
  
  console.log(`💼 Node Wallet: ${walletKeypair.publicKey.toString()}`);
  console.log(`📍 Data Directory: ${config.dataDir}`);
  console.log(`🔌 Port: ${config.port}`);
  
  // Create and start node
  const node = createNetworkNode({
    port: config.port,
    dataDir: config.dataDir,
    walletKeypair,
    isBootstrap: config.isBootstrap,
    location: config.location,
    maxStorage: config.maxStorage,
    maxBandwidth: config.maxBandwidth
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down node gracefully...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down node gracefully...');
    process.exit(0);
  });

  try {
    await node.start();
    
    console.log(`
✅ OnusOne Network Node is running!

📊 Node Status: http://localhost:${config.port}/api/node/status
💰 Earnings: http://localhost:${config.port}/api/node/earnings
👥 Peers: http://localhost:${config.port}/api/peers/list

🔥 Your node is now earning ONU tokens by hosting messages!
💡 Keep this terminal open to stay connected to the network.

Press Ctrl+C to stop the node.
`);

  } catch (error) {
    console.error('❌ Failed to start node:', error);
    process.exit(1);
  }
}

function parseArgs(): StartupConfig {
  const args = process.argv.slice(2);
  const config: StartupConfig = {
    port: 8888,
    dataDir: './data',
    walletFile: './wallet.json',
    isBootstrap: false,
    location: 'Unknown',
    maxStorage: 1000,
    maxBandwidth: 100
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case '--port':
        config.port = parseInt(value);
        break;
      case '--data-dir':
        config.dataDir = value;
        break;
      case '--wallet':
        config.walletFile = value;
        break;
      case '--bootstrap':
        config.isBootstrap = value === 'true';
        break;
      case '--location':
        config.location = value;
        break;
      case '--max-storage':
        config.maxStorage = parseInt(value);
        break;
      case '--max-bandwidth':
        config.maxBandwidth = parseInt(value);
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return config;
}

function loadOrCreateWallet(walletFile?: string): Keypair {
  const walletPath = walletFile || './wallet.json';
  
  if (existsSync(walletPath)) {
    try {
      const walletData = JSON.parse(readFileSync(walletPath, 'utf8'));
      const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
      console.log(`📂 Loaded existing wallet from ${walletPath}`);
      return keypair;
    } catch (error) {
      console.error(`❌ Failed to load wallet from ${walletPath}:`, error);
      console.log(`🔄 Generating new wallet...`);
    }
  }

  // Generate new wallet
  const keypair = Keypair.generate();
  const walletData = Array.from(keypair.secretKey);
  
  writeFileSync(walletPath, JSON.stringify(walletData, null, 2));
  console.log(`🆕 Generated new wallet and saved to ${walletPath}`);
  console.log(`⚠️  BACKUP YOUR WALLET FILE! This contains your node's private keys.`);
  
  return keypair;
}

function printHelp() {
  console.log(`
OnusOne Network Node - Command Line Options

Usage: npm run start-node [options]

Options:
  --port <number>        Port to listen on (default: 8888)
  --data-dir <path>      Data directory for storage (default: ./data)
  --wallet <path>        Wallet file path (default: ./wallet.json)
  --bootstrap <bool>     Run as bootstrap node (default: false)
  --location <string>    Geographic location (default: Unknown)
  --max-storage <MB>     Maximum storage in MB (default: 1000)
  --max-bandwidth <Mbps> Maximum bandwidth in Mbps (default: 100)
  --help                 Show this help message

Examples:
  npm run start-node                                    # Start with defaults
  npm run start-node -- --port 9000 --location "US-East"  # Custom port and location
  npm run start-node -- --bootstrap true               # Start as bootstrap node

For more information, visit: https://github.com/onusone/p2p-network
`);
}

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

export { main };
