/**
 * Network Metrics and Health Monitoring
 * Tracks P2P network performance and health indicators
 */

export interface NetworkMetrics {
  totalPeers: number;
  connectedPeers: number;
  messagesProcessed: number;
  storageUsed: number;
  uptime: number;
  networkHealth: 'excellent' | 'good' | 'fair' | 'poor';
  lastUpdated: number;
}

export interface PeerMetrics {
  id: string;
  reputation: number;
  responseTime: number;
  lastSeen: number;
  isRelay: boolean;
}

export class NetworkMetrics {
  private metrics: NetworkMetrics;
  private peerMetrics: Map<string, PeerMetrics> = new Map();
  private healthChecks: number[] = [];
  private messageHistory: Array<{ timestamp: number; count: number }> = [];
  private storageHistory: Array<{ timestamp: number; size: number }> = [];

  constructor() {
    this.metrics = {
      totalPeers: 0,
      connectedPeers: 0,
      messagesProcessed: 0,
      storageUsed: 0,
      uptime: Date.now(),
      networkHealth: 'excellent',
      lastUpdated: Date.now()
    };
  }

  // Update metrics from P2P node
  updateFromP2P(p2pMetrics: Partial<NetworkMetrics>) {
    if (p2pMetrics.totalPeers !== undefined) {
      this.metrics.totalPeers = p2pMetrics.totalPeers;
    }
    if (p2pMetrics.connectedPeers !== undefined) {
      this.metrics.connectedPeers = p2pMetrics.connectedPeers;
    }
    if (p2pMetrics.messagesProcessed !== undefined) {
      this.metrics.messagesProcessed = p2pMetrics.messagesProcessed;
    }
    if (p2pMetrics.storageUsed !== undefined) {
      this.metrics.storageUsed = p2pMetrics.storageUsed;
    }
    if (p2pMetrics.networkHealth !== undefined) {
      this.metrics.networkHealth = p2pMetrics.networkHealth;
    }

    this.updateNetworkHealth();
    this.recordMetrics();
  }

  // Record current metrics for historical tracking
  private recordMetrics() {
    const now = Date.now();
    
    // Record message count
    this.messageHistory.push({
      timestamp: now,
      count: this.metrics.messagesProcessed
    });
    
    // Record storage usage
    this.storageHistory.push({
      timestamp: now,
      size: this.metrics.storageUsed
    });

    // Keep only last 100 entries
    if (this.messageHistory.length > 100) {
      this.messageHistory.shift();
    }
    if (this.storageHistory.length > 100) {
      this.storageHistory.shift();
    }

    this.metrics.lastUpdated = now;
  }

  // Update network health based on current metrics
  private updateNetworkHealth() {
    const connectionRatio = this.metrics.connectedPeers / Math.max(1, this.metrics.totalPeers);
    const messageRate = this.getMessageRate();
    const storageGrowth = this.getStorageGrowthRate();

    let healthScore = 0;

    // Connection health (40% weight)
    if (connectionRatio >= 0.8) healthScore += 40;
    else if (connectionRatio >= 0.6) healthScore += 30;
    else if (connectionRatio >= 0.4) healthScore += 20;
    else healthScore += 10;

    // Message activity health (30% weight)
    if (messageRate >= 10) healthScore += 30; // 10+ messages per minute
    else if (messageRate >= 5) healthScore += 20;
    else if (messageRate >= 1) healthScore += 10;
    else healthScore += 0;

    // Storage health (20% weight)
    if (storageGrowth < 100) healthScore += 20; // <100MB growth per hour
    else if (storageGrowth < 500) healthScore += 15;
    else if (storageGrowth < 1000) healthScore += 10;
    else healthScore += 5;

    // Peer stability (10% weight)
    const stablePeers = this.getStablePeersCount();
    const stabilityRatio = stablePeers / Math.max(1, this.metrics.totalPeers);
    if (stabilityRatio >= 0.7) healthScore += 10;
    else if (stabilityRatio >= 0.5) healthScore += 7;
    else if (stabilityRatio >= 0.3) healthScore += 4;
    else healthScore += 1;

    // Determine overall health
    if (healthScore >= 80) {
      this.metrics.networkHealth = 'excellent';
    } else if (healthScore >= 60) {
      this.metrics.networkHealth = 'good';
    } else if (healthScore >= 40) {
      this.metrics.networkHealth = 'fair';
    } else {
      this.metrics.networkHealth = 'poor';
    }
  }

  // Get message rate (messages per minute)
  private getMessageRate(): number {
    if (this.messageHistory.length < 2) return 0;
    
    const recent = this.messageHistory.slice(-2);
    const timeDiff = (recent[1].timestamp - recent[0].timestamp) / 60000; // minutes
    const messageDiff = recent[1].count - recent[0].count;
    
    return timeDiff > 0 ? messageDiff / timeDiff : 0;
  }

  // Get storage growth rate (MB per hour)
  private getStorageGrowthRate(): number {
    if (this.storageHistory.length < 2) return 0;
    
    const recent = this.storageHistory.slice(-2);
    const timeDiff = (recent[1].timestamp - recent[0].timestamp) / 3600000; // hours
    const storageDiff = (recent[1].size - recent[0].size) / (1024 * 1024); // Convert to MB
    
    return timeDiff > 0 ? storageDiff / timeDiff : 0;
  }

  // Get count of stable peers (connected for >5 minutes)
  private getStablePeersCount(): number {
    const now = Date.now();
    let stableCount = 0;
    
    for (const peer of this.peerMetrics.values()) {
      if (now - peer.lastSeen < 300000) { // 5 minutes
        stableCount++;
      }
    }
    
    return stableCount;
  }

  // Update peer metrics
  updatePeerMetrics(peerId: string, metrics: Partial<PeerMetrics>) {
    const existing = this.peerMetrics.get(peerId) || {
      id: peerId,
      reputation: 50,
      responseTime: 0,
      lastSeen: Date.now(),
      isRelay: false
    };

    this.peerMetrics.set(peerId, { ...existing, ...metrics });
  }

  // Record health check
  recordHealthCheck() {
    const now = Date.now();
    this.healthChecks.push(now);
    
    // Keep only last 100 health checks
    if (this.healthChecks.length > 100) {
      this.healthChecks.shift();
    }
  }

  // Get health check success rate
  getHealthCheckRate(): number {
    if (this.healthChecks.length < 2) return 1;
    
    const recent = this.healthChecks.slice(-10); // Last 10 checks
    const expectedChecks = Math.floor((recent[recent.length - 1] - recent[0]) / 30000); // 30 second intervals
    
    return expectedChecks > 0 ? recent.length / expectedChecks : 1;
  }

  // Get comprehensive metrics
  getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  // Get peer metrics
  getPeerMetrics(): PeerMetrics[] {
    return Array.from(this.peerMetrics.values());
  }

  // Get network health
  getNetworkHealth(): string {
    return this.metrics.networkHealth;
  }

  // Get connected peers count
  getConnectedPeers(): number {
    return this.metrics.connectedPeers;
  }

  // Get total peers count
  getTotalPeers(): number {
    return this.metrics.totalPeers;
  }

  // Get messages processed count
  getMessagesProcessed(): number {
    return this.metrics.messagesProcessed;
  }

  // Get storage used
  getStorageUsed(): number {
    return this.metrics.storageUsed;
  }

  // Get uptime
  getUptime(): number {
    return Date.now() - this.metrics.uptime;
  }

  // Get peers list for API responses
  getPeers(): any[] {
    const peers = [];
    
    for (const [peerId, metrics] of this.peerMetrics) {
      peers.push({
        id: peerId,
        reputation: metrics.reputation,
        responseTime: metrics.responseTime,
        lastSeen: new Date(metrics.lastSeen).toISOString(),
        isRelay: metrics.isRelay,
        isConnected: Date.now() - metrics.lastSeen < 60000 // Connected if seen in last minute
      });
    }
    
    return peers.sort((a, b) => b.reputation - a.reputation);
  }

  // Get historical data for analytics
  getHistoricalData() {
    return {
      messages: this.messageHistory,
      storage: this.storageHistory,
      healthChecks: this.healthChecks
    };
  }

  // Reset metrics (useful for testing)
  reset() {
    this.metrics = {
      totalPeers: 0,
      connectedPeers: 0,
      messagesProcessed: 0,
      storageUsed: 0,
      uptime: Date.now(),
      networkHealth: 'excellent',
      lastUpdated: Date.now()
    };
    
    this.peerMetrics.clear();
    this.healthChecks = [];
    this.messageHistory = [];
    this.storageHistory = [];
  }

  // Export metrics for external monitoring
  exportForMonitoring() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      peers: this.getPeerMetrics(),
      health: {
        healthCheckRate: this.getHealthCheckRate(),
        messageRate: this.getMessageRate(),
        storageGrowthRate: this.getStorageGrowthRate(),
        stablePeersRatio: this.getStablePeersCount() / Math.max(1, this.metrics.totalPeers)
      },
      historical: this.getHistoricalData()
    };
  }
}