import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import ScribeLayout from '../components/ScribeLayout';
import { useWalletAuth } from '../components/WalletAuth';

type Capsule = {
  id: string;
  content: string;
  author: string;
  authorwallet: string;
  metadata?: { isTimeCapsule?: boolean; unlockAt?: number; cost?: number };
  timestamp: number;
};

export default function CapsulesPage() {
  const { user, isAuthenticated } = useWalletAuth();
  const [content, setContent] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [unlockIn, setUnlockIn] = useState<number>(30); // minutes
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<Capsule[]>([]);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8888', []);

  const loadUnlocked = async () => {
    try {
      const res = await fetch(`${apiBase}/api/time-capsules/unlocked`);
      const data = await res.json();
      setUnlocked(data.timeCapsules || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadUnlocked(); }, []);

  const createCapsule = async () => {
    if (!isAuthenticated || !user?.walletAddress) {
      setError('Connect wallet first');
      return;
    }
    if (!content.trim()) {
      setError('Message required');
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const unlockAt = Date.now() + unlockIn * 60 * 1000;
      const res = await fetch(`${apiBase}/api/time-capsules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, authorwallet: user.walletAddress, unlockAt, cost })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to create time capsule');
        return;
      }
      setContent('');
      await loadUnlocked();
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScribeLayout>
      <Head>
        <title>Time Capsules - OnusOne</title>
        <meta name="description" content="Create and unlock time capsules with ONU tokens" />
      </Head>
      
      <div className="gaming-chat-container">
        <div className="chat-header">
          <div className="chat-title">
            <h2 className="text-xl font-bold text-white">⏰ Time Capsules</h2>
            <span className="text-sm text-gray-400">Send messages to the future</span>
          </div>
        </div>

        <div className="message-composer">
          <div className="composer-header">
            <div className="user-info">
              <div className="user-avatar">
                {user?.username?.slice(0, 2).toUpperCase() || '??'}
              </div>
              <div className="user-details">
                <span className="username">{user?.username || 'Anonymous'}</span>
                <span className="reputation text-green-400">
                  💰 {user?.totalPosts || 0} posts
                </span>
              </div>
            </div>
          </div>
          
          <div className="composer-input">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a message to your future self..."
              className="message-textarea"
              rows={4}
              disabled={creating}
            />
            
            <div className="composer-actions">
              <div className="input-info">
                <span className="text-xs text-gray-400">
                  {content.length}/500 characters
                </span>
              </div>
              
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Unlock in:</label>
                  <input 
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                    type="number" 
                    min={1} 
                    value={unlockIn} 
                    onChange={(e) => setUnlockIn(parseInt(e.target.value || '30', 10))} 
                  />
                  <span className="text-xs text-gray-400">min</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Cost:</label>
                  <input 
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-20"
                    type="number" 
                    min={0} 
                    value={cost} 
                    onChange={(e) => setCost(parseFloat(e.target.value || '0'))} 
                  />
                  <span className="text-xs text-gray-400">ONU</span>
                </div>
              </div>
              
              <button
                disabled={!isAuthenticated || creating || !content.trim()}
                onClick={createCapsule}
                className="submit-btn"
              >
                {creating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>⏰ Creating...</span>
                  </div>
                ) : (
                  '⏰ Create Time Capsule'
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="messages-container">
          <div className="messages-list">
            {unlocked.length > 0 ? (
              unlocked.map((c) => (
                <div key={c.id} className="message-item">
                  <div className="message-header">
                    <div className="message-author">
                      <div className="author-avatar">
                        {c.author.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="author-info">
                        <span className="author-name">{c.author}</span>
                        <span className="author-reputation text-green-400">
                          💰 Time Traveler
                        </span>
                      </div>
                    </div>
                    <div className="message-meta">
                      <span className="timestamp">
                        {new Date((c.metadata?.unlockAt || c.timestamp)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="message-content">
                    {c.content}
                  </div>
                  <div className="message-stats">
                    <span className="stat-item">
                      ⏰ Unlocked at: {new Date((c.metadata?.unlockAt || c.timestamp)).toLocaleString()}
                    </span>
                    {c.metadata?.cost && (
                      <span className="stat-item">
                        💰 Cost: {c.metadata.cost} ONU
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon animate-bounce">⏰</div>
                <h3 className="empty-title">No Time Capsules Yet</h3>
                <p className="empty-description">
                  Be the first to create a time capsule and send a message to the future!
                </p>
                {!isAuthenticated && (
                  <button
                    onClick={() => window.location.href = '/auth/login'}
                    className="start-conversation-btn"
                  >
                    🔐 Connect Wallet to Start
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ScribeLayout>
  );
}


