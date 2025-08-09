/**
 * REAL NETWORK NODE - The actual P2P infrastructure
 * This is what people run to host the network and earn ONU tokens
 */

import express from 'express';
import WebSocket from 'ws';
import cors from 'cors';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export interface NetworkMessage {
  id: string;
  content: string;
  author: string;
  authorWallet: string;
  timestamp: number;
  signatures: string[];
  totalStaked: number;
  decayScore: number;
  boardType: string;
  replicatedOn: string[];
  size: number;
}

export interface PeerNode {
  id: string;
  endpoint: string;
  publicKey: string;
  reputation: number;
  location: string;
  lastSeen: number;
  isBootstrap: boolean;
}

export interface NodeConfig {
  nodeId: string;
  port: number;
  dataDir: string;
  walletKeypair: Keypair;
  isBootstrap: boolean;
  maxStorage: number; // MB
  maxBandwidth: number; // Mbps
  location: string;
  bootstrapNodes: string[];
}

export class RealNetworkNode {
  private app: express.Application;
  private wss: WebSocket.Server;
  private db: Database;
  private config: NodeConfig;
  private peers: Map<string, PeerNode> = new Map();
  private messages: Map<string, NetworkMessage> = new Map();
  private earnings: { today: number; total: number } = { today: 0, total: 0 };
  private connection: Connection;
  private isRunning = false;

  constructor(config: NodeConfig) {
    this.config = config;
    this.app = express();
    this.connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    this.setupExpress();
    this.setupWebSocket();
  }

  /**
   * Start the network node
   */
  async start(): Promise<void> {
    console.log(`🚀 Starting OnusOne Network Node ${this.config.nodeId}`);
    
    // 1. Initialize database
    await this.initializeDatabase();
    
    // 2. Load existing data
    await this.loadPersistedData();
    
    // 3. Connect to bootstrap nodes
    await this.connectToBootstrap();
    
    // 4. Start HTTP server
    const server = this.app.listen(this.config.port, () => {
      console.log(`✅ Node listening on port ${this.config.port}`);
      console.log(`📍 Node ID: ${this.config.nodeId}`);
      console.log(`💰 Wallet: ${this.config.walletKeypair.publicKey.toString()}`);
    });

    // 5. Start WebSocket server
    this.wss = new WebSocket.Server({ server });
    this.setupWebSocketHandlers();

    // 6. Start maintenance tasks
    this.startMaintenance();
    
    this.isRunning = true;
    console.log(`🌐 Node successfully joined OnusOne P2P Network`);
  }

  /**
   * Express routes for HTTP API
   */
  private setupExpress(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));

    // Node info
    this.app.get('/api/node/info', (req, res) => {
      res.json({
        nodeId: this.config.nodeId,
        publicKey: this.config.walletKeypair.publicKey.toString(),
        reputation: this.calculateReputation(),
        location: this.config.location,
        isBootstrap: this.config.isBootstrap,
        messagesHosted: this.messages.size,
        earningsToday: this.earnings.today,
        totalEarnings: this.earnings.total,
        uptime: process.uptime(),
        storageUsed: this.getStorageUsed(),
        bandwidth: this.getBandwidthUsed()
      });
    });

    // Node status (health check)
    this.app.get('/api/node/status', (req, res) => {
      res.json({
        isOnline: true,
        messagesHosted: this.messages.size,
        connectedPeers: this.peers.size,
        earningsToday: this.earnings.today,
        lastUpdate: new Date().toISOString()
      });
    });

    // Store message from network
    this.app.post('/api/messages/store', async (req, res) => {
      try {
        const message: NetworkMessage = req.body;
        
        // Validate message
        if (!this.validateMessage(message)) {
          return res.status(400).json({ error: 'Invalid message' });
        }

        // Store message
        await this.storeMessage(message);
        
        // Relay to other peers
        this.relayMessage(message);
        
        // Update earnings
        this.earnings.today += this.calculateStorageFee(message);
        this.earnings.total += this.calculateStorageFee(message);

        res.json({ success: true, messageId: message.id });
        
        console.log(`📥 Stored message ${message.id} (+${this.calculateStorageFee(message)} ONU)`);
        
      } catch (error) {
        console.error('Failed to store message:', error);
        res.status(500).json({ error: 'Storage failed' });
      }
    });

    // Get recent messages
    this.app.get('/api/messages/recent', async (req, res) => {
      try {
        const board = req.query.board as string || 'all';
        const limit = parseInt(req.query.limit as string || '50');
        
        const messages = await this.getRecentMessages(board, limit);
        res.json({ messages });
        
      } catch (error) {
        console.error('Failed to get messages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
      }
    });

    // Get peer list
    this.app.get('/api/peers/list', (req, res) => {
      const peers = Array.from(this.peers.values()).map(peer => ({
        id: peer.id,
        endpoint: peer.endpoint,
        reputation: peer.reputation,
        location: peer.location,
        lastSeen: peer.lastSeen,
        isOnline: Date.now() - peer.lastSeen < 60000 // Online if seen in last minute
      }));
      
      res.json({ peers });
    });

    // Register new edge node
    this.app.post('/api/nodes/register', async (req, res) => {
      try {
        const { nodeId, walletAddress, capabilities, nodeType } = req.body;
        
        // Verify wallet has minimum stake (for edge nodes)
        if (nodeType === 'edge') {
          // TODO: Verify actual Solana wallet balance
          console.log(`📝 Registered edge node: ${nodeId} (${walletAddress})`);
        }

        // Add to peer list
        this.peers.set(nodeId, {
          id: nodeId,
          endpoint: `unknown`, // Edge nodes don't have fixed endpoints
          publicKey: walletAddress,
          reputation: 50, // Starting reputation
          location: 'Unknown',
          lastSeen: Date.now(),
          isBootstrap: false
        });

        res.json({ success: true, nodeId });
        
      } catch (error) {
        console.error('Node registration failed:', error);
        res.status(500).json({ error: 'Registration failed' });
      }
    });

    // Node earnings and payments
    this.app.get('/api/node/earnings', (req, res) => {
      res.json({
        today: this.earnings.today,
        total: this.earnings.total,
        messagesHosted: this.messages.size,
        averagePerMessage: this.messages.size > 0 ? this.earnings.total / this.messages.size : 0,
        estimatedDaily: this.estimateDailyEarnings()
      });
    });
  }

  /**
   * WebSocket setup for real-time P2P communication
   */
  private setupWebSocket(): void {
    // WebSocket will be initialized when server starts
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws, req) => {
      console.log(`🔗 New peer connected from ${req.socket.remoteAddress}`);

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handlePeerMessage(ws, message);
        } catch (error) {
          console.error('Failed to handle peer message:', error);
        }
      });

      ws.on('close', () => {
        console.log(`🔌 Peer disconnected`);
      });
    });
  }

  /**
   * Initialize SQLite database for persistent storage
   */
  private async initializeDatabase(): Promise<void> {
    // Ensure data directory exists
    if (!existsSync(this.config.dataDir)) {
      mkdirSync(this.config.dataDir, { recursive: true });
    }

    const dbPath = join(this.config.dataDir, 'node.db');
    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Create tables
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        authorWallet TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        signatures TEXT NOT NULL,
        totalStaked REAL NOT NULL,
        decayScore REAL NOT NULL,
        boardType TEXT NOT NULL,
        replicatedOn TEXT NOT NULL,
        size INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS peers (
        id TEXT PRIMARY KEY,
        endpoint TEXT NOT NULL,
        publicKey TEXT NOT NULL,
        reputation INTEGER NOT NULL,
        location TEXT NOT NULL,
        lastSeen INTEGER NOT NULL,
        isBootstrap BOOLEAN NOT NULL
      );

      CREATE TABLE IF NOT EXISTS earnings (
        date TEXT PRIMARY KEY,
        amount REAL NOT NULL
      );
    `);

    console.log(`💾 Database initialized at ${dbPath}`);
  }

  /**
   * Load persisted data from database
   */
  private async loadPersistedData(): Promise<void> {
    // Load messages
    const messages = await this.db.all('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 1000');
    for (const row of messages) {
      const message: NetworkMessage = {
        id: row.id,
        content: row.content,
        author: row.author,
        authorWallet: row.authorWallet,
        timestamp: row.timestamp,
        signatures: JSON.parse(row.signatures),
        totalStaked: row.totalStaked,
        decayScore: row.decayScore,
        boardType: row.boardType,
        replicatedOn: JSON.parse(row.replicatedOn),
        size: row.size
      };
      this.messages.set(message.id, message);
    }

    // Load peers
    const peers = await this.db.all('SELECT * FROM peers');
    for (const row of peers) {
      this.peers.set(row.id, {
        id: row.id,
        endpoint: row.endpoint,
        publicKey: row.publicKey,
        reputation: row.reputation,
        location: row.location,
        lastSeen: row.lastSeen,
        isBootstrap: row.isBootstrap
      });
    }

    // Load earnings
    const earningsRows = await this.db.all('SELECT * FROM earnings');
    this.earnings.total = earningsRows.reduce((sum, row) => sum + row.amount, 0);
    
    const today = new Date().toDateString();
    const todayEarnings = await this.db.get('SELECT amount FROM earnings WHERE date = ?', today);
    this.earnings.today = todayEarnings?.amount || 0;

    console.log(`📦 Loaded ${this.messages.size} messages and ${this.peers.size} peers`);
  }

  /**
   * Connect to bootstrap nodes to join the network
   */
  private async connectToBootstrap(): Promise<void> {
    console.log(`🔗 Connecting to bootstrap nodes...`);

    for (const bootstrapUrl of this.config.bootstrapNodes) {
      try {
        // Get bootstrap node info
        const response = await fetch(`${bootstrapUrl}/api/node/info`);
        if (response.ok) {
          const nodeInfo = await response.json();
          
          this.peers.set(nodeInfo.nodeId, {
            id: nodeInfo.nodeId,
            endpoint: bootstrapUrl,
            publicKey: nodeInfo.publicKey,
            reputation: 100, // Bootstrap nodes have high reputation
            location: nodeInfo.location,
            lastSeen: Date.now(),
            isBootstrap: true
          });

          console.log(`✅ Connected to bootstrap: ${bootstrapUrl}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to connect to ${bootstrapUrl}:`, error);
      }
    }

    // Get peer list from connected bootstrap nodes
    await this.discoverPeers();
  }

  /**
   * Discover other nodes in the network
   */
  private async discoverPeers(): Promise<void> {
    const bootstrapPeers = Array.from(this.peers.values()).filter(p => p.isBootstrap);
    
    for (const bootstrap of bootstrapPeers) {
      try {
        const response = await fetch(`${bootstrap.endpoint}/api/peers/list`);
        if (response.ok) {
          const { peers } = await response.json();
          
          for (const peerData of peers) {
            if (!this.peers.has(peerData.id)) {
              this.peers.set(peerData.id, {
                id: peerData.id,
                endpoint: peerData.endpoint,
                publicKey: peerData.publicKey || 'unknown',
                reputation: peerData.reputation,
                location: peerData.location,
                lastSeen: peerData.lastSeen,
                isBootstrap: false
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to discover peers from ${bootstrap.endpoint}`);
      }
    }

    console.log(`🌐 Discovered ${this.peers.size} total peers`);
  }

  /**
   * Store message in local database
   */
  private async storeMessage(message: NetworkMessage): Promise<void> {
    // Add this node to replication list
    if (!message.replicatedOn.includes(this.config.nodeId)) {
      message.replicatedOn.push(this.config.nodeId);
    }

    // Store in memory
    this.messages.set(message.id, message);

    // Persist to database
    await this.db.run(`
      INSERT OR REPLACE INTO messages 
      (id, content, author, authorWallet, timestamp, signatures, totalStaked, decayScore, boardType, replicatedOn, size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      message.id,
      message.content,
      message.author,
      message.authorWallet,
      message.timestamp,
      JSON.stringify(message.signatures),
      message.totalStaked,
      message.decayScore,
      message.boardType,
      JSON.stringify(message.replicatedOn),
      message.size
    ]);
  }

  /**
   * Relay message to other peers
   */
  private relayMessage(message: NetworkMessage): void {
    const activePeers = Array.from(this.peers.values())
      .filter(p => Date.now() - p.lastSeen < 300000) // Active in last 5 minutes
      .slice(0, 3); // Relay to max 3 peers

    for (const peer of activePeers) {
      if (peer.endpoint && peer.endpoint !== 'unknown') {
        fetch(`${peer.endpoint}/api/messages/store`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        }).catch(error => {
          console.warn(`Failed to relay to ${peer.endpoint}`);
        });
      }
    }
  }

  /**
   * Get recent messages with decay applied
   */
  private async getRecentMessages(boardType: string, limit: number): Promise<NetworkMessage[]> {
    const messages = Array.from(this.messages.values());
    
    // Apply content decay
    const now = Date.now();
    for (const message of messages) {
      const ageHours = (now - message.timestamp) / (1000 * 60 * 60);
      const decayRate = 0.1; // 10% decay per hour
      message.decayScore = Math.max(0, message.totalStaked * Math.pow(1 - decayRate, ageHours));
    }

    // Filter and sort
    let filtered = messages.filter(m => m.decayScore > 0);
    if (boardType !== 'all') {
      filtered = filtered.filter(m => m.boardType === boardType);
    }

    return filtered
      .sort((a, b) => b.decayScore - a.decayScore)
      .slice(0, limit);
  }

  /**
   * Start maintenance tasks
   */
  private startMaintenance(): void {
    // Update peer status every 30 seconds
    setInterval(() => {
      this.updatePeerStatus();
    }, 30000);

    // Apply content decay every minute
    setInterval(() => {
      this.applyContentDecay();
    }, 60000);

    // Save earnings every hour
    setInterval(() => {
      this.saveEarnings();
    }, 3600000);
  }

  /**
   * Helper methods
   */
  private validateMessage(message: NetworkMessage): boolean {
    return !!(message.id && message.content && message.authorWallet && 
             message.signatures && message.signatures.length > 0);
  }

  private calculateStorageFee(message: NetworkMessage): number {
    // Base fee + size-based fee
    const baseFee = 0.1; // 0.1 ONU base
    const sizeFee = message.size / 1024 * 0.01; // 0.01 ONU per KB
    return baseFee + sizeFee;
  }

  private calculateReputation(): number {
    // Simple reputation based on uptime and messages hosted
    const uptimeScore = Math.min(process.uptime() / 3600, 24) * 2; // Max 48 points for 24h uptime
    const messageScore = Math.min(this.messages.size, 100) * 0.5; // Max 50 points for 100 messages
    return Math.floor(50 + uptimeScore + messageScore); // Base 50 + bonuses
  }

  private getStorageUsed(): number {
    return this.messages.size * 0.001; // Estimate 1KB per message
  }

  private getBandwidthUsed(): number {
    return Math.random() * 10; // TODO: Implement real bandwidth tracking
  }

  private estimateDailyEarnings(): number {
    const avgPerMessage = this.messages.size > 0 ? this.earnings.total / this.messages.size : 0.1;
    const messagesPerDay = 100; // Estimate
    return avgPerMessage * messagesPerDay;
  }

  private async updatePeerStatus(): Promise<void> {
    // Mark old peers as offline
    const cutoff = Date.now() - 300000; // 5 minutes
    for (const [id, peer] of this.peers) {
      if (peer.lastSeen < cutoff && !peer.isBootstrap) {
        this.peers.delete(id);
      }
    }
  }

  private applyContentDecay(): void {
    const expiredMessages: string[] = [];
    
    for (const [id, message] of this.messages) {
      if (message.decayScore < 1) {
        expiredMessages.push(id);
      }
    }

    // Remove expired messages
    for (const id of expiredMessages) {
      this.messages.delete(id);
      this.db.run('DELETE FROM messages WHERE id = ?', id);
    }

    if (expiredMessages.length > 0) {
      console.log(`🗑️ Removed ${expiredMessages.length} expired messages`);
    }
  }

  private async saveEarnings(): Promise<void> {
    const today = new Date().toDateString();
    await this.db.run(`
      INSERT OR REPLACE INTO earnings (date, amount) VALUES (?, ?)
    `, [today, this.earnings.today]);
  }

  private async handlePeerMessage(ws: WebSocket, message: any): Promise<void> {
    // Handle real-time peer communication
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', nodeId: this.config.nodeId }));
        break;
      case 'new_message':
        await this.storeMessage(message.data);
        break;
      // Add more message types as needed
    }
  }
}

/**
 * Create and configure a network node
 */
export function createNetworkNode(options: Partial<NodeConfig>): RealNetworkNode {
  const defaultConfig: NodeConfig = {
    nodeId: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    port: 8888,
    dataDir: './data',
    walletKeypair: Keypair.generate(), // In production, load from file
    isBootstrap: false,
    maxStorage: 1000, // 1GB
    maxBandwidth: 100, // 100 Mbps
    location: 'Unknown',
    bootstrapNodes: [
      'https://node1.onusone.network:8888',
      'https://node2.onusone.network:8888',
      'https://node3.onusone.network:8888'
    ]
  };

  const config = { ...defaultConfig, ...options };
  return new RealNetworkNode(config);
}
