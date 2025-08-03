/**
 * Message Storage Layer for OnusOne P2P Node
 * Handles local storage of messages with decay score management
 */

import Database from 'sqlite3';
import { promisify } from 'util';
import { 
  Message, 
  BoardType
} from '../shared/types';

import {
  calculateDecayScore,
  isMessageVisible,
  generateWeeklySummaryData
} from '../shared/decay';

import { utils } from '../shared/utils';

interface StoredMessage {
  id: string;
  authorId: string;
  boardType: BoardType;
  ipfsHash: string;
  decayScore: number;
  timestamp: Date;
  content?: string;
  replyCount?: number;
  reactionCount?: number;
}

export class MessageStore {
  private db: Database.Database;
  private isInitialized: boolean = false;

  constructor(dbPath: string = './data/messages.db') {
    this.db = new Database.Database(dbPath);
  }

  /**
   * Initialize the database with required tables
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const run = promisify(this.db.run.bind(this.db));
    
    try {
      // Messages table
      await run(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          author_id TEXT NOT NULL,
          board_type TEXT NOT NULL,
          content TEXT,
          content_hash TEXT,
          ipfs_hash TEXT NOT NULL,
          decay_score REAL NOT NULL DEFAULT 100,
          initial_score REAL NOT NULL DEFAULT 100,
          last_engagement TEXT NOT NULL,
          reply_count INTEGER DEFAULT 0,
          reaction_count INTEGER DEFAULT 0,
          share_count INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          is_visible BOOLEAN DEFAULT 1
        )
      `);

      // Message reactions table
      await run(`
        CREATE TABLE IF NOT EXISTS message_reactions (
          id TEXT PRIMARY KEY,
          message_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          reaction_type TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (message_id) REFERENCES messages (id),
          UNIQUE(message_id, user_id, reaction_type)
        )
      `);

      // Weekly summaries table
      await run(`
        CREATE TABLE IF NOT EXISTS weekly_summaries (
          id TEXT PRIMARY KEY,
          board_type TEXT NOT NULL,
          week_start TEXT NOT NULL,
          week_end TEXT NOT NULL,
          summary_data TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `);

      // Peer storage stats table
      await run(`
        CREATE TABLE IF NOT EXISTS storage_stats (
          peer_id TEXT PRIMARY KEY,
          total_messages INTEGER DEFAULT 0,
          storage_bytes INTEGER DEFAULT 0,
          last_updated TEXT NOT NULL
        )
      `);

      // Create indexes for performance
      await run('CREATE INDEX IF NOT EXISTS idx_messages_board_type ON messages(board_type)');
      await run('CREATE INDEX IF NOT EXISTS idx_messages_decay_score ON messages(decay_score DESC)');
      await run('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)');
      await run('CREATE INDEX IF NOT EXISTS idx_messages_visible ON messages(is_visible)');
      await run('CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON message_reactions(message_id)');

      this.isInitialized = true;
      console.log('MessageStore initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MessageStore:', error);
      throw error;
    }
  }

  /**
   * Store a new message or update existing one
   */
  async storeMessage(message: Message | StoredMessage): Promise<void> {
    await this.ensureInitialized();
    
    const run = promisify(this.db.run.bind(this.db));
    
    try {
      await run(`
        INSERT OR REPLACE INTO messages (
          id, author_id, board_type, content, content_hash, ipfs_hash,
          decay_score, initial_score, last_engagement, reply_count,
          reaction_count, share_count, created_at, updated_at, is_visible
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        message.id,
        message.authorId,
        message.boardType,
        'content' in message ? message.content : null,
        'contentHash' in message ? message.contentHash : null,
        message.ipfsHash,
        message.decayScore || 100,
        'initialScore' in message ? message.initialScore : 100,
        ('lastEngagement' in message ? message.lastEngagement : message.timestamp || new Date()).toISOString(),
        'replyCount' in message ? message.replyCount : 0,
        'reactionCount' in message ? message.reactionCount : 0,
        'shareCount' in message ? message.shareCount : 0,
        ('createdAt' in message ? message.createdAt : message.timestamp || new Date()).toISOString(),
        ('updatedAt' in message ? message.updatedAt : new Date()).toISOString(),
        1
      ]);
    } catch (error) {
      console.error('Failed to store message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a specific board
   */
  async getMessagesByBoard(
    boardType: BoardType, 
    since?: Date, 
    limit: number = 100
  ): Promise<Message[]> {
    await this.ensureInitialized();
    
    const all = promisify(this.db.all.bind(this.db));
    
    try {
      let query = `
        SELECT * FROM messages 
        WHERE board_type = ? AND is_visible = 1
      `;
      const params: any[] = [boardType];
      
      if (since) {
        query += ' AND created_at > ?';
        params.push(since.toISOString());
      }
      
      query += ' ORDER BY decay_score DESC, created_at DESC LIMIT ?';
      params.push(limit);
      
      const rows = await all(query, params) as any[];
      
      return rows.map(row => this.rowToMessage(row));
    } catch (error) {
      console.error('Failed to get messages by board:', error);
      return [];
    }
  }

  /**
   * Update decay score for a message
   */
  async updateDecayScore(messageId: string, scoreChange: number): Promise<void> {
    await this.ensureInitialized();
    
    const run = promisify(this.db.run.bind(this.db));
    
    try {
      await run(`
        UPDATE messages 
        SET 
          decay_score = decay_score + ?,
          last_engagement = ?,
          updated_at = ?
        WHERE id = ?
      `, [scoreChange, new Date().toISOString(), new Date().toISOString(), messageId]);
    } catch (error) {
      console.error('Failed to update decay score:', error);
      throw error;
    }
  }

  /**
   * Batch update decay scores for all messages (called periodically)
   */
  async batchUpdateDecayScores(): Promise<number> {
    await this.ensureInitialized();
    
    const all = promisify(this.db.all.bind(this.db));
    const run = promisify(this.db.run.bind(this.db));
    
    try {
      // Get all visible messages
      const rows = await all(`
        SELECT id, decay_score, last_engagement, created_at
        FROM messages 
        WHERE is_visible = 1
      `) as any[];
      
      let updatedCount = 0;
      
      for (const row of rows) {
        // Calculate current decay score
        const lastEngagement = new Date(row.last_engagement);
        const now = new Date();
        const hoursSinceEngagement = (now.getTime() - lastEngagement.getTime()) / (1000 * 60 * 60);
        
        // Apply decay (1 point per hour)
        const decayAmount = hoursSinceEngagement * 1;
        const newScore = Math.max(0, row.decay_score - decayAmount);
        
        // Update if score changed significantly or became invisible
        if (Math.abs(newScore - row.decay_score) > 0.1 || newScore === 0) {
          await run(`
            UPDATE messages 
            SET 
              decay_score = ?,
              is_visible = ?,
              updated_at = ?
            WHERE id = ?
          `, [newScore, newScore > 0 ? 1 : 0, now.toISOString(), row.id]);
          
          updatedCount++;
        }
      }
      
      return updatedCount;
    } catch (error) {
      console.error('Failed to batch update decay scores:', error);
      return 0;
    }
  }

  /**
   * Get messages from the past week for bounty processing
   */
  async getWeeklyMessages(boardType: BoardType): Promise<Message[]> {
    await this.ensureInitialized();
    
    const all = promisify(this.db.all.bind(this.db));
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    try {
      const rows = await all(`
        SELECT * FROM messages 
        WHERE board_type = ? 
          AND created_at >= ?
        ORDER BY decay_score DESC
      `, [boardType, weekAgo.toISOString()]) as any[];
      
      return rows.map(row => this.rowToMessage(row));
    } catch (error) {
      console.error('Failed to get weekly messages:', error);
      return [];
    }
  }

  /**
   * Store weekly summary data
   */
  async storeWeeklySummary(
    boardType: BoardType, 
    summaryData: ReturnType<typeof generateWeeklySummaryData>
  ): Promise<void> {
    await this.ensureInitialized();
    
    const run = promisify(this.db.run.bind(this.db));
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    try {
      await run(`
        INSERT INTO weekly_summaries (
          id, board_type, week_start, week_end, summary_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        utils.generateId(),
        boardType,
        weekStart.toISOString(),
        now.toISOString(),
        JSON.stringify(summaryData),
        now.toISOString()
      ]);
    } catch (error) {
      console.error('Failed to store weekly summary:', error);
      throw error;
    }
  }

  /**
   * Add reaction to a message
   */
  async addReaction(
    messageId: string, 
    userId: string, 
    reactionType: string
  ): Promise<void> {
    await this.ensureInitialized();
    
    const run = promisify(this.db.run.bind(this.db));
    
    try {
      // Add reaction
      await run(`
        INSERT OR IGNORE INTO message_reactions (
          id, message_id, user_id, reaction_type, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `, [utils.generateId(), messageId, userId, reactionType, new Date().toISOString()]);
      
      // Update reaction count and boost decay score
      await run(`
        UPDATE messages 
        SET 
          reaction_count = (
            SELECT COUNT(*) FROM message_reactions 
            WHERE message_id = ?
          ),
          decay_score = decay_score + 2,
          last_engagement = ?,
          updated_at = ?
        WHERE id = ?
      `, [messageId, new Date().toISOString(), new Date().toISOString(), messageId]);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalMessages: number;
    visibleMessages: number;
    totalSizeBytes: number;
    messagesByBoard: Record<string, number>;
  }> {
    await this.ensureInitialized();
    
    const get = promisify(this.db.get.bind(this.db));
    const all = promisify(this.db.all.bind(this.db));
    
    try {
      const totalStats = await get(`
        SELECT 
          COUNT(*) as total_messages,
          SUM(CASE WHEN is_visible = 1 THEN 1 ELSE 0 END) as visible_messages
        FROM messages
      `) as any;
      
      const boardStats = await all(`
        SELECT board_type, COUNT(*) as count
        FROM messages
        WHERE is_visible = 1
        GROUP BY board_type
      `) as any[];
      
      const messagesByBoard = boardStats.reduce((acc, row) => {
        acc[row.board_type] = row.count;
        return acc;
      }, {});
      
      return {
        totalMessages: totalStats.total_messages || 0,
        visibleMessages: totalStats.visible_messages || 0,
        totalSizeBytes: 0, // Would calculate from content length in production
        messagesByBoard
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalMessages: 0,
        visibleMessages: 0,
        totalSizeBytes: 0,
        messagesByBoard: {}
      };
    }
  }

  /**
   * Clean up old invisible messages
   */
  async cleanupOldMessages(olderThanDays: number = 30): Promise<number> {
    await this.ensureInitialized();
    
    const run = promisify(this.db.run.bind(this.db));
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    try {
      const result = await run(`
        DELETE FROM messages 
        WHERE is_visible = 0 
          AND updated_at < ?
      `, [cutoffDate.toISOString()]);
      
      return (result as any).changes || 0;
    } catch (error) {
      console.error('Failed to cleanup old messages:', error);
      return 0;
    }
  }

  /**
   * Convert database row to Message object
   */
  private rowToMessage(row: any): Message {
    return {
      id: row.id,
      content: row.content || '',
      contentHash: row.content_hash || '',
      authorId: row.author_id,
      boardType: row.board_type as BoardType,
      decayScore: row.decay_score,
      initialScore: row.initial_score,
      lastEngagement: new Date(row.last_engagement),
      isVisible: row.is_visible === 1,
      replyCount: row.reply_count || 0,
      reactionCount: row.reaction_count || 0,
      shareCount: row.share_count || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      ipfsHash: row.ipfs_hash,
      authorSignature: '', // Not stored in DB for this simplified version
      networkVersion: 1
    };
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}