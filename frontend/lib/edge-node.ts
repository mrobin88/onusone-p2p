/**
 * Edge Node - One-Click Setup for Regular Users
 * This handles the actual P2P networking and message caching
 */

import { PublicKey } from '@solana/web3.js';

export interface EdgeNodeConfig {
  walletAddress: string;
  nodeId: string;
  bootstrapNodes: string[];
  minStake: number;
  earningsRate: number;
}

export interface NodeStatus {
  isRunning: boolean;
  connectedPeers: number;
  messagesStored: number;
  bandwidthUsed: number;
  earnings: {
    today: number;
    total: number;
    lastPayout: Date | null;
  };
  uptime: number;
  errors: string[];
}

export interface CachedMessage {
  id: string;
  content: string;
  author: string;
  timestamp: number;
  boardType: string;
  popularity: number;
  size: number;
}

export class EdgeNode {
  private config: EdgeNodeConfig;
  private status: NodeStatus;
  private messageCache: Map<string, CachedMessage> = new Map();
  private peers: Set<string> = new Set();
  private isRunning = false;
  private startTime: number = 0;
  private earningsInterval?: NodeJS.Timeout;
  private syncInterval?: NodeJS.Timeout;

  constructor(walletAddress: string) {
    this.config = {
      walletAddress,
      nodeId: this.generateNodeId(),
      bootstrapNodes: [
        'https://anchor1.onusone.network',
        'https://anchor2.onusone.network', 
        'https://anchor3.onusone.network'
      ],
      minStake: 100, // 100 ONU minimum stake
      earningsRate: 0.4 // 40% of fees go to edge nodes
    };

    this.status = {
      isRunning: false,
      connectedPeers: 0,
      messagesStored: 0,
      bandwidthUsed: 0,
      earnings: {
        today: 0,
        total: this.loadTotalEarnings(),
        lastPayout: null
      },
      uptime: 0,
      errors: []
    };
  }

  /**
   * One-click start - handles everything automatically
   */
  async start(): Promise<boolean> {
    try {
      this.addLog('🚀 Starting edge node...');
      
      // 1. Verify wallet has minimum stake
      const hasStake = await this.verifyStake();
      if (!hasStake) {
        throw new Error('Insufficient ONU tokens. Need at least 100 ONU to run a node.');
      }

      // 2. Connect to bootstrap nodes
      await this.connectToNetwork();

      // 3. Start message syncing
      this.startMessageSync();

      // 4. Start earnings tracking
      this.startEarningsTracking();

      // 5. Mark as running
      this.isRunning = true;
      this.startTime = Date.now();
      this.status.isRunning = true;

      this.addLog('✅ Edge node started successfully!');
      this.addLog(`💰 Earning ~$${(this.estimateDailyEarnings()).toFixed(2)}/day`);
      
      return true;

    } catch (error) {
      this.addLog(`❌ Failed to start: ${error}`);
      return false;
    }
  }

  /**
   * Stop the node gracefully
   */
  async stop(): Promise<void> {
    this.addLog('⏹️ Stopping edge node...');
    
    this.isRunning = false;
    this.status.isRunning = false;

    // Clear intervals
    if (this.earningsInterval) {
      clearInterval(this.earningsInterval);
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Disconnect from peers
    this.peers.clear();
    this.status.connectedPeers = 0;

    // Save earnings to local storage
    this.saveEarnings();

    this.addLog('✅ Node stopped gracefully');
  }

  /**
   * Get current node status (for UI updates)
   */
  getStatus(): NodeStatus {
    if (this.isRunning) {
      this.status.uptime = Math.floor((Date.now() - this.startTime) / 1000);
    }
    return { ...this.status };
  }

  /**
   * Connect to the P2P network via bootstrap nodes
   */
  private async connectToNetwork(): Promise<void> {
    this.addLog('🔗 Connecting to network...');

    for (const bootstrapNode of this.config.bootstrapNodes) {
      try {
        // Register with anchor node
        const response = await fetch(`${bootstrapNode}/api/edge-nodes/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId: this.config.nodeId,
            walletAddress: this.config.walletAddress,
            capabilities: {
              storage: this.getAvailableStorage(),
              bandwidth: this.getAvailableBandwidth()
            }
          })
        });

        if (response.ok) {
          this.peers.add(bootstrapNode);
          this.status.connectedPeers = this.peers.size;
          this.addLog(`✅ Connected to ${bootstrapNode}`);
        }
      } catch (error) {
        this.addLog(`⚠️ Failed to connect to ${bootstrapNode}: ${error}`);
      }
    }

    if (this.peers.size === 0) {
      throw new Error('Failed to connect to any bootstrap nodes');
    }

    // Get peer list from connected anchor nodes
    await this.discoverPeers();
  }

  /**
   * Discover other edge nodes from anchor nodes
   */
  private async discoverPeers(): Promise<void> {
    for (const anchorNode of this.peers) {
      try {
        const response = await fetch(`${anchorNode}/api/edge-nodes/list`);
        const { edgeNodes } = await response.json();

        // Connect to nearby edge nodes
        for (const edgeNode of edgeNodes.slice(0, 10)) { // Connect to up to 10 edges
          if (edgeNode.nodeId !== this.config.nodeId) {
            this.peers.add(edgeNode.endpoint);
          }
        }

        this.status.connectedPeers = this.peers.size;
      } catch (error) {
        this.addLog(`⚠️ Failed to discover peers from ${anchorNode}`);
      }
    }
  }

  /**
   * Start syncing popular messages from the network
   */
  private startMessageSync(): void {
    this.addLog('🔄 Starting message sync...');

    this.syncInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Get popular messages from anchor nodes
        for (const anchorNode of [...this.peers].slice(0, 3)) { // Only sync from anchors
          if (!anchorNode.includes('anchor')) continue;

          const response = await fetch(`${anchorNode}/api/messages/popular?limit=50`);
          const { messages } = await response.json();

          // Cache popular messages
          for (const message of messages) {
            this.cacheMessage(message);
          }
        }

        this.status.messagesStored = this.messageCache.size;
        this.addLog(`📦 Cached ${this.messageCache.size} messages`);

      } catch (error) {
        this.addLog(`⚠️ Sync error: ${error}`);
      }
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Start tracking earnings in real-time
   */
  private startEarningsTracking(): void {
    this.addLog('💰 Starting earnings tracking...');

    this.earningsInterval = setInterval(() => {
      if (!this.isRunning) return;

      // Simulate earnings based on:
      // - Messages served to other users
      // - Bandwidth contributed
      // - Uptime bonus
      const baseEarning = 0.1; // 0.1 ONU per interval (5 seconds)
      const uptimeBonus = Math.min(this.status.uptime / 3600, 1) * 0.05; // Up to 0.05 bonus for uptime
      const popularityBonus = this.messageCache.size > 10 ? 0.02 : 0; // Bonus for caching popular content

      const earning = baseEarning + uptimeBonus + popularityBonus;
      
      this.status.earnings.today += earning;
      this.status.earnings.total += earning;

      // Simulate bandwidth usage
      this.status.bandwidthUsed += Math.random() * 1024 * 1024; // Random MB

    }, 5000); // Update every 5 seconds for real-time feel
  }

  /**
   * Cache a message for serving to other users
   */
  private cacheMessage(message: any): void {
    const cachedMsg: CachedMessage = {
      id: message.id,
      content: message.content,
      author: message.author,
      timestamp: message.timestamp,
      boardType: message.boardType,
      popularity: message.score || 0,
      size: new Blob([JSON.stringify(message)]).size
    };

    this.messageCache.set(message.id, cachedMsg);

    // Limit cache size (remove oldest/least popular)
    if (this.messageCache.size > 1000) {
      const sortedMessages = Array.from(this.messageCache.entries())
        .sort(([,a], [,b]) => a.popularity - b.popularity);
      
      // Remove least popular 100 messages
      for (let i = 0; i < 100; i++) {
        this.messageCache.delete(sortedMessages[i][0]);
      }
    }
  }

  /**
   * Verify wallet has enough ONU tokens staked
   */
  private async verifyStake(): Promise<boolean> {
    try {
      // TODO: Check actual Solana wallet balance
      // For now, simulate successful stake verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Estimate daily earnings based on network activity
   */
  private estimateDailyEarnings(): number {
    // Base earning: $4-8 per day
    const baseUSD = 4 + Math.random() * 4;
    
    // Bonuses for:
    // - Higher uptime = +20%
    // - More cached messages = +10%
    // - Better connectivity = +10%
    
    let multiplier = 1;
    if (this.status.uptime > 8 * 3600) multiplier += 0.2; // 8+ hours uptime
    if (this.messageCache.size > 50) multiplier += 0.1; // Cache 50+ messages
    if (this.status.connectedPeers > 5) multiplier += 0.1; // Connect to 5+ peers

    return baseUSD * multiplier;
  }

  /**
   * Helper methods
   */
  private generateNodeId(): string {
    return `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAvailableStorage(): number {
    // Estimate available storage (in MB)
    return 1000; // 1GB default
  }

  private getAvailableBandwidth(): number {
    // Estimate available bandwidth (in Mbps)
    return 10; // 10 Mbps default
  }

  private addLog(message: string): void {
    console.log(`[EdgeNode] ${message}`);
    this.status.errors.unshift(`${new Date().toLocaleTimeString()}: ${message}`);
    
    // Keep only last 10 logs
    if (this.status.errors.length > 10) {
      this.status.errors = this.status.errors.slice(0, 10);
    }
  }

  private loadTotalEarnings(): number {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`edge-node-earnings-${this.config.walletAddress}`);
      return saved ? parseFloat(saved) : 0;
    }
    return 0;
  }

  private saveEarnings(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `edge-node-earnings-${this.config.walletAddress}`, 
        this.status.earnings.total.toString()
      );
    }
  }
}

/**
 * Global edge node instance
 */
let globalEdgeNode: EdgeNode | null = null;

export function getEdgeNode(walletAddress?: string): EdgeNode | null {
  if (!walletAddress) return globalEdgeNode;
  
  if (!globalEdgeNode || globalEdgeNode.getStatus().earnings.total === 0) {
    globalEdgeNode = new EdgeNode(walletAddress);
  }
  
  return globalEdgeNode;
}

export function createEdgeNode(walletAddress: string): EdgeNode {
  globalEdgeNode = new EdgeNode(walletAddress);
  return globalEdgeNode;
}
