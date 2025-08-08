import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { kv } from '@vercel/kv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Validate wallet address format (basic check)
    const walletRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!walletRegex.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Check if wallet is already linked to another account
    const existingWalletUserId = await kv.get(`wallet:${walletAddress.toLowerCase()}`);
    if (existingWalletUserId && existingWalletUserId !== session.user.id) {
      return res.status(409).json({ error: 'Wallet address already linked to another account' });
    }

    // Update user's wallet address
    const userKey = `user:${session.user.username}`;
    await kv.hset(userKey, { walletAddress: walletAddress.toLowerCase() });
    
    // Store wallet mapping
    await kv.set(`wallet:${walletAddress.toLowerCase()}`, session.user.id);

    return res.status(200).json({
      message: 'Wallet linked successfully',
      walletAddress: walletAddress.toLowerCase()
    });

  } catch (error) {
    console.error('Link wallet error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
