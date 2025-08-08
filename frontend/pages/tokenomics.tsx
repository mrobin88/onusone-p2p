import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useLocalAuth } from '../components/LocalAuth';
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

export default function Tokenomics() {
  const { user, isAuthenticated } = useLocalAuth();
  const [tokenomicsData, setTokenomicsData] = useState<TokenomicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate real-time token burns
  useEffect(() => {
    const interval = setInterval(() => {
      setTokenomicsData(prev => {
        const burnAmount = Math.floor(Math.random() * 1000) + 100;
        const burnReasons = [
          'Content decay threshold reached',
          'Poor engagement penalty',
          'Spam content removal',
          'Quality score below minimum',
          'Network fee burn'
        ];
        const randomReason = burnReasons[Math.floor(Math.random() * burnReasons.length)];

        return {
          ...prev,
          circulatingSupply: prev.circulatingSupply - burnAmount,
          burnedTokens: prev.burnedTokens + burnAmount,
          recentBurns: [
            {
              amount: burnAmount,
              reason: randomReason,
              timestamp: new Date()
            },
            ...prev.recentBurns.slice(0, 9) // Keep last 10
          ],
          networkMetrics: {
            ...prev.networkMetrics,
            activeStakes: prev.networkMetrics.activeStakes + Math.floor(Math.random() * 10) - 5,
            contentCreated: prev.networkMetrics.contentCreated + Math.floor(Math.random() * 5),
            qualityScore: Math.max(75, Math.min(95, prev.networkMetrics.qualityScore + (Math.random() - 0.5) * 2)),
            deflationary_rate: Math.max(1, Math.min(5, prev.networkMetrics.deflationary_rate + (Math.random() - 0.5) * 0.5))
          }
        };
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

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

  const getSupplyColor = () => {
    const burnPercentage = (tokenomicsData.burnedTokens / tokenomicsData.totalSupply) * 100;
    if (burnPercentage > 10) return 'text-red-400';
    if (burnPercentage > 5) return 'text-orange-400';
    return 'text-green-400';
  };

  return (
    <>
      <Head>
        <title>ONU Token Economics - OnusOne P2P</title>
        <meta name="description" content="Live tokenomics dashboard for ONU temporal tokens" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                ONU Token Economics
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Revolutionary Temporal Tokenomics - Content Quality Drives Value
            </p>
            <div className="mt-4 inline-flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Live Network Data</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Total Supply</h3>
                <span className="text-blue-400">📊</span>
              </div>
              <div className="text-2xl font-bold">{formatNumber(tokenomicsData.totalSupply)}</div>
              <div className="text-xs text-gray-500 mt-1">Fixed maximum supply</div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Circulating</h3>
                <span className="text-green-400">💰</span>
              </div>
              <div className={`text-2xl font-bold ${getSupplyColor()}`}>
                {formatNumber(tokenomicsData.circulatingSupply)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Available for use</div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Burned Forever</h3>
                <span className="text-red-400">🔥</span>
              </div>
              <div className="text-2xl font-bold text-red-400">
                {formatNumber(tokenomicsData.burnedTokens)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {((tokenomicsData.burnedTokens / tokenomicsData.totalSupply) * 100).toFixed(1)}% of total
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Staked</h3>
                <span className="text-purple-400">🎯</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {formatNumber(tokenomicsData.stakedTokens)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Locked in content</div>
            </div>
          </div>

          {/* Network Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Network Health
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Stakes</span>
                  <span className="font-semibold">{tokenomicsData.networkMetrics.activeStakes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Content Created</span>
                  <span className="font-semibold">{tokenomicsData.networkMetrics.contentCreated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Quality Score</span>
                  <span className={`font-semibold ${
                    tokenomicsData.networkMetrics.qualityScore > 85 ? 'text-green-400' : 
                    tokenomicsData.networkMetrics.qualityScore > 75 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {tokenomicsData.networkMetrics.qualityScore.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Deflationary Rate</span>
                  <span className="font-semibold text-red-400">
                    {tokenomicsData.networkMetrics.deflationary_rate.toFixed(1)}%/day
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <span className="mr-2">🔥</span>
                Recent Burns
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {tokenomicsData.recentBurns.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent burns</p>
                ) : (
                  tokenomicsData.recentBurns.map((burn, index) => (
                    <div key={index} className="flex justify-between items-start bg-gray-900 p-3 rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-red-400">
                          -{formatNumber(burn.amount)} ONU
                        </div>
                        <div className="text-xs text-gray-500">{burn.reason}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {burn.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Blockchain Strategy */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-8 rounded-lg border border-blue-500/30 mb-8">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <span className="mr-2">⛓️</span>
              Blockchain Strategy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-blue-400 mb-3">Current: P2P Native</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Local browser storage for wallet</li>
                  <li>• P2P network for token transfers</li>
                  <li>• IPFS for content/transaction records</li>
                  <li>• Zero gas fees, instant transactions</li>
                  <li>• Demo-ready temporal tokenomics</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-medium text-purple-400 mb-3">Future: Multi-Chain</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Solana for fast, cheap transactions</li>
                  <li>• Ethereum for maximum compatibility</li>
                  <li>• Layer 2 solutions for scaling</li>
                  <li>• Cross-chain bridges for liquidity</li>
                  <li>• DEX integration for trading</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400">
                <strong className="text-green-400">💡 Innovation:</strong> Start with zero infrastructure costs using P2P. 
                Add blockchain integration when network reaches critical mass and can afford gas fees.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="text-center">
            <div className="space-x-4">
              <Button
                onClick={() => window.open('https://github.com/mrobin88/onusone-p2p', '_blank')}
                variant="primary"
              >
                View Source Code
              </Button>
              <Button
                onClick={() => alert('🚀 Solana integration coming in Phase 2!')}
                variant="secondary"
              >
                Solana Integration
              </Button>
              {isAuthenticated && (
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="secondary"
                >
                  Back to Network
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}