/**
 * Message Persistence Service
 * Handles message storage, retrieval, and IPFS backup
 * Supports staking, rewards, and cross-device sync
 */

import { StoredMessage, MessageStake, BoardStats, UserProfile, StakingReward } from '../database/message-schema';
import { create } from 'ipfs-http-client';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';

export class MessagePersistenceService extends EventEmitter {
  private ipfs: any;
  private logger: Logger;
  private isInitialized: boolean = false;
  
  // In-memory storage (replace with database in production)
  private messages: Map<string, StoredMessage> = new Map();
  private stakes: Map<string, MessageStake> = new Map();
  private users: Map<string, UserProfile> = new Map();
  private boards: Map<string, BoardStats> = new Map();
  private rewards: Map<string, StakingReward> = new Map();

  constructor() {
    super();
    this.logger = new Logger('MessagePersistence');
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Message Persistence Service...');
      
      // Initialize IPFS client
      this.ipfs = create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https'
      });
      
      // Load existing data
      await this.loadExistingData();
      
      // Start maintenance tasks
      this.startMaintenanceTasks();
      
      this.isInitialized = true;
      this.logger.info('Message Persistence Service initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize Message Persistence Service:', error);
      throw error;
    }
  }

  // Message Operations
  async createMessage(
    content: string,
    author: string,
    authorWallet: string,
    boardSlug: string,
    parentId?: string
  ): Promise<StoredMessage> {
    try {
      // Store in IPFS first
      const ipfsCid = await this.storeInIPFS({
        content,
        author,
        authorWallet,
        boardSlug,
        timestamp: Date.now()
      });

      // Create message object
      const message: StoredMessage = {
        id: this.generateMessageId(),
        content,
        author,
        authorWallet,
        boardSlug,
        timestamp: Date.now(),
        ipfsCid,
        parentId,
        stakeAmount: 0,
        totalStakes: 0,
        rewardPool: 0,
        metadata: {
          type: parentId ? 'reply' : 'message',
          tags: this.extractTags(content),
          mentions: this.extractMentions(content),
          quality: 100,
          decayRate: 0.1
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store locally
      this.messages.set(message.id, message);
      
      // Update board stats
      await this.updateBoardStats(boardSlug, 'add_message');
      
      // Update user profile
      await this.updateUserProfile(authorWallet, 'add_message');
      
      // Emit event
      this.emit('message:created', message);
      
      this.logger.info(`Message created: ${message.id} by ${author} in ${boardSlug}`);
      return message;
      
    } catch (error) {
      this.logger.error('Failed to create message:', error);
      throw error;
    }
  }

  async getMessages(boardSlug: string, limit: number = 50, offset: number = 0): Promise<StoredMessage[]> {
    const boardMessages = Array.from(this.messages.values())
      .filter(msg => msg.boardSlug === boardSlug)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offset, offset + limit);
    
    return boardMessages;
  }

  async getMessage(messageId: string): Promise<StoredMessage | null> {
    return this.messages.get(messageId) || null;
  }

  async getUserMessages(wallet: string, limit: number = 50): Promise<StoredMessage[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.authorWallet === wallet)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Staking Operations
  async stakeMessage(
    messageId: string,
    stakerWallet: string,
    stakerUsername: string,
    stakeAmount: number,
    stakeType: 'support' | 'challenge' | 'boost'
  ): Promise<MessageStake> {
    try {
      const message = this.messages.get(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Create stake
      const stake: MessageStake = {
        id: this.generateStakeId(),
        messageId,
        stakerWallet,
        stakerUsername,
        stakeAmount,
        stakeType,
        timestamp: Date.now(),
        rewardMultiplier: this.calculateRewardMultiplier(stakeType, stakeAmount)
      };

      // Store stake
      this.stakes.set(stake.id, stake);
      
      // Update message stats
      message.totalStakes += stakeAmount;
      message.stakeAmount = Math.max(message.stakeAmount, stakeAmount);
      message.metadata.quality = this.calculateMessageQuality(message);
      
      // Update user profile
      await this.updateUserProfile(stakerWallet, 'add_stake', stakeAmount);
      
      // Emit event
      this.emit('stake:created', stake);
      
      this.logger.info(`Stake created: ${stake.id} on message ${messageId} by ${stakerUsername}`);
      return stake;
      
    } catch (error) {
      this.logger.error('Failed to create stake:', error);
      throw error;
    }
  }

  async getMessageStakes(messageId: string): Promise<MessageStake[]> {
    return Array.from(this.stakes.values())
      .filter(stake => stake.messageId === messageId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // IPFS Operations
  private async storeInIPFS(data: any): Promise<string> {
    try {
      const jsonData = JSON.stringify(data);
      const result = await this.ipfs.add(jsonData);
      this.logger.info(`Data stored in IPFS: ${result.cid}`);
      return result.cid.toString();
    } catch (error) {
      this.logger.error('Failed to store in IPFS:', error);
      throw error;
    }
  }

  async retrieveFromIPFS(cid: string): Promise<any> {
    try {
      const chunks = [];
      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
      }
      
      const data = new TextDecoder().decode(Buffer.concat(chunks));
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`Failed to retrieve from IPFS ${cid}:`, error);
      throw error;
    }
  }

  // Utility Methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStakeId(): string {
    return `stake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractTags(content: string): string[] {
    const tagRegex = /#(\w+)/g;
    const tags = [];
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    return tags;
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  }

  private calculateRewardMultiplier(stakeType: string, amount: number): number {
    const baseMultiplier = {
      'support': 1.0,
      'challenge': 1.5,
      'boost': 2.0
    }[stakeType] || 1.0;
    
    return baseMultiplier * (1 + (amount / 1000)); // Higher stakes = higher rewards
  }

  private calculateMessageQuality(message: StoredMessage): number {
    const baseQuality = 100;
    const stakeBonus = Math.min(message.totalStakes / 100, 50); // Max 50 points from stakes
    const timeBonus = Math.max(0, 100 - (Date.now() - message.timestamp) / (1000 * 60 * 60 * 24)); // Decay over days
    
    return Math.min(100, Math.max(0, baseQuality + stakeBonus + timeBonus));
  }

  // Board and User Management
  private async updateBoardStats(boardSlug: string, action: 'add_message' | 'add_stake'): Promise<void> {
    let board = this.boards.get(boardSlug);
    if (!board) {
      board = {
        slug: boardSlug,
        name: boardSlug.charAt(0).toUpperCase() + boardSlug.slice(1),
        description: `${boardSlug} discussion board`,
        totalMessages: 0,
        totalStakes: 0,
        activeUsers: 0,
        lastActivity: new Date(),
        topStakers: []
      };
    }

    if (action === 'add_message') {
      board.totalMessages++;
    } else if (action === 'add_stake') {
      board.totalStakes++;
    }

    board.lastActivity = new Date();
    this.boards.set(boardSlug, board);
  }

  private async updateUserProfile(wallet: string, action: 'add_message' | 'add_stake', amount?: number): Promise<void> {
    let user = this.users.get(wallet);
    if (!user) {
      user = {
        wallet,
        username: `User${Math.floor(Math.random() * 1000)}`,
        totalMessages: 0,
        totalStaked: 0,
        totalEarned: 0,
        reputation: 100,
        level: 1,
        joinedAt: new Date(),
        lastSeen: new Date(),
        preferences: {
          notifications: true,
          autoStake: false,
          stakeThreshold: 100
        }
      };
    }

    if (action === 'add_message') {
      user.totalMessages++;
      user.reputation += 10;
    } else if (action === 'add_stake' && amount) {
      user.totalStaked += amount;
      user.reputation += Math.floor(amount / 100);
    }

    user.lastSeen = new Date();
    user.level = Math.floor(user.reputation / 100) + 1;
    this.users.set(wallet, user);
  }

  // Data Persistence
  private async loadExistingData(): Promise<void> {
    try {
      // Load from localStorage if available (fallback)
      if (typeof localStorage !== 'undefined') {
        const savedMessages = localStorage.getItem('onusone-messages');
        const savedStakes = localStorage.getItem('onusone-stakes');
        const savedUsers = localStorage.getItem('onusone-users');
        
        if (savedMessages) {
          const messages = JSON.parse(savedMessages);
          this.messages = new Map(messages);
        }
        
        if (savedStakes) {
          const stakes = JSON.parse(savedStakes);
          this.stakes = new Map(stakes);
        }
        
        if (savedUsers) {
          const users = JSON.parse(savedUsers);
          this.users = new Map(users);
        }
      }
      
      this.logger.info('Existing data loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load existing data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      // Save to localStorage (fallback)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('onusone-messages', JSON.stringify(Array.from(this.messages.entries())));
        localStorage.setItem('onusone-stakes', JSON.stringify(Array.from(this.stakes.entries())));
        localStorage.setItem('onusone-users', JSON.stringify(Array.from(this.users.entries())));
      }
      
      // Also save to IPFS for backup
      const data = {
        messages: Array.from(this.messages.entries()),
        stakes: Array.from(this.stakes.entries()),
        users: Array.from(this.users.entries()),
        timestamp: Date.now()
      };
      
      const backupCid = await this.storeInIPFS(data);
      this.logger.info(`Data backup saved to IPFS: ${backupCid}`);
      
    } catch (error) {
      this.logger.error('Failed to save data:', error);
    }
  }

  private startMaintenanceTasks(): void {
    // Save data every 5 minutes
    setInterval(() => {
      this.saveData();
    }, 5 * 60 * 1000);
    
    // Clean up old stakes every hour
    setInterval(() => {
      this.cleanupExpiredStakes();
    }, 60 * 60 * 1000);
  }

  private cleanupExpiredStakes(): void {
    const now = Date.now();
    for (const [id, stake] of this.stakes.entries()) {
      if (stake.expiresAt && stake.expiresAt < now) {
        this.stakes.delete(id);
        this.logger.info(`Expired stake removed: ${id}`);
      }
    }
  }

  // Public API
  async getBoardStats(boardSlug: string): Promise<BoardStats | null> {
    return this.boards.get(boardSlug) || null;
  }

  async getUserProfile(wallet: string): Promise<UserProfile | null> {
    return this.users.get(wallet) || null;
  }

  async searchMessages(query: string, boardSlug?: string): Promise<StoredMessage[]> {
    const messages = boardSlug 
      ? Array.from(this.messages.values()).filter(msg => msg.boardSlug === boardSlug)
      : Array.from(this.messages.values());
    
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(query.toLowerCase()) ||
      msg.author.toLowerCase().includes(query.toLowerCase()) ||
      msg.metadata.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }

  // Cleanup
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down Message Persistence Service...');
      await this.saveData();
      this.logger.info('Message Persistence Service shut down successfully');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
    }
  }
}
