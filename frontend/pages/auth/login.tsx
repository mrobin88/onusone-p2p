import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../../components/WalletAuth';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import Button from '../../components/Button';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useWalletAuth();
  const { setVisible } = useWalletModal();
  const { connected, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Auto-login when wallet connects
  React.useEffect(() => {
    if (connected && publicKey && !isAuthenticated) {
      handleWalletLogin();
    }
  }, [connected, publicKey, isAuthenticated]);

  const handleWalletLogin = async () => {
    if (!connected || !publicKey) return;
    
    setLoading(true);
    setError('');

    try {
      const success = await login();
      if (success) {
        router.push('/');
      } else {
        setError('Failed to authenticate wallet. Please try again.');
      }
    } catch (err) {
      setError('Wallet authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = () => {
    setVisible(true);
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Already Logged In</h1>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Login - OnusOne P2P</title>
        <meta name="description" content="Login to OnusOne P2P Network with your wallet" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to OnusOne</h1>
            <p className="text-gray-400">Connect your wallet to access the P2P Network</p>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🔐</div>
                <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
                <p className="text-gray-400 text-sm">Your wallet is your identity</p>
              </div>

              <Button
                onClick={handleConnectWallet}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                disabled={loading}
              >
                {loading ? 'Connecting...' : '🔗 Connect Wallet'}
              </Button>

              {error && (
                <div className="bg-red-900 border border-red-700 text-red-300 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-3">New to OnusOne?</p>
                  <Button
                    onClick={() => router.push('/auth/register')}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                onClick={() => router.push('/')}
                variant="secondary"
                size="sm"
              >
                Back to Home
              </Button>
            </div>
          </div>

          {/* Wallet connection status */}
          {connected && publicKey && (
            <div className="mt-4 bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-md text-center">
              <div className="flex items-center justify-center space-x-2">
                <span>✅</span>
                <span>Wallet Connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}</span>
              </div>
              {loading && (
                <div className="mt-2 text-sm">
                  Authenticating... Please wait.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}