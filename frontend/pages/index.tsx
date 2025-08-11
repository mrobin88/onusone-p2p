import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../components/WalletAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Button from '../components/Button';
import PresenceBeacon from '../components/PresenceBeacon';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isConnecting, createGuestAccount, canPost } = useWalletAuth();
  
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleGuestEnter = () => {
    createGuestAccount();
    router.push('/boards');
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* 90s Style CSS */}
      <style jsx>{`
        .casino-bg {
          background: 
            linear-gradient(45deg, #000 25%, transparent 25%),
            linear-gradient(-45deg, #000 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #000 75%),
            linear-gradient(-45deg, transparent 75%, #000 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          background-color: #0a0a0a;
        }
        
        .casino-header {
          background: linear-gradient(90deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
          border-bottom: 3px solid #00ff00;
          box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
        }
        
        .horse-track-border {
          border: 2px solid #00ff00;
          border-radius: 8px;
          background: linear-gradient(90deg, #0a0a0a, #1a1a1a, #0a0a0a);
          box-shadow: 
            inset 0 0 20px rgba(0, 255, 0, 0.2),
            0 0 20px rgba(0, 255, 0, 0.3);
        }
        
        .dancing-skeleton {
          animation: dance 2s infinite;
        }
        
        @keyframes dance {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(5deg) scale(1.1); }
          50% { transform: rotate(0deg) scale(1); }
          75% { transform: rotate(-5deg) scale(0.9); }
        }
        
        .neon-glow {
          text-shadow: 
            0 0 5px #00ff00,
            0 0 10px #00ff00,
            0 0 15px #00ff00,
            0 0 20px #00ff00;
        }
        
        .casino-button {
          background: linear-gradient(45deg, #00ff00, #00cc00);
          border: 2px solid #00ff00;
          color: #000;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          padding: 12px 24px;
          border-radius: 8px;
        }
        
        .casino-button:hover {
          background: linear-gradient(45deg, #00cc00, #00ff00);
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
          transform: translateY(-2px);
        }
        
        .guest-button {
          background: linear-gradient(45deg, #ff6600, #cc5500);
          border: 2px solid #ff6600;
          color: #000;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          padding: 12px 24px;
          border-radius: 8px;
        }
        
        .guest-button:hover {
          background: linear-gradient(45deg, #cc5500, #ff6600);
          box-shadow: 0 0 20px rgba(255, 102, 0, 0.8);
          transform: translateY(-2px);
        }
        
        .checkered-pattern {
          background: 
            linear-gradient(45deg, #00ff00 25%, transparent 25%),
            linear-gradient(-45deg, #00ff00 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #00ff00 75%),
            linear-gradient(-45deg, transparent 75%, #00ff00 75%);
          background-size: 8px 8px;
          background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
          background-color: #0a0a0a;
        }
      `}</style>

      <Head>
        <title>🏇 OnusOne - The Network 🏇</title>
        <meta name="description" content="Enter the network - 90s neo-noir style" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <PresenceBeacon />
      
      {/* 90s Casino Header */}
      <div>
        {isAuthenticated && (
          <header className="casino-header p-4">
            <div className="container mx-auto flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-sm">O</span>
                </div>
                <h1 className="text-xl font-semibold neon-glow">🏇 ONUSONE 🏇</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-green-300">
                  👤 {user?.username || 'User'}
                </span>
                <Button 
                  onClick={handleLogout}
                  variant="secondary"
                  size="sm"
                  className="casino-button"
                >
                  🚪 EXIT
                </Button>
              </div>
            </div>
          </header>
        )}
      </div>

      <main className="casino-bg container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 fade-in-up">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 hover-lift">
              <span className="text-black font-bold text-3xl">🏇</span>
            </div>
            <h1 className="text-5xl font-bold mb-6 neon-glow text-green-400">
              🏇 ONUSONE 🏇
            </h1>
            <p className="text-xl text-green-300 mb-8 leading-relaxed">
              Simple messaging app.<br />
              <span className="text-green-400 font-bold">Connect wallet. Post messages. That's it.</span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <div className="space-y-4">
              {isAuthenticated ? (
                <>
                  <Button 
                    onClick={() => router.push('/boards')}
                    className="casino-button text-lg"
                  >
                    🏁 ENTER RACE TRACK
                  </Button>
                  <Button 
                    onClick={() => router.push('/topics')}
                    variant="secondary"
                    className="guest-button text-lg"
                  >
                    🎰 EXPLORE CASINO
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <WalletMultiButton className="casino-button text-lg" />
                    <p className="text-sm text-green-400">
                      🔗 Connect wallet to enter
                    </p>
                    
                    <div className="mt-6">
                      <p className="text-sm text-green-300 mb-3">🎭 OR ENTER AS GUEST</p>
                      <button 
                        onClick={handleGuestEnter}
                        className="guest-button text-lg"
                      >
                        👻 GUEST MODE
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="horse-track-border p-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">💀</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-green-400">Neo-Noir</h3>
            <p className="text-green-300 leading-relaxed">
              90s cyberpunk vibes. Dark themes. Green terminals. Dancing skeletons.
            </p>
          </div>
          
          <div className="horse-track-border p-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🏇</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-green-400">Horse Track</h3>
            <p className="text-green-300 leading-relaxed">
              Checkered patterns. Race track borders. Casino feels. Old school cool.
            </p>
          </div>
          
          <div className="horse-track-border p-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🎰</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-green-400">Casino</h3>
            <p className="text-green-300 leading-relaxed">
              Neon glows. Green buttons. Swanky vibes. No cheese, just style.
            </p>
          </div>
        </div>
        
        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-12 neon-glow text-green-400">🎭 HOW IT WORKS 🎭</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="horse-track-border p-6">
              <div className="text-4xl mb-4">👻</div>
              <h3 className="text-xl font-semibold mb-3 text-green-400">1. Enter</h3>
              <p className="text-green-300">Guest mode or wallet connect. Your choice.</p>
            </div>
            <div className="horse-track-border p-6">
              <div className="text-4xl mb-4">💀</div>
              <h3 className="text-xl font-semibold mb-3 text-green-400">2. Post</h3>
              <p className="text-green-300">Send messages. Join discussions. Be heard.</p>
            </div>
            <div className="horse-track-border p-6">
              <div className="text-4xl mb-4">🏇</div>
              <h3 className="text-xl font-semibold mb-3 text-green-400">3. Race</h3>
              <p className="text-green-300">Navigate boards. Explore topics. Win the race.</p>
            </div>
          </div>
        </div>
        
        {/* Dancing Skeletons Section */}
        <div className="text-center mb-16">
          <div className="horse-track-border p-8">
            <h2 className="text-2xl font-bold mb-6 neon-glow text-green-400">💀 DANCING SKELETONS 💀</h2>
            <div className="flex justify-center space-x-8 mb-6">
              <div className="dancing-skeleton text-6xl">💀</div>
              <div className="dancing-skeleton text-6xl" style={{animationDelay: '0.5s'}}>💀</div>
              <div className="dancing-skeleton text-6xl" style={{animationDelay: '1s'}}>💀</div>
            </div>
            <p className="text-green-300 text-lg">90s internet vibes. Neo-noir aesthetic. Pure swagger.</p>
          </div>
        </div>

        {/* Final CTA */}
        {!isAuthenticated && (
          <div className="text-center horse-track-border p-12">
            <h2 className="text-2xl font-bold mb-4 neon-glow text-green-400">🎭 READY TO RACE? 🎭</h2>
            <p className="text-green-300 mb-6">
              Enter the neo-noir world of OnusOne
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <WalletMultiButton className="casino-button text-lg" />
              <button 
                onClick={handleGuestEnter}
                className="guest-button text-lg"
              >
                👻 GUEST MODE
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
