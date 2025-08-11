/**
 * Demo Script - Show off all the fun animations!
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:8888';
const FRONTEND_URL = 'http://localhost:3000';

async function demoAnimations() {
  console.log('🎭 OnusOne Animation Demo - Let\'s Make It Fun!\n');

  try {
    // Test 1: Backend Health with Fun Emojis
    console.log('1️⃣ Testing Backend Health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend Health:', healthResponse.data.status);
    console.log('🤖 Backend Type:', healthResponse.data.backend);
    console.log('💾 Database:', healthResponse.data.database);
    
    // Test 2: Create a Fun Test Message
    console.log('\n2️⃣ Creating a Fun Test Message...');
    const funMessage = {
      content: '🚀 This message is traveling through space! 🌌',
      author: 'space-explorer'
    };
    
    const createResponse = await axios.post(`${BACKEND_URL}/api/boards/general/messages`, funMessage);
    console.log('✅ Message Created:', createResponse.data.content);
    console.log('🆔 Message ID:', createResponse.data.id);
    
    // Test 3: Get All Messages
    console.log('\n3️⃣ Retrieving Messages from Space...');
    const messagesResponse = await axios.get(`${BACKEND_URL}/api/boards/general/messages`);
    console.log('📨 Total Messages in Orbit:', messagesResponse.data.length);
    
    // Test 4: Test Different Boards
    console.log('\n4️⃣ Exploring Different Space Stations...');
    const boardsResponse = await axios.get(`${BACKEND_URL}/api/boards`);
    console.log('🌍 Available Space Stations:');
    boardsResponse.data.forEach(board => {
      console.log(`   🚀 ${board.name} (${board.slug})`);
    });
    
    // Test 5: Frontend Accessibility
    console.log('\n5️⃣ Checking Frontend Portal...');
    const frontendResponse = await axios.get(FRONTEND_URL);
    console.log('🌐 Frontend Status:', frontendResponse.status === 200 ? '🚀 Portal Active' : '❌ Portal Offline');
    
    console.log('\n🎉 Animation Demo Complete!');
    console.log('\n🚀 What You Can Do Now:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Connect your Solana wallet');
    console.log('   3. Navigate to any board (General, Tech, Crypto)');
    console.log('   4. Post a message and watch it travel through space!');
    console.log('   5. See the fun robot animations and loading states');
    
    console.log('\n🤖 Fun Features You\'ll See:');
    console.log('   - 🚀 Space-traveling message loader');
    console.log('   - 🤖 Robot animations during message submission');
    console.log('   - ⭐ Stars and space debris animations');
    console.log('   - 🌍 Progress bars showing message journey');
    console.log('   - 💫 Fun loading spinners and transitions');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the demo
demoAnimations();
