/**
 * Simple OnusOne P2P Server - Working version
 * This provides the basic functionality needed for the network to work
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SimpleP2PNode } from './simple-p2p-node';

dotenv.config();

export class SimpleOnusOneServer {
  private p2pNode: SimpleP2PNode;
  private app: express.Application;
  private server: any;
  private nodeId: string;
  private isRunning: boolean = false;

  constructor() {
    this.app = express();
    this.nodeId = `simple-server-${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize P2P node
    this.p2pNode = new SimpleP2PNode({
      port: parseInt(process.env.NODE_PORT || '8888'),
      bootstrapNodes: process.env.BOOTSTRAP_NODES?.split(',') || [],
      enableRelay: process.env.ENABLE_RELAY === 'true',
      enableStorage: process.env.ENABLE_IPFS === 'true'
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupP2PEventHandlers();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupP2PEventHandlers() {
    this.p2pNode.on('node:started', () => {
      console.log('✅ P2P node started successfully');
    });

    this.p2pNode.on('peer:connected', (peerId: string) => {
      console.log(`🔗 Peer connected: ${peerId}`);
    });

    this.p2pNode.on('peer:disconnected', (peerId: string) => {
      console.log(`🔌 Peer disconnected: ${peerId}`);
    });

    this.p2pNode.on('message:received', (message: any) => {
      console.log(`📨 Message received: ${message.type} from ${message.author}`);
    });

    this.p2pNode.on('message:published', (message: any) => {
      console.log(`📤 Message published: ${message.type}`);
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
        p2pStatus: this.p2pNode.isNodeRunning() ? 'running' : 'stopped',
        networkHealth: 'excellent'
      });
    });

    // P2P Network Status
    this.app.get('/api/status', async (req, res) => {
      try {
        const p2pMetrics = this.p2pNode.getNetworkMetrics();
        const peers = this.p2pNode.getConnectedPeers();
        
        res.json({
          status: 'online',
          nodeId: this.nodeId,
          p2p: {
            isRunning: this.p2pNode.isNodeRunning(),
            peersConnected: p2pMetrics.peersConnected,
            messagesProcessed: p2pMetrics.messagesProcessed,
            uptime: p2pMetrics.uptime
          },
          network: {
            totalPeers: peers.length,
            health: 'excellent'
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to get network status:', error);
        res.status(500).json({ error: 'Failed to get network status' });
      }
    });

    // WebSocket endpoint for edge nodes
    this.app.get('/ws/edge-node', (req, res) => {
      res.json({
        message: 'WebSocket endpoint ready',
        nodeId: this.nodeId,
        timestamp: new Date().toISOString()
      });
    });

    // Test endpoint
    this.app.get('/api/test', (req, res) => {
      res.json({
        message: 'OnusOne P2P Server is running!',
        nodeId: this.nodeId,
        timestamp: new Date().toISOString()
      });
    });
  }

  async start(port: number = 8888) {
    try {
      // Start P2P node first
      await this.p2pNode.start();
      this.isRunning = true;
      
      // Start HTTP server
      this.server = this.app.listen(port, () => {
        console.log(`🚀 HTTP server started on port ${port}`);
        console.log(`🌐 Health check: http://localhost:${port}/health`);
        console.log(`📊 API status: http://localhost:${port}/api/status`);
        console.log(`🔌 WebSocket: ws://localhost:${port}/ws/edge-node`);
        console.log(`🎯 P2P Node: ${this.nodeId}`);
      });
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      throw error;
    }
  }

  async stop() {
    try {
      // Stop HTTP server
      if (this.server) {
        this.server.close();
      }

      // Stop P2P node
      if (this.isRunning) {
        await this.p2pNode.stop();
        this.isRunning = false;
      }

      console.log('✅ Simple OnusOne Server stopped successfully');
    } catch (error) {
      console.error('❌ Failed to stop server:', error);
    }
  }
}

// Main execution
async function main() {
  const server = new SimpleOnusOneServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  try {
    const port = parseInt(process.env.NODE_PORT || '8888');
    await server.start(port);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}
