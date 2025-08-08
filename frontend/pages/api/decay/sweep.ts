import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

function computeScore(post: any): number {
  const created = new Date(post.createdAt).getTime();
  const hours = Math.max(0, (Date.now() - created) / 36e5);
  const lambda = 8; // points/hour
  const engagement = Number(post.engagements || 0);
  const stakeTotal = Number(post.stakeTotal || 0);
  const stakeBoost = Math.log10(1 + stakeTotal) * 10;
  const boostUntil = post.boostUntil ? new Date(post.boostUntil).getTime() : 0;
  const boostActive = boostUntil > Date.now() ? 20 : 0;
  const raw = 100 - lambda * hours + engagement * 2 + stakeBoost + boostActive;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Scan boards list (static for now)
  const boards = ['general','technology','community','p2p-development','reputation'];
  let closed = 0;
  for (const b of boards) {
    const ids = await kv.lrange<string>(`board:${b}`, 0, 199);
    if (!ids.length) continue;
    const pipe = kv.pipeline();
    ids.forEach((id) => pipe.hgetall(id));
    const posts = await pipe.exec<any>();
    for (const p of posts) {
      if (!p || p.status === 'closed') continue;
      const score = computeScore(p);
      if (score <= 15) {
        closed++;
        await kv.hset(p.id, { status: 'closed', closedAt: new Date().toISOString(), lastScore: score });
        await kv.lpush('ledger:closed', JSON.stringify({ id: p.id, board: b, at: Date.now(), score }));
      }
    }
  }
  return res.status(200).json({ closed });
}


