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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">O</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Already Logged In</h1>
          <p className="text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Head>
        <title>Login - OnusOne</title>
        <meta name="description" content="Connect your wallet to OnusOne" />
      </Head>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">O</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-400">Connect your wallet to continue</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 shadow-xl">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🔐</div>
                <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
                <p className="text-gray-400 text-sm">Your wallet is your identity on OnusOne</p>
              </div>

              <Button
                onClick={handleConnectWallet}
                className="w-full py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? 'Connecting...' : '🔗 Connect Wallet'}
              </Button>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-black text-gray-400">New to OnusOne?</span>
                </div>
              </div>

              <Button
                onClick={() => router.push('/auth/register')}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Create Account
              </Button>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Button
              onClick={() => router.push('/')}
              variant="secondary"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              ← Back to Home
            </Button>
          </div>

          {/* Wallet Status */}
          {connected && publicKey && (
            <div className="mt-6 bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3 rounded-xl text-center">
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