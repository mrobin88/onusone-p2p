import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { kv } from '@vercel/kv';
import { rateLimit } from '../../../lib/rateLimit';

const schema = z.object({
  postId: z.string().min(1),
  amount: z.number().int().positive(),
  type: z.enum(['post', 'boost']),
  txSig: z.string().min(32)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!(await rateLimit(req, res, 'stakeConfirm', 30, 60))) return;
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid input' });
  const { postId, amount, type, txSig } = parse.data;

  // TODO: verify txSig on-chain matches transfer to treasury for correct mint/amount
  // For MVP: accept and record to KV.
  const postKey = postId;
  const post = await kv.hgetall<any>(postKey);
  if (!post) return res.status(404).json({ error: 'post not found' });

  const newStake = (post.stakeTotal || 0) + amount;
  const updates: any = { stakeTotal: newStake, lastStakeSig: txSig };
  if (type === 'boost') {
    const until = Date.now() + 2 * 60 * 60 * 1000; // 2h boost
    updates.boostUntil = new Date(until).toISOString();
  }
  await kv.hset(postKey, updates);
  await kv.lpush(`stake:post:${postId}`, JSON.stringify({ amount, type, txSig, at: Date.now() }));

  return res.status(200).json({ ok: true, stakeTotal: newStake });
}


