/**
 * Network Metrics Collection for OnusOne P2P Node
 * Tracks performance, health, and usage statistics
 */

interface PeerHealth {
  peerId: string;
  lastSeen: Date;
  latency: number;
  reliability: number;
  messagesReceived: number;
  messagesRelayed: number;
}

interface NetworkStats {
  // Connection metrics
  connectedPeers: number;
  totalPeersDiscovered: number;
  averageLatency: number;
  connectionSuccess: number;
  connectionFailures: number;

  // Message metrics
  messagesReceived: number;
  messagesSent: number;
  messagesStored: number;
  messagesRelayed: number;

  // Storage metrics
  storageUsedBytes: number;
  storageCapacityBytes: number;
  ipfsOperations: number;
  ipfsFailures: number;

  // Performance metrics
  averageProcessingTime: number;
  peakMemoryUsage: number;
  cpuUsage: number;
  uptime: number;

  // Decay algorithm metrics
  messagesDecayed: number;
  averageMessageLifetime: number;
  topDecayScores: number[];

  // Bounty system metrics
  bountiesProcessed: number;
  summariesGenerated: number;
  averageSummaryQuality: number;
}

export class NetworkMetrics {
  private startTime: Date;
  private stats: NetworkStats;
  private peerHealth: Map<string, PeerHealth>;
  private performanceTimers: Map<string, number>;
  private lastUpdate: Date;

  constructor() {
    this.startTime = new Date();
    this.lastUpdate = new Date();
    this.peerHealth = new Map();
    this.performanceTimers = new Map();
    
    this.stats = {
      connectedPeers: 0,
      totalPeersDiscovered: 0,
      averageLatency: 0,
      connectionSuccess: 0,
      connectionFailures: 0,
      messagesReceived: 0,
      messagesSent: 0,
      messagesStored: 0,
      messagesRelayed: 0,
      storageUsedBytes: 0,
      storageCapacityBytes: 100 * 1024 * 1024 * 1024, // 100GB default
      ipfsOperations: 0,
      ipfsFailures: 0,
      averageProcessingTime: 0,
      peakMemoryUsage: 0,
      cpuUsage: 0,
      uptime: 0,
      messagesDecayed: 0,
      averageMessageLifetime: 0,
      topDecayScores: [],
      bountiesProcessed: 0,
      summariesGenerated: 0,
      averageSummaryQuality: 0
    };

    // Start periodic updates
    this.startPeriodicUpdates();
  }

  /**
   * Update peer connection metrics
   */
  updatePeerConnection(peerId: string, connected: boolean): void {
    if (connected) {
      this.stats.connectedPeers++;
      this.stats.connectionSuccess++;
      this.stats.totalPeersDiscovered = Math.max(
        this.stats.totalPeersDiscovered,
        this.stats.connectedPeers
      );
    } else {
      this.stats.connectedPeers = Math.max(0, this.stats.connectedPeers - 1);
    }
  }

  /**
   * Update peer health information
   */
  updatePeerHealth(peerId: string, healthData: {
    latency?: number;
    reliability?: number;
    messagesReceived?: number;
  }): void {
    const existing = this.peerHealth.get(peerId) || {
      peerId,
      lastSeen: new Date(),
      latency: 0,
      reliability: 1.0,
      messagesReceived: 0,
      messagesRelayed: 0
    };

    const updated: PeerHealth = {
      ...existing,
      lastSeen: new Date(),
      latency: healthData.latency ?? existing.latency,
      reliability: healthData.reliability ?? existing.reliability,
      messagesReceived: healthData.messagesReceived ?? existing.messagesReceived
    };

    this.peerHealth.set(peerId, updated);

    // Update aggregate latency
    const peers = Array.from(this.peerHealth.values());
    this.stats.averageLatency = peers.reduce((sum, peer) => sum + peer.latency, 0) / peers.length;
  }

  /**
   * Record message processing
   */
  recordMessage(type: 'received' | 'sent' | 'stored' | 'relayed'): void {
    switch (type) {
      case 'received':
        this.stats.messagesReceived++;
        break;
      case 'sent':
        this.stats.messagesSent++;
        break;
      case 'stored':
        this.stats.messagesStored++;
        break;
      case 'relayed':
        this.stats.messagesRelayed++;
        break;
    }
  }

  /**
   * Record IPFS operations
   */
  recordIPFSOperation(success: boolean): void {
    this.stats.ipfsOperations++;
    if (!success) {
      this.stats.ipfsFailures++;
    }
  }

  /**
   * Record decay algorithm metrics
   */
  recordDecayMetrics(decayedCount: number, averageLifetime: number, topScores: number[]): void {
    this.stats.messagesDecayed += decayedCount;
    this.stats.averageMessageLifetime = averageLifetime;
    this.stats.topDecayScores = topScores.slice(0, 10); // Keep top 10
  }

  /**
   * Record bounty processing
   */
  recordBountyProcessing(summariesGenerated: number, averageQuality: number): void {
    this.stats.bountiesProcessed++;
    this.stats.summariesGenerated += summariesGenerated;
    this.stats.averageSummaryQuality = averageQuality;
  }

  /**
   * Update storage metrics
   */
  updateStorageMetrics(usedBytes: number, capacityBytes?: number): void {
    this.stats.storageUsedBytes = usedBytes;
    if (capacityBytes) {
      this.stats.storageCapacityBytes = capacityBytes;
    }
  }

  /**
   * Start performance timer
   */
  startTimer(label: string): void {
    this.performanceTimers.set(label, Date.now());
  }

  /**
   * End performance timer and record
   */
  endTimer(label: string): number {
    const startTime = this.performanceTimers.get(label);
    if (!startTime) return 0;

    const duration = Date.now() - startTime;
    this.performanceTimers.delete(label);

    // Update average processing time
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime + duration) / 2;

    return duration;
  }

  /**
   * Increment message count
   */
  incrementMessageCount(): void {
    this.stats.messagesReceived++;
  }

  /**
   * Record connection failure
   */
  recordConnectionFailure(): void {
    this.stats.connectionFailures++;
  }

  /**
   * Get current statistics
   */
  getStats(): NetworkStats & {
    storageUtilization: number;
    reliability: number;
    networkHealth: 'healthy' | 'degraded' | 'poor';
    uptimeHours: number;
  } {
    const now = new Date();
    const uptimeMs = now.getTime() - this.startTime.getTime();
    const uptimeHours = uptimeMs / (1000 * 60 * 60);

    const storageUtilization = this.stats.storageCapacityBytes > 0 
      ? (this.stats.storageUsedBytes / this.stats.storageCapacityBytes) * 100
      : 0;

    const reliability = this.stats.connectionSuccess > 0
      ? (this.stats.connectionSuccess / (this.stats.connectionSuccess + this.stats.connectionFailures)) * 100
      : 100;

    const networkHealth = this.calculateNetworkHealth();

    return {
      ...this.stats,
      uptime: uptimeMs,
      storageUtilization,
      reliability,
      networkHealth,
      uptimeHours
    };
  }

  /**
   * Get peer health summary
   */
  getPeerHealthSummary(): {
    totalPeers: number;
    healthyPeers: number;
    averageLatency: number;
    reliabilityScore: number;
  } {
    const peers = Array.from(this.peerHealth.values());
    const healthyPeers = peers.filter(peer => 
      peer.reliability > 0.8 && peer.latency < 1000
    ).length;

    const reliabilityScore = peers.length > 0
      ? peers.reduce((sum, peer) => sum + peer.reliability, 0) / peers.length
      : 1.0;

    return {
      totalPeers: peers.length,
      healthyPeers,
      averageLatency: this.stats.averageLatency,
      reliabilityScore
    };
  }

  /**
   * Calculate overall network health
   */
  private calculateNetworkHealth(): 'healthy' | 'degraded' | 'poor' {
    const peerCount = this.stats.connectedPeers;
    const avgLatency = this.stats.averageLatency;
    const ipfsFailureRate = this.stats.ipfsOperations > 0 
      ? (this.stats.ipfsFailures / this.stats.ipfsOperations) * 100
      : 0;

    // Health scoring
    let score = 100;

    // Deduct for low peer count
    if (peerCount < 3) score -= 30;
    else if (peerCount < 10) score -= 15;

    // Deduct for high latency
    if (avgLatency > 2000) score -= 25;
    else if (avgLatency > 1000) score -= 10;

    // Deduct for IPFS failures
    if (ipfsFailureRate > 10) score -= 20;
    else if (ipfsFailureRate > 5) score -= 10;

    if (score >= 80) return 'healthy';
    if (score >= 60) return 'degraded';
    return 'poor';
  }

  /**
   * Start periodic metric updates
   */
  private startPeriodicUpdates(): void {
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000); // Update every 30 seconds
  }

  /**
   * Update system-level metrics
   */
  private updateSystemMetrics(): void {
    // Memory usage
    const memUsage = process.memoryUsage();
    this.stats.peakMemoryUsage = Math.max(
      this.stats.peakMemoryUsage,
      memUsage.heapUsed
    );

    // CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    this.stats.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

    // Update uptime
    const now = new Date();
    this.stats.uptime = now.getTime() - this.startTime.getTime();

    this.lastUpdate = now;
  }

  /**
   * Export metrics for monitoring systems
   */
  exportMetrics(): {
    timestamp: string;
    node: {
      uptime: number;
      memory: number;
      cpu: number;
    };
    network: {
      peers: number;
      latency: number;
      health: string;
    };
    messages: {
      received: number;
      sent: number;
      stored: number;
    };
    storage: {
      used: number;
      capacity: number;
      utilization: number;
    };
  } {
    const stats = this.getStats();
    
    return {
      timestamp: new Date().toISOString(),
      node: {
        uptime: stats.uptime,
        memory: this.stats.peakMemoryUsage,
        cpu: this.stats.cpuUsage
      },
      network: {
        peers: this.stats.connectedPeers,
        latency: this.stats.averageLatency,
        health: stats.networkHealth
      },
      messages: {
        received: this.stats.messagesReceived,
        sent: this.stats.messagesSent,
        stored: this.stats.messagesStored
      },
      storage: {
        used: this.stats.storageUsedBytes,
        capacity: this.stats.storageCapacityBytes,
        utilization: stats.storageUtilization
      }
    };
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.startTime = new Date();
    this.peerHealth.clear();
    this.performanceTimers.clear();
    
    Object.keys(this.stats).forEach(key => {
      if (typeof this.stats[key as keyof NetworkStats] === 'number') {
        (this.stats as any)[key] = 0;
      } else if (Array.isArray(this.stats[key as keyof NetworkStats])) {
        (this.stats as any)[key] = [];
      }
    });

    // Restore capacity
    this.stats.storageCapacityBytes = 100 * 1024 * 1024 * 1024;
  }
}