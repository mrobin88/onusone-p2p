/**
 * OnusOne Decay Algorithm - Core Innovation
 * Ported from Django models to pure TypeScript
 * 
 * This algorithm determines content visibility based on:
 * 1. Natural decay over time (-1 point per hour)
 * 2. Community engagement boosts (+2 to +5 points)
 * 3. Quality content survives, noise disappears
 */

import { Message, MessageReaction, ReactionType } from './types';

// Decay Configuration
export const DECAY_CONFIG = {
  // Base decay rate (points lost per hour)
  DECAY_RATE_PER_HOUR: 1,
  
  // Starting scores
  INITIAL_SCORE: 100,
  MINIMUM_VISIBLE_SCORE: 0,
  
  // Engagement boost values
  REPLY_BOOST: 5,
  REACTION_BOOST: 2,
  SHARE_BOOST: 3,
  
  // Premium engagement (verified users, etc.)
  VERIFIED_MULTIPLIER: 1.5,
  HIGH_REPUTATION_THRESHOLD: 100,
  HIGH_REPUTATION_MULTIPLIER: 1.2,
  
  // Time windows
  ENGAGEMENT_WINDOW_HOURS: 24,  // Fresh engagement is worth more
  VIRAL_THRESHOLD: 200,         // Score for viral content
  
  // Anti-spam measures
  MAX_BOOST_PER_USER: 10,       // Max points one user can contribute
  COOLDOWN_MINUTES: 5           // Min time between reactions from same user
};

/**
 * Calculate current decay score for a message
 */
export function calculateDecayScore(message: Message): number {
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - message.createdAt.getTime()) / (1000 * 60 * 60);
  const hoursSinceLastEngagement = (now.getTime() - message.lastEngagement.getTime()) / (1000 * 60 * 60);
  
  // Base decay: lose points over time since last engagement
  const baseDecay = hoursSinceLastEngagement * DECAY_CONFIG.DECAY_RATE_PER_HOUR;
  
  // Calculate current score
  const currentScore = Math.max(0, message.decayScore - baseDecay);
  
  return Math.round(currentScore * 10) / 10; // Round to 1 decimal
}

/**
 * Boost a message's decay score due to engagement
 */
export function boostDecayScore(
  message: Message, 
  engagementType: 'reply' | 'reaction' | 'share',
  engagerReputation: number = 50,
  isVerified: boolean = false
): number {
  let boost = 0;
  
  // Base boost based on engagement type
  switch (engagementType) {
    case 'reply':
      boost = DECAY_CONFIG.REPLY_BOOST;
      break;
    case 'reaction':
      boost = DECAY_CONFIG.REACTION_BOOST;
      break;
    case 'share':
      boost = DECAY_CONFIG.SHARE_BOOST;
      break;
  }
  
  // Apply multipliers for quality users
  if (isVerified) {
    boost *= DECAY_CONFIG.VERIFIED_MULTIPLIER;
  }
  
  if (engagerReputation >= DECAY_CONFIG.HIGH_REPUTATION_THRESHOLD) {
    boost *= DECAY_CONFIG.HIGH_REPUTATION_MULTIPLIER;
  }
  
  // Fresh engagement is worth more
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - message.createdAt.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceCreation <= DECAY_CONFIG.ENGAGEMENT_WINDOW_HOURS) {
    boost *= 1.5; // 50% bonus for early engagement
  }
  
  // Update message
  const newScore = message.decayScore + boost;
  
  return Math.round(newScore * 10) / 10;
}

/**
 * Check if a message is still visible (score > 0)
 */
export function isMessageVisible(message: Message): boolean {
  const currentScore = calculateDecayScore(message);
  return currentScore > DECAY_CONFIG.MINIMUM_VISIBLE_SCORE;
}

/**
 * Get messages sorted by current decay score (most relevant first)
 */
export function sortMessagesByRelevance(messages: Message[]): Message[] {
  return messages
    .map(message => ({
      ...message,
      currentScore: calculateDecayScore(message)
    }))
    .filter(message => message.currentScore > DECAY_CONFIG.MINIMUM_VISIBLE_SCORE)
    .sort((a, b) => b.currentScore - a.currentScore);
}

/**
 * Predict how long a message will remain visible
 */
export function predictMessageLifetime(message: Message): {
  hoursRemaining: number;
  willSurvive: boolean;
  needsEngagement: boolean;
} {
  const currentScore = calculateDecayScore(message);
  const hoursRemaining = currentScore / DECAY_CONFIG.DECAY_RATE_PER_HOUR;
  
  return {
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    willSurvive: hoursRemaining > 24, // Will last more than a day
    needsEngagement: hoursRemaining < 6 // Needs help within 6 hours
  };
}

/**
 * Calculate quality score for weekly summaries
 */
export function calculateMessageQuality(message: Message): number {
  const engagementRatio = (message.replyCount * 5 + message.reactionCount * 2) / Math.max(1, message.decayScore);
  const longevity = calculateDecayScore(message) / DECAY_CONFIG.INITIAL_SCORE;
  const freshness = Math.max(0, 1 - ((Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7))); // Week decay
  
  return (engagementRatio * 0.4 + longevity * 0.4 + freshness * 0.2) * 100;
}

/**
 * Weekly summary data for bounty system
 */
export function generateWeeklySummaryData(messages: Message[]): {
  topMessages: Message[];
  trends: string[];
  stats: {
    totalMessages: number;
    averageLifetime: number;
    engagementRate: number;
    qualityScore: number;
  };
} {
  const visibleMessages = messages.filter(isMessageVisible);
  const topMessages = sortMessagesByRelevance(visibleMessages).slice(0, 10);
  
  // Calculate aggregate stats
  const totalLifetimes = messages.map(m => {
    const lifetime = (m.lastEngagement.getTime() - m.createdAt.getTime()) / (1000 * 60 * 60);
    return lifetime;
  });
  
  const averageLifetime = totalLifetimes.reduce((a, b) => a + b, 0) / totalLifetimes.length;
  const totalEngagements = messages.reduce((sum, m) => sum + m.replyCount + m.reactionCount, 0);
  const engagementRate = totalEngagements / messages.length;
  const averageQuality = messages.reduce((sum, m) => sum + calculateMessageQuality(m), 0) / messages.length;
  
  // Extract trending topics (simplified)
  const trends = extractTrendingTopics(messages);
  
  return {
    topMessages,
    trends,
    stats: {
      totalMessages: messages.length,
      averageLifetime: Math.round(averageLifetime * 10) / 10,
      engagementRate: Math.round(engagementRate * 10) / 10,
      qualityScore: Math.round(averageQuality * 10) / 10
    }
  };
}

/**
 * Extract trending topics from message content (simplified implementation)
 */
function extractTrendingTopics(messages: Message[]): string[] {
  // This would use NLP in production, simplified for now
  const words = messages
    .flatMap(m => m.content.toLowerCase().split(/\s+/))
    .filter(word => word.length > 4) // Filter short words
    .filter(word => !/^(the|and|but|for|are|was|were|been|have|has|had|will|would|could|should)/.test(word));
  
  const wordCounts = words.reduce((counts, word) => {
    counts[word] = (counts[word] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  return Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Simulate message decay over time (for testing)
 */
export function simulateDecayOverTime(message: Message, hours: number): {
  hour: number;
  score: number;
  visible: boolean;
}[] {
  const results = [];
  const originalLastEngagement = new Date(message.lastEngagement);
  
  for (let h = 0; h <= hours; h++) {
    // Simulate time passage
    message.lastEngagement = new Date(originalLastEngagement.getTime() + h * 60 * 60 * 1000);
    
    const score = calculateDecayScore(message);
    results.push({
      hour: h,
      score,
      visible: score > DECAY_CONFIG.MINIMUM_VISIBLE_SCORE
    });
  }
  
  // Restore original timestamp
  message.lastEngagement = originalLastEngagement;
  
  return results;
}