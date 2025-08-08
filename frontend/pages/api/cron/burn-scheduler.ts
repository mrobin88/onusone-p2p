import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Scheduled token burn job
 * This endpoint should be called periodically (e.g., every hour) by a cron job
 * 
 * Setup instructions:
 * 1. Vercel: Add this as a Vercel Cron Function
 * 2. Manual: Call this endpoint every hour with a scheduled task
 * 3. Production: Use proper authentication for cron calls
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Security: Only allow POST requests with proper authorization
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Security: Check for cron job authorization (replace with your secret)
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'dev-cron-secret'}`;
  
  if (authHeader !== expectedAuth) {
    return res.status(401).json({ error: 'Unauthorized - invalid cron secret' });
  }
  
  try {
    console.log('🔥 Starting scheduled token burn job...');
    
    // Call the burn tokens endpoint
    const burnResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/decay/burn-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!burnResponse.ok) {
      throw new Error(`Burn job failed with status ${burnResponse.status}`);
    }
    
    const burnResults = await burnResponse.json();
    
    console.log('🔥 Scheduled burn job completed:', {
      totalBurned: burnResults.totalBurned,
      burnEvents: burnResults.burnEvents,
      postsProcessed: burnResults.postsProcessed
    });
    
    // Also update decay scores for visibility
    const decayResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/decay/sweep`, {
      method: 'GET'
    });
    
    const decayResults = decayResponse.ok ? await decayResponse.json() : null;
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      burnResults: {
        totalBurned: burnResults.totalBurned,
        burnEvents: burnResults.burnEvents,
        postsProcessed: burnResults.postsProcessed
      },
      decayResults: decayResults ? {
        postsUpdated: decayResults.length || 0
      } : null,
      nextScheduledRun: new Date(Date.now() + 60 * 60 * 1000).toISOString() // Next hour
    });
    
  } catch (error) {
    console.error('❌ Scheduled burn job failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Scheduled burn job failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Configure this endpoint as a Vercel Cron Function:
 * 
 * Create vercel.json in project root:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/burn-scheduler",
 *       "schedule": "0 * * * *"
 *     }
 *   ]
 * }
 * 
 * Or call manually with curl:
 * curl -X POST http://localhost:3000/api/cron/burn-scheduler \
 *   -H "Authorization: Bearer your-cron-secret" \
 *   -H "Content-Type: application/json"
 */
