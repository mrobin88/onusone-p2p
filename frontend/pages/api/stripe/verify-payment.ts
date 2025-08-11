/**
 * Stripe API: Verify payment and trigger ONU token delivery
 * REAL verification: Ensure payment completed before sending tokens
 */

import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError
} from '@solana/spl-token';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Treasury wallet keypair (server-side only)
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY; // Base58 encoded
const ONU_TOKEN_MINT = new PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT!);
const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

interface VerifyRequest {
  paymentIntentId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId }: VerifyRequest = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    // 1. Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Payment not completed', 
        status: paymentIntent.status 
      });
    }

    // 2. Extract metadata
    const onuAmount = parseFloat(paymentIntent.metadata.onu_amount);
    const walletAddress = paymentIntent.metadata.wallet_address;
    const usdAmount = paymentIntent.amount / 100; // Convert from cents

    if (!onuAmount || !walletAddress) {
      return res.status(400).json({ error: 'Invalid payment metadata' });
    }

    // 3. Send ONU tokens to user wallet
    const tokenDelivery = await sendONUTokens(walletAddress, onuAmount);

    // 4. Log successful delivery
    console.log(`ONU Tokens Delivered:`, {
      paymentIntentId,
      walletAddress,
      onuAmount,
      usdAmount,
      signature: tokenDelivery.signature,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      signature: tokenDelivery.signature,
      onuAmount,
      walletAddress,
      usdAmount
    });

  } catch (error) {
    console.error('Payment verification failed:', error);
    
    res.status(500).json({ 
      error: 'Token delivery failed',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}

/**
 * Send ONU tokens from treasury to user wallet
 */
async function sendONUTokens(
  userWalletAddress: string, 
  onuAmount: number
): Promise<{ signature: string }> {
  
  if (!TREASURY_PRIVATE_KEY) {
    throw new Error('Treasury private key not configured');
  }

  const connection = new Connection(SOLANA_RPC, 'confirmed');
  
  // Load treasury wallet
  const treasuryKeypair = Keypair.fromSecretKey(
    Buffer.from(TREASURY_PRIVATE_KEY, 'base64')
  );
  
  const userPublicKey = new PublicKey(userWalletAddress);
  
  // Get token accounts
  const treasuryTokenAccount = await getAssociatedTokenAddress(
    ONU_TOKEN_MINT, 
    treasuryKeypair.publicKey
  );
  
  const userTokenAccount = await getAssociatedTokenAddress(
    ONU_TOKEN_MINT, 
    userPublicKey
  );

  const transaction = new Transaction();

  // Check if user has token account, create if not
  try {
    await getAccount(connection, userTokenAccount);
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError) {
      // Create associated token account
      const createAccountInstruction = createAssociatedTokenAccountInstruction(
        treasuryKeypair.publicKey, // payer
        userTokenAccount,          // ata
        userPublicKey,             // owner
        ONU_TOKEN_MINT            // mint
      );
      transaction.add(createAccountInstruction);
    } else {
      throw error;
    }
  }

  // Create transfer instruction
  const transferInstruction = createTransferInstruction(
    treasuryTokenAccount,           // from
    userTokenAccount,               // to
    treasuryKeypair.publicKey,      // owner
    onuAmount * Math.pow(10, 9),    // amount (convert to token units)
    [],                             // multiSigners
    ONU_TOKEN_MINT                 // mint
  );
  
  transaction.add(transferInstruction);

  // Get recent blockhash and send transaction
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = treasuryKeypair.publicKey;

  // Sign and send
  transaction.sign(treasuryKeypair);
  
  const signature = await connection.sendRawTransaction(
    transaction.serialize(),
    { skipPreflight: false }
  );

  // Confirm transaction
  await connection.confirmTransaction(signature, 'confirmed');

  return { signature };
}
