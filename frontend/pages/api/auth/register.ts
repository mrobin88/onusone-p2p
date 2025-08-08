// pages/api/auth/register.ts
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { kv } from '@vercel/kv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, email, password, walletAddress } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUserKey = `user:${username.toLowerCase()}`;
    const existingUser = await kv.hgetall(existingUserKey);
    
    if (existingUser && Object.keys(existingUser).length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Check if email already exists
    const existingEmailKey = `email:${email.toLowerCase()}`;
    const existingEmail = await kv.get(existingEmailKey);
    
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userData = {
      id: userId,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      walletAddress: walletAddress || null,
      createdAt: new Date().toISOString(),
      reputationScore: 0,
      isActive: true
    };

    // Store user data
    await kv.hset(existingUserKey, userData);
    await kv.set(existingEmailKey, userId);

    // Store wallet address mapping if provided
    if (walletAddress) {
      await kv.set(`wallet:${walletAddress.toLowerCase()}`, userId);
    }

    // Return user data (without password)
    const { passwordHash: _, ...userResponse } = userData;
    
    return res.status(201).json({
      message: 'User registered successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


