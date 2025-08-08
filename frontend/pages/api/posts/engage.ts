import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import { withSecurity, CommonSchemas, SecurityManager, InputSanitizer } from '../../../lib/security';

interface EngagementRequest {
  postId: string;
  type: 'like' | 'comment' | 'share';
  userId?: string;
}

/**
 * Handle post engagement (likes, comments, shares)
 * This boosts decay scores and prevents content from fading
 */
async function handleEngagement(req: NextApiRequest, res: NextApiResponse, validatedData: any) {
  // Data is already validated by security middleware
  
  try {
    const { postId, type = 'like', userId } = validatedData;
    
    // Additional sanitization
    const sanitizedPostId = InputSanitizer.sanitizeText(postId);
    const sanitizedUserId = userId ? InputSanitizer.sanitizeUsername(userId) : null;
    
    // Get current post data
    const post = await kv.hgetall(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Calculate engagement boost based on type
    const engagementBoosts = {
      like: 2,     // Small boost for likes
      comment: 5,  // Medium boost for comments
      share: 8     // Large boost for shares
    };
    
    const boost = engagementBoosts[type] || 2;
    const currentEngagements = Number(post.engagements || 0);
    const newEngagements = currentEngagements + 1;
    
    // Calculate new decay score with engagement boost
    const calculateDecayScore = (post: any): number => {
      const created = new Date(post.createdAt).getTime();
      const hours = Math.max(0, (Date.now() - created) / 36e5);
      const lambda = 8; // Decay rate: 8 points/hour
      const engagement = Number(newEngagements); // Use updated engagement count
      const stakeTotal = Number(post.stakeTotal || 0);
      const stakeBoost = Math.log10(1 + stakeTotal) * 10;
      const raw = 100 - lambda * hours + engagement * 2 + stakeBoost;
      return Math.max(0, Math.min(100, Math.round(raw)));
    };
    
    const newDecayScore = calculateDecayScore(post);
    
    // Update post with new engagement and decay score
    await kv.hset(postId, {
      engagements: newEngagements,
      decayScore: newDecayScore,
      lastEngagement: new Date().toISOString()
    });
    
    // Track engagement in global stats (optional)
    await kv.hincrby('global:engagement_stats', `${type}_count`, 1);
    await kv.hincrby('global:engagement_stats', 'total_engagements', 1);
    
    // Track reputation for engagement
    try {
      const actionMap: Record<string, string> = {
        'like': 'post_liked',
        'comment': 'comment_create', 
        'share': 'post_shared'
      };
      
      const reputationResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reputation/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          action: actionMap[type] || 'post_view',
          reason: `${type === 'like' ? 'Liked' : type === 'comment' ? 'Commented on' : 'Shared'} a post`,
          relatedContent: postId,
          metadata: { engagementType: type }
        })
      });
      
      if (reputationResponse.ok) {
        console.log(`👑 Reputation tracked for ${type}: ${userId}`);
      }
    } catch (error) {
      console.warn('Failed to track reputation for engagement:', error);
    }

    console.log(`📈 Engagement boost: Post ${postId.slice(-8)} +${boost} points (${type})`);
    
    return res.status(200).json({
      success: true,
      newEngagements,
      newDecayScore,
      boost,
      message: `Post received ${type} engagement (+${boost} decay points)`
    });
    
  } catch (error) {
    console.error('Engagement error:', error);
    return res.status(500).json({
      error: 'Failed to process engagement',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Apply security middleware and export
export default withSecurity('engage', CommonSchemas.engage)(handleEngagement);
