import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLocalAuth } from '../../components/LocalAuth';
import Button from '../../components/Button';

interface Topic {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    reputation: number;
  };
  createdAt: Date;
  replies: number;
  lastActivity: Date;
  category: string;
  decayScore: number;
}

// P2P-enhanced topics with realistic data
const mockTopics: Topic[] = [
  {
    id: '1',
    title: 'Welcome to OnusOne P2P - The Future of Decentralized Social Networks',
    content: 'This is your introduction to truly decentralized social networking. No algorithms controlling your feed, no corporate data harvesting, just pure peer-to-peer communication where quality content rises through community engagement.',
    author: {
      id: '1',
      username: 'p2p_pioneer',
      reputation: 350
    },
    createdAt: new Date('2025-01-01'),
    replies: 24,
    lastActivity: new Date('2025-01-03'),
    category: 'Welcome',
    decayScore: 98
  },
  {
    id: '2',
    title: 'Technical Deep Dive: How Content Decay Prevents Spam Better Than Moderation',
    content: 'Our content decay algorithm is revolutionary. Instead of relying on human moderators or AI filters, we let the community decide what content survives through engagement. Bad content naturally dies, good content lives forever.',
    author: {
      id: '2',
      username: 'tech_researcher',
      reputation: 420
    },
    createdAt: new Date('2025-01-02'),
    replies: 18,
    lastActivity: new Date('2025-01-03'),
    category: 'Technology',
    decayScore: 95
  },
  {
    id: '3',
    title: 'Community Governance: How Reputation Systems Create Better Networks',
    content: 'Traditional platforms fail because they prioritize engagement over quality. Our reputation system rewards users who contribute value, creating a positive feedback loop that improves the entire network.',
    author: {
      id: '3',
      username: 'governance_expert',
      reputation: 280
    },
    createdAt: new Date('2025-01-01'),
    replies: 15,
    lastActivity: new Date('2025-01-02'),
    category: 'Governance',
    decayScore: 92
  },
  {
    id: '4',
    title: 'Setting Up Your First P2P Node: A Beginner\'s Guide',
    content: 'New to P2P networking? This guide will walk you through setting up your own node, connecting to the network, and making your first contributions to the decentralized community.',
    author: {
      id: '4',
      username: 'community_helper',
      reputation: 195
    },
    createdAt: new Date('2025-01-02'),
    replies: 22,
    lastActivity: new Date('2025-01-03'),
    category: 'Tutorial',
    decayScore: 89
  }
];

export default function TopicsIndex() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useLocalAuth();
  const [topics, setTopics] = useState<Topic[]>(mockTopics);
  const [networkStats, setNetworkStats] = useState({
    activePeers: 0,
    totalTopics: topics.length,
    networkHealth: 'Excellent'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Simulate live P2P network stats
    const updateStats = () => {
      setNetworkStats({
        activePeers: Math.floor(Math.random() * 25) + 10,
        totalTopics: topics.length,
        networkHealth: Math.random() > 0.1 ? 'Excellent' : 'Good'
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated, router, topics.length]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Welcome': 'bg-blue-600',
      'Technology': 'bg-green-600',
      'Governance': 'bg-purple-600',
      'Tutorial': 'bg-orange-600',
      'Discussion': 'bg-yellow-600'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-600';
  };

  const getDecayColor = (score: number) => {
    if (score >= 95) return 'text-green-400';
    if (score >= 85) return 'text-yellow-400';
    if (score >= 75) return 'text-orange-400';
    return 'text-red-400';
  };

  const getReputationColor = (rep: number) => {
    if (rep >= 400) return 'text-purple-400';
    if (rep >= 300) return 'text-blue-400';
    if (rep >= 200) return 'text-green-400';
    return 'text-gray-400';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>P2P Topics - OnusOne</title>
        <meta name="description" content="Decentralized topic discussions powered by P2P technology" />
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
                  <span className="text-blue-400 px-3 py-2 rounded-md text-sm font-medium">
                    Topics
                  </span>
                  <Link href="/boards" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
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

        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              P2P Topic Discussions
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Deep dive into topics that matter. Quality discussions preserved by community engagement,
              spam eliminated by our content decay system.
            </p>
          </div>

          {/* Network Status */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-4 text-blue-300">🌐 P2P Network Status</h2>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">{networkStats.activePeers}</div>
                <div className="text-sm text-gray-300">Active Peers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{networkStats.totalTopics}</div>
                <div className="text-sm text-gray-300">Live Topics</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{networkStats.networkHealth}</div>
                <div className="text-sm text-gray-300">Network Health</div>
              </div>
            </div>
          </div>

          {/* Topics List */}
          <div className="space-y-6">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topics/${topic.id}`}
                className="block bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-500/50 transition-all duration-200 hover:bg-gray-800"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-white text-xs rounded-full ${getCategoryColor(topic.category)}`}>
                      {topic.category}
                    </span>
                    <div className="flex items-center space-x-1 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs">P2P Active</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Decay Score</div>
                    <div className={`text-lg font-bold ${getDecayColor(topic.decayScore)}`}>
                      {topic.decayScore}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 hover:text-blue-400 transition-colors">
                  {topic.title}
                </h3>
                
                <p className="text-gray-400 mb-4 line-clamp-2">
                  {topic.content}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">by</span>
                    <span className="text-white font-medium">{topic.author.username}</span>
                    <span className={`font-medium ${getReputationColor(topic.author.reputation)}`}>
                      {topic.author.reputation} rep
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{topic.replies} replies</span>
                    <span>Last: {formatDate(topic.lastActivity)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* P2P Features Info */}
          <div className="mt-12 bg-gray-900 rounded-xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold text-center mb-6">🚀 Why P2P Topics Are Different</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="text-lg font-bold text-yellow-400 mb-2">Content Decay</h4>
                <p className="text-gray-400 text-sm">
                  Topics naturally decay unless kept alive by community engagement. Quality discussions survive, spam disappears.
                </p>
              </div>
              <div>
                <div className="text-3xl mb-3">🏆</div>
                <h4 className="text-lg font-bold text-blue-400 mb-2">Merit-Based</h4>
                <p className="text-gray-400 text-sm">
                  High-reputation users' topics get more visibility. Quality contributors shape the conversation.
                </p>
              </div>
              <div>
                <div className="text-3xl mb-3">🌐</div>
                <h4 className="text-lg font-bold text-purple-400 mb-2">Decentralized</h4>
                <p className="text-gray-400 text-sm">
                  No corporate algorithms. Topics are distributed across the P2P network, owned by the community.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}