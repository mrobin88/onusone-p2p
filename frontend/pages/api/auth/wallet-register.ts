/**
 * Auto-create user account for wallet addresses
 * Called when wallet connects for the first time
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '../../../lib/kv-wrapper';

interface WalletRegisterRequest {
  walletAddress: string;
  username?: string;
  autoCreated?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, username, autoCreated = false }: WalletRegisterRequest = req.body;

    // Validation
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // Create readable username from wallet if not provided
    const displayUsername = username || `User${walletAddress.slice(-6)}`;
    const userKey = `user:${walletAddress.toLowerCase()}`;

    // Check if wallet already has an account
    const existingUser = await kv.hgetall(userKey);
    if (existingUser && Object.keys(existingUser).length > 0) {
      return res.status(200).json({ 
        message: 'Account already exists',
        user: {
          id: existingUser.id,
          username: existingUser.username,
          walletAddress: existingUser.walletAddress
        }
      });
    }

    // Create new user account
    const userId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userData = {
      id: userId,
      username: displayUsername,
      walletAddress,
      email: `${walletAddress.slice(-8)}@wallet.onusone.network`, // Placeholder email
      passwordHash: walletAddress, // Use wallet address as "password" for wallet auth
      reputationScore: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
      autoCreated,
      authMethod: 'wallet'
    };

    // Store user data
    await kv.hset(userKey, userData);

    // Also store by username for lookup
    const usernameKey = `username:${displayUsername.toLowerCase()}`;
    await kv.set(usernameKey, walletAddress.toLowerCase());

    console.log(`✅ Auto-created wallet account: ${walletAddress.slice(0, 8)}... as ${displayUsername}`);

    res.status(201).json({
      success: true,
      message: 'Wallet account created successfully',
      user: {
        id: userId,
        username: displayUsername,
        walletAddress,
        reputationScore: 0
      }
    });

  } catch (error) {
    console.error('Wallet registration failed:', error);
    res.status(500).json({ 
      error: 'Failed to create wallet account',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}
