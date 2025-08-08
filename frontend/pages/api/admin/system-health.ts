import type { NextApiRequest, NextApiResponse } from 'next';
import { getDataLayer } from '../../../lib/data-layer';

/**
 * System Health Check API
 * Provides comprehensive health metrics for the unified data architecture
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dataLayer = getDataLayer();
    
    // Get comprehensive system health
    const health = await dataLayer.getSystemHealth();
    
    // Get additional metrics
    const additionalMetrics = await getAdditionalMetrics();
    
    return res.status(200).json({
      success: true,
      health: {
        ...health,
        ...additionalMetrics
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('System health check failed:', error);
    return res.status(500).json({
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get additional system metrics
 */
async function getAdditionalMetrics() {
  try {
    const { kv } = await import('@vercel/kv');
    
    // Test basic KV operations and measure performance
    const startTime = Date.now();
    
    // Test operations
    const testKey = `health_check_${Date.now()}`;
    await kv.set(testKey, 'test', { ex: 60 }); // Expire in 60 seconds
    const retrieved = await kv.get(testKey);
    await kv.del(testKey);
    
    const operationTime = Date.now() - startTime;
    
    // Get memory usage (if available)
    const memoryUsage = process.memoryUsage();
    
    return {
      kv_performance: {
        operation_time_ms: operationTime,
        test_success: retrieved === 'test'
      },
      server_metrics: {
        memory_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        memory_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        uptime_seconds: Math.floor(process.uptime()),
        node_version: process.version
      },
      data_layer_status: {
        unified_architecture: true,
        storage_system: 'Vercel KV',
        backup_systems: [],
        migration_complete: true
      }
    };
    
  } catch (error) {
    console.error('Failed to get additional metrics:', error);
    return {
      kv_performance: {
        operation_time_ms: -1,
        test_success: false
      },
      server_metrics: {
        memory_used_mb: 0,
        memory_total_mb: 0,
        uptime_seconds: 0,
        node_version: 'unknown'
      },
      data_layer_status: {
        unified_architecture: false,
        storage_system: 'unknown',
        backup_systems: [],
        migration_complete: false
      }
    };
  }
}
