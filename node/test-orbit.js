/**
 * Test OrbitDB Messaging System
 * Simple test to verify the system works
 */

const { OrbitServer } = require('./dist/orbit-server');

async function testOrbitDB() {
  console.log('🧪 Testing OrbitDB Messaging System...');
  
  try {
    // Create and start server
    const server = new OrbitServer();
    await server.start();
    
    console.log('✅ Server started successfully');
    
    // Get status
    const status = server.getStatus();
    console.log('📊 Server Status:', JSON.stringify(status, null, 2));
    
    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test creating a message
    const orbitMessaging = server.getOrbitMessaging();
    const message = await orbitMessaging.createMessage(
      'Hello from OrbitDB!',
      'test-user',
      'general'
    );
    
    console.log('✅ Message created:', message);
    
    // Test getting messages
    const messages = await orbitMessaging.getMessages('general');
    console.log('✅ Messages retrieved:', messages.length);
    
    // Test creating a board
    const board = await orbitMessaging.createBoard('test', 'Test Board', 'A test board');
    console.log('✅ Board created:', board);
    
    // Get final status
    const finalStatus = server.getStatus();
    console.log('📊 Final Status:', JSON.stringify(finalStatus, null, 2));
    
    // Stop server
    await server.stop();
    console.log('✅ Server stopped successfully');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testOrbitDB();
