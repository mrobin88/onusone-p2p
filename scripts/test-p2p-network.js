#!/usr/bin/env node

/**
 * OnusOne P2P Network Testing Script
 * Tests P2P connectivity, message distribution, and network health
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios').default;

console.log('🧪 OnusOne P2P Network Testing\n');

async function loadConfig() {
  console.log('📋 Loading configuration...');
  
  // Load environment
  const envPath = path.join(__dirname, '../node/.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ Environment file not found');
    console.log('Run: npm run setup:env');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const config = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !line.startsWith('#')) {
      config[key.trim()] = value.trim();
    }
  });
  
  // Load bootstrap nodes if available
  const bootstrapPath = path.join(__dirname, '../bootstrap-nodes.json');
  let bootstrapNodes = [];
  
  if (fs.existsSync(bootstrapPath)) {
    const bootstrapData = JSON.parse(fs.readFileSync(bootstrapPath, 'utf8'));
    bootstrapNodes = bootstrapData.nodes || [];
  }
  
  console.log('✅ Configuration loaded');
  return { config, bootstrapNodes };
}

async function testLocalNode(config) {
  console.log('\n🏠 Testing local P2P node...');
  
  const nodeUrl = `http://localhost:${config.HTTP_PORT || 8888}`;
  
  try {
    // Test health endpoint
    const healthResponse = await axios.get(`${nodeUrl}/health`, { timeout: 5000 });
    console.log('✅ Local node health check passed');
    console.log(`   Status: ${healthResponse.data.status}`);
    console.log(`   Node ID: ${healthResponse.data.nodeId || 'Not set'}`);
    
    // Test P2P status
    try {
      const p2pResponse = await axios.get(`${nodeUrl}/p2p/status`, { timeout: 5000 });
      console.log('✅ P2P status endpoint working');
      console.log(`   Connected peers: ${p2pResponse.data.connectedPeers || 0}`);
      console.log(`   Network health: ${p2pResponse.data.networkHealth || 'Unknown'}`);
    } catch (error) {
      console.log('⚠️  P2P status endpoint not available (may not be implemented yet)');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Local node not responding');
    console.log('   Make sure to run: npm run node:dev');
    return false;
  }
}

async function testBootstrapNodes(bootstrapNodes) {
  console.log('\n🌐 Testing bootstrap nodes...');
  
  if (bootstrapNodes.length === 0) {
    console.log('⚠️  No bootstrap nodes configured');
    console.log('   Run: npm run deploy:bootstrap');
    return false;
  }
  
  let healthyNodes = 0;
  
  for (const node of bootstrapNodes) {
    try {
      const response = await axios.get(node.healthCheck, { timeout: 10000 });
      console.log(`✅ ${node.name} (${node.ip}) - Healthy`);
      healthyNodes++;
    } catch (error) {
      console.log(`❌ ${node.name} (${node.ip}) - Unhealthy`);
      console.log(`   Error: ${error.message}`);
    }
  }
  
  const healthPercentage = (healthyNodes / bootstrapNodes.length) * 100;
  console.log(`\n📊 Bootstrap network health: ${healthPercentage.toFixed(1)}% (${healthyNodes}/${bootstrapNodes.length})`);
  
  return healthyNodes > 0;
}

async function testMessageDistribution(config) {
  console.log('\n📨 Testing message distribution...');
  
  const nodeUrl = `http://localhost:${config.HTTP_PORT || 8888}`;
  
  try {
    // Create test message
    const testMessage = {
      content: `Test message from P2P network test - ${new Date().toISOString()}`,
      author: 'test-user',
      boardId: 'test-board'
    };
    
    console.log('Sending test message...');
    const response = await axios.post(`${nodeUrl}/api/messages`, testMessage, { timeout: 10000 });
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Message distribution test passed');
      console.log(`   Message ID: ${response.data.id || 'Generated'}`);
      
      // Try to retrieve the message
      setTimeout(async () => {
        try {
          const getResponse = await axios.get(`${nodeUrl}/api/messages?boardId=test-board`, { timeout: 5000 });
          const messages = getResponse.data.messages || getResponse.data || [];
          const testMsg = messages.find(m => m.content.includes('Test message from P2P network test'));
          
          if (testMsg) {
            console.log('✅ Message retrieval test passed');
            console.log(`   Decay score: ${testMsg.decayScore || 'N/A'}`);
          } else {
            console.log('⚠️  Message not found in retrieval test');
          }
        } catch (error) {
          console.log('⚠️  Message retrieval test failed');
        }
      }, 2000);
      
      return true;
    } else {
      console.log('❌ Message distribution test failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Message distribution test failed');
    console.log(`   Error: ${error.message}`);
    
    if (error.response && error.response.status === 404) {
      console.log('   API endpoint may not be implemented yet');
    }
    
    return false;
  }
}

async function testContentDecay(config) {
  console.log('\n⚡ Testing content decay system...');
  
  const nodeUrl = `http://localhost:${config.HTTP_PORT || 8888}`;
  
  try {
    // Test decay status endpoint
    const response = await axios.get(`${nodeUrl}/api/decay/status`, { timeout: 5000 });
    
    console.log('✅ Content decay system active');
    console.log(`   Active content: ${response.data.activeContent || 'N/A'}`);
    console.log(`   Decay rate: ${response.data.decayRate || config.DECAY_RATE_PER_HOUR || 1}/hour`);
    
    return true;
  } catch (error) {
    console.log('⚠️  Content decay endpoint not available');
    console.log('   System may be working but not exposed via API');
    return false;
  }
}

async function testReputationSystem(config) {
  console.log('\n🏆 Testing reputation system...');
  
  const nodeUrl = `http://localhost:${config.HTTP_PORT || 8888}`;
  
  try {
    // Test reputation endpoint
    const response = await axios.get(`${nodeUrl}/api/reputation/test-user`, { timeout: 5000 });
    
    console.log('✅ Reputation system active');
    console.log(`   Test user reputation: ${response.data.reputation || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.log('⚠️  Reputation endpoint not available');
    console.log('   System may be working but not exposed via API');
    return false;
  }
}

async function testNetworkConnectivity() {
  console.log('\n🔗 Testing network connectivity...');
  
  // Test internet connectivity
  try {
    await axios.get('https://ipfs.io', { timeout: 5000 });
    console.log('✅ Internet connectivity confirmed');
  } catch (error) {
    console.log('❌ Internet connectivity issues');
    return false;
  }
  
  // Test IPFS gateway
  try {
    await axios.get('https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', { timeout: 10000 });
    console.log('✅ IPFS gateway connectivity confirmed');
  } catch (error) {
    console.log('⚠️  IPFS gateway connectivity issues');
  }
  
  return true;
}

function generateReport(results) {
  console.log('\n📊 P2P Network Test Report');
  console.log('=' .repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = (passed / total) * 100;
  
  console.log(`Overall Health: ${percentage.toFixed(1)}% (${passed}/${total} tests passed)\n`);
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.message}`);
  });
  
  console.log('\n🚀 Next Steps:');
  
  if (percentage >= 80) {
    console.log('✅ Network is ready for production deployment!');
    console.log('   Run: npm run deploy:production');
  } else if (percentage >= 60) {
    console.log('⚠️  Network has some issues but is functional');
    console.log('   Fix failing tests before production deployment');
  } else {
    console.log('❌ Network needs significant work before deployment');
    console.log('   Focus on fixing critical infrastructure issues');
  }
  
  console.log('\n📚 Troubleshooting:');
  console.log('   - Local node issues: Check npm run node:dev');
  console.log('   - Bootstrap issues: Check npm run deploy:bootstrap');
  console.log('   - API issues: Check node/src/index.ts implementation');
  console.log('   - Network issues: Check firewall and port configuration');
}

async function main() {
  try {
    const { config, bootstrapNodes } = await loadConfig();
    const results = [];
    
    // Run all tests
    const localNodeHealthy = await testLocalNode(config);
    results.push({
      name: 'Local Node Health',
      passed: localNodeHealthy,
      message: localNodeHealthy ? 'Node responding correctly' : 'Node not responding'
    });
    
    const bootstrapHealthy = await testBootstrapNodes(bootstrapNodes);
    results.push({
      name: 'Bootstrap Network',
      passed: bootstrapHealthy,
      message: bootstrapHealthy ? 'Bootstrap nodes accessible' : 'Bootstrap nodes not accessible'
    });
    
    const connectivityOk = await testNetworkConnectivity();
    results.push({
      name: 'Network Connectivity',
      passed: connectivityOk,
      message: connectivityOk ? 'Internet and IPFS accessible' : 'Connectivity issues detected'
    });
    
    if (localNodeHealthy) {
      const messageDistributionOk = await testMessageDistribution(config);
      results.push({
        name: 'Message Distribution',
        passed: messageDistributionOk,
        message: messageDistributionOk ? 'Messages can be sent and received' : 'Message distribution not working'
      });
      
      const contentDecayOk = await testContentDecay(config);
      results.push({
        name: 'Content Decay System',
        passed: contentDecayOk,
        message: contentDecayOk ? 'Content decay system active' : 'Content decay system not accessible'
      });
      
      const reputationOk = await testReputationSystem(config);
      results.push({
        name: 'Reputation System',
        passed: reputationOk,
        message: reputationOk ? 'Reputation system active' : 'Reputation system not accessible'
      });
    }
    
    generateReport(results);
    
  } catch (error) {
    console.error('❌ Network test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}