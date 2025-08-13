import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface MonitoringData {
  timestamp: string;
  system: {
    uptime: number;
    uptimeFormatted: string;
  };
  performance: {
    period: string;
    totalRequests: number;
    averageResponseTime: string;
    errorCount: number;
    successRate: string;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  };
  business: {
    totalUsers: number;
    totalMessages: number;
    totalStakes: number;
    totalONUTokens: number;
    activeStakes: number;
    fileUploads: number;
    paymentVolume: number;
    errorRate: number;
  };
  errors: {
    totalErrors: number;
    errorBreakdown: Array<{ status: string; count: number }>;
    recentErrors: Array<{
      timestamp: string;
      endpoint: string;
      method: string;
      statusCode: number;
      error: string;
    }>;
  };
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  healthScore: number;
  uptime: number;
  uptimeFormatted: string;
  totalRequests: number;
  errorRate: number;
  successRate: number;
}

const MonitoringDashboard: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoringData = async () => {
    try {
      const [metricsResponse, healthResponse] = await Promise.all([
        fetch('/api/monitoring/metrics'),
        fetch('/api/monitoring/health')
      ]);

      if (metricsResponse.ok && healthResponse.ok) {
        const [metricsData, healthData] = await Promise.all([
          metricsResponse.json(),
          healthResponse.json()
        ]);

        setMonitoringData(metricsData);
        setSystemHealth(healthData);
        setError(null);
      } else {
        throw new Error('Failed to fetch monitoring data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading monitoring data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">⚠️ Monitoring Error</div>
        <div className="text-gray-600 mb-4">{error}</div>
        <button
          onClick={fetchMonitoringData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!monitoringData || !systemHealth) {
    return (
      <div className="p-8 text-center text-gray-600">
        No monitoring data available
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Monitoring Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Badge className={getStatusColor(systemHealth.status)}>
            {systemHealth.status.toUpperCase()}
          </Badge>
          <span className="text-sm text-gray-600">
            Last updated: {new Date(monitoringData.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.healthScore}%</div>
            <Progress value={systemHealth.healthScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.uptimeFormatted}</div>
            <p className="text-xs text-gray-600">System running time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-gray-600">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.successRate}%</div>
            <p className="text-xs text-gray-600">Error rate: {systemHealth.errorRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics ({monitoringData.performance.period})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600">Total Requests</div>
              <div className="text-2xl font-bold">{monitoringData.performance.totalRequests}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Avg Response Time</div>
              <div className="text-2xl font-bold">{monitoringData.performance.averageResponseTime}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Errors</div>
              <div className="text-2xl font-bold text-red-600">{monitoringData.performance.errorCount}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">{monitoringData.performance.successRate}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Top Endpoints</div>
            <div className="space-y-2">
              {monitoringData.performance.topEndpoints.map((endpoint, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-mono">{endpoint.endpoint}</span>
                  <Badge variant="secondary">{endpoint.count} requests</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Business Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600">Total Users</div>
              <div className="text-2xl font-bold">{monitoringData.business.totalUsers.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Messages</div>
              <div className="text-2xl font-bold">{monitoringData.business.totalMessages.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Active Stakes</div>
              <div className="text-2xl font-bold">{monitoringData.business.activeStakes.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">File Uploads</div>
              <div className="text-2xl font-bold">{monitoringData.business.fileUploads.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Analysis */}
      {monitoringData.errors.totalErrors > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Error Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-600 mb-2">Error Breakdown</div>
              <div className="space-y-2">
                {monitoringData.errors.errorBreakdown.map((error, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">HTTP {error.status}</span>
                    <Badge variant="destructive">{error.count} errors</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Recent Errors</div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {monitoringData.errors.recentErrors.map((error, index) => (
                  <div key={index} className="text-xs p-2 bg-red-50 rounded">
                    <div className="font-medium text-red-800">
                      {error.method} {error.endpoint} - {error.statusCode}
                    </div>
                    <div className="text-red-600">{error.error}</div>
                    <div className="text-gray-500">{new Date(error.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MonitoringDashboard;
