import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Button from '../../components/Button';

interface SystemHealth {
  storage: {
    used: number;
    keys: number;
    health: string;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
  };
  data: {
    users: number;
    posts: number;
    actions: number;
  };
}

interface MigrationResult {
  success: boolean;
  migratedKeys: number;
  optimizedKeys: number;
  removedKeys: number;
  errors: string[];
  summary: Record<string, number>;
}

export default function DatabaseMonitor() {
  const router = useRouter();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch system health on load
  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/system-health');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data.health);
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  const executeOperation = async (operation: string) => {
    if (!process.env.NEXT_PUBLIC_ADMIN_MODE) {
      alert('Admin operations are disabled in production');
      return;
    }

    try {
      setLoading(true);
      setActiveOperation(operation);
      setError(null);

      const response = await fetch('/api/admin/database-migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`
        },
        body: JSON.stringify({ operation })
      });

      if (!response.ok) {
        throw new Error(`Operation failed: ${response.statusText}`);
      }

      const result = await response.json();
      setMigrationResult(result.result);
      
      // Refresh system health after operation
      setTimeout(fetchSystemHealth, 1000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Operation failed');
    } finally {
      setLoading(false);
      setActiveOperation(null);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'slow': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <>
      <Head>
        <title>Database Monitor - OnusOne Admin</title>
        <meta name="description" content="Database monitoring and optimization dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">🗄️ Database Monitor</h1>
              <p className="text-gray-400">Monitor and optimize the unified data architecture</p>
            </div>
            <Button
              onClick={() => router.push('/admin')}
              variant="secondary"
            >
              ← Back to Admin
            </Button>
          </div>

          {/* System Health Overview */}
          {systemHealth && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">💾</span>
                  Storage Health
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Keys:</span>
                    <span className="font-semibold">{formatNumber(systemHealth.storage.keys)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Health Status:</span>
                    <span className={`font-semibold ${getHealthColor(systemHealth.storage.health)}`}>
                      {systemHealth.storage.health.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">⚡</span>
                  Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Response:</span>
                    <span className="font-semibold">{systemHealth.performance.avgResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Error Rate:</span>
                    <span className={`font-semibold ${systemHealth.performance.errorRate > 5 ? 'text-red-400' : 'text-green-400'}`}>
                      {systemHealth.performance.errorRate}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Data Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Users:</span>
                    <span className="font-semibold text-blue-400">{formatNumber(systemHealth.data.users)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Posts:</span>
                    <span className="font-semibold text-green-400">{formatNumber(systemHealth.data.posts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Actions:</span>
                    <span className="font-semibold text-purple-400">{formatNumber(systemHealth.data.actions)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database Operations */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Database Operations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => executeOperation('analyze')}
                disabled={loading}
                variant="secondary"
                className="h-24 flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-2">📊</span>
                <span>Analyze Structure</span>
              </Button>

              <Button
                onClick={() => executeOperation('migrate')}
                disabled={loading}
                variant="primary"
                className="h-24 flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-2">🔄</span>
                <span>Migrate Data</span>
              </Button>

              <Button
                onClick={() => executeOperation('optimize')}
                disabled={loading}
                variant="secondary"
                className="h-24 flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-2">⚡</span>
                <span>Optimize</span>
              </Button>

              <Button
                onClick={() => executeOperation('cleanup')}
                disabled={loading}
                variant="secondary"
                className="h-24 flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-2">🧹</span>
                <span>Cleanup</span>
              </Button>
            </div>

            {loading && (
              <div className="mt-6 p-4 bg-blue-900/50 border border-blue-700 rounded">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  <span>Executing {activeOperation}...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          {/* Migration Results */}
          {migrationResult && (
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6">Operation Results</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{migrationResult.migratedKeys}</div>
                  <div className="text-sm text-gray-400">Migrated Keys</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{migrationResult.optimizedKeys}</div>
                  <div className="text-sm text-gray-400">Optimized Keys</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{migrationResult.removedKeys}</div>
                  <div className="text-sm text-gray-400">Removed Keys</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${migrationResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {migrationResult.success ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-400">Status</div>
                </div>
              </div>

              {/* Detailed Summary */}
              {Object.keys(migrationResult.summary).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Detailed Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(migrationResult.summary).map(([key, value]) => (
                      <div key={key} className="bg-gray-700 rounded p-3">
                        <div className="text-sm text-gray-400 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {typeof value === 'number' ? formatNumber(value) : value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {migrationResult.errors.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 text-red-400">Errors</h3>
                  <div className="space-y-2">
                    {migrationResult.errors.map((error, index) => (
                      <div key={index} className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data Architecture Overview */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Optimized Data Architecture</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4 text-green-400">✅ Unified Storage (Vercel KV)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">User Profiles:</span>
                    <span>user:{'{userId}'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Posts:</span>
                    <span>post:{'{postId}'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reputation:</span>
                    <span>reputation:user:{'{userId}'}:profile</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Leaderboard:</span>
                    <span>reputation:leaderboard</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Board Index:</span>
                    <span>board:{'{boardName}'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4 text-red-400">❌ Removed Complexity</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>• Django/PostgreSQL references</div>
                  <div>• Dual storage patterns</div>
                  <div>• Inconsistent key naming</div>
                  <div>• Orphaned data structures</div>
                  <div>• Unused IPFS implementations</div>
                  <div>• Local SQLite confusion</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-900/50 border border-blue-700 rounded">
              <h4 className="font-semibold text-blue-400 mb-2">Performance Benefits</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Faster Queries</div>
                  <div className="text-gray-400">Optimized key patterns and indexes</div>
                </div>
                <div>
                  <div className="font-medium">Consistent Structure</div>
                  <div className="text-gray-400">Unified data access patterns</div>
                </div>
                <div>
                  <div className="font-medium">Reduced Complexity</div>
                  <div className="text-gray-400">Single storage system with clear conventions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
