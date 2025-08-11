/**
 * REAL P2P Network - Actual message distribution across nodes
 * No simulation - messages flow through real node network
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

export interface P2PConfig {
  enableTcp: boolean;
  enableWebSockets: boolean;
  enableWebRTC: boolean;
  enableRelay: boolean;
  enableDHT: boolean;
  enablePubsub: boolean;
  enableMDNS: boolean;
  enableBootstrap: boolean;
  bootstrapPeers: string[];
  listenPorts: number[];
  announceAddresses: string[];
  maxConnections: number;
  connectionTimeout: number;
  heartbeatInterval: number;
}

export interface P2PMessage {
  id: string;
  type: 'post' | 'engagement' | 'stake' | 'decay' | 'reward' | 'sync' | 'ping';
  sender: string;
  recipient?: string; // undefined for broadcast
  content: any;
  timestamp: number;
  signature?: string;
  nonce: number;
}

export interface P2PConnection {
  peerId: string;
  multiaddr: string;
  protocols: string[];
  isConnected: boolean;
  lastSeen: number;
  latency: number;
  bandwidth: {
    in: number;
    out: number;
  };
}

export interface P2PStats {
  totalPeers: number;
  connectedPeers: number;
  totalMessages: number;
  totalDataTransferred: number;
  uptime: number;
  networkHealth: number;
}

export class RealP2PNetwork extends EventEmitter {
  private libp2p: Libp2p | null = null;
  private config: P2PConfig;
  private isInitialized: boolean = false;
  private connections: Map<string, P2PConnection> = new Map();
  private messageQueue: P2PMessage[] = [];
  private stats: P2PStats;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts: number = 5;

  constructor(config: Partial<P2PConfig> = {}) {
    super();
    
    this.config = {
      enableTcp: true,
      enableWebSockets: true,
      enableWebRTC: false, // Browser compatibility
      enableRelay: true,
      enableDHT: true,
      enablePubsub: true,
      enableMDNS: true,
      enableBootstrap: true,
      bootstrapPeers: [
        '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
        '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
      ],
      listenPorts: [0], // Random port
      announceAddresses: [],
      maxConnections: 100,
      connectionTimeout: 30000,
      heartbeatInterval: 30000,
      ...config
    };

    this.stats = {
      totalPeers: 0,
      connectedPeers: 0,
      totalMessages: 0,
      totalDataTransferred: 0,
      uptime: 0,
      networkHealth: 100
    };
  }

  /**
   * Initialize the P2P network
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('P2P network already initialized');
    }

    try {
      // Create libp2p instance
      this.libp2p = await createLibp2p({
        addresses: {
          listen: this.config.listenPorts.map(port => 
            port === 0 ? '/ip4/0.0.0.0/tcp/0' : `/ip4/0.0.0.0/tcp/${port}`
          )
        },
        transports: [
          ...(this.config.enableTcp ? [tcp()] : []),
          ...(this.config.enableWebSockets ? [websockets()] : []),
        ],
        connectionEncryption: [noise()],
        streamMuxers: [mplex()],
        peerDiscovery: [
          ...(this.config.enableMDNS ? [mdns()] : []),
          ...(this.config.enableBootstrap ? [bootstrap({ list: this.config.bootstrapPeers })] : []),
          ...(this.config.enablePubsub ? [pubsubPeerDiscovery({ topics: ['onusone-p2p'] })] : [])
        ],
        services: {
          identify: identify(),
          ping: ping(),
          ...(this.config.enableDHT ? { dht: kadDHT() } : {}),
          ...(this.config.enablePubsub ? { 
            pubsub: gossipsub({
              allowPublishToZeroPeers: true,
              emitSelf: false,
              canRelayMessage: true,
              directPeers: []
            })
          } : {})
        }
      });

      // Set up event listeners
      this.setupEventListeners();
      
      // Start the node
      await this.libp2p.start();
      
      // Connect to bootstrap peers
      if (this.config.enableBootstrap) {
        await this.connectToBootstrapPeers();
      }

      // Start heartbeat
      this.startHeartbeat();
      
      this.isInitialized = true;
      this.emit('initialized', this.libp2p.peerId.toString());
      
      console.log('P2P network initialized successfully');
    } catch (error) {
      console.error('Failed to initialize P2P network:', error);
      throw error;
    }
  }

  /**
   * Set up libp2p event listeners
   */
  private setupEventListeners(): void {
    if (!this.libp2p) return;

    // Peer discovery events
    this.libp2p.addEventListener('peer:discovery', (evt) => {
      const peerId = evt.detail.id;
      console.log(`Peer discovered: ${peerId}`);
      this.emit('peer:discovered', peerId);
    });

    // Connection events
    this.libp2p.addEventListener('peer:connect', (evt) => {
      const connection = evt.detail;
      const peerId = connection.remotePeer.toString();
      console.log(`Peer connected: ${peerId}`);
      
      this.addConnection(peerId, connection);
      this.emit('peer:connected', peerId);
    });

    this.libp2p.addEventListener('peer:disconnect', (evt) => {
      const connection = evt.detail;
      const peerId = connection.remotePeer.toString();
      console.log(`Peer disconnected: ${peerId}`);
      
      this.removeConnection(peerId);
      this.emit('peer:disconnected', peerId);
    });

    // Pubsub events
    if (this.config.enablePubsub) {
      this.libp2p.services.pubsub.addEventListener('message', (evt) => {
        this.handlePubsubMessage(evt.detail);
      });
    }

    // DHT events
    if (this.config.enableDHT) {
      this.libp2p.services.dht.addEventListener('peer:discovery', (evt) => {
        const peerId = evt.detail.id;
        console.log(`DHT peer discovered: ${peerId}`);
      });
    }
  }

  /**
   * Connect to bootstrap peers
   */
  private async connectToBootstrapPeers(): Promise<void> {
    if (!this.libp2p) return;

    for (const peer of this.config.bootstrapPeers) {
      try {
        const multiaddr = new Multiaddr(peer);
        const peerId = multiaddr.getPeerId();
        
        if (peerId) {
          await this.libp2p.dial(multiaddr);
          console.log(`Connected to bootstrap peer: ${peerId}`);
        }
      } catch (error) {
        console.warn(`Failed to connect to bootstrap peer ${peer}:`, error);
      }
    }
  }

  /**
   * Add a new connection
   */
  private addConnection(peerId: string, connection: any): void {
    const p2pConnection: P2PConnection = {
      peerId,
      multiaddr: connection.remoteAddr?.toString() || '',
      protocols: connection.protocols || [],
      isConnected: true,
      lastSeen: Date.now(),
      latency: 0,
      bandwidth: { in: 0, out: 0 }
    };

    this.connections.set(peerId, p2pConnection);
    this.updateStats();
  }

  /**
   * Remove a connection
   */
  private removeConnection(peerId: string): void {
    this.connections.delete(peerId);
    this.updateStats();
  }

  /**
   * Handle incoming pubsub messages
   */
  private handlePubsubMessage(message: any): void {
    try {
      const data = JSON.parse(new TextDecoder().decode(message.data));
      
      if (this.validateMessage(data)) {
        const p2pMessage: P2PMessage = {
          id: data.id,
          type: data.type,
          sender: data.sender,
          recipient: data.recipient,
          content: data.content,
          timestamp: data.timestamp,
          signature: data.signature,
          nonce: data.nonce
        };

        this.emit('message:received', p2pMessage);
        this.stats.totalMessages++;
        this.updateStats();
      }
    } catch (error) {
      console.error('Failed to handle pubsub message:', error);
    }
  }

  /**
   * Validate incoming message
   */
  private validateMessage(data: any): boolean {
    return (
      data.id &&
      data.type &&
      data.sender &&
      data.content &&
      data.timestamp &&
      typeof data.nonce === 'number'
    );
  }

  /**
   * Send a message to the P2P network
   */
  async sendMessage(message: Omit<P2PMessage, 'id' | 'timestamp' | 'nonce'>): Promise<string> {
    if (!this.libp2p || !this.config.enablePubsub) {
      throw new Error('P2P network not initialized or pubsub disabled');
    }

    const p2pMessage: P2PMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
      nonce: Math.floor(Math.random() * 1000000)
    };

    try {
      const topic = 'onusone-p2p';
      const data = new TextEncoder().encode(JSON.stringify(p2pMessage));
      
      await this.libp2p.services.pubsub.publish(topic, data);
      
      this.emit('message:sent', p2pMessage);
      this.stats.totalMessages++;
      this.updateStats();
      
      return p2pMessage.id;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send direct message to specific peer
   */
  async sendDirectMessage(peerId: string, message: any): Promise<void> {
    if (!this.libp2p) {
      throw new Error('P2P network not initialized');
    }

    try {
      const peer = new PeerId(peerId);
      const stream = await this.libp2p.dialProtocol(peer, '/onusone-p2p/1.0.0');
      
      const data = new TextEncoder().encode(JSON.stringify(message));
      await stream.write(data);
      await stream.close();
      
      console.log(`Direct message sent to ${peerId}`);
    } catch (error) {
      console.error(`Failed to send direct message to ${peerId}:`, error);
      throw error;
    }
  }

  /**
   * Broadcast message to all connected peers
   */
  async broadcastMessage(message: any): Promise<void> {
    if (!this.libp2p || !this.config.enablePubsub) {
      throw new Error('P2P network not initialized or pubsub disabled');
    }

    try {
      const topic = 'onusone-p2p';
      const data = new TextEncoder().encode(JSON.stringify(message));
      
      await this.libp2p.services.pubsub.publish(topic, data);
      console.log('Message broadcasted to network');
    } catch (error) {
      console.error('Failed to broadcast message:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
    if (!this.libp2p || !this.config.enablePubsub) {
      throw new Error('P2P network not initialized or pubsub disabled');
    }

    try {
      await this.libp2p.services.pubsub.subscribe(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Failed to subscribe to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    if (!this.libp2p || !this.config.enablePubsub) {
      throw new Error('P2P network not initialized or pubsub disabled');
    }

    try {
      await this.libp2p.services.pubsub.unsubscribe(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Failed to unsubscribe from topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Get peer information
   */
  async getPeerInfo(peerId: string): Promise<any> {
    if (!this.libp2p) {
      throw new Error('P2P network not initialized');
    }

    try {
      const peer = new PeerId(peerId);
      const protocols = await this.libp2p.getProtocols(peer);
      
      return {
        peerId,
        protocols,
        isConnected: this.connections.has(peerId),
        connection: this.connections.get(peerId)
      };
    } catch (error) {
      console.error(`Failed to get peer info for ${peerId}:`, error);
      throw error;
    }
  }

  /**
   * Ping a peer to measure latency
   */
  async pingPeer(peerId: string): Promise<number> {
    if (!this.libp2p) {
      throw new Error('P2P network not initialized');
    }

    try {
      const peer = new PeerId(peerId);
      const latency = await this.libp2p.services.ping.ping(peer);
      
      // Update connection latency
      const connection = this.connections.get(peerId);
      if (connection) {
        connection.latency = latency;
        connection.lastSeen = Date.now();
      }
      
      return latency;
    } catch (error) {
      console.error(`Failed to ping peer ${peerId}:`, error);
      throw error;
    }
  }

  /**
   * Find peers providing a specific service
   */
  async findPeers(service: string): Promise<string[]> {
    if (!this.libp2p || !this.config.enableDHT) {
      throw new Error('P2P network not initialized or DHT disabled');
    }

    try {
      const peers = await this.libp2p.services.dht.findPeer(service);
      return peers.map(peer => peer.id.toString());
    } catch (error) {
      console.error(`Failed to find peers for service ${service}:`, error);
      return [];
    }
  }

  /**
   * Get network statistics
   */
  getStats(): P2PStats {
    return { ...this.stats };
  }

  /**
   * Get all connections
   */
  getConnections(): P2PConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connected peer count
   */
  getConnectedPeerCount(): number {
    return this.connections.size;
  }

  /**
   * Check if peer is connected
   */
  isPeerConnected(peerId: string): boolean {
    return this.connections.has(peerId);
  }

  /**
   * Disconnect from a peer
   */
  async disconnectPeer(peerId: string): Promise<void> {
    if (!this.libp2p) return;

    try {
      const peer = new PeerId(peerId);
      await this.libp2p.hangUp(peer);
      this.removeConnection(peerId);
      console.log(`Disconnected from peer: ${peerId}`);
    } catch (error) {
      console.error(`Failed to disconnect from peer ${peerId}:`, error);
    }
  }

  /**
   * Start heartbeat to maintain connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * Perform heartbeat operations
   */
  private async performHeartbeat(): Promise<void> {
    if (!this.libp2p) return;

    // Ping connected peers
    for (const [peerId, connection] of this.connections) {
      if (connection.isConnected) {
        try {
          await this.pingPeer(peerId);
        } catch (error) {
          console.warn(`Heartbeat failed for peer ${peerId}:`, error);
          this.handlePeerFailure(peerId);
        }
      }
    }

    // Update uptime
    this.stats.uptime += this.config.heartbeatInterval;
    this.updateStats();
  }

  /**
   * Handle peer connection failure
   */
  private handlePeerFailure(peerId: string): void {
    const attempts = this.reconnectAttempts.get(peerId) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(peerId, attempts + 1);
      
      // Attempt reconnection
      setTimeout(() => {
        this.attemptReconnection(peerId);
      }, Math.pow(2, attempts) * 1000); // Exponential backoff
    } else {
      // Remove failed peer
      this.removeConnection(peerId);
      this.reconnectAttempts.delete(peerId);
      console.log(`Removed failed peer: ${peerId}`);
    }
  }

  /**
   * Attempt to reconnect to a peer
   */
  private async attemptReconnection(peerId: string): Promise<void> {
    if (!this.libp2p) return;

    try {
      const peer = new PeerId(peerId);
      await this.libp2p.dial(peer);
      this.reconnectAttempts.delete(peerId);
      console.log(`Reconnected to peer: ${peerId}`);
    } catch (error) {
      console.warn(`Reconnection attempt failed for peer ${peerId}:`, error);
    }
  }

  /**
   * Update network statistics
   */
  private updateStats(): void {
    this.stats.connectedPeers = this.connections.size;
    this.stats.totalPeers = this.stats.connectedPeers;
    
    // Calculate network health based on connection quality
    let totalLatency = 0;
    let healthyConnections = 0;
    
    for (const connection of this.connections.values()) {
      if (connection.latency > 0) {
        totalLatency += connection.latency;
        healthyConnections++;
      }
    }
    
    if (healthyConnections > 0) {
      const avgLatency = totalLatency / healthyConnections;
      this.stats.networkHealth = Math.max(0, 100 - (avgLatency / 10));
    }
    
    this.emit('stats:updated', this.stats);
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Stop the P2P network
   */
  async stop(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Stop heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Stop libp2p
      if (this.libp2p) {
        await this.libp2p.stop();
        this.libp2p = null;
      }

      // Clear connections
      this.connections.clear();
      this.reconnectAttempts.clear();
      
      this.isInitialized = false;
      this.emit('stopped');
      
      console.log('P2P network stopped');
    } catch (error) {
      console.error('Failed to stop P2P network:', error);
      throw error;
    }
  }

  /**
   * Get network status
   */
  getStatus(): 'initializing' | 'running' | 'stopped' | 'error' {
    if (!this.isInitialized) return 'stopped';
    if (!this.libp2p) return 'error';
    return 'running';
  }

  /**
   * Get local peer ID
   */
  getLocalPeerId(): string | null {
    return this.libp2p?.peerId.toString() || null;
  }

  /**
   * Get listen addresses
   */
  getListenAddresses(): string[] {
    if (!this.libp2p) return [];
    return this.libp2p.getMultiaddrs().map(addr => addr.toString());
  }
}
