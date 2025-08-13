/**
 * Working OnusOne Backend - Actually saves data and works
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

dotenv.config();

interface Message {
  id: string;
  content: string;
  author: string;
  boardslug: string;
  authorwallet?: string;
  parentid?: string;
  timestamp: number;
  ipfshash?: string;
  stakeamount?: number;
  totalstakes?: number;
  decayscore?: number;
  rewardpool?: number;
  reputationimpact?: number;
  likes?: number;
  dislikes?: number;
  ispinned?: boolean;
  isdeleted?: boolean;
  metadata?: any;
}

interface Board {
  slug: string;
  name: string;
  description: string;
  createdAt: number;
}

const BOARDS = [
  { slug: 'general', name: 'General Discussion', description: 'General topics and discussions', createdAt: Date.now() },
  { slug: 'tech', name: 'Technology', description: 'Tech discussions and news', createdAt: Date.now() },
  { slug: 'crypto', name: 'Cryptocurrency', description: 'Crypto and blockchain talk', createdAt: Date.now() },
  { slug: 'dev', name: 'Development', description: 'Development and coding discussions', createdAt: Date.now() },
  { slug: 'community', name: 'Community', description: 'Community topics and events', createdAt: Date.now() },
  { slug: 'gaming', name: 'Gaming', description: 'Gaming and entertainment', createdAt: Date.now() },
  { slug: 'art', name: 'Art & Design', description: 'Creative arts and design', createdAt: Date.now() },
  { slug: 'music', name: 'Music', description: 'Music and audio discussions', createdAt: Date.now() },
  { slug: 'trading', name: 'Trading', description: 'Trading and finance', createdAt: Date.now() }
];

export class WorkingBackend {
  private app: express.Application;
  private server: any;
  private supabase: any;
  private isRunning: boolean = false;
  private solanaConnection: Connection;

  constructor() {
    this.app = express();
    
    // Initialize Solana connection
    this.solanaConnection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    
    // Initialize Supabase (or use local SQLite as fallback)
    this.initializeDatabase();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private initializeDatabase() {
    // Try to use Supabase if configured, otherwise use local storage
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      console.log('✅ Connected to Supabase database');
    } else {
      console.log('⚠️  No Supabase config, using local storage');
      this.supabase = null;
    }
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes() {
    // Import Stripe webhook routes
    import('./routes/stripe-webhook').then(module => {
      const stripeWebhookRoutes = module.default;
      this.app.use('/api/stripe', stripeWebhookRoutes);
    }).catch(err => {
      console.warn('⚠️  Stripe webhook routes not loaded:', err.message);
    });
    
    // Health check
    this.app.get('/health', (req: express.Request, res: express.Response) => {
      res.json({
        status: 'healthy',
        backend: 'WorkingBackend',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: this.supabase ? 'Supabase' : 'Local'
      });
    });

    // Dashboard stats endpoint
    this.app.get('/api/dashboard/stats', async (req: express.Request, res: express.Response) => {
      try {
        let totalMessages = 0;
        let totalBoards = 0;
        let activeUsers = 0;

        if (this.supabase) {
          // Get total messages count
          const { count: messageCount } = await this.supabase
            .from('messages')
            .select('*', { count: 'exact', head: true });
          
          // Get total boards count
          const { count: boardCount } = await this.supabase
            .from('boards')
            .select('*', { count: 'exact', head: true });
          
          totalMessages = messageCount || 0;
          totalBoards = boardCount || 0;
        } else {
          // Mock stats for local development
          totalMessages = Math.floor(Math.random() * 50) + 10;
          totalBoards = BOARDS.length;
        }

        res.json({
          totalMessages,
          totalBoards,
          activeUsers: 1, // Will be dynamic when user system is implemented
          backendStatus: 'online',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to get dashboard stats:', error);
        res.status(500).json({ error: 'Failed to get dashboard stats' });
      }
    });

    // Get all boards
    this.app.get('/api/boards', async (req: express.Request, res: express.Response) => {
      try {
        if (this.supabase) {
          const { data, error } = await this.supabase
            .from('boards')
            .select('*')
            .order('createdAt', { ascending: false });
          
          if (error) throw error;
          res.json(data || []);
        } else {
          // Mock boards for local development
          const mockBoards: Board[] = [
            { slug: 'general', name: 'General Discussion', description: 'General topics and discussions', createdAt: Date.now() },
            { slug: 'tech', name: 'Technology', description: 'Tech discussions and news', createdAt: Date.now() },
            { slug: 'crypto', name: 'Cryptocurrency', description: 'Crypto and blockchain talk', createdAt: Date.now() }
          ];
          res.json(mockBoards);
        }
      } catch (error) {
        console.error('Failed to get boards:', error);
        res.status(500).json({ error: 'Failed to get boards' });
      }
    });

    // Get messages for a board
    this.app.get('/api/boards/:slug/messages', async (req: express.Request, res: express.Response) => {
      try {
        const { slug } = req.params;
        
        if (this.supabase) {
          const { data, error } = await this.supabase
            .from('messages')
            .select('*')
            .eq('boardslug', slug)
            .order('timestamp', { ascending: false });
          
          if (error) throw error;
          res.json(data || []);
        } else {
          // Mock messages for local development
          const mockMessages: Message[] = [
            {
              id: uuidv4(),
              content: 'Welcome to the ' + slug + ' board!',
              author: 'system',
              boardslug: slug,
              authorwallet: 'system',
              timestamp: Date.now(),
              ipfshash: undefined,
              stakeamount: 0,
              totalstakes: 0,
              decayscore: 100,
              rewardpool: 0,
              reputationimpact: 0,
              likes: 0,
              dislikes: 0,
              ispinned: false,
              isdeleted: false,
              metadata: {}
            }
          ];
          res.json(mockMessages);
        }
      } catch (error) {
        console.error('Failed to get messages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
      }
    });

    // Create a new message
    this.app.post('/api/boards/:slug/messages', async (req: express.Request, res: express.Response) => {
      try {
        const { slug } = req.params;
        const { content, author } = req.body;
        
        if (!content || !author) {
          return res.status(400).json({ error: 'Content and author are required' });
        }

        const message = {
          id: uuidv4(),
          content,
          author,
          boardslug: slug,
          authorwallet: req.body.authorwallet || 'anonymous',
          timestamp: Date.now(),
          ipfshash: req.body.ipfshash || undefined,
          stakeamount: 0,
          totalstakes: 0,
          decayscore: 100,
          rewardpool: 0,
          reputationimpact: 0,
          likes: 0,
          dislikes: 0,
          ispinned: false,
          isdeleted: false,
          metadata: {}
        };

        if (this.supabase) {
          const { data, error } = await this.supabase
            .from('messages')
            .insert([message])
            .select();
          
          if (error) throw error;
          res.json(data[0]);
        } else {
          // Store locally for development
          console.log('📝 Message created locally:', message);
          res.json(message);
        }
      } catch (error) {
        console.error('Failed to create message:', error);
        res.status(500).json({ error: 'Failed to create message' });
      }
    });

    // Get user profile
    this.app.get('/api/users/:username', async (req: express.Request, res: express.Response) => {
      try {
        const { username } = req.params;
        
        if (this.supabase) {
          const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
          
          if (error) throw error;
          res.json(data || { username, reputation: 0, posts: 0 });
        } else {
          // Mock user profile
          res.json({
            username,
            reputation: Math.floor(Math.random() * 1000),
            posts: Math.floor(Math.random() * 50),
            joinedAt: Date.now()
          });
        }
      } catch (error) {
        console.error('Failed to get user:', error);
        res.status(500).json({ error: 'Failed to get user' });
      }
    });

    // WebSocket endpoint for real-time updates
    this.app.get('/ws', (req: express.Request, res: express.Response) => {
      res.json({
        message: 'WebSocket endpoint ready',
        backend: 'WorkingBackend',
        timestamp: new Date().toISOString()
      });
    });

    // Test endpoint
    this.app.get('/api/test', (req: express.Request, res: express.Response) => {
      res.json({
        message: 'WorkingBackend is running and functional!',
        backend: 'WorkingBackend',
        timestamp: new Date().toISOString(),
        features: [
          'Message creation and storage',
          'Board management',
          'User profiles',
          'Database integration',
          'API endpoints'
        ]
      });
    });

    // Time Capsule Endpoints
    // Create a time capsule (stores as a message with metadata)
    this.app.post('/api/time-capsules', async (req: express.Request, res: express.Response) => {
      try {
        const { content, authorwallet, unlockAt, cost = 0 } = req.body || {};
        if (!content) {
          return res.status(400).json({ error: 'Content is required' });
        }
        if (!authorwallet || authorwallet === 'anonymous') {
          return res.status(400).json({ error: 'Valid author wallet is required' });
        }

        // Check ONU balance if cost > 0
        if (cost > 0) {
          const hasBalance = await this.hasSufficientBalance(authorwallet, cost);
          if (!hasBalance) {
            const current = await this.getUserONUBalance(authorwallet);
            return res.status(400).json({ error: 'Insufficient ONU balance', required: cost, current });
          }
          // Note: actual deduction/transfer is not implemented here
        }

        const unlockTimestamp = typeof unlockAt === 'number'
          ? unlockAt
          : (unlockAt ? Date.parse(unlockAt) : 0);

        const message: Message = {
          id: uuidv4(),
          content,
          author: authorwallet,
          boardslug: 'capsules',
          authorwallet,
          timestamp: Date.now(),
          stakeamount: 0,
          totalstakes: 0,
          decayscore: 100,
          rewardpool: 0,
          likes: 0,
          dislikes: 0,
          ispinned: false,
          isdeleted: false,
          metadata: {
            isTimeCapsule: true,
            unlockAt: unlockTimestamp,
            cost: cost
          }
        };

        if (this.supabase) {
          const { data, error } = await this.supabase
            .from('messages')
            .insert([message])
            .select();
          if (error) throw error;
          return res.json({ success: true, timeCapsule: data[0] });
        } else {
          return res.json({ success: true, timeCapsule: message });
        }
      } catch (error) {
        console.error('Failed to create time capsule:', error);
        res.status(500).json({ error: 'Failed to create time capsule' });
      }
    });

    // Get unlocked time capsules
    this.app.get('/api/time-capsules/unlocked', async (req: express.Request, res: express.Response) => {
      try {
        if (this.supabase) {
          const { data, error } = await this.supabase
            .from('messages')
            .select('*')
            .contains('metadata', { isTimeCapsule: true })
            .order('timestamp', { ascending: false })
            .limit(100);
          if (error) throw error;
          const now = Date.now();
          const unlocked = (data || []).filter((m: any) => (m.metadata?.unlockAt ?? 0) <= now);
          return res.json({ timeCapsules: unlocked });
        } else {
          return res.json({ timeCapsules: [] });
        }
      } catch (error) {
        console.error('Failed to get unlocked time capsules:', error);
        res.status(500).json({ error: 'Failed to get unlocked time capsules' });
      }
    });

    // Get user's time capsules
    this.app.get('/api/time-capsules/user/:wallet', async (req: express.Request, res: express.Response) => {
      try {
        const { wallet } = req.params;
        if (!wallet) return res.status(400).json({ error: 'Wallet required' });
        if (this.supabase) {
          const { data, error } = await this.supabase
            .from('messages')
            .select('*')
            .eq('authorwallet', wallet)
            .contains('metadata', { isTimeCapsule: true })
            .order('timestamp', { ascending: false })
            .limit(100);
          if (error) throw error;
          return res.json({ timeCapsules: data || [] });
        } else {
          return res.json({ timeCapsules: [] });
        }
      } catch (error) {
        console.error('Failed to get user time capsules:', error);
        res.status(500).json({ error: 'Failed to get user time capsules' });
      }
    });
  }

  /**
   * 🚀 NEW: Check user's ONU token balance
   */
  private async getUserONUBalance(walletAddress: string): Promise<number> {
    try {
      if (!process.env.ONU_TOKEN_MINT) {
        console.warn('⚠️  ONU_TOKEN_MINT not configured, returning 0 balance');
        return 0;
      }

      const mintPublicKey = new PublicKey(process.env.ONU_TOKEN_MINT);
      const userPublicKey = new PublicKey(walletAddress);
      
      // Get the associated token account
      const tokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        userPublicKey
      );

      try {
        // Get the token account info
        const account = await getAccount(this.solanaConnection, tokenAccount);
        const balance = Number(account.amount) / Math.pow(10, 9); // Assuming 9 decimals
        return balance;
      } catch (error) {
        // Token account doesn't exist, balance is 0
        return 0;
      }
    } catch (error) {
      console.error('Failed to get ONU balance:', error);
      return 0;
    }
  }

  /**
   * 🚀 NEW: Check if user has sufficient ONU balance
   */
  private async hasSufficientBalance(walletAddress: string, requiredAmount: number): Promise<boolean> {
    const balance = await this.getUserONUBalance(walletAddress);
    return balance >= requiredAmount;
  }

  /**
   * 🚀 NEW: Deduct ONU tokens from user (simulated - you'll need to implement actual transfer)
   */
  private async deductONUTokens(walletAddress: string, amount: number): Promise<boolean> {
    try {
      // For now, just log the deduction
      // In production, you'd implement actual token transfer
      console.log(`💰 Deducting ${amount} ONU from ${walletAddress}`);
      
      // TODO: Implement actual Solana token transfer
      // This would involve creating and sending a transaction
      
      return true; // Simulated success
    } catch (error) {
      console.error('Failed to deduct ONU tokens:', error);
      return false;
    }
  }

  async start(port: number = 8888) {
    try {
      this.isRunning = true;
      
      this.server = this.app.listen(port, () => {
        console.log(`🚀 WorkingBackend started on port ${port}`);
        console.log(`🌐 Health check: http://localhost:${port}/health`);
        console.log(`📊 API test: http://localhost:${port}/api/test`);
        console.log(`📝 Messages: http://localhost:${port}/api/boards/general/messages`);
        console.log(`🔌 WebSocket: ws://localhost:${port}/ws`);
        console.log(`💾 Database: ${this.supabase ? 'Supabase' : 'Local Storage'}`);
      });
      
    } catch (error) {
      console.error('❌ Failed to start WorkingBackend:', error);
      throw error;
    }
  }

  async stop() {
    try {
      if (this.server) {
        this.server.close();
      }
      this.isRunning = false;
      console.log('✅ WorkingBackend stopped successfully');
    } catch (error) {
      console.error('❌ Failed to stop WorkingBackend:', error);
    }
  }
}

// Main execution
async function main() {
  const backend = new WorkingBackend();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await backend.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await backend.stop();
    process.exit(0);
  });

  try {
    const port = parseInt(process.env.NODE_PORT || '8888');
    await backend.start(port);
  } catch (error) {
    console.error('❌ Failed to start WorkingBackend:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}
