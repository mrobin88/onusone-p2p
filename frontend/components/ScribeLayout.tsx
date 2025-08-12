/**
 * 90s Neo-Noir Horse Track Casino Layout
 * Checkered patterns, green casino feels, dancing skeletons
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
        const response = await fetch('https://onusone-p2p.onrender.com/api/dashboard/stats');
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
    <div className="min-h-screen concrete-bg dirty-overlay">

      {/* Industrial Header */}
      <header className="industrial-header p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-3xl font-bold industrial-text text-rust hover:text-rust-light transition-colors">
              ONUSONE
            </Link>
            <div className="flex items-center space-x-2">
              <span className="status-indicator status-online"></span>
              <span className="text-rust font-bold industrial-text">DASHBOARD</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <CompactWalletWidget />
            {isAuthenticated && user && (
              <>
                <Link href="/profile" className="btn-industrial px-4 py-2">
                  👤 {user.username}
                </Link>
                <button 
                  onClick={logout}
                  className="btn-industrial px-4 py-2"
                >
                  🚪 EXIT
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Industrial Sidebar */}
        <aside className="w-64 min-h-screen p-4 border-r-2 border-rust bg-concrete-darker">
          <div className="industrial-panel border-rusty p-4 mb-6">
            <h3 className="text-rust font-bold text-lg mb-3 industrial-text">
              📊 NETWORK STATS
            </h3>
            {loading ? (
              <div className="text-rust">Loading...</div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Messages:</span>
                  <span className="text-rust font-bold">{stats.totalMessages}</span>
                </div>
                <div className="flex justify-between">
                  <span>Boards:</span>
                  <span className="text-rust font-bold">{stats.totalBoards}</span>
                </div>
                <div className="flex justify-between">
                  <span>Users:</span>
                  <span className="text-rust font-bold">{stats.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-bold ${stats.backendStatus === 'online' ? 'text-rust' : 'text-metal'}`}>
                    {stats.backendStatus === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="industrial-panel border-rusty p-4">
            <h3 className="text-rust font-bold text-lg mb-3 industrial-text">
              BOARDS
            </h3>
            <nav className="space-y-2">
              {BOARDS.map((board) => (
                <Link
                  key={board.slug}
                  href={`/boards/${board.slug}`}
                  className={`block p-2 rounded transition-all duration-200 ${
                    currentBoard === board.slug
                      ? 'bg-rust text-concrete-darker font-bold'
                      : 'text-secondary hover:bg-rust/20 hover:text-rust'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{board.name}</span>
                    <span className="text-xs opacity-70">{board.category}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>

          {/* Industrial Network Info */}
          <div className="industrial-panel border-rusty p-4 mt-6 text-center">
            <div className="text-rust text-2xl mb-2">🏭</div>
            <div className="text-rust text-sm font-bold industrial-text">INDUSTRIAL P2P</div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="industrial-panel border-rusty p-6 min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
