"use client";
import { useEffect } from 'react';
import { useWalletAuth } from './WalletAuth';

function getOrCreateAnonId(): string {
  try {
    const key = 'onusone_anon_id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return `anon_${Date.now()}`;
  }
}

export default function PresenceBeacon() {
  const { user } = useWalletAuth();

  useEffect(() => {
    let stopped = false;
    const userId = user?.id || getOrCreateAnonId();

    const beat = async () => {
      try {
        await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      } catch {}
    };

    // initial and interval
    beat();
    const t = setInterval(() => {
      if (!stopped) beat();
    }, 60_000);

    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [user]);

  return null;
}


