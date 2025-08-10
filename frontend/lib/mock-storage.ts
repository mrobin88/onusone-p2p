/**
 * Mock Storage System for Local Development
 * Simulates Vercel KV for testing without requiring external services
 */

interface MockData {
  [key: string]: any;
}

class MockKV {
  private data: MockData = {};
  private sortedSets: { [key: string]: { [member: string]: number } } = {};
  private lists: { [key: string]: any[] } = {};

  // Hash operations (hset, hget, hgetall)
  async hset(key: string, field: string | Record<string, any>, value?: any): Promise<number> {
    if (!this.data[key]) this.data[key] = {};
    
    if (typeof field === 'object') {
      // Multiple fields
      Object.assign(this.data[key], field);
      return Object.keys(field).length;
    } else {
      // Single field
      this.data[key][field] = value;
      return 1;
    }
  }

  async hget(key: string, field: string): Promise<any> {
    return this.data[key]?.[field] || null;
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    return this.data[key] || {};
  }

  // String operations (get, set)
  async get(key: string): Promise<any> {
    return this.data[key] || null;
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    this.data[key] = value;
    if (options?.ex) {
      // Simulate expiration (simplified)
      setTimeout(() => delete this.data[key], options.ex * 1000);
    }
  }

  // Number operations (hincrby, incrby)
  async hincrby(key: string, field: string, increment: number): Promise<number> {
    if (!this.data[key]) this.data[key] = {};
    const current = parseInt(this.data[key][field] || '0');
    this.data[key][field] = current + increment;
    return this.data[key][field];
  }

  async incrby(key: string, increment: number): Promise<number> {
    const current = parseInt(this.data[key] || '0');
    this.data[key] = current + increment;
    return this.data[key];
  }

  // List operations (lpush, lrange, ltrim)
  async lpush(key: string, ...values: any[]): Promise<number> {
    if (!this.lists[key]) this.lists[key] = [];
    this.lists[key].unshift(...values);
    return this.lists[key].length;
  }

  async lrange(key: string, start: number, stop: number): Promise<any[]> {
    if (!this.lists[key]) return [];
    if (stop === -1) stop = this.lists[key].length - 1;
    return this.lists[key].slice(start, stop + 1);
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    if (!this.lists[key]) return;
    if (stop === -1) stop = this.lists[key].length - 1;
    this.lists[key] = this.lists[key].slice(start, stop + 1);
  }

  async llen(key: string): Promise<number> {
    return this.lists[key]?.length || 0;
  }

  // Sorted set operations (zadd, zrange, zrevrange, etc.)
  async zadd(key: string, scoreMembers: { score: number; member: string } | { score: number; member: string }[]): Promise<number> {
    if (!this.sortedSets[key]) this.sortedSets[key] = {};
    
    const items = Array.isArray(scoreMembers) ? scoreMembers : [scoreMembers];
    let added = 0;
    
    for (const item of items) {
      if (!(item.member in this.sortedSets[key])) added++;
      this.sortedSets[key][item.member] = item.score;
    }
    
    return added;
  }

  async zrange(key: string, start: number, stop: number, options?: { withScores?: boolean }): Promise<any[]> {
    if (!this.sortedSets[key]) return [];
    
    const sorted = Object.entries(this.sortedSets[key])
      .sort(([, a], [, b]) => a - b)
      .slice(start, stop === -1 ? undefined : stop + 1);
    
    if (options?.withScores) {
      return sorted.flat();
    }
    return sorted.map(([member]) => member);
  }

  async zrevrange(key: string, start: number, stop: number, options?: { withScores?: boolean }): Promise<any[]> {
    if (!this.sortedSets[key]) return [];
    
    const sorted = Object.entries(this.sortedSets[key])
      .sort(([, a], [, b]) => b - a)
      .slice(start, stop === -1 ? undefined : stop + 1);
    
    if (options?.withScores) {
      return sorted.flat();
    }
    return sorted.map(([member]) => member);
  }

  async zcard(key: string): Promise<number> {
    return Object.keys(this.sortedSets[key] || {}).length;
  }

  async zrevrank(key: string, member: string): Promise<number | null> {
    if (!this.sortedSets[key]) return null;
    
    const sorted = Object.entries(this.sortedSets[key])
      .sort(([, a], [, b]) => b - a);
    
    const index = sorted.findIndex(([m]) => m === member);
    return index === -1 ? null : index;
  }

  async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    if (!this.sortedSets[key]) return 0;
    
    const sorted = Object.entries(this.sortedSets[key])
      .sort(([, a], [, b]) => a - b);
    
    const toRemove = sorted.slice(start, stop + 1);
    toRemove.forEach(([member]) => delete this.sortedSets[key][member]);
    
    return toRemove.length;
  }

  // Set operations
  async smembers(key: string): Promise<string[]> {
    const setData = this.data[key];
    if (Array.isArray(setData)) return setData;
    return [];
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.data[key]) this.data[key] = [];
    if (!Array.isArray(this.data[key])) this.data[key] = [];
    
    let added = 0;
    for (const member of members) {
      if (!this.data[key].includes(member)) {
        this.data[key].push(member);
        added++;
      }
    }
    return added;
  }

  // Utility operations
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return [
      ...Object.keys(this.data),
      ...Object.keys(this.lists),
      ...Object.keys(this.sortedSets)
    ].filter(key => regex.test(key));
  }

  async del(key: string): Promise<number> {
    let deleted = 0;
    if (key in this.data) {
      delete this.data[key];
      deleted++;
    }
    if (key in this.lists) {
      delete this.lists[key];
      deleted++;
    }
    if (key in this.sortedSets) {
      delete this.sortedSets[key];
      deleted++;
    }
    return deleted;
  }

  async exists(key: string): Promise<number> {
    return (key in this.data || key in this.lists || key in this.sortedSets) ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (await this.exists(key)) {
      setTimeout(() => this.del(key), seconds * 1000);
      return 1;
    }
    return 0;
  }

  async ttl(key: string): Promise<number> {
    // Simplified TTL implementation
    return await this.exists(key) ? -1 : -2;
  }

  async incr(key: string): Promise<number> {
    return this.incrby(key, 1);
  }

  // Mock pipeline for batch operations
  pipeline() {
    const operations: Array<() => Promise<any>> = [];
    
    return {
      hgetall: (key: string) => {
        operations.push(() => this.hgetall(key));
        return this;
      },
      exec: async () => {
        const results = [];
        for (const op of operations) {
          try {
            results.push(await op());
          } catch (error) {
            results.push(null);
          }
        }
        return results;
      }
    };
  }

  // Debug method
  debug(): void {
    console.log('MockKV Data:', {
      data: this.data,
      lists: this.lists,
      sortedSets: this.sortedSets
    });
  }
}

// Create global mock instance
const mockKV = new MockKV();

// Seed with some test data
const seedMockData = async () => {
  // Test user
  await mockKV.hset('user:test-user-123', {
    id: 'test-user-123',
    username: 'testuser',
    email: 'test@example.com',
    walletAddress: null,
    reputationScore: 100,
    createdAt: new Date().toISOString(),
    isActive: true
  });

  // Test reputation profile
  await mockKV.hset('reputation:user:test-user-123:profile', {
    userId: 'test-user-123',
    currentScore: 100,
    totalPoints: 0,
    rank: 'Newcomer',
    percentile: 50,
    actionsCount: 0,
    lastActivity: new Date().toISOString(),
    joinedDate: new Date().toISOString(),
    badges: JSON.stringify([]),
    stats: JSON.stringify({
      postsCreated: 0,
      postsLiked: 0,
      commentsCreated: 0,
      tokensStaked: 0,
      daysActive: 1,
      helpfulReplies: 0,
      contentFeatured: 0,
      flagsReceived: 0
    })
  });

  // Sample post
  await mockKV.hset('post:test-post-123', {
    id: 'post:test-post-123',
    content: 'Welcome to OnusOne P2P! This is a test post with the new sustainable economics.',
    boardType: 'general',
    authorId: 'test-user-123',
    createdAt: new Date().toISOString(),
    engagements: 5,
    stakeTotal: 0,
    burnedTotal: 0,
    decayScore: 95,
    isVisible: true,
    status: 'active'
  });

  // Add post to board
  await mockKV.lpush('board:general', 'post:test-post-123');

  console.log('🌱 Mock data seeded successfully');
};

// Initialize with test data
seedMockData();

export { mockKV };
export default mockKV;
