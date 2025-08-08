import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import { z } from 'zod';
import { rateLimit } from '../../lib/rateLimit';

const postSchema = z.object({
  content: z.string().min(1).max(2000),
  boardType: z.string().min(1).max(64),
  authorId: z.string().min(1).max(128).optional(),
  authorPubkey: z.string().max(64).optional(),
  stake: z.number().int().nonnegative().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return getPosts(req, res);
  if (req.method === 'POST') return createPost(req, res);
  return res.status(405).json({ error: 'Method Not Allowed' });
}

async function getPosts(req: NextApiRequest, res: NextApiResponse) {
  const board = (req.query.board as string) || '';
  if (!board) return res.status(400).json({ error: 'board required' });
  const key = `board:${board}`;
  const ids = await kv.lrange<string>(key, 0, 99);
  if (ids.length === 0) return res.status(200).json([]);
  const pipe = kv.pipeline();
  ids.forEach((id) => pipe.hgetall(id));
  const posts = await pipe.exec<any>();
  // filter closed
  const filtered = posts.filter((p) => p && p.status !== 'closed');
  // sort by createdAt desc
  filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.status(200).json(filtered);
}

async function createPost(req: NextApiRequest, res: NextApiResponse) {
  if (!(await rateLimit(req, res, 'createPost', 10, 60))) return;
  const parse = postSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid post' });
  const body = parse.data;

  const id = `post:${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const post = {
    id,
    content: body.content,
    boardType: body.boardType,
    authorId: body.authorId || 'anon',
    authorPubkey: body.authorPubkey || '',
    createdAt: new Date().toISOString(),
    engagements: 0,
    stakeTotal: body.stake || 0,
    status: 'open',
  };

  await kv.hset(id, post as any);
  await kv.lpush(`board:${body.boardType}`, id);
  return res.status(200).json(post);
}


