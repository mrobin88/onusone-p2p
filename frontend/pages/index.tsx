import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../components/WalletAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Button from '../components/Button';


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
    <div className="min-h-screen concrete-bg dirty-overlay">
      <Head>
        <title>ONUSONE P2P - INDUSTRIAL NETWORK</title>
        <meta name="description" content="Industrial punk P2P messaging network" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Industrial Header */}
      <header className="industrial-header">
        <div className="flex items-center space-x-6">
          <h1 className="industrial-title industrial-text">ONUSONE P2P</h1>
          <div className="flex items-center space-x-2 text-sm">
            <div className="status-indicator status-online"></div>
            <span className="industrial-text">INDUSTRIAL NETWORK</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="industrial-text">WELCOME, {user?.username?.toUpperCase()}</span>
              <button onClick={handleLogout} className="btn-industrial">
                LOGOUT
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <WalletMultiButton />
              <button onClick={handleGuestEnter} className="btn-industrial btn-rusty">
                GUEST ENTER
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="industrial-container">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="industrial-text text-rust text-6xl font-bold mb-8">
            INDUSTRIAL P2P NETWORK
          </h1>
          <p className="text-2xl max-w-4xl mx-auto leading-relaxed industrial-text mb-8">
            P2P MESSAGING. INDUSTRIAL AESTHETIC. NO CORPORATE BULLSHIT.
          </p>
          <div className="flex justify-center space-x-6">
            {!isAuthenticated && (
              <>
                <button onClick={handleGuestEnter} className="btn-industrial btn-rusty text-lg px-8 py-4">
                  ENTER AS GUEST
                </button>
                <button 
                  onClick={() => router.push('/auth/login')} 
                  className="btn-industrial text-lg px-8 py-4"
                >
                  CONNECT WALLET
                </button>
              </>
            )}
            {isAuthenticated && (
              <button 
                onClick={() => router.push('/boards')} 
                className="btn-industrial btn-rusty text-lg px-8 py-4"
              >
                ENTER NETWORK
              </button>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid-industrial grid-3 gap-8 mb-16">
          <div className="industrial-panel border-rusty">
            <div className="panel-header">
              <span className="mr-3">🌐</span>
              P2P MESSAGING
            </div>
            <p className="industrial-text">
              DIRECT P2P COMMUNICATION. NO CENTRAL SERVERS.
            </p>
          </div>

          <div className="industrial-panel border-rusty">
            <div className="panel-header">
              <span className="mr-3">🏭</span>
              INDUSTRIAL AESTHETIC
            </div>
            <p className="industrial-text">
              CONCRETE, RUST, METAL. NO BRIGHT COLORS.
            </p>
          </div>

          <div className="industrial-panel border-rusty">
            <div className="panel-header">
              <span className="mr-3">🔒</span>
              DECENTRALIZED
            </div>
            <p className="industrial-text">
              NO CORPORATE CONTROL. NO CENSORSHIP.
            </p>
          </div>
        </div>

        {/* Network Stats */}
        <div className="industrial-panel border-rusty">
          <div className="panel-header">
            <span className="mr-3">📊</span>
            NETWORK STATUS
          </div>
          <div className="grid-industrial grid-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-rust industrial-text">ACTIVE</div>
              <div className="text-sm">NETWORK STATUS</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-metal industrial-text">P2P</div>
              <div className="text-sm">PROTOCOL</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-concrete industrial-text">INDUSTRIAL</div>
              <div className="text-sm">AESTHETIC</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-rust industrial-text">READY</div>
              <div className="text-sm">FOR USE</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="industrial-text text-metal text-3xl font-bold mb-6">
            READY TO ENTER THE INDUSTRIAL NETWORK?
          </h2>
          <p className="text-xl industrial-text mb-8">
            JOIN THE P2P NETWORK. NO ALGORITHMS.
          </p>
          <div className="flex justify-center space-x-6">
            <button onClick={handleGuestEnter} className="btn-industrial btn-rusty text-lg px-8 py-4">
              START MESSAGING
            </button>
            <button 
              onClick={() => router.push('/p2p-demo')} 
              className="btn-industrial text-lg px-8 py-4"
            >
              VIEW DEMO
            </button>
          </div>
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="industrial-header mt-16">
        <div className="text-center">
          <p className="industrial-text text-sm">
            ONUSONE P2P - INDUSTRIAL DECENTRALIZED NETWORK
          </p>
          <p className="text-xs text-secondary mt-2">
            NO CORPORATE CONTROL. NO BRIGHT COLORS. JUST PURE INDUSTRIAL P2P.
          </p>
        </div>
      </footer>
    </div>
  );
}
