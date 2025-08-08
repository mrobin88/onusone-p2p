import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useLocalAuth } from '../../components/LocalAuth';
import Button from '../../components/Button';

interface SecurityEvent {
  timestamp: string;
  ip: string;
  userAgent: string;
  operation: string;
  reason: string;
}

interface RateLimitStats {
  operation: string;
  requests: number;
  windowSeconds: number;
  currentCount: number;
  remainingTime: number;
}

interface SecurityStats {
  totalRequests: number;
  blockedRequests: number;
  suspiciousActivity: number;
  topIPs: Array<{ ip: string; count: number }>;
  topOperations: Array<{ operation: string; count: number }>;
}

export default function SecurityMonitor() {
  const { user, isAuthenticated } = useLocalAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [rateLimitStats, setRateLimitStats] = useState<RateLimitStats[]>([]);
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Note: In a real implementation, these endpoints would be secured with admin authentication
      const [eventsRes, statsRes] = await Promise.all([
        fetch('/api/admin/security/events'),
        fetch('/api/admin/security/stats')
      ]);

      if (eventsRes.ok) {
        const events = await eventsRes.json();
        setSecurityEvents(events);
      }

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setSecurityStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSecurityData();
      const interval = setInterval(fetchSecurityData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const getEventSeverity = (reason: string) => {
    if (reason.includes('High request frequency') || reason.includes('Bot')) {
      return 'bg-red-600 text-white';
    }
    if (reason.includes('Suspicious') || reason.includes('Empty user agent')) {
      return 'bg-orange-600 text-white';
    }
    return 'bg-yellow-600 text-white';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-4">Admin access required for security monitoring</p>
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Security Monitor - OnusOne P2P</title>
        <meta name="description" content="Security monitoring dashboard" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold">🛡️ Security Monitor</h1>
              <div className="flex space-x-4">
                <Link href="/admin/decay-debug">
                  <Button variant="secondary" size="sm">🔍 Decay Debug</Button>
                </Link>
                <Link href="/boards">
                  <Button variant="secondary" size="sm">← Back to Boards</Button>
                </Link>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-4">
              <Button 
                onClick={fetchSecurityData} 
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                {loading ? 'Loading...' : '🔄 Refresh'}
              </Button>
              <span className="text-sm text-gray-400">
                Auto-refresh every 30 seconds
              </span>
            </div>
          </div>

          {/* Security Statistics */}
          {securityStats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-sm text-gray-400 mb-1">Total Requests</h3>
                <p className="text-2xl font-bold text-blue-400">{securityStats.totalRequests.toLocaleString()}</p>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-sm text-gray-400 mb-1">Blocked</h3>
                <p className="text-2xl font-bold text-red-400">{securityStats.blockedRequests.toLocaleString()}</p>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-sm text-gray-400 mb-1">Suspicious</h3>
                <p className="text-2xl font-bold text-orange-400">{securityStats.suspiciousActivity.toLocaleString()}</p>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-sm text-gray-400 mb-1">Block Rate</h3>
                <p className="text-2xl font-bold text-yellow-400">
                  {securityStats.totalRequests > 0 
                    ? ((securityStats.blockedRequests / securityStats.totalRequests) * 100).toFixed(1) + '%'
                    : '0%'
                  }
                </p>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-sm text-gray-400 mb-1">Status</h3>
                <p className="text-2xl font-bold text-green-400">🛡️ ACTIVE</p>
              </div>
            </div>
          )}

          {/* Rate Limiting Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">⚡ Rate Limiting Rules</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Login Attempts</span>
                  <span className="text-orange-400 font-medium">5 per 5 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Post Creation</span>
                  <span className="text-blue-400 font-medium">10 per 5 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Engagements</span>
                  <span className="text-green-400 font-medium">30 per minute</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stake Confirm</span>
                  <span className="text-red-400 font-medium">5 per minute</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Data Fetches</span>
                  <span className="text-purple-400 font-medium">100 per minute</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">🔍 Detection Rules</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bot Detection</span>
                  <span className="text-green-400 font-medium">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Automated Tools</span>
                  <span className="text-green-400 font-medium">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">High Frequency</span>
                  <span className="text-green-400 font-medium">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Input Validation</span>
                  <span className="text-green-400 font-medium">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Security Headers</span>
                  <span className="text-green-400 font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Security Events */}
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">🚨 Recent Security Events</h3>
            
            {securityEvents.length > 0 ? (
              <div className="space-y-3">
                {securityEvents.slice(0, 20).map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-600">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getEventSeverity(event.reason)}`}>
                          {event.reason}
                        </span>
                        <span className="text-sm text-gray-400">Operation: {event.operation}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        IP: {event.ip} • UA: {event.userAgent.substring(0, 60)}...
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">{formatTime(event.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No security events detected</p>
                <p className="text-gray-500 text-sm mt-1">All systems operating normally</p>
              </div>
            )}
          </div>

          {/* Security Status */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              🛡️ OnusOne Security System - Protecting against abuse and attacks
            </p>
            <p className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
