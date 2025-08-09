import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../components/WalletAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Button from '../components/Button';
import PresenceBeacon from '../components/PresenceBeacon';
import ReputationDisplay from '../components/ReputationDisplay';
import QuickNodeButton from '../components/QuickNodeButton';
import { useRealP2PStatus } from '../hooks/useRealP2PStatus';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isConnecting } = useWalletAuth();
  const realP2PStatus = useRealP2PStatus();
  
  // Debug info - remove this later
  console.log('🔑 Wallet Auth Debug:', { isAuthenticated, user, isConnecting });

  const handleViewAPI = () => {
    router.push('/api-status');
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
      
      {/* Header with QuickNodeButton */}
      {isAuthenticated && (
        <header className="bg-gray-900 border-b border-gray-700 p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">OnusOne</h1>
              <span className="text-sm text-gray-400">P2P Network</span>
            </div>
            <QuickNodeButton />
          </div>
        </header>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            OnusOne
          </h1>
          <p className="text-xl mb-8 text-gray-300">
            Take Back Control - Decentralized Social Network
          </p>

          {/* Real P2P Network Status */}
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg mb-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">P2P Network Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-gray-400">Connected Peers:</span>
                <span className={`ml-2 font-bold ${realP2PStatus.isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {realP2PStatus.connectedPeers}
                </span>
                {!realP2PStatus.isConnected && (
                  <span className="text-xs text-gray-500 ml-2">(node offline)</span>
                )}
              </div>
              <div>
                <span className="text-gray-400">Network Health:</span>
                <span className={`ml-2 font-bold ${
                  realP2PStatus.networkHealth === 'excellent' ? 'text-green-400' : 
                  realP2PStatus.networkHealth === 'good' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {realP2PStatus.networkHealth === 'offline' ? 'Offline' : 
                   realP2PStatus.networkHealth.charAt(0).toUpperCase() + realP2PStatus.networkHealth.slice(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Node Uptime:</span>
                <span className="text-yellow-400 ml-2 font-bold">
                  {realP2PStatus.uptime > 0 ? `${Math.floor(realP2PStatus.uptime / 60)}m` : '0m'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Messages Cached:</span>
                <span className="text-blue-400 ml-2 font-bold">{realP2PStatus.messagesTotal}</span>
              </div>
              {isAuthenticated && user && (
                <div className="md:col-span-2">
                  <span className="text-gray-400">Your Reputation:</span>
                  <ReputationDisplay userId={user.walletAddress} compact={true} className="ml-2" />
                </div>
              )}
            </div>
            
            {/* Real status explanation */}
            <div className="mt-4 p-3 bg-gray-800 rounded text-sm">
              {realP2PStatus.isConnected ? (
                <p className="text-green-300">
                  ✅ Your local P2P node is running and connected to the network!
                </p>
              ) : (
                <p className="text-yellow-300">
                  ⏸️ P2P node is offline. Use the "Start Node & Earn" button above to join the network.
                </p>
              )}
            </div>
          </div>

          {/* Authentication Status */}
          <div className="mb-8">
            {isAuthenticated ? (
              <div className="bg-green-900 p-4 rounded-lg mb-4">
                <p className="text-green-300">
                  Welcome back, <strong>{user?.displayName}</strong>!
                </p>
                <p className="text-sm text-green-400 mt-1">
                  Wallet connected: {user?.walletAddress.slice(0, 8)}...{user?.walletAddress.slice(-4)}
                </p>
              </div>
            ) : (
              <div className="bg-blue-900 p-4 rounded-lg mb-4">
                <p className="text-blue-300">
                  Join the decentralized network
                </p>
                <p className="text-sm text-blue-400 mt-1">
                  Connect your Solana wallet to start earning
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 max-w-md mx-auto">
            {isConnecting ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-400 mt-2">Connecting wallet...</p>
              </div>
            ) : isAuthenticated ? (
              <>
                <Button 
                  onClick={() => router.push('/boards')}
                  className="w-full"
                >
                  📋 Browse Boards
                </Button>
                <Button 
                  onClick={() => router.push('/buy-onu')}
                  variant="secondary"
                  className="w-full"
                >
                  💳 Buy ONU Tokens
                </Button>
                <Button 
                  onClick={() => router.push('/become-node')}
                  variant="secondary"
                  className="w-full"
                >
                  💰 Become Node (Full Setup)
                </Button>
                <Button 
                  onClick={handleViewAPI}
                  variant="secondary"
                  className="w-full"
                >
                  🔌 View API Status
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="danger"
                  className="w-full"
                >
                  🚪 Logout
                </Button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Connect your Solana wallet to get started</p>
                  <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !w-full" />
                </div>
                <Button 
                  onClick={() => router.push('/boards')}
                  variant="secondary"
                  className="w-full"
                >
                  👀 Browse as Guest
                </Button>
                <Button 
                  onClick={handleViewAPI}
                  variant="secondary"
                  className="w-full"
                >
                  🔌 View API Status
                </Button>
              </>
            )}
          </div>

          {/* P2P Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Decentralized</h3>
              <p className="text-gray-300 text-sm">
                No central servers. Your data stays with you. Run a node and earn ONU tokens.
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-green-400">Real Earnings</h3>
              <p className="text-gray-300 text-sm">
                Stake ONU on posts, run nodes, earn based on uptime and network activity.
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-purple-400">Solana Powered</h3>
              <p className="text-gray-300 text-sm">
                Real blockchain transactions. Buy ONU with fiat, stake with Solana wallet.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
