import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export async function rateLimit(req: NextApiRequest, res: NextApiResponse, key: string, limit = 30, windowSec = 60) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const k = `ratelimit:${key}:${ip}`;
  const count = await kv.incr(k);
  if (count === 1) await kv.expire(k, windowSec);
  if (count > limit) {
    res.status(429).json({ error: 'Too Many Requests' });
    return false;
  }
  return true;
}


