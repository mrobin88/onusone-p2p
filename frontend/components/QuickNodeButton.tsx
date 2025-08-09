/**
 * Quick Node Button - One-click node setup for users
 * Shows in header when wallet is connected
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletAuth } from './WalletAuth';
import { EdgeNode, getEdgeNode, createEdgeNode } from '../lib/edge-node';

export default function QuickNodeButton() {
  const { connected, publicKey } = useWallet();
  const { user, isAuthenticated } = useWalletAuth();
  const [edgeNode, setEdgeNode] = useState<EdgeNode | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  // Initialize edge node when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      const node = getEdgeNode(publicKey.toString()) || createEdgeNode(publicKey.toString());
      setEdgeNode(node);
    }
  }, [connected, publicKey]);

  // Update node status
  useEffect(() => {
    if (edgeNode) {
      const interval = setInterval(() => {
        const status = edgeNode.getStatus();
        setIsRunning(status.isRunning);
        setEarnings(status.earnings.today);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [edgeNode]);

  const handleQuickStart = async () => {
    if (!edgeNode) return;
    
    setIsStarting(true);
    try {
      if (isRunning) {
        await edgeNode.stop();
      } else {
        await edgeNode.start();
      }
    } finally {
      setIsStarting(false);
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex items-center space-x-3">
      {/* Node Status Indicator */}
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400' : 'bg-gray-400'} animate-pulse`}></div>
        <span className="text-sm text-gray-400">
          {isRunning ? `+$${earnings.toFixed(2)}/day` : 'Node off'}
        </span>
      </div>

      {/* Quick Start Button */}
      <button
        onClick={handleQuickStart}
        disabled={isStarting}
        className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
          isRunning 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-green-600 hover:bg-green-700 text-white'
        } ${isStarting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isStarting ? '⏳' : isRunning ? '⏹️ Stop Node' : '▶️ Start Node & Earn'}
      </button>
    </div>
  );
}
