import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { content, authorwallet, unlockAt, cost } = req.body;

      if (!content || !authorwallet || !unlockAt) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create time capsule as a message with special metadata
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content,
          author: 'Anonymous', // Will be updated when user system is connected
          author_wallet: authorwallet,
          board_slug: 'time-capsules',
          ipfs_hash: null, // Will be added when IPFS is integrated
          stake_amount: cost || 0,
          timestamp: unlockAt,
          metadata: {
            type: 'time-capsule',
            unlockAt,
            cost,
            isLocked: true,
            createdAt: Date.now()
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Failed to create time capsule' });
      }

      res.status(201).json({ 
        success: true, 
        timeCapsule: data,
        message: 'Time capsule created successfully' 
      });

    } catch (error) {
      console.error('Error creating time capsule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
      // Get all time capsules for a user
      const { authorwallet } = req.query;

      if (!authorwallet) {
        return res.status(400).json({ error: 'Author wallet required' });
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('author_wallet', authorwallet)
        .eq('board_slug', 'time-capsules')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Failed to fetch time capsules' });
      }

      res.status(200).json({ 
        timeCapsules: data || [],
        message: 'Time capsules fetched successfully' 
      });

    } catch (error) {
      console.error('Error fetching time capsules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
