/**
 * Auto Wallet Authentication Component
 * Automatically logs in users when they connect their wallet
 * Uses the new WalletAuth system instead of NextAuth
 */

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletAuth } from './WalletAuth';

export default function AutoWalletAuth() {
  const { connected, publicKey } = useWallet();
  const { isAuthenticated, login } = useWalletAuth();
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
      if (!connected || !publicKey || isAuthenticated || hasProcessed || isProcessing) {
        return;
      }

      console.log('🔗 Wallet connected, attempting auto-authentication...');
      setIsProcessing(true);

      try {
        // Use the WalletAuth system to authenticate
        const success = await login();
        
        if (success) {
          console.log(`✅ Auto-authenticated wallet: ${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-4)}`);
          setHasProcessed(true);
        } else {
          console.error('❌ Wallet authentication failed');
        }

      } catch (error) {
        console.error('❌ Auto wallet auth failed:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    handleWalletAuth();
  }, [connected, publicKey, isAuthenticated, hasProcessed, isProcessing, login]);

  // Reset processed flag when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setHasProcessed(false);
      setIsProcessing(false);
    }
  }, [connected]);

  // Show processing indicator
  if (isProcessing && connected && !isAuthenticated) {
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
  if (connected && isAuthenticated && hasProcessed) {
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
