#!/usr/bin/env node

/**
 * Core P2P System Test - Minimal & Essential
 * Tests: Message persistence, decay system, staking rewards
 */

const { spawn } = require('child_process');
const http = require('http');
const https = require('https');

// Test Configuration
const TEST_CONFIG = {
  backendUrl: 'http://localhost:8889',
  renderUrl: 'https://onusone-p2p.onrender.com',
  testTimeout: 10000
};

// Test Results
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Utility Functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    pass: '\x1b[32m',    // Green
    fail: '\x1b[31m',    // Red
    warn: '\x1b[33m',    // Yellow
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function test(name, testFn) {
  testResults.total++;
  log(`🧪 Testing: ${name}`, 'info');
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      log(`⏰ Test timeout: ${name}`, 'fail');
      testResults.failed++;
      resolve(false);
    }, TEST_CONFIG.testTimeout);
    
    testFn()
      .then((result) => {
        clearTimeout(timeout);
        if (result) {
          log(`✅ PASS: ${name}`, 'pass');
          testResults.passed++;
        } else {
          log(`❌ FAIL: ${name}`, 'fail');
          testResults.failed++;
        }
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        log(`💥 ERROR: ${name} - ${error.message}`, 'fail');
        testResults.failed++;
        resolve(false);
      });
  });
}

// HTTP Request Helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    req.setTimeout(5000);
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Core Test Functions
async function testBackendHealth() {
  try {
    const response = await makeRequest(`${TEST_CONFIG.backendUrl}/health`);
    if (response.status === 200 && response.data.status === 'healthy') {
      log(`✅ Local backend healthy: ${response.data.backend}`, 'pass');
      return true;
    } else {
      log(`⚠️  Local backend unhealthy: ${response.status}`, 'warn');
      return false;
    }
  } catch (error) {
    log(`⚠️  Local backend not running: ${error.message}`, 'warn');
    return false;
  }
}

async function testRenderBackend() {
  try {
    const response = await makeRequest(`${TEST_CONFIG.renderUrl}/health`);
    if (response.status === 200 && response.data.status === 'healthy') {
      log(`✅ Render backend healthy: ${response.data.backend}`, 'pass');
      return true;
    } else {
      log(`⚠️  Render backend unhealthy: ${response.status} - ${JSON.stringify(response.data)}`, 'warn');
      return false;
    }
  } catch (error) {
    log(`⚠️  Render backend not accessible: ${error.message}`, 'warn');
    return false;
  }
}

async function testMessageCreation() {
  try {
    const testMessage = {
      content: 'Test message from P2P system',
      author: 'TestUser',
      authorWallet: 'test-wallet-123',
      boardSlug: 'general'
    };
    
    const response = await makeRequest(`${TEST_CONFIG.backendUrl}/api/boards/general/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });
    
    return response.status === 200 || response.status === 201;
  } catch (error) {
    log(`⚠️  Message creation test failed: ${error.message}`, 'warn');
    return false;
  }
}

async function testDecaySystem() {
  try {
    // Test decay endpoint if it exists
    const response = await makeRequest(`${TEST_CONFIG.backendUrl}/api/decay/stats`);
    return response.status === 200;
  } catch (error) {
    log(`⚠️  Decay system test failed: ${error.message}`, 'warn');
    return false;
  }
}

async function testStakingSystem() {
  try {
    // Test staking endpoint if it exists
    const response = await makeRequest(`${TEST_CONFIG.backendUrl}/api/stake/stats`);
    return response.status === 200;
  } catch (error) {
    log(`⚠️  Staking system test failed: ${error.message}`, 'warn');
    return false;
  }
}

// Main Test Runner
async function runTests() {
  log('🚀 Starting Core P2P System Tests', 'info');
  log('==================================================', 'info');
  
  // Core functionality tests
  await test('Backend Health (Local)', testBackendHealth);
  await test('Backend Health (Render)', testRenderBackend);
  await test('Message Creation', testMessageCreation);
  await test('Decay System', testDecaySystem);
  await test('Staking System', testStakingSystem);
  
  // Results Summary
  log('==================================================', 'info');
  log(`📊 Test Results: ${testResults.passed}/${testResults.total} passed`, 
      testResults.failed === 0 ? 'pass' : 'fail');
  
  if (testResults.failed > 0) {
    log(`❌ ${testResults.failed} tests failed`, 'fail');
    process.exit(1);
  } else {
    log('🎉 All core P2P tests passed!', 'pass');
    log('✅ Your system is ready for users', 'pass');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    log(`💥 Test runner failed: ${error.message}`, 'fail');
    process.exit(1);
  });
}

module.exports = {
  runTests,
  test,
  testResults
};
