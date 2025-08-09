/**
 * Simple Economics - Free Posts + Optional Boosts + Time-Based Node Earnings
 * Based on familiar internet patterns (Reddit awards, hourly wages)
 */

import { PublicKey } from '@solana/web3.js';
import { realSolanaPayments } from './real-solana-payments';

export interface BoostTier {
  name: string;
  amount: number;
  multiplier: number;
  description: string;
  color: string;
  icon: string;
}

export interface MessageBoost {
  messageId: string;
  boosterWallet: string;
  amount: number;
  timestamp: number;
  signature: string; // Solana transaction
}

export interface NodeEarnings {
  baseRate: number; // ONU per hour
  hoursOnline: number;
  performanceMultiplier: number;
  totalEarned: number;
  estimatedDaily: number;
  estimatedMonthly: number;
}

export interface SimpleMessage {
  id: string;
  content: string;
  author: string;
  authorWallet: string;
  timestamp: number;
  boosts: MessageBoost[];
  totalBoosted: number;
  visibilityScore: number;
  expiresAt: number;
  boardType: string;
}

/**
 * Boost tiers - like Reddit awards but for message visibility
 */
export const BOOST_TIERS: BoostTier[] = [
  {
    name: 'Small Boost',
    amount: 1,
    multiplier: 1.2,
    description: 'Slight visibility boost for 6 hours',
    color: 'text-gray-600',
    icon: '⬆️'
  },
  {
    name: 'Medium Boost',
    amount: 5,
    multiplier: 2.0,
    description: 'Good visibility boost for 12 hours',
    color: 'text-blue-600',
    icon: '🚀'
  },
  {
    name: 'High Boost', 
    amount: 10,
    multiplier: 3.0,
    description: 'Strong visibility boost for 24 hours',
    color: 'text-yellow-600',
    icon: '⭐'
  },
  {
    name: 'Premium Boost',
    amount: 25,
    multiplier: 5.0,
    description: 'Maximum visibility for 48 hours',
    color: 'text-purple-600',
    icon: '💎'
  }
];

export class SimpleEconomics {
  private baseNodeRate = 2; // 2 ONU per hour base rate

  /**
   * Post a message for FREE (no payment required)
   */
  async postMessage(
    content: string,
    authorWallet: string,
    boardType: string = 'general'
  ): Promise<SimpleMessage> {
    
    const message: SimpleMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      author: this.getDisplayName(authorWallet),
      authorWallet,
      timestamp: Date.now(),
      boosts: [],
      totalBoosted: 0,
      visibilityScore: 1, // Base visibility score
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours default
      boardType
    };

    console.log(`📝 Posted free message: ${message.id}`);
    return message;
  }

  /**
   * Boost a message for better visibility (OPTIONAL)
   */
  async boostMessage(
    messageId: string,
    boosterWallet: string,
    boostAmount: number,
    signature: string
  ): Promise<MessageBoost> {
    
    // Verify Solana transaction
    const isValid = await realSolanaPayments.verifyPayment(signature);
    if (!isValid) {
      throw new Error('Invalid boost payment');
    }

    const boost: MessageBoost = {
      messageId,
      boosterWallet,
      amount: boostAmount,
      timestamp: Date.now(),
      signature
    };

    console.log(`🚀 Message ${messageId} boosted with ${boostAmount} ONU`);
    return boost;
  }

  /**
   * Calculate message visibility score based on boosts
   */
  calculateVisibilityScore(message: SimpleMessage): number {
    const now = Date.now();
    const ageHours = (now - message.timestamp) / (1000 * 60 * 60);
    
    // Base score starts at 1 and decays over time
    let baseScore = Math.max(0.1, 1 - (ageHours * 0.1)); // 10% decay per hour
    
    // Add boost multipliers
    let boostMultiplier = 1;
    for (const boost of message.boosts) {
      const tier = this.getBoostTier(boost.amount);
      if (tier) {
        boostMultiplier += tier.multiplier - 1; // Stack multipliers
      }
    }

    // Calculate final score
    const visibilityScore = baseScore * boostMultiplier;
    
    // Update expiry based on boosts
    if (message.totalBoosted > 0) {
      const extraTime = message.totalBoosted * 60 * 60 * 1000; // 1 hour per ONU
      message.expiresAt = Math.max(message.expiresAt, now + extraTime);
    }

    return Math.max(0, visibilityScore);
  }

  /**
   * Get boost tier for given amount
   */
  getBoostTier(amount: number): BoostTier | null {
    // Find the highest tier this amount qualifies for
    const eligibleTiers = BOOST_TIERS.filter(tier => amount >= tier.amount);
    return eligibleTiers.length > 0 ? eligibleTiers[eligibleTiers.length - 1] : null;
  }

  /**
   * Calculate node earnings based on time online
   */
  calculateNodeEarnings(
    hoursOnline: number,
    messagesServed: number,
    networkReliability: number // 0-1 score
  ): NodeEarnings {
    
    // Performance multiplier based on activity
    let performanceMultiplier = 1.0;
    
    // Bonus for serving many messages
    if (messagesServed > 1000) performanceMultiplier += 0.5;
    else if (messagesServed > 500) performanceMultiplier += 0.3;
    else if (messagesServed > 100) performanceMultiplier += 0.1;
    
    // Bonus for network reliability
    performanceMultiplier += networkReliability * 0.5;
    
    // Bonus for long uptime
    if (hoursOnline > 100) performanceMultiplier += 0.3; // Veteran bonus
    
    // Cap at 2x multiplier
    performanceMultiplier = Math.min(2.0, performanceMultiplier);
    
    const totalEarned = hoursOnline * this.baseNodeRate * performanceMultiplier;
    const estimatedDaily = 24 * this.baseNodeRate * performanceMultiplier;
    const estimatedMonthly = estimatedDaily * 30;

    return {
      baseRate: this.baseNodeRate,
      hoursOnline,
      performanceMultiplier,
      totalEarned,
      estimatedDaily,
      estimatedMonthly
    };
  }

  /**
   * Get messages sorted by visibility (replaces old "stake ranking")
   */
  sortMessagesByVisibility(messages: SimpleMessage[]): SimpleMessage[] {
    const now = Date.now();
    
    // Filter out expired messages
    const activeMessages = messages.filter(msg => msg.expiresAt > now);
    
    // Update visibility scores
    for (const message of activeMessages) {
      message.visibilityScore = this.calculateVisibilityScore(message);
    }
    
    // Sort by visibility score (highest first)
    return activeMessages.sort((a, b) => b.visibilityScore - a.visibilityScore);
  }

  /**
   * Calculate boost revenue distribution to node operators
   */
  calculateBoostRevenue(totalBoosts: number): {
    nodeOperators: number;
    treasury: number;
    development: number;
  } {
    return {
      nodeOperators: totalBoosts * 0.7,  // 70% to nodes
      treasury: totalBoosts * 0.2,       // 20% to treasury
      development: totalBoosts * 0.1     // 10% to development
    };
  }

  /**
   * Get user-friendly boost recommendations
   */
  getBoostRecommendations(messageAge: number): BoostTier[] {
    const ageHours = messageAge / (1000 * 60 * 60);
    
    if (ageHours < 1) {
      // New message - suggest small boosts
      return BOOST_TIERS.slice(0, 2);
    } else if (ageHours < 6) {
      // Medium age - suggest medium boosts
      return BOOST_TIERS.slice(1, 3);
    } else {
      // Older message - suggest high boosts to revive
      return BOOST_TIERS.slice(2);
    }
  }

  /**
   * Format earnings for display
   */
  formatEarnings(earnings: NodeEarnings): {
    hourly: string;
    daily: string;
    monthly: string;
    performance: string;
  } {
    const hourlyRate = earnings.baseRate * earnings.performanceMultiplier;
    
    return {
      hourly: `${hourlyRate.toFixed(2)} ONU/hour`,
      daily: `${earnings.estimatedDaily.toFixed(0)} ONU/day`,
      monthly: `${earnings.estimatedMonthly.toFixed(0)} ONU/month`,
      performance: `${(earnings.performanceMultiplier * 100).toFixed(0)}%`
    };
  }

  /**
   * Helper methods
   */
  private getDisplayName(walletAddress: string): string {
    return `User${walletAddress.slice(-6)}`;
  }

  /**
   * Estimate node operator earnings scenarios
   */
  getEarningsScenarios(): Array<{
    type: string;
    hoursPerDay: number;
    description: string;
    earnings: NodeEarnings;
  }> {
    return [
      {
        type: 'Casual',
        hoursPerDay: 4,
        description: 'Run node a few hours per day',
        earnings: this.calculateNodeEarnings(4, 50, 0.8)
      },
      {
        type: 'Regular', 
        hoursPerDay: 12,
        description: 'Run node most of the day',
        earnings: this.calculateNodeEarnings(12, 200, 0.9)
      },
      {
        type: 'Professional',
        hoursPerDay: 24,
        description: 'Dedicated 24/7 node operation',
        earnings: this.calculateNodeEarnings(24, 500, 0.95)
      }
    ];
  }
}

// Export singleton instance
export const simpleEconomics = new SimpleEconomics();
