import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../../components/WalletAuth';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import Button from '../../components/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useWalletAuth();
  const { setVisible } = useWalletModal();
  const { connected, publicKey } = useWallet();
  const [formData, setFormData] = useState({
    displayName: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProfileSetup, setShowProfileSetup] = useState(false);

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
        // Show profile setup for new users
        setShowProfileSetup(true);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Profile setup would go here - for now just redirect
      // In a real implementation, you'd save the profile data
      router.push('/');
    } catch (err) {
      setError('Profile setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <title>Join OnusOne</title>
        <meta name="description" content="Create your OnusOne account with your wallet" />
      </Head>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">O</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Join OnusOne</h1>
            <p className="text-gray-400">Connect your wallet to get started</p>
          </div>

          {/* Main Card */}
          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 shadow-xl">
            {!showProfileSetup ? (
              // Wallet connection step
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">🚀</div>
                  <h2 className="text-xl font-semibold mb-2">Get Started with Your Wallet</h2>
                  <p className="text-gray-400 text-sm">No passwords needed - your wallet is your account</p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                  <h3 className="text-blue-300 font-semibold mb-2">✨ What you'll get:</h3>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Instant account creation</li>
                    <li>• Secure wallet-based authentication</li>
                    <li>• Access to decentralized features</li>
                    <li>• Token rewards and staking</li>
                  </ul>
                </div>

                <Button
                  onClick={handleConnectWallet}
                  className="w-full py-4 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Connecting...' : '🔗 Connect Wallet & Create Account'}
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
                    <span className="px-2 bg-black text-gray-400">Already have an account?</span>
                  </div>
                </div>

                <Button
                  onClick={() => router.push('/auth/login')}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              // Profile setup step
              <div className="space-y-6">
                <div className="text-center">
                  <button
                    onClick={() => setShowProfileSetup(false)}
                    className="text-blue-400 hover:text-blue-300 text-sm mb-4 flex items-center justify-center"
                  >
                    ← Back to wallet connection
                  </button>
                  <h2 className="text-xl font-semibold mb-2">Complete Your Profile</h2>
                  <p className="text-gray-400 text-sm">Customize how others see you on the network</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="How should we call you?"
                      maxLength={30}
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      This will be your public name on the network
                    </p>
                  </div>

                  <div>
                    <label htmlFor="bio" className="text-sm font-medium text-gray-300 mb-2">
                      Bio (Optional)
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Tell us a bit about yourself..."
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      {formData.bio.length}/200 characters
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    {loading ? 'Setting up...' : '🎉 Complete Setup'}
                  </Button>
                </form>

                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-center">
                  <p className="text-green-300 text-sm">
                    ✅ Wallet connected: {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                  </p>
                </div>
              </div>
            )}
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
          {connected && publicKey && !showProfileSetup && (
            <div className="mt-6 bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3 rounded-xl text-center">
              <div className="flex items-center justify-center space-x-2">
                <span>✅</span>
                <span>Wallet Connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}</span>
              </div>
              {loading && (
                <div className="mt-2 text-sm">
                  Creating account... Please wait.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


