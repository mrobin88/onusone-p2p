/**
 * Real-Time Messaging API
 * WebSocket endpoints for real-time communication
 * Integrates with OrbitMessaging system
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { OrbitMessaging, Message, Board } from './orbit-messaging';
import { Logger } from '../utils/logger';

export interface RealtimeMessage {
  type: 'message' | 'reply' | 'reaction' | 'status' | 'peer';
  data: any;
  timestamp: number;
}

export class RealtimeAPI {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private orbitMessaging: OrbitMessaging;
  private logger: Logger;
  public isRunning: boolean = false;

  constructor(orbitMessaging: OrbitMessaging) {
    this.orbitMessaging = orbitMessaging;
    this.logger = new Logger('RealtimeAPI');
    
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
        boardSlug: string;
        parentId?: string;
      }) => {
        try {
          const message = await this.orbitMessaging.createMessage(
            data.content,
            data.author,
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
      
      // Handle typing indicator
      socket.on('typing-start', (data: { boardSlug: string; author: string }) => {
        socket.to(`board:${data.boardSlug}`).emit('typing:start', {
          author: data.author,
          timestamp: Date.now()
        });
      });
      
      socket.on('typing-stop', (data: { boardSlug: string; author: string }) => {
        socket.to(`board:${data.boardSlug}`).emit('typing:stop', {
          author: data.author,
          timestamp: Date.now()
        });
      });
      
      // Handle reactions
      socket.on('add-reaction', async (data: {
        messageId: string;
        reaction: string;
        author: string;
      }) => {
        try {
          // In a full implementation, this would update the message
          const reaction = {
            messageId: data.messageId,
            reaction: data.reaction,
            author: data.author,
            timestamp: Date.now()
          };
          
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
      
      // Handle peer discovery
      socket.on('peer-info', (data: { peerId: string; address: string }) => {
        this.orbitMessaging.addPeer(data.peerId, data.address);
        
        // Broadcast peer info to all clients
        this.io.emit('peer:new', {
          type: 'peer',
          data: { peerId: data.peerId, address: data.address },
          timestamp: Date.now()
        });
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
        service: 'RealtimeAPI',
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
        
        const messages = await this.orbitMessaging.getMessages(slug, limit, offset);
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
        const { content, author, parentId } = req.body;
        
        if (!content || !author) {
          return res.status(400).json({ error: 'Content and author are required' });
        }
        
        const message = await this.orbitMessaging.createMessage(
          content,
          author,
          slug,
          parentId
        );
        
        res.json(message);
        
      } catch (error) {
        this.logger.error('Failed to create message:', error);
        res.status(500).json({ error: 'Failed to create message' });
      }
    });
    
    // Get boards
    this.app.get('/api/boards', async (req, res) => {
      try {
        const boards = await this.orbitMessaging.getBoards();
        res.json(boards);
        
      } catch (error) {
        this.logger.error('Failed to get boards:', error);
        res.status(500).json({ error: 'Failed to get boards' });
      }
    });
    
    // Get system status
    this.app.get('/api/status', async (req, res) => {
      try {
        const orbitStatus = this.orbitMessaging.getStatus();
        const socketStatus = {
          connections: this.io.engine.clientsCount,
          rooms: Object.keys(this.io.sockets.adapter.rooms).length
        };
        
        res.json({
          orbit: orbitStatus,
          sockets: socketStatus,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        this.logger.error('Failed to get status:', error);
        res.status(500).json({ error: 'Failed to get status' });
      }
    });
  }

  private async sendBoardMessages(socket: any, boardSlug: string): Promise<void> {
    try {
      const messages = await this.orbitMessaging.getMessages(boardSlug, 50, 0);
      
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
      // Wait for OrbitMessaging to initialize
      await this.orbitMessaging.initialize();
      
      // Start the server
      this.server.listen(port, () => {
        this.logger.info(`RealtimeAPI server started on port ${port}`);
        this.isRunning = true;
      });
      
      // Set up OrbitMessaging event handlers
      this.setupOrbitEventHandlers();
      
    } catch (error) {
      this.logger.error('Failed to start RealtimeAPI:', error);
      throw error;
    }
  }

  private setupOrbitEventHandlers(): void {
    // Handle new messages from OrbitMessaging
    this.orbitMessaging.on('message:created', (message: Message) => {
      this.io.to(`board:${message.boardSlug}`).emit('message:new', {
        type: 'message',
        data: message,
        timestamp: Date.now()
      });
    });
    
    // Handle message replication
    this.orbitMessaging.on('message:replicated', (data: any) => {
      this.io.emit('message:replicated', {
        type: 'replication',
        data,
        timestamp: Date.now()
      });
    });
    
    // Handle status changes
    this.orbitMessaging.on('status:offline', () => {
      this.io.emit('status:offline', {
        type: 'status',
        data: { status: 'offline' },
        timestamp: Date.now()
      });
    });
    
    this.orbitMessaging.on('status:online', () => {
      this.io.emit('status:online', {
        type: 'status',
        data: { status: 'online' },
        timestamp: Date.now()
      });
    });
  }

  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping RealtimeAPI server...');
      
      // Close all socket connections
      this.io.close();
      
      // Stop the HTTP server
      this.server.close();
      
      this.isRunning = false;
      this.logger.info('RealtimeAPI server stopped');
      
    } catch (error) {
      this.logger.error('Error stopping RealtimeAPI:', error);
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
