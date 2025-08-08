import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { rateLimit } from '../../../lib/rateLimit';

const schema = z.object({
  postId: z.string().min(1),
  amount: z.number().int().positive(),
  type: z.enum(['post', 'boost'])
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!(await rateLimit(req, res, 'stakeCreate', 20, 60))) return;
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid input' });

  // Placeholder: build an SPL token transfer transaction client-side recommendation
  // For now, return treasury address and mint so client can construct via wallet using wallet adapter.
  const mint = process.env.NEXT_PUBLIC_TOKEN_MINT;
  const treasury = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '';
  if (!mint || !treasury) return res.status(500).json({ error: 'missing mint/treasury env' });

  return res.status(200).json({
    mint,
    treasury,
    postId: parse.data.postId,
    amount: parse.data.amount,
    type: parse.data.type,
  });
}


