import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const result: Record<string, any> = {
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    KV_URL: !!process.env.KV_URL,
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    kvConnectivity: 'unknown'
  };

  try {
    // Attempt a harmless read to validate KV credentials
    await kv.get('health:noop');
    result.kvConnectivity = 'ok';
  } catch (e: any) {
    result.kvConnectivity = `error: ${e?.message || 'unknown'}`;
  }

  res.status(200).json(result);
}


