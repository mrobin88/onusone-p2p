import { create } from 'ipfs-http-client';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';

export interface IPFSContent {
  id: string;
  cid: string;
  type: 'post' | 'engagement' | 'stake' | 'decay' | 'reward';
  content: any;
  metadata: {
    author: string;
    timestamp: number;
    size: number;
    mimeType?: string;
    tags?: string[];
  };
  pinStatus: 'pinned' | 'unpinned' | 'garbage';
  lastAccessed: number;
  accessCount: number;
}

export interface IPFSStorageConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  timeout?: number;
  enablePinning?: boolean;
  enableGarbageCollection?: boolean;
  maxStorageSize?: number; // in bytes
}

export class IPFSStorage extends EventEmitter {
  private ipfs: any;
  private logger: Logger;
  private config: IPFSStorageConfig;
  private contentIndex: Map<string, IPFSContent> = new Map();
  private isConnected: boolean = false;
  private storageStats: {
    totalSize: number;
    pinnedSize: number;
    unpinnedSize: number;
    contentCount: number;
    pinnedCount: number;
  };

  constructor(config: IPFSStorageConfig) {
    super();
    this.config = config;
    this.logger = new Logger('IPFSStorage');
    this.storageStats = {
      totalSize: 0,
      pinnedSize: 0,
      unpinnedSize: 0,
      contentCount: 0,
      pinnedCount: 0
    };
  }

  async initialize(): Promise<void> {
    try {
      this.ipfs = create({
        host: this.config.host,
        port: this.config.port,
        protocol: this.config.protocol,
        timeout: this.config.timeout || 30000
      });

      // Test connection
      await this.ipfs.id();
      this.isConnected = true;
      this.logger.info('IPFS connection established');

      // Load existing content index
      await this.loadContentIndex();
      
      // Start maintenance tasks
      this.startMaintenanceTasks();

      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize IPFS:', error);
      throw error;
    }
  }

  async storeContent(content: any, type: string, metadata: any): Promise<string> {
    if (!this.isConnected) {
      throw new Error('IPFS not connected');
    }

    try {
      // Prepare content for storage
      const contentData = {
        content,
        metadata: {
          ...metadata,
          type,
          timestamp: Date.now(),
          version: '1.0'
        }
      };

      // Add to IPFS
      const result = await this.ipfs.add(JSON.stringify(contentData), {
        pin: this.config.enablePinning || false,
        cidVersion: 1
      });

      const cid = result.cid.toString();
      const contentId = this.generateContentId(type, metadata.author);

      // Create content record
      const ipfsContent: IPFSContent = {
        id: contentId,
        cid,
        type: type as any,
        content,
        metadata: {
          author: metadata.author,
          timestamp: metadata.timestamp || Date.now(),
          size: result.size,
          mimeType: metadata.mimeType || 'application/json',
          tags: metadata.tags || []
        },
        pinStatus: this.config.enablePinning ? 'pinned' : 'unpinned',
        lastAccessed: Date.now(),
        accessCount: 0
      };

      // Store in local index
      this.contentIndex.set(contentId, ipfsContent);
      this.updateStorageStats(ipfsContent, 'add');

      // Pin if enabled
      if (this.config.enablePinning) {
        await this.pinContent(cid);
      }

      this.logger.info(`Content stored: ${contentId} -> ${cid}`);
      this.emit('content:stored', ipfsContent);

      return cid;
    } catch (error) {
      this.logger.error('Failed to store content:', error);
      throw error;
    }
  }

  async retrieveContent(contentId: string): Promise<any> {
    const content = this.contentIndex.get(contentId);
    if (!content) {
      throw new Error(`Content not found: ${contentId}`);
    }

    try {
      // Retrieve from IPFS
      const chunks = [];
      for await (const chunk of this.ipfs.cat(content.cid)) {
        chunks.push(chunk);
      }

      const data = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));

      // Update access stats
      content.lastAccessed = Date.now();
      content.accessCount++;
      this.updateStorageStats(content, 'access');

      this.logger.info(`Content retrieved: ${contentId}`);
      this.emit('content:retrieved', content);

      return data.content;
    } catch (error) {
      this.logger.error(`Failed to retrieve content ${contentId}:`, error);
      throw error;
    }
  }

  async retrieveByCID(cid: string): Promise<any> {
    try {
      const chunks = [];
      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
      }

      const data = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
      return data.content;
    } catch (error) {
      this.logger.error(`Failed to retrieve content by CID ${cid}:`, error);
      throw error;
    }
  }

  async pinContent(cid: string): Promise<void> {
    try {
      await this.ipfs.pin.add(cid);
      this.logger.info(`Content pinned: ${cid}`);
      this.emit('content:pinned', cid);
    } catch (error) {
      this.logger.error(`Failed to pin content ${cid}:`, error);
      throw error;
    }
  }

  async unpinContent(cid: string): Promise<void> {
    try {
      await this.ipfs.pin.rm(cid);
      this.logger.info(`Content unpinned: ${cid}`);
      this.emit('content:unpinned', cid);
    } catch (error) {
      this.logger.error(`Failed to unpin content ${cid}:`, error);
      throw error;
    }
  }

  async searchContent(query: {
    type?: string;
    author?: string;
    tags?: string[];
    dateRange?: { start: number; end: number };
  }): Promise<IPFSContent[]> {
    const results: IPFSContent[] = [];

    for (const content of this.contentIndex.values()) {
      let matches = true;

      if (query.type && content.type !== query.type) {
        matches = false;
      }

      if (query.author && content.metadata.author !== query.author) {
        matches = false;
      }

      if (query.tags && query.tags.length > 0) {
        const hasTags = query.tags.some(tag => 
          content.metadata.tags?.includes(tag)
        );
        if (!hasTags) {
          matches = false;
        }
      }

      if (query.dateRange) {
        const timestamp = content.metadata.timestamp;
        if (timestamp < query.dateRange.start || timestamp > query.dateRange.end) {
          matches = false;
        }
      }

      if (matches) {
        results.push(content);
      }
    }

    return results.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
  }

  async deleteContent(contentId: string): Promise<void> {
    const content = this.contentIndex.get(contentId);
    if (!content) {
      throw new Error(`Content not found: ${contentId}`);
    }

    try {
      // Unpin if pinned
      if (content.pinStatus === 'pinned') {
        await this.unpinContent(content.cid);
      }

      // Remove from local index
      this.contentIndex.delete(contentId);
      this.updateStorageStats(content, 'remove');

      this.logger.info(`Content deleted: ${contentId}`);
      this.emit('content:deleted', content);
    } catch (error) {
      this.logger.error(`Failed to delete content ${contentId}:`, error);
      throw error;
    }
  }

  async getStorageStats(): Promise<any> {
    try {
      const repoStats = await this.ipfs.repo.stat();
      
      return {
        ...this.storageStats,
        ipfsRepoSize: repoStats.repoSize,
        ipfsNumObjects: repoStats.numObjects,
        ipfsVersion: repoStats.version,
        isConnected: this.isConnected
      };
    } catch (error) {
      this.logger.error('Failed to get IPFS repo stats:', error);
      return this.storageStats;
    }
  }

  async garbageCollect(): Promise<void> {
    if (!this.config.enableGarbageCollection) {
      return;
    }

    try {
      this.logger.info('Starting garbage collection...');
      
      // Get all pinned CIDs
      const pinnedCids = new Set<string>();
      for await (const { cid } of this.ipfs.pin.ls()) {
        pinnedCids.add(cid.toString());
      }

      // Mark unpinned content for removal
      for (const content of this.contentIndex.values()) {
        if (!pinnedCids.has(content.cid)) {
          content.pinStatus = 'garbage';
        }
      }

      // Run IPFS garbage collection
      await this.ipfs.repo.gc();

      this.logger.info('Garbage collection completed');
      this.emit('garbage:collected');
    } catch (error) {
      this.logger.error('Garbage collection failed:', error);
      throw error;
    }
  }

  async syncWithPeer(peerId: string): Promise<void> {
    try {
      this.logger.info(`Syncing with peer: ${peerId}`);
      
      // Get peer's content index
      const peerIndex = await this.getPeerContentIndex(peerId);
      
      // Download missing content
      for (const [contentId, peerContent] of peerIndex) {
        if (!this.contentIndex.has(contentId)) {
          try {
            await this.downloadContentFromPeer(peerId, peerContent.cid);
            this.logger.info(`Synced content: ${contentId}`);
          } catch (error) {
            this.logger.warn(`Failed to sync content ${contentId}:`, error);
          }
        }
      }

      this.emit('peer:synced', peerId);
    } catch (error) {
      this.logger.error(`Failed to sync with peer ${peerId}:`, error);
      throw error;
    }
  }

  private async getPeerContentIndex(peerId: string): Promise<Map<string, any>> {
    // This would implement peer-to-peer content index sharing
    // For now, return empty map
    return new Map();
  }

  private async downloadContentFromPeer(peerId: string, cid: string): Promise<void> {
    // This would implement direct peer-to-peer content transfer
    // For now, use IPFS network retrieval
    await this.retrieveByCID(cid);
  }

  private generateContentId(type: string, author: string): string {
    return `${type}-${author}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateStorageStats(content: IPFSContent, operation: 'add' | 'remove' | 'access'): void {
    const size = content.metadata.size;

    switch (operation) {
      case 'add':
        this.storageStats.totalSize += size;
        this.storageStats.contentCount++;
        if (content.pinStatus === 'pinned') {
          this.storageStats.pinnedSize += size;
          this.storageStats.pinnedCount++;
        } else {
          this.storageStats.unpinnedSize += size;
        }
        break;
      case 'remove':
        this.storageStats.totalSize -= size;
        this.storageStats.contentCount--;
        if (content.pinStatus === 'pinned') {
          this.storageStats.pinnedSize -= size;
          this.storageStats.pinnedCount--;
        } else {
          this.storageStats.unpinnedSize -= size;
        }
        break;
      case 'access':
        // Just update access time, no size changes
        break;
    }
  }

  private async loadContentIndex(): Promise<void> {
    try {
      // Load content index from IPFS or local storage
      // For now, start with empty index
      this.logger.info('Content index loaded');
    } catch (error) {
      this.logger.warn('Failed to load content index, starting fresh');
    }
  }

  private startMaintenanceTasks(): void {
    // Periodic garbage collection
    if (this.config.enableGarbageCollection) {
      setInterval(() => {
        this.garbageCollect().catch(error => {
          this.logger.error('Periodic garbage collection failed:', error);
        });
      }, 3600000); // Every hour
    }

    // Storage size monitoring
    setInterval(() => {
      if (this.config.maxStorageSize && this.storageStats.totalSize > this.config.maxStorageSize) {
        this.logger.warn('Storage limit exceeded, triggering cleanup');
        this.emit('storage:limit-exceeded', this.storageStats);
      }
    }, 300000); // Every 5 minutes
  }

  async disconnect(): Promise<void> {
    try {
      this.isConnected = false;
      this.logger.info('IPFS storage disconnected');
      this.emit('disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting IPFS storage:', error);
      throw error;
    }
  }

  isStorageConnected(): boolean {
    return this.isConnected;
  }

  getContentIndex(): Map<string, IPFSContent> {
    return new Map(this.contentIndex);
  }
}
