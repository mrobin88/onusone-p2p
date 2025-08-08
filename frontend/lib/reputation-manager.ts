/**
 * Real Reputation Management System for OnusOne
 * Tracks user behavior and calculates reputation scores based on contributions
 */

export interface ReputationAction {
  id: string;
  userId: string;
  action: ReputationActionType;
  points: number;
  reason: string;
  timestamp: string;
  relatedContent?: string; // postId, commentId, etc.
  metadata?: Record<string, any>;
}

export enum ReputationActionType {
  // Positive actions
  POST_CREATE = 'post_create',
  POST_LIKED = 'post_liked',
  POST_SHARED = 'post_shared',
  COMMENT_CREATE = 'comment_create',
  COMMENT_LIKED = 'comment_liked',
  STAKE_TOKENS = 'stake_tokens',
  DAILY_LOGIN = 'daily_login',
  CONTENT_FEATURED = 'content_featured',
  HELPFUL_REPLY = 'helpful_reply',
  COMMUNITY_CONTRIBUTION = 'community_contribution',
  
  // Negative actions
  POST_FLAGGED = 'post_flagged',
  COMMENT_FLAGGED = 'comment_flagged',
  SPAM_DETECTED = 'spam_detected',
  CONTENT_REMOVED = 'content_removed',
  EXCESSIVE_POSTING = 'excessive_posting',
  LOW_QUALITY_CONTENT = 'low_quality_content',
  
  // Neutral actions (tracking only)
  POST_VIEW = 'post_view',
  PROFILE_VIEW = 'profile_view',
  SEARCH_PERFORMED = 'search_performed'
}

export interface UserReputation {
  userId: string;
  currentScore: number;
  totalPoints: number;
  rank: string;
  percentile: number;
  actionsCount: number;
  lastActivity: string;
  joinedDate: string;
  badges: string[];
  stats: {
    postsCreated: number;
    postsLiked: number;
    commentsCreated: number;
    tokensStaked: number;
    daysActive: number;
    helpfulReplies: number;
    contentFeatured: number;
    flagsReceived: number;
  };
}

export interface ReputationConfig {
  // Score ranges for ranks
  ranks: {
    [key: string]: { min: number; max: number; color: string; };
  };
  
  // Points awarded for actions
  actionPoints: {
    [key in ReputationActionType]: number;
  };
  
  // Reputation settings
  settings: {
    initialScore: number;
    maxScore: number;
    minScore: number;
    decayRate: number; // Points lost per day of inactivity
    decayGracePeriod: number; // Days before decay starts
    qualityThreshold: number; // Minimum score to avoid penalties
  };
}

// Default reputation configuration
export const DEFAULT_REPUTATION_CONFIG: ReputationConfig = {
  ranks: {
    'Newcomer': { min: 0, max: 99, color: '#6B7280' },
    'Contributor': { min: 100, max: 249, color: '#3B82F6' },
    'Regular': { min: 250, max: 499, color: '#10B981' },
    'Veteran': { min: 500, max: 999, color: '#F59E0B' },
    'Expert': { min: 1000, max: 1999, color: '#EF4444' },
    'Legend': { min: 2000, max: 4999, color: '#8B5CF6' },
    'Pioneer': { min: 5000, max: Infinity, color: '#F97316' }
  },
  
  actionPoints: {
    // Positive actions
    [ReputationActionType.POST_CREATE]: 5,
    [ReputationActionType.POST_LIKED]: 2,
    [ReputationActionType.POST_SHARED]: 3,
    [ReputationActionType.COMMENT_CREATE]: 2,
    [ReputationActionType.COMMENT_LIKED]: 1,
    [ReputationActionType.STAKE_TOKENS]: 10,
    [ReputationActionType.DAILY_LOGIN]: 1,
    [ReputationActionType.CONTENT_FEATURED]: 50,
    [ReputationActionType.HELPFUL_REPLY]: 15,
    [ReputationActionType.COMMUNITY_CONTRIBUTION]: 25,
    
    // Negative actions
    [ReputationActionType.POST_FLAGGED]: -10,
    [ReputationActionType.COMMENT_FLAGGED]: -5,
    [ReputationActionType.SPAM_DETECTED]: -25,
    [ReputationActionType.CONTENT_REMOVED]: -15,
    [ReputationActionType.EXCESSIVE_POSTING]: -5,
    [ReputationActionType.LOW_QUALITY_CONTENT]: -8,
    
    // Neutral actions
    [ReputationActionType.POST_VIEW]: 0,
    [ReputationActionType.PROFILE_VIEW]: 0,
    [ReputationActionType.SEARCH_PERFORMED]: 0
  },
  
  settings: {
    initialScore: 100,
    maxScore: 10000,
    minScore: 0,
    decayRate: 1, // 1 point per day
    decayGracePeriod: 7, // 7 days before decay starts
    qualityThreshold: 50 // Users below this face penalties
  }
};

/**
 * Reputation Manager - Client-side reputation utilities
 */
export class ReputationManager {
  private config: ReputationConfig;

  constructor(config: ReputationConfig = DEFAULT_REPUTATION_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate user's reputation rank based on score
   */
  calculateRank(score: number): { rank: string; color: string; progress: number } {
    for (const [rankName, rankData] of Object.entries(this.config.ranks)) {
      if (score >= rankData.min && score <= rankData.max) {
        // Calculate progress within this rank
        const progress = rankData.max === Infinity 
          ? 100 
          : Math.round(((score - rankData.min) / (rankData.max - rankData.min)) * 100);
        
        return {
          rank: rankName,
          color: rankData.color,
          progress
        };
      }
    }
    
    // Fallback to lowest rank
    const firstRank = Object.entries(this.config.ranks)[0];
    return {
      rank: firstRank[0],
      color: firstRank[1].color,
      progress: 0
    };
  }

  /**
   * Calculate reputation score based on user activities
   */
  calculateReputationScore(actions: ReputationAction[]): number {
    let totalScore = this.config.settings.initialScore;
    
    for (const action of actions) {
      const points = this.config.actionPoints[action.action] || 0;
      totalScore += points;
    }
    
    // Apply bounds
    return Math.max(
      this.config.settings.minScore,
      Math.min(totalScore, this.config.settings.maxScore)
    );
  }

  /**
   * Calculate reputation decay based on inactivity
   */
  calculateDecay(lastActivityDate: string): number {
    const lastActivity = new Date(lastActivityDate);
    const now = new Date();
    const daysSinceActivity = Math.floor(
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceActivity <= this.config.settings.decayGracePeriod) {
      return 0; // No decay during grace period
    }
    
    const decayDays = daysSinceActivity - this.config.settings.decayGracePeriod;
    return decayDays * this.config.settings.decayRate;
  }

  /**
   * Get points for a specific action
   */
  getActionPoints(action: ReputationActionType): number {
    return this.config.actionPoints[action] || 0;
  }

  /**
   * Check if user qualifies for specific badges
   */
  calculateBadges(reputation: UserReputation): string[] {
    const badges: string[] = [];
    const { stats, currentScore } = reputation;
    
    // Activity badges
    if (stats.postsCreated >= 100) badges.push('Prolific Writer');
    if (stats.postsCreated >= 500) badges.push('Content Machine');
    if (stats.postsLiked >= 1000) badges.push('Community Favorite');
    if (stats.commentsCreated >= 500) badges.push('Active Discusser');
    if (stats.tokensStaked >= 10000) badges.push('Big Stakeholder');
    if (stats.helpfulReplies >= 50) badges.push('Helper');
    if (stats.contentFeatured >= 10) badges.push('Quality Creator');
    if (stats.daysActive >= 365) badges.push('Year One');
    
    // Reputation badges
    if (currentScore >= 1000) badges.push('Highly Respected');
    if (currentScore >= 2500) badges.push('Community Leader');
    if (currentScore >= 5000) badges.push('Platform Pioneer');
    
    // Quality badges
    if (stats.flagsReceived === 0 && stats.postsCreated >= 50) badges.push('Clean Record');
    if (stats.postsLiked / Math.max(stats.postsCreated, 1) >= 5) badges.push('Quality Focus');
    
    return badges;
  }

  /**
   * Generate reputation summary for display
   */
  generateSummary(reputation: UserReputation): {
    rank: ReturnType<ReputationManager['calculateRank']>;
    badges: string[];
    nextRankPoints: number;
    recentTrend: 'up' | 'down' | 'stable';
    strengths: string[];
    suggestions: string[];
  } {
    const rank = this.calculateRank(reputation.currentScore);
    const badges = this.calculateBadges(reputation);
    
    // Calculate points needed for next rank
    let nextRankPoints = 0;
    const ranks = Object.entries(this.config.ranks);
    for (let i = 0; i < ranks.length; i++) {
      if (ranks[i][0] === rank.rank && i < ranks.length - 1) {
        nextRankPoints = ranks[i + 1][1].min - reputation.currentScore;
        break;
      }
    }
    
    // Analyze user strengths
    const strengths: string[] = [];
    if (reputation.stats.postsLiked / Math.max(reputation.stats.postsCreated, 1) >= 3) {
      strengths.push('High-quality content creation');
    }
    if (reputation.stats.helpfulReplies >= 20) {
      strengths.push('Helpful community member');
    }
    if (reputation.stats.tokensStaked >= 1000) {
      strengths.push('Active token staker');
    }
    if (reputation.stats.daysActive >= 30) {
      strengths.push('Consistent participation');
    }
    
    // Generate suggestions
    const suggestions: string[] = [];
    if (reputation.stats.postsCreated < 10) {
      suggestions.push('Create more posts to build reputation');
    }
    if (reputation.stats.commentsCreated < reputation.stats.postsCreated) {
      suggestions.push('Engage more with others\' content');
    }
    if (reputation.stats.tokensStaked < 500) {
      suggestions.push('Stake tokens on quality content');
    }
    if (reputation.stats.helpfulReplies < 5) {
      suggestions.push('Provide helpful replies to build community trust');
    }
    
    return {
      rank,
      badges,
      nextRankPoints: Math.max(0, nextRankPoints),
      recentTrend: 'stable', // TODO: Calculate from recent actions
      strengths,
      suggestions
    };
  }

  /**
   * Validate reputation action data
   */
  validateAction(action: Partial<ReputationAction>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!action.userId) errors.push('User ID is required');
    if (!action.action) errors.push('Action type is required');
    if (!Object.values(ReputationActionType).includes(action.action as ReputationActionType)) {
      errors.push('Invalid action type');
    }
    if (action.points !== undefined && typeof action.points !== 'number') {
      errors.push('Points must be a number');
    }
    if (!action.reason) errors.push('Reason is required');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a reputation action record
   */
  createAction(
    userId: string,
    action: ReputationActionType,
    reason: string,
    relatedContent?: string,
    metadata?: Record<string, any>
  ): ReputationAction {
    return {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      points: this.getActionPoints(action),
      reason,
      timestamp: new Date().toISOString(),
      relatedContent,
      metadata
    };
  }
}

// Export global instance
export const reputationManager = new ReputationManager();
export default ReputationManager;
