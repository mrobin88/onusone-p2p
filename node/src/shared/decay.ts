// Copy of decay algorithm for standalone operation
import { Message } from './types';

export const DECAY_CONFIG = {
  DECAY_RATE_PER_HOUR: 1,
  INITIAL_SCORE: 100,
  MINIMUM_VISIBLE_SCORE: 0,
  REPLY_BOOST: 5,
  REACTION_BOOST: 2,
  SHARE_BOOST: 3,
  VERIFIED_MULTIPLIER: 1.5,
  HIGH_REPUTATION_THRESHOLD: 100,
  HIGH_REPUTATION_MULTIPLIER: 1.2,
  ENGAGEMENT_WINDOW_HOURS: 24,
  VIRAL_THRESHOLD: 200,
  MAX_BOOST_PER_USER: 10,
  COOLDOWN_MINUTES: 5
};

export function calculateDecayScore(message: Message): number {
  const now = new Date();
  const hoursSinceLastEngagement = (now.getTime() - message.lastEngagement.getTime()) / (1000 * 60 * 60);
  const baseDecay = hoursSinceLastEngagement * DECAY_CONFIG.DECAY_RATE_PER_HOUR;
  const currentScore = Math.max(0, message.decayScore - baseDecay);
  return Math.round(currentScore * 10) / 10;
}

export function isMessageVisible(message: Message): boolean {
  const currentScore = calculateDecayScore(message);
  return currentScore > DECAY_CONFIG.MINIMUM_VISIBLE_SCORE;
}

export function generateWeeklySummaryData(messages: Message[]) {
  const visibleMessages = messages.filter(isMessageVisible);
  const topMessages = visibleMessages
    .sort((a, b) => calculateDecayScore(b) - calculateDecayScore(a))
    .slice(0, 10);
  
  return {
    topMessages,
    trends: ['trending1', 'trending2'],
    stats: {
      totalMessages: messages.length,
      averageLifetime: 24,
      engagementRate: 0.5,
      qualityScore: 75
    }
  };
}