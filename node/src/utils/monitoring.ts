/**
 * Production Monitoring & Observability System
 * Tracks performance, errors, and business metrics
 */

import { Request, Response, NextFunction } from 'express';

export interface MetricsData {
  timestamp: number;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
  error?: string;
}

export interface BusinessMetrics {
  totalUsers: number;
  totalMessages: number;
  totalStakes: number;
  totalONUTokens: number;
  activeStakes: number;
  fileUploads: number;
  paymentVolume: number;
  errorRate: number;
}

export class MonitoringSystem {
  private metrics: MetricsData[] = [];
  private businessMetrics: BusinessMetrics = {
    totalUsers: 0,
    totalMessages: 0,
    totalStakes: 0,
    totalONUTokens: 0,
    activeStakes: 0,
    fileUploads: 0,
    paymentVolume: 0,
    errorRate: 0
  };

  private startTime = Date.now();

  /**
   * Middleware to track API performance
   */
  public trackAPIPerformance() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      const originalSend = res.send;

      res.send = function(data) {
        const responseTime = Date.now() - start;
        
        const metric: MetricsData = {
          timestamp: Date.now(),
          endpoint: req.path,
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          userId: req.headers['x-user-id'] as string
        };

        if (res.statusCode >= 400) {
          metric.error = data?.message || 'Unknown error';
        }

        this.addMetric(metric);
        originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Add a new metric
   */
  public addMetric(metric: MetricsData) {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Update business metrics
    this.updateBusinessMetrics(metric);
  }

  /**
   * Update business metrics based on API calls
   */
  private updateBusinessMetrics(metric: MetricsData) {
    if (metric.endpoint.includes('/messages') && metric.method === 'POST') {
      this.businessMetrics.totalMessages++;
    }
    
    if (metric.endpoint.includes('/staking') && metric.method === 'POST') {
      this.businessMetrics.totalStakes++;
    }
    
    if (metric.endpoint.includes('/upload') && metric.method === 'POST') {
      this.businessMetrics.fileUploads++;
    }
    
    if (metric.statusCode >= 400) {
      this.businessMetrics.errorRate = 
        (this.metrics.filter(m => m.statusCode >= 400).length / this.metrics.length) * 100;
    }
  }

  /**
   * Get current metrics
   */
  public getMetrics(): MetricsData[] {
    return this.metrics;
  }

  /**
   * Get business metrics
   */
  public getBusinessMetrics(): BusinessMetrics {
    return this.businessMetrics;
  }

  /**
   * Get system uptime
   */
  public getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary() {
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - m.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentMetrics.length === 0) {
      return { message: 'No recent metrics available' };
    }

    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const successRate = ((recentMetrics.length - errorCount) / recentMetrics.length) * 100;

    return {
      period: 'Last 5 minutes',
      totalRequests: recentMetrics.length,
      averageResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      errorCount,
      successRate: `${successRate.toFixed(2)}%`,
      topEndpoints: this.getTopEndpoints(recentMetrics)
    };
  }

  /**
   * Get top endpoints by request count
   */
  private getTopEndpoints(metrics: MetricsData[]) {
    const endpointCounts: { [key: string]: number } = {};
    
    metrics.forEach(m => {
      endpointCounts[m.endpoint] = (endpointCounts[m.endpoint] || 0) + 1;
    });

    return Object.entries(endpointCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  /**
   * Get error analysis
   */
  public getErrorAnalysis() {
    const errors = this.metrics.filter(m => m.statusCode >= 400);
    
    if (errors.length === 0) {
      return { message: 'No errors recorded' };
    }

    const errorTypes: { [key: string]: number } = {};
    errors.forEach(e => {
      const status = e.statusCode.toString();
      errorTypes[status] = (errorTypes[status] || 0) + 1;
    });

    return {
      totalErrors: errors.length,
      errorBreakdown: Object.entries(errorTypes)
        .sort(([,a], [,b]) => b - a)
        .map(([status, count]) => ({ status, count })),
      recentErrors: errors.slice(-10).map(e => ({
        timestamp: new Date(e.timestamp).toISOString(),
        endpoint: e.endpoint,
        method: e.method,
        statusCode: e.statusCode,
        error: e.error
      }))
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  public resetMetrics() {
    this.metrics = [];
    this.businessMetrics = {
      totalUsers: 0,
      totalMessages: 0,
      totalStakes: 0,
      totalONUTokens: 0,
      activeStakes: 0,
      fileUploads: 0,
      paymentVolume: 0,
      errorRate: 0
    };
    this.startTime = Date.now();
  }
}

// Export singleton instance
export const monitoring = new MonitoringSystem();
