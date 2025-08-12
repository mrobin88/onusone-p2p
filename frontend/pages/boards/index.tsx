import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../../components/WalletAuth';
import CleanNavbar from '../../components/CleanNavbar';

interface Board {
  slug: string;
  name: string;
  description: string;
  category: string;
}

const boards: Board[] = [
  {
    slug: 'general',
    name: '📋 General Discussion',
    description: 'General chat and discussions',
    category: 'Community'
  },
  {
    slug: 'technology',
    name: '💻 Technology',
    description: 'Tech talk and development',
    category: 'Tech'
  },
  {
    slug: 'crypto',
    name: '₿ Cryptocurrency',
    description: 'Crypto and blockchain talk',
    category: 'Finance'
  },
  {
    slug: 'gaming',
    name: '🎮 Gaming',
    description: 'Gaming and entertainment',
    category: 'Entertainment'
  },
  {
    slug: 'art',
    name: '🎨 Art & Design',
    description: 'Creative arts and design',
    category: 'Creative'
  },
  {
    slug: 'music',
    name: '🎵 Music',
    description: 'Music and audio discussions',
    category: 'Audio'
  },
  {
    slug: 'dev',
    name: '⚡ Development',
    description: 'Development and coding discussions',
    category: 'Code'
  },
  {
    slug: 'trading',
    name: '📈 Trading',
    description: 'Trading and finance',
    category: 'Markets'
  },
  {
    slug: 'community',
    name: '👥 Community',
    description: 'Community topics and events',
    category: 'People'
  }
];

export default function BoardsIndex() {
  const router = useRouter();
  const { user, isAuthenticated } = useWalletAuth();

  if (!isAuthenticated) {
    return (
      <>
        <CleanNavbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="card max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-secondary mb-6">
              Please connect your wallet to view boards
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
        <title>Boards - OnusOne P2P</title>
        <meta name="description" content="Discussion boards" />
      </Head>

      <CleanNavbar />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-primary mb-6">
            Discussion Boards
          </h1>
          <p className="text-xl text-secondary max-w-3xl mx-auto">
            Choose a board to start participating in discussions, stake ONU tokens, 
            and earn rewards for quality content.
          </p>
        </div>

        {/* Boards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <div key={board.slug} className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="card-header">
                <h3 className="card-title">{board.name}</h3>
                <span className="inline-block px-2 py-1 bg-primary text-white text-xs rounded-full">
                  {board.category}
                </span>
              </div>
              <p className="text-secondary mb-4">{board.description}</p>
              <Link 
                href={`/boards/${board.slug}`}
                className="btn btn-primary w-full"
              >
                Enter Board
              </Link>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card mt-12">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/profile" className="btn btn-secondary">
              👤 View Profile
            </Link>
            <Link href="/buy-onu" className="btn btn-success">
              💰 Buy ONU Tokens
            </Link>
            <Link href="/leaderboard" className="btn btn-warning">
              🏆 Leaderboard
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}