/**
 * OnusOne P2P Node - Simplified Version
 * Handles HTTP API server and basic functionality
 */

import express from 'express';
import cors from 'cors';
import { CronJob } from 'cron';
import dotenv from 'dotenv';

// Simple types for now
interface Message {
  id: string;
  content: string;
  author: string;
  boardType: string;
  timestamp: number;
  score: number;
  decayRate: number;
}

enum BoardType {
  GENERAL = 'GENERAL',
  TECH = 'TECH',
  POLITICS = 'POLITICS',
  SCIENCE = 'SCIENCE'
}

import { MessageStore } from './storage/messageStore';
import { Logger } from './utils/logger';
import { NetworkMetrics } from './utils/metrics';

dotenv.config();

/**
 * OnusOne P2P Node (Simplified)
 */
export class OnusOneNode {
  private messageStore: MessageStore;
  private logger: Logger;
  private metrics: NetworkMetrics;
  private app: express.Application;
  private server: any;
  private healthCheckJob!: CronJob;
  private nodeId: string;

  constructor() {
    this.messageStore = new MessageStore();
    this.logger = new Logger('OnusOneNode');
    this.metrics = new NetworkMetrics();
    this.app = express();
    this.nodeId = `node-${Math.random().toString(36).substr(2, 9)}`;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupHealthCheck();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        nodeId: this.nodeId,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Get messages
    this.app.get('/api/messages', async (req, res) => {
      try {
        const messages = await this.messageStore.getMessages();
        res.json({ messages });
      } catch (error) {
        this.logger.error('Failed to get messages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
      }
    });

    // Post message
    this.app.post('/api/messages', async (req, res) => {
      try {
        const { content, author, boardType = BoardType.GENERAL } = req.body;
        
        if (!content || !author) {
          return res.status(400).json({ error: 'Content and author are required' });
        }

        const message: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content,
          author,
          boardType,
          timestamp: Date.now(),
          score: 0,
          decayRate: 0.1
        };

        await this.messageStore.addMessage(message);
        this.logger.info(`Message posted: ${message.id}`);
        
        res.json({ message: 'Message posted successfully', messageId: message.id });
      } catch (error) {
        this.logger.error('Failed to post message:', error);
        res.status(500).json({ error: 'Failed to post message' });
      }
    });

    // Get node info
    this.app.get('/api/node', (req, res) => {
      res.json({
        nodeId: this.nodeId,
        status: 'running',
        version: '0.1.0',
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupHealthCheck() {
    this.healthCheckJob = new CronJob('*/30 * * * * *', () => {
      this.logger.info('Health check - Node is running');
      this.metrics.recordHealthCheck();
    });
  }

  async start(port: number = 8888) {
    try {
      this.server = this.app.listen(port, () => {
        this.logger.info(`OnusOne P2P Node started on port ${port}`);
        this.logger.info(`Node ID: ${this.nodeId}`);
        this.logger.info(`Health check: http://localhost:${port}/health`);
      });

      this.healthCheckJob.start();
      this.logger.info('Health check job started');

    } catch (error) {
      this.logger.error('Failed to start node:', error);
      throw error;
    }
  }

  async stop() {
    try {
      if (this.server) {
        this.server.close();
        this.logger.info('Node stopped');
      }
      
      if (this.healthCheckJob) {
        this.healthCheckJob.stop();
        this.logger.info('Health check job stopped');
      }
    } catch (error) {
      this.logger.error('Error stopping node:', error);
    }
  }
}

// Main function
async function main() {
  const node = new OnusOneNode();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await node.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await node.stop();
    process.exit(0);
  });

  await node.start();
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}