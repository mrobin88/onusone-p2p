import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import Button from './Button';

interface WalletLinkerProps {
  onSuccess?: () => void;
  className?: string;
}

export default function WalletLinker({ onSuccess, className = '' }: WalletLinkerProps) {
  const { data: session } = useSession();
  const { publicKey, connected } = useWallet();
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleManualLink = async () => {
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/link-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: walletAddress.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Wallet linked successfully!');
        setWalletAddress('');
        onSuccess?.();
      } else {
        setError(data.error || 'Failed to link wallet');
      }
    } catch (err) {
      setError('Failed to link wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLink = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/link-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: publicKey.toString() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Wallet linked successfully!');
        onSuccess?.();
      } else {
        setError(data.error || 'Failed to link wallet');
      }
    } catch (err) {
      setError('Failed to link wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentWalletAddress = session?.user?.walletAddress;

  return (
    <div className={`bg-gray-900 p-6 rounded-lg border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Link Crypto Wallet</h3>
      
      {currentWalletAddress ? (
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">Currently linked wallet:</p>
          <div className="bg-gray-800 p-3 rounded border border-gray-600">
            <code className="text-green-400 text-sm break-all">{currentWalletAddress}</code>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-4">No wallet linked to your account</p>
      )}

      <div className="space-y-4">
        {/* Auto-link from connected wallet */}
        {connected && publicKey && (
          <div className="bg-blue-900/20 border border-blue-700 p-4 rounded">
            <p className="text-sm text-blue-300 mb-2">Connected wallet detected:</p>
            <code className="text-blue-400 text-sm break-all block mb-3">
              {publicKey.toString()}
            </code>
            <Button
              onClick={handleAutoLink}
              disabled={loading}
              className="w-full"
              variant="primary"
            >
              {loading ? 'Linking...' : 'Link Connected Wallet'}
            </Button>
          </div>
        )}

        {/* Manual wallet address entry */}
        <div className="space-y-3">
          <div>
            <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-300 mb-1">
              Or enter wallet address manually:
            </label>
            <input
              type="text"
              id="walletAddress"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter wallet address"
            />
          </div>
          <Button
            onClick={handleManualLink}
            disabled={loading || !walletAddress.trim()}
            className="w-full"
            variant="secondary"
          >
            {loading ? 'Linking...' : 'Link Manual Address'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-900 border border-red-700 text-red-300 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-900 border border-green-700 text-green-300 px-3 py-2 rounded-md text-sm">
          {success}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        <p>• Linking a wallet allows you to receive crypto rewards</p>
        <p>• You can only link one wallet per account</p>
        <p>• Wallet addresses are stored securely</p>
      </div>
    </div>
  );
}
