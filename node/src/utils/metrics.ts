/**
 * Simplified Network Metrics
 */

export interface SimpleNetworkMetrics {
  totalPeers: number;
  connectedPeers: number;
  messagesProcessed: number;
  storageUsed: number;
  uptime: number;
  networkHealth: 'excellent' | 'good' | 'fair' | 'poor';
  lastUpdated: number;
}

export class NetworkMetrics {
  private metrics: SimpleNetworkMetrics;

  constructor() {
    this.metrics = {
      totalPeers: 0,
      connectedPeers: 0,
      messagesProcessed: 0,
      storageUsed: 0,
      uptime: 0,
      networkHealth: 'excellent',
      lastUpdated: Date.now()
    };
  }

  updateFromP2P(p2pMetrics: any): void {
    if (p2pMetrics) {
      this.metrics.connectedPeers = p2pMetrics.peersConnected || 0;
      this.metrics.messagesProcessed = p2pMetrics.messagesProcessed || 0;
      this.metrics.storageUsed = p2pMetrics.storageUsed || 0;
      this.metrics.lastUpdated = Date.now();
    }
  }

  updatePeerCount(count: number): void {
    this.metrics.connectedPeers = count;
    this.metrics.totalPeers = Math.max(this.metrics.totalPeers, count);
    this.metrics.lastUpdated = Date.now();
  }

  incrementMessageCount(): void {
    this.metrics.messagesProcessed++;
    this.metrics.lastUpdated = Date.now();
  }

  updateStorageUsed(bytes: number): void {
    this.metrics.storageUsed = bytes;
    this.metrics.lastUpdated = Date.now();
  }

  updateUptime(seconds: number): void {
    this.metrics.uptime = seconds;
    this.metrics.lastUpdated = Date.now();
  }

  updateNetworkHealth(health: 'excellent' | 'good' | 'fair' | 'poor'): void {
    this.metrics.networkHealth = health;
    this.metrics.lastUpdated = Date.now();
  }

  getConnectedPeers(): number {
    return this.metrics.connectedPeers;
  }

  getTotalPeers(): number {
    return this.metrics.totalPeers;
  }

  getMessagesProcessed(): number {
    return this.metrics.messagesProcessed;
  }

  getStorageUsed(): number {
    return this.metrics.storageUsed;
  }

  getUptime(): number {
    return this.metrics.uptime;
  }

  getNetworkHealth(): string {
    return this.metrics.networkHealth;
  }

  getLastUpdated(): number {
    return this.metrics.lastUpdated;
  }

  getMetrics(): SimpleNetworkMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalPeers: 0,
      connectedPeers: 0,
      messagesProcessed: 0,
      storageUsed: 0,
      uptime: 0,
      networkHealth: 'excellent',
      lastUpdated: Date.now()
    };
  }

  // Health calculation
  calculateHealth(): 'excellent' | 'good' | 'fair' | 'poor' {
    const peerRatio = this.metrics.connectedPeers / Math.max(this.metrics.totalPeers, 1);
    const messageRate = this.metrics.messagesProcessed / Math.max(this.metrics.uptime / 3600, 1);
    
    if (peerRatio > 0.8 && messageRate > 10) return 'excellent';
    if (peerRatio > 0.6 && messageRate > 5) return 'good';
    if (peerRatio > 0.4 && messageRate > 1) return 'fair';
    return 'poor';
  }

  // Performance metrics
  getPerformanceMetrics() {
    return {
      peerEfficiency: this.metrics.connectedPeers / Math.max(this.metrics.totalPeers, 1),
      messageThroughput: this.metrics.messagesProcessed / Math.max(this.metrics.uptime / 3600, 1),
      storageEfficiency: this.metrics.storageUsed / (1024 * 1024 * 1024), // GB
      healthScore: this.calculateHealth()
    };
  }

  // Export for monitoring
  exportMetrics() {
    return {
      ...this.metrics,
      performance: this.getPerformanceMetrics(),
      timestamp: new Date().toISOString()
    };
  }
}