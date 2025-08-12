import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../../components/WalletAuth';
import ScribeLayout from '../../components/ScribeLayout';
import Button from '../../components/Button';
import '../../styles/industrial-punk.css';

interface Board {
  slug: string;
  name: string;
  description: string;
  category: string;
}

// 90s style boards with horse track categories
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
  const { user, isAuthenticated, logout } = useWalletAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen concrete-bg flex items-center justify-center">
        <div className="text-center">
          <div className="loading-industrial mx-auto mb-4"></div>
          <p className="industrial-text text-rust">LOADING...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Boards - OnusOne</title>
        <meta name="description" content="Discussion boards" />
      </Head>

      <ScribeLayout>
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="industrial-text text-rust text-5xl font-bold mb-6">
            BOARDS
          </h1>
          <p className="text-xl max-w-3xl mx-auto industrial-text">
            CHOOSE A BOARD. POST YOUR MESSAGES. SIMPLE AS THAT.
          </p>
        </div>

        {/* Boards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Link
              key={board.slug}
              href={`/boards/${board.slug}`}
              className="industrial-panel border-rusty p-6 block hover:glow-rust transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-rust mb-2 industrial-text">
                  {board.name}
                </h3>
                <span className="bg-rust text-concrete-darker px-3 py-1 rounded text-xs font-bold uppercase">
                  {board.category}
                </span>
              </div>
              
              <p className="text-secondary leading-relaxed mb-4">
                {board.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-rust text-sm font-bold industrial-text">
                  ENTER
                </span>
                <span className="text-metal text-lg">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-16 text-center">
          <div className="industrial-panel border-rusty p-8">
            <div className="text-center">
              <h3 className="industrial-text text-rust text-2xl font-bold mb-4">
                INDUSTRIAL P2P NETWORK
              </h3>
              <p className="industrial-text text-secondary">
                NO CORPORATE CONTROL. NO BRIGHT COLORS. JUST PURE INDUSTRIAL DECAY.
              </p>
            </div>
          </div>
        </div>
      </ScribeLayout>
    </>
  );
}