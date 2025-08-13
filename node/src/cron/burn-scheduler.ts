#!/usr/bin/env node

/**
 * Scheduled token burn job for Render
 * This script runs every hour via Render cron service
 * Handles token burning and decay score updates
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface BurnResult {
  totalBurned: number;
  burnEvents: any[];
  postsProcessed: number;
}

interface DecayResult {
  postsUpdated: number;
}

async function performTokenBurn(): Promise<BurnResult> {
  console.log('🔥 Starting token burn process...');
  
  try {
    // Get messages that need burning (example logic - adjust based on your needs)
               const { data: messages, error } = await supabase
             .from('messages')
             .select('*')
             .lt('decayscore', 10) // Burn messages with very low decay scores
             .eq('isdeleted', false);
    
    if (error) throw error;
    
    let totalBurned = 0;
    const burnEvents: any[] = [];
    
    for (const message of messages || []) {
      // Simulate token burning logic
      const burnAmount = message.stake_amount || 0;
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
    
    return {
      totalBurned,
      burnEvents,
      postsProcessed: messages?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Token burn failed:', error);
    throw error;
  }
}

async function updateDecayScores(): Promise<DecayResult> {
  console.log('🔄 Updating decay scores...');
  
  try {
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
      const stakeMultiplier = (message.total_stakes || 0) > 0 ? 0.5 : 1.0;
      
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
    
    return { postsUpdated };
    
  } catch (error) {
    console.error('❌ Decay score update failed:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting scheduled maintenance job...');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    // Perform token burning
    const burnResults = await performTokenBurn();
    
    // Update decay scores
    const decayResults = await updateDecayScores();
    
    console.log('✅ Scheduled maintenance completed successfully:', {
      burnResults,
      decayResults,
      nextScheduledRun: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Scheduled maintenance failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { main, performTokenBurn, updateDecayScores };
