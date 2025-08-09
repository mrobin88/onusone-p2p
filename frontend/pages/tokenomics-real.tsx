import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useWalletAuth } from '../components/WalletAuth';
import Button from '../components/Button';

interface TokenomicsData {
  totalSupply: number;
  circulatingSupply: number;
  totalBurned: number;
  totalStaked: number;
  burnRate24h: number;
  burnEvents: number;
  activeStakes: number;
  averageStakeSize: number;
  deflationary: {
    burnRatePercent: number;
    projectedSupplyIn1Year: number;
    deflationaryPressure: string;
  };
  recentBurns: Array<{
    postId: string;
    amount: number;
    timestamp: string;
    decayScore: number;
    txSig?: string;
  }>;
  topStakedPosts: Array<{
    postId: string;
    stakeTotal: number;
    burnedTotal: number;
    remainingStake: number;
    decayScore: number;
    createdAt: string;
  }>;
}

export default function TokenomicsReal() {
  const { user, isAuthenticated } = useWalletAuth();
  const [tokenomicsData, setTokenomicsData] = useState<TokenomicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [burnLoading, setBurnLoading] = useState(false);

  // Fetch real tokenomics data
  const fetchTokenomicsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tokenomics/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tokenomics data');
      }
      
      const data = await response.json();
      setTokenomicsData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenomicsData();
    
    // Auto-refresh every 30 seconds for live data
    const interval = setInterval(fetchTokenomicsData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    fetchTokenomicsData();
  };

  // Trigger token burn manually (for testing)
  const triggerBurn = async () => {
    try {
      setBurnLoading(true);
      const response = await fetch('/api/decay/burn-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`🔥 Burn completed! ${result.totalBurned} ONU burned from ${result.burnEvents} posts`);
        fetchTokenomicsData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`❌ Burn failed: ${error.error}`);
      }
    } catch (err) {
      alert(`❌ Burn error: ${err}`);
    } finally {
      setBurnLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toLocaleString();
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getDecayColor = (score: number) => {
    if (score <= 25) return 'text-red-400';
    if (score <= 50) return 'text-orange-400';
    if (score <= 75) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getDeflationaryColor = (pressure: string) => {
    switch (pressure) {
      case 'Extreme': return 'text-red-400';
      case 'High': return 'text-orange-400';
      case 'Moderate': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  if (loading && !tokenomicsData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading real tokenomics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Data</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!tokenomicsData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>No tokenomics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Real Tokenomics - OnusOne P2P</title>
        <meta name="description" content="Live token economics and burn statistics" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">🔥 OnusOne Real Tokenomics</h1>
            <p className="text-gray-400 mb-4">Live token economics with actual burning mechanism</p>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={handleRefresh} 
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                {loading ? 'Refreshing...' : '🔄 Refresh Data'}
              </Button>
              {isAuthenticated && (
                <Button 
                  onClick={triggerBurn} 
                  disabled={burnLoading}
                  variant="primary"
                  size="sm"
                >
                  {burnLoading ? 'Burning...' : '🔥 Trigger Burn'}
                </Button>
              )}
            </div>
          </div>

          {/* Main Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-2">Total Supply</h3>
              <p className="text-2xl font-bold text-blue-400">{formatNumber(tokenomicsData.totalSupply)}</p>
              <p className="text-xs text-gray-500">ONU Tokens</p>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-2">Circulating Supply</h3>
              <p className="text-2xl font-bold text-green-400">{formatNumber(tokenomicsData.circulatingSupply)}</p>
              <p className="text-xs text-gray-500">Available Tokens</p>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-2">Total Burned</h3>
              <p className="text-2xl font-bold text-red-400">{formatNumber(tokenomicsData.totalBurned)}</p>
              <p className="text-xs text-gray-500">{tokenomicsData.deflationary.burnRatePercent}% of supply</p>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-2">Total Staked</h3>
              <p className="text-2xl font-bold text-purple-400">{formatNumber(tokenomicsData.totalStaked)}</p>
              <p className="text-xs text-gray-500">Locked in Content</p>
            </div>
          </div>

          {/* Burn Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">🔥 Burn Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Burn Rate (24h)</span>
                  <span className="text-orange-400 font-mono">{tokenomicsData.burnRate24h.toFixed(2)} ONU/day</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Burn Events</span>
                  <span className="text-red-400 font-mono">{tokenomicsData.burnEvents.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Stakes</span>
                  <span className="text-purple-400 font-mono">{tokenomicsData.activeStakes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Stake Size</span>
                  <span className="text-blue-400 font-mono">{tokenomicsData.averageStakeSize.toFixed(2)} ONU</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">📈 Deflationary Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Burn Rate</span>
                  <span className="text-red-400 font-mono">{tokenomicsData.deflationary.burnRatePercent.toFixed(3)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Supply in 1 Year</span>
                  <span className="text-yellow-400 font-mono">{formatNumber(tokenomicsData.deflationary.projectedSupplyIn1Year)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Pressure Level</span>
                  <span className={`font-mono ${getDeflationaryColor(tokenomicsData.deflationary.deflationaryPressure)}`}>
                    {tokenomicsData.deflationary.deflationaryPressure}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Burns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">🔥 Recent Burns</h3>
              {tokenomicsData.recentBurns.length > 0 ? (
                <div className="space-y-3">
                  {tokenomicsData.recentBurns.slice(0, 8).map((burn, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                      <div>
                        <p className="text-sm text-gray-300">Post: {burn.postId.slice(-8)}</p>
                        <p className="text-xs text-gray-500">
                          Decay: <span className={getDecayColor(burn.decayScore)}>{burn.decayScore}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-400 font-mono">-{burn.amount} ONU</p>
                        <p className="text-xs text-gray-500">{formatTime(burn.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No burns yet - content is holding strong!</p>
              )}
            </div>

            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">🎯 Top Staked Posts</h3>
              {tokenomicsData.topStakedPosts.length > 0 ? (
                <div className="space-y-3">
                  {tokenomicsData.topStakedPosts.slice(0, 8).map((post, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                      <div>
                        <p className="text-sm text-gray-300">Post: {post.postId.slice(-8)}</p>
                        <p className="text-xs text-gray-500">
                          Decay: <span className={getDecayColor(post.decayScore)}>{post.decayScore}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-purple-400 font-mono">{post.remainingStake} ONU</p>
                        <p className="text-xs text-gray-500">
                          Burned: {post.burnedTotal}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No staked posts found - start posting to see activity!</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              🔥 Real-time tokenomics powered by content decay algorithm
            </p>
            <p className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
