import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import { reputationManager } from '../../../../lib/reputation-manager';

/**
 * Get user reputation profile and statistics
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user's reputation profile
    const userReputationKey = `reputation:user:${userId}:profile`;
    const reputation = await kv.hgetall(userReputationKey);

    if (!reputation) {
      // User has no reputation data yet, create default profile
      const defaultReputation = {
        userId,
        currentScore: 100, // Starting score
        totalPoints: 0,
        rank: 'Newcomer',
        percentile: 50,
        actionsCount: 0,
        lastActivity: new Date().toISOString(),
        joinedDate: new Date().toISOString(),
        badges: [],
        stats: {
          postsCreated: 0,
          postsLiked: 0,
          commentsCreated: 0,
          tokensStaked: 0,
          daysActive: 0,
          helpfulReplies: 0,
          contentFeatured: 0,
          flagsReceived: 0
        }
      };

      return res.status(200).json({
        success: true,
        reputation: defaultReputation,
        summary: reputationManager.generateSummary(defaultReputation as any),
        isDefault: true
      });
    }

    // Generate reputation summary
    const summary = reputationManager.generateSummary(reputation as any);

    // Get recent actions (last 20)
    const userActionsKey = `reputation:user:${userId}:actions`;
    const recentActionIds = await kv.lrange(userActionsKey, 0, 19);
    
    const recentActions = [];
    for (const actionId of recentActionIds) {
      const actionKey = `reputation:action:${actionId}`;
      const action = await kv.hgetall(actionKey);
      if (action) {
        recentActions.push(action);
      }
    }

    // Get user's leaderboard position
    const leaderboardRank = await kv.zrevrank('reputation:leaderboard', userId);
    const leaderboardPosition = leaderboardRank !== null ? leaderboardRank + 1 : null;

    // Get total users for context
    const totalUsers = await kv.zcard('reputation:leaderboard');

    return res.status(200).json({
      success: true,
      reputation: {
        ...reputation,
        badges: Array.isArray(reputation.badges) ? reputation.badges : JSON.parse(reputation.badges || '[]'),
        stats: typeof reputation.stats === 'string' ? JSON.parse(reputation.stats) : reputation.stats
      },
      summary,
      recentActions,
      leaderboard: {
        position: leaderboardPosition,
        totalUsers,
        percentile: reputation.percentile
      },
      isDefault: false
    });

  } catch (error) {
    console.error('Failed to get user reputation:', error);
    return res.status(500).json({
      error: 'Failed to get reputation data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
