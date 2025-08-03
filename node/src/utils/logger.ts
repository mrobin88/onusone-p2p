/**
 * Logging utility for OnusOne P2P Node
 */

import winston from 'winston';
import path from 'path';

export class Logger {
  private logger: winston.Logger;
  private context: string;

  constructor(context: string = 'OnusOneNode') {
    this.context = context;
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const logDir = process.env.LOG_DIR || './logs';
    const logLevel = process.env.LOG_LEVEL || 'info';

    return winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack, context }) => {
          const ctx = context || this.context;
          const msg = stack || message;
          return `${timestamp} [${level.toUpperCase()}] [${ctx}] ${msg}`;
        })
      ),
      transports: [
        // Console logging
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, stack }) => {
              const msg = stack || message;
              return `${timestamp} [${level}] [${this.context}] ${msg}`;
            })
          )
        }),

        // File logging - Info and above
        new winston.transports.File({
          filename: path.join(logDir, 'onusone-node.log'),
          format: winston.format.combine(
            winston.format.uncolorize(),
            winston.format.json()
          )
        }),

        // File logging - Errors only
        new winston.transports.File({
          filename: path.join(logDir, 'onusone-error.log'),
          level: 'error',
          format: winston.format.combine(
            winston.format.uncolorize(),
            winston.format.json()
          )
        })
      ],
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'onusone-exceptions.log')
        })
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'onusone-rejections.log')
        })
      ]
    });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, { context: this.context, ...meta });
  }

  error(message: string, error?: any, meta?: any): void {
    if (error instanceof Error) {
      this.logger.error(message, { 
        context: this.context, 
        stack: error.stack,
        error: error.message,
        ...meta 
      });
    } else {
      this.logger.error(message, { 
        context: this.context, 
        error: error,
        ...meta 
      });
    }
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, { context: this.context, ...meta });
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, { context: this.context, ...meta });
  }

  verbose(message: string, meta?: any): void {
    this.logger.verbose(message, { context: this.context, ...meta });
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: string): Logger {
    const childLogger = new Logger(`${this.context}:${additionalContext}`);
    return childLogger;
  }

  /**
   * Log network metrics
   */
  logNetworkMetrics(metrics: {
    connectedPeers: number;
    messageLatency: number;
    storageUsage: number;
    syncStatus: string;
  }): void {
    this.info('Network metrics', {
      metrics,
      type: 'network_metrics'
    });
  }

  /**
   * Log message processing
   */
  logMessageProcessed(messageId: string, boardType: string, decayScore: number): void {
    this.debug('Message processed', {
      messageId,
      boardType,
      decayScore,
      type: 'message_processed'
    });
  }

  /**
   * Log peer connection events
   */
  logPeerEvent(event: 'connect' | 'disconnect', peerId: string, totalPeers: number): void {
    this.info(`Peer ${event}`, {
      peerId,
      totalPeers,
      event: `peer_${event}`,
      type: 'peer_event'
    });
  }

  /**
   * Log decay score updates
   */
  logDecayUpdate(updatedCount: number, totalVisible: number): void {
    this.debug('Decay scores updated', {
      updatedCount,
      totalVisible,
      type: 'decay_update'
    });
  }

  /**
   * Log bounty processing
   */
  logBountyProcessing(boardType: string, messageCount: number, summaryGenerated: boolean): void {
    this.info('Weekly bounty processed', {
      boardType,
      messageCount,
      summaryGenerated,
      type: 'bounty_processing'
    });
  }

  /**
   * Log storage operations
   */
  logStorage(operation: string, details: any): void {
    this.debug(`Storage: ${operation}`, {
      operation,
      details,
      type: 'storage_operation'
    });
  }

  /**
   * Log IPFS operations
   */
  logIPFS(operation: string, hash?: string, success?: boolean): void {
    this.debug(`IPFS: ${operation}`, {
      operation,
      hash,
      success,
      type: 'ipfs_operation'
    });
  }

  /**
   * Performance timing helper
   */
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`Performance: ${label}`, {
        label,
        duration,
        type: 'performance'
      });
    };
  }
}