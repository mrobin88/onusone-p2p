/**
 * OnusOne P2P Node - Main Entry Point
 * Handles HTTP API server and P2P network management
 */

import express from 'express';
import cors from 'cors';
import { CronJob } from 'cron';
import dotenv from 'dotenv';
import { OnusOneP2PNode, P2PMessage } from './real-network-node';
import { MessageStore } from './storage/messageStore';
import { Logger } from './utils/logger';
import { NetworkMetrics } from './utils/metrics';

dotenv.config();

/**
 * OnusOne P2P Node Server
 */
export class OnusOneNodeServer {
  private p2pNode: OnusOneP2PNode;
  private messageStore: MessageStore;
  private logger: Logger;
  private metrics: NetworkMetrics;
  private app: express.Application;
  private server: any;
  private healthCheckJob!: CronJob;
  private nodeId: string;
  private isRunning: boolean = false;

  constructor() {
    this.messageStore = new MessageStore();
    this.logger = new Logger('OnusOneNodeServer');
    this.metrics = new NetworkMetrics();
    this.app = express();
    this.nodeId = `server-${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize P2P node
    this.p2pNode = new OnusOneP2PNode({
      port: parseInt(process.env.NODE_PORT || '8888'),
      bootstrapNodes: process.env.BOOTSTRAP_NODES?.split(',') || [],
      enableRelay: process.env.ENABLE_RELAY === 'true',
      enableStorage: process.env.ENABLE_IPFS === 'true'
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupP2PEventHandlers();
    this.setupHealthCheck();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupP2PEventHandlers() {
    this.p2pNode.on('node:started', () => {
      this.logger.info('P2P node started successfully');
    });

    this.p2pNode.on('peer:connected', (peerId: string) => {
      this.logger.info(`Peer connected: ${peerId}`);
    });

    this.p2pNode.on('peer:disconnected', (peerId: string) => {
      this.logger.info(`Peer disconnected: ${peerId}`);
    });

    this.p2pNode.on('message:received', (message: P2PMessage) => {
      this.logger.info(`Message received: ${message.type} from ${message.author}`);
      this.messageStore.addMessage(message);
    });

    this.p2pNode.on('message:published', (message: P2PMessage) => {
      this.logger.info(`Message published: ${message.type}`);
    });

    this.p2pNode.on('health:updated', (metrics: any) => {
      this.metrics.updateFromP2P(metrics);
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        nodeId: this.nodeId,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        p2pStatus: this.p2pNode ? 'running' : 'stopped',
        networkHealth: this.metrics.getNetworkHealth()
      });
    });

    // P2P Network Status
    this.app.get('/api/status', async (req, res) => {
      try {
        const p2pMetrics = await this.p2pNode.getMetrics();
        const peers = await this.p2pNode.getPeers();
        
        res.json({
          nodeId: this.nodeId,
          p2pStatus: this.isRunning ? 'running' : 'stopped',
          connectedPeers: p2pMetrics.connectedPeers,
          totalPeers: p2pMetrics.totalPeers,
          networkHealth: p2pMetrics.networkHealth,
          uptime: p2pMetrics.uptime,
          messagesProcessed: p2pMetrics.messagesProcessed,
          storageUsed: p2pMetrics.storageUsed,
          isBootstrap: process.env.NODE_ENV === 'bootstrap'
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get status' });
      }
    });

    // Get connected peers
    this.app.get('/api/peers', async (req, res) => {
      try {
        const peers = await this.p2pNode.getPeers();
        res.json(peers);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get peers' });
      }
    });

    // Get network topology
    this.app.get('/api/topology', async (req, res) => {
      try {
        const topology = await this.p2pNode.getNetworkTopology();
        res.json(topology);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get topology' });
      }
    });

    // Broadcast message to network
    this.app.post('/api/broadcast', async (req, res) => {
      try {
        const { type, content, boardType, stakeAmount, engagementScore } = req.body;
        
        if (!type || !content) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const message: P2PMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: type as any,
          content,
          author: req.headers['x-user-id'] as string || 'anonymous',
          timestamp: Date.now(),
          boardType,
          stakeAmount,
          engagementScore
        };

        // Publish to P2P network
        await this.p2pNode.publishMessage(message);
        
        // Store locally
        this.messageStore.addMessage(message);
        
        res.json({
          success: true,
          messageId: message.id,
          timestamp: message.timestamp
        });
      } catch (error) {
        this.logger.error('Broadcast failed:', error);
        res.status(500).json({ error: 'Failed to broadcast message' });
      }
    });

    // Get messages
    this.app.get('/api/messages', async (req, res) => {
      try {
        const { board, limit = 50, offset = 0 } = req.query;
        
        let messages = await this.p2pNode.getMessages();
        
        // Filter by board if specified
        if (board) {
          messages = messages.filter(msg => msg.boardType === board);
        }
        
        // Sort by timestamp (newest first)
        messages.sort((a, b) => b.timestamp - a.timestamp);
        
        // Apply pagination
        const paginatedMessages = messages.slice(offset as number, (offset as number) + (limit as number));
        
        res.json({
          messages: paginatedMessages,
          total: messages.length,
          limit: limit as number,
          offset: offset as number
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get messages' });
      }
    });

    // Find specific content
    this.app.get('/api/content/:contentId', async (req, res) => {
      try {
        const { contentId } = req.params;
        const content = await this.p2pNode.findContent(contentId);
        
        if (content) {
          res.json(content);
        } else {
          res.status(404).json({ error: 'Content not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to find content' });
      }
    });

    // Node management
    this.app.post('/api/node/start', async (req, res) => {
      try {
        if (this.isRunning) {
          return res.json({ message: 'Node already running' });
        }
        
        await this.p2pNode.start();
        this.isRunning = true;
        
        res.json({ message: 'Node started successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to start node' });
      }
    });

    this.app.post('/api/node/stop', async (req, res) => {
      try {
        if (!this.isRunning) {
          return res.json({ message: 'Node already stopped' });
        }
        
        await this.p2pNode.stop();
        this.isRunning = false;
        
        res.json({ message: 'Node stopped successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to stop node' });
      }
    });

    this.app.post('/api/node/relay', async (req, res) => {
      try {
        await this.p2pNode.enableRelay();
        res.json({ message: 'Relay mode enabled' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to enable relay' });
      }
    });

    // Storage operations
    this.app.post('/api/storage/store', async (req, res) => {
      try {
        const { content } = req.body;
        
        if (!content) {
          return res.status(400).json({ error: 'Missing content' });
        }

        const contentId = await this.p2pNode.storeContent(content);
        
        res.json({
          success: true,
          contentId,
          timestamp: Date.now()
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to store content' });
      }
    });

    // Metrics and analytics
    this.app.get('/api/metrics', async (req, res) => {
      try {
        const p2pMetrics = await this.p2pNode.getMetrics();
        const localMetrics = this.metrics.getMetrics();
        
        res.json({
          p2p: p2pMetrics,
          local: localMetrics,
          combined: {
            totalPeers: p2pMetrics.totalPeers,
            connectedPeers: p2pMetrics.connectedPeers,
            networkHealth: p2pMetrics.networkHealth,
            messagesProcessed: p2pMetrics.messagesProcessed + localMetrics.messagesProcessed,
            storageUsed: p2pMetrics.storageUsed + localMetrics.storageUsed,
            uptime: Math.max(p2pMetrics.uptime, localMetrics.uptime)
          }
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get metrics' });
      }
    });

    // WebSocket endpoint for real-time updates
    this.app.get('/api/ws', (req, res) => {
      // Upgrade to WebSocket connection
      // This would be implemented with ws or socket.io
      res.json({ message: 'WebSocket endpoint - use ws:// protocol' });
    });
  }

  private setupHealthCheck() {
    this.healthCheckJob = new CronJob('*/30 * * * * *', async () => {
      try {
        if (this.isRunning) {
          const metrics = await this.p2pNode.getMetrics();
          this.logger.info('Health check passed', {
            peers: metrics.connectedPeers,
            health: metrics.networkHealth,
            uptime: metrics.uptime
          });
        }
      } catch (error) {
        this.logger.error('Health check failed:', error);
      }
    });
  }

  async start(port: number = 8888) {
    try {
      // Start P2P node first
      await this.p2pNode.start();
      this.isRunning = true;
      
      // Start HTTP server
      this.server = this.app.listen(port, () => {
        this.logger.info(`HTTP server started on port ${port}`);
      });

      // Start health checks
      this.healthCheckJob.start();
      
      this.logger.info(`OnusOne Node Server started successfully`);
      this.logger.info(`HTTP API: http://localhost:${port}`);
      this.logger.info(`P2P Node: ${this.nodeId}`);
      
    } catch (error) {
      this.logger.error('Failed to start server:', error);
      throw error;
    }
  }

  async stop() {
    try {
      // Stop health checks
      if (this.healthCheckJob) {
        this.healthCheckJob.stop();
      }

      // Stop HTTP server
      if (this.server) {
        this.server.close();
      }

      // Stop P2P node
      if (this.isRunning) {
        await this.p2pNode.stop();
        this.isRunning = false;
      }

      this.logger.info('OnusOne Node Server stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop server:', error);
      throw error;
    }
  }

  // Utility methods
  private getConnectedPeersCount(): number {
    return this.metrics.getConnectedPeers();
  }

  private getConnectedPeers(): any[] {
    return this.metrics.getPeers();
  }

  private getStorageUsed(): number {
    return this.metrics.getStorageUsed();
  }
}

// Main execution
async function main() {
  const nodeServer = new OnusOneNodeServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await nodeServer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await nodeServer.stop();
    process.exit(0);
  });

  try {
    const port = parseInt(process.env.NODE_PORT || '8888');
    await nodeServer.start(port);
  } catch (error) {
    console.error('Failed to start node server:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}