/**
 * OnusOne P2P Node - Main Entry Point
 * Handles distributed messaging, storage, and network participation
 */

import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@libp2p/noise';
import { mplex } from '@libp2p/mplex';
import { gossipsub } from '@libp2p/gossipsub';
import { kadDHT } from '@chainsafe/libp2p-kad-dht';
import { bootstrap } from '@libp2p/bootstrap';
import { mdns } from '@libp2p/mdns';
import { identify } from '@libp2p/identify';
import { ping } from '@libp2p/ping';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { pipe } from 'it-pipe';
import * as lp from 'it-length-prefixed';
import express from 'express';
import cors from 'cors';
import { CronJob } from 'cron';
import dotenv from 'dotenv';

import { 
  NetworkMessage, 
  NetworkMessageType, 
  Message, 
  BoardType
} from './shared/types';

import {
  calculateDecayScore,
  isMessageVisible,
  generateWeeklySummaryData
} from './shared/decay';

import {
  P2P_CONFIG,
  createNetworkMessage,
  verifyNetworkMessage,
  ipfsManager,
  networkHealthMonitor,
  utils
} from './shared/utils';

import { MessageStore } from './storage/messageStore';
import { Logger } from './utils/logger';
import { NetworkMetrics } from './utils/metrics';

dotenv.config();

/**
 * OnusOne P2P Node
 */
export class OnusOneNode {
  private libp2p: any;
  private messageStore: MessageStore;
  private logger: Logger;
  private metrics: NetworkMetrics;
  private httpServer: any;
  private isRunning: boolean = false;
  private decayUpdateJob?: CronJob;
  private weeklyBountyJob?: CronJob;

  constructor() {
    this.logger = new Logger('OnusOneNode');
    this.metrics = new NetworkMetrics();
    this.messageStore = new MessageStore();
  }

  /**
   * Initialize and start the P2P node
   */
  async start(): Promise<void> {
    try {
      this.logger.info('Starting OnusOne P2P Node...');

      // Initialize libp2p
      await this.initializeLibp2p();

      // Start libp2p
      await this.libp2p.start();
      this.logger.info(`Node started with PeerId: ${this.libp2p.peerId.toString()}`);

      // Setup message handlers
      this.setupMessageHandlers();

      // Start HTTP API server
      await this.startHttpServer();

      // Setup background jobs
      this.setupBackgroundJobs();

      // Join the network
      await this.joinNetwork();

      this.isRunning = true;
      this.logger.info('OnusOne P2P Node is running');

    } catch (error) {
      this.logger.error('Failed to start node:', error);
      throw error;
    }
  }

  /**
   * Stop the P2P node
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping OnusOne P2P Node...');
    
    this.isRunning = false;

    // Stop background jobs
    if (this.decayUpdateJob) {
      this.decayUpdateJob.stop();
    }
    if (this.weeklyBountyJob) {
      this.weeklyBountyJob.stop();
    }

    // Stop HTTP server
    if (this.httpServer) {
      this.httpServer.close();
    }

    // Stop libp2p
    if (this.libp2p) {
      await this.libp2p.stop();
    }

    this.logger.info('Node stopped');
  }

  /**
   * Initialize libp2p with OnusOne configuration
   */
  private async initializeLibp2p(): Promise<void> {
    const port = parseInt(process.env.P2P_PORT || P2P_CONFIG.DEFAULT_PORT.toString());
    
    this.libp2p = await createLibp2p({
      addresses: {
        listen: [
          `/ip4/0.0.0.0/tcp/${port}`,
          `/ip4/0.0.0.0/tcp/${port + 1}/ws`
        ]
      },
      transports: [
        tcp(),
        // websockets() // Enable for browser connectivity
      ],
      streamMuxers: [mplex()],
      connectionEncryption: [noise()],
      pubsub: gossipsub({
        allowPublishToZeroPeers: true,
        msgIdFn: (msg) => {
          // Custom message ID for deduplication
          return uint8ArrayFromString(msg.data.slice(0, 32).toString());
        },
        scoreParams: {
          // Scoring parameters for spam prevention
        }
      }),
      peerDiscovery: [
        bootstrap({
          list: P2P_CONFIG.BOOTSTRAP_NODES
        }),
        mdns({
          interval: 20000
        })
      ],
      dht: kadDHT({
        kBucketSize: 20,
        clientMode: false
      }),
      services: {
        identify: identify(),
        ping: ping()
      },
      connectionManager: {
        maxConnections: 100,
        minConnections: 10
      }
    });
  }

  /**
   * Setup message handlers for different network protocols
   */
  private setupMessageHandlers(): void {
    // Handle direct messages between peers
    this.libp2p.handle('/onusone/message/1.0.0', ({ stream }: any) => {
      pipe(
        stream,
        lp.decode(),
        async (source: any) => {
          for await (const data of source) {
            try {
              const message = JSON.parse(uint8ArrayToString(data.subarray()));
              await this.handleDirectMessage(message);
            } catch (error) {
              this.logger.error('Failed to parse direct message:', error);
            }
          }
        }
      );
    });

    // Handle pubsub messages for board topics
    Object.values(BoardType).forEach(board => {
      const topic = `onusone/${board}`;
      this.libp2p.services.pubsub.subscribe(topic);
    });

    // Listen for pubsub messages
    this.libp2p.services.pubsub.addEventListener('message', (evt: any) => {
      this.handlePubsubMessage(evt.detail);
    });

    // Handle peer connections
    this.libp2p.addEventListener('peer:connect', (evt: any) => {
      const peerId = evt.detail.toString();
      this.logger.info(`Connected to peer: ${peerId}`);
      networkHealthMonitor.updatePeerCount(this.libp2p.getPeers().length);
    });

    this.libp2p.addEventListener('peer:disconnect', (evt: any) => {
      const peerId = evt.detail.toString();
      this.logger.info(`Disconnected from peer: ${peerId}`);
      networkHealthMonitor.updatePeerCount(this.libp2p.getPeers().length);
    });
  }

  /**
   * Handle direct peer-to-peer messages
   */
  private async handleDirectMessage(networkMessage: NetworkMessage): Promise<void> {
    try {
      if (!verifyNetworkMessage(networkMessage)) {
        this.logger.warn('Invalid message signature');
        return;
      }

      switch (networkMessage.type) {
        case NetworkMessageType.CONTENT_REQUEST:
          await this.handleContentRequest(networkMessage);
          break;
        
        case NetworkMessageType.CONTENT_PROVIDE:
          await this.handleContentProvide(networkMessage);
          break;
        
        case NetworkMessageType.NODE_HEARTBEAT:
          await this.handleNodeHeartbeat(networkMessage);
          break;
        
        default:
          this.logger.debug(`Unhandled direct message type: ${networkMessage.type}`);
      }
    } catch (error) {
      this.logger.error('Error handling direct message:', error);
    }
  }

  /**
   * Handle pubsub messages for board discussions
   */
  private async handlePubsubMessage(message: any): Promise<void> {
    try {
      const data = JSON.parse(uint8ArrayToString(message.data));
      const networkMessage: NetworkMessage = data;

      if (!verifyNetworkMessage(networkMessage)) {
        this.logger.warn('Invalid pubsub message signature');
        return;
      }

      switch (networkMessage.type) {
        case NetworkMessageType.MESSAGE_CREATE:
          await this.handleNewMessage(networkMessage);
          break;
        
        case NetworkMessageType.MESSAGE_REACTION:
          await this.handleMessageReaction(networkMessage);
          break;
        
        case NetworkMessageType.BOUNTY_SUBMISSION:
          await this.handleBountySubmission(networkMessage);
          break;
        
        default:
          this.logger.debug(`Unhandled pubsub message type: ${networkMessage.type}`);
      }
    } catch (error) {
      this.logger.error('Error handling pubsub message:', error);
    }
  }

  /**
   * Handle new message creation
   */
  private async handleNewMessage(networkMessage: NetworkMessage): Promise<void> {
    const payload = networkMessage.payload;
    
    // Store message metadata
    await this.messageStore.storeMessage({
      id: payload.messageId,
      authorId: networkMessage.senderId,
      boardType: payload.boardType,
      ipfsHash: payload.ipfsHash,
      decayScore: payload.decayScore,
      timestamp: networkMessage.timestamp
    });

    this.logger.debug(`Stored new message: ${payload.messageId}`);
    this.metrics.incrementMessageCount();
  }

  /**
   * Handle message reactions (boosts decay score)
   */
  private async handleMessageReaction(networkMessage: NetworkMessage): Promise<void> {
    const payload = networkMessage.payload;
    
    // Update message decay score
    await this.messageStore.updateDecayScore(
      payload.messageId,
      payload.scoreBoost || 2
    );

    this.logger.debug(`Updated decay score for message: ${payload.messageId}`);
  }

  /**
   * Handle content requests from other nodes
   */
  private async handleContentRequest(networkMessage: NetworkMessage): Promise<void> {
    const payload = networkMessage.payload;
    const messages = await this.messageStore.getMessagesByBoard(
      payload.boardType,
      payload.lastSyncTime ? new Date(payload.lastSyncTime) : undefined
    );

    // Send response back to requesting peer
    const response = createNetworkMessage(
      NetworkMessageType.CONTENT_PROVIDE,
      {
        requestId: payload.requestId,
        messages: messages
      },
      this.libp2p.peerId.toString()
    );

    await this.sendDirectMessage(networkMessage.senderId, response);
  }

  /**
   * Handle content provided by other nodes
   */
  private async handleContentProvide(networkMessage: NetworkMessage): Promise<void> {
    const payload = networkMessage.payload;
    
    // Store received messages
    for (const messageData of payload.messages) {
      await this.messageStore.storeMessage(messageData);
    }

    this.logger.debug(`Received ${payload.messages.length} messages from sync`);
  }

  /**
   * Handle node heartbeat for network health
   */
  private async handleNodeHeartbeat(networkMessage: NetworkMessage): Promise<void> {
    // Update peer health metrics
    this.metrics.updatePeerHealth(networkMessage.senderId, networkMessage.payload);
  }

  /**
   * Send direct message to specific peer
   */
  private async sendDirectMessage(peerId: string, message: NetworkMessage): Promise<void> {
    try {
      const stream = await this.libp2p.dialProtocol(peerId, '/onusone/message/1.0.0');
      await pipe(
        [uint8ArrayFromString(JSON.stringify(message))],
        lp.encode(),
        stream
      );
    } catch (error) {
      this.logger.error(`Failed to send direct message to ${peerId}:`, error);
    }
  }

  /**
   * Broadcast message to board topic
   */
  private async broadcastToBoard(board: BoardType, message: NetworkMessage): Promise<void> {
    const topic = `onusone/${board}`;
    const data = uint8ArrayFromString(JSON.stringify(message));
    
    await this.libp2p.services.pubsub.publish(topic, data);
    this.logger.debug(`Broadcasted message to ${topic}`);
  }

  /**
   * Setup background jobs for maintenance
   */
  private setupBackgroundJobs(): void {
    // Decay score update job (every minute)
    this.decayUpdateJob = new CronJob('0 * * * * *', async () => {
      await this.updateDecayScores();
    });
    this.decayUpdateJob.start();

    // Weekly bounty job (every Sunday at midnight)
    this.weeklyBountyJob = new CronJob('0 0 0 * * 0', async () => {
      await this.processWeeklyBounties();
    });
    this.weeklyBountyJob.start();

    this.logger.info('Background jobs started');
  }

  /**
   * Update decay scores for all messages
   */
  private async updateDecayScores(): Promise<void> {
    try {
      const updatedCount = await this.messageStore.batchUpdateDecayScores();
      if (updatedCount > 0) {
        this.logger.debug(`Updated decay scores for ${updatedCount} messages`);
      }
    } catch (error) {
      this.logger.error('Failed to update decay scores:', error);
    }
  }

  /**
   * Process weekly bounties and generate summaries
   */
  private async processWeeklyBounties(): Promise<void> {
    try {
      this.logger.info('Processing weekly bounties...');
      
      for (const board of Object.values(BoardType)) {
        const messages = await this.messageStore.getWeeklyMessages(board);
        const summaryData = generateWeeklySummaryData(messages);
        
        // Store summary for bounty system
        await this.messageStore.storeWeeklySummary(board, summaryData);
        
        this.logger.info(`Generated weekly summary for ${board}: ${summaryData.topMessages.length} top messages`);
      }
    } catch (error) {
      this.logger.error('Failed to process weekly bounties:', error);
    }
  }

  /**
   * Start HTTP API server for frontend communication
   */
  private async startHttpServer(): Promise<void> {
    const app = express();
    const port = parseInt(process.env.HTTP_PORT || '8888');

    app.use(cors());
    app.use(express.json({ limit: '10mb' }));

    // Health check
    app.get('/health', (req, res) => {
      const health = networkHealthMonitor.getHealth();
      res.json({
        status: 'ok',
        nodeId: this.libp2p.peerId.toString(),
        network: health,
        metrics: this.metrics.getStats()
      });
    });

    // Get messages for a board
    app.get('/api/boards/:board/messages', async (req, res) => {
      try {
        const board = req.params.board as BoardType;
        const messages = await this.messageStore.getMessagesByBoard(board);
        res.json(messages);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get messages' });
      }
    });

    // Create new message
    app.post('/api/messages', async (req, res) => {
      try {
        const { content, boardType, authorId } = req.body;
        
        // Store content on IPFS
        const ipfsHash = await ipfsManager.storeContent(content);
        
        // Create message
        const message: Message = {
          id: utils.generateId(),
          content,
          contentHash: ipfsHash,
          authorId,
          boardType,
          decayScore: 100,
          initialScore: 100,
          lastEngagement: new Date(),
          isVisible: true,
          replyCount: 0,
          reactionCount: 0,
          shareCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ipfsHash,
          authorSignature: '',
          networkVersion: 1
        };

        // Store locally
        await this.messageStore.storeMessage(message);

        // Broadcast to network
        const networkMessage = createNetworkMessage(
          NetworkMessageType.MESSAGE_CREATE,
          {
            messageId: message.id,
            ipfsHash,
            boardType,
            decayScore: 100
          },
          authorId
        );

        await this.broadcastToBoard(boardType, networkMessage);

        res.json({ success: true, messageId: message.id });
      } catch (error) {
        this.logger.error('Failed to create message:', error);
        res.status(500).json({ error: 'Failed to create message' });
      }
    });

    this.httpServer = app.listen(port, () => {
      this.logger.info(`HTTP API server running on port ${port}`);
    });
  }

  /**
   * Join the OnusOne network
   */
  private async joinNetwork(): Promise<void> {
    // Announce presence to the network
    const announcement = createNetworkMessage(
      NetworkMessageType.NODE_ANNOUNCE,
      {
        services: ['storage', 'compute'],
        version: '0.1.0',
        capabilities: {
          maxStorage: 100, // GB
          maxCompute: 4    // cores
        }
      },
      this.libp2p.peerId.toString()
    );

    // Broadcast to all boards
    for (const board of Object.values(BoardType)) {
      await this.broadcastToBoard(board, announcement);
    }

    this.logger.info('Announced presence to OnusOne network');
  }

  /**
   * Handle bounty submissions
   */
  private async handleBountySubmission(networkMessage: NetworkMessage): Promise<void> {
    // Implementation for handling weekly summary bounty submissions
    this.logger.debug('Received bounty submission');
  }
}

// Main execution
async function main() {
  const node = new OnusOneNode();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await node.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await node.stop();
    process.exit(0);
  });

  // Start the node
  try {
    await node.start();
  } catch (error) {
    console.error('Failed to start OnusOne node:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export { OnusOneNode };