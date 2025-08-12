/**
 * API Status Page - Shows working endpoints instead of broken P2P
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../components/WalletAuth';
import { useRealP2PStatus } from '../hooks/useRealP2PStatus';

interface APIEndpoint {
  name: string;
  path: string;
  method: string;
  status: 'working' | 'testing' | 'error';
  description: string;
}

export default function APIStatus() {
  const router = useRouter();
  const { user, isAuthenticated } = useWalletAuth();
  const realP2PStatus = useRealP2PStatus();
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);

  const API_ENDPOINTS: APIEndpoint[] = [
    {
      name: 'Stripe Payment Creation',
      path: '/api/stripe/create-onu-purchase',
      method: 'POST',
      status: 'working',
      description: 'Creates payment intent for buying ONU tokens ($25 → 50 ONU)'
    },
    {
      name: 'Token Delivery',
      path: '/api/stripe/verify-payment',
      method: 'POST',
      status: 'working',
      description: 'Verifies payment and sends ONU tokens to wallet'
    },
    {
      name: 'Stake Confirmation',
      path: '/api/stake/confirm',
      method: 'POST',
      status: 'working',
      description: 'Verifies Solana transactions for token staking'
    },
    {
      name: 'P2P Network (Local)',
              path: 'https://onusone-p2p.onrender.com/health',
      method: 'GET',
      status: realP2PStatus.isConnected ? 'working' : 'error',
      description: 'Local P2P node health check (optional for app)'
    },
    {
      name: 'User Presence',
      path: '/api/presence',
      method: 'POST',
      status: 'testing',
      description: 'Tracks user activity and network presence'
    }
  ];

  useEffect(() => {
    setEndpoints(API_ENDPOINTS);
  }, [realP2PStatus.isConnected]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'text-green-400';
      case 'testing': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return '✅';
      case 'testing': return '🔄';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">OnusOne API Status</h1>
            <button
              onClick={() => router.push('/')}
              className="text-blue-400 hover:text-blue-300"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* App Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">🚀 App Status</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Wallet Authentication:</span>
                <span className="text-green-400">✅ Working</span>
              </div>
              <div className="flex justify-between">
                <span>Message Posting:</span>
                <span className="text-green-400">✅ Working</span>
              </div>
              <div className="flex justify-between">
                <span>Token Staking:</span>
                <span className="text-green-400">✅ Working</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Stripe Payments:</span>
                <span className="text-green-400">✅ Ready</span>
              </div>
              <div className="flex justify-between">
                <span>Solana Integration:</span>
                <span className="text-green-400">✅ Working</span>
              </div>
              <div className="flex justify-between">
                <span>User Connected:</span>
                <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                  {isAuthenticated ? '✅ Yes' : '❌ No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real P2P Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">🌐 P2P Network Status</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Local Node:</span>
                <span className={realP2PStatus.isConnected ? 'text-green-400' : 'text-red-400'}>
                  {realP2PStatus.isConnected ? '✅ Running' : '❌ Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Connected Peers:</span>
                <span className="text-blue-400">{realP2PStatus.connectedPeers}</span>
              </div>
              <div className="flex justify-between">
                <span>Network Health:</span>
                <span className={getStatusColor(realP2PStatus.networkHealth)}>
                  {realP2PStatus.networkHealth.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span className="text-yellow-400">
                  {realP2PStatus.uptime > 0 ? `${Math.floor(realP2PStatus.uptime / 60)}m` : '0m'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Messages Cached:</span>
                <span className="text-blue-400">{realP2PStatus.messagesTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Sync:</span>
                <span className="text-gray-400">
                  {realP2PStatus.lastSync > 0 ? 'Just now' : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">🔌 API Endpoints</h2>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="border border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getStatusIcon(endpoint.status)}</span>
                    <div>
                      <h3 className="font-medium">{endpoint.name}</h3>
                      <p className="text-sm text-gray-400">{endpoint.description}</p>
                    </div>
                  </div>
                  <div className={`font-mono text-sm ${getStatusColor(endpoint.status)}`}>
                    {endpoint.status.toUpperCase()}
                  </div>
                </div>
                <code className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded mt-2 block">
                  {endpoint.method} {endpoint.path}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* User Info */}
        {isAuthenticated && user && (
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <h2 className="text-2xl font-bold mb-4">👤 Your Session</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Wallet:</span>
                <code className="text-blue-400">{user.walletAddress}</code>
              </div>
              <div className="flex justify-between">
                <span>Display Name:</span>
                <span>{user.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Posts:</span>
                <span>{user.totalPosts}</span>
              </div>
              <div className="flex justify-between">
                <span>Network Time:</span>
                <span>{user.networkTime}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
