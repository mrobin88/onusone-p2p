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
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* 90s Style CSS */}
      <style jsx>{`
        .scribe-layout {
          background: 
            linear-gradient(45deg, #000 25%, transparent 25%),
            linear-gradient(-45deg, #000 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #000 75%),
            linear-gradient(-45deg, transparent 75%, #000 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          background-color: #0a0a0a;
        }
        
        .casino-header {
          background: linear-gradient(90deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
          border-bottom: 3px solid #00ff00;
          box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
        }
        
        .checkered-nav {
          background: 
            linear-gradient(45deg, #00ff00 25%, transparent 25%),
            linear-gradient(-45deg, #00ff00 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #00ff00 75%),
            linear-gradient(-45deg, transparent 75%, #00ff00 75%);
          background-size: 8px 8px;
          background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
          background-color: #0a0a0a;
        }
        
        .horse-track-border {
          border: 2px solid #00ff00;
          border-radius: 8px;
          background: linear-gradient(90deg, #0a0a0a, #1a1a1a, #0a0a0a);
          box-shadow: 
            inset 0 0 20px rgba(0, 255, 0, 0.2),
            0 0 20px rgba(0, 255, 0, 0.3);
        }
        
        .dancing-skeleton {
          animation: dance 2s infinite;
        }
        
        @keyframes dance {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(5deg) scale(1.1); }
          50% { transform: rotate(0deg) scale(1); }
          75% { transform: rotate(-5deg) scale(0.9); }
        }
        
        .neon-glow {
          text-shadow: 
            0 0 5px #00ff00,
            0 0 10px #00ff00,
            0 0 15px #00ff00,
            0 0 20px #00ff00;
        }
        
        .casino-button {
          background: linear-gradient(45deg, #00ff00, #00cc00);
          border: 2px solid #00ff00;
          color: #000;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          animation: breathing 3.5s ease-in-out infinite;
          transform-origin: center;
        }
        
        .casino-button:hover {
          background: linear-gradient(45deg, #00cc00, #00ff00);
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
          transform: translateY(-2px) scale(1.02);
          animation: breathing-hover 3.5s ease-in-out infinite;
        }
        
        @keyframes breathing {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
          }
          50% { 
            transform: scale(1.02);
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
          }
        }
        
        @keyframes breathing-hover {
          0%, 100% { 
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
          }
          50% { 
            transform: translateY(-2px) scale(1.04);
            box-shadow: 0 0 25px rgba(0, 255, 0, 1);
          }
        }
      `}</style>

      {/* Compact Wallet Widget */}
      <CompactWalletWidget />
      
      {/* 90s Casino Header */}
      <header className="casino-header p-4 border-b-2 border-green-400">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-3xl font-bold neon-glow text-green-400 hover:text-green-300 transition-colors">
              ONUSONE
            </Link>
            <div className="flex items-center space-x-2">
              <span className="dancing-skeleton text-2xl">💀</span>
              <span className="text-green-400 font-bold">DASHBOARD</span>
              <span className="dancing-skeleton text-2xl">💀</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && user && (
              <>
                <Link href="/profile" className="casino-button px-4 py-2 rounded">
                  👤 {user.username}
                </Link>
                <button 
                  onClick={logout}
                  className="casino-button px-4 py-2 rounded"
                >
                  🚪 EXIT
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 90s Checkered Sidebar */}
        <aside className="checkered-nav w-64 min-h-screen p-4 border-r-2 border-green-400">
          <div className="horse-track-border p-4 mb-6">
            <h3 className="text-green-400 font-bold text-lg mb-3 neon-glow">
              🎰 NETWORK STATS 🎰
            </h3>
            {loading ? (
              <div className="text-green-400">Loading...</div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Messages:</span>
                  <span className="text-green-300 font-bold">{stats.totalMessages}</span>
                </div>
                <div className="flex justify-between">
                  <span>Boards:</span>
                  <span className="text-green-300 font-bold">{stats.totalBoards}</span>
                </div>
                <div className="flex justify-between">
                  <span>Users:</span>
                  <span className="text-green-300 font-bold">{stats.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-bold ${stats.backendStatus === 'online' ? 'text-green-300' : 'text-red-400'}`}>
                    {stats.backendStatus === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="horse-track-border p-4">
            <h3 className="text-green-400 font-bold text-lg mb-3 neon-glow">
              BOARDS
            </h3>
            <nav className="space-y-2">
              {BOARDS.map((board) => (
                <Link
                  key={board.slug}
                  href={`/boards/${board.slug}`}
                  className={`block p-2 rounded transition-all duration-200 ${
                    currentBoard === board.slug
                      ? 'bg-green-400 text-black font-bold'
                      : 'text-green-300 hover:bg-green-400/20 hover:text-green-200'
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

          {/* Skull Animation Section */}
          <div className="horse-track-border p-4 mt-6 text-center">
            <div className="dancing-skeleton text-4xl mb-2">💀</div>
            <div className="text-green-400 text-sm font-bold">tickels</div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="horse-track-border p-6 min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
