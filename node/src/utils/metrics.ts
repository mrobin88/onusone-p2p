/**
 * Simple metrics utility for OnusOne P2P Node
 */

export class NetworkMetrics {
  private healthChecks: number = 0;
  private startTime: number = Date.now();

  recordHealthCheck(): void {
    this.healthChecks++;
  }

  getStats(): any {
    return {
      healthChecks: this.healthChecks,
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString()
    };
  }
}