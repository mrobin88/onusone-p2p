/**
 * Wallet Profile Page - Shows User Stats & Activity
 * Pure wallet-based profile using local storage
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletAuth } from '../components/WalletAuth';
import CleanNavbar from '../components/CleanNavbar';

interface UserStats {
  totalPosts: number;
  totalStaked: number;
  totalEarned: number;
  reputation: number;
  rank: string;
  joinedAt: string;
}

export default function Profile() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { user, isAuthenticated, logout } = useWalletAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserStats();
    }
  }, [isAuthenticated, user]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      // TODO: Load real stats from backend
      if (user) {
        setUserStats({
          totalPosts: user.totalPosts || 0,
          totalStaked: user.totalStaked || 0,
          totalEarned: user.totalEarned || 0,
          reputation: user.reputation || 0,
          rank: user.rank || 'Newcomer',
          joinedAt: user.joinedAt || 'Recently'
        });
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <>
        <CleanNavbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="card max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-secondary mb-6">
              You need to connect your wallet to view your profile
            </p>
            <Link href="/" className="btn btn-primary">
              Go Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <CleanNavbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="card max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-secondary mb-6">
              Please authenticate to view your profile
            </p>
            <Link href="/" className="btn btn-primary">
              Go Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Profile - OnusOne P2P</title>
        <meta name="description" content="Your wallet profile and network statistics" />
      </Head>

      <CleanNavbar />

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {user.username?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.username || 'User'}</h1>
              <p className="text-secondary font-mono text-sm break-all">
                {publicKey?.toString()}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="px-3 py-1 bg-success text-white text-sm rounded-full">
                  Reputation: {userStats?.reputation || 0}
                </span>
                <span className="text-secondary text-sm">
                  Rank: {userStats?.rank || 'Newcomer'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-3xl font-bold text-primary mb-2">
              {userStats?.totalPosts || 0}
            </div>
            <div className="text-secondary">Total Posts</div>
          </div>
          
          <div className="card">
            <div className="text-3xl font-bold text-success mb-2">
              {userStats?.totalStaked || 0}
            </div>
            <div className="text-secondary">ONU Staked</div>
          </div>
          
          <div className="card">
            <div className="text-3xl font-bold text-warning mb-2">
              {userStats?.totalEarned || 0}
            </div>
            <div className="text-secondary">ONU Earned</div>
          </div>
          
          <div className="card">
            <div className="text-3xl font-bold text-primary mb-2">
              {userStats?.reputation || 0}
            </div>
            <div className="text-secondary">Reputation</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/boards" className="btn btn-primary">
              📋 View Boards
            </Link>
            <Link href="/buy-onu" className="btn btn-success">
              💰 Buy ONU Tokens
            </Link>
            <Link href="/leaderboard" className="btn btn-secondary">
              🏆 View Leaderboard
            </Link>
          </div>
        </div>

        {/* Account Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Account Information</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-secondary">Username:</span>
              <span className="font-medium">{user.username || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-secondary">Wallet Address:</span>
              <span className="font-mono text-sm">{publicKey?.toString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-secondary">Member Since:</span>
              <span className="font-medium">{userStats?.joinedAt || 'Recently'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-secondary">Current Rank:</span>
              <span className="font-medium text-primary">{userStats?.rank || 'Newcomer'}</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
