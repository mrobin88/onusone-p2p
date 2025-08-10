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
        <title>Register - OnusOne P2P</title>
        <meta name="description" content="Create your OnusOne P2P Network account with your wallet" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Join OnusOne</h1>
            <p className="text-gray-400">Connect your wallet to get started</p>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            {!showProfileSetup ? (
              // Wallet connection step
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">🚀</div>
                  <h2 className="text-xl font-semibold mb-2">Get Started with Your Wallet</h2>
                  <p className="text-gray-400 text-sm">No passwords needed - your wallet is your account</p>
                </div>

                <div className="bg-blue-900 border border-blue-700 p-4 rounded-lg">
                  <h3 className="text-blue-300 font-semibold mb-2">✨ What you'll get:</h3>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Instant account creation</li>
                    <li>• Secure wallet-based authentication</li>
                    <li>• Access to P2P network features</li>
                    <li>• Token rewards and staking</li>
                  </ul>
                </div>

                <Button
                  onClick={handleConnectWallet}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                  disabled={loading}
                >
                  {loading ? 'Connecting...' : '🔗 Connect Wallet & Create Account'}
                </Button>

                {error && (
                  <div className="bg-red-900 border border-red-700 text-red-300 px-3 py-2 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-3">Already have an account?</p>
                    <Button
                      onClick={() => router.push('/auth/login')}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Profile setup step
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <button
                    onClick={() => setShowProfileSetup(false)}
                    className="text-blue-400 hover:text-blue-300 text-sm mb-4"
                  >
                    ← Back to wallet connection
                  </button>
                  <h2 className="text-xl font-semibold mb-2">Complete Your Profile</h2>
                  <p className="text-gray-400 text-sm">Customize how others see you on the network</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="How should we call you?"
                      maxLength={30}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      This will be your public name on the network
                    </p>
                  </div>

                  <div>
                    <label htmlFor="bio" className="text-sm font-medium text-gray-300 mb-1">
                      Bio (Optional)
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell us a bit about yourself..."
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.bio.length}/200 characters
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  >
                    {loading ? 'Setting up...' : '🎉 Complete Setup'}
                  </Button>
                </form>

                <div className="bg-green-900 border border-green-700 p-3 rounded-lg text-center">
                  <p className="text-green-300 text-sm">
                    ✅ Wallet connected: {publicKey?.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                  </p>
                </div>
              </div>
            )}

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
          {connected && publicKey && !showProfileSetup && (
            <div className="mt-4 bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-md text-center">
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


