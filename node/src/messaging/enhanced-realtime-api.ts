/**
 * Enhanced Real-Time Messaging API
 * Integrates message persistence, staking, and rewards
 * WebSocket endpoints for real-time communication
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { MessagePersistenceService } from '../services/message-persistence';
import { Logger } from '../utils/logger';

export interface RealtimeMessage {
  type: 'message' | 'reply' | 'reaction' | 'stake' | 'reward' | 'status';
  data: any;
  timestamp: number;
}

export class EnhancedRealtimeAPI {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private messagePersistence: MessagePersistenceService;
  private logger: Logger;
  public isRunning: boolean = false;

  constructor(messagePersistence: MessagePersistenceService) {
    this.messagePersistence = messagePersistence;
    this.logger = new Logger('EnhancedRealtimeAPI');
    
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.setupSocketHandlers();
    this.setupExpressRoutes();
    this.setupMessagePersistenceEvents();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      this.logger.info(`Client connected: ${socket.id}`);
      
      // Join board room
      socket.on('join-board', (boardSlug: string) => {
        socket.join(`board:${boardSlug}`);
        this.logger.info(`Client ${socket.id} joined board: ${boardSlug}`);
        
        // Send current board messages
        this.sendBoardMessages(socket, boardSlug);
      });
      
      // Leave board room
      socket.on('leave-board', (boardSlug: string) => {
        socket.leave(`board:${boardSlug}`);
        this.logger.info(`Client ${socket.id} left board: ${boardSlug}`);
      });
      
      // Handle new message
      socket.on('new-message', async (data: {
        content: string;
        author: string;
        authorWallet: string;
        boardSlug: string;
        parentId?: string;
      }) => {
        try {
          const message = await this.messagePersistence.createMessage(
            data.content,
            data.author,
            data.authorWallet,
            data.boardSlug,
            data.parentId
          );
          
          // Broadcast to all clients in the board
          this.io.to(`board:${data.boardSlug}`).emit('message:new', {
            type: 'message',
            data: message,
            timestamp: Date.now()
          });
          
          this.logger.info(`New message broadcasted to board ${data.boardSlug}`);
          
        } catch (error) {
          this.logger.error('Failed to create message:', error);
          socket.emit('error', { message: 'Failed to create message' });
        }
      });
      
      // Handle message staking
      socket.on('stake-message', async (data: {
        messageId: string;
        stakerWallet: string;
        stakerUsername: string;
        stakeAmount: number;
        stakeType: 'support' | 'challenge' | 'boost';
      }) => {
        try {
          const stake = await this.messagePersistence.stakeMessage(
            data.messageId,
            data.stakerWallet,
            data.stakerUsername,
            data.stakeAmount,
            data.stakeType
          );
          
          // Broadcast stake to all clients
          this.io.emit('stake:new', {
            type: 'stake',
            data: stake,
            timestamp: Date.now()
          });
          
          this.logger.info(`New stake created: ${stake.id} on message ${data.messageId}`);
          
        } catch (error) {
          this.logger.error('Failed to create stake:', error);
          socket.emit('error', { message: 'Failed to create stake' });
        }
      });
      
      // Handle typing indicator
      socket.on('typing-start', (data: { boardSlug: string; author: string }) => {
        socket.to(`board:${data.boardSlug}`).emit('typing:start', {
          author: data.author,
          timestamp: Date.now()
        });
      });
      
      socket.on('typing-stop', (data: { boardSlug: string; author: string }) => {
        socket.to(`board:${data.boardSlug}`).emit('typing-stop', {
          author: data.author,
          timestamp: Date.now()
        });
      });
      
      // Handle reactions
      socket.on('add-reaction', async (data: {
        messageId: string;
        reaction: string;
        author: string;
        authorWallet: string;
      }) => {
        try {
          // Create reaction as a reply message
          const reaction = await this.messagePersistence.createMessage(
            `Reacted with: ${data.reaction}`,
            data.author,
            data.authorWallet,
            'reactions', // Special board for reactions
            data.messageId
          );
          
          // Broadcast reaction to all clients
          this.io.emit('reaction:new', {
            type: 'reaction',
            data: reaction,
            timestamp: Date.now()
          });
          
        } catch (error) {
          this.logger.error('Failed to add reaction:', error);
          socket.emit('error', { message: 'Failed to add reaction' });
        }
      });
      
      // Handle user profile updates
      socket.on('update-profile', async (data: {
        wallet: string;
        username: string;
        preferences: any;
      }) => {
        try {
          // This would update user profile in the persistence service
          // For now, just broadcast the update
          this.io.emit('profile:updated', {
            type: 'profile',
            data: data,
            timestamp: Date.now()
          });
          
        } catch (error) {
          this.logger.error('Failed to update profile:', error);
          socket.emit('error', { message: 'Failed to update profile' });
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        this.logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private setupExpressRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'EnhancedRealtimeAPI',
        timestamp: new Date().toISOString(),
        connections: this.io.engine.clientsCount
      });
    });
    
    // Get board messages
    this.app.get('/api/boards/:slug/messages', async (req, res) => {
      try {
        const { slug } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        
        const messages = await this.messagePersistence.getMessages(slug, limit, offset);
        res.json(messages);
        
      } catch (error) {
        this.logger.error('Failed to get messages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
      }
    });
    
    // Create message
    this.app.post('/api/boards/:slug/messages', async (req, res) => {
      try {
        const { slug } = req.params;
        const { content, author, authorWallet, parentId } = req.body;
        
        if (!content || !author || !authorWallet) {
          return res.status(400).json({ error: 'Content, author, and authorWallet are required' });
        }
        
        const message = await this.messagePersistence.createMessage(
          content,
          author,
          authorWallet,
          slug,
          parentId
        );
        
        res.json(message);
        
      } catch (error) {
        this.logger.error('Failed to create message:', error);
        res.status(500).json({ error: 'Failed to create message' });
      }
    });
    
    // Get board stats
    this.app.get('/api/boards/:slug/stats', async (req, res) => {
      try {
        const { slug } = req.params;
        const stats = await this.messagePersistence.getBoardStats(slug);
        
        if (!stats) {
          return res.status(404).json({ error: 'Board not found' });
        }
        
        res.json(stats);
        
      } catch (error) {
        this.logger.error('Failed to get board stats:', error);
        res.status(500).json({ error: 'Failed to get board stats' });
      }
    });
    
    // Get user profile
    this.app.get('/api/users/:wallet/profile', async (req, res) => {
      try {
        const { wallet } = req.params;
        const profile = await this.messagePersistence.getUserProfile(wallet);
        
        if (!profile) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(profile);
        
      } catch (error) {
        this.logger.error('Failed to get user profile:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
      }
    });
    
    // Get user messages
    this.app.get('/api/users/:wallet/messages', async (req, res) => {
      try {
        const { wallet } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        
        const messages = await this.messagePersistence.getUserMessages(wallet, limit);
        res.json(messages);
        
      } catch (error) {
        this.logger.error('Failed to get user messages:', error);
        res.status(500).json({ error: 'Failed to get user messages' });
      }
    });
    
    // Search messages
    this.app.get('/api/search', async (req, res) => {
      try {
        const { q: query, board } = req.query;
        
        if (!query) {
          return res.status(400).json({ error: 'Search query is required' });
        }
        
        const messages = await this.messagePersistence.searchMessages(
          query as string,
          board as string
        );
        
        res.json(messages);
        
      } catch (error) {
        this.logger.error('Failed to search messages:', error);
        res.status(500).json({ error: 'Failed to search messages' });
      }
    });
    
    // Get system status
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = {
          connections: this.io.engine.clientsCount,
          rooms: Object.keys(this.io.sockets.adapter.rooms).length,
          timestamp: new Date().toISOString()
        };
        
        res.json(status);
        
      } catch (error) {
        this.logger.error('Failed to get status:', error);
        res.status(500).json({ error: 'Failed to get status' });
      }
    });
  }

  private setupMessagePersistenceEvents(): void {
    // Handle message creation events
    this.messagePersistence.on('message:created', (message) => {
      this.io.to(`board:${message.boardSlug}`).emit('message:new', {
        type: 'message',
        data: message,
        timestamp: Date.now()
      });
    });
    
    // Handle stake creation events
    this.messagePersistence.on('stake:created', (stake) => {
      this.io.emit('stake:new', {
        type: 'stake',
        data: stake,
        timestamp: Date.now()
      });
    });
  }

  private async sendBoardMessages(socket: any, boardSlug: string): Promise<void> {
    try {
      const messages = await this.messagePersistence.getMessages(boardSlug, 50, 0);
      
      socket.emit('board:messages', {
        type: 'messages',
        data: {
          boardSlug,
          messages,
          count: messages.length
        },
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.logger.error(`Failed to send board messages for ${boardSlug}:`, error);
    }
  }

  // Public methods
  async start(port: number = 8889): Promise<void> {
    try {
      // Wait for MessagePersistence to initialize
      await this.messagePersistence.initialize();
      
      // Start the server
      this.server.listen(port, () => {
        this.logger.info(`EnhancedRealtimeAPI server started on port ${port}`);
        this.isRunning = true;
      });
      
    } catch (error) {
      this.logger.error('Failed to start EnhancedRealtimeAPI:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping EnhancedRealtimeAPI server...');
      
      // Close all socket connections
      this.io.close();
      
      // Stop the HTTP server
      this.server.close();
      
      this.isRunning = false;
      this.logger.info('EnhancedRealtimeAPI server stopped');
      
    } catch (error) {
      this.logger.error('Error stopping EnhancedRealtimeAPI:', error);
    }
  }

  // Utility methods
  getConnectionCount(): number {
    return this.io.engine.clientsCount;
  }

  broadcastToBoard(boardSlug: string, event: string, data: any): void {
    this.io.to(`board:${boardSlug}`).emit(event, data);
  }

  broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }
}
