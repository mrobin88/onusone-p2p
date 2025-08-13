import { useState, useEffect } from 'react';

interface Wallet {
  publicKey: { toString: () => string } | null;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = () => {
    // Simulate wallet connection for now
    const mockWallet = {
      publicKey: { toString: () => 'mock-wallet-address' }
    };
    setWallet(mockWallet);
    setIsConnected(true);
  };

  const disconnect = () => {
    setWallet(null);
    setIsConnected(false);
  };

  return {
    wallet,
    isConnected,
    connect,
    disconnect
  };
};
