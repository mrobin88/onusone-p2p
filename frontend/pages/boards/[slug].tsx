import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLocalAuth } from '../../components/LocalAuth';
import Button from '../../components/Button';
import P2PNetworkStatus from '../../components/P2PNetworkStatus';
import TokenStaking from '../../components/TokenStaking';
import { useP2PConnection } from '../../hooks/useP2PConnection';
import { loadMessages, saveMessages, appendMessage, appendClosedRecord } from '../../lib/cache';
import { computeDecayScore, isClosed } from '../../lib/decay';

interface Board {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  messageCount: number;
  lastActivity: string;
  isActive: boolean;
}

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    reputation: number;
  };
  boardSlug: string;
  createdAt: string; // ISO string
  decayScore: number;
  replies: number;
  engagements: number;
  isVisible?: boolean;
  stakeTotal?: number;
  burnedTotal?: number;
}

// P2P Enhanced Board Data
const mockBoards: Record<string, Board> = {
  'general': {
    id: '1',
    slug: 'general',
    name: 'General Discussion',
    description: 'Open discussions about anything and everything in our P2P network',
    category: 'General',
    messageCount: 324,
    lastActivity: '2 minutes ago',
    isActive: true
  },
  'technology': {
    id: '2',
    slug: 'technology',
    name: 'Technology',
    description: 'Tech discussions, programming, AI, blockchain, and P2P innovations',
    category: 'Technology',
    messageCount: 156,
    lastActivity: '1 hour ago',
    isActive: true
  },
  'community': {
    id: '3',
    slug: 'community',
    name: 'Community',
    description: 'Community governance, network improvements, and collaboration',
    category: 'Community',
    messageCount: 89,
    lastActivity: '30 minutes ago',
    isActive: true
  },
  'p2p-development': {
    id: '4',
    slug: 'p2p-development',
    name: 'P2P Development',
    description: 'Technical discussions about P2P protocols, IPFS, and network architecture',
    category: 'Development',
    messageCount: 67,
    lastActivity: '3 hours ago',
    isActive: true
  },
  'reputation': {
    id: '5',
    slug: 'reputation',
    name: 'Reputation & Governance',
    description: 'Discuss reputation systems, content decay, and network governance',
    category: 'Governance',
    messageCount: 45,
    lastActivity: '1 day ago',
    isActive: true
  }
};

// Fetch from KV-backed API instead of mocks

export default function BoardDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { user, isAuthenticated, logout } = useLocalAuth();
  
  const [board, setBoard] = useState<Board | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Real P2P networking integration
  const {
    isConnected: p2pConnected,
    networkStatus,
    peerCount,
    broadcastMessage,
  } = useP2PConnection({
    autoConnect: true,
    userId: user?.id,
    board: slug as string
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const init = async () => {
      if (slug && typeof slug === 'string') {
        const foundBoard = mockBoards[slug];
        if (!foundBoard) {
          router.push('/boards');
          return;
        }
        setBoard(foundBoard);
        // Load from API (KV-backed) with real decay filtering
        try {
          const res = await fetch(`/api/posts?board=${slug}`);
          const posts = await res.json();
          const withScores: Message[] = posts.map((p: any) => ({
            id: p.id,
            content: p.content,
            author: { id: p.authorId || 'anon', username: p.authorId || 'anon', reputation: 100 },
            boardSlug: p.boardType,
            createdAt: p.createdAt,
            decayScore: p.decayScore || 0, // Use API-calculated decay score
            replies: 0,
            engagements: p.engagements || 0,
            isVisible: p.isVisible !== false, // API already filtered, but track status
            stakeTotal: p.stakeTotal || 0,
            burnedTotal: p.burnedTotal || 0,
          }));
          setMessages(withScores);
          await saveMessages(slug, withScores as any);
        } catch (e) {
          // fallback to cache
          const cached = await loadMessages(slug);
          setMessages((cached as any[]));
        }

        // Network stats now come from real P2P connection
      }
    };
    init();
  }, [slug, isAuthenticated, router]);

  // Re-compute decay periodically and close-out old messages
  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;
    const interval = setInterval(async () => {
      setMessages((prev) => {
        const updated = prev
          .map((m) => ({
            ...m,
            decayScore: computeDecayScore(m.createdAt, m.engagements),
          }))
          .filter((m) => {
            const closed = isClosed(m.decayScore);
            if (closed) {
              appendClosedRecord({ id: m.id, boardSlug: m.boardSlug, closedAt: new Date().toISOString() });
            }
            return !closed;
          });
        // Persist updated list
        saveMessages(slug, updated);
        return updated;
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, [slug]);

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    setSubmitting(true);
    
    try {
      const message: Message = {
        id: `new-${Date.now()}`,
        content: newMessage,
        author: {
          id: user.id,
          username: user.username,
          reputation: 100 + Math.floor(Math.random() * 150)
        },
        boardSlug: slug as string,
        createdAt: new Date().toISOString(),
        decayScore: 100, // New messages start with perfect score
        replies: 0,
        engagements: 0
      };
      // Save locally and update UI
      await appendMessage(slug as string, message);
      setMessages([message, ...messages]);
      setNewMessage('');
      
      // Broadcast via P2P network if connected
      if (p2pConnected) {
        const success = await broadcastMessage({
          id: message.id,
          content: message.content,
          author: message.author.username,
          board: slug as string,
          createdAt: message.createdAt,
          engagements: message.engagements
        });
        
        if (success) {
          console.log('📡 Message broadcasted to P2P network');
        } else {
          console.warn('⚠️ P2P broadcast failed, message saved locally only');
        }
      } else {
        console.log('💾 Message saved locally (P2P offline)');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEngageMessage = async (messageId: string) => {
    try {
      // Call the engagement API
      const response = await fetch('/api/posts/engage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: messageId,
          type: 'like',
          userId: user?.id
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update local state with real API response
        setMessages(messages.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                engagements: result.newEngagements,
                decayScore: result.newDecayScore
              }
            : msg
        ));
        
        console.log(`💫 Engagement successful: +${result.boost} decay points`);
      } else {
        console.error('Engagement failed:', await response.text());
        // Fallback to local update if API fails
        setMessages(messages.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                engagements: msg.engagements + 1,
                decayScore: Math.min(msg.decayScore + 2, 100)
              }
            : msg
        ));
      }
    } catch (error) {
      console.error('Engagement error:', error);
      // Fallback to local update
      setMessages(messages.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              engagements: msg.engagements + 1,
              decayScore: Math.min(msg.decayScore + 2, 100)
            }
          : msg
      ));
    }
  };

  const formatDate = (dateISO: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateISO));
  };

  const getDecayColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getReputationColor = (rep: number) => {
    if (rep >= 300) return 'text-purple-400';
    if (rep >= 200) return 'text-blue-400';
    if (rep >= 100) return 'text-green-400';
    return 'text-gray-400';
  };

  if (!isAuthenticated || !board) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{board.name} - OnusOne P2P</title>
        <meta name="description" content={board.description} />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-2xl font-bold text-white">
                  OnusOne P2P
                </Link>
                <nav className="flex space-x-4">
                  <Link href="/boards" className="text-blue-400 px-3 py-2 rounded-md text-sm font-medium">
                    Boards
                  </Link>
                  <Link href="/p2p-demo" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    P2P Demo
                  </Link>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">Welcome, {user?.username}!</span>
                <Button onClick={() => logout()} variant="secondary" size="sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/boards" className="text-blue-400 hover:text-blue-300 flex items-center space-x-2">
              <span>←</span>
              <span>Back to Boards</span>
            </Link>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {/* Board Header */}
              <div className="bg-gray-900 rounded-lg p-8 mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                    {board.category}
                  </span>
                  <div className={`flex items-center space-x-1 ${p2pConnected ? 'text-green-400' : 'text-orange-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${p2pConnected ? 'bg-green-400 animate-pulse' : 'bg-orange-400'}`}></div>
                    <span className="text-sm">
                      {p2pConnected ? `P2P Active (${peerCount} peers)` : 'P2P Connecting...'}
                    </span>
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-4">
                  {board.name}
                </h1>
                
                <p className="text-gray-400 text-lg mb-6">
                  {board.description}
                </p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <span>{board.messageCount} messages</span>
                  <span>Last activity: {board.lastActivity}</span>
                  <span>{networkStatus?.messagesSynced || 0} messages synced</span>
                  {networkStatus?.storageUsed && (
                    <span>{networkStatus.storageUsed} MB stored</span>
                  )}
                </div>
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSubmitMessage} className="bg-gray-900 rounded-lg p-6 mb-8">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Share your thoughts with the P2P network
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What's on your mind? Your message will be distributed across the P2P network..."
                    required
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    Messages are ranked by community engagement • Start with 100 decay points
                  </div>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Broadcasting...' : 'Broadcast to Network'}
                  </Button>
                </div>
              </form>

              {/* Messages List */}
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className="bg-gray-900 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="flex items-center space-x-3">
                            <Link href={`/users/${message.author.username}`} className="font-medium text-white hover:underline">
                              {message.author.username}
                            </Link>
                            <span className={`text-sm font-medium ${getReputationColor(message.author.reputation)}`}>
                              {message.author.reputation} rep
                            </span>
                          </div>
                          <span className="text-gray-400 text-sm">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {/* Stake Information */}
                        {(message.stakeTotal && message.stakeTotal > 0) && (
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Stake</div>
                            <div className="text-purple-400 font-medium">
                              {message.stakeTotal - (message.burnedTotal || 0)} ONU
                            </div>
                            {message.burnedTotal && message.burnedTotal > 0 && (
                              <div className="text-xs text-red-500">
                                -{message.burnedTotal} burned
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Decay Score with Warning */}
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Decay Score</div>
                          <div className={`text-lg font-semibold ${getDecayColor(message.decayScore)}`}>
                            {message.decayScore}
                          </div>
                          {message.decayScore <= 25 && (
                            <div className="text-xs text-red-400 animate-pulse">
                              ⚠️ Fading away
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleEngageMessage(message.id)}
                          className="text-gray-400 hover:text-red-400 transition duration-200 text-xl"
                          title="Engage with this message to boost its decay score"
                        >
                          ❤️
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-gray-300 leading-relaxed mb-4">
                      {message.content}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span>{message.replies} replies</span>
                        <span>{message.engagements} engagements</span>
                        {(message.stakeTotal && message.stakeTotal > 0) && (
                          <span className="text-purple-400">
                            {message.stakeTotal - (message.burnedTotal || 0)} ONU staked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <TokenStaking
                          postId={message.id}
                          currentStake={message.stakeTotal || 0}
                          onStakeSuccess={(txSig, amount) => {
                            console.log(`Stake successful: ${amount} ONU, tx: ${txSig}`);
                            // Refresh messages to show updated stake
                            window.location.reload();
                          }}
                          onStakeError={(error) => {
                            console.error('Stake failed:', error);
                            alert(`Stake failed: ${error}`);
                          }}
                        />
                        <span className="text-blue-400">Distributed via P2P</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Real P2P Network Status */}
              <P2PNetworkStatus
                showDetails={true}
                board={slug as string}
              />

              {/* Other Boards */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Other Boards</h3>
                <div className="space-y-2">
                  {Object.values(mockBoards)
                    .filter(b => b.slug !== slug)
                    .slice(0, 4)
                    .map((otherBoard) => (
                      <Link
                        key={otherBoard.slug}
                        href={`/boards/${otherBoard.slug}`}
                        className="block p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition duration-200"
                      >
                        <div className="font-medium text-white text-sm">{otherBoard.name}</div>
                        <div className="text-gray-400 text-xs">{otherBoard.messageCount} messages</div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}