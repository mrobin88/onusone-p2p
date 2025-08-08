import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '../../lib/kv-wrapper';
import { withSecurity, CommonSchemas, SecurityManager, InputSanitizer } from '../../lib/security';
import { getDataLayer } from '../../lib/data-layer';

// Apply security middleware
const secureGetPosts = withSecurity('fetchPosts')(getPosts);
const secureCreatePost = withSecurity('createPost', CommonSchemas.createPost)(createPost);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return secureGetPosts(req, res);
  if (req.method === 'POST') return secureCreatePost(req, res);
  return res.status(405).json({ error: 'Method Not Allowed' });
}

// Decay configuration matching the burn system
const DECAY_CONFIG = {
  MINIMUM_VISIBLE_SCORE: 15, // Content below 15 points is hidden
  HOURS_TO_DECAY_THRESHOLD: 10 // Rough estimate for when content becomes invisible
};

/**
 * Calculate current decay score using same algorithm as burn system
 */
function calculateDecayScore(post: any): number {
  if (!post.createdAt) return 0;
  
  const created = new Date(post.createdAt).getTime();
  const hours = Math.max(0, (Date.now() - created) / 36e5); // Hours since creation
  const lambda = 8; // Decay rate: 8 points/hour (same as burn system)
  const engagement = Number(post.engagements || 0);
  const stakeTotal = Number(post.stakeTotal || 0);
  
  // Stake provides logarithmic boost to prevent immediate decay
  const stakeBoost = Math.log10(1 + stakeTotal) * 10;
  
  // Calculate raw score
  const raw = 100 - lambda * hours + engagement * 2 + stakeBoost;
  
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Check if post should be visible based on decay score
 */
function isPostVisible(post: any): boolean {
  const decayScore = calculateDecayScore(post);
  return decayScore >= DECAY_CONFIG.MINIMUM_VISIBLE_SCORE;
}

async function getPosts(req: NextApiRequest, res: NextApiResponse) {
  const board = (req.query.board as string) || '';
  const includeHidden = req.query.includeHidden === 'true'; // Admin/debug feature
  
  if (!board) return res.status(400).json({ error: 'board required' });
  
  const key = `board:${board}`;
  const ids = await kv.lrange<string>(key, 0, 99);
  if (ids.length === 0) return res.status(200).json([]);
  
  const pipe = kv.pipeline();
  ids.forEach((id) => pipe.hgetall(id));
  const posts = await pipe.exec<any>();
  
  // Calculate decay scores and filter posts
  const postsWithDecay = posts
    .filter((p) => p && p.status !== 'closed')
    .map((post) => {
      const decayScore = calculateDecayScore(post);
      return {
        ...post,
        decayScore,
        isVisible: decayScore >= DECAY_CONFIG.MINIMUM_VISIBLE_SCORE
      };
    });
  
  // Filter by visibility unless specifically requesting hidden content
  const visiblePosts = includeHidden 
    ? postsWithDecay 
    : postsWithDecay.filter(post => post.isVisible);
  
  // Sort by decay score first (most relevant), then by creation time
  visiblePosts.sort((a: any, b: any) => {
    if (a.decayScore !== b.decayScore) {
      return b.decayScore - a.decayScore; // Higher decay score first
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return res.status(200).json(visiblePosts);
}

async function createPost(req: NextApiRequest, res: NextApiResponse, validatedData: any) {
  // Data is already validated and sanitized by security middleware
  const { content, boardType, authorId, stake = 0 } = validatedData;
  
  // Additional sanitization for safety
  const sanitizedContent = InputSanitizer.sanitizeText(content);
  const sanitizedBoardType = boardType.toLowerCase().trim();
  const sanitizedAuthorId = authorId ? InputSanitizer.sanitizeUsername(authorId) : 'anon';

  // Generate secure post ID
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 9);
  const id = `post:${timestamp}-${randomPart}`;
  
  const postData = {
    id,
    content: sanitizedContent,
    boardType: sanitizedBoardType,
    authorId: sanitizedAuthorId,
    // Security metadata
    createdFrom: SecurityManager.getClientIP(req),
    userAgent: req.headers['user-agent']?.substring(0, 100) || 'unknown'
  };

  try {
    // Use unified data layer for optimized storage
    const dataLayer = getDataLayer();
    const success = await dataLayer.content.createPost(postData);
    
    if (!success) {
      throw new Error('Failed to store post in data layer');
    }
    
    // Update global stats with unified patterns
    await kv.hincrby('global:post_stats', 'total_posts', 1);
    await kv.hincrby('global:post_stats', `posts_in_${sanitizedBoardType}`, 1);
    
    // Record analytics event
    await dataLayer.analytics.recordEvent({
      type: 'post_created',
      userId: sanitizedAuthorId,
      data: { boardType: sanitizedBoardType }
    });
    
    // Track reputation for post creation
    try {
      const reputationResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reputation/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sanitizedAuthorId,
          action: 'post_create',
          reason: 'Created a new post',
          relatedContent: id,
          metadata: { boardType: sanitizedBoardType }
        })
      });
      
      if (reputationResponse.ok) {
        console.log(`👑 Reputation tracked for post creation: ${sanitizedAuthorId}`);
      }
    } catch (error) {
      console.warn('Failed to track reputation for post creation:', error);
    }

    console.log(`📝 Post created: ${id} in board ${sanitizedBoardType}`);
    
    return res.status(201).json({
      success: true,
      post: {
        id: postData.id,
        content: postData.content,
        boardType: postData.boardType,
        authorId: postData.authorId,
        createdAt: new Date().toISOString(),
        engagements: 0,
        stakeTotal: 0
      }
    });
    
  } catch (error) {
    console.error('Post creation failed:', error);
    return res.status(500).json({
      error: 'Failed to create post',
      details: 'Database operation failed'
    });
  }
}


