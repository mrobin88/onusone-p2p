import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const now = Date.now();

      // Get all unlocked time capsules (timestamp <= now)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('board_slug', 'time-capsules')
        .lte('timestamp', now)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Failed to fetch unlocked time capsules' });
      }

      // Filter to only show time capsules (not regular messages)
      const timeCapsules = (data || []).filter(msg => 
        msg.metadata && msg.metadata.type === 'time-capsule'
      );

      res.status(200).json({ 
        timeCapsules,
        message: 'Unlocked time capsules fetched successfully',
        count: timeCapsules.length
      });

    } catch (error) {
      console.error('Error fetching unlocked time capsules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
