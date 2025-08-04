/**
 * P2P Network Utilities for OnusOne
 * Handles libp2p networking, IPFS storage, and cryptographic operations
 */

import CryptoJS from 'crypto-js';
import { Message, NetworkMessage, NetworkMessageType } from './types';

// Network Configuration
export const P2P_CONFIG = {
  // Network settings
  DEFAULT_PORT: 8887,
  BOOTSTRAP_NODES: [
    '/dns4/bootstrap1.onusone.network/tcp/8887/p2p/12D3KooWBootstrap1',
    '/dns4/bootstrap2.onusone.network/tcp/8887/p2p/12D3KooWBootstrap2'
  ],
  
  // IPFS settings
  IPFS_API_URL: 'http://localhost:5001',
  CONTENT_REPLICATION_FACTOR: 3,
  
  // Message limits
  MAX_MESSAGE_SIZE: 10000,        // 10KB per message
  MAX_MESSAGES_PER_SECOND: 10,
  MAX_STORAGE_PER_NODE: 100,      // 100GB default
  
  // Crypto settings
  SIGNATURE_ALGORITHM: 'ECDSA',
  HASH_ALGORITHM: 'SHA256',
  
  // Reputation settings
  INITIAL_REPUTATION: 100,
  MAX_REPUTATION: 1000,
  MIN_REPUTATION: 0,
  REPUTATION_DECAY_RATE: 0.1,     // Daily decay rate
  
  // Content decay settings
  INITIAL_DECAY_SCORE: 100,
  DECAY_RATE_PER_HOUR: 2,
  ENGAGEMENT_BOOST: 10,
  MIN_DECAY_SCORE: 0
};

/**
 * User Reputation Management
 */
export class ReputationManager {
  private reputationScores: Map<string, number> = new Map();
  private lastUpdateTime: Map<string, Date> = new Map();
  
  /**
   * Get user's current reputation score
   */
  getReputation(userId: string): number {
    this.applyDecay(userId);
    return this.reputationScores.get(userId) || P2P_CONFIG.INITIAL_REPUTATION;
  }
  
  /**
   * Award reputation points for positive actions
   */
  awardReputation(userId: string, points: number, reason: string): void {
    const current = this.getReputation(userId);
    const newScore = Math.min(current + points, P2P_CONFIG.MAX_REPUTATION);
    
    this.reputationScores.set(userId, newScore);
    this.lastUpdateTime.set(userId, new Date());
    
    console.log(`Awarded ${points} reputation to ${userId} for ${reason}. New score: ${newScore}`);
  }
  
  /**
   * Penalize reputation for negative actions
   */
  penalizeReputation(userId: string, points: number, reason: string): void {
    const current = this.getReputation(userId);
    const newScore = Math.max(current - points, P2P_CONFIG.MIN_REPUTATION);
    
    this.reputationScores.set(userId, newScore);
    this.lastUpdateTime.set(userId, new Date());
    
    console.log(`Penalized ${points} reputation from ${userId} for ${reason}. New score: ${newScore}`);
  }
  
  /**
   * Apply natural decay to reputation over time
   */
  private applyDecay(userId: string): void {
    const lastUpdate = this.lastUpdateTime.get(userId);
    if (!lastUpdate) return;
    
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate >= 1) {
      const current = this.reputationScores.get(userId) || P2P_CONFIG.INITIAL_REPUTATION;
      const decay = current * P2P_CONFIG.REPUTATION_DECAY_RATE * daysSinceUpdate;
      const newScore = Math.max(current - decay, P2P_CONFIG.MIN_REPUTATION);
      
      this.reputationScores.set(userId, newScore);
      this.lastUpdateTime.set(userId, now);
    }
  }
  
  /**
   * Get top users by reputation
   */
  getTopUsers(limit: number = 10): { userId: string; reputation: number }[] {
    const users = Array.from(this.reputationScores.entries())
      .map(([userId, reputation]) => ({ userId, reputation: this.getReputation(userId) }))
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, limit);
    
    return users;
  }
}

/**
 * Content Decay Engine
 */
export class ContentDecayEngine {
  private decayScores: Map<string, number> = new Map();
  private lastUpdateTime: Map<string, Date> = new Map();
  private engagementCounts: Map<string, number> = new Map();
  
  /**
   * Initialize decay score for new content
   */
  initializeContent(contentId: string): void {
    this.decayScores.set(contentId, P2P_CONFIG.INITIAL_DECAY_SCORE);
    this.lastUpdateTime.set(contentId, new Date());
    this.engagementCounts.set(contentId, 0);
  }
  
  /**
   * Get current decay score for content
   */
  getDecayScore(contentId: string): number {
    this.applyDecay(contentId);
    return this.decayScores.get(contentId) || 0;
  }
  
  /**
   * Record engagement with content (likes, comments, shares)
   */
  recordEngagement(contentId: string, engagementType: 'like' | 'comment' | 'share'): void {
    const current = this.getDecayScore(contentId);
    const engagementBoost = this.calculateEngagementBoost(engagementType);
    
    const newScore = Math.min(current + engagementBoost, P2P_CONFIG.INITIAL_DECAY_SCORE);
    this.decayScores.set(contentId, newScore);
    this.lastUpdateTime.set(contentId, new Date());
    
    const currentEngagement = this.engagementCounts.get(contentId) || 0;
    this.engagementCounts.set(contentId, currentEngagement + 1);
  }
  
  /**
   * Apply time-based decay to content
   */
  private applyDecay(contentId: string): void {
    const lastUpdate = this.lastUpdateTime.get(contentId);
    if (!lastUpdate) return;
    
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate >= 1) {
      const current = this.decayScores.get(contentId) || 0;
      const decay = P2P_CONFIG.DECAY_RATE_PER_HOUR * hoursSinceUpdate;
      const newScore = Math.max(current - decay, P2P_CONFIG.MIN_DECAY_SCORE);
      
      this.decayScores.set(contentId, newScore);
      this.lastUpdateTime.set(contentId, now);
    }
  }
  
  /**
   * Calculate engagement boost based on type
   */
  private calculateEngagementBoost(engagementType: 'like' | 'comment' | 'share'): number {
    switch (engagementType) {
      case 'like':
        return P2P_CONFIG.ENGAGEMENT_BOOST * 0.5;
      case 'comment':
        return P2P_CONFIG.ENGAGEMENT_BOOST * 1.0;
      case 'share':
        return P2P_CONFIG.ENGAGEMENT_BOOST * 1.5;
      default:
        return 0;
    }
  }
  
  /**
   * Get content sorted by decay score (most valuable first)
   */
  getContentByDecayScore(contentIds: string[]): { contentId: string; score: number }[] {
    return contentIds
      .map(contentId => ({ contentId, score: this.getDecayScore(contentId) }))
      .filter(item => item.score > P2P_CONFIG.MIN_DECAY_SCORE)
      .sort((a, b) => b.score - a.score);
  }
  
  /**
   * Cleanup fully decayed content
   */
  cleanupDecayedContent(): string[] {
    const decayedContent: string[] = [];
    
    for (const [contentId, score] of this.decayScores.entries()) {
      if (this.getDecayScore(contentId) <= P2P_CONFIG.MIN_DECAY_SCORE) {
        decayedContent.push(contentId);
        this.decayScores.delete(contentId);
        this.lastUpdateTime.delete(contentId);
        this.engagementCounts.delete(contentId);
      }
    }
    
    return decayedContent;
  }
}

/**
 * Generate cryptographic hash for content
 */
export function generateContentHash(content: string): string {
  return CryptoJS.SHA256(content).toString();
}

/**
 * Create a network message with signature
 */
export function createNetworkMessage(
  type: NetworkMessageType,
  payload: any,
  senderId: string,
  privateKey?: string // In real implementation, use proper key management
): NetworkMessage {
  const message: NetworkMessage = {
    type,
    payload,
    timestamp: new Date(),
    senderId,
    signature: '',
    version: 1
  };
  
  // Create message signature (simplified - use proper cryptographic library in production)
  const messageString = JSON.stringify({
    type: message.type,
    payload: message.payload,
    timestamp: message.timestamp.toISOString(),
    senderId: message.senderId,
    version: message.version
  });
  
  message.signature = generateContentHash(messageString + (privateKey || 'dev-key'));
  
  return message;
}

/**
 * Verify network message signature
 */
export function verifyNetworkMessage(message: NetworkMessage, publicKey?: string): boolean {
  // Simplified verification - implement proper signature verification in production
  const messageString = JSON.stringify({
    type: message.type,
    payload: message.payload,
    timestamp: message.timestamp,
    senderId: message.senderId,
    version: message.version
  });
  
  const expectedSignature = generateContentHash(messageString + (publicKey || 'dev-key'));
  return message.signature === expectedSignature;
}

/**
 * IPFS Content Management
 */
export class IPFSManager {
  private apiUrl: string;
  
  constructor(apiUrl: string = P2P_CONFIG.IPFS_API_URL) {
    this.apiUrl = apiUrl;
  }
  
  /**
   * Store content on IPFS and return hash
   */
  async storeContent(content: string): Promise<string> {
    try {
      // In production, use proper IPFS client library
      const formData = new FormData();
      formData.append('file', new Blob([content]));
      
      const response = await fetch(`${this.apiUrl}/api/v0/add`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json() as { Hash: string };
      return result.Hash;
    } catch (error) {
      console.error('Failed to store content on IPFS:', error);
      // Fallback to content hash for development
      return generateContentHash(content);
    }
  }
  
  /**
   * Retrieve content from IPFS by hash
   */
  async retrieveContent(hash: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v0/cat?arg=${hash}`);
      return await response.text();
    } catch (error) {
      console.error('Failed to retrieve content from IPFS:', error);
      return null;
    }
  }
  
  /**
   * Pin content to ensure persistence
   */
  async pinContent(hash: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v0/pin/add?arg=${hash}`, {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to pin content:', error);
      return false;
    }
  }
}

/**
 * Message Distribution Manager
 */
export class MessageDistributor {
  private ipfs: IPFSManager;
  private connectedPeers: Set<string> = new Set();
  
  constructor() {
    this.ipfs = new IPFSManager();
  }
  
  /**
   * Distribute a message across the P2P network
   */
  async distributeMessage(message: Message): Promise<{
    ipfsHash: string;
    replicatedNodes: string[];
    success: boolean;
  }> {
    try {
      // Store message content on IPFS
      const messageContent = JSON.stringify({
        content: message.content,
        metadata: {
          id: message.id,
          authorId: message.authorId,
          boardType: message.boardType,
          createdAt: message.createdAt.toISOString()
        }
      });
      
      const ipfsHash = await this.ipfs.storeContent(messageContent);
      
      // Create network distribution message
      const networkMessage = createNetworkMessage(
        NetworkMessageType.MESSAGE_CREATE,
        {
          messageId: message.id,
          ipfsHash,
          boardType: message.boardType,
          decayScore: message.decayScore
        },
        message.authorId
      );
      
      // Distribute to connected peers (simplified)
      const replicatedNodes = await this.replicateToNodes(networkMessage);
      
      return {
        ipfsHash,
        replicatedNodes,
        success: true
      };
    } catch (error) {
      console.error('Failed to distribute message:', error);
      return {
        ipfsHash: '',
        replicatedNodes: [],
        success: false
      };
    }
  }
  
  /**
   * Replicate message to multiple nodes for redundancy
   */
  private async replicateToNodes(networkMessage: NetworkMessage): Promise<string[]> {
    const replicatedNodes: string[] = [];
    const targetReplicas = Math.min(P2P_CONFIG.CONTENT_REPLICATION_FACTOR, this.connectedPeers.size);
    
    // Select nodes for replication (simplified - use proper peer selection in production)
    const selectedPeers = Array.from(this.connectedPeers).slice(0, targetReplicas);
    
    for (const peerId of selectedPeers) {
      try {
        // In production, use libp2p to send message to peer
        await this.sendToPeer(peerId, networkMessage);
        replicatedNodes.push(peerId);
      } catch (error) {
        console.warn(`Failed to replicate to peer ${peerId}:`, error);
      }
    }
    
    return replicatedNodes;
  }
  
  /**
   * Send message to specific peer
   */
  private async sendToPeer(peerId: string, message: NetworkMessage): Promise<void> {
    // Simplified implementation - use libp2p streams in production
    console.log(`Sending message to peer ${peerId}:`, message.type);
  }
  
  /**
   * Add peer to connected peers list
   */
  addPeer(peerId: string): void {
    this.connectedPeers.add(peerId);
  }
  
  /**
   * Remove peer from connected peers list
   */
  removePeer(peerId: string): void {
    this.connectedPeers.delete(peerId);
  }
  
  /**
   * Get network statistics
   */
  getNetworkStats() {
    return {
      connectedPeers: this.connectedPeers.size,
      replicationFactor: P2P_CONFIG.CONTENT_REPLICATION_FACTOR
    };
  }
}

/**
 * Content Synchronization Manager
 */
export class ContentSynchronizer {
  private ipfs: IPFSManager;
  private localCache: Map<string, any> = new Map();
  private decayEngine: ContentDecayEngine;
  
  constructor() {
    this.ipfs = new IPFSManager();
    this.decayEngine = new ContentDecayEngine();
  }
  
  /**
   * Sync messages for a specific board
   */
  async syncBoardMessages(boardType: string, lastSyncTime?: Date): Promise<Message[]> {
    try {
      // Request latest messages from network peers
      const syncRequest = createNetworkMessage(
        NetworkMessageType.CONTENT_REQUEST,
        {
          boardType,
          lastSyncTime: lastSyncTime?.toISOString(),
          requestId: generateContentHash(Date.now().toString())
        },
        'local-node'
      );
      
      // In production, broadcast to network and collect responses
      const messages = await this.collectSyncResponses(syncRequest);
      
      // Validate and cache messages
      const validMessages = messages.filter(msg => this.validateMessage(msg));
      validMessages.forEach(msg => {
        this.localCache.set(msg.id, msg);
      });
      
      return validMessages;
    } catch (error) {
      console.error('Failed to sync board messages:', error);
      return [];
    }
  }
  
  /**
   * Validate message integrity and signatures
   */
  private validateMessage(message: Message): boolean {
    // Check required fields
    if (!message.id || !message.content || !message.authorId) {
      return false;
    }
    
    // Verify content hash matches IPFS hash
    const expectedHash = generateContentHash(message.content);
    if (message.contentHash !== expectedHash) {
      return false;
    }
    
    // Verify message signature (simplified)
    // In production, use proper cryptographic verification
    
    return true;
  }
  
  /**
   * Collect sync responses from network
   */
  private async collectSyncResponses(syncRequest: NetworkMessage): Promise<Message[]> {
    // Simplified implementation - in production, use libp2p pubsub or DHT queries
    return [];
  }
  
  /**
   * Get cached message by ID
   */
  getCachedMessage(messageId: string): Message | null {
    return this.localCache.get(messageId) || null;
  }
  
  /**
   * Record engagement with content
   */
  recordEngagement(messageId: string, engagementType: 'like' | 'comment' | 'share'): void {
    this.decayEngine.recordEngagement(messageId, engagementType);
  }
  
  /**
   * Get messages sorted by decay score
   */
  getMessagesByDecayScore(messageIds: string[]): Message[] {
    const sortedContent = this.decayEngine.getContentByDecayScore(messageIds);
    return sortedContent
      .map((item: { contentId: string; score: number }) => this.getCachedMessage(item.contentId))
      .filter((msg: Message | null) => msg !== null) as Message[];
  }
  
  /**
   * Clear old cache entries based on decay scores
   */
  cleanupCache(): void {
    const decayedContent = this.decayEngine.cleanupDecayedContent();
    decayedContent.forEach((contentId: string) => {
      this.localCache.delete(contentId);
    });
    
    console.log(`Cleaned up ${decayedContent.length} decayed messages`);
  }
}

/**
 * Network Health Monitor
 */
export class NetworkHealthMonitor {
  private healthMetrics = {
    connectedPeers: 0,
    messageLatency: 0,
    storageUsage: 0,
    syncStatus: 'healthy' as 'healthy' | 'degraded' | 'offline'
  };
  
  /**
   * Get current network health
   */
  getHealth() {
    return { ...this.healthMetrics };
  }
  
  /**
   * Update peer count
   */
  updatePeerCount(count: number): void {
    this.healthMetrics.connectedPeers = count;
    this.updateSyncStatus();
  }
  
  /**
   * Update message latency
   */
  updateLatency(latency: number): void {
    this.healthMetrics.messageLatency = latency;
    this.updateSyncStatus();
  }
  
  /**
   * Update storage usage
   */
  updateStorageUsage(usage: number): void {
    this.healthMetrics.storageUsage = usage;
  }
  
  /**
   * Update sync status based on metrics
   */
  private updateSyncStatus(): void {
    if (this.healthMetrics.connectedPeers === 0) {
      this.healthMetrics.syncStatus = 'offline';
    } else if (this.healthMetrics.connectedPeers < 3 || this.healthMetrics.messageLatency > 5000) {
      this.healthMetrics.syncStatus = 'degraded';
    } else {
      this.healthMetrics.syncStatus = 'healthy';
    }
  }
}

/**
 * Unified P2P Service
 */
export class P2PService {
  private messageDistributor: MessageDistributor;
  private contentSynchronizer: ContentSynchronizer;
  private networkHealthMonitor: NetworkHealthMonitor;
  private reputationManager: ReputationManager;
  private decayEngine: ContentDecayEngine;
  
  constructor() {
    this.messageDistributor = new MessageDistributor();
    this.contentSynchronizer = new ContentSynchronizer();
    this.networkHealthMonitor = new NetworkHealthMonitor();
    this.reputationManager = new ReputationManager();
    this.decayEngine = new ContentDecayEngine();
    
    // Start cleanup interval
    setInterval(() => {
      this.contentSynchronizer.cleanupCache();
    }, 60000); // Cleanup every minute
  }
  
  /**
   * Initialize P2P service
   */
  async initialize(): Promise<void> {
    console.log('Initializing P2P Service...');
    // In production, initialize libp2p node, connect to bootstrap peers
  }
  
  /**
   * Distribute a message
   */
  async distributeMessage(message: Message): Promise<boolean> {
    const result = await this.messageDistributor.distributeMessage(message);
    return result.success;
  }
  
  /**
   * Sync board content
   */
  async syncBoard(boardType: string): Promise<Message[]> {
    return await this.contentSynchronizer.syncBoardMessages(boardType);
  }
  
  /**
   * Record user engagement
   */
  recordEngagement(messageId: string, userId: string, engagementType: 'like' | 'comment' | 'share'): void {
    this.contentSynchronizer.recordEngagement(messageId, engagementType);
    this.reputationManager.awardReputation(userId, 1, `${engagementType}_engagement`);
  }
  
  /**
   * Get network status
   */
  getNetworkStatus() {
    const health = this.networkHealthMonitor.getHealth();
    const networkStats = this.messageDistributor.getNetworkStats();
    
    return {
      ...health,
      ...networkStats
    };
  }
  
  /**
   * Get user reputation
   */
  getUserReputation(userId: string): number {
    return this.reputationManager.getReputation(userId);
  }
  
  /**
   * Get content by decay score
   */
  getContentByRelevance(messageIds: string[]): Message[] {
    return this.contentSynchronizer.getMessagesByDecayScore(messageIds);
  }
  
  /**
   * Award reputation to user
   */
  awardReputation(userId: string, points: number, reason: string): void {
    this.reputationManager.awardReputation(userId, points, reason);
  }
  
  /**
   * Penalize user reputation
   */
  penalizeReputation(userId: string, points: number, reason: string): void {
    this.reputationManager.penalizeReputation(userId, points, reason);
  }
  
  /**
   * Get top users by reputation
   */
  getTopUsers(limit: number = 10): { userId: string; reputation: number }[] {
    return this.reputationManager.getTopUsers(limit);
  }
  
  /**
   * Initialize content decay tracking
   */
  initializeContent(contentId: string): void {
    this.decayEngine.initializeContent(contentId);
  }
  
  /**
   * Get content decay score
   */
  getContentDecayScore(contentId: string): number {
    return this.decayEngine.getDecayScore(contentId);
  }
}

// Export singleton instances for convenience
export const ipfsManager = new IPFSManager();
export const messageDistributor = new MessageDistributor();
export const contentSynchronizer = new ContentSynchronizer();
export const networkHealthMonitor = new NetworkHealthMonitor();
export const reputationManager = new ReputationManager();
export const contentDecayEngine = new ContentDecayEngine();
export const p2pService = new P2PService();