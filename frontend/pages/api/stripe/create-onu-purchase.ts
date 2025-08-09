/**
 * Stripe API: Create payment intent for buying ONU tokens with fiat
 * REAL money flow: Credit card → Stripe → ONU tokens
 */

import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface PurchaseRequest {
  usdAmount: number;
  onuAmount: number;
  walletAddress: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { usdAmount, onuAmount, walletAddress }: PurchaseRequest = req.body;

    // Validation
    if (!usdAmount || !onuAmount || !walletAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (usdAmount < 10) {
      return res.status(400).json({ error: 'Minimum purchase is $10' });
    }

    if (usdAmount > 10000) {
      return res.status(400).json({ error: 'Maximum purchase is $10,000' });
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(usdAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        product: 'onu_tokens',
        onu_amount: onuAmount.toString(),
        wallet_address: walletAddress,
        platform: 'onusone_p2p'
      },
      description: `Purchase ${onuAmount.toFixed(2)} ONU tokens for OnusOne P2P`,
      receipt_email: undefined, // Optional: collect email for receipt
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Log the purchase attempt
    console.log(`ONU Purchase Created:`, {
      paymentIntentId: paymentIntent.id,
      usdAmount,
      onuAmount,
      walletAddress,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      onuAmount,
      usdAmount
    });

  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ 
        error: 'Payment setup failed', 
        details: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}
