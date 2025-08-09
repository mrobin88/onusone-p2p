import React, { useState } from 'react';
import { useP2PConnection } from '../hooks/useP2PConnection';
import { useWalletAuth } from './WalletAuth';
import Button from './Button';

interface P2PNetworkStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  board?: string;
}

export default function P2PNetworkStatus({ 
  showDetails = false, 
  compact = false,
  board 
}: P2PNetworkStatusProps) {
  const { user } = useWalletAuth();
  const {
    isConnected,
    isConnecting,
    connectionError,
    networkStatus,
    peers,
    connect,
    disconnect,
    refreshNetworkInfo,
    peerCount,
    isHealthy,
    nodeId,
    uptime
  } = useP2PConnection({
    autoConnect: true,
    userId: user?.id,
    board
  });

  const [showPeerList, setShowPeerList] = useState(false);

  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getConnectionStatusColor = () => {
    if (isConnecting) return 'text-yellow-400';
    if (isConnected && isHealthy) return 'text-green-400';
    if (isConnected) return 'text-orange-400';
    return 'text-red-400';
  };

  const getConnectionStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected && isHealthy) return 'Connected';
    if (isConnected) return 'Connected (Limited)';
    if (connectionError) return 'Connection Failed';
    return 'Disconnected';
  };

  const getConnectionIcon = () => {
    if (isConnecting) return '🔄';
    if (isConnected && isHealthy) return '🟢';
    if (isConnected) return '🟡';
    return '🔴';
  };

  // Compact view for sidebars and small spaces
  if (compact) {
    return (
      <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getConnectionIcon()}</span>
            <div>
              <div className="text-sm font-medium text-white">P2P Network</div>
              <div className={`text-xs ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-blue-400">{peerCount}</div>
            <div className="text-xs text-gray-400">peers</div>
          </div>
        </div>
        
        {connectionError && (
          <div className="mt-2 text-xs text-red-400">
            {connectionError}
          </div>
        )}
      </div>
    );
  }

  // Full view for dedicated P2P status sections
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <span>{getConnectionIcon()}</span>
          <span>P2P Network Status</span>
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            onClick={refreshNetworkInfo}
            size="sm"
            variant="secondary"
            disabled={isConnecting}
          >
            🔄 Refresh
          </Button>
          {isConnected ? (
            <Button
              onClick={disconnect}
              size="sm"
              variant="secondary"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={() => user?.id && connect(user.id)}
              size="sm"
              variant="primary"
              disabled={isConnecting || !user?.id}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className={`text-lg font-semibold ${getConnectionStatusColor()}`}>
            {getConnectionStatusText()}
          </div>
          <div className="text-xs text-gray-400">Status</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-400">{peerCount}</div>
          <div className="text-xs text-gray-400">Connected Peers</div>
        </div>
        
        {networkStatus && (
          <>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-400">
                {networkStatus.messagesSynced || 0}
              </div>
              <div className="text-xs text-gray-400">Messages Synced</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-green-400">
                {formatUptime(uptime)}
              </div>
              <div className="text-xs text-gray-400">Uptime</div>
            </div>
          </>
        )}
      </div>

      {/* Network Details */}
      {showDetails && networkStatus && (
        <div className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Node ID:</span>
              <span className="text-white ml-2 font-mono text-xs">{nodeId?.slice(-12) || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-gray-400">Storage Used:</span>
              <span className="text-white ml-2">{networkStatus.storageUsed || 0} MB</span>
            </div>
            <div>
              <span className="text-gray-400">Network Health:</span>
              <span className={`ml-2 font-medium ${isHealthy ? 'text-green-400' : 'text-orange-400'}`}>
                {networkStatus.networkHealth || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Bootstrap Node:</span>
              <span className={`ml-2 ${networkStatus.isBootstrap ? 'text-blue-400' : 'text-gray-500'}`}>
                {networkStatus.isBootstrap ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Connection Error */}
      {connectionError && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
          <strong>Connection Error:</strong> {connectionError}
        </div>
      )}

      {/* Peer List */}
      {showDetails && isConnected && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-white">Connected Peers</h4>
            <button
              onClick={() => setShowPeerList(!showPeerList)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {showPeerList ? 'Hide' : 'Show'} ({peerCount})
            </button>
          </div>
          
          {showPeerList && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {peers.length > 0 ? (
                peers.slice(0, 10).map((peer, index) => (
                  <div key={peer.id} className="flex items-center justify-between p-2 bg-gray-800 rounded text-sm">
                    <div className="flex items-center space-x-3">
                      <span className="text-green-400">●</span>
                      <div>
                        <div className="text-white font-mono text-xs">
                          {peer.id.slice(-12)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {peer.userAgent || 'Unknown'} • {(peer as any).location || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-400 text-xs">{peer.reputation}</div>
                      <div className="text-gray-500 text-xs">rep</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm text-center py-4">
                  No peers connected yet
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {!showDetails && isConnected && board && (
        <div className="text-center">
          <div className="text-xs text-gray-400">
            Connected to <span className="text-blue-400">{board}</span> board
          </div>
        </div>
      )}
    </div>
  );
}
