/**
 * KV Wrapper - Automatically uses mock storage if Vercel KV not configured
 * This allows local development without requiring Vercel KV setup
 */

let kvInstance: any = null;

async function getKV() {
  if (kvInstance) return kvInstance;

  // Check if Vercel KV environment variables are available
  const hasVercelKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

  if (hasVercelKV) {
    try {
      // Use real Vercel KV
      const { kv } = await import('@vercel/kv');
      kvInstance = kv;
      console.log('✅ Using Vercel KV for data storage');
    } catch (error) {
      console.warn('⚠️ Vercel KV failed, falling back to mock storage:', error);
      const { mockKV } = await import('./mock-storage');
      kvInstance = mockKV;
    }
  } else {
    // Use mock storage for local development
    const { mockKV } = await import('./mock-storage');
    kvInstance = mockKV;
    console.log('🔧 Using Mock Storage for local development');
    console.log('💡 To use real storage, set up Vercel KV environment variables');
  }

  return kvInstance;
}

// Export a wrapper that matches Vercel KV API
export const kv = {
  async hset(key: string, field: string | Record<string, any>, value?: any) {
    const kvClient = await getKV();
    return kvClient.hset(key, field, value);
  },

  async hget(key: string, field: string) {
    const kvClient = await getKV();
    return kvClient.hget(key, field);
  },

  async hgetall(key: string) {
    const kvClient = await getKV();
    return kvClient.hgetall(key);
  },

  async get(key: string) {
    const kvClient = await getKV();
    return kvClient.get(key);
  },

  async set(key: string, value: any, options?: any) {
    const kvClient = await getKV();
    return kvClient.set(key, value, options);
  },

  async hincrby(key: string, field: string, increment: number) {
    const kvClient = await getKV();
    return kvClient.hincrby(key, field, increment);
  },

  async incrby(key: string, increment: number) {
    const kvClient = await getKV();
    return kvClient.incrby(key, increment);
  },

  async lpush(key: string, ...values: any[]) {
    const kvClient = await getKV();
    return kvClient.lpush(key, ...values);
  },

  async lrange(key: string, start: number, stop: number) {
    const kvClient = await getKV();
    return kvClient.lrange(key, start, stop);
  },

  async ltrim(key: string, start: number, stop: number) {
    const kvClient = await getKV();
    return kvClient.ltrim(key, start, stop);
  },

  async llen(key: string) {
    const kvClient = await getKV();
    return kvClient.llen(key);
  },

  async zadd(key: string, scoreMembers: any) {
    const kvClient = await getKV();
    return kvClient.zadd(key, scoreMembers);
  },

  async zrange(key: string, start: number, stop: number, options?: any) {
    const kvClient = await getKV();
    return kvClient.zrange(key, start, stop, options);
  },

  async zrevrange(key: string, start: number, stop: number, options?: any) {
    const kvClient = await getKV();
    return kvClient.zrevrange(key, start, stop, options);
  },

  async zcard(key: string) {
    const kvClient = await getKV();
    return kvClient.zcard(key);
  },

  async zrevrank(key: string, member: string) {
    const kvClient = await getKV();
    return kvClient.zrevrank(key, member);
  },

  async zremrangebyrank(key: string, start: number, stop: number) {
    const kvClient = await getKV();
    return kvClient.zremrangebyrank(key, start, stop);
  },

  async smembers(key: string) {
    const kvClient = await getKV();
    return kvClient.smembers(key);
  },

  async sadd(key: string, ...members: string[]) {
    const kvClient = await getKV();
    return kvClient.sadd(key, ...members);
  },

  async keys(pattern: string) {
    const kvClient = await getKV();
    return kvClient.keys(pattern);
  },

  async del(key: string) {
    const kvClient = await getKV();
    return kvClient.del(key);
  },

  async exists(key: string) {
    const kvClient = await getKV();
    return kvClient.exists(key);
  },

  async expire(key: string, seconds: number) {
    const kvClient = await getKV();
    return kvClient.expire(key, seconds);
  },

  async ttl(key: string) {
    const kvClient = await getKV();
    return kvClient.ttl(key);
  }
};

export default kv;
