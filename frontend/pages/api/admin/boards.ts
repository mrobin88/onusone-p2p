import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '../../../lib/kv-wrapper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get board statistics
    const boards = [
      {
        id: 'general',
        name: 'General Discussion',
        description: 'Open discussions about anything',
        postCount: await kv.llen('board:general') || 0,
        activeUsers: 1
      },
      {
        id: 'tech',
        name: 'Technology',
        description: 'Tech discussions and innovation',
        postCount: await kv.llen('board:tech') || 0,
        activeUsers: 1
      },
      {
        id: 'crypto',
        name: 'Cryptocurrency',
        description: 'Blockchain and crypto discussions',
        postCount: await kv.llen('board:crypto') || 0,
        activeUsers: 1
      }
    ];
    
    res.status(200).json({
      boards,
      totalBoards: boards.length,
      totalPosts: boards.reduce((sum, board) => sum + board.postCount, 0)
    });
  } catch (error) {
    console.error('Board stats error:', error);
    res.status(200).json({
      boards: [],
      totalBoards: 0,
      totalPosts: 0
    });
  }
}
