#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Quick test to see if backend can connect to database
 */

const http = require('http');

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...');
  
  try {
    // Test local backend health
    const localHealth = await makeRequest('http://localhost:8888/health');
    console.log('✅ Local Backend:', localHealth.data.backend);
    console.log('✅ Database:', localHealth.data.database);
    
    // Test message creation (this should now persist to Supabase)
    console.log('\n🧪 Testing Message Persistence...');
    const testMessage = {
      content: 'Testing Supabase persistence - ' + new Date().toISOString(),
      author: 'SupabaseTest',
      boardSlug: 'general'
    };
    
    const createResponse = await makeRequest('http://localhost:8888/api/boards/general/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });
    
    if (createResponse.status === 200 || createResponse.status === 201) {
      console.log('✅ Message Created:', createResponse.data.id);
      
      // Test if message was stored
      const messagesResponse = await makeRequest('http://localhost:8888/api/boards/general/messages');
      const messages = messagesResponse.data;
      const foundMessage = messages.find(m => m.content.includes('Testing Supabase persistence'));
      
      if (foundMessage) {
        console.log('✅ Message Persisted to Database!');
        console.log('✅ Database Connection Working!');
      } else {
        console.log('❌ Message Not Found in Database');
        console.log('⚠️  Local storage fallback still active');
      }
    } else {
      console.log('❌ Message Creation Failed:', createResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Test Failed:', error.message);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
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
    req.setTimeout(5000);
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Run test
testSupabaseConnection().catch(console.error);
