/**
 * REAL NETWORK NODE - The actual P2P infrastructure
 * This is what people run to host the network and earn ONU tokens
 */

import { createLibp2p, Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { websockets } from '@libp2p/websockets';
import { noise } from '@libp2p/noise';
import { mplex } from '@libp2p/mplex';
import { kadDHT } from '@libp2p/kad-dht';
import { gossipsub } from '@libp2p/gossipsub';
import { identify } from '@libp2p/identify';
import { ping } from '@libp2p/ping';
import { bootstrap } from '@libp2p/bootstrap';
import { mdns } from '@libp2p/mdns';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { EventEmitter } from 'events';
import { PeerId } from '@libp2p/interface-peer-id';
import { Multiaddr } from '@multiformats/multiaddr';
import { MessageId } from '@libp2p/interface-pubsub';
import { Logger } from './utils/logger';

export interface P2PMessage {
  id: string;
  type: 'post' | 'engagement' | 'stake' | 'decay' | 'reward';
  author: string;
  content: any;
  timestamp: number;
  signature?: string;
  stakeAmount?: number;
  engagementScore?: number;
  decayScore?: number;
}

export interface P2PNodeConfig {
  port: number;
  bootstrapNodes: string[];
  enableRelay: boolean;
  enableStorage: boolean;
  networkId?: string;
}

export interface NetworkMetrics {
  peersConnected: number;
  messagesProcessed: number;
  storageUsed: number;
  uptime: number;
  lastMessageTime: number;
}

export class OnusOneP2PNode extends EventEmitter {
  private libp2p: Libp2p;
  private logger: Logger;
  private config: P2PNodeConfig;
  private isRunning: boolean = false;
  private metrics: NetworkMetrics;
  private messageQueue: P2PMessage[] = [];
  private peerConnections: Map<string, any> = new Map();

  constructor(config: P2PNodeConfig) {
    super();
    this.config = config;
    this.logger = new Logger('OnusOneP2PNode');
    this.metrics = {
      peersConnected: 0,
      messagesProcessed: 0,
      storageUsed: 0,
      uptime: 0,
      lastMessageTime: 0
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Node is already running');
      return;
    }

    try {
      // Create libp2p instance with full P2P stack
      this.libp2p = await createLibp2p({
        addresses: {
          listen: [
            `/ip4/0.0.0.0/tcp/${this.config.port}`,
            `/ip4/0.0.0.0/tcp/${this.config.port}/ws`
          ]
        },
        transports: [
          tcp(),
          websockets()
        ],
        connectionEncryption: [noise()],
        streamMuxers: [mplex()],
        peerDiscovery: [
          bootstrap({
            list: this.config.bootstrapNodes.map(addr => new Multiaddr(addr))
          }),
          mdns(),
          pubsubPeerDiscovery({
            topics: [`onusone-${this.config.networkId || 'mainnet'}`]
          })
        ],
        services: {
          identify: identify(),
          ping: ping(),
          kadDHT: kadDHT({
            clientMode: false,
            lan: false
          }),
          pubsub: gossipsub({
            allowPublishToZeroPeers: true,
            emitSelf: false,
            canRelayMessage: true,
            directPeers: []
          })
        }
      });

      // Set up event handlers
      this.setupEventHandlers();
      
      // Start the node
      await this.libp2p.start();
      
      this.isRunning = true;
      this.logger.info(`P2P node started on port ${this.config.port}`);
      this.emit('node:started');
      
      // Start metrics collection
      this.startMetricsCollection();
      
    } catch (error) {
      this.logger.error('Failed to start P2P node:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.libp2p.stop();
      this.isRunning = false;
      this.logger.info('P2P node stopped');
      this.emit('node:stopped');
    } catch (error) {
      this.logger.error('Error stopping P2P node:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    // Peer discovery events
    this.libp2p.addEventListener('peer:discovery', (evt) => {
      const peerId = evt.detail.id;
      this.logger.info(`Peer discovered: ${peerId.toString()}`);
      this.emit('peer:discovered', peerId.toString());
    });

    // Connection events
    this.libp2p.addEventListener('peer:connect', (evt) => {
      const peerId = evt.detail.remotePeer.toString();
      this.logger.info(`Peer connected: ${peerId}`);
      this.peerConnections.set(peerId, evt.detail.connection);
      this.metrics.peersConnected = this.peerConnections.size;
      this.emit('peer:connected', peerId);
    });

    this.libp2p.addEventListener('peer:disconnect', (evt) => {
      const peerId = evt.detail.remotePeer.toString();
      this.logger.info(`Peer disconnected: ${peerId}`);
      this.peerConnections.delete(peerId);
      this.metrics.peersConnected = this.peerConnections.size;
      this.emit('peer:disconnected', peerId);
    });

    // PubSub events
    this.libp2p.services.pubsub.addEventListener('message', (evt) => {
      this.handleIncomingMessage(evt.detail);
    });

    // Subscribe to network topics
    const topics = [
      `onusone-${this.config.networkId || 'mainnet'}`,
      'onusone-posts',
      'onusone-engagement',
      'onusone-stakes',
      'onusone-decay',
      'onusone-rewards'
    ];

    topics.forEach(topic => {
      this.libp2p.services.pubsub.subscribe(topic);
      this.logger.info(`Subscribed to topic: ${topic}`);
    });
  }

  private async handleIncomingMessage(messageEvent: any): Promise<void> {
    try {
      const { from, topic, data } = messageEvent;
      const message = JSON.parse(new TextDecoder().decode(data));
      
      // Validate message structure
      if (!this.isValidMessage(message)) {
        this.logger.warn('Received invalid message format');
        return;
      }

      // Add to message queue for processing
      this.messageQueue.push(message);
      this.metrics.messagesProcessed++;
      this.metrics.lastMessageTime = Date.now();

      this.logger.info(`Message received on topic ${topic}: ${message.type} from ${message.author}`);
      this.emit('message:received', message);

      // Process message based on type
      await this.processMessage(message);

    } catch (error) {
      this.logger.error('Error handling incoming message:', error);
    }
  }

  private isValidMessage(message: any): message is P2PMessage {
    return (
      message &&
      typeof message.id === 'string' &&
      typeof message.type === 'string' &&
      typeof message.author === 'string' &&
      typeof message.content === 'object' &&
      typeof message.timestamp === 'number'
    );
  }

  private async processMessage(message: P2PMessage): Promise<void> {
    switch (message.type) {
      case 'post':
        await this.handlePostMessage(message);
        break;
      case 'engagement':
        await this.handleEngagementMessage(message);
        break;
      case 'stake':
        await this.handleStakeMessage(message);
        break;
      case 'decay':
        await this.handleDecayMessage(message);
        break;
      case 'reward':
        await this.handleRewardMessage(message);
        break;
      default:
        this.logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  private async handlePostMessage(message: P2PMessage): Promise<void> {
    // Store post in local storage
    // Broadcast to other peers
    // Update metrics
    this.emit('post:processed', message);
  }

  private async handleEngagementMessage(message: P2PMessage): Promise<void> {
    // Update engagement scores
    // Trigger decay calculations
    // Broadcast updates
    this.emit('engagement:processed', message);
  }

  private async handleStakeMessage(message: P2PMessage): Promise<void> {
    // Process stake creation
    // Update token balances
    // Broadcast stake event
    this.emit('stake:processed', message);
  }

  private async handleDecayMessage(message: P2PMessage): Promise<void> {
    // Process decay calculations
    // Update stake status
    // Trigger reward distribution
    this.emit('decay:processed', message);
  }

  private async handleRewardMessage(message: P2PMessage): Promise<void> {
    // Process reward distribution
    // Update node balances
    // Broadcast reward event
    this.emit('reward:processed', message);
  }

  async publishMessage(message: P2PMessage, topic?: string): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Node is not running');
    }

    try {
      const targetTopic = topic || `onusone-${this.config.networkId || 'mainnet'}`;
      const messageData = new TextEncoder().encode(JSON.stringify(message));
      
      await this.libp2p.services.pubsub.publish(targetTopic, messageData);
      
      this.logger.info(`Message published to topic ${targetTopic}: ${message.type}`);
      this.emit('message:published', message);
      
    } catch (error) {
      this.logger.error('Error publishing message:', error);
      throw error;
    }
  }

  async broadcastToPeers(message: P2PMessage): Promise<void> {
    const topics = [
      'onusone-posts',
      'onusone-engagement', 
      'onusone-stakes',
      'onusone-decay',
      'onusone-rewards'
    ];

    for (const topic of topics) {
      try {
        await this.publishMessage(message, topic);
      } catch (error) {
        this.logger.error(`Failed to broadcast to topic ${topic}:`, error);
      }
    }
  }

  getConnectedPeers(): string[] {
    return Array.from(this.peerConnections.keys());
  }

  getPeerCount(): number {
    return this.peerConnections.size;
  }

  getNetworkMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.metrics.uptime = Date.now() - (this.metrics.lastMessageTime || Date.now());
      this.emit('health:updated', this.metrics);
    }, 30000); // Update every 30 seconds
  }

  async connectToPeer(multiaddr: string): Promise<void> {
    try {
      const addr = new Multiaddr(multiaddr);
      await this.libp2p.dial(addr);
      this.logger.info(`Connected to peer: ${multiaddr}`);
    } catch (error) {
      this.logger.error(`Failed to connect to peer ${multiaddr}:`, error);
      throw error;
    }
  }

  async disconnectFromPeer(peerId: string): Promise<void> {
    try {
      const peer = await this.libp2p.peerStore.get(peerId as any);
      if (peer) {
        await this.libp2p.hangUp(peer.id);
        this.logger.info(`Disconnected from peer: ${peerId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to disconnect from peer ${peerId}:`, error);
      throw error;
    }
  }

  isNodeRunning(): boolean {
    return this.isRunning;
  }

  getNodeInfo(): any {
    return {
      peerId: this.libp2p.peerId?.toString(),
      addresses: this.libp2p.getMultiaddrs().map(addr => addr.toString()),
      protocols: this.libp2p.getProtocols(),
      isRunning: this.isRunning,
      config: this.config
    };
  }
}
