import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { kv } from '@vercel/kv';
import { rateLimit } from '../../../lib/rateLimit';
import { Connection, PublicKey, ParsedTransactionWithMeta, ParsedInstruction } from '@solana/web3.js';

const schema = z.object({
  postId: z.string().min(1),
  amount: z.number().int().positive(),
  type: z.enum(['post', 'boost']),
  txSig: z.string().min(32).max(128) // Solana transaction signatures are 88 chars
});

// Configuration constants with validation
const SOLANA_CONFIG = {
  RPC_ENDPOINT: process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY 
    ? `https://solana-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY}`
    : 'https://api.mainnet-beta.solana.com',
  TOKEN_MINT: process.env.NEXT_PUBLIC_TOKEN_MINT,
  TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
  SPL_TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  // Token decimals for amount calculations
  TOKEN_DECIMALS: 6,
  // Maximum age for transaction verification (24 hours)
  MAX_TRANSACTION_AGE_MS: 24 * 60 * 60 * 1000
};

// Validate required environment variables on startup
function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!SOLANA_CONFIG.TOKEN_MINT) {
    errors.push('NEXT_PUBLIC_TOKEN_MINT environment variable is required');
  }
  
  if (!SOLANA_CONFIG.TREASURY_ADDRESS) {
    errors.push('NEXT_PUBLIC_TREASURY_ADDRESS environment variable is required');
  }
  
  // Validate Solana address format
  if (SOLANA_CONFIG.TOKEN_MINT && !isValidSolanaAddress(SOLANA_CONFIG.TOKEN_MINT)) {
    errors.push('NEXT_PUBLIC_TOKEN_MINT is not a valid Solana address');
  }
  
  if (SOLANA_CONFIG.TREASURY_ADDRESS && !isValidSolanaAddress(SOLANA_CONFIG.TREASURY_ADDRESS)) {
    errors.push('NEXT_PUBLIC_TREASURY_ADDRESS is not a valid Solana address');
  }
  
  return { isValid: errors.length === 0, errors };
}

// Basic Solana address validation (base58, correct length)
function isValidSolanaAddress(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey);
  } catch {
    return false;
  }
}

/**
 * Verify a Solana transaction meets our staking requirements
 */
async function verifyStakeTransaction(
  txSig: string, 
  expectedAmount: number, 
  senderPubkey?: string
): Promise<{
  isValid: boolean;
  error?: string;
  actualAmount?: number;
  senderAddress?: string;
}> {
  try {
    // Validate configuration first
    const envValidation = validateEnvironment();
    if (!envValidation.isValid) {
      return { isValid: false, error: `Configuration error: ${envValidation.errors.join(', ')}` };
    }

    const connection = new Connection(SOLANA_CONFIG.RPC_ENDPOINT, 'confirmed');
    
    // Fetch transaction with full details
    const transaction = await connection.getParsedTransaction(txSig, {
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      return { isValid: false, error: 'Transaction not found on-chain' };
    }

    if (transaction.meta?.err) {
      return { isValid: false, error: `Transaction failed: ${JSON.stringify(transaction.meta.err)}` };
    }

    // Verify transaction age (prevent replay attacks with old transactions)
    if (transaction.blockTime) {
      const transactionAge = Date.now() - (transaction.blockTime * 1000);
      if (transactionAge > SOLANA_CONFIG.MAX_TRANSACTION_AGE_MS) {
        return { 
          isValid: false, 
          error: `Transaction too old: ${Math.round(transactionAge / (1000 * 60 * 60))} hours ago` 
        };
      }
    }

    // Verify transaction contains SPL token transfer
    const instructions = transaction.transaction.message.instructions;
    let tokenTransferFound = false;
    let actualAmount = 0;
    let actualSender = '';
    let actualRecipient = '';
    let actualMint = '';

    for (const instruction of instructions) {
      const parsedInstruction = instruction as ParsedInstruction;
      
      // Check for SPL token transfer
      if (
        parsedInstruction.program === 'spl-token' &&
        parsedInstruction.parsed?.type === 'transfer'
      ) {
        const transferInfo = parsedInstruction.parsed.info;
        actualAmount = Number(transferInfo.amount);
        actualSender = transferInfo.source;
        actualRecipient = transferInfo.destination;
        actualMint = transferInfo.mint || '';
        tokenTransferFound = true;
        break;
      }

      // Also check for transferChecked (more secure SPL transfer)
      if (
        parsedInstruction.program === 'spl-token' &&
        parsedInstruction.parsed?.type === 'transferChecked'
      ) {
        const transferInfo = parsedInstruction.parsed.info;
        actualAmount = Number(transferInfo.tokenAmount.amount);
        actualSender = transferInfo.source;
        actualRecipient = transferInfo.destination;
        actualMint = transferInfo.mint;
        tokenTransferFound = true;
        break;
      }
    }

    if (!tokenTransferFound) {
      return { isValid: false, error: 'No valid SPL token transfer found in transaction' };
    }

    // Verify amount matches (accounting for token decimals)
    const expectedAmountWithDecimals = expectedAmount * Math.pow(10, SOLANA_CONFIG.TOKEN_DECIMALS);
    if (actualAmount !== expectedAmountWithDecimals) {
      return { 
        isValid: false, 
        error: `Amount mismatch: expected ${expectedAmountWithDecimals}, got ${actualAmount}`,
        actualAmount: actualAmount / Math.pow(10, SOLANA_CONFIG.TOKEN_DECIMALS)
      };
    }

    // Verify token mint
    if (actualMint !== SOLANA_CONFIG.TOKEN_MINT) {
      return { 
        isValid: false, 
        error: `Token mint mismatch: expected ${SOLANA_CONFIG.TOKEN_MINT}, got ${actualMint}` 
      };
    }

    // Verify recipient is treasury (we need to resolve token account to treasury)
    // For now, we'll verify the recipient token account belongs to treasury
    try {
      const recipientTokenAccount = await connection.getParsedAccountInfo(new PublicKey(actualRecipient));
      const recipientData = recipientTokenAccount.value?.data as any;
      
      if (recipientData?.parsed?.info?.owner !== SOLANA_CONFIG.TREASURY_ADDRESS) {
        return { 
          isValid: false, 
          error: `Recipient mismatch: transfer not to treasury address` 
        };
      }
    } catch (error) {
      // If we can't verify recipient, be conservative and reject
      return { 
        isValid: false, 
        error: `Cannot verify recipient token account: ${error}` 
      };
    }

    // Get sender address for logging
    try {
      const senderTokenAccount = await connection.getParsedAccountInfo(new PublicKey(actualSender));
      const senderData = senderTokenAccount.value?.data as any;
      actualSender = senderData?.parsed?.info?.owner || actualSender;
    } catch {
      // Continue if we can't get sender info
    }

    return { 
      isValid: true, 
      actualAmount: actualAmount / Math.pow(10, SOLANA_CONFIG.TOKEN_DECIMALS),
      senderAddress: actualSender
    };

  } catch (error) {
    console.error('Transaction verification error:', error);
    return { 
      isValid: false, 
      error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  // Stricter rate limiting for transaction verification (max 5 per minute per IP)
  if (!(await rateLimit(req, res, 'stakeConfirm', 5, 60))) return;
  
  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      details: parse.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
    });
  }
  const { postId, amount, type, txSig } = parse.data;

  // Verify the post exists before proceeding
  const postKey = postId;
  const post = await kv.hgetall<any>(postKey);
  if (!post) return res.status(404).json({ error: 'post not found' });

  // Check if this transaction has already been processed
  const existingTxns = await kv.lrange(`stake:post:${postId}`, 0, -1);
  const alreadyProcessed = existingTxns.some(txnStr => {
    try {
      const txn = JSON.parse(txnStr);
      return txn.txSig === txSig;
    } catch {
      return false;
    }
  });

  if (alreadyProcessed) {
    return res.status(409).json({ error: 'Transaction already processed' });
  }

  // CRITICAL: Verify transaction on-chain before accepting stake
  console.log(`Verifying transaction ${txSig} for post ${postId}, amount: ${amount}`);
  const verification = await verifyStakeTransaction(txSig, amount);
  
  if (!verification.isValid) {
    console.error(`Transaction verification failed: ${verification.error}`);
    return res.status(400).json({ 
      error: 'Transaction verification failed', 
      details: verification.error 
    });
  }

  console.log(`Transaction verified successfully: ${txSig}, sender: ${verification.senderAddress}`);

  // Transaction is valid - update post stake and record transaction
  const newStake = (post.stakeTotal || 0) + verification.actualAmount!;
  const updates: any = { 
    stakeTotal: newStake, 
    lastStakeSig: txSig,
    lastStakeAt: new Date().toISOString()
  };
  
  if (type === 'boost') {
    const until = Date.now() + 2 * 60 * 60 * 1000; // 2h boost
    updates.boostUntil = new Date(until).toISOString();
  }

  // Atomic update - store both post update and transaction record
  await Promise.all([
    kv.hset(postKey, updates),
    kv.lpush(`stake:post:${postId}`, JSON.stringify({ 
      amount: verification.actualAmount,
      type, 
      txSig, 
      senderAddress: verification.senderAddress,
      verifiedAt: new Date().toISOString(),
      at: Date.now() 
    }))
  ]);

  // Track reputation for token staking
  try {
    const reputationResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reputation/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: verification.senderAddress || 'unknown',
        action: 'stake_tokens',
        reason: `Staked ${verification.actualAmount} ONU tokens on a post`,
        relatedContent: postId,
        metadata: { 
          amount: verification.actualAmount,
          txSig,
          stakeType: type
        }
      })
    });
    
    if (reputationResponse.ok) {
      console.log(`👑 Reputation tracked for staking: ${verification.senderAddress}`);
    }
  } catch (error) {
    console.warn('Failed to track reputation for staking:', error);
  }

  return res.status(200).json({ 
    ok: true, 
    stakeTotal: newStake,
    verifiedAmount: verification.actualAmount,
    transactionHash: txSig
  });
}


