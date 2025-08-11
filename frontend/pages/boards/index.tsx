import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../../components/WalletAuth';
import Button from '../../components/Button';

interface Board {
  slug: string;
  name: string;
  description: string;
}

// Simple, honest boards - no fake stats
const boards: Board[] = [
  {
    slug: 'general',
    name: 'General Discussion',
    description: 'General chat and discussions'
  },
  {
    slug: 'technology',
    name: 'Technology',
    description: 'Tech talk and development'
  },
  {
    slug: 'community',
    name: 'Community',
    description: 'Community topics and events'
  },
  {
    slug: 'dev',
    name: 'Development',
    description: 'Development and coding discussions'
  }
];

export default function BoardsIndex() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useWalletAuth();

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
        <title>Discussion Boards - OnusOne</title>
        <meta name="description" content="Simple discussion boards" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-2xl font-bold text-white">
                  OnusOne
                </Link>
                <nav className="flex space-x-4">
                  <span className="text-blue-400 px-3 py-2 rounded-md text-sm font-medium">
                    Boards
                  </span>
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
          {/* Simple Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-white">
              Discussion Boards
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Simple message boards. Add messages if they stick, the system works.
            </p>
          </div>

          {/* Boards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <Link
                key={board.slug}
                href={`/boards/${board.slug}`}
                className="group bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-500/50 transition-all duration-200 hover:bg-gray-800"
              >
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {board.name}
                </h3>
                
                <p className="text-gray-400 text-sm mb-4">
                  {board.description}
                </p>
                
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <span className="text-blue-400 text-sm group-hover:text-blue-300">
                    Join Discussion →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Simple Info */}
          <div className="mt-12 bg-gray-900 rounded-xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
            <div className="text-center text-gray-400">
              <p>Connect your wallet. Post messages. If they stick, the system works.</p>
              <p className="mt-2">No fake stats. No fake claims. Just messages.</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}