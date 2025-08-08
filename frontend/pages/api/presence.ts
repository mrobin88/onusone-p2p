import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '../../lib/kv-wrapper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, action } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const timestamp = new Date().toISOString();
    
    if (action === 'heartbeat') {
      // Update user's last seen timestamp
      await kv.hset(`presence:${userId}`, {
        lastSeen: timestamp,
        status: 'online'
      });
      
      // Increment online count
      await kv.incrby('presence:online_count', 1);
    }
    
    res.status(200).json({
      success: true,
      timestamp
    });
  } catch (error) {
    console.error('Presence update error:', error);
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString()
    });
  }
}