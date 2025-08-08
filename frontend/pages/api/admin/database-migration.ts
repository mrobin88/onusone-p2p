import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import { getDataLayer, KeyPatterns } from '../../../lib/data-layer';

/**
 * Database Migration and Optimization Utility
 * Consolidates storage patterns and optimizes data structure
 */

interface MigrationResult {
  success: boolean;
  migratedKeys: number;
  optimizedKeys: number;
  removedKeys: number;
  errors: string[];
  summary: Record<string, number>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic auth check for admin operations
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { operation } = req.body;

  try {
    let result: MigrationResult;

    switch (operation) {
      case 'migrate':
        result = await performDatabaseMigration();
        break;
      case 'optimize':
        result = await optimizeDataStructure();
        break;
      case 'cleanup':
        result = await cleanupLegacyData();
        break;
      case 'analyze':
        result = await analyzeCurrentStructure();
        break;
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }

    return res.status(200).json({
      success: true,
      operation,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database migration failed:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Migrate data to new unified structure
 */
async function performDatabaseMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedKeys: 0,
    optimizedKeys: 0,
    removedKeys: 0,
    errors: [],
    summary: {}
  };

  const dataLayer = getDataLayer();

  try {
    console.log('🔄 Starting database migration...');

    // 1. Migrate user data to new format
    const userMigration = await migrateUserData();
    result.migratedKeys += userMigration.count;
    result.summary.users = userMigration.count;

    // 2. Migrate post data to new format
    const postMigration = await migratePostData();
    result.migratedKeys += postMigration.count;
    result.summary.posts = postMigration.count;

    // 3. Migrate reputation data
    const reputationMigration = await migrateReputationData();
    result.migratedKeys += reputationMigration.count;
    result.summary.reputation = reputationMigration.count;

    // 4. Create board indexes
    const boardMigration = await createBoardIndexes();
    result.migratedKeys += boardMigration.count;
    result.summary.boards = boardMigration.count;

    console.log('✅ Database migration completed');

  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Migration error');
  }

  return result;
}

/**
 * Optimize existing data structure
 */
async function optimizeDataStructure(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedKeys: 0,
    optimizedKeys: 0,
    removedKeys: 0,
    errors: [],
    summary: {}
  };

  try {
    console.log('⚡ Starting data structure optimization...');

    // 1. Optimize reputation leaderboard
    const leaderboardKeys = await kv.keys('reputation:leaderboard*');
    if (leaderboardKeys.length > 1) {
      // Consolidate multiple leaderboard keys
      const mainLeaderboard = KeyPatterns.REPUTATION_LEADERBOARD();
      
      for (const key of leaderboardKeys) {
        if (key !== mainLeaderboard) {
          const data = await kv.zrange(key, 0, -1, { withScores: true });
          if (data.length > 0) {
            // Merge into main leaderboard
            for (let i = 0; i < data.length; i += 2) {
              const member = data[i] as string;
              const score = data[i + 1] as number;
              await kv.zadd(mainLeaderboard, { score, member });
            }
          }
          await kv.del(key);
          result.removedKeys++;
        }
      }
      result.summary.leaderboard_consolidation = leaderboardKeys.length - 1;
    }

    // 2. Optimize post indexes
    const boardKeys = await kv.keys('board:*');
    for (const boardKey of boardKeys) {
      const postIds = await kv.lrange(boardKey, 0, -1);
      
      // Remove duplicates
      const uniquePostIds = [...new Set(postIds)];
      if (uniquePostIds.length !== postIds.length) {
        await kv.del(boardKey);
        if (uniquePostIds.length > 0) {
          await kv.lpush(boardKey, ...uniquePostIds);
        }
        result.optimizedKeys++;
      }
    }
    result.summary.board_optimization = boardKeys.length;

    // 3. Set TTL for temporary data
    const presenceKeys = await kv.keys('presence:*');
    for (const key of presenceKeys) {
      const ttl = await kv.ttl(key);
      if (ttl === -1) { // No expiration
        await kv.expire(key, 300); // 5 minutes
        result.optimizedKeys++;
      }
    }
    result.summary.ttl_optimization = presenceKeys.length;

    console.log('✅ Data structure optimization completed');

  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Optimization error');
  }

  return result;
}

/**
 * Clean up legacy and orphaned data
 */
async function cleanupLegacyData(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedKeys: 0,
    optimizedKeys: 0,
    removedKeys: 0,
    errors: [],
    summary: {}
  };

  try {
    console.log('🧹 Starting legacy data cleanup...');

    // 1. Remove orphaned reputation actions
    const actionKeys = await kv.keys('reputation:action:*');
    let orphanedActions = 0;
    
    for (const actionKey of actionKeys) {
      const action = await kv.hgetall(actionKey);
      if (!action || !action.userId) {
        await kv.del(actionKey);
        orphanedActions++;
        result.removedKeys++;
      }
    }
    result.summary.orphaned_actions = orphanedActions;

    // 2. Remove expired presence data
    const presenceKeys = await kv.keys('presence:user:*');
    let expiredPresence = 0;
    
    for (const key of presenceKeys) {
      const ttl = await kv.ttl(key);
      if (ttl === -2) { // Key expired but not deleted
        await kv.del(key);
        expiredPresence++;
        result.removedKeys++;
      }
    }
    result.summary.expired_presence = expiredPresence;

    // 3. Remove old analytics data (older than 90 days)
    const analyticsKeys = await kv.keys('analytics:daily:*');
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    let oldAnalytics = 0;
    
    for (const key of analyticsKeys) {
      const dateStr = key.split(':')[2];
      const recordDate = new Date(dateStr);
      if (recordDate < cutoffDate) {
        await kv.del(key);
        oldAnalytics++;
        result.removedKeys++;
      }
    }
    result.summary.old_analytics = oldAnalytics;

    // 4. Clean up empty collections
    const allKeys = await kv.keys('*');
    let emptyCollections = 0;
    
    for (const key of allKeys) {
      try {
        if (key.includes(':')) {
          const size = await kv.llen(key).catch(() => -1);
          if (size === 0) {
            await kv.del(key);
            emptyCollections++;
            result.removedKeys++;
          }
        }
      } catch {
        // Not a list, continue
      }
    }
    result.summary.empty_collections = emptyCollections;

    console.log('✅ Legacy data cleanup completed');

  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Cleanup error');
  }

  return result;
}

/**
 * Analyze current data structure
 */
async function analyzeCurrentStructure(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedKeys: 0,
    optimizedKeys: 0,
    removedKeys: 0,
    errors: [],
    summary: {}
  };

  try {
    console.log('📊 Analyzing current data structure...');

    // Get all keys and categorize them
    const allKeys = await kv.keys('*');
    const categories: Record<string, number> = {};
    
    for (const key of allKeys) {
      const category = key.split(':')[0];
      categories[category] = (categories[category] || 0) + 1;
    }

    result.summary = {
      total_keys: allKeys.length,
      ...categories
    };

    // Analyze data patterns
    const patterns = {
      users: await kv.keys('user:*'),
      posts: await kv.keys('post:*'),
      reputation_actions: await kv.keys('reputation:action:*'),
      reputation_profiles: await kv.keys('reputation:user:*:profile'),
      boards: await kv.keys('board:*'),
      presence: await kv.keys('presence:*'),
      analytics: await kv.keys('analytics:*'),
      tokenomics: await kv.keys('tokenomics:*'),
      stake: await kv.keys('stake:*'),
      cache: await kv.keys('cache:*')
    };

    for (const [pattern, keys] of Object.entries(patterns)) {
      result.summary[`${pattern}_count`] = keys.length;
    }

    // Check for optimization opportunities
    const optimizations = [];
    
    if (categories['presence'] > 100) {
      optimizations.push('High presence key count - consider cleanup');
    }
    
    if (categories['cache'] > 50) {
      optimizations.push('Many cache keys - verify TTL settings');
    }
    
    if (categories['analytics'] > 365) {
      optimizations.push('Old analytics data - consider archival');
    }

    result.summary.optimization_suggestions = optimizations.length;

    console.log('✅ Data structure analysis completed');

  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Analysis error');
  }

  return result;
}

/**
 * Helper functions for specific migrations
 */

async function migrateUserData(): Promise<{ count: number }> {
  let count = 0;
  
  const userKeys = await kv.keys('user:*');
  for (const key of userKeys) {
    const user = await kv.hgetall(key);
    if (user && !user.migrated) {
      // Ensure all required fields exist
      const updates: Record<string, any> = {
        migrated: true,
        updatedAt: new Date().toISOString()
      };
      
      if (!user.reputationScore) updates.reputationScore = 100;
      if (!user.isActive) updates.isActive = true;
      if (!user.createdAt) updates.createdAt = new Date().toISOString();
      
      await kv.hset(key, updates);
      count++;
    }
  }
  
  return { count };
}

async function migratePostData(): Promise<{ count: number }> {
  let count = 0;
  
  const postKeys = await kv.keys('post:*');
  for (const key of postKeys) {
    const post = await kv.hgetall(key);
    if (post && !post.migrated) {
      // Ensure all required fields exist
      const updates: Record<string, any> = {
        migrated: true,
        updatedAt: new Date().toISOString()
      };
      
      if (!post.decayScore) updates.decayScore = 100;
      if (!post.isVisible) updates.isVisible = true;
      if (!post.stakeTotal) updates.stakeTotal = 0;
      if (!post.burnedTotal) updates.burnedTotal = 0;
      if (!post.engagements) updates.engagements = 0;
      if (!post.status) updates.status = 'active';
      
      await kv.hset(key, updates);
      count++;
    }
  }
  
  return { count };
}

async function migrateReputationData(): Promise<{ count: number }> {
  let count = 0;
  
  const reputationKeys = await kv.keys('reputation:user:*:profile');
  for (const key of reputationKeys) {
    const reputation = await kv.hgetall(key);
    if (reputation && !reputation.migrated) {
      // Ensure proper data structure
      const updates: Record<string, any> = {
        migrated: true,
        updatedAt: new Date().toISOString()
      };
      
      if (!reputation.badges) updates.badges = JSON.stringify([]);
      if (!reputation.stats) {
        updates.stats = JSON.stringify({
          postsCreated: 0,
          postsLiked: 0,
          commentsCreated: 0,
          tokensStaked: 0,
          daysActive: 0,
          helpfulReplies: 0,
          contentFeatured: 0,
          flagsReceived: 0
        });
      }
      
      await kv.hset(key, updates);
      count++;
    }
  }
  
  return { count };
}

async function createBoardIndexes(): Promise<{ count: number }> {
  let count = 0;
  
  // Create indexes for boards if they don't exist
  const postKeys = await kv.keys('post:*');
  const boardPosts: Record<string, string[]> = {};
  
  for (const key of postKeys) {
    const post = await kv.hgetall(key);
    if (post && post.boardType) {
      if (!boardPosts[post.boardType]) {
        boardPosts[post.boardType] = [];
      }
      boardPosts[post.boardType].push(post.id);
    }
  }
  
  for (const [boardType, postIds] of Object.entries(boardPosts)) {
    const boardKey = KeyPatterns.BOARD(boardType);
    const existingPosts = await kv.lrange(boardKey, 0, -1);
    
    if (existingPosts.length === 0) {
      // Sort by creation date (newest first)
      const sortedPostIds = postIds.sort((a, b) => {
        const timeA = parseInt(a.split(':')[1]?.split('-')[0] || '0');
        const timeB = parseInt(b.split(':')[1]?.split('-')[0] || '0');
        return timeB - timeA;
      });
      
      await kv.lpush(boardKey, ...sortedPostIds);
      count++;
    }
  }
  
  return { count };
}
