/**
 * Wallet Profile Page - Shows User Stats & Activity
 * Pure wallet-based profile using local storage
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../components/WalletAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Profile() {
  const router = useRouter();
  const { user, profile, isAuthenticated, logout } = useWalletAuth();

  if (!isAuthenticated || !user || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-6">You need to connect your wallet to view your profile</p>
          <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>My Profile - OnusOne P2P</title>
        <meta name="description" content="Your wallet profile and network statistics" />
      </Head>

      {/* Header */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-xl font-bold text-blue-400">
                OnusOne P2P
              </Link>
              <Link href="/boards" className="text-gray-300 hover:text-white">
                📋 Boards
              </Link>
              <Link href="/profile" className="text-blue-400 font-medium">
                👤 Profile
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
              <button
                onClick={logout}
                className="text-gray-400 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold">
              {user.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.displayName}</h1>
              <p className="text-gray-400 font-mono text-sm break-all">
                {user.walletAddress}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                  Reputation: {user.reputation}
                </span>
                <span className="text-gray-400 text-sm">
                  Member since {user.joinedAt}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {user.totalPosts}
            </div>
            <div className="text-gray-400">Total Posts</div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {user.totalStaked}
            </div>
            <div className="text-gray-400">ONU Staked</div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {user.networkTime}
            </div>
            <div className="text-gray-400">Network Time</div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {Math.floor(profile.stakes.length * 0.1)}
            </div>
            <div className="text-gray-400">ONU Earned</div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Recent Posts</h2>
          {profile.posts.length > 0 ? (
            <div className="space-y-4">
              {profile.posts.slice(0, 5).map((post) => (
                <div key={post.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-gray-300 mb-2">{post.content}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>📋 {post.boardSlug}</span>
                    <span>🕒 {new Date(post.createdAt).toLocaleDateString()}</span>
                    <span>💰 {post.stakeTotal} ONU staked</span>
                    <span>❤️ {post.engagements} engagements</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No posts yet. Start posting to build your profile!</p>
          )}
        </div>

        {/* Staking Activity */}
        <div className="bg-gray-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Staking Activity</h2>
          {profile.stakes.length > 0 ? (
            <div className="space-y-3">
              {profile.stakes.slice(0, 10).map((stake, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-800">
                  <div>
                    <span className="text-green-400 font-bold">{stake.amount} ONU</span>
                    <span className="text-gray-400 ml-2">staked on post</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(stake.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No staking activity yet. Stake on posts to support the network!</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => router.push('/boards')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            📋 Browse Boards
          </button>
          <button
            onClick={() => router.push('/become-node')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            💰 Become Node
          </button>
        </div>
      </main>
    </div>
  );
}
