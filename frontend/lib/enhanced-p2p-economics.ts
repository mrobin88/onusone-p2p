/**
 * Enhanced P2P Economics - Unified Economic System Integration
 * 
 * This file provides a unified interface for all economic systems:
 * - Enhanced Economics (rewards, taxes, pooling)
 * - Enhanced Decay (intelligent content decay)
 * - Payout Orchestrator (coordinated payouts)
 * - Network monitoring and health
 * 
 * Features:
 * - Single entry point for all economic operations
 * - Real-time network health monitoring
 * - Sophisticated payout calculations
 * - Intelligent decay management
 * - Stake pooling with diminishing returns
 * - Emergency mode for network congestion
 */

import { EventEmitter } from 'events';
import { enhancedEconomics, NetworkMetrics, EconomicConfig, StakePool, UserEconomicProfile, PayoutCalculation } from './enhanced-economics';
import { enhancedDecay, DecayableContent, DecayMetrics, QualityMetrics } from './enhanced-decay';
import { payoutOrchestrator, PayoutOrchestrationConfig, NetworkPayoutMetrics, PayoutBatch } from './payout-orchestrator';

export interface P2PEconomicState {
  // Network state
  networkMetrics: NetworkMetrics;
  decayMetrics: DecayMetrics;
  payoutMetrics: NetworkPayoutMetrics;
  
  // Economic state
  totalSupply: number;
  circulatingSupply: number;
  burnedTokens: number;
  treasuryBalance: number;
  totalStaked: number;
  
  // User state
  activeUsers: number;
  totalPayouts: number;
  averagePayout: number;
  
  // System state
  isEmergencyMode: boolean;
  lastUpdate: number;
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export interface EconomicAction {
  type: 'stake' | 'unstake' | 'create_pool' | 'join_pool' | 'post_content' | 'update_quality' | 'preserve_content';
  userId: string;
  data: any;
  timestamp: number;
  result?: any;
  error?: string;
}

export interface EconomicEvent {
  type: string;
  timestamp: number;
  data: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface StakePoolInfo {
  pool: StakePool;
  participants: UserEconomicProfile[];
  totalRewards: number;
  averagePerformance: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface UserEconomicSummary {
  profile: UserEconomicProfile;
  recentPayouts: PayoutCalculation[];
  stakePools: StakePoolInfo[];
  contentQuality: QualityMetrics[];
  decayStatus: DecayableContent[];
  performanceScore: number;
  networkContribution: number;
  estimatedNextPayout: number;
}

export class EnhancedP2PEconomics extends EventEmitter {
  private isInitialized: boolean = false;
  private emergencyMode: boolean = false;
  private actionHistory: EconomicAction[] = [];
  private eventHistory: EconomicEvent[] = [];
  private systemHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' = 'good';
  
  // Health monitoring
  private healthCheckInterval: NodeJS.Timeout;
  private lastHealthCheck: number = 0;
  private consecutiveFailures: number = 0;

  constructor() {
    super();
    
    // Initialize the system
    this.initialize();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Setup event coordination
    this.setupEventCoordination();
  }

  /**
   * Initialize the enhanced P2P economics system
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Enhanced P2P Economics System...');
      
      // Wait for all systems to be ready
      await this.waitForSystemsReady();
      
      // Perform initial health check
      await this.performHealthCheck();
      
      // Initialize default network state
      this.initializeDefaultNetworkState();
      
      this.isInitialized = true;
      console.log('✅ Enhanced P2P Economics System initialized successfully');
      
      this.emit('system:initialized', {
        timestamp: Date.now(),
        systems: ['economics', 'decay', 'payouts'],
        status: 'ready'
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced P2P Economics System:', error);
      this.emit('system:initialization:failed', { error, timestamp: Date.now() });
    }
  }

  /**
   * Wait for all economic systems to be ready
   */
  private async waitForSystemsReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (enhancedEconomics && enhancedDecay && payoutOrchestrator) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  /**
   * Initialize default network state
   */
  private initializeDefaultNetworkState(): void {
    // Set initial network metrics
    enhancedEconomics.updateNetworkMetrics({
      totalNodes: 100,
      activeNodes: 85,
      totalStaked: 50000,
      networkHealth: 85,
      messageVolume: 1000,
      averageLatency: 150,
      uptimePercentage: 92
    });
    
    // Create some initial stake pools
    this.createInitialStakePools();
    
    // Register some sample content
    this.registerSampleContent();
  }

  /**
   * Create initial stake pools for demonstration
   */
  private createInitialStakePools(): void {
    const pool1 = enhancedEconomics.createStakePool('system', 1000);
    const pool2 = enhancedEconomics.createStakePool('system', 2000);
    
    console.log('Created initial stake pools:', { pool1: pool1.id, pool2: pool2.id });
  }

  /**
   * Register sample content for demonstration
   */
  private registerSampleContent(): void {
    const sampleContent = [
      {
        id: 'sample_post_1',
        userId: 'system',
        contentType: 'post' as const,
        contentHash: 'hash1',
        qualityScore: 85,
        stakeAmount: 100,
        createdAt: Date.now(),
        lastActivity: Date.now()
      },
      {
        id: 'sample_stake_1',
        userId: 'system',
        contentType: 'stake' as const,
        contentHash: 'hash2',
        qualityScore: 90,
        stakeAmount: 500,
        createdAt: Date.now(),
        lastActivity: Date.now()
      }
    ];
    
    for (const content of sampleContent) {
      enhancedDecay.registerContent(content);
    }
    
    console.log('Registered sample content:', sampleContent.length);
  }

  /**
   * Setup event coordination between systems
   */
  private setupEventCoordination(): void {
    // Economic system events
    enhancedEconomics.on('network:updated', (metrics: NetworkMetrics) => {
      this.handleNetworkUpdate(metrics);
    });
    
    enhancedEconomics.on('payout:calculated', (payout: PayoutCalculation) => {
      this.handlePayoutCalculated(payout);
    });
    
    enhancedEconomics.on('pool:created', (pool: StakePool) => {
      this.handlePoolCreated(pool);
    });
    
    // Decay system events
    enhancedDecay.on('content:registered', (content: DecayableContent) => {
      this.handleContentRegistered(content);
    });
    
    enhancedDecay.on('content:decayed', (decayedContent: string[]) => {
      this.handleContentDecayed(decayedContent);
    });
    
    enhancedDecay.on('acceleration:changed', (event: any) => {
      this.handleDecayAcceleration(event);
    });
    
    // Payout orchestrator events
    payoutOrchestrator.on('payout:cycle:completed', (data: any) => {
      this.handlePayoutCycleCompleted(data);
    });
    
    payoutOrchestrator.on('emergency:mode:activated', (data: any) => {
      this.handleEmergencyModeActivated(data);
    });
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 300000); // Every 5 minutes
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Check all systems
      const economicsHealth = this.checkEconomicsHealth();
      const decayHealth = this.checkDecayHealth();
      const payoutHealth = this.checkPayoutHealth();
      
      // Determine overall system health
      this.systemHealth = this.calculateOverallHealth(economicsHealth, decayHealth, payoutHealth);
      
      // Update last health check
      this.lastHealthCheck = Date.now();
      this.consecutiveFailures = 0;
      
      // Emit health status
      this.emit('health:checked', {
        timestamp: Date.now(),
        systemHealth: this.systemHealth,
        economicsHealth,
        decayHealth,
        payoutHealth,
        checkDuration: Date.now() - startTime
      });
      
    } catch (error) {
      this.consecutiveFailures++;
      console.error('Health check failed:', error);
      
      this.emit('health:check:failed', {
        error,
        consecutiveFailures: this.consecutiveFailures,
        timestamp: Date.now()
      });
      
      // Trigger emergency mode if too many consecutive failures
      if (this.consecutiveFailures >= 3) {
        this.triggerEmergencyMode('health_check_failure');
      }
    }
  }

  /**
   * Check economics system health
   */
  private checkEconomicsHealth(): { status: string; issues: string[] } {
    const issues: string[] = [];
    let status = 'healthy';
    
    try {
      const config = enhancedEconomics.getConfig();
      const metrics = enhancedEconomics.getNetworkMetrics();
      
      if (metrics.networkHealth < 50) {
        issues.push('Low network health');
        status = 'degraded';
      }
      
      if (metrics.activeNodes / metrics.totalNodes < 0.7) {
        issues.push('Low node uptime');
        status = 'degraded';
      }
      
    } catch (error) {
      issues.push(`Economics system error: ${error.message}`);
      status = 'unhealthy';
    }
    
    return { status, issues };
  }

  /**
   * Check decay system health
   */
  private checkDecayHealth(): { status: string; issues: string[] } {
    const issues: string[] = [];
    let status = 'healthy';
    
    try {
      const metrics = enhancedDecay.getDecayMetrics();
      
      if (metrics.averageAccelerationFactor > 3) {
        issues.push('High decay acceleration');
        status = 'degraded';
      }
      
      if (metrics.qualityDecayCorrelation < 0.3) {
        issues.push('Poor quality-decay correlation');
        status = 'degraded';
      }
      
    } catch (error) {
      issues.push(`Decay system error: ${error.message}`);
      status = 'unhealthy';
    }
    
    return { status, issues };
  }

  /**
   * Check payout system health
   */
  private checkPayoutHealth(): { status: string; issues: string[] } {
    const issues: string[] = [];
    let status = 'healthy';
    
    try {
      const status = payoutOrchestrator.getSystemStatus();
      
      if (status.isProcessing && Date.now() - status.lastPayoutTime > 7200000) {
        issues.push('Payout processing stuck');
        status = 'degraded';
      }
      
    } catch (error) {
      issues.push(`Payout system error: ${error.message}`);
      status = 'unhealthy';
    }
    
    return { status, issues };
  }

  /**
   * Calculate overall system health
   */
  private calculateOverallHealth(economics: any, decay: any, payout: any): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    const healthyCount = [economics, decay, payout].filter(h => h.status === 'healthy').length;
    const degradedCount = [economics, decay, payout].filter(h => h.status === 'degraded').length;
    const unhealthyCount = [economics, decay, payout].filter(h => h.status === 'unhealthy').length;
    
    if (unhealthyCount > 0) return 'critical';
    if (degradedCount >= 2) return 'poor';
    if (degradedCount === 1) return 'fair';
    if (healthyCount === 3) return 'excellent';
    return 'good';
  }

  /**
   * Handle network updates
   */
  private handleNetworkUpdate(metrics: NetworkMetrics): void {
    // Check for emergency conditions
    if (metrics.networkHealth < 30 || metrics.messageVolume / metrics.maxNetworkCapacity > 0.9) {
      this.triggerEmergencyMode('network_congestion');
    }
    
    this.emit('network:updated', metrics);
  }

  /**
   * Handle payout calculations
   */
  private handlePayoutCalculated(payout: PayoutCalculation): void {
    this.emit('payout:calculated', payout);
  }

  /**
   * Handle pool creation
   */
  private handlePoolCreated(pool: StakePool): void {
    this.emit('pool:created', pool);
  }

  /**
   * Handle content registration
   */
  private handleContentRegistered(content: DecayableContent): void {
    this.emit('content:registered', content);
  }

  /**
   * Handle content decay
   */
  private handleContentDecayed(decayedContent: string[]): void {
    this.emit('content:decayed', decayedContent);
  }

  /**
   * Handle decay acceleration
   */
  private handleDecayAcceleration(event: any): void {
    this.emit('decay:acceleration', event);
  }

  /**
   * Handle payout cycle completion
   */
  private handlePayoutCycleCompleted(data: any): void {
    this.emit('payout:cycle:completed', data);
  }

  /**
   * Handle emergency mode activation
   */
  private handleEmergencyModeActivated(data: any): void {
    this.emergencyMode = true;
    this.emit('emergency:mode:activated', data);
  }

  /**
   * Trigger emergency mode
   */
  private triggerEmergencyMode(reason: string): void {
    if (this.emergencyMode) return;
    
    this.emergencyMode = true;
    console.log(`🚨 Emergency mode triggered: ${reason}`);
    
    this.emit('emergency:mode:triggered', {
      reason,
      timestamp: Date.now(),
      systemHealth: this.systemHealth
    });
  }

  /**
   * Get comprehensive economic state
   */
  getEconomicState(): P2PEconomicState {
    const networkMetrics = enhancedEconomics.getNetworkMetrics();
    const decayMetrics = enhancedDecay.getDecayMetrics();
    const payoutMetrics = payoutOrchestrator.getPayoutMetrics();
    const economicSummary = enhancedEconomics.getEconomicSummary();
    
    return {
      networkMetrics,
      decayMetrics,
      payoutMetrics,
      totalSupply: economicSummary.totalSupply,
      circulatingSupply: economicSummary.circulatingSupply,
      burnedTokens: economicSummary.burnedTokens,
      treasuryBalance: economicSummary.treasuryBalance,
      totalStaked: economicSummary.totalStaked,
      activeUsers: payoutMetrics.activeUsers,
      totalPayouts: payoutMetrics.totalPayouts,
      averagePayout: payoutMetrics.averagePayout,
      isEmergencyMode: this.emergencyMode,
      lastUpdate: Date.now(),
      systemHealth: this.systemHealth
    };
  }

  /**
   * Get user economic summary
   */
  getUserEconomicSummary(userId: string): UserEconomicSummary | null {
    try {
      const profile = enhancedEconomics.getUserProfile(userId);
      if (!profile) return null;
      
      // Get recent payouts (this would integrate with actual payout history)
      const recentPayouts: PayoutCalculation[] = [];
      
      // Get stake pools (this would integrate with actual pool data)
      const stakePools: StakePoolInfo[] = [];
      
      // Get content quality metrics
      const contentQuality: QualityMetrics[] = [];
      
      // Get decay status
      const decayStatus: DecayableContent[] = [];
      
      // Calculate performance score
      const performanceScore = this.calculateUserPerformanceScore(profile);
      
      // Calculate network contribution
      const networkContribution = this.calculateUserNetworkContribution(userId);
      
      // Estimate next payout
      const estimatedNextPayout = this.estimateNextPayout(userId);
      
      return {
        profile,
        recentPayouts,
        stakePools,
        contentQuality,
        decayStatus,
        performanceScore,
        networkContribution,
        estimatedNextPayout
      };
      
    } catch (error) {
      console.error(`Failed to get economic summary for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Calculate user performance score
   */
  private calculateUserPerformanceScore(profile: UserEconomicProfile): number {
    let score = 50; // Base score
    
    // Uptime bonus
    if (profile.nodeUptime >= 95) score += 20;
    else if (profile.nodeUptime >= 85) score += 15;
    else if (profile.nodeUptime >= 70) score += 10;
    
    // Reputation bonus
    if (profile.reputationScore >= 90) score += 20;
    else if (profile.reputationScore >= 80) score += 15;
    else if (profile.reputationScore >= 70) score += 10;
    
    // Stake utilization bonus
    const stakeUtilization = profile.totalStaked / 1000;
    if (stakeUtilization >= 2.0) score += 10;
    else if (stakeUtilization >= 1.0) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate user network contribution
   */
  private calculateUserNetworkContribution(userId: string): number {
    // This would integrate with actual network contribution metrics
    // For now, return a placeholder calculation
    return Math.random() * 100;
  }

  /**
   * Estimate next payout for user
   */
  private estimateNextPayout(userId: string): number {
    try {
      const profile = enhancedEconomics.getUserProfile(userId);
      if (!profile) return 0;
      
      // Calculate estimated hourly reward
      const hourlyReward = enhancedEconomics.getConfig().baseNodeReward * (profile.nodeUptime / 100);
      const stakingReward = profile.totalStaked * (enhancedEconomics.getConfig().baseStakeReward / 365 / 24);
      
      return hourlyReward + stakingReward;
      
    } catch (error) {
      return 0;
    }
  }

  /**
   * Create stake pool
   */
  createStakePool(userId: string, stakeAmount: number): StakePool {
    try {
      const pool = enhancedEconomics.createStakePool(userId, stakeAmount);
      
      this.recordAction({
        type: 'create_pool',
        userId,
        data: { stakeAmount, poolId: pool.id },
        timestamp: Date.now(),
        result: pool
      });
      
      return pool;
      
    } catch (error) {
      this.recordAction({
        type: 'create_pool',
        userId,
        data: { stakeAmount },
        timestamp: Date.now(),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Join stake pool
   */
  joinStakePool(poolId: string, userId: string, stakeAmount: number): boolean {
    try {
      const success = enhancedEconomics.joinStakePool(poolId, userId, stakeAmount);
      
      this.recordAction({
        type: 'join_pool',
        userId,
        data: { poolId, stakeAmount },
        timestamp: Date.now(),
        result: { success }
      });
      
      return success;
      
    } catch (error) {
      this.recordAction({
        type: 'join_pool',
        userId,
        data: { poolId, stakeAmount },
        timestamp: Date.now(),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Register content for decay tracking
   */
  registerContent(content: Omit<DecayableContent, 'decayScore' | 'decayRate' | 'accelerationFactor' | 'expiryTime' | 'isPreserved'>): DecayableContent {
    try {
      const decayableContent = enhancedDecay.registerContent(content);
      
      this.recordAction({
        type: 'post_content',
        userId: content.userId,
        data: { contentId: content.id, contentType: content.contentType, stakeAmount: content.stakeAmount },
        timestamp: Date.now(),
        result: { contentId: decayableContent.id }
      });
      
      return decayableContent;
      
    } catch (error) {
      this.recordAction({
        type: 'post_content',
        userId: content.userId,
        data: { contentId: content.id, contentType: content.contentType, stakeAmount: content.stakeAmount },
        timestamp: Date.now(),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update content quality
   */
  updateContentQuality(contentId: string, qualityMetrics: Partial<QualityMetrics>): void {
    try {
      enhancedDecay.updateContentQuality(contentId, qualityMetrics);
      
      this.recordAction({
        type: 'update_quality',
        userId: 'system', // This would be the actual user ID
        data: { contentId, qualityMetrics },
        timestamp: Date.now(),
        result: { success: true }
      });
      
    } catch (error) {
      this.recordAction({
        type: 'update_quality',
        userId: 'system',
        data: { contentId, qualityMetrics },
        timestamp: Date.now(),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Preserve content from decay
   */
  preserveContent(contentId: string, reason: string): boolean {
    try {
      const success = enhancedDecay.preserveContent(contentId, reason);
      
      this.recordAction({
        type: 'preserve_content',
        userId: 'system',
        data: { contentId, reason },
        timestamp: Date.now(),
        result: { success }
      });
      
      return success;
      
    } catch (error) {
      this.recordAction({
        type: 'preserve_content',
        userId: 'system',
        data: { contentId, reason },
        timestamp: Date.now(),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Record economic action
   */
  private recordAction(action: EconomicAction): void {
    this.actionHistory.push(action);
    
    // Keep only last 1000 actions
    if (this.actionHistory.length > 1000) {
      this.actionHistory = this.actionHistory.slice(-1000);
    }
    
    this.emit('action:recorded', action);
  }

  /**
   * Record economic event
   */
  recordEvent(type: string, data: any, severity: 'info' | 'warning' | 'error' | 'critical' = 'info'): void {
    const event: EconomicEvent = {
      type,
      timestamp: Date.now(),
      data,
      severity
    };
    
    this.eventHistory.push(event);
    
    // Keep only last 1000 events
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }
    
    this.emit('event:recorded', event);
  }

  /**
   * Get action history
   */
  getActionHistory(): EconomicAction[] {
    return [...this.actionHistory];
  }

  /**
   * Get event history
   */
  getEventHistory(): EconomicEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Get system status
   */
  getSystemStatus(): {
    isInitialized: boolean;
    isEmergencyMode: boolean;
    systemHealth: string;
    lastHealthCheck: number;
    consecutiveFailures: number;
    uptime: number;
  } {
    return {
      isInitialized: this.isInitialized,
      isEmergencyMode: this.emergencyMode,
      systemHealth: this.systemHealth,
      lastHealthCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
      uptime: Date.now() - (this.lastHealthCheck || Date.now())
    };
  }

  /**
   * Force payout cycle (for testing/admin)
   */
  async forcePayoutCycle(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }
    
    await payoutOrchestrator.forcePayoutCycle();
  }

  /**
   * Update network metrics
   */
  updateNetworkMetrics(metrics: Partial<NetworkMetrics>): void {
    enhancedEconomics.updateNetworkMetrics(metrics);
  }

  /**
   * Get all stake pools
   */
  getStakePools(): StakePool[] {
    return enhancedEconomics.getStakePools();
  }

  /**
   * Get decay metrics
   */
  getDecayMetrics(): DecayMetrics {
    return enhancedDecay.getDecayMetrics();
  }

  /**
   * Get payout metrics
   */
  getPayoutMetrics(): NetworkPayoutMetrics {
    return payoutOrchestrator.getPayoutMetrics();
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Enhanced P2P Economics System...');
    
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Emit shutdown event
    this.emit('system:shutdown', { timestamp: Date.now() });
    
    console.log('✅ Enhanced P2P Economics System shutdown complete');
  }
}

// Export singleton instance
export const enhancedP2PEconomics = new EnhancedP2PEconomics();
export default EnhancedP2PEconomics;
