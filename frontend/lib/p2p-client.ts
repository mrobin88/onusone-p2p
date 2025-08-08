import { EventEmitter } from 'events';

// P2P Client Configuration
const P2P_CONFIG = {
  NODE_URL: process.env.NEXT_PUBLIC_P2P_NODE_URL || 'http://localhost:8888',
  RECONNECT_DELAY: 5000,
  HEARTBEAT_INTERVAL: 30000,
  MAX_RECONNECT_ATTEMPTS: 10,
  CONNECTION_TIMEOUT: 15000,
};

// Message types for P2P communication
export enum P2PMessageType {
  POST_CREATE = 'post_create',
  POST_UPDATE = 'post_update',
  POST_ENGAGEMENT = 'post_engagement',
  USER_JOIN = 'user_join',
  USER_LEAVE = 'user_leave',
  NETWORK_STATUS = 'network_status',
  PEER_DISCOVERY = 'peer_discovery',
}

export interface P2PMessage {
  id: string;
  type: P2PMessageType;
  timestamp: string;
  author: string;
  content: any;
  signature?: string;
  board?: string;
}

export interface NetworkStatus {
  nodeId: string;
  connectedPeers: number;
  networkHealth: string;
  uptime: number;
  messagesSynced: number;
  storageUsed: number;
  isBootstrap: boolean;
}

export interface PeerInfo {
  id: string;
  multiaddr: string;
  isConnected: boolean;
  reputation: number;
  lastSeen: string;
  userAgent?: string;
}

/**
 * P2P Network Client
 * Bridges frontend with P2P node for real decentralized communication
 */
export class P2PClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private nodeUrl: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private networkStatus: NetworkStatus | null = null;

  constructor(nodeUrl?: string) {
    super();
    this.nodeUrl = nodeUrl || P2P_CONFIG.NODE_URL;
  }

  /**
   * Connect to P2P node
   */
  async connect(userId: string): Promise<void> {
    this.userId = userId;
    
    try {
      // First check if node is available via HTTP
      const healthCheck = await this.checkNodeHealth();
      if (!healthCheck.success) {
        throw new Error(`P2P node health check failed: ${healthCheck.error}`);
      }

      // Connect via WebSocket if available, fallback to HTTP polling
      if (this.isWebSocketSupported()) {
        await this.connectWebSocket();
      } else {
        await this.startHttpPolling();
      }

      this.emit('connected', { userId, networkStatus: this.networkStatus });
      
    } catch (error) {
      console.error('P2P connection failed:', error);
      this.emit('connection_error', error);
      
      // Attempt reconnection
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from P2P network
   */
  disconnect(): void {
    this.isConnected = false;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.emit('disconnected');
  }

  /**
   * Broadcast message to P2P network
   */
  async broadcastMessage(message: Omit<P2PMessage, 'id' | 'timestamp'>): Promise<boolean> {
    const fullMessage: P2PMessage = {
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      ...message,
    };

    try {
      if (this.isConnected && this.ws) {
        // Real-time WebSocket broadcast
        this.ws.send(JSON.stringify({
          type: 'broadcast',
          message: fullMessage
        }));
        return true;
      } else {
        // HTTP fallback
        const response = await fetch(`${this.nodeUrl}/api/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullMessage)
        });
        return response.ok;
      }
    } catch (error) {
      console.error('Broadcast failed:', error);
      this.emit('broadcast_error', { message: fullMessage, error });
      return false;
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<NetworkStatus | null> {
    try {
      const response = await fetch(`${this.nodeUrl}/api/status`);
      if (response.ok) {
        const status = await response.json();
        this.networkStatus = status;
        return status;
      }
    } catch (error) {
      console.error('Failed to get network status:', error);
    }
    return null;
  }

  /**
   * Get connected peers
   */
  async getPeers(): Promise<PeerInfo[]> {
    try {
      const response = await fetch(`${this.nodeUrl}/api/peers`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get peers:', error);
    }
    return [];
  }

  /**
   * Subscribe to board for real-time updates
   */
  async subscribeToBoard(boardSlug: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.nodeUrl}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: boardSlug, userId: this.userId })
      });
      return response.ok;
    } catch (error) {
      console.error('Board subscription failed:', error);
      return false;
    }
  }

  /**
   * Check if P2P node is healthy
   */
  private async checkNodeHealth(): Promise<{ success: boolean; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), P2P_CONFIG.CONNECTION_TIMEOUT);
      
      const response = await fetch(`${this.nodeUrl}/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const health = await response.json();
        return { success: true };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Connection timeout' };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Connect via WebSocket for real-time communication
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.nodeUrl.replace('http', 'ws') + '/ws';
      this.ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this.ws.close();
          reject(new Error('WebSocket connection timeout'));
        }
      }, P2P_CONFIG.CONNECTION_TIMEOUT);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        
        // Send user join message
        if (this.userId) {
          this.ws!.send(JSON.stringify({
            type: 'user_join',
            userId: this.userId,
            timestamp: new Date().toISOString()
          }));
        }
        
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleP2PMessage(data);
        } catch (error) {
          console.error('Failed to parse P2P message:', error);
        }
      };

      this.ws.onclose = () => {
        clearTimeout(timeout);
        this.isConnected = false;
        this.emit('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  /**
   * Fallback HTTP polling for environments without WebSocket support
   */
  private async startHttpPolling(): Promise<void> {
    this.isConnected = true;
    
    // Poll for network status and messages
    const pollInterval = setInterval(async () => {
      if (!this.isConnected) {
        clearInterval(pollInterval);
        return;
      }

      try {
        // Get network status
        const status = await this.getNetworkStatus();
        if (status) {
          this.emit('network_status', status);
        }

        // Check for new messages (simplified polling)
        const response = await fetch(`${this.nodeUrl}/api/messages/recent`);
        if (response.ok) {
          const messages = await response.json();
          messages.forEach((msg: P2PMessage) => {
            this.emit('message', msg);
          });
        }
      } catch (error) {
        console.error('HTTP polling error:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  /**
   * Handle incoming P2P messages
   */
  private handleP2PMessage(data: any): void {
    switch (data.type) {
      case 'message':
        this.emit('message', data.payload);
        break;
      case 'network_status':
        this.networkStatus = data.payload;
        this.emit('network_status', data.payload);
        break;
      case 'peer_joined':
        this.emit('peer_joined', data.payload);
        break;
      case 'peer_left':
        this.emit('peer_left', data.payload);
        break;
      case 'engagement':
        this.emit('engagement', data.payload);
        break;
      default:
        console.log('Unknown P2P message type:', data.type);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      }
    }, P2P_CONFIG.HEARTBEAT_INTERVAL);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= P2P_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      this.emit('connection_failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Scheduling P2P reconnection attempt ${this.reconnectAttempts}/${P2P_CONFIG.MAX_RECONNECT_ATTEMPTS}`);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, P2P_CONFIG.RECONNECT_DELAY * this.reconnectAttempts);
  }

  /**
   * Check if WebSocket is supported
   */
  private isWebSocketSupported(): boolean {
    return typeof WebSocket !== 'undefined';
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    nodeUrl: string;
    reconnectAttempts: number;
    networkStatus: NetworkStatus | null;
  } {
    return {
      isConnected: this.isConnected,
      nodeUrl: this.nodeUrl,
      reconnectAttempts: this.reconnectAttempts,
      networkStatus: this.networkStatus,
    };
  }
}

// Global P2P client instance
let globalP2PClient: P2PClient | null = null;

/**
 * Get or create global P2P client instance
 */
export function getP2PClient(): P2PClient {
  if (!globalP2PClient) {
    globalP2PClient = new P2PClient();
  }
  return globalP2PClient;
}

export default P2PClient;
