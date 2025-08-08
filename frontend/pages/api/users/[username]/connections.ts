
import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { username } = req.query;

  if (typeof username !== 'string') {
    return res.status(400).json({ error: 'Invalid username' });
  }

  try {
    const followingKey = `user:${username}:following`;
    const followersKey = `user:${username}:followers`;

    const pipeline = kv.pipeline();
    pipeline.smembers(followingKey);
    pipeline.smembers(followersKey);

    const [following, followers] = await pipeline.exec<[string[], string[]]>();

    return res.status(200).json({ following, followers });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

