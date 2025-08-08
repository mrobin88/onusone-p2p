import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '../../lib/kv-wrapper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get active users count from mock storage
    const activeUsers = await kv.get('presence:active_count') || 0;
    const onlineUsers = await kv.get('presence:online_count') || 1; // At least current user
    
    res.status(200).json({
      active: Math.max(activeUsers, 1),
      online: Math.max(onlineUsers, 1),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Presence count error:', error);
    res.status(200).json({
      active: 1,
      online: 1,
      timestamp: new Date().toISOString()
    });
  }
}