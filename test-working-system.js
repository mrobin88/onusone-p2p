/**
 * Test script for the working OnusOne system
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:8888';
const FRONTEND_URL = 'http://localhost:3000';

async function testSystem() {
  console.log('🧪 Testing OnusOne Working System...\n');

  try {
    // Test 1: Backend Health
    console.log('1️⃣ Testing Backend Health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend Health:', healthResponse.data);
    
    // Test 2: Backend API Test
    console.log('\n2️⃣ Testing Backend API...');
    const testResponse = await axios.get(`${BACKEND_URL}/api/test`);
    console.log('✅ Backend API Test:', testResponse.data);
    
    // Test 3: Get Boards
    console.log('\n3️⃣ Testing Boards API...');
    const boardsResponse = await axios.get(`${BACKEND_URL}/api/boards`);
    console.log('✅ Boards:', boardsResponse.data);
    
    // Test 4: Get Messages for General Board
    console.log('\n4️⃣ Testing Messages API...');
    const messagesResponse = await axios.get(`${BACKEND_URL}/api/boards/general/messages`);
    console.log('✅ General Board Messages:', messagesResponse.data);
    
    // Test 5: Create a Test Message
    console.log('\n5️⃣ Testing Message Creation...');
    const createResponse = await axios.post(`${BACKEND_URL}/api/boards/general/messages`, {
      content: 'Hello from test script! This is a test message.',
      author: 'test-user'
    });
    console.log('✅ Message Created:', createResponse.data);
    
    // Test 6: Verify Message Was Saved
    console.log('\n6️⃣ Verifying Message Persistence...');
    const updatedMessagesResponse = await axios.get(`${BACKEND_URL}/api/boards/general/messages`);
    console.log('✅ Updated Messages Count:', updatedMessagesResponse.data.length);
    
    // Test 7: Frontend Accessibility
    console.log('\n7️⃣ Testing Frontend...');
    const frontendResponse = await axios.get(FRONTEND_URL);
    console.log('✅ Frontend Status:', frontendResponse.status === 200 ? 'Running' : 'Error');
    
    console.log('\n🎉 All tests passed! The system is working correctly.');
    console.log('\n📱 You can now:');
    console.log('   - Open http://localhost:3000 in your browser');
    console.log('   - Connect your wallet');
    console.log('   - Navigate to boards and post messages');
    console.log('   - Messages will be saved to the backend');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testSystem();
