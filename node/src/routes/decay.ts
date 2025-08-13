/**
 * Decay System API Endpoints
 * Handles token burning and decay score updates
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

/**
 * Manual token burn trigger
 * POST /api/decay/burn-tokens
 */
router.post('/burn-tokens', async (req, res) => {
  try {
    console.log('🔥 Manual token burn triggered');
    
    // Get messages that need burning (very low decay scores)
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .lt('decayscore', 10)
      .eq('isdeleted', false);
    
    if (error) throw error;
    
    let totalBurned = 0;
    const burnEvents: any[] = [];
    
    for (const message of messages || []) {
      // Simulate token burning logic
      const burnAmount = message.stakeamount || 0;
      totalBurned += burnAmount;
      
      // Mark message as burned
      await supabase
        .from('messages')
        .update({ 
          isdeleted: true,
          metadata: { ...message.metadata, burned_at: new Date().toISOString() }
        })
        .eq('id', message.id);
      
      burnEvents.push({
        messageId: message.id,
        burnAmount,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`🔥 Burned ${totalBurned} tokens from ${messages?.length || 0} messages`);
    
    res.json({
      success: true,
      totalBurned,
      burnEvents,
      postsProcessed: messages?.length || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Token burn failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Manual decay score update trigger
 * POST /api/decay/sweep
 */
router.post('/sweep', async (req, res) => {
  try {
    console.log('🔄 Manual decay score update triggered');
    
    // Get all active messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('isdeleted', false);
    
    if (error) throw error;
    
    let postsUpdated = 0;
    
    for (const message of messages || []) {
      // Calculate new decay score based on age and stakes
      const ageHours = (Date.now() - message.timestamp) / (1000 * 60 * 60);
      const stakeMultiplier = (message.totalstakes || 0) > 0 ? 0.5 : 1.0;
      
      const newDecayScore = Math.max(1, 100 - (ageHours * stakeMultiplier));
      
      if (newDecayScore !== message.decayscore) {
        await supabase
          .from('messages')
          .update({ decayscore: newDecayScore })
          .eq('id', message.id);
        
        postsUpdated++;
      }
    }
    
    console.log(`🔄 Updated decay scores for ${postsUpdated} messages`);
    
    res.json({
      success: true,
      postsUpdated,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Decay score update failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Get decay system status
 * GET /api/decay/status
 */
router.get('/status', async (req, res) => {
  try {
    // Get decay statistics
    const { data: messages, error } = await supabase
      .from('messages')
      .select('decayscore, stakeamount, totalstakes, timestamp')
      .eq('isdeleted', false);
    
    if (error) throw error;
    
    const now = Date.now();
    const decayStats = {
      totalMessages: messages?.length || 0,
      averageDecayScore: 0,
      lowDecayMessages: 0,
      highStakeMessages: 0,
      recentActivity: 0
    };
    
    if (messages && messages.length > 0) {
      const totalDecay = messages.reduce((sum, msg) => sum + (msg.decayscore || 100), 0);
      decayStats.averageDecayScore = Math.round(totalDecay / messages.length);
      
      decayStats.lowDecayMessages = messages.filter(msg => (msg.decayscore || 100) < 50).length;
      decayStats.highStakeMessages = messages.filter(msg => (msg.totalstakes || 0) > 100).length;
      decayStats.recentActivity = messages.filter(msg => (now - msg.timestamp) < 24 * 60 * 60 * 1000).length;
    }
    
    res.json({
      success: true,
      decayStats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to get decay status:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
