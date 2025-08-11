/**
 * Board Detail Page - Modern Scribe Design
 * Scholarly three-column layout with tactile message components
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../../components/WalletAuth';
import ScribeLayout from '../../components/ScribeLayout';
import GamingChat from '../../components/GamingChat';
import TokenStaking from '../../components/TokenStaking';
import ReplyModal from '../../components/ReplyModal';
import { useP2PConnection } from '../../hooks/useP2PConnection';
import { loadMessages, saveMessages, appendMessage } from '../../lib/cache';
import { WalletAuthSystem } from '../../lib/wallet-auth-system';

// Board configuration
const BOARDS = {
  general: { name: 'General Discussion', category: 'Community', description: 'Open discussions about anything and everything' },
  technology: { name: 'Technology', category: 'Discussion', description: 'Latest in tech, gadgets, and innovation' },
  crypto: { name: 'Cryptocurrency', category: 'Finance', description: 'Blockchain, DeFi, and digital assets' },
  gaming: { name: 'Gaming', category: 'Entertainment', description: 'Video games, esports, and gaming culture' },
  art: { name: 'Art & Design', category: 'Creative', description: 'Visual arts, design, and creative expression' },
  music: { name: 'Music', category: 'Creative', description: 'All genres, artists, and musical discussions' },
  dev: { name: 'Development', category: 'Tech', description: 'Programming, software development, and coding' },
  trading: { name: 'Trading', category: 'Finance', description: 'Market analysis, trading strategies, and finance' }
};

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    reputation: number;
  };
  boardSlug: string;
  createdAt: string;
  decayScore: number;
  replies: number;
  engagements: number;
  isVisible?: boolean;
  stakeTotal: number;
  burnedTotal: number;
  parentMessageId?: string; // For replies
  replyTo?: {
    id: string;
    content: string;
    author: {
      username: string;
    };
  }; // For displaying what this is replying to
}

export default function BoardDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { user, isAuthenticated, addPost } = useWalletAuth();
  
  const [board, setBoard] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [stakingMessageId, setStakingMessageId] = useState<string | null>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);

  // P2P networking (disabled to prevent spam)
  const {
    isConnected: p2pConnected,
    networkStatus,
    peerCount,
    broadcastMessage,
  } = useP2PConnection({
    autoConnect: false,
    userId: user?.walletAddress,
    board: slug as string
  });

  // Initialize board and load messages
  useEffect(() => {
    if (typeof slug !== 'string') return;

    const boardConfig = BOARDS[slug as keyof typeof BOARDS];
    if (!boardConfig) {
      router.push('/boards');
      return;
    }

    setBoard({ slug, ...boardConfig });
    loadBoardMessages(slug);
  }, [slug, router]);

  const loadBoardMessages = async (boardSlug: string) => {
    try {
      console.log('🔄 Loading messages for board:', boardSlug);
      
      // Load from local cache first
      const cached = await loadMessages(boardSlug);
      if (cached && cached.length > 0) {
        console.log('📋 Loaded', cached.length, 'cached messages');
        setMessages(cached as Message[]);
      }

      // ALSO load from wallet profile posts for this board
      const walletProfile = WalletAuthSystem.getCurrentProfile();
      if (walletProfile && walletProfile.posts) {
        const boardPosts = walletProfile.posts
          .filter(post => post.boardSlug === boardSlug)
          .map(post => ({
            id: post.id,
            content: post.content,
            author: {
              id: walletProfile.walletAddress,
              username: walletProfile.displayName,
              reputation: walletProfile.reputation
            },
            boardSlug: post.boardSlug,
            createdAt: new Date(post.createdAt).toISOString(),
            decayScore: 100,
            replies: 0,
            engagements: post.engagements || 0,
            isVisible: true,
            stakeTotal: post.stakeTotal || 0,
            burnedTotal: 0,
          }));
        
        if (boardPosts.length > 0) {
          console.log('👤 Found', boardPosts.length, 'posts from wallet profile');
          // Merge with existing messages, remove duplicates
          const existing = cached as Message[] || [];
          const allMessages = [...boardPosts, ...existing];
          const uniqueMessages = allMessages.filter((msg, index, arr) => 
            arr.findIndex(m => m.id === msg.id) === index
          );
          setMessages(uniqueMessages);
          console.log('📋 Total messages displayed:', uniqueMessages.length);
        }
      }

    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSubmitMessage = async (content: string) => {
    if (!content.trim() || !user || !board || submitting) return;

    setSubmitting(true);
    
    try {
      // Add post using wallet auth system
      const walletPost = addPost(content.trim(), board.slug);
      
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
        engagements: walletPost.engagements,
        isVisible: true,
        stakeTotal: walletPost.stakeTotal,
        burnedTotal: 0,
      };
      
      // Add to local state and cache
      const updatedMessages = [message, ...messages];
      setMessages(updatedMessages);
      console.log("🔄 UI updated with", updatedMessages.length, "messages");
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
      
      console.log(`✅ Message posted to ${board.name}`);
      
    } catch (error) {
      console.error('Error posting message:', error);
      alert('Failed to post message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (messageId: string, reaction: string) => {
    // Implement reaction logic
    console.log(`React ${reaction} to message ${messageId}`);
  };

  const handleStake = async (messageId: string) => {
    console.log(`Opening stake modal for message ${messageId}`);
    setStakingMessageId(messageId);
  };

  const handleStakeSuccess = (txSig: string, amount: number) => {
    console.log(`✅ Stake successful! TX: ${txSig}, Amount: ${amount}`);
    
    // Update the staked message's stake total
    setMessages(prev => prev.map(msg => 
      msg.id === stakingMessageId 
        ? { ...msg, stakeTotal: (msg.stakeTotal || 0) + amount }
        : msg
    ));
    
    // Close staking modal
    setStakingMessageId(null);
  };

  const handleStakeError = (error: string) => {
    console.error(`❌ Stake failed: ${error}`);
    // Keep modal open to show error - user can try again or close manually
  };

  const handleReply = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setReplyingToMessage(message);
      setReplyModalOpen(true);
    }
  };

  const handleReplySubmit = async (replyContent: string, parentMessageId: string) => {
    if (!user || !isAuthenticated) {
      throw new Error('User not authenticated');
    }

    const parentMessage = messages.find(m => m.id === parentMessageId);
    if (!parentMessage) {
      throw new Error('Parent message not found');
    }

    const replyMessage: Message = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: replyContent,
      author: {
        id: user.walletAddress,
        username: user.displayName || 'Anonymous',
        reputation: user.reputation || 0
      },
      boardSlug: slug as string,
      createdAt: new Date().toISOString(),
      decayScore: 100,
      replies: 0,
      engagements: 0,
      stakeTotal: 0,
      burnedTotal: 0,
      parentMessageId: parentMessageId,
      replyTo: {
        id: parentMessage.id,
        content: parentMessage.content.substring(0, 100) + (parentMessage.content.length > 100 ? '...' : ''),
        author: {
          username: parentMessage.author.username
        }
      }
    };

    // Add reply to messages
    const updatedMessages = [...messages, replyMessage];
    setMessages(updatedMessages);

    // Update parent message reply count
    const updatedParentMessages = updatedMessages.map(m => 
      m.id === parentMessageId 
        ? { ...m, replies: m.replies + 1 }
        : m
    );
    setMessages(updatedParentMessages);

    // Save to cache
    await saveMessages(slug as string, updatedParentMessages);

    // Update P2P network if connected
    if (p2pConnected) {
      try {
        await broadcastMessage({
          type: 'post',
          content: replyContent,
          boardSlug: slug as string,
          parentMessageId: parentMessageId,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Failed to broadcast reply:', error);
      }
    }

    // Update user profile posts
    if (addPost) {
      await addPost(replyContent, slug as string);
    }
  };

  if (!board) {
    return (
      <ScribeLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold mx-auto mb-4"></div>
            <p className="text-text-ash">Loading board...</p>
          </div>
        </div>
      </ScribeLayout>
    );
  }

  return (
    <ScribeLayout currentBoard={board.slug}>
      <Head>
        <title>{board.name} - OnusOne</title>
        <meta name="description" content={board.description} />
      </Head>

      {/* Gaming Chat Interface */}
      <GamingChat
        boardSlug={board.slug}
        boardName={board.name}
        messages={messages}
        onSubmitMessage={handleSubmitMessage}
        onStake={handleStake}
        onReply={handleReply}
        isAuthenticated={isAuthenticated}
      />
      
      {/* Staking Modal */}
      {stakingMessageId && (
        <TokenStaking
          postId={stakingMessageId}
          currentStake={messages.find(m => m.id === stakingMessageId)?.stakeTotal || 0}
          onStakeSuccess={handleStakeSuccess}
          onStakeError={handleStakeError}
          isOpen={true}
          onClose={() => setStakingMessageId(null)}
        />
      )}

      {/* Reply Modal */}
      {replyModalOpen && replyingToMessage && (
        <ReplyModal
          isOpen={replyModalOpen}
          onClose={() => {
            setReplyModalOpen(false);
            setReplyingToMessage(null);
          }}
          parentMessage={{
            id: replyingToMessage.id,
            content: replyingToMessage.content,
            author: {
              username: replyingToMessage.author.username,
              reputation: replyingToMessage.author.reputation
            },
            timestamp: replyingToMessage.createdAt
          }}
          onReplySubmit={handleReplySubmit}
          boardSlug={slug as string}
        />
      )}
    </ScribeLayout>
  );
}
