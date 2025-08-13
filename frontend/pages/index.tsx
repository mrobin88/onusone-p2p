import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWalletAuth } from '../components/WalletAuth';
import CleanNavbar from '../components/CleanNavbar';

export default function Home() {
  const { user, isAuthenticated } = useWalletAuth();

  return (
    <>
      <Head>
        <title>ONUSONE P2P - Decentralized Social Trading</title>
        <meta name="description" content="Decentralized P2P messaging with ONU token economics, staking, and rewards" />
      </Head>

      <CleanNavbar />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold text-primary mb-6">
            ONUSONE P2P Network
          </h1>
          <p className="text-xl text-secondary max-w-3xl mx-auto mb-8">
            Decentralized messaging platform with integrated ONU token economics. 
            Stake tokens, earn rewards, and participate in the future of social trading.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/capsules" className="btn btn-primary text-lg px-8 py-4">
              Time Capsules
            </Link>
            <Link href="/buy-onu" className="btn btn-secondary text-lg px-8 py-4">
              Buy ONU Tokens
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🌐 P2P Messaging</h3>
            </div>
            <p className="text-secondary">
              Direct peer-to-peer communication with no central servers. 
              Your messages are stored on IPFS and replicated across the network.
            </p>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">💰 Token Economics</h3>
            </div>
            <p className="text-secondary">
              Stake ONU tokens on quality content, earn rewards, and participate 
              in the network's economic ecosystem.
            </p>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🔒 Decentralized</h3>
            </div>
            <p className="text-secondary">
              Built on blockchain technology with no corporate control. 
              True ownership of your data and communication.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="card mb-16">
          <div className="card-header">
            <h2 className="card-title">Network Statistics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">Active</div>
              <div className="text-secondary">Network Status</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success">P2P</div>
              <div className="text-secondary">Protocol</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning">ONU</div>
              <div className="text-secondary">Token</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">Ready</div>
              <div className="text-secondary">For Use</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-6">
            Ready to Join the Network?
          </h2>
          <p className="text-lg text-secondary mb-8">
            Connect your wallet and start participating in the decentralized future.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/capsules" className="btn btn-primary text-lg px-8 py-4">
              Explore Capsules
            </Link>
            <Link href="/profile" className="btn btn-secondary text-lg px-8 py-4">
              View Profile
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
