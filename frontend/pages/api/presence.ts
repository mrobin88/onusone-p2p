import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { userId, boardSlug } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const scope = boardSlug || 'site';
    const key = `presence:${scope}:${userId}`;
    // 5-minute TTL heartbeat
    await kv.set(key, Date.now().toString(), { ex: 300 });
    await kv.sadd(`presence:set:${scope}`, userId);
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'presence error' });
  }
}


