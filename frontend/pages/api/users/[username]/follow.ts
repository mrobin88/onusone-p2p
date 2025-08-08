
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { kv } from '@vercel/kv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session || !session.user?.name) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { username: usernameToFollow } = req.query;
  const currentUsername = session.user.name;

  if (typeof usernameToFollow !== 'string') {
    return res.status(400).json({ error: 'Invalid username' });
  }
  
  if (currentUsername === usernameToFollow) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  const followingSetKey = `user:${currentUsername}:following`;
  const followersSetKey = `user:${usernameToFollow}:followers`;

  try {
    const isFollowing = await kv.sismember(followingSetKey, usernameToFollow);

    if (req.method === 'POST') { // Follow
      if (isFollowing) {
        return res.status(409).json({ message: 'Already following' });
      }
      await kv.sadd(followingSetKey, usernameToFollow);
      await kv.sadd(followersSetKey, currentUsername);
      return res.status(200).json({ message: `Successfully followed ${usernameToFollow}` });

    } else if (req.method === 'DELETE') { // Unfollow
      if (!isFollowing) {
        return res.status(409).json({ message: 'Not following' });
      }
      await kv.srem(followingSetKey, usernameToFollow);
      await kv.srem(followersSetKey, currentUsername);
      return res.status(200).json({ message: `Successfully unfollowed ${usernameToFollow}` });

    } else {
      res.setHeader('Allow', ['POST', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

