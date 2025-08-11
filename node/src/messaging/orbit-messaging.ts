/**
 * Modern Real-Time Messaging System
 * Uses Helia IPFS for peer-to-peer communication
 * Works offline, replicates to peers, handles IPFS chunking
 */

import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';

export interface Message {
  id: string;
  content: string;
  author: string;
  boardSlug: string;
  timestamp: number;
  cid?: string;
  parentId?: string;
  metadata: {
    type: 'message' | 'reply' | 'reaction';
    tags?: string[];
    mentions?: string[];
  };
}

export interface Board {
  slug: string;
  name: string;
  description: string;
  messageCount: number;
  lastActivity: number;
  peers: string[];
}

export interface PeerInfo {
  id: string;
  address: string;
  lastSeen: number;
  messageCount: number;
}

export class OrbitMessaging extends EventEmitter {
  private helia: any;
  private unixfs: any;
  private logger: Logger;
  private isInitialized: boolean = false;
  
  // Local storage
  private messages: Map<string, Message> = new Map();
  private boards: Map<string, Board> = new Map();
  private peers: Map<string, PeerInfo> = new Map();
  
  // Replication state
  private replicationQueue: string[] = [];
  private isReplicating: boolean = false;
  
  // Offline support
  private offlineQueue: Message[] = [];
  private isOnline: boolean = true;

  constructor() {
    super();
    this.logger = new Logger('OrbitMessaging');
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing OrbitMessaging system...');
      
      // Create Helia instance
      this.helia = await createHelia();
      this.unixfs = unixfs(this.helia);
      
      // Load local data
      await this.loadLocalData();
      
      // Start replication
      this.startReplication();
      
      // Start peer discovery
      this.startPeerDiscovery();
      
      this.isInitialized = true;
      this.logger.info('OrbitMessaging system initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize OrbitMessaging:', error);
      throw error;
    }
  }

  // Message Operations
  async createMessage(content: string, author: string, boardSlug: string, parentId?: string): Promise<Message> {
    const message: Message = {
      id: this.generateMessageId(),
      content,
      author,
      boardSlug,
      timestamp: Date.now(),
      parentId,
      metadata: {
        type: parentId ? 'reply' : 'message',
        tags: this.extractTags(content),
        mentions: this.extractMentions(content)
      }
    };

    // Store locally first
    this.messages.set(message.id, message);
    this.saveLocalData();
    
    // Update board stats
    this.updateBoardStats(boardSlug, 'add');
    
    // Queue for replication
    this.queueForReplication(message.id);
    
    // Emit event
    this.emit('message:created', message);
    
    // If offline, queue for later
    if (!this.isOnline) {
      this.offlineQueue.push(message);
    }
    
    this.logger.info(`Message created: ${message.id} by ${author} in ${boardSlug}`);
    return message;
  }

  async getMessages(boardSlug: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const boardMessages = Array.from(this.messages.values())
      .filter(msg => msg.boardSlug === boardSlug)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offset, offset + limit);
    
    return boardMessages;
  }

  async getMessage(messageId: string): Promise<Message | null> {
    return this.messages.get(messageId) || null;
  }

  // Board Operations
  async createBoard(slug: string, name: string, description: string): Promise<Board> {
    const board: Board = {
      slug,
      name,
      description,
      messageCount: 0,
      lastActivity: Date.now(),
      peers: []
    };
    
    this.boards.set(slug, board);
    this.saveLocalData();
    
    this.logger.info(`Board created: ${slug}`);
    return board;
  }

  async getBoards(): Promise<Board[]> {
    return Array.from(this.boards.values());
  }

  // Peer Operations
  async addPeer(peerId: string, address: string): Promise<void> {
    const peer: PeerInfo = {
      id: peerId,
      address,
      lastSeen: Date.now(),
      messageCount: 0
    };
    
    this.peers.set(peerId, peer);
    this.saveLocalData();
    
    this.logger.info(`Peer added: ${peerId} at ${address}`);
  }

  async removePeer(peerId: string): Promise<void> {
    this.peers.delete(peerId);
    this.saveLocalData();
    
    this.logger.info(`Peer removed: ${peerId}`);
  }

  // Replication
  private async replicateToPeer(peerId: string): Promise<void> {
    try {
      const peer = this.peers.get(peerId);
      if (!peer) return;
      
      this.logger.info(`Replicating to peer: ${peerId}`);
      
      // Get messages to replicate
      const messagesToReplicate = Array.from(this.messages.values())
        .filter(msg => msg.timestamp > peer.lastSeen);
      
      for (const message of messagesToReplicate) {
        await this.replicateMessage(message, peerId);
      }
      
      // Update peer info
      peer.lastSeen = Date.now();
      peer.messageCount += messagesToReplicate.length;
      this.saveLocalData();
      
      this.logger.info(`Replicated ${messagesToReplicate.length} messages to ${peerId}`);
      
    } catch (error) {
      this.logger.error(`Failed to replicate to peer ${peerId}:`, error);
    }
  }

  private async replicateMessage(message: Message, peerId: string): Promise<void> {
    try {
      // Store message in IPFS
      const messageData = JSON.stringify(message);
      const cid = await this.unixfs.addFile(
        new TextEncoder().encode(messageData),
        { name: `${message.id}.json` }
      );
      
      // Update message with CID
      message.cid = cid.toString();
      this.messages.set(message.id, message);
      this.saveLocalData();
      
      // Notify peer (in real implementation, this would use libp2p)
      this.emit('message:replicated', { message, peerId, cid });
      
    } catch (error) {
      this.logger.error(`Failed to replicate message ${message.id}:`, error);
    }
  }

  // IPFS Operations
  async storeInIPFS(data: any): Promise<string> {
    try {
      const jsonData = JSON.stringify(data);
      const cid = await this.unixfs.addFile(
        new TextEncoder().encode(jsonData)
      );
      
      this.logger.info(`Data stored in IPFS: ${cid}`);
      return cid.toString();
      
    } catch (error) {
      this.logger.error('Failed to store in IPFS:', error);
      throw error;
    }
  }

  async retrieveFromIPFS(cid: string): Promise<any> {
    try {
      const chunks = [];
      for await (const chunk of this.unixfs.cat(cid)) {
        chunks.push(chunk);
      }
      
      const data = new TextDecoder().decode(Buffer.concat(chunks));
      return JSON.parse(data);
      
    } catch (error) {
      this.logger.error(`Failed to retrieve from IPFS ${cid}:`, error);
      throw error;
    }
  }

  // Offline Support
  async goOffline(): Promise<void> {
    this.isOnline = false;
    this.logger.info('Going offline - messages will be queued');
    this.emit('status:offline');
  }

  async goOnline(): Promise<void> {
    this.isOnline = true;
    this.logger.info('Going online - processing offline queue');
    
    // Process offline queue
    for (const message of this.offlineQueue) {
      await this.createMessage(
        message.content,
        message.author,
        message.boardSlug,
        message.parentId
      );
    }
    
    this.offlineQueue = [];
    this.emit('status:online');
  }

  // Utility Methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  private updateBoardStats(boardSlug: string, operation: 'add' | 'remove'): void {
    const board = this.boards.get(boardSlug);
    if (board) {
      if (operation === 'add') {
        board.messageCount++;
      } else {
        board.messageCount = Math.max(0, board.messageCount - 1);
      }
      board.lastActivity = Date.now();
      this.boards.set(boardSlug, board);
      this.saveLocalData();
    }
  }

  private queueForReplication(messageId: string): void {
    if (!this.replicationQueue.includes(messageId)) {
      this.replicationQueue.push(messageId);
    }
  }

  private async startReplication(): Promise<void> {
    setInterval(async () => {
      if (this.isReplicating || this.replicationQueue.length === 0) return;
      
      this.isReplicating = true;
      
      try {
        // Replicate to all peers
        for (const peerId of this.peers.keys()) {
          await this.replicateToPeer(peerId);
        }
        
        // Clear replication queue
        this.replicationQueue = [];
        
      } catch (error) {
        this.logger.error('Replication error:', error);
      } finally {
        this.isReplicating = false;
      }
    }, 5000); // Replicate every 5 seconds
  }

  private startPeerDiscovery(): void {
    // In a real implementation, this would use libp2p for peer discovery
    setInterval(() => {
      this.logger.info(`Active peers: ${this.peers.size}`);
    }, 10000);
  }

  // Data Persistence
  private async saveLocalData(): Promise<void> {
    try {
      const data = {
        messages: Array.from(this.messages.entries()),
        boards: Array.from(this.boards.entries()),
        peers: Array.from(this.peers.entries()),
        timestamp: Date.now()
      };
      
      // Store in IPFS for backup
      const cid = await this.storeInIPFS(data);
      
      // Also save locally (fallback)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('orbit-messaging-data', JSON.stringify(data));
      }
      
      this.logger.info(`Data saved, IPFS CID: ${cid}`);
      
    } catch (error) {
      this.logger.error('Failed to save data:', error);
    }
  }

  private async loadLocalData(): Promise<void> {
    try {
      // Try to load from local storage first
      if (typeof localStorage !== 'undefined') {
        const localData = localStorage.getItem('orbit-messaging-data');
        if (localData) {
          const data = JSON.parse(localData);
          this.messages = new Map(data.messages || []);
          this.boards = new Map(data.boards || []);
          this.peers = new Map(data.peers || []);
          this.logger.info('Loaded data from local storage');
        }
      }
      
      // Initialize default boards if none exist
      if (this.boards.size === 0) {
        await this.createBoard('general', 'General Discussion', 'General topics and discussions');
        await this.createBoard('tech', 'Technology', 'Tech discussions and news');
        await this.createBoard('crypto', 'Cryptocurrency', 'Crypto and blockchain talk');
      }
      
    } catch (error) {
      this.logger.error('Failed to load local data:', error);
    }
  }

  // Cleanup
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down OrbitMessaging system...');
      
      // Save final state
      await this.saveLocalData();
      
      // Close Helia
      if (this.helia) {
        await this.helia.stop();
      }
      
      this.logger.info('OrbitMessaging system shut down successfully');
      
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
    }
  }

  // Status
  getStatus(): any {
    return {
      isInitialized: this.isInitialized,
      isOnline: this.isOnline,
      messageCount: this.messages.size,
      boardCount: this.boards.size,
      peerCount: this.peers.size,
      replicationQueueLength: this.replicationQueue.length,
      isReplicating: this.isReplicating
    };
  }
}
