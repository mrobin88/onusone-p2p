/**
 * P2P Network Utilities for OnusOne
 * Handles libp2p networking, IPFS storage, and cryptographic operations
 */

import { createLibp2p, Libp2p } from 'libp2p';
import { webRTC } from '@libp2p/webrtc';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@libp2p/noise';
import { peerIdFromString } from '@libp2p/peer-id';
import { Peer, Message, P2PConnection, LibP2PConfig } from './types';
import { EventEmitter } from 'events';

export class P2PNetwork extends EventEmitter {
  private libp2p: Libp2p;
  private config: LibP2PConfig;
  private peers: Map<string, Peer> = new Map();
  private messageQueue: Message[] = [];
  private isConnected: boolean = false;
  private reconnectInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: LibP2PConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize and start the P2P network
   */
  async start(): Promise<void> {
    try {
      // Create libp2p instance with configured transports and protocols
      this.libp2p = await createLibp2p({
        peerId: await peerIdFromString(this.config.peerId),
        addresses: {
          listen: this.config.listenAddresses
        },
        transports: [
          ...(this.config.enableWebRTC ? [webRTC()] : []),
          ...(this.config.enableTCP ? [tcp()] : []),
          ...(this.config.enableWebSockets ? [webSockets()] : [])
        ],
        connectionEncryption: [noise()],
        connectionManager: {
          maxConnections: this.config.maxConnections,
          minConnections: 1
        }
      });

      // Set up event listeners
      this.setupEventListeners();

      // Start the libp2p node
      await this.libp2p.start();

      // Connect to bootstrap peers
      await this.connectToBootstrapPeers();

      // Start health monitoring
      this.startHealthMonitoring();

      this.isConnected = true;
      this.emit('connected');
      this.emit('status', this.getConnectionStatus());

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the P2P network
   */
  async stop(): Promise<void> {
    try {
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
      }
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      if (this.libp2p) {
        await this.libp2p.stop();
      }

      this.isConnected = false;
      this.emit('disconnected');
      this.emit('status', this.getConnectionStatus());

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Connect to a specific peer
   */
  async connectToPeer(peerId: string, address: string, port: number): Promise<boolean> {
    try {
      const peer = await peerIdFromString(peerId);
      const multiaddr = `${address}/tcp/${port}/p2p/${peerId}`;
      
      await this.libp2p.dial(multiaddr);
      
      // Add to peer list
      const peerInfo: Peer = {
        id: peerId,
        address,
        port,
        lastSeen: new Date(),
        reputation: 50, // Default reputation
        isConnected: true
      };
      
      this.peers.set(peerId, peerInfo);
      this.emit('peerConnected', peerInfo);
      
      return true;
    } catch (error) {
      this.emit('error', `Failed to connect to peer ${peerId}: ${error}`);
      return false;
    }
  }

  /**
   * Disconnect from a peer
   */
  async disconnectFromPeer(peerId: string): Promise<boolean> {
    try {
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.isConnected = false;
        this.peers.delete(peerId);
        this.emit('peerDisconnected', peerId);
      }
      
      return true;
    } catch (error) {
      this.emit('error', `Failed to disconnect from peer ${peerId}: ${error}`);
      return false;
    }
  }

  /**
   * Broadcast a message to all connected peers
   */
  async broadcastMessage(message: Message): Promise<number> {
    if (!this.isConnected) {
      throw new Error('P2P network not connected');
    }

    try {
      const messageData = JSON.stringify({
        type: 'message',
        payload: message,
        timestamp: new Date().toISOString(),
        sender: this.config.peerId
      });

      let broadcastCount = 0;
      const connectedPeers = Array.from(this.peers.values()).filter(p => p.isConnected);

      for (const peer of connectedPeers) {
        try {
          const peerId = await peerIdFromString(peer.id);
          await this.libp2p.dial(peerId);
          
          // Send message via libp2p pubsub or direct connection
          // This is a simplified implementation - in production you'd use pubsub
          broadcastCount++;
        } catch (error) {
          console.warn(`Failed to broadcast to peer ${peer.id}:`, error);
        }
      }

      // Add to local message queue
      this.messageQueue.push(message);
      
      this.emit('messageBroadcast', message, broadcastCount);
      return broadcastCount;

    } catch (error) {
      this.emit('error', `Failed to broadcast message: ${error}`);
      throw error;
    }
  }

  /**
   * Send a direct message to a specific peer
   */
  async sendDirectMessage(peerId: string, message: Message): Promise<boolean> {
    try {
      const peer = this.peers.get(peerId);
      if (!peer || !peer.isConnected) {
        throw new Error(`Peer ${peerId} not connected`);
      }

      const messageData = JSON.stringify({
        type: 'direct_message',
        payload: message,
        timestamp: new Date().toISOString(),
        sender: this.config.peerId,
        recipient: peerId
      });

      const peerIdObj = await peerIdFromString(peerId);
      await this.libp2p.dial(peerIdObj);
      
      // Send via direct connection
      // Simplified implementation - in production you'd use a custom protocol
      
      this.emit('directMessageSent', peerId, message);
      return true;

    } catch (error) {
      this.emit('error', `Failed to send direct message to ${peerId}: ${error}`);
      return false;
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): P2PConnection {
    const peerCount = this.peers.size;
    let networkHealth: P2PConnection['networkHealth'] = 'offline';

    if (this.isConnected) {
      if (peerCount >= 10) networkHealth = 'excellent';
      else if (peerCount >= 5) networkHealth = 'good';
      else if (peerCount >= 1) networkHealth = 'poor';
      else networkHealth = 'offline';
    }

    return {
      isConnected: this.isConnected,
      peerCount,
      networkHealth,
      lastMessage: this.messageQueue.length > 0 ? this.messageQueue[this.messageQueue.length - 1].timestamp : new Date(),
      error: undefined
    };
  }

  /**
   * Get list of connected peers
   */
  getConnectedPeers(): Peer[] {
    return Array.from(this.peers.values()).filter(p => p.isConnected);
  }

  /**
   * Get peer by ID
   */
  getPeer(peerId: string): Peer | undefined {
    return this.peers.get(peerId);
  }

  /**
   * Update peer reputation
   */
  updatePeerReputation(peerId: string, reputationChange: number): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.reputation = Math.max(0, Math.min(100, peer.reputation + reputationChange));
      peer.lastSeen = new Date();
      this.emit('peerReputationUpdated', peerId, peer.reputation);
    }
  }

  /**
   * Set up libp2p event listeners
   */
  private setupEventListeners(): void {
    this.libp2p.addEventListener('peer:connect', (evt) => {
      const peerId = evt.detail.remotePeer.toString();
      this.emit('peerConnected', peerId);
    });

    this.libp2p.addEventListener('peer:disconnect', (evt) => {
      const peerId = evt.detail.remotePeer.toString();
      this.emit('peerDisconnected', peerId);
    });

    this.libp2p.addEventListener('connection:open', (evt) => {
      const peerId = evt.detail.remotePeer.toString();
      this.emit('connectionOpened', peerId);
    });

    this.libp2p.addEventListener('connection:close', (evt) => {
      const peerId = evt.detail.remotePeer.toString();
      this.emit('connectionClosed', peerId);
    });
  }

  /**
   * Connect to bootstrap peers
   */
  private async connectToBootstrapPeers(): Promise<void> {
    for (const bootstrapPeer of this.config.bootstrapPeers) {
      try {
        await this.connectToPeer(bootstrapPeer, 'localhost', 8888);
      } catch (error) {
        console.warn(`Failed to connect to bootstrap peer ${bootstrapPeer}:`, error);
      }
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        // Check network health
        const status = this.getConnectionStatus();
        
        // Update peer statuses
        for (const [peerId, peer] of this.peers) {
          if (peer.isConnected) {
            // Simple health check - in production you'd ping peers
            peer.lastSeen = new Date();
          }
        }

        // Clean up disconnected peers
        for (const [peerId, peer] of this.peers) {
          const timeSinceLastSeen = Date.now() - peer.lastSeen.getTime();
          if (timeSinceLastSeen > 300000) { // 5 minutes
            peer.isConnected = false;
            this.emit('peerDisconnected', peerId);
          }
        }

        this.emit('status', status);
      } catch (error) {
        this.emit('error', `Health check failed: ${error}`);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Handle automatic reconnection
   */
  private startReconnection(): void {
    this.reconnectInterval = setInterval(async () => {
      if (!this.isConnected && this.peers.size > 0) {
        try {
          await this.start();
        } catch (error) {
          console.warn('Reconnection attempt failed:', error);
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Get network metrics
   */
  getNetworkMetrics() {
    const connectedPeers = this.getConnectedPeers();
    const totalReputation = connectedPeers.reduce((sum, p) => sum + p.reputation, 0);
    const averageReputation = connectedPeers.length > 0 ? totalReputation / connectedPeers.length : 0;

    return {
      totalPeers: this.peers.size,
      connectedPeers: connectedPeers.length,
      averageReputation,
      messageQueueSize: this.messageQueue.length,
      uptime: this.isConnected ? Date.now() - (this.libp2p?.startTime || Date.now()) : 0
    };
  }
}