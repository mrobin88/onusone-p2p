import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWalletAuth } from '../components/WalletAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Button from '../components/Button';

const BuyOnuPage: React.FC = () => {
  const { user, isAuthenticated } = useWalletAuth();
  const [selectedPackage, setSelectedPackage] = useState('basic');
  const [loading, setLoading] = useState(false);

  const packages = [
    {
      id: 'basic',
      name: 'Starter Pack',
      onuAmount: 50,
      usdPrice: 25,
      description: 'Perfect for getting started with time capsules'
    },
    {
      id: 'premium',
      name: 'Premium Pack',
      onuAmount: 200,
      usdPrice: 100,
      description: 'Great for serious time capsule creators'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Pack',
      onuAmount: 500,
      usdPrice: 250,
      description: 'For power users and high-volume creators'
    }
  ];

  const handlePurchase = async () => {
    if (!isAuthenticated || !user?.walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-onu-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage,
          onuAmount: packages.find(p => p.id === selectedPackage)?.onuAmount,
          walletAddress: user.walletAddress
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        const error = await response.json();
        alert(`Purchase failed: ${error.message}`);
      }
    } catch (error) {
      alert('Failed to create purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Buy ONU Tokens - OnusOne</title>
        <meta name="description" content="Purchase ONU tokens for time capsules and network participation" />
      </Head>

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-400">
            ← Back to Network
          </Link>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <span className="text-gray-300">Welcome, {user?.username}</span>
            ) : (
              <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Buy ONU Tokens</h1>
            <p className="text-xl text-gray-300">
              Purchase ONU tokens to create premium time capsules and participate in the network
            </p>
          </div>

          {/* Token Packages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-gray-900 border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPackage === pkg.id
                    ? 'border-blue-500 bg-gray-800'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {pkg.onuAmount} ONU
                  </div>
                  <div className="text-2xl font-bold text-green-400 mb-4">
                    ${pkg.usdPrice}
                  </div>
                  <p className="text-gray-400 mb-4">{pkg.description}</p>
                  <div className="text-sm text-gray-500">
                    ${(pkg.usdPrice / pkg.onuAmount).toFixed(2)} per ONU
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Purchase Section */}
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-6">Ready to Purchase?</h2>
            
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="text-lg text-gray-300">
                  Selected: <span className="text-blue-400 font-bold">
                    {packages.find(p => p.id === selectedPackage)?.onuAmount} ONU
                  </span> for{' '}
                  <span className="text-green-400 font-bold">
                    ${packages.find(p => p.id === selectedPackage)?.usdPrice}
                  </span>
                </div>
                
                <Button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="text-lg px-8 py-4"
                >
                  {loading ? 'Processing...' : 'Purchase ONU Tokens'}
                </Button>
                
                <p className="text-sm text-gray-500">
                  You'll be redirected to Stripe to complete your payment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-400">Connect your wallet to purchase ONU tokens</p>
                <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !text-lg !px-8 !py-4" />
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4 text-blue-400">What are ONU Tokens?</h3>
              <p className="text-gray-300">
                ONU tokens are the native currency of the OnusOne network. Use them to create 
                premium time capsules, stake on content, and participate in network governance.
              </p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4 text-green-400">How to Use ONU</h3>
              <p className="text-gray-300">
                After purchase, ONU tokens will be sent to your connected wallet. You can then 
                use them to create time capsules with custom unlock dates and premium features.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuyOnuPage;
