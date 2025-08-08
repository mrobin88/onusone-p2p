// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const { username, password, email } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const userKey = `user:${username.toLowerCase()}`;
    const existing = await kv.hgetall(userKey);
    if (existing && Object.keys(existing).length) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: `u_${Date.now()}`,
      username,
      email: email || '',
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await kv.hset(userKey, user as any);
    await kv.sadd('users:index', userKey);

    return res.status(200).json({ id: user.id, username: user.username, email: user.email });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'registration failed' });
  }
}


