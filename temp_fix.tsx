  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || submitting) {
      console.log('Form validation failed:', { newMessage: newMessage.trim(), submitting });
      return;
    }

    if (!user) {
      console.error('No user found - not authenticated');
      alert('Please connect your wallet first');
      return;
    }

    if (!board) {
      console.error('No board found');
      return;
    }

    console.log('Posting message with user:', { 
      walletAddress: user.walletAddress, 
      displayName: user.displayName,
      reputation: user.reputation 
    });

    setSubmitting(true);
    
    try {
      // Add post using wallet auth system
      const walletPost = addPost(newMessage.trim(), board.slug);
      console.log('Wallet post created:', walletPost);
      
      const message: Message = {
        id: walletPost.id,
        content: walletPost.content,
        author: {
          id: user.walletAddress || 'unknown',
          username: user.displayName || 'Anonymous',
          reputation: user.reputation || 100
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
      
      console.log('Message object created:', message);
      
      // Add to local state and cache
      const updatedMessages = [message, ...messages];
      setMessages(updatedMessages);
      setNewMessage('');
      await appendMessage(board.slug, message);
      
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
      }
      
      console.log(`✅ Message posted successfully`);
      
    } catch (error) {
      console.error('Error posting message:', error);
      console.error('Error details:', {
        user: user,
        board: board,
        newMessage: newMessage
      });
      alert('Failed to post message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
