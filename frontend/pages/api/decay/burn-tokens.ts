import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import { Connection, PublicKey, Transaction, sendAndConfirmTransaction, Keypair } from '@solana/web3.js';
import { createBurnInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { rateLimit } from '../../../lib/rateLimit';

// Token burning configuration
const BURN_CONFIG = {
  // Decay thresholds for token burning
  BURN_THRESHOLD_1: 75,  // Burn 10% of stake when decay drops to 75
  BURN_THRESHOLD_2: 50,  // Burn 25% of stake when decay drops to 50  
  BURN_THRESHOLD_3: 25,  // Burn 50% of stake when decay drops to 25
  BURN_THRESHOLD_4: 0,   // Burn remaining stake when content fully decays

  // Burn percentages at each threshold
  BURN_PERCENTAGES: [10, 25, 50, 100],
  
  // Token configuration
  TOKEN_MINT: process.env.NEXT_PUBLIC_TOKEN_MINT,
  TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
  
  // Solana configuration
  RPC_ENDPOINT: process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY 
    ? `https://solana-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY}`
    : 'https://api.mainnet-beta.solana.com',
    
  // Burn transaction settings
  MAX_BATCH_SIZE: 10,     // Maximum posts to process per call
  MIN_BURN_AMOUNT: 1,     // Minimum tokens worth burning (avoid dust)
  TOKEN_DECIMALS: 6       // ONU token decimals
};

interface PostDecayData {
  id: string;
  stakeTotal: number;
  decayScore: number;
  createdAt: string;
  engagements: number;
  lastBurnCheck?: string;
  burnedTotal?: number;
  burnHistory?: BurnRecord[];
}

interface BurnRecord {
  timestamp: string;
  decayScore: number;
  burnedAmount: number;
  burnPercentage: number;
  remainingStake: number;
  txSig?: string;
}

/**
 * Calculate current decay score using the same algorithm as the sweep endpoint
 */
function calculateDecayScore(post: PostDecayData): number {
  const created = new Date(post.createdAt).getTime();
  const hours = Math.max(0, (Date.now() - created) / 36e5); // Hours since creation
  const lambda = 8; // Decay rate: 8 points/hour
  const engagement = Number(post.engagements || 0);
  const stakeTotal = Number(post.stakeTotal || 0);
  
  // Stake provides logarithmic boost to prevent immediate decay
  const stakeBoost = Math.log10(1 + stakeTotal) * 10;
  
  // Calculate raw score
  const raw = 100 - lambda * hours + engagement * 2 + stakeBoost;
  
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Determine if tokens should be burned based on decay thresholds
 */
function calculateBurnAmount(post: PostDecayData): {
  shouldBurn: boolean;
  burnAmount: number;
  burnPercentage: number;
  threshold: number;
} {
  const currentDecayScore = calculateDecayScore(post);
  const currentStake = post.stakeTotal - (post.burnedTotal || 0);
  
  // Determine which threshold we've crossed
  let burnPercentage = 0;
  let threshold = 0;
  
  if (currentDecayScore <= 0) {
    burnPercentage = 100; // Burn everything
    threshold = BURN_CONFIG.BURN_THRESHOLD_4;
  } else if (currentDecayScore <= 25) {
    burnPercentage = 50;
    threshold = BURN_CONFIG.BURN_THRESHOLD_3;
  } else if (currentDecayScore <= 50) {
    burnPercentage = 25;
    threshold = BURN_CONFIG.BURN_THRESHOLD_2;
  } else if (currentDecayScore <= 75) {
    burnPercentage = 10;
    threshold = BURN_CONFIG.BURN_THRESHOLD_1;
  }
  
  // Check if we've already burned at this threshold
  const burnHistory = post.burnHistory || [];
  const alreadyBurnedAtThreshold = burnHistory.some(
    record => record.burnPercentage >= burnPercentage
  );
  
  if (alreadyBurnedAtThreshold) {
    return { shouldBurn: false, burnAmount: 0, burnPercentage: 0, threshold };
  }
  
  // Calculate burn amount based on original stake percentage
  const burnAmount = Math.floor((post.stakeTotal * burnPercentage) / 100);
  
  return {
    shouldBurn: burnAmount >= BURN_CONFIG.MIN_BURN_AMOUNT && currentStake > 0,
    burnAmount: Math.min(burnAmount, currentStake), // Don't burn more than available
    burnPercentage,
    threshold
  };
}

/**
 * Execute token burn transaction on Solana
 */
async function executeBurnTransaction(burnAmount: number): Promise<{
  success: boolean;
  txSig?: string;
  error?: string;
}> {
  try {
    // Check if we're in production mode with real burning enabled
    const ENABLE_REAL_BURNS = process.env.ENABLE_REAL_TOKEN_BURNS === 'true';
    
    if (!ENABLE_REAL_BURNS) {
      // Simulation mode for development/testing
      console.log(`🔥 SIMULATED TOKEN BURN: ${burnAmount} ONU tokens`);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate fake transaction signature for tracking
      const fakeTxSig = `burn_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        txSig: fakeTxSig
      };
    }

    // REAL TOKEN BURNING (Production mode)
    console.log(`🔥 EXECUTING REAL TOKEN BURN: ${burnAmount} ONU tokens`);
    
    if (!BURN_CONFIG.TOKEN_MINT || !BURN_CONFIG.TREASURY_ADDRESS) {
      return { success: false, error: 'Missing token configuration' };
    }

    // Import Solana dependencies dynamically for server-side usage
    const { Connection, PublicKey, Transaction, Keypair, sendAndConfirmTransaction } = 
      await import('@solana/web3.js');
    const { createBurnInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = 
      await import('@solana/spl-token');

    const connection = new Connection(BURN_CONFIG.RPC_ENDPOINT);
    const treasuryPubkey = new PublicKey(BURN_CONFIG.TREASURY_ADDRESS);
    const mintPubkey = new PublicKey(BURN_CONFIG.TOKEN_MINT);

    // Get treasury's token account
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      treasuryPubkey,
      false,
      TOKEN_PROGRAM_ID
    );

    // Create burn instruction
    const burnAmountWithDecimals = BigInt(burnAmount * Math.pow(10, BURN_CONFIG.TOKEN_DECIMALS));
    const burnInstruction = createBurnInstruction(
      treasuryTokenAccount, // token account
      mintPubkey, // mint
      treasuryPubkey, // owner
      burnAmountWithDecimals, // amount
      [], // multiSigners
      TOKEN_PROGRAM_ID
    );

    // Create transaction
    const transaction = new Transaction().add(burnInstruction);

    // Get treasury private key from environment
    const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY;
    if (!treasuryPrivateKey) {
      return { success: false, error: 'Treasury private key not configured' };
    }

    let treasuryKeypair: Keypair;
    try {
      // Parse private key (expecting base64 or array format)
      if (treasuryPrivateKey.startsWith('[')) {
        // Array format: [1,2,3,...]
        const keyArray = JSON.parse(treasuryPrivateKey);
        treasuryKeypair = Keypair.fromSecretKey(Uint8Array.from(keyArray));
      } else {
        // Base64 format
        treasuryKeypair = Keypair.fromSecretKey(
          Buffer.from(treasuryPrivateKey, 'base64')
        );
      }
    } catch (error) {
      return { success: false, error: 'Invalid treasury private key format' };
    }

    // Send and confirm transaction
    const txSig = await sendAndConfirmTransaction(
      connection,
      transaction,
      [treasuryKeypair],
      {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      }
    );

    console.log(`✅ REAL TOKEN BURN COMPLETED: ${burnAmount} ONU tokens, txSig: ${txSig}`);

    return { success: true, txSig };
    
  } catch (error) {
    console.error('Burn transaction failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Process token burns for decayed content
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Rate limiting for burn operations
  if (!(await rateLimit(req, res, 'tokenBurn', 2, 300))) return; // Max 2 per 5 minutes
  
  try {
    // Get all boards to scan for posts
    const boards = ['general', 'technology', 'community', 'p2p-development', 'reputation'];
    const burnResults: any[] = [];
    let totalBurned = 0;
    let postsProcessed = 0;
    
    for (const boardType of boards) {
      const boardKey = `board:${boardType}`;
      const postIds = await kv.lrange(boardKey, 0, BURN_CONFIG.MAX_BATCH_SIZE - 1);
      
      for (const postId of postIds) {
        if (postsProcessed >= BURN_CONFIG.MAX_BATCH_SIZE) break;
        
        // Get post data
        const post = await kv.hgetall<PostDecayData>(postId);
        if (!post || !post.stakeTotal || post.stakeTotal <= 0) continue;
        
        // Check if tokens should be burned
        const burnCalculation = calculateBurnAmount(post);
        
        if (burnCalculation.shouldBurn) {
          console.log(`🔥 Processing burn for post ${postId}: ${burnCalculation.burnAmount} ONU (${burnCalculation.burnPercentage}%)`);
          
          // Execute burn transaction
          const burnResult = await executeBurnTransaction(burnCalculation.burnAmount);
          
          if (burnResult.success) {
            // Update post with burn record
            const burnRecord: BurnRecord = {
              timestamp: new Date().toISOString(),
              decayScore: calculateDecayScore(post),
              burnedAmount: burnCalculation.burnAmount,
              burnPercentage: burnCalculation.burnPercentage,
              remainingStake: (post.stakeTotal - (post.burnedTotal || 0)) - burnCalculation.burnAmount,
              txSig: burnResult.txSig
            };
            
            const updatedBurnHistory = [...(post.burnHistory || []), burnRecord];
            const updatedBurnedTotal = (post.burnedTotal || 0) + burnCalculation.burnAmount;
            
            // Save updated post data
            await kv.hset(postId, {
              burnedTotal: updatedBurnedTotal,
              burnHistory: JSON.stringify(updatedBurnHistory),
              lastBurnCheck: new Date().toISOString()
            });
            
            // Record burn in global stats
            await kv.hincrby('global:token_stats', 'totalBurned', burnCalculation.burnAmount);
            await kv.hincrby('global:token_stats', 'burnEvents', 1);
            
            burnResults.push({
              postId,
              burnAmount: burnCalculation.burnAmount,
              burnPercentage: burnCalculation.burnPercentage,
              decayScore: burnRecord.decayScore,
              txSig: burnResult.txSig,
              success: true
            });
            
            totalBurned += burnCalculation.burnAmount;
          } else {
            burnResults.push({
              postId,
              burnAmount: burnCalculation.burnAmount,
              error: burnResult.error,
              success: false
            });
          }
        }
        
        postsProcessed++;
      }
    }
    
    // Update global burn statistics
    if (totalBurned > 0) {
      await kv.hset('global:burn_summary', {
        lastBurnRun: new Date().toISOString(),
        lastBurnAmount: totalBurned,
        postsProcessed
      });
    }
    
    console.log(`🔥 Burn sweep completed: ${totalBurned} ONU burned across ${burnResults.length} posts`);
    
    return res.status(200).json({
      success: true,
      totalBurned,
      postsProcessed,
      burnEvents: burnResults.length,
      burnResults: burnResults.slice(0, 5), // Return first 5 for debugging
      summary: {
        message: `Burned ${totalBurned} ONU tokens from ${burnResults.length} decayed posts`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Token burn sweep failed:', error);
    return res.status(500).json({
      error: 'Token burn sweep failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Export burn calculation for testing
export { calculateBurnAmount, calculateDecayScore };
