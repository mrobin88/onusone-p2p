/**
 * Modern Dashboard Layout
 * Real-time stats from backend systems
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWalletAuth } from './WalletAuth';
import CompactWalletWidget from './CompactWalletWidget';

interface ScribeLayoutProps {
  children: React.ReactNode;
  currentBoard?: string;
}

interface DashboardStats {
  totalMessages: number;
  totalBoards: number;
  activeUsers: number;
  backendStatus: 'online' | 'offline';
  lastUpdate: string;
}

const BOARDS = [
  { slug: 'general', name: '📋 General', category: 'Community' },
  { slug: 'technology', name: '💻 Technology', category: 'Discussion' },
  { slug: 'crypto', name: '₿ Crypto', category: 'Finance' },
  { slug: 'gaming', name: '🎮 Gaming', category: 'Entertainment' },
  { slug: 'art', name: '🎨 Art & Design', category: 'Creative' },
  { slug: 'music', name: '🎵 Music', category: 'Creative' },
  { slug: 'dev', name: '⚡ Development', category: 'Tech' },
  { slug: 'trading', name: '📈 Trading', category: 'Finance' }
];

export default function ScribeLayout({ children, currentBoard }: ScribeLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useWalletAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    totalBoards: 0,
    activeUsers: 0,
    backendStatus: 'offline',
    lastUpdate: 'Never'
  });
  const [loading, setLoading] = useState(true);

  // Fetch real stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Get dashboard stats from backend
        const response = await fetch('http://localhost:8888/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalMessages: data.totalMessages,
            totalBoards: data.totalBoards,
            activeUsers: data.activeUsers,
            backendStatus: 'online',
            lastUpdate: new Date().toLocaleTimeString()
          });
        } else {
          setStats(prev => ({ ...prev, backendStatus: 'offline' }));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setStats(prev => ({ ...prev, backendStatus: 'offline' }));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <div className="scribe-layout">
      {/* Compact Wallet Widget */}
      <CompactWalletWidget />
      
      {/* Header */}
      <header className="scribe-header">
        <div className="flex items-center space-x-6">
          <Link href="/" className="heading-2 text-accent-gold no-underline">
            OnusOne
          </Link>
          <span className="body-small text-text-ash">Dashboard</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated && user && (
            <>
              <Link href="/profile" className="btn-text">
                👤 {user.displayName}
              </Link>
              <span className="caption text-text-ash">
                {user.reputation || 0} rep • {user.totalPosts || 0} posts
              </span>
            </>
          )}
        </div>
      </header>

      {/* Sidebar - Navigation */}
      <aside className="scribe-sidebar">
        <div className="space-y-6">
          {/* Primary Navigation */}
          <div>
            <h3 className="heading-3 text-text-ash mb-4">Navigation</h3>
            <nav className="space-y-2">
              <Link href="/" className={`nav-item ${router.pathname === '/' ? 'active' : ''}`}>
                🏠 Home
              </Link>
              <Link href="/boards" className={`nav-item ${router.pathname === '/boards' ? 'active' : ''}`}>
                📋 All Boards
              </Link>
              <Link href="/profile" className={`nav-item ${router.pathname === '/profile' ? 'active' : ''}`}>
                👤 Profile
              </Link>
              <Link href="/become-node" className={`nav-item ${router.pathname === '/become-node' ? 'active' : ''}`}>
                💰 Become Node
              </Link>
            </nav>
          </div>

          {/* Real Network Stats */}
          <div>
            <h3 className="heading-3 text-text-ash mb-4">System Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-slate">Backend:</span>
                <span className={`status-${stats.backendStatus}`}>
                  ● {stats.backendStatus === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-slate">Boards:</span>
                <span className="text-text-ash">{stats.totalBoards} active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-slate">Messages:</span>
                <span className="text-text-ash">{stats.totalMessages} total</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-slate">Users:</span>
                <span className="text-text-ash">{stats.activeUsers} online</span>
              </div>
              <div className="text-xs text-text-slate mt-2">
                Updated: {stats.lastUpdate}
              </div>
            </div>
          </div>

          {/* User Stats */}
          {isAuthenticated && user && (
            <div>
              <h3 className="heading-3 text-text-ash mb-4">Your Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-slate">Reputation:</span>
                  <span className="text-accent-gold font-semibold">{user.reputation || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-slate">Posts:</span>
                  <span className="text-text-ash">{user.totalPosts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-slate">Staked:</span>
                  <span className="text-text-ash">{user.totalStaked || 0} ONU</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Channel List - Boards */}
      <aside className="scribe-channel-list">
        <div>
          <h3 className="heading-3 text-text-ash mb-4">Boards</h3>
          <nav className="space-y-1">
            {BOARDS.map((board) => (
              <Link
                key={board.slug}
                href={`/boards/${board.slug}`}
                className={`channel-item ${currentBoard === board.slug ? 'active' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span>{board.name}</span>
                  <span className="caption text-text-slate">{board.category}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 space-y-2">
          <button className="btn-secondary w-full text-sm">
            📝 Create Board
          </button>
          <button className="btn-secondary w-full text-sm">
            🔍 Search Messages
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="scribe-main-content">
        {children}
      </main>

      <style jsx>{`
        .nav-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          color: var(--text-ash);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all var(--animation-fast);
        }

        .nav-item:hover {
          background: rgba(212, 175, 55, 0.1);
          color: var(--accent-gold);
        }

        .nav-item.active {
          background: var(--accent-gold);
          color: var(--text-ink);
          font-weight: 600;
        }

        .channel-item {
          display: block;
          padding: 8px 12px;
          border-radius: 6px;
          color: var(--text-ash);
          text-decoration: none;
          font-size: 14px;
          transition: all var(--animation-fast);
        }

        .channel-item:hover {
          background: rgba(212, 175, 55, 0.1);
          color: var(--accent-gold);
        }

        .channel-item.active {
          background: rgba(212, 175, 55, 0.2);
          color: var(--accent-gold);
          font-weight: 600;
        }

        .status-online {
          color: #10b981;
        }

        .status-offline {
          color: #ef4444;
        }

        .text-accent-gold {
          color: var(--accent-gold);
        }

        .text-text-ash {
          color: var(--text-ash);
        }

        .text-text-slate {
          color: var(--text-slate);
        }
      `}</style>
    </div>
  );
}
