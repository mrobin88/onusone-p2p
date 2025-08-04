#!/usr/bin/env node

/**
 * Demo script to test the enhanced P2P functionality
 * This shows how the reputation system, content decay, and peer scoring work together
 */

const { 
  p2pService, 
  reputationManager, 
  contentDecayEngine,
  generateContentHash
} = require('./shared/dist/p2p.js');

// Mock message generator
function createMockMessage(id, authorId, content, boardType = 'general') {
  return {
    id: id,
    content: content,
    authorId: authorId,
    boardType: boardType,
    createdAt: new Date(),
    contentHash: generateContentHash(content),
    decayScore: 100
  };
}

// Demo function
async function demoP2PEnhancements() {
  console.log('🚀 OnusOne P2P Enhancements Demo\n');
  
  // 1. Initialize P2P service
  console.log('1️⃣  Initializing P2P Service...');
  await p2pService.initialize();
  console.log('✅ P2P Service initialized\n');
  
  // 2. Test Reputation System
  console.log('2️⃣  Testing Reputation System...');
  
  // Create some test users
  const users = ['alice', 'bob', 'charlie', 'dave'];
  users.forEach(user => {
    console.log(`   User ${user} initial reputation: ${p2pService.getUserReputation(user)}`);
  });
  
  // Award reputation for good behavior
  p2pService.awardReputation('alice', 50, 'helpful_post');
  p2pService.awardReputation('bob', 30, 'quality_comment');
  p2pService.penalizeReputation('charlie', 20, 'spam_message');
  
  console.log('\n   After reputation changes:');
  users.forEach(user => {
    console.log(`   User ${user} reputation: ${p2pService.getUserReputation(user)}`);
  });
  
  console.log('\n   Top users:');
  const topUsers = p2pService.getTopUsers(3);
  topUsers.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.userId}: ${user.reputation} points`);
  });
  console.log('');
  
  // 3. Test Content Decay System
  console.log('3️⃣  Testing Content Decay System...');
  
  // Create test messages
  const messages = [
    createMockMessage('msg1', 'alice', 'This is a great discussion topic!'),
    createMockMessage('msg2', 'bob', 'Here are some valuable insights...'),
    createMockMessage('msg3', 'charlie', 'Spam message with no value'),
  ];
  
  // Initialize content tracking
  messages.forEach(msg => {
    p2pService.initializeContent(msg.id);
    console.log(`   Message ${msg.id} initial decay score: ${p2pService.getContentDecayScore(msg.id)}`);
  });
  
  // Simulate engagement on quality content
  console.log('\n   Simulating user engagement...');
  p2pService.recordEngagement('msg1', 'bob', 'like');
  p2pService.recordEngagement('msg1', 'dave', 'comment');
  p2pService.recordEngagement('msg2', 'alice', 'share');
  
  console.log('\n   After engagement:');
  messages.forEach(msg => {
    console.log(`   Message ${msg.id} decay score: ${p2pService.getContentDecayScore(msg.id)}`);
  });
  console.log('');
  
  // 4. Test Message Distribution
  console.log('4️⃣  Testing Message Distribution...');
  
  // Try to distribute messages (this will check reputation)
  for (const message of messages) {
    const success = await p2pService.distributeMessage(message);
    console.log(`   Message from ${message.authorId}: ${success ? '✅ Distributed' : '❌ Rejected'}`);
  }
  console.log('');
  
  // 5. Test Network Status
  console.log('5️⃣  Network Status...');
  const networkStatus = p2pService.getNetworkStatus();
  console.log('   Network Health:', JSON.stringify(networkStatus, null, 2));
  console.log('');
  
  // 6. Simulate time passing and content decay
  console.log('6️⃣  Simulating content decay over time...');
  
  // Manually trigger decay by simulating time passage
  // (In real system, this happens automatically)
  console.log('   🕐 Time passing... (simulating 2 hours)');
  
  // Show how content without engagement would decay
  const mockOldContent = 'msg_old';
  p2pService.initializeContent(mockOldContent);
  
  // Simulate 2 hours of decay (2 points per hour = 4 points lost)
  // This would normally happen automatically in the background
  console.log(`   Old content would decay from 100 to ~96 points over 2 hours`);
  console.log(`   Content with engagement maintains higher scores`);
  console.log('');
  
  // 7. Show content sorting by relevance
  console.log('7️⃣  Content Sorting by Relevance...');
  const messageIds = messages.map(m => m.id);
  const relevantMessages = p2pService.getContentByRelevance(messageIds);
  
  console.log('   Messages sorted by relevance (decay score):');
  relevantMessages.forEach((msg, index) => {
    const score = p2pService.getContentDecayScore(msg.id);
    console.log(`   ${index + 1}. ${msg.id} (score: ${score}) - "${msg.content.substring(0, 30)}..."`);
  });
  console.log('');
  
  console.log('🎉 P2P Enhancement Demo Complete!\n');
  
  console.log('💡 Key Features Demonstrated:');
  console.log('   ✅ Reputation management with automatic decay');
  console.log('   ✅ Content decay system with engagement boosts');
  console.log('   ✅ Quality-based content distribution');
  console.log('   ✅ Network health monitoring');
  console.log('   ✅ Automatic content ranking by relevance');
  console.log('   ✅ Self-regulating network behavior');
  console.log('');
  
  console.log('🌟 Benefits:');
  console.log('   • High-quality content rises to the top');
  console.log('   • Spam and low-quality content disappears automatically');
  console.log('   • Users are incentivized to contribute valuable content');
  console.log('   • Network becomes more efficient and valuable over time');
}

// Run the demo
if (require.main === module) {
  demoP2PEnhancements().catch(console.error);
}

module.exports = { demoP2PEnhancements };