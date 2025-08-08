import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const scope = (req.query.board as string) || 'site';
    const setKey = `presence:set:${scope}`;
    const members = await kv.smembers<string[]>(setKey);
    if (!members || members.length === 0) return res.status(200).json({ active: 0 });

    // Filter only live keys (TTL exists)
    const pipe = kv.pipeline();
    members.forEach((m) => pipe.get(`presence:${scope}:${m}`));
    const vals = (await pipe.exec<(string | null)[]>()) as (string | null)[];
    const active = vals.filter((v) => !!v).length;
    return res.status(200).json({ active });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'presence count error' });
  }
}


