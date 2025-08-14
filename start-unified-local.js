#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting OnusOne Unified Service Locally...\n');

// Build frontend first
console.log('📦 Building frontend...');
const frontendBuild = spawn('npm', ['run', 'build:production'], { 
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

frontendBuild.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Frontend built successfully!\n');
    
    // Start backend server
    console.log('🚀 Starting backend server...');
    const backendServer = spawn('npm', ['start'], { 
      cwd: path.join(__dirname, 'node'),
      stdio: 'inherit',
      shell: true
    });

    backendServer.on('close', (code) => {
      console.log(`\n🔴 Backend server stopped with code ${code}`);
    });

    backendServer.on('error', (error) => {
      console.error('❌ Backend server error:', error);
    });

  } else {
    console.error(`❌ Frontend build failed with code ${code}`);
    process.exit(code);
  }
});

frontendBuild.on('error', (error) => {
  console.error('❌ Frontend build error:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});
