import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../components/WalletAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Button from '../components/Button';
import PresenceBeacon from '../components/PresenceBeacon';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isConnecting } = useWalletAuth();
  
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Head>
        <title>OnusOne - The Network</title>
        <meta name="description" content="Enter the network" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <PresenceBeacon />
      
      {/* Clean Header */}
      <div>
        {isAuthenticated && (
          <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-4">
            <div className="container mx-auto flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">O</span>
                </div>
                <h1 className="text-xl font-semibold">OnusOne</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-300">
                  {user?.displayName || 'User'}
                </span>
                <Button 
                  onClick={handleLogout}
                  variant="secondary"
                  size="sm"
                >
                  Exit
                </Button>
              </div>
            </div>
          </header>
        )}
      </div>

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 fade-in-up">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 hover-lift">
              <span className="text-white font-bold text-3xl">O</span>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              OnusOne
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Simple messaging app.<br />
              <span className="text-mysterious">Connect wallet. Post messages. That's it.</span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <div className="space-y-4">
              {isAuthenticated ? (
                <>
                  <Button 
                    onClick={() => router.push('/boards')}
                    className="px-8 py-4 text-lg"
                  >
                    Enter
                  </Button>
                  <Button 
                    onClick={() => router.push('/topics')}
                    variant="secondary"
                    className="px-8 py-4 text-lg"
                  >
                    Explore
                  </Button>
                </>
              ) : (
                <>
                  <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !px-8 !py-4 !text-lg !rounded-xl" />
                  <p className="text-sm text-gray-400">
                    Connect to enter
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover-lift">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Simple</h3>
            <p className="text-gray-300 leading-relaxed">
              Basic messaging. No complex features. Just post and read.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover-lift">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Basic</h3>
            <p className="text-gray-300 leading-relaxed">
              Simple backend. Messages saved locally. No fancy stuff.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover-lift">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🌐</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Honest</h3>
            <p className="text-gray-300 leading-relaxed">
              No fake stats. No fake claims. Just messages.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-400">1</span>
              </div>
              <h3 className="font-semibold mb-2">Connect</h3>
              <p className="text-gray-400 text-sm">Link your wallet</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-400">2</span>
              </div>
              <h3 className="font-semibold mb-2">Enter</h3>
              <p className="text-gray-400 text-sm">Join the conversation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-400">3</span>
              </div>
              <h3 className="font-semibold mb-2">Create</h3>
              <p className="text-gray-400 text-sm">Share what matters</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-yellow-400">4</span>
              </div>
              <h3 className="font-semibold mb-2">Grow</h3>
              <p className="text-gray-400 text-sm">Build your presence</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {!isAuthenticated && (
          <div className="text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-12 rounded-3xl border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Ready?</h2>
            <p className="text-gray-300 mb-6">
              Ready to post some messages?
            </p>
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !px-8 !py-4 !text-lg !rounded-xl" />
          </div>
        )}
      </main>
    </div>
  );
}
