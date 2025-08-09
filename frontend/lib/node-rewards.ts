/**
 * Node Reward System - Time-based payouts for hosting content
 * Calculates rewards based on how long nodes host staked messages
 */

export interface NodeReward {
  nodeId: string;
  messageId: string;
  stakeAmount: number;
  hostingStartTime: number;
  hostingDuration: number; // milliseconds
  earnedONU: number;
  payoutStatus: 'pending' | 'paid' | 'failed';
  payoutTxSig?: string;
}

export interface NodePerformance {
  nodeId: string;
  totalUptime: number;
  messagesHosted: number;
  totalEarnings: number;
  reliabilityScore: number; // 0-100
  lastSeen: number;
}

export class NodeRewardSystem {
  private static REWARD_RATE_PER_HOUR = 0.1; // 0.1 ONU per hour per 1 ONU staked
  private static MIN_HOSTING_TIME = 60 * 1000; // 1 minute minimum
  private static MAX_REWARD_MULTIPLIER = 10; // Max 10x reward for long hosting

  /**
   * Calculate reward for hosting a staked message
   */
  static calculateReward(
    stakeAmount: number,
    hostingDurationMs: number,
    nodeReliability: number = 100
  ): number {
    if (hostingDurationMs < this.MIN_HOSTING_TIME) return 0;

    const hostingHours = hostingDurationMs / (1000 * 60 * 60);
    const baseReward = stakeAmount * this.REWARD_RATE_PER_HOUR * hostingHours;
    
    // Apply reliability multiplier (0.5x to 1.0x based on reliability)
    const reliabilityMultiplier = Math.max(0.5, nodeReliability / 100);
    
    // Apply time multiplier (longer hosting = higher rate)
    const timeMultiplier = Math.min(
      this.MAX_REWARD_MULTIPLIER,
      1 + Math.log10(hostingHours + 1)
    );

    return baseReward * reliabilityMultiplier * timeMultiplier;
  }

  /**
   * Track node performance over time
   */
  static updateNodePerformance(
    nodeId: string,
    isOnline: boolean,
    messageCount: number
  ): NodePerformance {
    const existing = this.getNodePerformance(nodeId);
    const now = Date.now();
    
    const uptimeIncrement = isOnline ? (now - existing.lastSeen) : 0;
    
    return {
      nodeId,
      totalUptime: existing.totalUptime + uptimeIncrement,
      messagesHosted: Math.max(existing.messagesHosted, messageCount),
      totalEarnings: existing.totalEarnings,
      reliabilityScore: this.calculateReliabilityScore(existing.totalUptime, now - existing.lastSeen),
      lastSeen: now
    };
  }

  /**
   * Calculate reliability score based on uptime
   */
  private static calculateReliabilityScore(totalUptime: number, timeSinceStart: number): number {
    if (timeSinceStart === 0) return 100;
    const uptimeRatio = totalUptime / timeSinceStart;
    return Math.min(100, Math.max(0, uptimeRatio * 100));
  }

  /**
   * Get node performance from storage
   */
  private static getNodePerformance(nodeId: string): NodePerformance {
    if (typeof window === 'undefined') {
      return this.getDefaultPerformance(nodeId);
    }

    try {
      const stored = localStorage.getItem(`node_performance_${nodeId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load node performance:', error);
    }

    return this.getDefaultPerformance(nodeId);
  }

  private static getDefaultPerformance(nodeId: string): NodePerformance {
    return {
      nodeId,
      totalUptime: 0,
      messagesHosted: 0,
      totalEarnings: 0,
      reliabilityScore: 100,
      lastSeen: Date.now()
    };
  }

  /**
   * Process pending payouts for a node
   */
  static async processNodePayouts(nodeId: string): Promise<NodeReward[]> {
    // This would integrate with the real Solana payments system
    // For now, return mock data
    return [];
  }

  /**
   * Get total pending rewards for a node
   */
  static getPendingRewards(nodeId: string): number {
    // Calculate based on hosted messages and time
    const performance = this.getNodePerformance(nodeId);
    return performance.totalEarnings;
  }
}
