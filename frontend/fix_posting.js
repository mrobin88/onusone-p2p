const fs = require('fs');

let content = fs.readFileSync('pages/boards/[slug].tsx', 'utf8');

// Replace the handleSubmitMessage function
const newFunction = `  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !board || submitting) return;

    setSubmitting(true);
    
    try {
      console.log('🚀 Starting post creation...');
      
      // Add post using wallet auth system
      const walletPost = addPost(newMessage.trim(), board.slug);
      console.log('✅ Post added to wallet profile:', walletPost);
      
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
      
      console.log('📝 Message object created:', message);
      
      // Add to local state and cache
      const updatedMessages = [message, ...messages];
      setMessages(updatedMessages);
      setNewMessage('');
      
      console.log('📋 Added to board UI, total messages:', updatedMessages.length);
      
      await appendMessage(board.slug, message);
      console.log('💾 Cached locally');
      
      // Broadcast via P2P if connected
      if (p2pConnected) {
        await broadcastMessage({
          id: message.id,
          content: message.content,
          author: message.author.username,
          board: board.slug,
          createdAt: message.createdAt,
          engagements: message.engagements
        });
        console.log('📡 Broadcasted to P2P');
      }
      
      console.log('🎉 Post successfully added to board and profile!');
      
    } catch (error) {
      console.error('❌ Error posting message:', error);
      alert('Failed to post message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };`;

// Find and replace the function
const functionStart = content.indexOf('const handleSubmitMessage = async');
const functionEnd = content.indexOf('};', functionStart) + 2;

if (functionStart !== -1 && functionEnd !== -1) {
  const before = content.substring(0, functionStart);
  const after = content.substring(functionEnd);
  const newContent = before + newFunction + after;
  
  fs.writeFileSync('pages/boards/[slug].tsx', newContent);
  console.log('✅ Fixed posting function');
} else {
  console.log('❌ Could not find function to replace');
}
