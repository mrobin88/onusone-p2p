import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import CleanNavbar from '../components/CleanNavbar';
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
    <>
      <Head>
        <title>Time Capsules</title>
      </Head>
      <CleanNavbar />
      <main className="container mx-auto px-4 py-8">
        <section className="max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl font-bold mb-4">Create Time Capsule</h1>
          <div className="card p-4">
            <textarea
              className="w-full p-3 border rounded mb-3 text-black"
              rows={4}
              placeholder="Write a message to your future self..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-sm mb-1">Unlock in (minutes)</label>
                <input className="w-full p-2 border rounded text-black" type="number" min={1} value={unlockIn} onChange={(e) => setUnlockIn(parseInt(e.target.value || '0', 10))} />
              </div>
              <div>
                <label className="block text-sm mb-1">Cost (ONU)</label>
                <input className="w-full p-2 border rounded text-black" type="number" min={0} value={cost} onChange={(e) => setCost(parseFloat(e.target.value || '0'))} />
              </div>
            </div>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            <button disabled={creating} onClick={createCapsule} className="btn btn-primary">
              {creating ? 'Creating...' : 'Create Time Capsule'}
            </button>
          </div>
        </section>

        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Unlocked Capsules</h2>
          <div className="grid gap-4">
            {unlocked.length === 0 && <div className="card p-4">No unlocked capsules yet.</div>}
            {unlocked.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="text-sm text-secondary mb-2">By {c.author}</div>
                <div className="whitespace-pre-wrap mb-2">{c.content}</div>
                <div className="text-xs text-secondary">Unlocked at: {new Date((c.metadata?.unlockAt || c.timestamp)).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}


