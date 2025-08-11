import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { kv } from '@vercel/kv';
import { withSecurity } from '../../../lib/security';
import { ReputationActionType, reputationManager } from '../../../lib/reputation-manager';

const trackReputationSchema = z.object({
  userId: z.string().min(1),
  action: z.nativeEnum(ReputationActionType),
  reason: z.string().min(1).max(200),
  relatedContent: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Track reputation action for a user
 * Records action and updates user's reputation score
 */
async function trackReputation(req: NextApiRequest, res: NextApiResponse, validatedData: any) {
  try {
    const { userId, action, reason, relatedContent, metadata } = validatedData;

    // Create reputation action
    const reputationAction = reputationManager.createAction(
      userId,
      action,
      reason,
      relatedContent,
      metadata
    );

    // Store action in KV
    const actionKey = `reputation:action:${reputationAction.id}`;
    await kv.hset(actionKey, reputationAction);

    // Add to user's action list
    const userActionsKey = `reputation:user:${userId}:actions`;
    await kv.lpush(userActionsKey, reputationAction.id);

    // Keep only last 1000 actions per user to manage storage
    await kv.ltrim(userActionsKey, 0, 999);

    // Update user's reputation score
    await updateUserReputation(userId);

    // Update global reputation stats
    await updateGlobalReputationStats(action, reputationAction.points);

    console.log(`📊 Reputation tracked: ${userId} → ${action} (${reputationAction.points} points)`);

    return res.status(200).json({
      success: true,
      action: reputationAction,
      message: `Tracked ${action} for user ${userId}`
    });

  } catch (error) {
    console.error('Reputation tracking failed:', error);
    return res.status(500).json({
      error: 'Failed to track reputation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Update user's complete reputation profile
 */
async function updateUserReputation(userId: string): Promise<void> {
  try {
    // Get all user actions
    const userActionsKey = `reputation:user:${userId}:actions`;
    const actionIds = await kv.lrange(userActionsKey, 0, -1);
    
    const actions: any[] = [];
    for (const actionId of actionIds) {
      const actionKey = `reputation:action:${actionId}`;
      const action = await kv.hgetall(actionKey);
      if (action) {
        actions.push(action);
      }
    }

    // Calculate reputation stats
    const stats = {
      postsCreated: actions.filter(a => a.action === ReputationActionType.POST_CREATE).length,
      postsLiked: actions.filter(a => a.action === ReputationActionType.POST_LIKED).length,
      commentsCreated: actions.filter(a => a.action === ReputationActionType.COMMENT_CREATE).length,
      tokensStaked: actions
        .filter(a => a.action === ReputationActionType.STAKE_TOKENS)
        .reduce((sum, a) => sum + (parseFloat(a.metadata?.amount) || 0), 0),
      helpfulReplies: actions.filter(a => a.action === ReputationActionType.HELPFUL_REPLY).length,
      contentFeatured: actions.filter(a => a.action === ReputationActionType.CONTENT_FEATURED).length,
      flagsReceived: actions.filter(a => 
        a.action === ReputationActionType.POST_FLAGGED || 
        a.action === ReputationActionType.COMMENT_FLAGGED
      ).length,
      daysActive: calculateDaysActive(actions)
    };

    // Calculate current score
    const currentScore = reputationManager.calculateReputationScore(actions);
    
    // Apply decay based on last activity
    const lastActivity = actions.length > 0 
      ? new Date(Math.max(...actions.map(a => new Date(a.timestamp).getTime())))
      : new Date();
    const decay = reputationManager.calculateDecay(lastActivity.toISOString());
    const finalScore = Math.max(0, currentScore - decay);

    // Get user info for reputation profile
    const userKey = `user:${userId}`;
    const userInfo = await kv.hgetall(userKey);
    
    // Create reputation profile
    const reputation = {
      userId,
      currentScore: finalScore,
      totalPoints: actions.reduce((sum, a) => sum + (a.points || 0), 0),
      rank: reputationManager.calculateRank(finalScore).rank,
      percentile: await calculatePercentile(userId, finalScore),
      actionsCount: actions.length,
      lastActivity: lastActivity.toISOString(),
      joinedDate: userInfo?.createdAt || new Date().toISOString(),
      badges: reputationManager.calculateBadges({
        userId,
        currentScore: finalScore,
        totalPoints: actions.reduce((sum, a) => sum + (a.points || 0), 0),
        rank: reputationManager.calculateRank(finalScore).rank,
        percentile: 0,
        actionsCount: actions.length,
        lastActivity: lastActivity.toISOString(),
        joinedDate: (userInfo?.createdAt as string) || new Date().toISOString(),
        badges: [],
        stats
      }),
      stats,
      updatedAt: new Date().toISOString()
    };

    // Store updated reputation
    const userReputationKey = `reputation:user:${userId}:profile`;
    await kv.hset(userReputationKey, reputation);

    // Update global leaderboard
    await updateGlobalLeaderboard(userId, finalScore);

    console.log(`✅ Updated reputation for ${userId}: ${finalScore} points (${reputation.rank})`);

  } catch (error) {
    console.error(`Failed to update reputation for ${userId}:`, error);
  }
}

/**
 * Calculate days active based on actions
 */
function calculateDaysActive(actions: any[]): number {
  if (actions.length === 0) return 0;
  
  const dates = new Set();
  actions.forEach(action => {
    const date = new Date(action.timestamp).toDateString();
    dates.add(date);
  });
  
  return dates.size;
}

/**
 * Calculate user's percentile rank
 */
async function calculatePercentile(userId: string, score: number): Promise<number> {
  try {
    // Get leaderboard scores
    const leaderboard = await kv.zrange('reputation:leaderboard', 0, -1, { withScores: true });
    
    if (leaderboard.length < 2) return 100; // Only user or very few users
    
    // Count users with lower scores
    let lowerScoreCount = 0;
    for (let i = 1; i < leaderboard.length; i += 2) {
      const userScore = leaderboard[i] as number;
      if (userScore < score) lowerScoreCount++;
    }
    
    const totalUsers = leaderboard.length / 2;
    return Math.round((lowerScoreCount / totalUsers) * 100);
    
  } catch (error) {
    console.error('Failed to calculate percentile:', error);
    return 50; // Default to median
  }
}

/**
 * Update global leaderboard
 */
async function updateGlobalLeaderboard(userId: string, score: number): Promise<void> {
  try {
    await kv.zadd('reputation:leaderboard', { score, member: userId });
    
    // Keep only top 1000 users to manage storage
    const totalUsers = await kv.zcard('reputation:leaderboard');
    if (totalUsers > 1000) {
      await kv.zremrangebyrank('reputation:leaderboard', 0, totalUsers - 1001);
    }
  } catch (error) {
    console.error('Failed to update leaderboard:', error);
  }
}

/**
 * Update global reputation statistics
 */
async function updateGlobalReputationStats(action: ReputationActionType, points: number): Promise<void> {
  try {
    const statsKey = 'reputation:global:stats';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Update daily stats
    await Promise.all([
      kv.hincrby(statsKey, `total_actions`, 1),
      kv.hincrby(statsKey, `total_points`, points),
      kv.hincrby(statsKey, `actions_today:${today}`, 1),
      kv.hincrby(statsKey, `points_today:${today}`, points),
      kv.hincrby(statsKey, `action_${action}`, 1)
    ]);
    
  } catch (error) {
    console.error('Failed to update global stats:', error);
  }
}

// Apply security middleware and export
export default withSecurity('createPost', trackReputationSchema)(trackReputation);
