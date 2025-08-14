#!/usr/bin/env node

const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

console.log('🚀 Starting OnusOne Local Unified Server...\n');

// Serve static frontend files from .next directory
app.use(express.static(path.join(__dirname, 'frontend/.next')));
app.use('/_next', express.static(path.join(__dirname, 'frontend/.next')));

// API routes will be handled by the backend
app.use('/api', (req, res) => {
  // Proxy API requests to backend
  res.redirect(`http://localhost:8888${req.url}`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Local Unified Server',
    frontend: 'Served from /frontend/out',
    backend: 'Proxied to localhost:8888'
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/out/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Frontend server running on http://localhost:${PORT}`);
  console.log(`✅ Backend API available at http://localhost:${PORT}/api/*`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log('\n🌐 Your unified service is now running locally!');
  console.log('📱 Open http://localhost:3000 in your browser');
  console.log('🔌 Backend APIs: http://localhost:8888');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down local unified server...');
  process.exit(0);
});
