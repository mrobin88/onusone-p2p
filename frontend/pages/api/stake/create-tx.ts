import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withSecurity, CommonSchemas } from '../../../lib/security';

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


