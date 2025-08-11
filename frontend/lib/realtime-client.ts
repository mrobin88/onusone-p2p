/**
 * Frontend Real-Time Messaging Client
 * Connects to OrbitMessaging system via WebSocket
 * Handles real-time communication, offline support, and IPFS integration
 */

import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

export interface RealtimeMessage {
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

export interface RealtimeClientConfig {
  serverUrl: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class RealtimeClient extends EventEmitter {
  private socket: Socket | null = null;
  private config: RealtimeClientConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private currentBoard: string | null = null;
  
  // Local cache for offline support
  private messageCache: Map<string, RealtimeMessage[]> = new Map();
  private offlineQueue: any[] = [];
  private isOnline: boolean = true;

  constructor(config: RealtimeClientConfig) {
    super();
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...config
    };
  }

  async connect(): Promise<void> {
    try {
      this.socket = io(this.config.serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.config.reconnectInterval,
        reconnectionAttempts: this.config.maxReconnectAttempts,
        timeout: 20000
      });

      this.setupSocketHandlers();
      
      return new Promise((resolve, reject) => {
        this.socket!.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          this.isConnected = false;
          this.emit('connection_error', error);
          reject(error);
        });
      });
      
    } catch (error) {
      console.error('Failed to connect to real-time server:', error);
      throw error;
    }
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to real-time server');
      this.isConnected = true;
      this.isOnline = true;
      this.emit('connected');
      
      // Process offline queue
      this.processOfflineQueue();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from real-time server');
      this.isConnected = false;
      this.isOnline = false;
      this.emit('disconnected');
    });

    this.socket.on('reconnect', () => {
      console.log('Reconnected to real-time server');
      this.isConnected = true;
      this.isOnline = true;
      this.emit('reconnected');
      
      // Rejoin current board if any
      if (this.currentBoard) {
        this.joinBoard(this.currentBoard);
      }
    });

    // Message events
    this.socket.on('message:new', (data: any) => {
      const message = data.data;
      this.addMessageToCache(message);
      this.emit('message:new', message);
    });

    this.socket.on('board:messages', (data: any) => {
      const { boardSlug, messages } = data.data;
      this.messageCache.set(boardSlug, messages);
      this.emit('board:messages', { boardSlug, messages });
    });

    // Typing indicators
    this.socket.on('typing:start', (data: any) => {
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data: any) => {
      this.emit('typing:stop', data);
    });

    // Reactions
    this.socket.on('reaction:new', (data: any) => {
      this.emit('reaction:new', data);
    });

    // Status updates
    this.socket.on('status:offline', () => {
      this.isOnline = false;
      this.emit('status:offline');
    });

    this.socket.on('status:online', () => {
      this.isOnline = true;
      this.emit('status:online');
    });

    // Peer updates
    this.socket.on('peer:new', (data: any) => {
      this.emit('peer:new', data);
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  // Board operations
  async joinBoard(boardSlug: string): Promise<void> {
    if (!this.socket || !this.isConnected) {
      throw new Error('Not connected to real-time server');
    }

    try {
      this.currentBoard = boardSlug;
      this.socket.emit('join-board', boardSlug);
      
      // Load cached messages if available
      const cachedMessages = this.messageCache.get(boardSlug);
      if (cachedMessages) {
        this.emit('board:messages', { boardSlug, messages: cachedMessages });
      }
      
      console.log(`Joined board: ${boardSlug}`);
      
    } catch (error) {
      console.error(`Failed to join board ${boardSlug}:`, error);
      throw error;
    }
  }

  async leaveBoard(boardSlug: string): Promise<void> {
    if (!this.socket || !this.isConnected) return;

    try {
      this.socket.emit('leave-board', boardSlug);
      this.currentBoard = null;
      console.log(`Left board: ${boardSlug}`);
      
    } catch (error) {
      console.error(`Failed to leave board ${boardSlug}:`, error);
    }
  }

  // Message operations
  async sendMessage(content: string, author: string, boardSlug: string, parentId?: string): Promise<void> {
    const messageData = {
      content,
      author,
      boardSlug,
      parentId
    };

    if (this.isConnected && this.socket) {
      try {
        this.socket.emit('new-message', messageData);
        console.log('Message sent via real-time');
        
      } catch (error) {
        console.error('Failed to send message via real-time:', error);
        // Fall back to offline queue
        this.queueMessageForOffline(messageData);
      }
    } else {
      // Queue for offline processing
      this.queueMessageForOffline(messageData);
    }
  }

  async getMessages(boardSlug: string, limit: number = 50, offset: number = 0): Promise<RealtimeMessage[]> {
    // Try to get from cache first
    const cachedMessages = this.messageCache.get(boardSlug);
    if (cachedMessages) {
      return cachedMessages.slice(offset, offset + limit);
    }

    // If not cached and online, fetch from server
    if (this.isOnline) {
      try {
        const response = await fetch(`${this.config.serverUrl}/api/boards/${boardSlug}/messages?limit=${limit}&offset=${offset}`);
        if (response.ok) {
          const messages = await response.json();
          this.messageCache.set(boardSlug, messages);
          return messages;
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    }

    return [];
  }

  // Typing indicators
  startTyping(boardSlug: string, author: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing-start', { boardSlug, author });
    }
  }

  stopTyping(boardSlug: string, author: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing-stop', { boardSlug, author });
    }
  }

  // Reactions
  async addReaction(messageId: string, reaction: string, author: string): Promise<void> {
    if (this.socket && this.isConnected) {
      this.socket.emit('add-reaction', { messageId, reaction, author });
    }
  }

  // Peer operations
  async addPeer(peerId: string, address: string): Promise<void> {
    if (this.socket && this.isConnected) {
      this.socket.emit('peer-info', { peerId, address });
    }
  }

  // Offline support
  private queueMessageForOffline(messageData: any): void {
    this.offlineQueue.push({
      ...messageData,
      timestamp: Date.now(),
      offline: true
    });
    
    // Store in localStorage for persistence
    this.saveOfflineQueue();
    
    console.log('Message queued for offline processing');
    this.emit('message:queued', messageData);
  }

  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    console.log(`Processing ${this.offlineQueue.length} offline messages...`);
    
    for (const queuedMessage of this.offlineQueue) {
      try {
        await this.sendMessage(
          queuedMessage.content,
          queuedMessage.author,
          queuedMessage.boardSlug,
          queuedMessage.parentId
        );
        
        // Remove from queue
        this.offlineQueue = this.offlineQueue.filter(msg => msg !== queuedMessage);
        
      } catch (error) {
        console.error('Failed to process offline message:', error);
      }
    }
    
    // Update localStorage
    this.saveOfflineQueue();
    
    console.log('Offline queue processed');
  }

  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('realtime-offline-queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private loadOfflineQueue(): void {
    try {
      const saved = localStorage.getItem('realtime-offline-queue');
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  // Cache management
  private addMessageToCache(message: RealtimeMessage): void {
    const boardMessages = this.messageCache.get(message.boardSlug) || [];
    boardMessages.unshift(message);
    
    // Keep only last 100 messages per board
    if (boardMessages.length > 100) {
      boardMessages.splice(100);
    }
    
    this.messageCache.set(message.boardSlug, boardMessages);
  }

  // Utility methods
  isClientConnected(): boolean {
    return this.isConnected;
  }

  isClientOnline(): boolean {
    return this.isOnline;
  }

  getCurrentBoard(): string | null {
    return this.currentBoard;
  }

  getOfflineQueueLength(): number {
    return this.offlineQueue.length;
  }

  getCachedMessageCount(boardSlug: string): number {
    return this.messageCache.get(boardSlug)?.length || 0;
  }

  // Cleanup
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isOnline = false;
    this.currentBoard = null;
    
    console.log('Disconnected from real-time server');
  }

  // Initialize offline support
  initializeOfflineSupport(): void {
    this.loadOfflineQueue();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('status:online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('status:offline');
    });
  }
}
