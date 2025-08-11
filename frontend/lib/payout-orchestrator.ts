/**
 * Payout Orchestrator - Coordinates All Economic Systems for Sophisticated Payouts
 * 
 * Features:
 * - Real-time payout calculation
 * - Network-aware reward scaling
 * - Stake pooling coordination
 * - Decay acceleration integration
 * - Performance-based bonuses
 * - Dynamic tax adjustments
 * - Treasury management
 */

import { EventEmitter } from 'events';
import { enhancedEconomics, NetworkMetrics, PayoutCalculation, UserEconomicProfile } from './enhanced-economics';
import { enhancedDecay, DecayableContent, DecayMetrics } from './enhanced-decay';

export interface PayoutOrchestrationConfig {
  // Payout timing
  payoutInterval: number; // milliseconds
  batchSize: number; // users per batch
  
  // Performance thresholds
  minUptimeForRewards: number; // minimum uptime percentage
  minStakeForRewards: number; // minimum stake amount
  
  // Bonus multipliers
  uptimeBonusThreshold: number;
  reputationBonusThreshold: number;
  networkContributionBonus: number;
  
  // Emergency controls
  maxPayoutPerCycle: number;
  emergencyDecayThreshold: number;
  networkHealthThreshold: number;
}

export interface PayoutBatch {
  batchId: string;
  timestamp: number;
  userCount: number;
  totalPayouts: number;
  averagePayout: number;
  networkHealth: number;
  decayMetrics: DecayMetrics;
  completed: boolean;
  errors: string[];
}

export interface UserPayoutSummary {
  userId: string;
  totalEarnings: number;
  lastPayout: number;
  averagePayout: number;
  payoutCount: number;
  performanceScore: number;
  networkContribution: number;
  stakeUtilization: number;
}

export interface NetworkPayoutMetrics {
  totalPayouts: number;
  activeUsers: number;
  averagePayout: number;
  networkHealth: number;
  totalStaked: number;
  decayRate: number;
  treasuryBalance: number;
  circulatingSupply: number;
  timestamp: number;
}

export class PayoutOrchestrator extends EventEmitter {
  private config: PayoutOrchestrationConfig;
  private payoutHistory: PayoutBatch[] = [];
  private userPayoutSummaries: Map<string, UserPayoutSummary> = new Map();
  private isProcessing: boolean = false;
  private lastPayoutTime: number = 0;
  
  // Performance tracking
  private totalPayoutsProcessed: number = 0;
  private totalTokensDistributed: number = 0;
  private averageProcessingTime: number = 0;

  constructor(config: Partial<PayoutOrchestrationConfig> = {}) {
    super();
    
    this.config = {
      payoutInterval: 3600000, // 1 hour
      batchSize: 50,
      minUptimeForRewards: 70, // 70% uptime required
      minStakeForRewards: 10, // minimum 10 ONU staked
      uptimeBonusThreshold: 95, // 95% uptime for bonus
      reputationBonusThreshold: 80, // 80+ reputation for bonus
      networkContributionBonus: 0.1, // 10% bonus for network contribution
      maxPayoutPerCycle: 10000, // maximum 10k ONU per cycle
      emergencyDecayThreshold: 0.8, // 80% network congestion triggers emergency
      networkHealthThreshold: 0.3, // 30% network health triggers emergency
      ...config
    };

    // Start payout processing
    this.startPayoutProcessing();
    
    // Listen to system events
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for coordination
   */
  private setupEventListeners(): void {
    // Economic system events
    enhancedEconomics.on('network:updated', (metrics: NetworkMetrics) => {
      this.handleNetworkUpdate(metrics);
    });
    
    enhancedEconomics.on('payout:cycle:completed', (data) => {
      this.handleEconomicPayoutCycle(data);
    });
    
    // Decay system events
    enhancedDecay.on('content:decayed', (decayedContent: string[]) => {
      this.handleContentDecay(decayedContent);
    });
    
    enhancedDecay.on('acceleration:changed', (event) => {
      this.handleDecayAcceleration(event);
    });
    
    enhancedDecay.on('metrics:generated', (metrics: DecayMetrics) => {
      this.handleDecayMetrics(metrics);
    });
  }

  /**
   * Start payout processing
   */
  private startPayoutProcessing(): void {
    setInterval(() => {
      if (!this.isProcessing) {
        this.processPayoutCycle();
      }
    }, this.config.payoutInterval);
  }

  /**
   * Process complete payout cycle
   */
  async processPayoutCycle(): Promise<void> {
    if (this.isProcessing) {
      console.log('Payout cycle already in progress');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();
    const batchId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Get current network state
      const networkMetrics = enhancedEconomics.getNetworkMetrics();
      const decayMetrics = enhancedDecay.getDecayMetrics();
      
      // Check emergency conditions
      if (this.shouldTriggerEmergencyMode(networkMetrics, decayMetrics)) {
        await this.handleEmergencyMode(networkMetrics, decayMetrics);
        return;
      }
      
      // Get eligible users
      const eligibleUsers = this.getEligibleUsers();
      
      // Process payouts in batches
      const batches = this.createPayoutBatches(eligibleUsers, batchId);
      
      for (const batch of batches) {
        await this.processPayoutBatch(batch, networkMetrics, decayMetrics);
      }
      
      // Complete payout cycle
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      this.updatePerformanceMetrics(processingTime);
      this.lastPayoutTime = endTime;
      
      // Emit completion event
      this.emit('payout:cycle:completed', {
        batchId,
        processingTime,
        totalUsers: eligibleUsers.length,
        totalPayouts: this.totalPayoutsProcessed,
        networkMetrics,
        decayMetrics
      });
      
    } catch (error) {
      console.error('Error processing payout cycle:', error);
      this.emit('payout:cycle:error', { error, batchId });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Check if emergency mode should be triggered
   */
  private shouldTriggerEmergencyMode(networkMetrics: NetworkMetrics, decayMetrics: DecayMetrics): boolean {
    const networkCongestion = networkMetrics.messageVolume / networkMetrics.maxNetworkCapacity;
    const networkHealth = networkMetrics.networkHealth / 100;
    
    return (
      networkCongestion >= this.config.emergencyDecayThreshold ||
      networkHealth <= this.config.networkHealthThreshold ||
      decayMetrics.averageAccelerationFactor >= 5.0
    );
  }

  /**
   * Handle emergency mode
   */
  private async handleEmergencyMode(networkMetrics: NetworkMetrics, decayMetrics: DecayMetrics): Promise<void> {
    console.log('🚨 EMERGENCY MODE ACTIVATED 🚨');
    
    // Accelerate decay for all content
    const allContent = enhancedDecay.getAllContent();
    for (const content of allContent) {
      if (!content.isPreserved) {
        // Force maximum decay acceleration
        enhancedDecay.updateContentQuality(content.id, {
          engagementScore: Math.max(0, content.qualityScore - 20),
          reputationImpact: Math.max(0, content.qualityScore - 20),
          networkContribution: Math.max(0, content.qualityScore - 20)
        });
      }
    }
    
    // Reduce payout amounts
    const emergencyConfig = {
      baseNodeReward: enhancedEconomics.getConfig().baseNodeReward * 0.5,
      baseStakeReward: enhancedEconomics.getConfig().baseStakeReward * 0.5
    };
    
    enhancedEconomics.updateNetworkMetrics({
      networkHealth: Math.max(10, networkMetrics.networkHealth - 20)
    });
    
    this.emit('emergency:mode:activated', {
      networkMetrics,
      decayMetrics,
      emergencyConfig
    });
  }

  /**
   * Get users eligible for payouts
   */
  private getEligibleUsers(): string[] {
    const eligibleUsers: string[] = [];
    
    // This would integrate with actual user data
    // For now, return a placeholder list
    const allUsers = ['user1', 'user2', 'user3', 'user4', 'user5'];
    
    for (const userId of allUsers) {
      const profile = enhancedEconomics.getUserProfile(userId);
      if (profile && this.isUserEligible(profile)) {
        eligibleUsers.push(userId);
      }
    }
    
    return eligibleUsers;
  }

  /**
   * Check if user is eligible for payouts
   */
  private isUserEligible(profile: UserEconomicProfile): boolean {
    return (
      profile.nodeUptime >= this.config.minUptimeForRewards &&
      profile.totalStaked >= this.config.minStakeForRewards
    );
  }

  /**
   * Create payout batches
   */
  private createPayoutBatches(userIds: string[], batchId: string): PayoutBatch[] {
    const batches: PayoutBatch[] = [];
    
    for (let i = 0; i < userIds.length; i += this.config.batchSize) {
      const batchUsers = userIds.slice(i, i + this.config.batchSize);
      
      const batch: PayoutBatch = {
        batchId: `${batchId}_${Math.floor(i / this.config.batchSize)}`,
        timestamp: Date.now(),
        userCount: batchUsers.length,
        totalPayouts: 0,
        averagePayout: 0,
        networkHealth: 0,
        decayMetrics: enhancedDecay.getDecayMetrics(),
        completed: false,
        errors: []
      };
      
      batches.push(batch);
    }
    
    return batches;
  }

  /**
   * Process a single payout batch
   */
  private async processPayoutBatch(batch: PayoutBatch, networkMetrics: NetworkMetrics, decayMetrics: DecayMetrics): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Get users for this batch
      const userIds = this.getUsersForBatch(batch);
      let totalPayouts = 0;
      let successfulPayouts = 0;
      
      for (const userId of userIds) {
        try {
          // Calculate user payout
          const payout = enhancedEconomics.calculateUserPayout(userId);
          
          // Apply performance bonuses
          const enhancedPayout = this.applyPerformanceBonuses(payout, userId);
          
          // Apply network bonuses
          const finalPayout = this.applyNetworkBonuses(enhancedPayout, networkMetrics, decayMetrics);
          
          // Validate payout limits
          if (finalPayout.finalPayout <= this.config.maxPayoutPerCycle) {
            totalPayouts += finalPayout.finalPayout;
            successfulPayouts++;
            
            // Update user summary
            this.updateUserPayoutSummary(userId, finalPayout);
            
            // Emit individual payout event
            this.emit('user:payout:processed', {
              userId,
              payout: finalPayout,
              batchId: batch.batchId
            });
          } else {
            batch.errors.push(`Payout limit exceeded for user ${userId}: ${finalPayout.finalPayout}`);
          }
          
        } catch (error) {
          batch.errors.push(`Failed to process payout for user ${userId}: ${error.message}`);
        }
      }
      
      // Update batch metrics
      batch.totalPayouts = totalPayouts;
      batch.averagePayout = successfulPayouts > 0 ? totalPayouts / successfulPayouts : 0;
      batch.networkHealth = networkMetrics.networkHealth;
      batch.completed = true;
      
      // Update global metrics
      this.totalPayoutsProcessed += successfulPayouts;
      this.totalTokensDistributed += totalPayouts;
      
      // Add to history
      this.payoutHistory.push(batch);
      
      // Keep only last 100 batches
      if (this.payoutHistory.length > 100) {
        this.payoutHistory = this.payoutHistory.slice(-100);
      }
      
      this.emit('batch:completed', batch);
      
    } catch (error) {
      batch.errors.push(`Batch processing failed: ${error.message}`);
      this.emit('batch:error', { batch, error });
    }
  }

  /**
   * Get users for a specific batch
   */
  private getUsersForBatch(batch: PayoutBatch): string[] {
    // This would integrate with actual user data
    // For now, return placeholder users
    const allUsers = ['user1', 'user2', 'user3', 'user4', 'user5'];
    const batchIndex = parseInt(batch.batchId.split('_').pop() || '0');
    const startIndex = batchIndex * this.config.batchSize;
    
    return allUsers.slice(startIndex, startIndex + this.config.batchSize);
  }

  /**
   * Apply performance-based bonuses
   */
  private applyPerformanceBonuses(payout: PayoutCalculation, userId: string): PayoutCalculation {
    const profile = enhancedEconomics.getUserProfile(userId);
    if (!profile) return payout;
    
    let performanceBonus = 0;
    
    // Uptime bonus
    if (profile.nodeUptime >= this.config.uptimeBonusThreshold) {
      performanceBonus += payout.baseReward * 0.2; // 20% uptime bonus
    }
    
    // Reputation bonus
    if (profile.reputationScore >= this.config.reputationBonusThreshold) {
      performanceBonus += payout.baseReward * 0.15; // 15% reputation bonus
    }
    
    // Stake utilization bonus
    const stakeUtilization = profile.totalStaked / 1000; // Normalized to 1000 ONU
    if (stakeUtilization >= 1.0) {
      performanceBonus += payout.baseReward * 0.1; // 10% stake utilization bonus
    }
    
    return {
      ...payout,
      performanceBonus: payout.performanceBonus + performanceBonus,
      finalPayout: payout.finalPayout + performanceBonus
    };
  }

  /**
   * Apply network-based bonuses
   */
  private applyNetworkBonuses(payout: PayoutCalculation, networkMetrics: NetworkMetrics, decayMetrics: DecayMetrics): PayoutCalculation {
    let networkBonus = 0;
    
    // Network health bonus
    if (networkMetrics.networkHealth >= 90) {
      networkBonus += payout.baseReward * 0.1; // 10% network health bonus
    }
    
    // Network contribution bonus
    networkBonus += payout.baseReward * this.config.networkContributionBonus;
    
    // Decay management bonus (reward users for good content quality)
    if (decayMetrics.averageDecayScore >= 70) {
      networkBonus += payout.baseReward * 0.05; // 5% quality bonus
    }
    
    return {
      ...payout,
      networkBonus: payout.networkBonus + networkBonus,
      finalPayout: payout.finalPayout + networkBonus
    };
  }

  /**
   * Update user payout summary
   */
  private updateUserPayoutSummary(userId: string, payout: PayoutCalculation): void {
    const existing = this.userPayoutSummaries.get(userId) || {
      userId,
      totalEarnings: 0,
      lastPayout: 0,
      averagePayout: 0,
      payoutCount: 0,
      performanceScore: 0,
      networkContribution: 0,
      stakeUtilization: 0
    };
    
    const updated: UserPayoutSummary = {
      ...existing,
      totalEarnings: existing.totalEarnings + payout.finalPayout,
      lastPayout: Date.now(),
      payoutCount: existing.payoutCount + 1,
      averagePayout: (existing.totalEarnings + payout.finalPayout) / (existing.payoutCount + 1)
    };
    
    this.userPayoutSummaries.set(userId, updated);
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(processingTime: number): void {
    this.averageProcessingTime = (
      (this.averageProcessingTime * (this.payoutHistory.length - 1) + processingTime) / 
      this.payoutHistory.length
    );
  }

  /**
   * Handle network updates
   */
  private handleNetworkUpdate(metrics: NetworkMetrics): void {
    // Adjust payout parameters based on network health
    if (metrics.networkHealth < 50) {
      // Reduce payouts during poor network conditions
      this.config.maxPayoutPerCycle *= 0.8;
    } else if (metrics.networkHealth > 90) {
      // Increase payouts during excellent network conditions
      this.config.maxPayoutPerCycle = Math.min(15000, this.config.maxPayoutPerCycle * 1.1);
    }
    
    this.emit('network:update:processed', metrics);
  }

  /**
   * Handle economic payout cycle completion
   */
  private handleEconomicPayoutCycle(data: any): void {
    // Coordinate with economic system
    this.emit('economic:cycle:coordinated', data);
  }

  /**
   * Handle content decay
   */
  private handleContentDecay(decayedContent: string[]): void {
    // Update user summaries for decayed content
    for (const contentId of decayedContent) {
      const content = enhancedDecay.getContent(contentId);
      if (content) {
        // This would update user profiles and economic data
        this.emit('content:decay:processed', { contentId, content });
      }
    }
  }

  /**
   * Handle decay acceleration changes
   */
  private handleDecayAcceleration(event: any): void {
    // Adjust payout parameters based on decay acceleration
    if (event.newAcceleration >= 5.0) {
      // High acceleration - reduce payouts to encourage better content
      this.config.maxPayoutPerCycle *= 0.9;
    }
    
    this.emit('decay:acceleration:processed', event);
  }

  /**
   * Handle decay metrics
   */
  private handleDecayMetrics(metrics: DecayMetrics): void {
    // Use decay metrics to adjust payout strategy
    if (metrics.qualityDecayCorrelation < 0.5) {
      // Poor correlation between quality and decay - adjust strategy
      this.config.reputationBonusThreshold *= 1.1;
    }
    
    this.emit('decay:metrics:processed', metrics);
  }

  /**
   * Get payout metrics
   */
  getPayoutMetrics(): NetworkPayoutMetrics {
    const networkMetrics = enhancedEconomics.getNetworkMetrics();
    const decayMetrics = enhancedDecay.getDecayMetrics();
    const economicSummary = enhancedEconomics.getEconomicSummary();
    
    return {
      totalPayouts: this.totalPayoutsProcessed,
      activeUsers: this.userPayoutSummaries.size,
      averagePayout: this.totalPayoutsProcessed > 0 ? this.totalTokensDistributed / this.totalPayoutsProcessed : 0,
      networkHealth: networkMetrics.networkHealth,
      totalStaked: networkMetrics.totalStaked,
      decayRate: decayMetrics.estimatedBurnRate,
      treasuryBalance: economicSummary.treasuryBalance,
      circulatingSupply: economicSummary.circulatingSupply,
      timestamp: Date.now()
    };
  }

  /**
   * Get payout history
   */
  getPayoutHistory(): PayoutBatch[] {
    return [...this.payoutHistory];
  }

  /**
   * Get user payout summary
   */
  getUserPayoutSummary(userId: string): UserPayoutSummary | undefined {
    return this.userPayoutSummaries.get(userId);
  }

  /**
   * Get all user payout summaries
   */
  getAllUserPayoutSummaries(): UserPayoutSummary[] {
    return Array.from(this.userPayoutSummaries.values());
  }

  /**
   * Get configuration
   */
  getConfig(): PayoutOrchestrationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<PayoutOrchestrationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('config:updated', this.config);
  }

  /**
   * Force payout cycle (for testing/admin)
   */
  async forcePayoutCycle(): Promise<void> {
    if (this.isProcessing) {
      throw new Error('Payout cycle already in progress');
    }
    
    await this.processPayoutCycle();
  }

  /**
   * Get system status
   */
  getSystemStatus(): {
    isProcessing: boolean;
    lastPayoutTime: number;
    totalPayoutsProcessed: number;
    totalTokensDistributed: number;
    averageProcessingTime: number;
    config: PayoutOrchestrationConfig;
  } {
    return {
      isProcessing: this.isProcessing,
      lastPayoutTime: this.lastPayoutTime,
      totalPayoutsProcessed: this.totalPayoutsProcessed,
      totalTokensDistributed: this.totalTokensDistributed,
      averageProcessingTime: this.averageProcessingTime,
      config: this.getConfig()
    };
  }
}

// Export singleton instance
export const payoutOrchestrator = new PayoutOrchestrator();
export default PayoutOrchestrator;
