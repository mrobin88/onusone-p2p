/**
 * Stripe Webhook Handler for Render Backend
 * Processes payment confirmations and triggers ONU token delivery
 */

import express from 'express';
import Stripe from 'stripe';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError
} from '@solana/spl-token';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Solana configuration
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
const ONU_TOKEN_MINT = new PublicKey(process.env.ONU_TOKEN_MINT!);
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

/**
 * Stripe Webhook Endpoint
 * POST /api/stripe/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: any, res: any) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Missing Stripe signature or webhook secret');
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  console.log('🔔 Stripe webhook received:', event.type);

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'charge.succeeded':
        await handleChargeSuccess(event.data.object as Stripe.Charge);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  console.log('💰 Payment succeeded:', paymentIntent.id);
  
  try {
    // Extract metadata
    const onuAmount = parseFloat(paymentIntent.metadata.onu_amount || '0');
    const walletAddress = paymentIntent.metadata.wallet_address;
    const usdAmount = paymentIntent.amount / 100;

    if (!onuAmount || !walletAddress) {
      console.error('Missing metadata for payment:', paymentIntent.id);
      return;
    }

    console.log(`🎯 Processing ONU token delivery: ${onuAmount} ONU to ${walletAddress}`);

    // Send ONU tokens to user wallet
    const tokenDelivery = await sendONUTokens(walletAddress, onuAmount);

    console.log('✅ ONU tokens delivered successfully:', {
      paymentIntentId: paymentIntent.id,
      walletAddress,
      onuAmount,
      usdAmount,
      signature: tokenDelivery.signature,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to process payment success:', error);
    // In production, you might want to retry or alert
  }
}

/**
 * Handle payment failure
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);
  
  // Log failure for monitoring
  console.log('Payment failure details:', {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    status: paymentIntent.status,
    lastPaymentError: paymentIntent.last_payment_error
  });
}

/**
 * Handle successful charge
 */
async function handleChargeSuccess(charge: Stripe.Charge) {
  console.log('💳 Charge succeeded:', charge.id);
  
  // Additional charge verification if needed
  console.log('Charge details:', {
    id: charge.id,
    amount: charge.amount,
    currency: charge.currency,
    status: charge.status
  });
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
    onuAmount * Math.pow(10, 6),    // amount (convert to token units, 6 decimals)
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

export default router;
