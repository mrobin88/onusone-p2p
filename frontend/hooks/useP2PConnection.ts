import { useState, useEffect, useCallback } from 'react';
import { getP2PClient, P2PClient, NetworkStatus, PeerInfo, P2PMessageType } from '../lib/p2p-client';

// Import P2P config to check max attempts
const P2P_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 10,
};

interface P2PConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  networkStatus: NetworkStatus | null;
  peers: PeerInfo[];
  connectionError: string | null;
  reconnectAttempts: number;
}

interface UseP2PConnectionOptions {
  autoConnect?: boolean;
  userId?: string;
  board?: string;
}

/**
 * React hook for P2P networking functionality
 * Manages connection state, network status, and real-time updates
 */
export function useP2PConnection(options: UseP2PConnectionOptions = {}) {
  const { autoConnect = true, userId, board } = options;
  
  const [state, setState] = useState<P2PConnectionState>({
    isConnected: false,
    isConnecting: false,
    networkStatus: null,
    peers: [],
    connectionError: null,
    reconnectAttempts: 0,
  });

  const [client] = useState<P2PClient>(() => getP2PClient());

  // Connect to P2P network
  const connect = useCallback(async (connectUserId?: string) => {
    const targetUserId = connectUserId || userId;
    if (!targetUserId) {
      setState(prev => ({ 
        ...prev, 
        connectionError: 'User ID required for P2P connection' 
      }));
      return false;
    }

    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      connectionError: null 
    }));

    try {
      await client.connect(targetUserId);
      
      // Subscribe to board if specified
      if (board) {
        await client.subscribeToBoard(board);
      }
      
      return true;
    } catch (error) {
      console.error('P2P connection failed:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        connectionError: error instanceof Error ? error.message : 'Connection failed'
      }));
      return false;
    }
  }, [client, userId, board]);

  // Disconnect from P2P network
  const disconnect = useCallback(() => {
    client.disconnect();
  }, [client]);

  // Broadcast message to P2P network
  const broadcastMessage = useCallback(async (content: any, type: P2PMessageType = P2PMessageType.POST_CREATE) => {
    if (!state.isConnected || !userId) {
      console.warn('Cannot broadcast: not connected to P2P network');
      return false;
    }

    return await client.broadcastMessage({
      type,
      author: userId,
      content,
      board
    });
  }, [client, state.isConnected, userId, board]);

  // Refresh network status and peers
  const refreshNetworkInfo = useCallback(async () => {
    try {
      const [networkStatus, peers] = await Promise.all([
        client.getNetworkStatus(),
        client.getPeers()
      ]);

      setState(prev => ({
        ...prev,
        networkStatus,
        peers
      }));
    } catch (error) {
      console.error('Failed to refresh network info:', error);
    }
  }, [client]);

  // Setup event listeners
  useEffect(() => {
    const handleConnected = (data: any) => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        networkStatus: data.networkStatus,
        connectionError: null,
        reconnectAttempts: 0
      }));
    };

    const handleDisconnected = () => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false
      }));
    };

    const handleConnectionError = (error: any) => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionError: error.message || 'Connection error'
      }));
    };

    const handleConnectionFailed = () => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionError: 'P2P node not available (running in offline mode)',
        reconnectAttempts: P2P_CONFIG.MAX_RECONNECT_ATTEMPTS // Stop further attempts
      }));
    };

    const handleNetworkStatus = (status: NetworkStatus) => {
      setState(prev => ({
        ...prev,
        networkStatus: status
      }));
    };

    const handlePeerJoined = (peer: PeerInfo) => {
      setState(prev => ({
        ...prev,
        peers: [...prev.peers.filter(p => p.id !== peer.id), peer]
      }));
    };

    const handlePeerLeft = (peer: PeerInfo) => {
      setState(prev => ({
        ...prev,
        peers: prev.peers.filter(p => p.id !== peer.id)
      }));
    };

    // Register event listeners
    client.on('connected', handleConnected);
    client.on('disconnected', handleDisconnected);
    client.on('connection_error', handleConnectionError);
    client.on('connection_failed', handleConnectionFailed);
    client.on('network_status', handleNetworkStatus);
    client.on('peer_joined', handlePeerJoined);
    client.on('peer_left', handlePeerLeft);

    // Cleanup
    return () => {
      client.off('connected', handleConnected);
      client.off('disconnected', handleDisconnected);
      client.off('connection_error', handleConnectionError);
      client.off('connection_failed', handleConnectionFailed);
      client.off('network_status', handleNetworkStatus);
      client.off('peer_joined', handlePeerJoined);
      client.off('peer_left', handlePeerLeft);
    };
  }, [client]);

  // Auto-connect when userId is available (only if autoConnect is true)
  useEffect(() => {
    if (autoConnect && userId && !state.isConnected && !state.isConnecting && state.reconnectAttempts === 0) {
      connect(userId);
    }
  }, [autoConnect, userId, state.isConnected, state.isConnecting, state.reconnectAttempts, connect]);

  // Periodic network info refresh
  useEffect(() => {
    if (state.isConnected) {
      refreshNetworkInfo();
      
      const interval = setInterval(refreshNetworkInfo, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [state.isConnected, refreshNetworkInfo]);

  // Get connection status from client
  const getConnectionStatus = useCallback(() => {
    return client.getConnectionStatus();
  }, [client]);

  return {
    // Connection state
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    connectionError: state.connectionError,
    reconnectAttempts: state.reconnectAttempts,
    
    // Network data
    networkStatus: state.networkStatus,
    peers: state.peers,
    
    // Actions
    connect,
    disconnect,
    broadcastMessage,
    refreshNetworkInfo,
    getConnectionStatus,
    
    // Derived state
    peerCount: state.peers.length,
    isHealthy: state.networkStatus?.networkHealth === 'excellent',
    nodeId: state.networkStatus?.nodeId,
    uptime: state.networkStatus?.uptime || 0,
  };
}

export default useP2PConnection;
