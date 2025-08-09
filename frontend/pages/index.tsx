import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useLocalAuth } from '../components/LocalAuth';
import Button from '../components/Button';
import PresenceBeacon from '../components/PresenceBeacon';
import ReputationDisplay from '../components/ReputationDisplay';

// Mock P2P and token systems for demo
const mockP2PNetwork = {
  connectedPeers: 12,
  networkHealth: 94,
  messagesProcessed: 1337
};

const mockTokenManager = {
  totalSupply: 1000000,
  burnedTokens: 50000,
  activeStakes: 15000
};

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, logout, loading } = useLocalAuth();
  
  // Debug info - remove this later
  console.log('Auth Debug:', { isAuthenticated, user, loading });
  const [networkStats, setNetworkStats] = useState({
    connectedPeers: 0,
    userReputation: 100,
    networkHealth: 'Connecting...',
    totalMessages: 0,
    activeDecay: 0
  });

  // Simulate P2P network stats
  useEffect(() => {
    const fetchNetworkStats = async () => {
      try {
        const [presenceRes, boardsRes] = await Promise.all([
          fetch('/api/presence-count'),
          fetch('/api/admin/boards').catch(() => null),
        ]);
        const presence = await presenceRes.json().catch(() => ({ active: 0 }));
        const boards = boardsRes ? await boardsRes.json().catch(() => []) : [];
        const totalMsgs = Array.isArray(boards) ? boards.reduce((s: number, b: any) => s + (b.count || 0), 0) : 0;

        setNetworkStats({
          connectedPeers: presence.active || 0,
          userReputation: isAuthenticated ? 100 + Math.floor(Math.random() * 150) : 0,
          networkHealth: presence.active > 0 ? 'Excellent' : 'Connecting...',
          totalMessages: totalMsgs,
          activeDecay: Math.min(100, Math.max(0, Math.round((presence.active ? 18 : 10))))
        });
      } catch (error) {
        setNetworkStats((prev) => ({ ...prev, networkHealth: 'Connecting...' }));
      }
    };

    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleViewAPI = () => {
    window.open('http://localhost:8888/health', '_blank');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>OnusOne - Take Back Control</title>
        <meta name="description" content="Decentralized social platform - take back what's yours" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <PresenceBeacon />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            OnusOne
          </h1>
          <p className="text-xl mb-8 text-gray-300">
            Take Back Control - Decentralized Social Network
          </p>

          {/* P2P Network Status */}
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg mb-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">P2P Network Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-gray-400">Connected Peers:</span>
                <span className="text-green-400 ml-2 font-bold">{networkStats.connectedPeers}</span>
              </div>
              <div>
                <span className="text-gray-400">Network Health:</span>
                <span className="text-green-400 ml-2 font-bold">{networkStats.networkHealth}</span>
              </div>
              <div>
                <span className="text-gray-400">Total Messages:</span>
                <span className="text-yellow-400 ml-2 font-bold">{networkStats.totalMessages}</span>
              </div>
              <div>
                <span className="text-gray-400">Active Decay:</span>
                <span className="text-red-400 ml-2 font-bold">{networkStats.activeDecay}%</span>
              </div>
              {isAuthenticated && user && (
                <div className="md:col-span-2">
                  <span className="text-gray-400">Your Reputation:</span>
                  <ReputationDisplay userId={user.id} compact={true} className="ml-2" />
                </div>
              )}
            </div>
          </div>

          {/* Authentication Status */}
          <div className="mb-8">
            {isAuthenticated ? (
              <div className="bg-green-900 p-4 rounded-lg mb-4">
                <p className="text-green-300">
                  Welcome back, <strong>{user?.username}</strong>!
                </p>
                <p className="text-sm text-green-400 mt-1">
                  You are connected to the P2P network
                </p>
              </div>
            ) : (
              <div className="bg-blue-900 p-4 rounded-lg mb-4">
                <p className="text-blue-300">
                  Join the decentralized network
                </p>
                <p className="text-sm text-blue-400 mt-1">
                  Login to participate in discussions
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 max-w-md mx-auto">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-400 mt-2">Checking authentication...</p>
              </div>
            ) : isAuthenticated ? (
              <>
                <Button 
                  onClick={() => router.push('/boards')}
                  className="w-full"
                >
                  Browse Boards
                </Button>
                <Button 
                  onClick={() => router.push('/topics')}
                  variant="secondary"
                  className="w-full"
                >
                  View Topics
                </Button>
                <Button 
                  onClick={handleViewAPI}
                  variant="secondary"
                  className="w-full"
                >
                  View P2P API
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="danger"
                  className="w-full"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => router.push('/auth/login')}
                  className="w-full"
                >
                  Login / Register
                </Button>
                <Button 
                  onClick={() => router.push('/boards')}
                  variant="secondary"
                  className="w-full"
                >
                  Browse as Guest
                </Button>
                <Button 
                  onClick={handleViewAPI}
                  variant="secondary"
                  className="w-full"
                >
                  View P2P API
                </Button>
              </>
            )}
          </div>

          {/* P2P Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Decentralized</h3>
              <p className="text-gray-300 text-sm">
                No central servers. Your data stays with you.
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-green-400">Content Decay</h3>
              <p className="text-gray-300 text-sm">
                Quality content rises, spam naturally fades.
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-purple-400">Reputation</h3>
              <p className="text-gray-300 text-sm">
                Community-driven moderation and trust.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}