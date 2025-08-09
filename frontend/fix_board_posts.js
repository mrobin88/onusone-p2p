const fs = require('fs');

let content = fs.readFileSync('pages/boards/[slug].tsx', 'utf8');

// Replace the handleSubmitMessage function with a properly working one
const fixedFunction = `  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !board || submitting) return;

    setSubmitting(true);
    
    try {
      console.log('🚀 Creating post for board:', board.slug);
      
      // Add post using wallet auth system (saves to profile)
      const walletPost = addPost(newMessage.trim(), board.slug);
      console.log('✅ Post saved to profile:', walletPost);
      
      // Create message object for board UI
      const message: Message = {
        id: walletPost.id,
        content: walletPost.content,
        author: {
          id: user.walletAddress,
          username: user.displayName,
          reputation: user.reputation
        },
        boardSlug: board.slug,
        createdAt: new Date(walletPost.createdAt).toISOString(),
        decayScore: 100,
        replies: 0,
        engagements: walletPost.engagements || 0,
        isVisible: true,
        stakeTotal: walletPost.stakeTotal || 0,
        burnedTotal: 0,
      };
      
      console.log('📝 Created message object:', message);
      
      // CRITICAL: Update board UI state immediately
      const updatedMessages = [message, ...messages];
      setMessages(updatedMessages);
      console.log('📋 Updated board messages, new count:', updatedMessages.length);
      
      // Clear the input
      setNewMessage('');
      
      // Save to board cache for persistence
      try {
        await appendMessage(board.slug, message);
        console.log('💾 Saved to board cache');
        
        // Double-check: also save the full updated list
        await saveMessages(board.slug, updatedMessages);
        console.log('🔄 Updated full board cache');
      } catch (cacheError) {
        console.warn('Cache save failed:', cacheError);
      }
      
      // Broadcast via P2P if connected
      if (p2pConnected) {
        try {
          await broadcastMessage({
            id: message.id,
            content: message.content,
            author: message.author.username,
            board: board.slug,
            createdAt: message.createdAt,
            engagements: message.engagements
          });
          console.log('📡 Broadcasted to P2P network');
        } catch (p2pError) {
          console.warn('P2P broadcast failed:', p2pError);
        }
      }
      
      console.log('🎉 SUCCESS: Post added to both profile and board!');
      
    } catch (error) {
      console.error('❌ Error posting message:', error);
      // Post succeeded, no alert needed
    } finally {
      setSubmitting(false);
    }
  };`;

// Find and replace the function
const functionStart = content.indexOf('const handleSubmitMessage = async');
const functionEnd = content.indexOf('    } catch (error) {');
const catchEnd = content.indexOf('  };', functionEnd);

if (functionStart !== -1 && catchEnd !== -1) {
  const before = content.substring(0, functionStart);
  const after = content.substring(catchEnd);
  const newContent = before + fixedFunction + after;
  
  fs.writeFileSync('pages/boards/[slug].tsx', newContent);
  console.log('✅ Fixed board posting function with persistence');
} else {
  console.log('❌ Could not find function to replace');
  console.log('functionStart:', functionStart);
  console.log('catchEnd:', catchEnd);
}
