import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import { reputationManager } from '../../../lib/reputation-manager';

/**
 * Get reputation leaderboard and global statistics
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = '50', offset = '0', timeframe = 'all' } = req.query;
    
    const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100 users
    const offsetNum = parseInt(offset as string) || 0;

    // Get top users from leaderboard (reverse order)
    const leaderboardData = await kv.zrange(
      'reputation:leaderboard', 
      offsetNum, 
      offsetNum + limitNum - 1, 
      { withScores: true, rev: true }
    );

    const leaderboard: any[] = [];
    for (let i = 0; i < leaderboardData.length; i += 2) {
      const userId = leaderboardData[i] as string;
      const score = leaderboardData[i + 1] as number;
      
      // Get user profile for display info
      const userKey = `user:${userId}`;
      const userInfo = await kv.hgetall(userKey);
      
      // Get reputation profile for rank and badges
      const userReputationKey = `reputation:user:${userId}:profile`;
      const reputationProfile = await kv.hgetall(userReputationKey);
      
      if (userInfo) {
        const rankInfo = reputationManager.calculateRank(score);
        
        leaderboard.push({
          position: offsetNum + Math.floor(i / 2) + 1,
          userId,
          username: userInfo.username || 'Unknown',
          walletAddress: userInfo.walletAddress,
          currentScore: score,
          rank: rankInfo.rank,
          rankColor: rankInfo.color,
          badges: reputationProfile?.badges 
            ? (Array.isArray(reputationProfile.badges) 
               ? reputationProfile.badges 
               : JSON.parse(reputationProfile.badges || '[]'))
            : [],
          stats: reputationProfile?.stats 
            ? (typeof reputationProfile.stats === 'string' 
               ? JSON.parse(reputationProfile.stats) 
               : reputationProfile.stats)
            : {
                postsCreated: 0,
                postsLiked: 0,
                commentsCreated: 0,
                tokensStaked: 0,
                daysActive: 0
              },
          lastActivity: reputationProfile?.lastActivity || new Date().toISOString(),
          joinedDate: userInfo.createdAt || new Date().toISOString()
        });
      }
    }

    // Get global reputation statistics
    const statsKey = 'reputation:global:stats';
    const globalStats = await kv.hgetall(statsKey);
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Calculate trending users (users with high activity in last 24 hours)
    const trendingUsers = await calculateTrendingUsers();
    
    // Get rank distribution
    const rankDistribution = await calculateRankDistribution(leaderboard);
    
    // Get total leaderboard size
    const totalUsers = await kv.zcard('reputation:leaderboard');

    return res.status(200).json({
      success: true,
      leaderboard,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: totalUsers,
        hasMore: offsetNum + limitNum < totalUsers
      },
      globalStats: {
        totalUsers,
        totalActions: parseInt(globalStats?.total_actions || '0'),
        totalPoints: parseInt(globalStats?.total_points || '0'),
        actionsToday: parseInt(globalStats?.[`actions_today:${today}`] || '0'),
        pointsToday: parseInt(globalStats?.[`points_today:${today}`] || '0'),
        actionsYesterday: parseInt(globalStats?.[`actions_today:${yesterday}`] || '0'),
        averageScore: totalUsers > 0 
          ? Math.round(leaderboard.reduce((sum, user) => sum + user.currentScore, 0) / leaderboard.length)
          : 0
      },
      trending: trendingUsers,
      rankDistribution,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return res.status(500).json({
      error: 'Failed to get leaderboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Calculate trending users based on recent activity
 */
async function calculateTrendingUsers(): Promise<any[]> {
  try {
    // This is a simplified trending calculation
    // In a full implementation, you'd track recent point gains
    const recentThreshold = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
    
    // Get top 10 users and check their recent activity
    const topUsers = await kv.zrange('reputation:leaderboard', 0, 19, { withScores: true, rev: true });
          const trending: any[] = [];
    
    for (let i = 0; i < Math.min(topUsers.length, 20); i += 2) {
      const userId = topUsers[i] as string;
      const score = topUsers[i + 1] as number;
      
      // Get user's recent actions
      const userActionsKey = `reputation:user:${userId}:actions`;
      const recentActionIds = await kv.lrange(userActionsKey, 0, 9); // Last 10 actions
      
      let recentPoints = 0;
      for (const actionId of recentActionIds) {
        const actionKey = `reputation:action:${actionId}`;
        const action = await kv.hgetall(actionKey);
        if (action && new Date(action.timestamp).getTime() > recentThreshold) {
          recentPoints += action.points || 0;
        }
      }
      
      if (recentPoints > 0) {
        const userKey = `user:${userId}`;
        const userInfo = await kv.hgetall(userKey);
        
        if (userInfo) {
          trending.push({
            userId,
            username: userInfo.username,
            currentScore: score,
            recentPoints,
            rank: reputationManager.calculateRank(score).rank
          });
        }
      }
    }
    
    // Sort by recent points and return top 5
    return trending
      .sort((a, b) => b.recentPoints - a.recentPoints)
      .slice(0, 5);
      
  } catch (error) {
    console.error('Failed to calculate trending users:', error);
    return [];
  }
}

/**
 * Calculate distribution of users across ranks
 */
async function calculateRankDistribution(leaderboard: any[]): Promise<Record<string, number>> {
  try {
    const distribution: Record<string, number> = {};
    
    // Initialize all ranks to 0
    const ranks = ['Newcomer', 'Contributor', 'Regular', 'Veteran', 'Expert', 'Legend', 'Pioneer'];
    ranks.forEach(rank => {
      distribution[rank] = 0;
    });
    
    // Count users in each rank (from leaderboard sample)
    leaderboard.forEach(user => {
      if (distribution.hasOwnProperty(user.rank)) {
        distribution[user.rank]++;
      }
    });
    
    return distribution;
    
  } catch (error) {
    console.error('Failed to calculate rank distribution:', error);
    return {};
  }
}
