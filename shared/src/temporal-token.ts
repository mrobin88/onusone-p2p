/**
 * Temporal Token System - Revolutionary Deflationary Model
 * Content decay drives token burn mechanism
 */

import { Message } from './types';
import CryptoJS from 'crypto-js';

// Temporal Token Configuration
export const TEMPORAL_TOKEN_CONFIG = {
  // Token Economics
  INITIAL_SUPPLY: 1_000_000_000, // 1 billion tokens
  STAKING_AMOUNT: 100,           // Tokens required to post content
  MIN_STAKE: 10,                 // Minimum stake for replies
  MAX_STAKE: 1000,               // Maximum stake for premium content
  
  // Decay Economics
  DECAY_RATE_PER_HOUR: 2,        // 2% decay per hour
  ENGAGEMENT_MULTIPLIER: 0.5,     // Engagement reduces decay by 50%
  BURN_THRESHOLD: 10,            // Burn tokens when decay score < 10%
  
  // Network Effects
  VIRAL_THRESHOLD: 1000,         // Engagement count for viral status
  VIRAL_REWARD_MULTIPLIER: 2,    // 2x token rewards for viral content
  QUALITY_BONUS: 0.1,            // 10% bonus for high-quality content
  
  // Transaction Fees
  PLATFORM_FEE: 0.02,            // 2% platform fee on all transactions
  CREATOR_SHARE: 0.8,            // 80% of fees go to content creators
  BURN_SHARE: 0.2,               // 20% of fees are burned
};

export interface TokenStake {
  contentId: string;
  userId: string;
  stakedAmount: number;
  createdAt: Date;
  lastDecayUpdate: Date;
  currentValue: number;
  isBurned: boolean;
}

export interface TokenTransaction {
  id: string;
  type: 'stake' | 'burn' | 'reward' | 'fee';
  amount: number;
  userId: string;
  contentId?: string;
  timestamp: Date;
  txHash?: string; // Solana transaction hash
}

/**
 * Temporal Token Manager - Core Innovation
 */
export class TemporalTokenManager {
  private stakes: Map<string, TokenStake> = new Map();
  private transactions: TokenTransaction[] = [];
  private totalSupply: number = TEMPORAL_TOKEN_CONFIG.INITIAL_SUPPLY;
  private totalBurned: number = 0;
  
  constructor() {
    // Start background decay processor
    setInterval(() => {
      this.processDecayAndBurn();
    }, 60000); // Process every minute
  }
  
  /**
   * Stake tokens on content creation
   */
  async stakeTokens(userId: string, contentId: string, amount: number): Promise<{
    success: boolean;
    stakeId: string;
    remainingBalance: number;
  }> {
    try {
      // Validate stake amount
      if (amount < TEMPORAL_TOKEN_CONFIG.MIN_STAKE) {
        throw new Error(`Minimum stake is ${TEMPORAL_TOKEN_CONFIG.MIN_STAKE} tokens`);
      }
      
      if (amount > TEMPORAL_TOKEN_CONFIG.MAX_STAKE) {
        throw new Error(`Maximum stake is ${TEMPORAL_TOKEN_CONFIG.MAX_STAKE} tokens`);
      }
      
      // Create stake record
      const stake: TokenStake = {
        contentId,
        userId,
        stakedAmount: amount,
        createdAt: new Date(),
        lastDecayUpdate: new Date(),
        currentValue: amount,
        isBurned: false
      };
      
      this.stakes.set(contentId, stake);
      
      // Record transaction
      this.recordTransaction({
        id: this.generateId(),
        type: 'stake',
        amount,
        userId,
        contentId,
        timestamp: new Date()
      });
      
      console.log(`🎯 ${amount} tokens staked on content ${contentId}`);
      
      return {
        success: true,
        stakeId: contentId,
        remainingBalance: this.getUserBalance(userId) - amount
      };
    } catch (error) {
      console.error('Token staking failed:', error);
      return {
        success: false,
        stakeId: '',
        remainingBalance: this.getUserBalance(userId)
      };
    }
  }
  
  /**
   * Calculate current token value based on content decay
   */
  calculateCurrentValue(stake: TokenStake, message: Message): number {
    const now = new Date();
    const ageInHours = (now.getTime() - stake.createdAt.getTime()) / (1000 * 60 * 60);
    
    // Base decay rate
    let decayRate = ageInHours * TEMPORAL_TOKEN_CONFIG.DECAY_RATE_PER_HOUR;
    
    // Engagement reduces decay
    const totalEngagement = message.replyCount + message.reactionCount + message.shareCount;
    const engagementReduction = Math.min(totalEngagement * TEMPORAL_TOKEN_CONFIG.ENGAGEMENT_MULTIPLIER, 50);
    decayRate = Math.max(0, decayRate - engagementReduction);
    
    // Viral content gets protection
    if (totalEngagement >= TEMPORAL_TOKEN_CONFIG.VIRAL_THRESHOLD) {
      decayRate *= 0.5; // 50% decay protection for viral content
    }
    
    // Calculate current value (minimum 0)
    const currentValuePercent = Math.max(0, 100 - decayRate);
    return Math.floor(stake.stakedAmount * (currentValuePercent / 100));
  }
  
  /**
   * Process all stakes for decay and burn
   */
  async processDecayAndBurn(): Promise<{
    processed: number;
    burned: number;
    totalBurned: number;
  }> {
    let processed = 0;
    let burned = 0;
    
    for (const [contentId, stake] of this.stakes) {
      if (stake.isBurned) continue;
      
      // Get current message data (would come from P2P network)
      const message = await this.getMessageData(contentId);
      if (!message) continue;
      
      // Calculate current value
      const currentValue = this.calculateCurrentValue(stake, message);
      const previousValue = stake.currentValue;
      
      // Update stake
      stake.currentValue = currentValue;
      stake.lastDecayUpdate = new Date();
      
      processed++;
      
      // Check if we need to burn tokens
      const burnThreshold = stake.stakedAmount * (TEMPORAL_TOKEN_CONFIG.BURN_THRESHOLD / 100);
      
      if (currentValue <= burnThreshold && !stake.isBurned) {
        await this.burnStake(stake);
        burned++;
      } else if (currentValue < previousValue) {
        // Record partial burn
        const burnAmount = previousValue - currentValue;
        this.totalBurned += burnAmount;
        
        this.recordTransaction({
          id: this.generateId(),
          type: 'burn',
          amount: burnAmount,
          userId: stake.userId,
          contentId: stake.contentId,
          timestamp: new Date()
        });
        
        console.log(`🔥 ${burnAmount} tokens burned from decay on content ${contentId}`);
      }
    }
    
    return {
      processed,
      burned,
      totalBurned: this.totalBurned
    };
  }
  
  /**
   * Burn a complete stake when content is worthless
   */
  private async burnStake(stake: TokenStake): Promise<void> {
    stake.isBurned = true;
    stake.currentValue = 0;
    this.totalBurned += stake.currentValue;
    
    this.recordTransaction({
      id: this.generateId(),
      type: 'burn',
      amount: stake.currentValue,
      userId: stake.userId,
      contentId: stake.contentId,
      timestamp: new Date()
    });
    
    console.log(`💀 Complete stake burned: ${stake.stakedAmount} tokens on content ${stake.contentId}`);
  }
  
  /**
   * Reward tokens for engagement
   */
  async rewardEngagement(userId: string, contentId: string, engagementType: 'like' | 'comment' | 'share'): Promise<number> {
    const stake = this.stakes.get(contentId);
    if (!stake || stake.isBurned) return 0;
    
    // Calculate reward based on stake value and engagement type
    const baseReward = stake.currentValue * 0.01; // 1% of current stake value
    
    const multipliers = {
      like: 1,
      comment: 2,
      share: 3
    };
    
    const reward = Math.floor(baseReward * multipliers[engagementType]);
    
    this.recordTransaction({
      id: this.generateId(),
      type: 'reward',
      amount: reward,
      userId,
      contentId,
      timestamp: new Date()
    });
    
    console.log(`💰 ${reward} tokens rewarded to ${userId} for ${engagementType} on ${contentId}`);
    
    return reward;
  }
  
  /**
   * Get user's token balance
   */
  getUserBalance(userId: string): number {
    const userTransactions = this.transactions.filter(tx => tx.userId === userId);
    
    let balance = 0;
    for (const tx of userTransactions) {
      switch (tx.type) {
        case 'stake':
          balance -= tx.amount;
          break;
        case 'reward':
          balance += tx.amount;
          break;
        case 'burn':
          // Burned tokens don't affect user balance (already deducted at stake)
          break;
      }
    }
    
    return Math.max(0, balance);
  }
  
  /**
   * Get network statistics
   */
  getNetworkStats(): {
    totalSupply: number;
    totalBurned: number;
    activeStakes: number;
    burnRate: number;
    deflationary: boolean;
  } {
    const activeStakes = Array.from(this.stakes.values()).filter(s => !s.isBurned).length;
    const burnRate = this.totalBurned / TEMPORAL_TOKEN_CONFIG.INITIAL_SUPPLY;
    
    return {
      totalSupply: this.totalSupply - this.totalBurned,
      totalBurned: this.totalBurned,
      activeStakes,
      burnRate: Math.round(burnRate * 10000) / 100, // Percentage with 2 decimals
      deflationary: this.totalBurned > 0
    };
  }
  
  /**
   * Get stake information for content
   */
  getStakeInfo(contentId: string): TokenStake | null {
    return this.stakes.get(contentId) || null;
  }
  
  // Helper methods
  private generateId(): string {
    return CryptoJS.SHA256(Date.now().toString() + Math.random().toString()).toString().substring(0, 16);
  }
  
  private recordTransaction(transaction: TokenTransaction): void {
    this.transactions.push(transaction);
    
    // Keep only last 10000 transactions in memory
    if (this.transactions.length > 10000) {
      this.transactions = this.transactions.slice(-5000);
    }
  }
  
  private async getMessageData(contentId: string): Promise<Message | null> {
    // In real implementation, this would fetch from P2P network
    // For now, return mock data
    return {
      id: contentId,
      content: "Mock content",
      contentHash: "mock-hash",
      authorId: "mock-author",
      boardType: "general",
      decayScore: 50,
      initialScore: 100,
      lastEngagement: new Date(),
      isVisible: true,
      replyCount: Math.floor(Math.random() * 50),
      reactionCount: Math.floor(Math.random() * 200),
      shareCount: Math.floor(Math.random() * 20),
      createdAt: new Date(Date.now() - Math.random() * 86400000),
      updatedAt: new Date(),
      ipfsHash: "mock-ipfs-hash",
      authorSignature: "mock-signature",
      networkVersion: 1
    };
  }
}

// Export singleton instance
export const temporalTokenManager = new TemporalTokenManager();

/**
 * Helper function to format token amounts for display
 */
export function formatTokenAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M ONU`;
  } else if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K ONU`;
  } else {
    return `${amount.toFixed(0)} ONU`;
  }
}

/**
 * Calculate projected burn rate based on network activity
 */
export function calculateProjectedBurn(dailyPosts: number, avgEngagement: number): {
  dailyBurn: number;
  monthlyBurn: number;
  yearlyBurn: number;
  priceImpact: number;
} {
  const avgStake = TEMPORAL_TOKEN_CONFIG.STAKING_AMOUNT;
  const avgDecayRate = TEMPORAL_TOKEN_CONFIG.DECAY_RATE_PER_HOUR * 24; // Daily decay
  const engagementReduction = avgEngagement * TEMPORAL_TOKEN_CONFIG.ENGAGEMENT_MULTIPLIER;
  
  const effectiveDecayRate = Math.max(0, avgDecayRate - engagementReduction) / 100;
  
  const dailyBurn = dailyPosts * avgStake * effectiveDecayRate;
  const monthlyBurn = dailyBurn * 30;
  const yearlyBurn = dailyBurn * 365;
  
  const priceImpact = yearlyBurn / TEMPORAL_TOKEN_CONFIG.INITIAL_SUPPLY;
  
  return {
    dailyBurn: Math.floor(dailyBurn),
    monthlyBurn: Math.floor(monthlyBurn),
    yearlyBurn: Math.floor(yearlyBurn),
    priceImpact: Math.round(priceImpact * 10000) / 100 // Percentage
  };
}