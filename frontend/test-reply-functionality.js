// Test script to verify reply functionality
// Run this in the browser console on a board page

console.log('🧪 Testing Reply Functionality...');

// Test 1: Check if ReplyModal component exists
if (typeof window !== 'undefined') {
  console.log('✅ Running in browser environment');
  
  // Test 2: Check if reply modal state is properly managed
  const testReplyFlow = () => {
    console.log('📝 Testing reply flow...');
    
    // Simulate clicking reply on a message
    const replyButtons = document.querySelectorAll('[data-testid="reply-button"], button:contains("Reply")');
    console.log(`Found ${replyButtons.length} reply buttons`);
    
    if (replyButtons.length > 0) {
      console.log('✅ Reply buttons found');
      
      // Test reply modal opening
      replyButtons[0].click();
      
      setTimeout(() => {
        const modal = document.querySelector('.fixed.inset-0.z-50');
        if (modal) {
          console.log('✅ Reply modal opened successfully');
          
          // Test form elements
          const textarea = modal.querySelector('textarea');
          const submitButton = modal.querySelector('button[type="submit"]');
          
          if (textarea && submitButton) {
            console.log('✅ Reply form elements found');
            
            // Test character counting
            textarea.value = 'Test reply message';
            textarea.dispatchEvent(new Event('input'));
            
            const charCount = modal.querySelector('.text-xs');
            if (charCount && charCount.textContent.includes('18/1000')) {
              console.log('✅ Character counting working');
            } else {
              console.log('❌ Character counting not working');
            }
            
          } else {
            console.log('❌ Reply form elements missing');
          }
          
        } else {
          console.log('❌ Reply modal not found after clicking reply');
        }
      }, 100);
      
    } else {
      console.log('❌ No reply buttons found');
    }
  };
  
  // Test 3: Check message structure for replies
  const testMessageStructure = () => {
    console.log('🏗️ Testing message structure...');
    
    const messages = document.querySelectorAll('.message-component');
    console.log(`Found ${messages.length} messages`);
    
    if (messages.length > 0) {
      const firstMessage = messages[0];
      const replyIndicator = firstMessage.querySelector('.reply-indicator');
      
      if (replyIndicator) {
        console.log('✅ Reply indicators found');
      } else {
        console.log('ℹ️ No reply indicators found (this is normal for top-level messages)');
      }
      
      // Check for nested replies
      const nestedReplies = document.querySelectorAll('.ml-8 .message-component');
      console.log(`Found ${nestedReplies.length} nested replies`);
      
      if (nestedReplies.length > 0) {
        console.log('✅ Nested reply structure working');
      }
    }
  };
  
  // Test 4: Check wallet integration
  const testWalletIntegration = () => {
    console.log('🔗 Testing wallet integration...');
    
    // Check if wallet connection is required for replies
    const walletButtons = document.querySelectorAll('button:contains("Connect Wallet")');
    if (walletButtons.length > 0) {
      console.log('✅ Wallet connection required for replies');
    } else {
      console.log('ℹ️ Wallet already connected or not required');
    }
  };
  
  // Run all tests
  setTimeout(() => {
    testReplyFlow();
    setTimeout(() => {
      testMessageStructure();
      testWalletIntegration();
      console.log('🎉 Reply functionality tests completed!');
    }, 500);
  }, 1000);
  
} else {
  console.log('❌ Not running in browser environment');
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testReplyFlow,
    testMessageStructure,
    testWalletIntegration
  };
}
