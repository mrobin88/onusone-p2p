/**
 * OnusOne Shared Library
 * Common types, utilities, and algorithms for the P2P network
 */

// Core types
export * from './types';

// Decay algorithm (core innovation)
export * from './decay';

// P2P networking utilities
export * from './p2p';

// Version info
export const VERSION = '0.1.0';
export const PROTOCOL_VERSION = 1;

// Default configurations
export const DEFAULT_CONFIG = {
  network: {
    port: 8887,
    maxPeers: 50,
    heartbeatInterval: 30000, // 30 seconds
  },
  storage: {
    maxStorageGB: 100,
    cleanupInterval: 3600000, // 1 hour
    replicationFactor: 3,
  },
  decay: {
    updateInterval: 60000, // 1 minute
    batchSize: 100,
  },
  bounty: {
    weeklyResetDay: 0, // Sunday
    votingPeriodHours: 48,
    minimumSubmissions: 3,
  }
};

// Utility functions
export const utils = {
  /**
   * Sleep for specified milliseconds
   */
  sleep: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Format bytes to human readable string
   */
  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Generate random ID
   */
  generateId: (): string => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  },

  /**
   * Validate wallet address (simplified Solana format)
   */
  isValidWalletAddress: (address: string): boolean => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  },

  /**
   * Calculate reputation score
   */
  calculateReputation: (metrics: {
    messagesPosted: number;
    messagesUpvoted: number;
    repliesReceived: number;
    daysActive: number;
  }): number => {
    const { messagesPosted, messagesUpvoted, repliesReceived, daysActive } = metrics;
    
    // Base score from activity
    const activityScore = Math.min(messagesPosted * 2, 200);
    
    // Quality score from upvotes
    const qualityScore = Math.min(messagesUpvoted * 5, 300);
    
    // Engagement score from replies received
    const engagementScore = Math.min(repliesReceived * 3, 200);
    
    // Consistency bonus for regular participation
    const consistencyBonus = Math.min(daysActive * 1, 100);
    
    return Math.round(activityScore + qualityScore + engagementScore + consistencyBonus);
  }
};