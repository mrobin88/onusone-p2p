/**
 * Board Detail Page - Modern Scribe Design
 * Scholarly three-column layout with tactile message components
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../../components/WalletAuth';
import ScribeLayout from '../../components/ScribeLayout';
import ScribeMessage from '../../components/ScribeMessage';
import { useP2PConnection } from '../../hooks/useP2PConnection';
import { loadMessages, saveMessages, appendMessage } from '../../lib/cache';

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
}

export default function BoardDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { user, isAuthenticated, addPost } = useWalletAuth();
  
  const [board, setBoard] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      // Load from local cache first
      const cached = await loadMessages(boardSlug);
      if (cached && cached.length > 0) {
        setMessages(cached as Message[]);
      }

      // Load from API if available
      const response = await fetch(`/api/posts?board=${boardSlug}`).catch(() => null);
      if (response && response.ok) {
        const posts = await response.json();
        const formattedMessages: Message[] = posts.map((p: any) => ({
          id: p.id,
          content: p.content,
          author: {
            id: p.authorId || 'anon',
            username: p.authorId || 'Anonymous',
            reputation: 100 + Math.floor(Math.random() * 200)
          },
          boardSlug: p.boardType,
          createdAt: p.createdAt,
          decayScore: p.decayScore || 100,
          replies: 0,
          engagements: p.engagements || 0,
          isVisible: true,
          stakeTotal: p.stakeTotal || 0,
          burnedTotal: p.burnedTotal || 0,
        }));
        
        setMessages(formattedMessages);
        await saveMessages(boardSlug, formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !board || submitting) return;

    setSubmitting(true);
    
    try {
      // Add post using wallet auth system
      const walletPost = addPost(newMessage.trim(), board.slug);
      
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
      setMessages(updatedMessages); console.log("🔄 UI updated with", updatedMessages.length, "messages");
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
    // Implement staking logic
    console.log(`Stake on message ${messageId}`);
  };

  const handleReply = async (messageId: string) => {
    // Implement reply logic
    console.log(`Reply to message ${messageId}`);
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

      {/* Board Header */}
      <div className="border-b border-border-line p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="heading-1">{board.name}</h1>
            <p className="body-small text-text-slate">{board.description}</p>
          </div>
          <div className="text-right">
            <div className="caption text-text-ash">
              {messages.length} messages • {board.category}
            </div>
            {p2pConnected && (
              <div className="caption text-status-green">
                ● P2P Active ({peerCount} peers)
              </div>
            )}
          </div>
        </div>

        {/* Compose Message */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmitMessage} className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="message-avatar flex-shrink-0">
                {user?.displayName?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Share your thoughts in ${board.name}...`}
                  className="textarea-field"
                  rows={3}
                  disabled={submitting}
                />
                <div className="mt-2 flex justify-between items-center">
                  <div className="caption text-text-slate">
                    Posting as {user?.displayName} • {user?.reputation} reputation
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Posting...' : 'Post Message'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="body-main text-text-slate mb-4">
              Connect your wallet to participate in the discussion
            </p>
            <button className="btn-primary">
              Connect Wallet
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length > 0 ? (
          messages.map((message) => (
            <ScribeMessage
              key={message.id}
              id={message.id}
              content={message.content}
              author={message.author}
              timestamp={message.createdAt}
              engagements={message.engagements}
              stakeTotal={message.stakeTotal}
              onReact={handleReaction}
              onStake={handleStake}
              onReply={handleReply}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="heading-3 text-text-slate mb-2">No messages yet</p>
              <p className="body-small text-text-ash">
                Be the first to start the conversation in {board.name}
              </p>
            </div>
          </div>
        )}
      </div>
    </ScribeLayout>
  );
}
