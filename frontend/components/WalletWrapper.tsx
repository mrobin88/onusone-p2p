import React, { useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

interface WalletWrapperProps {
  children: React.ReactNode;
}

// Fallback component that renders without wallet functionality
function FallbackWalletWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header with wallet installation prompt */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">OnusOne P2P</h1>
          <div className="text-center">
            <p className="text-yellow-400 text-sm mb-2">⚠️ Wallet Not Available</p>
            <p className="text-gray-300 text-xs mb-2">Install Phantom to earn ONU tokens from posts</p>
            <a 
              href="https://phantom.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Install Phantom Wallet
            </a>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

export default function WalletWrapper({ children }: WalletWrapperProps) {
  const [walletState, setWalletState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    let mounted = true;
    
    const initializeWallet = async () => {
      try {
        // Wait for React to be fully ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!mounted) return;
        
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          setWalletState('failed');
          return;
        }
        
        // Check if wallet adapters are available
        if (!(window as any).solana && !(window as any).phantom?.solana) {
          console.warn('No Solana wallet detected');
          setWalletState('failed');
          return;
        }
        
        setWalletState('ready');
        
      } catch (error) {
        console.warn('Wallet initialization failed, using fallback:', error);
        if (mounted) {
          setWalletState('failed');
        }
      }
    };

    initializeWallet();
    
    // Fallback timeout to prevent infinite loading
    const fallbackTimer = setTimeout(() => {
      if (mounted && walletState === 'loading') {
        console.warn('Wallet initialization timeout, using fallback');
        setWalletState('failed');
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [walletState]);

  // Show loading state
  if (walletState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Initializing wallet...</p>
          <p className="text-sm text-gray-400 mt-2">Setting up your Solana connection for ONU token rewards</p>
        </div>
      </div>
    );
  }

  // Show wallet components if ready
  if (walletState === 'ready') {
    const endpoint = process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY 
      ? `https://solana-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY}`
      : 'https://api.mainnet-beta.solana.com';

    const wallets = [new PhantomWalletAdapter()];

    return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    );
  }

  // Show fallback if wallet failed
  return <FallbackWalletWrapper>{children}</FallbackWalletWrapper>;
}
