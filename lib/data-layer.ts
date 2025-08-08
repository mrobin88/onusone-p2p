/**
 * Unified Data Layer for OnusOne P2P
 * Consolidates all storage patterns into a clean, optimized architecture
 */

import { kv } from '@vercel/kv';

// Data layer configuration
export const DATA_CONFIG = {
  // Storage strategies by data type
  STORAGE_STRATEGIES: {
    USER_DATA: 'kv',           // User profiles, auth, reputation
    CONTENT: 'kv',             // Posts, comments, boards  
    REALTIME: 'kv',            // Presence, P2P network state
    ANALYTICS: 'kv',           // Statistics, metrics, tracking
    BLOCKCHAIN: 'solana',      // Token transactions, stakes
    CACHE: 'memory'            // Temporary client-side data
  },
  
  // Data lifecycle policies
  RETENTION: {
    POSTS: 365 * 24 * 60 * 60 * 1000,           // 1 year
    USER_SESSIONS: 30 * 24 * 60 * 60 * 1000,    // 30 days
    REPUTATION_ACTIONS: 180 * 24 * 60 * 60 * 1000, // 6 months
    ANALYTICS: 90 * 24 * 60 * 60 * 1000,        // 90 days
    P2P_STATE: 7 * 24 * 60 * 60 * 1000,         // 7 days
    PRESENCE: 5 * 60 * 1000                     // 5 minutes
  },
  
  // Performance optimization
  CACHING: {
    USER_PROFILES: 10 * 60 * 1000,              // 10 minutes
    LEADERBOARDS: 5 * 60 * 1000,               // 5 minutes
    NETWORK_STATS: 30 * 1000,                  // 30 seconds
    TOKEN_BALANCES: 60 * 1000                  // 1 minute
  }
};

/**
 * Key naming conventions for consistent data organization
 */
export const KeyPatterns = {
  // User data
  USER: (userId: string) => `user:${userId}`,
  USER_REPUTATION: (userId: string) => `reputation:user:${userId}:profile`,
  USER_ACTIONS: (userId: string) => `reputation:user:${userId}:actions`,
  USER_SESSIONS: (userId: string) => `session:user:${userId}`,
  
  // Content data
  POST: (postId: string) => `post:${postId}`,
  BOARD: (boardName: string) => `board:${boardName}`,
  COMMENT: (commentId: string) => `comment:${commentId}`,
  ENGAGEMENT: (postId: string) => `engagement:${postId}`,
  
  // Reputation system
  REPUTATION_ACTION: (actionId: string) => `reputation:action:${actionId}`,
  REPUTATION_LEADERBOARD: () => `reputation:leaderboard`,
  REPUTATION_STATS: () => `reputation:global:stats`,
  
  // Token economics
  STAKE_HISTORY: (postId: string) => `stake:post:${postId}`,
  TOKEN_STATS: () => `tokenomics:global:stats`,
  BURN_EVENTS: () => `tokenomics:burn:events`,
  BURN_HISTORY: (postId: string) => `tokenomics:burn:${postId}`,
  
  // P2P networking
  P2P_PEERS: () => `p2p:peers`,
  P2P_STATUS: (nodeId: string) => `p2p:node:${nodeId}`,
  P2P_MESSAGES: (boardName: string) => `p2p:messages:${boardName}`,
  
  // Analytics & monitoring
  ANALYTICS_DAILY: (date: string) => `analytics:daily:${date}`,
  PRESENCE_COUNT: () => `presence:count`,
  PRESENCE_USER: (userId: string) => `presence:user:${userId}`,
  
  // Caching
  CACHE_USER: (userId: string) => `cache:user:${userId}`,
  CACHE_BOARD: (boardName: string) => `cache:board:${boardName}`,
  CACHE_STATS: (type: string) => `cache:stats:${type}`,
};

/**
 * Base data access object with common operations
 */
export class BaseDAO {
  protected keyPattern: (id: string) => string;
  protected ttl?: number;

  constructor(keyPattern: (id: string) => string, ttl?: number) {
    this.keyPattern = keyPattern;
    this.ttl = ttl;
  }

  async get(id: string): Promise<any | null> {
    try {
      const key = this.keyPattern(id);
      return await kv.hgetall(key);
    } catch (error) {
      console.error(`Failed to get ${id}:`, error);
      return null;
    }
  }

  async set(id: string, data: Record<string, any>): Promise<boolean> {
    try {
      const key = this.keyPattern(id);
      await kv.hset(key, data);
      
      if (this.ttl) {
        await kv.expire(key, Math.floor(this.ttl / 1000));
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to set ${id}:`, error);
      return false;
    }
  }

  async update(id: string, updates: Record<string, any>): Promise<boolean> {
    try {
      const key = this.keyPattern(id);
      await kv.hset(key, updates);
      return true;
    } catch (error) {
      console.error(`Failed to update ${id}:`, error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const key = this.keyPattern(id);
      await kv.del(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete ${id}:`, error);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const key = this.keyPattern(id);
      const result = await kv.exists(key);
      return result > 0;
    } catch (error) {
      console.error(`Failed to check existence of ${id}:`, error);
      return false;
    }
  }
}

/**
 * User data access object
 */
export class UserDAO extends BaseDAO {
  constructor() {
    super(KeyPatterns.USER, DATA_CONFIG.RETENTION.USER_SESSIONS);
  }

  async createUser(userData: {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    walletAddress?: string;
  }): Promise<boolean> {
    const user = {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      reputationScore: 100 // Starting reputation
    };

    return await this.set(userData.id, user);
  }

  async findByUsername(username: string): Promise<any | null> {
    try {
      // Search through users to find by username
      const keys = await kv.keys('user:*');
      for (const key of keys) {
        const user = await kv.hgetall(key);
        if (user && user.username === username) {
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to find user by username:', error);
      return null;
    }
  }

  async findByEmail(email: string): Promise<any | null> {
    try {
      const keys = await kv.keys('user:*');
      for (const key of keys) {
        const user = await kv.hgetall(key);
        if (user && user.email === email) {
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to find user by email:', error);
      return null;
    }
  }
}

/**
 * Content data access object
 */
export class ContentDAO extends BaseDAO {
  constructor() {
    super(KeyPatterns.POST, DATA_CONFIG.RETENTION.POSTS);
  }

  async createPost(postData: {
    id: string;
    content: string;
    authorId: string;
    boardType: string;
  }): Promise<boolean> {
    const post = {
      ...postData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      engagements: 0,
      stakeTotal: 0,
      burnedTotal: 0,
      decayScore: 100,
      isVisible: true,
      status: 'active'
    };

    // Store post
    const success = await this.set(postData.id, post);
    
    if (success) {
      // Add to board index
      const boardKey = KeyPatterns.BOARD(postData.boardType);
      await kv.lpush(boardKey, postData.id);
      
      // Keep only last 1000 posts per board
      await kv.ltrim(boardKey, 0, 999);
    }

    return success;
  }

  async getPostsByBoard(boardName: string, limit: number = 50): Promise<any[]> {
    try {
      const boardKey = KeyPatterns.BOARD(boardName);
      const postIds = await kv.lrange(boardKey, 0, limit - 1);
      
      const posts = [];
      for (const postId of postIds) {
        const post = await this.get(postId);
        if (post && post.isVisible) {
          posts.push(post);
        }
      }
      
      return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error(`Failed to get posts for board ${boardName}:`, error);
      return [];
    }
  }
}

/**
 * Reputation data access object
 */
export class ReputationDAO {
  async trackAction(action: {
    id: string;
    userId: string;
    action: string;
    points: number;
    reason: string;
    timestamp: string;
    relatedContent?: string;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      // Store action
      const actionKey = KeyPatterns.REPUTATION_ACTION(action.id);
      await kv.hset(actionKey, action);

      // Add to user's action list
      const userActionsKey = KeyPatterns.USER_ACTIONS(action.userId);
      await kv.lpush(userActionsKey, action.id);
      await kv.ltrim(userActionsKey, 0, 999); // Keep last 1000 actions

      return true;
    } catch (error) {
      console.error('Failed to track reputation action:', error);
      return false;
    }
  }

  async getUserReputation(userId: string): Promise<any | null> {
    try {
      const reputationKey = KeyPatterns.USER_REPUTATION(userId);
      return await kv.hgetall(reputationKey);
    } catch (error) {
      console.error('Failed to get user reputation:', error);
      return null;
    }
  }

  async updateLeaderboard(userId: string, score: number): Promise<boolean> {
    try {
      const leaderboardKey = KeyPatterns.REPUTATION_LEADERBOARD();
      await kv.zadd(leaderboardKey, { score, member: userId });
      
      // Keep only top 1000 users
      const totalUsers = await kv.zcard(leaderboardKey);
      if (totalUsers > 1000) {
        await kv.zremrangebyrank(leaderboardKey, 0, totalUsers - 1001);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to update leaderboard:', error);
      return false;
    }
  }
}

/**
 * P2P networking data access object
 */
export class P2PDataDAO {
  async updatePeerStatus(nodeId: string, status: {
    connectedPeers: number;
    networkHealth: string;
    uptime: number;
    messagesSynced: number;
    storageUsed: number;
  }): Promise<boolean> {
    try {
      const statusKey = KeyPatterns.P2P_STATUS(nodeId);
      const data = {
        ...status,
        nodeId,
        lastUpdated: new Date().toISOString()
      };
      
      await kv.hset(statusKey, data);
      await kv.expire(statusKey, DATA_CONFIG.RETENTION.P2P_STATE / 1000);
      
      return true;
    } catch (error) {
      console.error('Failed to update P2P status:', error);
      return false;
    }
  }

  async getNetworkStatus(): Promise<any> {
    try {
      const peersKey = KeyPatterns.P2P_PEERS();
      const peers = await kv.smembers(peersKey);
      
      // Get status from all active nodes
      const nodeStatuses = [];
      for (const nodeId of peers) {
        const statusKey = KeyPatterns.P2P_STATUS(nodeId);
        const status = await kv.hgetall(statusKey);
        if (status) {
          nodeStatuses.push(status);
        }
      }
      
      return {
        totalNodes: peers.length,
        activeNodes: nodeStatuses.length,
        totalPeers: nodeStatuses.reduce((sum, node) => sum + (node.connectedPeers || 0), 0),
        averageUptime: nodeStatuses.length > 0 
          ? nodeStatuses.reduce((sum, node) => sum + (node.uptime || 0), 0) / nodeStatuses.length 
          : 0,
        networkHealth: nodeStatuses.length > 0 ? 'healthy' : 'connecting'
      };
    } catch (error) {
      console.error('Failed to get network status:', error);
      return { totalNodes: 0, activeNodes: 0, totalPeers: 0, networkHealth: 'unknown' };
    }
  }
}

/**
 * Analytics data access object
 */
export class AnalyticsDAO {
  async recordEvent(event: {
    type: string;
    userId?: string;
    data?: Record<string, any>;
  }): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = KeyPatterns.ANALYTICS_DAILY(today);
      
      // Increment event counter
      await kv.hincrby(dailyKey, `${event.type}_count`, 1);
      await kv.hincrby(dailyKey, 'total_events', 1);
      
      // Set expiration for analytics data
      await kv.expire(dailyKey, DATA_CONFIG.RETENTION.ANALYTICS / 1000);
      
      return true;
    } catch (error) {
      console.error('Failed to record analytics event:', error);
      return false;
    }
  }

  async getGlobalStats(): Promise<any> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const [todayStats, yesterdayStats] = await Promise.all([
        kv.hgetall(KeyPatterns.ANALYTICS_DAILY(today)),
        kv.hgetall(KeyPatterns.ANALYTICS_DAILY(yesterday))
      ]);
      
      return {
        today: todayStats || {},
        yesterday: yesterdayStats || {},
        growth: this.calculateGrowth(todayStats, yesterdayStats)
      };
    } catch (error) {
      console.error('Failed to get global stats:', error);
      return { today: {}, yesterday: {}, growth: {} };
    }
  }

  private calculateGrowth(today: any, yesterday: any): Record<string, number> {
    const growth: Record<string, number> = {};
    
    for (const key in today) {
      const todayValue = parseInt(today[key] || '0');
      const yesterdayValue = parseInt(yesterday[key] || '0');
      
      if (yesterdayValue > 0) {
        growth[key] = Math.round(((todayValue - yesterdayValue) / yesterdayValue) * 100);
      } else {
        growth[key] = todayValue > 0 ? 100 : 0;
      }
    }
    
    return growth;
  }
}

/**
 * Unified data access layer
 */
export class DataLayer {
  public users: UserDAO;
  public content: ContentDAO;
  public reputation: ReputationDAO;
  public p2p: P2PDataDAO;
  public analytics: AnalyticsDAO;

  constructor() {
    this.users = new UserDAO();
    this.content = new ContentDAO();
    this.reputation = new ReputationDAO();
    this.p2p = new P2PDataDAO();
    this.analytics = new AnalyticsDAO();
  }

  /**
   * Cleanup expired data
   */
  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Starting data cleanup...');
      
      // Clean up expired presence data
      const presenceKeys = await kv.keys('presence:user:*');
      let cleanedPresence = 0;
      
      for (const key of presenceKeys) {
        const ttl = await kv.ttl(key);
        if (ttl === -1) { // No expiration set
          await kv.expire(key, DATA_CONFIG.RETENTION.PRESENCE / 1000);
        } else if (ttl === -2) { // Already expired
          cleanedPresence++;
        }
      }
      
      console.log(`✅ Cleaned ${cleanedPresence} expired presence records`);
      
      // Clean up old analytics data
      const analyticsKeys = await kv.keys('analytics:daily:*');
      let cleanedAnalytics = 0;
      
      for (const key of analyticsKeys) {
        const date = key.split(':')[2];
        const recordDate = new Date(date);
        const cutoffDate = new Date(Date.now() - DATA_CONFIG.RETENTION.ANALYTICS);
        
        if (recordDate < cutoffDate) {
          await kv.del(key);
          cleanedAnalytics++;
        }
      }
      
      console.log(`✅ Cleaned ${cleanedAnalytics} old analytics records`);
      
    } catch (error) {
      console.error('Data cleanup failed:', error);
    }
  }

  /**
   * Get comprehensive system health
   */
  async getSystemHealth(): Promise<{
    storage: { used: number; keys: number; health: string };
    performance: { avgResponseTime: number; errorRate: number };
    data: { users: number; posts: number; actions: number };
  }> {
    try {
      const startTime = Date.now();
      
      // Get key counts
      const [userKeys, postKeys, actionKeys] = await Promise.all([
        kv.keys('user:*'),
        kv.keys('post:*'),
        kv.keys('reputation:action:*')
      ]);
      
      const responseTime = Date.now() - startTime;
      
      return {
        storage: {
          used: 0, // KV doesn't provide size info
          keys: userKeys.length + postKeys.length + actionKeys.length,
          health: responseTime < 100 ? 'excellent' : responseTime < 500 ? 'good' : 'slow'
        },
        performance: {
          avgResponseTime: responseTime,
          errorRate: 0 // TODO: Track from error logs
        },
        data: {
          users: userKeys.length,
          posts: postKeys.length,
          actions: actionKeys.length
        }
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        storage: { used: 0, keys: 0, health: 'error' },
        performance: { avgResponseTime: 0, errorRate: 100 },
        data: { users: 0, posts: 0, actions: 0 }
      };
    }
  }
}

// Global data layer instance
let globalDataLayer: DataLayer | null = null;

export function getDataLayer(): DataLayer {
  if (!globalDataLayer) {
    globalDataLayer = new DataLayer();
  }
  return globalDataLayer;
}

export default DataLayer;
