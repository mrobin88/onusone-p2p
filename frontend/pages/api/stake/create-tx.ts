import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withSecurity, CommonSchemas } from '../../../lib/security';
import { sustainableTokenEconomics } from '../../../lib/token-economics';

const stakeCreationSchema = z.object({
  postId: z.string().min(1),
  amount: z.number().int().positive().max(1000000),
  type: z.enum(['post', 'boost']),
  userAddress: z.string().min(32).max(44) // Solana address
});

/**
 * Create stake transaction parameters for frontend
 * Returns transaction details for wallet to execute
 */
async function createStakeTransaction(req: NextApiRequest, res: NextApiResponse, validatedData: any) {
  try {
    const { postId, amount, type, userAddress } = validatedData;

    // Validate environment configuration
    const mint = process.env.NEXT_PUBLIC_TOKEN_MINT;
    const treasury = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
    
    if (!mint || !treasury) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Token mint or treasury address not configured'
      });
    }

    // Validate the post exists
    const { kv } = await import('@vercel/kv');
    const post = await kv.hgetall(postId);
    
    if (!post) {
      return res.status(404).json({ 
        error: 'Post not found',
        postId 
      });
    }

    // CRITICAL: Validate staking limits to prevent token depletion
    try {
      // Get user's current staking stats
      const userStakeKey = `user:${userAddress}:stakes`;
      const userStakes = await kv.hgetall(userStakeKey) || {};
      
      const userTotalStake = Object.values(userStakes).reduce((sum: number, stake: any) => 
        sum + (typeof stake === 'string' ? parseInt(stake) : stake), 0);
      
      // Get user's daily staking (reset daily)
      const today = new Date().toISOString().split('T')[0];
      const dailyStakeKey = `user:${userAddress}:daily_stake:${today}`;
      const userDailyStake = parseInt(await kv.get(dailyStakeKey) as string || '0');
      
      // Validate against economic limits
      const validation = sustainableTokenEconomics.validateStakeTransaction(
        userAddress,
        postId,
        amount,
        userTotalStake as number,
        userDailyStake
      );
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Staking limits exceeded',
          details: validation.errors,
          suggestedAmount: validation.adjustedAmount,
          limits: {
            maxPerPost: 1000,
            maxDaily: 5000,
            maxTotal: 50000,
            currentDaily: userDailyStake,
            currentTotal: userTotalStake
          }
        });
      }
      
      // Calculate efficiency and fees
      const { effectiveStake, efficiency, fee } = sustainableTokenEconomics.calculateStakeEfficiency(amount);
      
      console.log(`💰 Stake validation passed: ${amount} ONU → ${effectiveStake} effective (${(efficiency * 100).toFixed(1)}% efficiency, ${fee} ONU fee)`);
      
    } catch (error) {
      console.error('Staking validation failed:', error);
      return res.status(500).json({
        error: 'Staking validation failed',
        details: 'Unable to validate staking limits'
      });
    }

    // Calculate transaction fee estimate (approximate)
    const estimatedFee = 0.001; // ~0.001 SOL for SPL token transfers

    // Return transaction parameters for frontend to execute
    return res.status(200).json({
      success: true,
      transaction: {
        mint,
        treasury,
        amount,
        decimals: 6, // ONU token decimals
        postId,
        type,
        userAddress,
        estimatedFee,
        memo: `OnusOne Stake: ${type}:${postId}:${amount}`
      },
      instructions: {
        description: `Stake ${amount} ONU tokens on ${type}`,
        steps: [
          'Connect your Solana wallet',
          'Approve the transaction to transfer tokens',
          'Transaction will be verified on-chain',
          'Stake will be recorded and tokens locked'
        ]
      },
      validation: {
        minAmount: 1,
        maxAmount: 1000000,
        requiresApproval: true,
        networkFee: true
      }
    });

  } catch (error) {
    console.error('Stake transaction creation failed:', error);
    return res.status(500).json({
      error: 'Failed to create stake transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Apply security middleware and export
export default withSecurity('stakeConfirm', stakeCreationSchema)(createStakeTransaction);


