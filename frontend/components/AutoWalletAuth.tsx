/**
 * Auto Wallet Authentication Component
 * Automatically logs in users when they connect their wallet
 */

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { signIn, useSession } from 'next-auth/react';

export default function AutoWalletAuth() {
  const { connected, publicKey } = useWallet();
  const { data: session, status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const handleWalletAuth = async () => {
      // Only process if:
      // 1. Wallet is connected
      // 2. We have a public key
      // 3. User is not already authenticated
      // 4. We haven't already processed this connection
      // 5. Not currently processing
      if (!connected || !publicKey || status === 'authenticated' || hasProcessed || isProcessing) {
        return;
      }

      console.log('🔗 Wallet connected, attempting auto-authentication...');
      setIsProcessing(true);

      try {
        const walletAddress = publicKey.toString();
        
        // First, try to create account if it doesn't exist
        const registerResponse = await fetch('/api/auth/wallet-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            username: `User${walletAddress.slice(-6)}`,
            autoCreated: true
          })
        });

        if (!registerResponse.ok && registerResponse.status !== 200 && registerResponse.status !== 201) {
          const errorData = await registerResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create/verify wallet account');
        }

        // Now try to sign in with the wallet
        console.log('🔐 Signing in with wallet...');
        const signInResult = await signIn('wallet', {
          walletAddress,
          redirect: false
        });

        if (signInResult?.ok) {
          console.log(`✅ Auto-authenticated wallet: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`);
          setHasProcessed(true);
        } else {
          console.error('❌ Wallet sign-in failed:', signInResult?.error);
        }

      } catch (error) {
        console.error('❌ Auto wallet auth failed:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    handleWalletAuth();
  }, [connected, publicKey, status, hasProcessed, isProcessing]);

  // Reset processed flag when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setHasProcessed(false);
      setIsProcessing(false);
    }
  }, [connected]);

  // Show processing indicator
  if (isProcessing && connected && !session) {
    return (
      <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Authenticating wallet...</span>
        </div>
      </div>
    );
  }

  // Show success indicator
  if (connected && session && hasProcessed) {
    return (
      <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-500">
        <div className="flex items-center space-x-2">
          <span>✅ Wallet authenticated!</span>
        </div>
      </div>
    );
  }

  return null;
}
