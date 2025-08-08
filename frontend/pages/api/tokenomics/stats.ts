import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

interface TokenomicsStats {
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
  recentBurns: BurnEvent[];
  topStakedPosts: StakedPost[];
}

interface BurnEvent {
  postId: string;
  amount: number;
  timestamp: string;
  decayScore: number;
  txSig?: string;
}

interface StakedPost {
  postId: string;
  stakeTotal: number;
  burnedTotal: number;
  remainingStake: number;
  decayScore: number;
  createdAt: string;
}

/**
 * Calculate current decay score (same algorithm as burn endpoint)
 */
function calculateDecayScore(createdAt: string, engagements: number, stakeTotal: number): number {
  const created = new Date(createdAt).getTime();
  const hours = Math.max(0, (Date.now() - created) / 36e5);
  const lambda = 8; // Decay rate: 8 points/hour
  const engagement = Number(engagements || 0);
  const stake = Number(stakeTotal || 0);
  const stakeBoost = Math.log10(1 + stake) * 10;
  const raw = 100 - lambda * hours + engagement * 2 + stakeBoost;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Get comprehensive tokenomics statistics
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get global token statistics
    const globalStats = await kv.hgetall('global:token_stats') || {};
    const burnSummary = await kv.hgetall('global:burn_summary') || {};
    
    // Token economics configuration
    const INITIAL_SUPPLY = 1_000_000_000; // 1 billion ONU
    const totalBurned = Number(globalStats.totalBurned || 0);
    const burnEvents = Number(globalStats.burnEvents || 0);
    const circulatingSupply = INITIAL_SUPPLY - totalBurned;
    
    // Collect recent burn events and staked posts
    const boards = ['general', 'technology', 'community', 'p2p-development', 'reputation'];
    const recentBurns: BurnEvent[] = [];
    const stakedPosts: StakedPost[] = [];
    let totalStaked = 0;
    let activeStakes = 0;
    
    for (const boardType of boards) {
      const boardKey = `board:${boardType}`;
      const postIds = await kv.lrange(boardKey, 0, 50); // Get recent posts
      
      for (const postId of postIds) {
        const post = await kv.hgetall<any>(postId);
        if (!post) continue;
        
        const stakeTotal = Number(post.stakeTotal || 0);
        const burnedTotal = Number(post.burnedTotal || 0);
        const remainingStake = stakeTotal - burnedTotal;
        
        if (stakeTotal > 0) {
          const decayScore = calculateDecayScore(
            post.createdAt, 
            post.engagements || 0, 
            stakeTotal
          );
          
          stakedPosts.push({
            postId,
            stakeTotal,
            burnedTotal,
            remainingStake,
            decayScore,
            createdAt: post.createdAt
          });
          
          totalStaked += remainingStake;
          if (remainingStake > 0) activeStakes++;
          
          // Extract burn events from burn history
          if (post.burnHistory) {
            try {
              const burnHistory = JSON.parse(post.burnHistory);
              for (const burn of burnHistory.slice(-3)) { // Last 3 burns per post
                recentBurns.push({
                  postId,
                  amount: burn.burnedAmount,
                  timestamp: burn.timestamp,
                  decayScore: burn.decayScore,
                  txSig: burn.txSig
                });
              }
            } catch (e) {
              // Skip malformed burn history
            }
          }
        }
      }
    }
    
    // Sort and limit results
    recentBurns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    stakedPosts.sort((a, b) => b.stakeTotal - a.stakeTotal);
    
    // Calculate burn rate (simplified - assumes linear burn over time)
    const lastBurnTime = burnSummary.lastBurnRun ? new Date(burnSummary.lastBurnRun).getTime() : Date.now();
    const timeSinceLastBurn = (Date.now() - lastBurnTime) / (1000 * 60 * 60); // Hours
    const burnRate24h = timeSinceLastBurn > 0 ? (Number(burnSummary.lastBurnAmount || 0) / timeSinceLastBurn) * 24 : 0;
    
    // Calculate deflationary metrics
    const burnRatePercent = totalBurned > 0 ? (totalBurned / INITIAL_SUPPLY) * 100 : 0;
    const annualBurnRate = burnRate24h * 365;
    const projectedSupplyIn1Year = Math.max(0, circulatingSupply - annualBurnRate);
    
    let deflationaryPressure = 'Minimal';
    if (burnRatePercent > 5) deflationaryPressure = 'Extreme';
    else if (burnRatePercent > 2) deflationaryPressure = 'High';
    else if (burnRatePercent > 0.5) deflationaryPressure = 'Moderate';
    
    const averageStakeSize = activeStakes > 0 ? totalStaked / activeStakes : 0;
    
    const stats: TokenomicsStats = {
      totalSupply: INITIAL_SUPPLY,
      circulatingSupply,
      totalBurned,
      totalStaked,
      burnRate24h: Math.round(burnRate24h * 100) / 100,
      burnEvents,
      activeStakes,
      averageStakeSize: Math.round(averageStakeSize * 100) / 100,
      deflationary: {
        burnRatePercent: Math.round(burnRatePercent * 1000) / 1000,
        projectedSupplyIn1Year: Math.round(projectedSupplyIn1Year),
        deflationaryPressure
      },
      recentBurns: recentBurns.slice(0, 10),
      topStakedPosts: stakedPosts.slice(0, 10)
    };
    
    return res.status(200).json(stats);
    
  } catch (error) {
    console.error('Failed to get tokenomics stats:', error);
    return res.status(500).json({
      error: 'Failed to retrieve tokenomics statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
