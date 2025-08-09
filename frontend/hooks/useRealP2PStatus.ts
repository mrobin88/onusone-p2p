/**
 * Real P2P Status Hook - No fake data
 * Connects to actual running node or shows realistic offline state
 */

import { useState, useEffect } from 'react';

interface RealP2PStatus {
  isConnected: boolean;
  connectedPeers: number;
  networkHealth: 'excellent' | 'good' | 'poor' | 'offline';
  uptime: number;
  messagesTotal: number;
  lastSync: number;
}

export function useRealP2PStatus() {
  const [status, setStatus] = useState<RealP2PStatus>({
    isConnected: false,
    connectedPeers: 0,
    networkHealth: 'offline',
    uptime: 0,
    messagesTotal: 0,
    lastSync: 0
  });

  useEffect(() => {
    const checkNodeStatus = async () => {
      try {
        // Try to connect to real local node
        const response = await fetch('http://localhost:8888/health', {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus({
            isConnected: true,
            connectedPeers: data.connectedPeers || 0,
            networkHealth: data.networkHealth || 'good',
            uptime: data.uptime || 0,
            messagesTotal: data.messagesStored || 0,
            lastSync: Date.now()
          });
        } else {
          throw new Error('Node not responding');
        }
      } catch (error) {
        // Node not running - show realistic offline state
        setStatus({
          isConnected: false,
          connectedPeers: 0,
          networkHealth: 'offline',
          uptime: 0,
          messagesTotal: 0,
          lastSync: 0
        });
      }
    };

    // Check immediately
    checkNodeStatus();
    
    // Check every 10 seconds
    const interval = setInterval(checkNodeStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return status;
}
