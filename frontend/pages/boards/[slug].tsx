import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLocalAuth } from '../../components/LocalAuth';
import Button from '../../components/Button';
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

// Enhanced mock messages with P2P features
const generateMockMessages = (boardSlug: string): Message[] => {
  const baseMessages = {
    'general': [
      {
        content: 'Welcome to OnusOne P2P! This is truly revolutionary - no more centralized control over our conversations.',
        author: 'p2p_pioneer',
        reputation: 245
      },
      {
        content: 'The content decay system is brilliant. I love how quality content naturally rises while spam disappears.',
        author: 'community_builder',
        reputation: 180
      },
      {
        content: 'Just set up my own node. The network effect is amazing - more peers = better performance!',
        author: 'new_member',
        reputation: 95
      }
    ],
    'technology': [
      {
        content: 'The reputation algorithm in our P2P system prevents spam better than any centralized moderation.',
        author: 'tech_researcher',
        reputation: 320
      },
      {
        content: 'IPFS integration is working smoothly. Content distribution across peers is lightning fast.',
        author: 'distributed_dev',
        reputation: 280
      },
      {
        content: 'Has anyone tested the network with 100+ peers yet? Curious about scaling performance.',
        author: 'performance_tester',
        reputation: 150
      }
    ],
    'community': [
      {
        content: 'We should discuss governance proposals for the reputation scoring algorithm. What decay rates work best?',
        author: 'governance_lead',
        reputation: 380
      },
      {
        content: 'Community-driven content curation is working! Quality discussions are staying alive longer.',
        author: 'content_curator',
        reputation: 220
      },
      {
        content: 'New members: check out the onboarding guide. The P2P learning curve is worth it!',
        author: 'community_helper',
        reputation: 195
      }
    ]
  };

  const messages = baseMessages[boardSlug as keyof typeof baseMessages] || baseMessages.general;
  
  return messages.map((msg, index) => ({
    id: `${boardSlug}-${index + 1}`,
    content: msg.content,
    author: {
      id: `user-${index + 1}`,
      username: msg.author,
      reputation: msg.reputation
    },
    boardSlug,
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // Random time in last week
    decayScore: Math.floor(Math.random() * 30) + 70, // 70-100 range
    replies: Math.floor(Math.random() * 10),
    engagements: Math.floor(Math.random() * 25)
  }));
};

export default function BoardDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { user, isAuthenticated, logout } = useLocalAuth();
  
  const [board, setBoard] = useState<Board | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    activePeers: 0,
    messagesSynced: 0,
    networkLatency: 0
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

        // Load cached messages and compute live decay
        const cached = await loadMessages(slug);
        const withScores: Message[] = (cached as any[]).map((m) => ({
          ...m,
          decayScore: computeDecayScore(m.createdAt, m.engagements),
        }));
        setMessages(withScores);

        // Simulate basic network stats (P2P to be wired next)
        setNetworkStats({
          activePeers: Math.floor(Math.random() * 20) + 8,
          messagesSynced: withScores.length,
          networkLatency: Math.floor(Math.random() * 50) + 25,
        });
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
      // TODO: publish via P2P next
    } finally {
      setSubmitting(false);
    }
  };

  const handleEngageMessage = (messageId: string) => {
    setMessages(messages.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            engagements: msg.engagements + 1,
            decayScore: Math.min(msg.decayScore + 5, 100)
          }
        : msg
    ));
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
                  <div className="flex items-center space-x-1 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">P2P Active</span>
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
                  <span>{networkStats.activePeers} peers connected</span>
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
                            <span className="font-medium text-white">{message.author.username}</span>
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
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Decay Score</div>
                          <div className={`text-lg font-semibold ${getDecayColor(message.decayScore)}`}>
                            {message.decayScore}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEngageMessage(message.id)}
                          className="text-gray-400 hover:text-red-400 transition duration-200 text-xl"
                          title="Engage with this message"
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
                      </div>
                      <span className="text-blue-400">Distributed via P2P</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* P2P Network Status */}
              <div className="bg-gray-900 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">🌐 Network Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Peers</span>
                    <span className="text-green-400 font-medium">{networkStats.activePeers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Messages Synced</span>
                    <span className="text-blue-400 font-medium">{networkStats.messagesSynced}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Latency</span>
                    <span className="text-purple-400 font-medium">{networkStats.networkLatency}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Board Health</span>
                    <span className="text-green-400 font-medium">Excellent</span>
                  </div>
                </div>
              </div>

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