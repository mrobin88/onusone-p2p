import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../../components/WalletAuth';
import ScribeLayout from '../../components/ScribeLayout';
import Button from '../../components/Button';

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
    description: 'General chat and discussions - the starting gate',
    category: '🏁 Community'
  },
  {
    slug: 'technology',
    name: '💻 Technology',
    description: 'Tech talk and development - the digital race track',
    category: '⚡ Tech'
  },
  {
    slug: 'crypto',
    name: '₿ Cryptocurrency',
    description: 'Crypto and blockchain talk - the money race',
    category: '💰 Finance'
  },
  {
    slug: 'gaming',
    name: '🎮 Gaming',
    description: 'Gaming and entertainment - the fun track',
    category: '🎰 Entertainment'
  },
  {
    slug: 'art',
    name: '🎨 Art & Design',
    description: 'Creative arts and design - the beauty track',
    category: '🎭 Creative'
  },
  {
    slug: 'music',
    name: '🎵 Music',
    description: 'Music and audio discussions - the sound track',
    category: '🎶 Audio'
  },
  {
    slug: 'dev',
    name: '⚡ Development',
    description: 'Development and coding discussions - the code track',
    category: '💻 Code'
  },
  {
    slug: 'trading',
    name: '📈 Trading',
    description: 'Trading and finance - the profit track',
    category: '📊 Markets'
  },
  {
    slug: 'community',
    name: '👥 Community',
    description: 'Community topics and events - the people track',
    category: '🏘️ People'
  }
];

export default function BoardsIndex() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useWalletAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>🏇 Race Tracks - OnusOne</title>
        <meta name="description" content="90s neo-noir discussion boards" />
      </Head>

      <ScribeLayout>
        {/* 90s Style CSS */}
        <style jsx>{`
          .board-card {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            border: 2px solid #00ff00;
            border-radius: 12px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .board-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #00ff00, #00cc00, #00ff00);
            transform: scaleX(0);
            transition: transform 0.3s ease;
          }
          
          .board-card:hover::before {
            transform: scaleX(1);
          }
          
          .board-card:hover {
            border-color: #00cc00;
            box-shadow: 
              0 0 20px rgba(0, 255, 0, 0.3),
              0 8px 25px rgba(0, 0, 0, 0.8);
            transform: translateY(-4px);
          }
          
          .category-badge {
            background: linear-gradient(45deg, #00ff00, #00cc00);
            color: #000;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .neon-glow {
            text-shadow: 
              0 0 5px #00ff00,
              0 0 10px #00ff00,
              0 0 15px #00ff00;
          }
        `}</style>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 neon-glow text-green-400">
            🏇 RACE TRACKS 🏇
          </h1>
          <p className="text-xl text-green-300 max-w-3xl mx-auto">
            Choose your track. Post your messages. Win the race. Simple as that.
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <span className="dancing-skeleton text-2xl">💀</span>
            <span className="text-green-400 text-sm">90s neo-noir vibes</span>
            <span className="dancing-skeleton text-2xl">💀</span>
          </div>
        </div>

        {/* Boards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Link
              key={board.slug}
              href={`/boards/${board.slug}`}
              className="board-card p-6 block"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-green-400 mb-2">
                  {board.name}
                </h3>
                <span className="category-badge">
                  {board.category}
                </span>
              </div>
              
              <p className="text-green-300 leading-relaxed mb-4">
                {board.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-green-400 text-sm font-bold">
                  🏁 ENTER TRACK
                </span>
                <span className="text-green-300 text-lg">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-16 text-center">
          <div className="horse-track-border p-8">
            <h2 className="text-2xl font-bold mb-4 neon-glow text-green-400">
              🎰 READY TO RACE? 🎰
            </h2>
            <p className="text-green-300 mb-6">
              Pick a track and start posting. The system works if messages stick.
            </p>
            <div className="flex justify-center space-x-4">
              <span className="dancing-skeleton text-4xl">💀</span>
              <span className="dancing-skeleton text-4xl" style={{animationDelay: '0.5s'}}>💀</span>
              <span className="dancing-skeleton text-4xl" style={{animationDelay: '1s'}}>💀</span>
            </div>
          </div>
        </div>
      </ScribeLayout>
    </>
  );
}