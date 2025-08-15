/**
 * Monitoring & Observability API Endpoints
 * Provides real-time metrics and system health data
 */

import express from 'express';
import { monitoring } from '../utils/monitoring';

const router = express.Router();

/**
 * Get real-time system metrics
 * GET /api/monitoring/metrics
 */
router.get('/metrics', (req: any, res: any) => {
  try {
    const metrics = monitoring.getMetrics();
    const businessMetrics = monitoring.getBusinessMetrics();
    const performance = monitoring.getPerformanceSummary();
    const errors = monitoring.getErrorAnalysis();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        uptime: monitoring.getUptime(),
        uptimeFormatted: formatUptime(monitoring.getUptime())
      },
      performance,
      business: businessMetrics,
      errors,
      recentMetrics: metrics.slice(-50) // Last 50 requests
    });
    
  } catch (error) {
    console.error('Failed to get metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve metrics' 
    });
  }
});

/**
 * Get performance summary
 * GET /api/monitoring/performance
 */
router.get('/performance', (req: any, res: any) => {
  try {
    const performance = monitoring.getPerformanceSummary();
    
    res.json({
      success: true,
      performance,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get performance data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve performance data' 
    });
  }
});

/**
 * Get business metrics
 * GET /api/monitoring/business
 */
router.get('/business', (req: any, res: any) => {
  try {
    const businessMetrics = monitoring.getBusinessMetrics();
    
    res.json({
      success: true,
      business: businessMetrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get business metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve business metrics' 
    });
  }
});

/**
 * Get error analysis
 * GET /api/monitoring/errors
 */
router.get('/errors', (req: any, res: any) => {
  try {
    const errors = monitoring.getErrorAnalysis();
    
    res.json({
      success: true,
      errors,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get error analysis:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve error analysis' 
    });
  }
});

/**
 * Get system health
 * GET /api/monitoring/health
 */
router.get('/health', (req: any, res: any) => {
  try {
    const uptime = monitoring.getUptime();
    const businessMetrics = monitoring.getBusinessMetrics();
    
    // Calculate health score (0-100)
    const errorRate = businessMetrics.errorRate;
    const healthScore = Math.max(0, 100 - errorRate);
    
    let status = 'healthy';
    if (healthScore < 50) status = 'critical';
    else if (healthScore < 80) status = 'warning';
    
    res.json({
      success: true,
      status,
      healthScore: Math.round(healthScore),
      timestamp: new Date().toISOString(),
      system: {
        uptime,
        uptimeFormatted: formatUptime(uptime)
      },
      metrics: {
        totalRequests: monitoring.getMetrics().length,
        errorRate: Math.round(errorRate * 100) / 100,
        successRate: Math.round((100 - errorRate) * 100) / 100
      }
    });
    
  } catch (error) {
    console.error('Failed to get health status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve health status' 
    });
  }
});

/**
 * Reset metrics (admin only)
 * POST /api/monitoring/reset
 */
router.post('/reset', (req, res) => {
  try {
    // TODO: Add admin authentication
    monitoring.resetMetrics();
    
    res.json({
      success: true,
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to reset metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset metrics' 
    });
  }
});

/**
 * Get detailed metrics for specific endpoint
 * GET /api/monitoring/endpoint/:path
 */
router.get('/endpoint/:path(*)', (req: any, res: any) => {
  try {
    const { path } = req.params;
    const metrics = monitoring.getMetrics();
    
    const endpointMetrics = metrics.filter(m => 
      m.endpoint.includes(path)
    );
    
    if (endpointMetrics.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No metrics found for endpoint'
      });
    }
    
    const avgResponseTime = endpointMetrics.reduce((sum, m) => sum + m.responseTime, 0) / endpointMetrics.length;
    const errorCount = endpointMetrics.filter(m => m.statusCode >= 400).length;
    const successRate = ((endpointMetrics.length - errorCount) / endpointMetrics.length) * 100;
    
    res.json({
      success: true,
      endpoint: path,
      metrics: {
        totalRequests: endpointMetrics.length,
        averageResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        errorCount,
        successRate: `${successRate.toFixed(2)}%`,
        statusCodes: getStatusCodeBreakdown(endpointMetrics)
      },
      recentRequests: endpointMetrics.slice(-20),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get endpoint metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve endpoint metrics' 
    });
  }
});

/**
 * Helper function to format uptime
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Helper function to get status code breakdown
 */
function getStatusCodeBreakdown(metrics: any[]) {
  const breakdown: { [key: string]: number } = {};
  
  metrics.forEach(m => {
    const status = m.statusCode.toString();
    breakdown[status] = (breakdown[status] || 0) + 1;
  });
  
  return Object.entries(breakdown)
    .sort(([,a], [,b]) => b - a)
    .map(([status, count]) => ({ status, count }));
}

export default router;
