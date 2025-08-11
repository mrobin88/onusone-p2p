/**
 * Enhanced Economics System - Unified, Sophisticated Token Economics
 * 
 * Features:
 * - Network-aware payout scaling
 * - Intelligent decay acceleration
 * - Stake pooling with diminishing returns
 * - Dynamic tax rates based on network health
 * - Real-time economic metrics
 * - Sophisticated reward distribution
 */

import { EventEmitter } from 'events';

export interface NetworkMetrics {
  totalNodes: number;
  activeNodes: number;
  totalStaked: number;
  networkHealth: number; // 0-100
  messageVolume: number;
  averageLatency: number;
  uptimePercentage: number;
  lastUpdate: number;
}

export interface StakePool {
  id: string;
  totalStaked: number;
  participantCount: number;
  averageStake: number;
  poolMultiplier: number;
  lastActivity: number;
  performanceScore: number;
}

export interface EconomicConfig {
  // Base rates
  baseNodeReward: number; // ONU per hour
  baseStakeReward: number; // APY for staking
  
  // Pooling configuration
  minPoolSize: number;
  maxPoolSize: number;
  poolBonusThreshold: number;
  
  // Decay configuration
  baseDecayRate: number;
  emergencyDecayMultiplier: number;
  qualityDecayReduction: number;
  
  // Tax configuration
  baseTaxRate: number;
  networkHealthTaxAdjustment: number;
  stakeSizeTaxAdjustment: number;
  
  // Reward distribution
  nodeOperatorShare: number; // 70%
  stakerShare: number; // 20%
  treasuryShare: number; // 10%
  
  // Network scaling
  maxNetworkCapacity: number;
  scalingThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface UserEconomicProfile {
  userId: string;
  totalStaked: number;
  activeStakes: number;
  nodeUptime: number;
  reputationScore: number;
  totalEarnings: number;
  lastPayout: number;
  performanceMultiplier: number;
  taxRate: number;
}

export interface PayoutCalculation {
  userId: string;
  baseReward: number;
  performanceBonus: number;
  networkBonus: number;
  poolBonus: number;
  taxDeduction: number;
  finalPayout: number;
  breakdown: {
    nodeOperation: number;
    staking: number;
    networkContribution: number;
    poolParticipation: number;
  };
}

export interface DecayAcceleration {
  stakeId: string;
  currentDecayScore: number;
  accelerationFactor: number;
  reason: 'network_congestion' | 'quality_degradation' | 'emergency_mode' | 'manual_override';
  estimatedExpiry: number;
  recommendedAction: string;
}

export class EnhancedEconomics extends EventEmitter {
  private config: EconomicConfig;
  private networkMetrics: NetworkMetrics;
  private stakePools: Map<string, StakePool> = new Map();
  private userProfiles: Map<string, UserEconomicProfile> = new Map();
  private activeStakes: Map<string, any> = new Map();
  
  // Real-time economic state
  private totalSupply: number = 1_000_000_000;
  private circulatingSupply: number = 1_000_000;
  private burnedTokens: number = 0;
  private treasuryBalance: number = 0;
  
  // Performance tracking
  private lastPayoutCycle: number = Date.now();
  private payoutCycleDuration: number = 3600000; // 1 hour
  private totalPayoutsThisCycle: number = 0;

  constructor(config: Partial<EconomicConfig> = {}) {
    super();
    
    this.config = {
      baseNodeReward: 0.5,
      baseStakeReward: 0.08, // 8% APY
      minPoolSize: 100,
      maxPoolSize: 10000,
      poolBonusThreshold: 1000,
      baseDecayRate: 0.001,
      emergencyDecayMultiplier: 5,
      qualityDecayReduction: 0.5,
      baseTaxRate: 0.15, // 15%
      networkHealthTaxAdjustment: 0.1,
      stakeSizeTaxAdjustment: 0.05,
      nodeOperatorShare: 0.7,
      stakerShare: 0.2,
      treasuryShare: 0.1,
      maxNetworkCapacity: 10000,
      scalingThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.8,
        critical: 0.95
      },
      ...config
    };

    this.networkMetrics = this.getDefaultNetworkMetrics();
    
    // Start economic cycles
    this.startEconomicCycles();
  }

  /**
   * Update network metrics from P2P network
   */
  updateNetworkMetrics(metrics: Partial<NetworkMetrics>): void {
    this.networkMetrics = { ...this.networkMetrics, ...metrics, lastUpdate: Date.now() };
    
    // Emit network update event
    this.emit('network:updated', this.networkMetrics);
    
    // Adjust economic parameters based on network health
    this.adjustEconomicParameters();
  }

  /**
   * Create or join a stake pool
   */
  createStakePool(userId: string, stakeAmount: number): StakePool {
    const poolId = `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pool: StakePool = {
      id: poolId,
      totalStaked: stakeAmount,
      participantCount: 1,
      averageStake: stakeAmount,
      poolMultiplier: this.calculatePoolMultiplier(stakeAmount),
      lastActivity: Date.now(),
      performanceScore: 100
    };

    this.stakePools.set(poolId, pool);
    
    // Update user profile
    this.updateUserProfile(userId, { activeStakes: 1 });
    
    this.emit('pool:created', pool);
    return pool;
  }

  /**
   * Join existing stake pool
   */
  joinStakePool(poolId: string, userId: string, stakeAmount: number): boolean {
    const pool = this.stakePools.get(poolId);
    if (!pool || pool.participantCount >= this.config.maxPoolSize) {
      return false;
    }

    // Update pool
    pool.totalStaked += stakeAmount;
    pool.participantCount += 1;
    pool.averageStake = pool.totalStaked / pool.participantCount;
    pool.poolMultiplier = this.calculatePoolMultiplier(pool.totalStaked);
    pool.lastActivity = Date.now();

    // Update user profile
    this.updateUserProfile(userId, { activeStakes: 1 });
    
    this.emit('pool:joined', { poolId, userId, stakeAmount });
    return true;
  }

  /**
   * Calculate pool multiplier based on total staked
   */
  private calculatePoolMultiplier(totalStaked: number): number {
    if (totalStaked >= this.config.poolBonusThreshold) {
      return 1 + Math.log10(totalStaked / this.config.poolBonusThreshold) * 0.2;
    }
    return 1.0;
  }

  /**
   * Calculate user's tax rate based on network health and stake size
   */
  calculateUserTaxRate(userId: string): number {
    const profile = this.userProfiles.get(userId);
    if (!profile) return this.config.baseTaxRate;

    let taxRate = this.config.baseTaxRate;

    // Network health adjustment
    const networkHealthFactor = (100 - this.networkMetrics.networkHealth) / 100;
    taxRate += networkHealthFactor * this.config.networkHealthTaxAdjustment;

    // Stake size adjustment (larger stakes pay slightly higher taxes)
    const stakeSizeFactor = Math.min(profile.totalStaked / 10000, 1);
    taxRate += stakeSizeFactor * this.config.stakeSizeTaxAdjustment;

    // Cap at 30%
    return Math.min(taxRate, 0.30);
  }

  /**
   * Calculate decay acceleration based on network conditions
   */
  calculateDecayAcceleration(stakeId: string, currentDecayScore: number): DecayAcceleration {
    const networkCongestion = this.networkMetrics.messageVolume / this.config.maxNetworkCapacity;
    const networkHealth = this.networkMetrics.networkHealth / 100;
    
    let accelerationFactor = 1.0;
    let reason: DecayAcceleration['reason'] = 'manual_override';
    
    // Network congestion acceleration
    if (networkCongestion > this.config.scalingThresholds.critical) {
      accelerationFactor = this.config.emergencyDecayMultiplier;
      reason = 'emergency_mode';
    } else if (networkCongestion > this.config.scalingThresholds.high) {
      accelerationFactor = 2.0;
      reason = 'network_congestion';
    }
    
    // Quality-based acceleration (lower quality content decays faster)
    if (currentDecayScore < 30) {
      accelerationFactor *= 1.5;
      reason = 'quality_degradation';
    }
    
    // Network health bonus (healthy networks slow decay)
    if (networkHealth > 0.8) {
      accelerationFactor *= 0.8;
    }
    
    const estimatedExpiry = this.estimateStakeExpiry(stakeId, accelerationFactor);
    
    return {
      stakeId,
      currentDecayScore,
      accelerationFactor,
      reason,
      estimatedExpiry,
      recommendedAction: this.getRecommendedAction(accelerationFactor, reason)
    };
  }

  /**
   * Estimate when a stake will expire based on acceleration
   */
  private estimateStakeExpiry(stakeId: string, accelerationFactor: number): number {
    const stake = this.activeStakes.get(stakeId);
    if (!stake) return Date.now();

    const baseDecayTime = 24 * 60 * 60 * 1000; // 24 hours base
    const acceleratedDecayTime = baseDecayTime / accelerationFactor;
    
    return Date.now() + acceleratedDecayTime;
  }

  /**
   * Get recommended action based on decay acceleration
   */
  private getRecommendedAction(accelerationFactor: number, reason: string): string {
    if (accelerationFactor > 3) {
      return 'Consider unstaking to preserve tokens - network under heavy load';
    } else if (accelerationFactor > 2) {
      return 'Monitor closely - accelerated decay active';
    } else if (accelerationFactor > 1.5) {
      return 'Moderate acceleration - consider boosting content quality';
    } else {
      return 'Normal decay rate - no action needed';
    }
  }

  /**
   * Calculate comprehensive payout for a user
   */
  calculateUserPayout(userId: string): PayoutCalculation {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error(`User profile not found: ${userId}`);
    }

    const now = Date.now();
    const timeSinceLastPayout = now - profile.lastPayout;
    const hoursSinceLastPayout = timeSinceLastPayout / (1000 * 60 * 60);

    // Base rewards
    const nodeOperationReward = this.calculateNodeOperationReward(profile, hoursSinceLastPayout);
    const stakingReward = this.calculateStakingReward(profile, hoursSinceLastPayout);
    const networkContributionReward = this.calculateNetworkContributionReward(profile);
    const poolParticipationReward = this.calculatePoolParticipationReward(userId);

    // Calculate bonuses
    const performanceBonus = this.calculatePerformanceBonus(profile);
    const networkBonus = this.calculateNetworkBonus();
    const poolBonus = this.calculatePoolBonus(userId);

    // Calculate total before taxes
    const totalBeforeTax = nodeOperationReward + stakingReward + networkContributionReward + 
                           poolParticipationReward + performanceBonus + networkBonus + poolBonus;

    // Apply taxes
    const taxRate = this.calculateUserTaxRate(userId);
    const taxDeduction = totalBeforeTax * taxRate;
    const finalPayout = totalBeforeTax - taxDeduction;

    const calculation: PayoutCalculation = {
      userId,
      baseReward: totalBeforeTax,
      performanceBonus,
      networkBonus,
      poolBonus,
      taxDeduction,
      finalPayout,
      breakdown: {
        nodeOperation: nodeOperationReward,
        staking: stakingReward,
        networkContribution: networkContributionReward,
        poolParticipation: poolParticipationReward
      }
    };

    // Update user profile
    this.updateUserProfile(userId, {
      totalEarnings: profile.totalEarnings + finalPayout,
      lastPayout: now
    });

    this.emit('payout:calculated', calculation);
    return calculation;
  }

  /**
   * Calculate node operation reward
   */
  private calculateNodeOperationReward(profile: UserEconomicProfile, hours: number): number {
    const baseReward = this.config.baseNodeReward * hours;
    const uptimeMultiplier = Math.min(profile.nodeUptime / 100, 1.5);
    return baseReward * uptimeMultiplier * profile.performanceMultiplier;
  }

  /**
   * Calculate staking reward
   */
  private calculateStakingReward(profile: UserEconomicProfile, hours: number): number {
    const dailyRate = this.config.baseStakeReward / 365;
    const hourlyRate = dailyRate / 24;
    return profile.totalStaked * hourlyRate * hours;
  }

  /**
   * Calculate network contribution reward
   */
  private calculateNetworkContributionReward(profile: UserEconomicProfile): number {
    const networkHealth = this.networkMetrics.networkHealth / 100;
    const contributionScore = profile.reputationScore / 100;
    return this.config.baseNodeReward * networkHealth * contributionScore;
  }

  /**
   * Calculate pool participation reward
   */
  private calculatePoolParticipationReward(userId: string): number {
    let totalPoolBonus = 0;
    
    for (const pool of this.stakePools.values()) {
      // Find user's stake in this pool
      const userStake = this.getUserStakeInPool(userId, pool.id);
      if (userStake > 0) {
        const poolReward = userStake * (pool.poolMultiplier - 1) * this.config.baseStakeReward / 365;
        totalPoolBonus += poolReward;
      }
    }
    
    return totalPoolBonus;
  }

  /**
   * Calculate performance bonus
   */
  private calculatePerformanceBonus(profile: UserEconomicProfile): number {
    const performanceScore = profile.performanceMultiplier;
    if (performanceScore > 1.2) return this.config.baseNodeReward * 0.5;
    if (performanceScore > 1.0) return this.config.baseNodeReward * 0.2;
    return 0;
  }

  /**
   * Calculate network bonus
   */
  private calculateNetworkBonus(): number {
    const networkHealth = this.networkMetrics.networkHealth / 100;
    if (networkHealth > 0.9) return this.config.baseNodeReward * 0.3;
    if (networkHealth > 0.7) return this.config.baseNodeReward * 0.1;
    return 0;
  }

  /**
   * Calculate pool bonus
   */
  private calculatePoolBonus(userId: string): number {
    let totalBonus = 0;
    
    for (const pool of this.stakePools.values()) {
      if (pool.participantCount >= this.config.minPoolSize) {
        const userStake = this.getUserStakeInPool(userId, pool.id);
        if (userStake > 0) {
          const poolBonus = userStake * 0.01 * (pool.poolMultiplier - 1);
          totalBonus += poolBonus;
        }
      }
    }
    
    return totalBonus;
  }

  /**
   * Get user's stake in a specific pool
   */
  private getUserStakeInPool(userId: string, poolId: string): number {
    // This would integrate with actual stake tracking
    // For now, return a placeholder
    return 100;
  }

  /**
   * Update user economic profile
   */
  updateUserProfile(userId: string, updates: Partial<UserEconomicProfile>): void {
    const existing = this.userProfiles.get(userId);
    const updated: UserEconomicProfile = {
      userId,
      totalStaked: 0,
      activeStakes: 0,
      nodeUptime: 0,
      reputationScore: 50,
      totalEarnings: 0,
      lastPayout: Date.now(),
      performanceMultiplier: 1.0,
      taxRate: this.config.baseTaxRate,
      ...existing,
      ...updates
    };

    this.userProfiles.set(userId, updated);
    this.emit('profile:updated', updated);
  }

  /**
   * Adjust economic parameters based on network conditions
   */
  private adjustEconomicParameters(): void {
    const networkHealth = this.networkMetrics.networkHealth / 100;
    const messageVolume = this.networkMetrics.messageVolume / this.config.maxNetworkCapacity;

    // Adjust base rewards based on network health
    if (networkHealth < 0.5) {
      // Reduce rewards during poor network conditions
      this.config.baseNodeReward *= 0.8;
      this.config.baseStakeReward *= 0.9;
    } else if (networkHealth > 0.8) {
      // Increase rewards during excellent network conditions
      this.config.baseNodeReward *= 1.1;
      this.config.baseStakeReward *= 1.05;
    }

    // Adjust decay rates based on message volume
    if (messageVolume > this.config.scalingThresholds.critical) {
      this.config.emergencyDecayMultiplier = 10; // Very aggressive decay
    } else if (messageVolume > this.config.scalingThresholds.high) {
      this.config.emergencyDecayMultiplier = 5;
    } else {
      this.config.emergencyDecayMultiplier = 2;
    }

    this.emit('parameters:adjusted', this.config);
  }

  /**
   * Start economic cycles
   */
  private startEconomicCycles(): void {
    // Hourly payout cycle
    setInterval(() => {
      this.processPayoutCycle();
    }, this.payoutCycleDuration);

    // Daily economic adjustment
    setInterval(() => {
      this.performDailyAdjustments();
    }, 24 * 60 * 60 * 1000);

    // Real-time network monitoring
    setInterval(() => {
      this.monitorNetworkHealth();
    }, 60000); // Every minute
  }

  /**
   * Process payout cycle
   */
  private processPayoutCycle(): void {
    const now = Date.now();
    this.lastPayoutCycle = now;
    this.totalPayoutsThisCycle = 0;

    // Process payouts for all active users
    for (const [userId, profile] of this.userProfiles) {
      if (profile.nodeUptime > 0 || profile.totalStaked > 0) {
        try {
          const payout = this.calculateUserPayout(userId);
          this.totalPayoutsThisCycle += payout.finalPayout;
        } catch (error) {
          console.error(`Failed to process payout for user ${userId}:`, error);
        }
      }
    }

    // Update treasury
    this.treasuryBalance += this.totalPayoutsThisCycle * this.config.treasuryShare;

    this.emit('payout:cycle:completed', {
      timestamp: now,
      totalPayouts: this.totalPayoutsThisCycle,
      activeUsers: this.userProfiles.size
    });
  }

  /**
   * Perform daily economic adjustments
   */
  private performDailyAdjustments(): void {
    // Clean up expired stakes
    this.cleanupExpiredStakes();
    
    // Recalculate pool multipliers
    this.recalculatePoolMultipliers();
    
    // Adjust economic parameters
    this.adjustEconomicParameters();
    
    this.emit('daily:adjustments:completed', {
      timestamp: Date.now(),
      activeStakes: this.activeStakes.size,
      activePools: this.stakePools.size
    });
  }

  /**
   * Monitor network health
   */
  private monitorNetworkHealth(): void {
    // Simulate network health updates
    const healthVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
    this.networkMetrics.networkHealth = Math.max(0, Math.min(100, 
      this.networkMetrics.networkHealth + healthVariation * 100
    ));

    // Update message volume
    this.networkMetrics.messageVolume = Math.max(0, 
      this.networkMetrics.messageVolume + (Math.random() - 0.5) * 100
    );

    this.emit('network:health:updated', this.networkMetrics);
  }

  /**
   * Clean up expired stakes
   */
  private cleanupExpiredStakes(): void {
    const now = Date.now();
    const expiredStakes: string[] = [];

    for (const [stakeId, stake] of this.activeStakes) {
      if (stake.expiryTime && stake.expiryTime < now) {
        expiredStakes.push(stakeId);
      }
    }

    for (const stakeId of expiredStakes) {
      this.activeStakes.delete(stakeId);
    }

    if (expiredStakes.length > 0) {
      this.emit('stakes:expired', expiredStakes);
    }
  }

  /**
   * Recalculate pool multipliers
   */
  private recalculatePoolMultipliers(): void {
    for (const pool of this.stakePools.values()) {
      pool.poolMultiplier = this.calculatePoolMultiplier(pool.totalStaked);
    }
  }

  /**
   * Get default network metrics
   */
  private getDefaultNetworkMetrics(): NetworkMetrics {
    return {
      totalNodes: 100,
      activeNodes: 85,
      totalStaked: 50000,
      networkHealth: 85,
      messageVolume: 1000,
      averageLatency: 150,
      uptimePercentage: 92,
      lastUpdate: Date.now()
    };
  }

  /**
   * Get economic summary
   */
  getEconomicSummary(): {
    totalSupply: number;
    circulatingSupply: number;
    burnedTokens: number;
    treasuryBalance: number;
    totalStaked: number;
    activeUsers: number;
    networkHealth: number;
    lastPayoutCycle: number;
    totalPayoutsThisCycle: number;
  } {
    return {
      totalSupply: this.totalSupply,
      circulatingSupply: this.circulatingSupply,
      burnedTokens: this.burnedTokens,
      treasuryBalance: this.treasuryBalance,
      totalStaked: this.networkMetrics.totalStaked,
      activeUsers: this.userProfiles.size,
      networkHealth: this.networkMetrics.networkHealth,
      lastPayoutCycle: this.lastPayoutCycle,
      totalPayoutsThisCycle: this.totalPayoutsThisCycle
    };
  }

  /**
   * Get all stake pools
   */
  getStakePools(): StakePool[] {
    return Array.from(this.stakePools.values());
  }

  /**
   * Get user profile
   */
  getUserProfile(userId: string): UserEconomicProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Get network metrics
   */
  getNetworkMetrics(): NetworkMetrics {
    return { ...this.networkMetrics };
  }

  /**
   * Get economic configuration
   */
  getConfig(): EconomicConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const enhancedEconomics = new EnhancedEconomics();
export default EnhancedEconomics;
