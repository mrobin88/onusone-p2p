/**
 * OnusOne Decay Algorithm - Core Innovation
 * Ported from Django models to pure TypeScript
 * 
 * This algorithm determines content visibility based on:
 * 1. Natural decay over time (-1 point per hour)
 * 2. Community engagement boosts (+2 to +5 points)
 * 3. Quality content survives, noise disappears
 */

export interface DecayConfig {
  baseDecayRate: number; // Base decay rate per time unit
  engagementMultiplier: number; // Multiplier for engagement score
  reputationMultiplier: number; // Multiplier for reputation score
  timeFactor: number; // Time decay factor
  minDecayScore: number; // Minimum decay score before expiration
  maxLifetime: number; // Maximum lifetime in milliseconds
  emergencyDecayRate: number; // Accelerated decay during emergencies
}

export interface StakeInfo {
  id: string;
  amount: number;
  stakedAt: number;
  engagementScore: number;
  reputationScore: number;
  lastEngagementUpdate: number;
  decayScore: number;
  isExpired: boolean;
  emergencyMode: boolean;
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  timeSpent: number; // in milliseconds
  uniqueEngagers: number;
}

export interface ReputationMetrics {
  totalStakes: number;
  successfulStakes: number;
  failedStakes: number;
  averageEngagement: number;
  networkContribution: number;
  lastActivity: number;
}

export class DecayEngine {
  private config: DecayConfig;
  private stakes: Map<string, StakeInfo> = new Map();
  private engagementHistory: Map<string, EngagementMetrics[]> = new Map();
  private reputationHistory: Map<string, ReputationMetrics[]> = new Map();

  constructor(config: Partial<DecayConfig> = {}) {
    this.config = {
      baseDecayRate: 0.001, // 0.1% per time unit
      engagementMultiplier: 1.0,
      reputationMultiplier: 1.0,
      timeFactor: 1.0,
      minDecayScore: 0.1,
      maxLifetime: 7 * 24 * 60 * 60 * 1000, // 7 days
      emergencyDecayRate: 0.01, // 1% per time unit during emergencies
      ...config
    };
  }

  /**
   * Create a new stake with initial decay parameters
   */
  createStake(
    stakeId: string,
    amount: number,
    initialReputation: number = 50
  ): StakeInfo {
    const now = Date.now();
    
    const stakeInfo: StakeInfo = {
      id: stakeId,
      amount,
      stakedAt: now,
      engagementScore: 0,
      reputationScore: initialReputation,
      lastEngagementUpdate: now,
      decayScore: amount, // Start with full stake amount
      isExpired: false,
      emergencyMode: false
    };

    this.stakes.set(stakeId, stakeInfo);
    this.engagementHistory.set(stakeId, []);
    this.reputationHistory.set(stakeId, []);

    return stakeInfo;
  }

  /**
   * Update engagement metrics for a stake
   */
  updateEngagement(
    stakeId: string,
    engagement: Partial<EngagementMetrics>
  ): void {
    const stake = this.stakes.get(stakeId);
    if (!stake) {
      throw new Error(`Stake not found: ${stakeId}`);
    }

    const currentEngagement = this.engagementHistory.get(stakeId) || [];
    const newEngagement: EngagementMetrics = {
      likes: engagement.likes || 0,
      comments: engagement.comments || 0,
      shares: engagement.shares || 0,
      views: engagement.views || 0,
      timeSpent: engagement.timeSpent || 0,
      uniqueEngagers: engagement.uniqueEngagers || 0
    };

    currentEngagement.push(newEngagement);
    this.engagementHistory.set(stakeId, currentEngagement);

    // Calculate new engagement score
    stake.engagementScore = this.calculateEngagementScore(newEngagement);
    stake.lastEngagementUpdate = Date.now();

    // Recalculate decay score
    this.recalculateDecayScore(stakeId);
  }

  /**
   * Update reputation metrics for a user
   */
  updateReputation(
    userId: string,
    reputation: Partial<ReputationMetrics>
  ): void {
    const currentReputation = this.reputationHistory.get(userId) || [];
    const newReputation: ReputationMetrics = {
      totalStakes: reputation.totalStakes || 0,
      successfulStakes: reputation.successfulStakes || 0,
      failedStakes: reputation.failedStakes || 0,
      averageEngagement: reputation.averageEngagement || 0,
      networkContribution: reputation.networkContribution || 0,
      lastActivity: Date.now()
    };

    currentReputation.push(newReputation);
    this.reputationHistory.set(userId, currentReputation);

    // Update reputation for all user's stakes
    for (const stake of this.stakes.values()) {
      if (stake.id.includes(userId)) {
        stake.reputationScore = this.calculateReputationScore(newReputation);
        this.recalculateDecayScore(stake.id);
      }
    }
  }

  /**
   * Calculate current decay score using the exact formula from documentation
   * decayScore = (baseStake * engagementMultiplier) / (timeFactor * reputationMultiplier)
   */
  calculateDecayScore(stakeId: string): number {
    const stake = this.stakes.get(stakeId);
    if (!stake) {
      throw new Error(`Stake not found: ${stakeId}`);
    }

    const now = Date.now();
    const timeElapsed = now - stake.stakedAt;
    
    // Calculate time factor (exponential decay)
    const timeFactor = Math.exp(this.config.timeFactor * timeElapsed / (24 * 60 * 60 * 1000)); // Daily decay
    
    // Calculate engagement multiplier
    const engagementMultiplier = 1 + (stake.engagementScore / 100) * this.config.engagementMultiplier;
    
    // Calculate reputation multiplier
    const reputationMultiplier = 1 + (stake.reputationScore / 100) * this.config.reputationMultiplier;
    
    // Apply emergency mode if active
    const emergencyMultiplier = stake.emergencyMode ? this.config.emergencyDecayRate : 1;
    
    // Calculate decay score using the exact formula
    const decayScore = (stake.amount * engagementMultiplier) / (timeFactor * reputationMultiplier * emergencyMultiplier);
    
    // Ensure decay score doesn't go below minimum
    const finalDecayScore = Math.max(decayScore, stake.amount * this.config.minDecayScore);
    
    return finalDecayScore;
  }

  /**
   * Recalculate decay score for a stake
   */
  private recalculateDecayScore(stakeId: string): void {
    const stake = this.stakes.get(stakeId);
    if (!stake) return;

    stake.decayScore = this.calculateDecayScore(stakeId);
    
    // Check if stake has expired
    if (stake.decayScore <= stake.amount * this.config.minDecayScore) {
      stake.isExpired = true;
    }
    
    // Check if maximum lifetime exceeded
    const now = Date.now();
    if (now - stake.stakedAt > this.config.maxLifetime) {
      stake.isExpired = true;
    }
  }

  /**
   * Calculate engagement score from metrics
   */
  private calculateEngagementScore(engagement: EngagementMetrics): number {
    let score = 0;
    
    // Weighted scoring system
    score += engagement.likes * 1;
    score += engagement.comments * 3;
    score += engagement.shares * 5;
    score += engagement.views * 0.1;
    score += (engagement.timeSpent / 60000) * 0.5; // 1 point per minute
    score += engagement.uniqueEngagers * 2;
    
    // Normalize to 0-100 range
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate reputation score from metrics
   */
  private calculateReputationScore(reputation: ReputationMetrics): number {
    let score = 50; // Base score
    
    // Success rate bonus
    if (reputation.totalStakes > 0) {
      const successRate = reputation.successfulStakes / reputation.totalStakes;
      score += successRate * 20;
    }
    
    // Engagement bonus
    score += Math.min(reputation.averageEngagement / 10, 20);
    
    // Network contribution bonus
    score += Math.min(reputation.networkContribution / 100, 10);
    
    // Activity penalty (decay over time)
    const daysSinceActivity = (Date.now() - reputation.lastActivity) / (24 * 60 * 60 * 1000);
    if (daysSinceActivity > 30) {
      score -= Math.min(daysSinceActivity - 30, 20);
    }
    
    // Normalize to 0-100 range
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Activate emergency mode for a stake (accelerated decay)
   */
  activateEmergencyMode(stakeId: string): void {
    const stake = this.stakes.get(stakeId);
    if (!stake) {
      throw new Error(`Stake not found: ${stakeId}`);
    }

    stake.emergencyMode = true;
    this.recalculateDecayScore(stakeId);
  }

  /**
   * Deactivate emergency mode for a stake
   */
  deactivateEmergencyMode(stakeId: string): void {
    const stake = this.stakes.get(stakeId);
    if (!stake) {
      throw new Error(`Stake not found: ${stakeId}`);
    }

    stake.emergencyMode = false;
    this.recalculateDecayScore(stakeId);
  }

  /**
   * Get all expired stakes
   */
  getExpiredStakes(): StakeInfo[] {
    return Array.from(this.stakes.values()).filter(stake => stake.isExpired);
  }

  /**
   * Get stakes expiring soon (within specified time)
   */
  getStakesExpiringSoon(withinMs: number): StakeInfo[] {
    const now = Date.now();
    return Array.from(this.stakes.values()).filter(stake => {
      if (stake.isExpired) return false;
      
      const timeToExpiry = this.estimateTimeToExpiry(stake.id);
      return timeToExpiry <= withinMs;
    });
  }

  /**
   * Estimate time until stake expires
   */
  estimateTimeToExpiry(stakeId: string): number {
    const stake = this.stakes.get(stakeId);
    if (!stake || stake.isExpired) return 0;

    const currentDecayScore = stake.decayScore;
    const targetDecayScore = stake.amount * this.config.minDecayScore;
    
    if (currentDecayScore <= targetDecayScore) return 0;

    // Estimate based on current decay rate
    const decayRate = this.config.baseDecayRate;
    const timeToExpiry = Math.log(currentDecayScore / targetDecayScore) / decayRate;
    
    return Math.max(0, timeToExpiry * (24 * 60 * 60 * 1000)); // Convert to milliseconds
  }

  /**
   * Get decay statistics for a stake
   */
  getDecayStats(stakeId: string): {
    currentScore: number;
    initialAmount: number;
    decayPercentage: number;
    timeElapsed: number;
    estimatedExpiry: number;
    engagementScore: number;
    reputationScore: number;
  } {
    const stake = this.stakes.get(stakeId);
    if (!stake) {
      throw new Error(`Stake not found: ${stakeId}`);
    }

    const now = Date.now();
    const timeElapsed = now - stake.stakedAt;
    const decayPercentage = ((stake.amount - stake.decayScore) / stake.amount) * 100;

    return {
      currentScore: stake.decayScore,
      initialAmount: stake.amount,
      decayPercentage,
      timeElapsed,
      estimatedExpiry: this.estimateTimeToExpiry(stakeId),
      engagementScore: stake.engagementScore,
      reputationScore: stake.reputationScore
    };
  }

  /**
   * Get all stakes for a user
   */
  getUserStakes(userId: string): StakeInfo[] {
    return Array.from(this.stakes.values()).filter(stake => 
      stake.id.includes(userId)
    );
  }

  /**
   * Get network-wide decay statistics
   */
  getNetworkDecayStats(): {
    totalStakes: number;
    activeStakes: number;
    expiredStakes: number;
    totalStakedAmount: number;
    totalDecayedAmount: number;
    averageDecayRate: number;
    emergencyModeStakes: number;
  } {
    const stakes = Array.from(this.stakes.values());
    const totalStakes = stakes.length;
    const activeStakes = stakes.filter(s => !s.isExpired).length;
    const expiredStakes = stakes.filter(s => s.isExpired).length;
    const totalStakedAmount = stakes.reduce((sum, s) => sum + s.amount, 0);
    const totalDecayedAmount = stakes.reduce((sum, s) => sum + (s.amount - s.decayScore), 0);
    const emergencyModeStakes = stakes.filter(s => s.emergencyMode).length;

    const averageDecayRate = totalStakedAmount > 0 ? 
      (totalDecayedAmount / totalStakedAmount) * 100 : 0;

    return {
      totalStakes,
      activeStakes,
      expiredStakes,
      totalStakedAmount,
      totalDecayedAmount,
      averageDecayRate,
      emergencyModeStakes
    };
  }

  /**
   * Clean up expired stakes
   */
  cleanupExpiredStakes(): string[] {
    const expiredIds: string[] = [];
    
    for (const [stakeId, stake] of this.stakes.entries()) {
      if (stake.isExpired) {
        expiredIds.push(stakeId);
        this.stakes.delete(stakeId);
        this.engagementHistory.delete(stakeId);
      }
    }

    return expiredIds;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DecayConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Recalculate all decay scores with new config
    for (const stakeId of this.stakes.keys()) {
      this.recalculateDecayScore(stakeId);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): DecayConfig {
    return { ...this.config };
  }

  /**
   * Export all stake data
   */
  exportData(): {
    stakes: Map<string, StakeInfo>;
    engagementHistory: Map<string, EngagementMetrics[]>;
    reputationHistory: Map<string, ReputationMetrics[]>;
    config: DecayConfig;
  } {
    return {
      stakes: new Map(this.stakes),
      engagementHistory: new Map(this.engagementHistory),
      reputationHistory: new Map(this.reputationHistory),
      config: { ...this.config }
    };
  }

  /**
   * Import stake data
   */
  importData(data: {
    stakes: Map<string, StakeInfo>;
    engagementHistory: Map<string, EngagementMetrics[]>;
    reputationHistory: Map<string, ReputationMetrics[]>;
    config?: Partial<DecayConfig>;
  }): void {
    this.stakes = new Map(data.stakes);
    this.engagementHistory = new Map(data.engagementHistory);
    this.reputationHistory = new Map(data.reputationHistory);
    
    if (data.config) {
      this.updateConfig(data.config);
    }
  }
}