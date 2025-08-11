/**
 * Message Database Schema
 * Handles message persistence with IPFS backup
 * Supports staking, rewards, and cross-device sync
 */

export interface StoredMessage {
  id: string;
  content: string;
  author: string;
  authorWallet: string;
  boardSlug: string;
  timestamp: number;
  ipfsCid: string;
  parentId?: string;
  stakeAmount: number;
  totalStakes: number;
  rewardPool: number;
  metadata: {
    type: 'message' | 'reply' | 'reaction';
    tags: string[];
    mentions: string[];
    quality: number;
    decayRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageStake {
  id: string;
  messageId: string;
  stakerWallet: string;
  stakerUsername: string;
  stakeAmount: number;
  stakeType: 'support' | 'challenge' | 'boost';
  timestamp: number;
  expiresAt?: number;
  rewardMultiplier: number;
}

export interface BoardStats {
  slug: string;
  name: string;
  description: string;
  totalMessages: number;
  totalStakes: number;
  activeUsers: number;
  lastActivity: Date;
  topStakers: Array<{
    wallet: string;
    username: string;
    totalStaked: number;
  }>;
}

export interface UserProfile {
  wallet: string;
  username: string;
  totalMessages: number;
  totalStaked: number;
  totalEarned: number;
  reputation: number;
  level: number;
  joinedAt: Date;
  lastSeen: Date;
  preferences: {
    notifications: boolean;
    autoStake: boolean;
    stakeThreshold: number;
  };
}

export interface StakingReward {
  id: string;
  messageId: string;
  recipientWallet: string;
  amount: number;
  reason: 'quality' | 'popularity' | 'longevity' | 'community';
  timestamp: number;
  distributed: boolean;
  transactionHash?: string;
}

// Database indexes for performance
export const MESSAGE_INDEXES = [
  { field: 'boardSlug', type: 'string' },
  { field: 'author', type: 'string' },
  { field: 'timestamp', type: 'number' },
  { field: 'stakeAmount', type: 'number' },
  { field: 'ipfsCid', type: 'string' }
];

export const STAKE_INDEXES = [
  { field: 'messageId', type: 'string' },
  { field: 'stakerWallet', type: 'string' },
  { field: 'timestamp', type: 'number' },
  { field: 'stakeType', type: 'string' }
];

export const USER_INDEXES = [
  { field: 'wallet', type: 'string' },
  { field: 'username', type: 'string' },
  { field: 'reputation', type: 'number' },
  { field: 'level', type: 'number' }
];
