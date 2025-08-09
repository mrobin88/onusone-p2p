import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
// import Layout from '../components/Layout';
import { EdgeNode, getEdgeNode, createEdgeNode } from '../lib/edge-node';

interface NodeStats {
  isRunning: boolean;
  earnings24h: number;
  totalEarnings: number;
  messagesServed: number;
  onlineTime: number;
  networkHealth: string;
}

export default function BecomeNode() {
  const { connected, publicKey } = useWallet();
  const [nodeStats, setNodeStats] = useState<NodeStats>({
    isRunning: false,
    earnings24h: 0,
    totalEarnings: 0,
    messagesServed: 0,
    onlineTime: 0,
    networkHealth: 'Excellent'
  });
  const [isStarting, setIsStarting] = useState(false);
  const [edgeNode, setEdgeNode] = useState<EdgeNode | null>(null);

  // Initialize edge node when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      const node = getEdgeNode(publicKey.toString()) || createEdgeNode(publicKey.toString());
      setEdgeNode(node);
    }
  }, [connected, publicKey]);

  // Update UI with real node status
  useEffect(() => {
    if (edgeNode) {
      const interval = setInterval(() => {
        const status = edgeNode.getStatus();
        setNodeStats({
          isRunning: status.isRunning,
          earnings24h: status.earnings.today,
          totalEarnings: status.earnings.total,
          messagesServed: status.messagesStored,
          onlineTime: status.uptime,
          networkHealth: status.connectedPeers > 0 ? 'Excellent' : 'Connecting'
        });
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }
  }, [edgeNode]);

  const startNode = async () => {
    if (!connected || !edgeNode) return;
    
    setIsStarting(true);
    
    try {
      const success = await edgeNode.start();
      if (!success) {
        alert('Failed to start node. Check console for details.');
      }
    } finally {
      setIsStarting(false);
    }
  };

  const stopNode = async () => {
    if (edgeNode) {
      await edgeNode.stop();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <a href="/" className="text-xl font-bold text-blue-600">OnusOne P2P</a>
              <a href="/become-node" className="text-gray-700 hover:text-blue-600 font-medium">💰 Become Node</a>
              <a href="/boards" className="text-gray-700 hover:text-blue-600">📋 Boards</a>
            </div>
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
          </div>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            💰 Become an Edge Node
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            <strong>One-click setup.</strong> Earn ONU tokens by helping relay messages.
          </p>
          
          {/* Simple explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-3">🧠 How Edge Nodes Work (Simple)</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-4 rounded border">
                <div className="text-2xl mb-2">📱</div>
                <div><strong>You:</strong> Click "Start Node"</div>
                <div>Your computer helps relay messages</div>
              </div>
              <div className="bg-white p-4 rounded border">
                <div className="text-2xl mb-2">🔄</div>
                <div><strong>Network:</strong> Sends you messages to cache</div>
                <div>Other users download from you</div>
              </div>
              <div className="bg-white p-4 rounded border">
                <div className="text-2xl mb-2">💰</div>
                <div><strong>You Earn:</strong> ~$4-8 per day</div>
                <div>Paid automatically in ONU tokens</div>
              </div>
            </div>
          </div>
        </div>

        {/* Node Status Dashboard */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Node Control */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🚀 Node Control</h2>
              
              {!connected ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔐</div>
                  <p className="text-gray-600 mb-4">Connect your Solana wallet to start earning</p>
                  <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">Node Status</div>
                      <div className={`text-sm ${nodeStats.isRunning ? 'text-green-600' : 'text-gray-500'}`}>
                        {nodeStats.isRunning ? '🟢 Running & Earning' : '⚪ Offline'}
                      </div>
                    </div>
                    <div>
                      {!nodeStats.isRunning ? (
                        <button
                          onClick={startNode}
                          disabled={isStarting}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
                        >
                          {isStarting ? '⏳ Starting...' : '🚀 Start Node'}
                        </button>
                      ) : (
                        <button
                          onClick={stopNode}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium"
                        >
                          ⏹️ Stop Node
                        </button>
                      )}
                    </div>
                  </div>

                  {nodeStats.isRunning && (
                    <div className="bg-green-50 border border-green-200 rounded p-4">
                      <div className="font-medium text-green-800 mb-2">✅ Your node is earning!</div>
                      <div className="text-sm text-green-700">
                        • Caching messages for nearby users<br/>
                        • Earning ONU tokens automatically<br/>
                        • Contributing to network decentralization
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-4">
                    Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </div>
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">📋 Requirements</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Any computer/laptop</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Internet connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Solana wallet</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>100+ ONU tokens (small stake)</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <strong>💡 Pro Tip:</strong> Leave your computer online longer = earn more ONU!
              </div>
            </div>
          </div>

          {/* Right: Live Earnings */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">💰 Live Earnings</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {nodeStats.earnings24h.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">ONU Today</div>
                  <div className="text-xs text-green-600">
                    ≈ ${(nodeStats.earnings24h * 0.50).toFixed(2)} USD
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {nodeStats.totalEarnings.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total ONU</div>
                  <div className="text-xs text-green-600">
                    ≈ ${(nodeStats.totalEarnings * 0.50).toFixed(2)} USD
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Messages Served:</span>
                  <span className="font-medium">{nodeStats.messagesServed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Online Time:</span>
                  <span className="font-medium">{Math.floor(nodeStats.onlineTime / 60)}h {nodeStats.onlineTime % 60}m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Network Health:</span>
                  <span className="font-medium text-green-600">{nodeStats.networkHealth}</span>
                </div>
              </div>

              {nodeStats.isRunning && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <div className="font-medium text-green-800">🔄 Earning in real-time</div>
                  <div className="text-green-700">Your earnings update every few minutes as you serve messages!</div>
                </div>
              )}
            </div>

            {/* Network Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">🌐 Network Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Active Edge Nodes:</span>
                  <span className="font-medium">247</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Messages Today:</span>
                  <span className="font-medium">12,847</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg. Earnings/Node:</span>
                  <span className="font-medium text-green-600">$6.80/day</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Uptime:</span>
                  <span className="font-medium">99.7%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">❓ Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-medium mb-1">Q: How much can I really earn?</div>
              <div className="text-gray-600 mb-3">A: $4-8 per day typically. More if you stay online longer or serve popular content.</div>
              
              <div className="font-medium mb-1">Q: What am I actually doing?</div>
              <div className="text-gray-600 mb-3">A: Your computer caches messages and serves them to nearby users, reducing load on main servers.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Q: Is this safe?</div>
              <div className="text-gray-600 mb-3">A: Yes! You only cache public messages, no private data. Your wallet stays secure.</div>
              
              <div className="font-medium mb-1">Q: Can I turn it off anytime?</div>
              <div className="text-gray-600 mb-3">A: Absolutely! No penalties for going offline. You just stop earning until you restart.</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {!connected && (
          <div className="mt-8 text-center">
            <div className="text-lg font-medium mb-2">Ready to start earning?</div>
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !text-lg !px-8 !py-3" />
          </div>
        )}
      </div>
    </div>
  );
}
