import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../../components/WalletAuth';
import Button from '../../components/Button';

interface Board {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  messageCount: number;
  lastActivity: string;
  isActive: boolean;
  activeUsers: number;
  decayRate: number;
}

// P2P Enhanced Boards with realistic data
const mockBoards: Board[] = [
  {
    id: '1',
    slug: 'general',
    name: 'General Discussion',
    description: 'The pulse of the network. Where everything begins and nothing ends.',
    category: 'General',
    messageCount: 324,
    lastActivity: '2 minutes ago',
    isActive: true,
    activeUsers: 18,
    decayRate: 12
  },
  {
    id: '2',
    slug: 'technology',
    name: 'Technology',
    description: 'The cutting edge. Where tomorrow meets today.',
    category: 'Technology',
    messageCount: 156,
    lastActivity: '1 hour ago',
    isActive: true,
    activeUsers: 12,
    decayRate: 8
  },
  {
    id: '3',
    slug: 'community',
    name: 'Community',
    description: 'Shape the future. Your voice matters here.',
    category: 'Community',
    messageCount: 89,
    lastActivity: '30 minutes ago',
    isActive: true,
    activeUsers: 15,
    decayRate: 5
  },
  {
    id: '4',
    slug: 'p2p-development',
    name: 'P2P Development',
    description: 'Building the foundation. Code, protocols, architecture.',
    category: 'Development',
    messageCount: 67,
    lastActivity: '3 hours ago',
    isActive: true,
    activeUsers: 8,
    decayRate: 15
  },
  {
    id: '5',
    slug: 'reputation',
    name: 'Reputation & Governance',
    description: 'The rules of engagement. How we evolve together.',
    category: 'Governance',
    messageCount: 45,
    lastActivity: '1 day ago',
    isActive: true,
    activeUsers: 6,
    decayRate: 3
  },
  {
    id: '6',
    slug: 'newcomers',
    name: 'Newcomers Hub',
    description: 'First steps. We were all here once.',
    category: 'Support',
    messageCount: 78,
    lastActivity: '4 hours ago',
    isActive: true,
    activeUsers: 9,
    decayRate: 7
  }
];

export default function BoardsIndex() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useWalletAuth();
  const [networkStats, setNetworkStats] = useState({
    totalPeers: 0,
    totalMessages: 0,
    networkHealth: 'Excellent',
    activeBoards: mockBoards.length
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    // Simulate live P2P network stats
    const updateStats = () => {
      setNetworkStats({
        totalPeers: Math.floor(Math.random() * 30) + 15,
        totalMessages: mockBoards.reduce((sum, board) => sum + board.messageCount, 0),
        networkHealth: Math.random() > 0.1 ? 'Excellent' : 'Good',
        activeBoards: mockBoards.filter(b => b.isActive).length
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, router]);

  const getCategoryColor = (category: string) => {
    const colors = {
      'General': 'bg-blue-600',
      'Technology': 'bg-green-600',
      'Community': 'bg-purple-600',
      'Development': 'bg-orange-600',
      'Governance': 'bg-red-600',
      'Support': 'bg-yellow-600'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-600';
  };

  const getActivityColor = (lastActivity: string) => {
    if (lastActivity.includes('minutes')) return 'text-green-400';
    if (lastActivity.includes('hour')) return 'text-yellow-400';
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
        <title>Discussion Boards - OnusOne P2P</title>
        <meta name="description" content="Explore decentralized discussion boards powered by P2P technology" />
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
                    Boards
                  </span>
                  <Link href="/p2p-demo" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    P2P Demo
                  </Link>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">Welcome, {user?.displayName}!</span>
                <Button onClick={() => logout()} variant="secondary" size="sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              P2P Discussion Boards
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Decentralized communities where content quality is determined by the network, 
              not algorithms. Your voice, your data, your control.
            </p>
          </div>

          {/* Network Status */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-blue-300">🌐 Network Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">{networkStats.totalPeers}</div>
                <div className="text-sm text-gray-300">Connected Peers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{networkStats.totalMessages}</div>
                <div className="text-sm text-gray-300">Total Messages</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{networkStats.networkHealth}</div>
                <div className="text-sm text-gray-300">Network Health</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{networkStats.activeBoards}</div>
                <div className="text-sm text-gray-300">Active Boards</div>
              </div>
            </div>
          </div>

          {/* Boards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockBoards.map((board) => (
              <Link
                key={board.id}
                href={`/boards/${board.slug}`}
                className="group bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-500/50 transition-all duration-200 hover:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-white text-xs rounded-full ${getCategoryColor(board.category)}`}>
                      {board.category}
                    </span>
                    <div className="flex items-center space-x-1 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs">P2P</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{board.activeUsers}</div>
                    <div className="text-xs text-gray-400">active</div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {board.name}
                </h3>
                
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {board.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Messages</span>
                    <span className="text-white font-medium">{board.messageCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Last Activity</span>
                    <span className={`font-medium ${getActivityColor(board.lastActivity)}`}>
                      {board.lastActivity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Content Decay</span>
                    <span className="text-red-400 font-medium">{board.decayRate}/hr</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 text-sm group-hover:text-blue-300">
                      Join Discussion →
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <span>⚡</span>
                      <span>P2P Enabled</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* P2P Features */}
          <div className="mt-12 bg-gray-900 rounded-xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold text-center mb-8">🚀 P2P-Powered Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl mb-4">⚡</div>
                <h4 className="text-lg font-bold text-yellow-400 mb-2">Content Decay</h4>
                <p className="text-gray-400 text-sm">
                  Messages automatically lose relevance unless the community keeps them alive through engagement.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-4">🏆</div>
                <h4 className="text-lg font-bold text-blue-400 mb-2">Reputation System</h4>
                <p className="text-gray-400 text-sm">
                  Quality contributors earn reputation that gives them more influence in the network.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-4">🌐</div>
                <h4 className="text-lg font-bold text-purple-400 mb-2">True Decentralization</h4>
                <p className="text-gray-400 text-sm">
                  No servers, no corporations. Your messages are distributed directly between peers.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}