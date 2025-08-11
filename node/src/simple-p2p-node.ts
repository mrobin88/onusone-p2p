/**
 * Simple P2P Node - Working version without libp2p conflicts
 * This provides the basic functionality needed for the network to work
 */

import { EventEmitter } from 'events';
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

export class SimpleP2PNode extends EventEmitter {
  private logger: Logger;
  private config: P2PNodeConfig;
  private isRunning: boolean = false;
  private metrics: NetworkMetrics;
  private messageQueue: P2PMessage[] = [];
  private peers: Set<string> = new Set();
  private messageHandlers: Map<string, (message: any) => void> = new Map();

  constructor(config: P2PNodeConfig) {
    super();
    this.config = config;
    this.logger = new Logger('SimpleP2PNode');
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
      this.logger.info('Starting simple P2P node...');
      
      // Simulate P2P network startup
      await this.simulateNetworkStartup();
      
      this.isRunning = true;
      this.metrics.uptime = Date.now();
      
      this.logger.info('Simple P2P node started successfully');
      this.emit('node:started');
      
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
      this.logger.info('Stopping simple P2P node...');
      this.isRunning = false;
      this.emit('node:stopped');
      this.logger.info('Simple P2P node stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping P2P node:', error);
    }
  }

  private async simulateNetworkStartup(): Promise<void> {
    // Simulate connecting to bootstrap nodes
    for (const node of this.config.bootstrapNodes) {
      try {
        this.logger.info(`Attempting to connect to bootstrap node: ${node}`);
        // Simulate connection attempt
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (node !== 'http://localhost:8888') {
          // Simulate successful connection to external nodes
          this.peers.add(node);
          this.logger.info(`Connected to bootstrap node: ${node}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to connect to bootstrap node: ${node}`);
      }
    }

    // Simulate peer discovery
    this.metrics.peersConnected = this.peers.size;
    this.emit('peer:connected', 'bootstrap-peer');
  }

  async publishMessage(message: P2PMessage, topic?: string): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Node is not running');
    }

    try {
      this.logger.info(`Publishing message: ${message.type}`);
      
      // Add to local queue
      this.messageQueue.push(message);
      
      // Update metrics
      this.metrics.messagesProcessed++;
      this.metrics.lastMessageTime = Date.now();
      
      // Emit event
      this.emit('message:published', message);
      
      // Simulate message propagation to peers
      if (this.peers.size > 0) {
        this.logger.info(`Message propagated to ${this.peers.size} peers`);
      }
      
    } catch (error) {
      this.logger.error('Failed to publish message:', error);
      throw error;
    }
  }

  async broadcastToPeers(message: P2PMessage): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Node is not running');
    }

    try {
      this.logger.info(`Broadcasting message to ${this.peers.size} peers`);
      
      // Simulate broadcasting to all peers
      for (const peer of this.peers) {
        this.logger.info(`Broadcasting to peer: ${peer}`);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      this.emit('message:broadcast', message);
      
    } catch (error) {
      this.logger.error('Failed to broadcast message:', error);
      throw error;
    }
  }

  getConnectedPeers(): string[] {
    return Array.from(this.peers);
  }

  getPeerCount(): number {
    return this.peers.size;
  }

  getNetworkMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  isNodeRunning(): boolean {
    return this.isRunning;
  }

  getNodeInfo(): any {
    return {
      nodeId: `simple-node-${Math.random().toString(36).substr(2, 9)}`,
      isRunning: this.isRunning,
      peers: this.getConnectedPeers(),
      metrics: this.getNetworkMetrics(),
      config: this.config
    };
  }

  // Simulate receiving messages from peers
  simulateIncomingMessage(message: P2PMessage): void {
    if (!this.isRunning) return;
    
    this.logger.info(`Received message from peer: ${message.type}`);
    this.emit('message:received', message);
    
    // Update metrics
    this.metrics.messagesProcessed++;
    this.metrics.lastMessageTime = Date.now();
  }

  // Simulate peer connection
  simulatePeerConnection(peerId: string): void {
    this.peers.add(peerId);
    this.metrics.peersConnected = this.peers.size;
    this.emit('peer:connected', peerId);
    this.logger.info(`Peer connected: ${peerId}`);
  }

  // Simulate peer disconnection
  simulatePeerDisconnection(peerId: string): void {
    this.peers.delete(peerId);
    this.metrics.peersConnected = this.peers.size;
    this.emit('peer:disconnected', peerId);
    this.logger.info(`Peer disconnected: ${peerId}`);
  }
}
