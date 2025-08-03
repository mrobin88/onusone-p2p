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
  HASH_ALGORITHM: 'SHA256'
};

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
      const response = await fetch(`${this.apiUrl}/api/v0/add`, {
        method: 'POST',
        body: new FormData().append('file', new Blob([content]))
      });
      
      const result = await response.json();
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
}

/**
 * Content Synchronization Manager
 */
export class ContentSynchronizer {
  private ipfs: IPFSManager;
  private localCache: Map<string, any> = new Map();
  
  constructor() {
    this.ipfs = new IPFSManager();
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
   * Clear old cache entries based on decay scores
   */
  cleanupCache(): void {
    const now = new Date();
    for (const [messageId, message] of this.localCache.entries()) {
      // Remove messages that have fully decayed
      if (message.decayScore <= 0) {
        this.localCache.delete(messageId);
      }
    }
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

// Export singleton instances for convenience
export const ipfsManager = new IPFSManager();
export const messageDistributor = new MessageDistributor();
export const contentSynchronizer = new ContentSynchronizer();
export const networkHealthMonitor = new NetworkHealthMonitor();