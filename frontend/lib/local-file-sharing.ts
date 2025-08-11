import { EdgeNode } from './edge-node';

export interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  hash: string;
  owner: string;
  timestamp: number;
  chunks: FileChunk[];
}

export interface FileChunk {
  id: string;
  data: ArrayBuffer;
  index: number;
  hash: string;
}

export interface FileTransfer {
  id: string;
  fileId: string;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  progress: number;
  sender: string;
  receiver: string;
  chunks: FileChunk[];
}

export class LocalFileSharing {
  private node: EdgeNode;
  private sharedFiles: Map<string, SharedFile> = new Map();
  private activeTransfers: Map<string, FileTransfer> = new Map();
  private localStorage: Storage;

  constructor(node: EdgeNode) {
    this.node = node;
    this.localStorage = typeof window !== 'undefined' ? window.localStorage : new MockStorage();
    this.loadSharedFiles();
  }

  // Share a file locally and broadcast to network
  async shareFile(file: File): Promise<SharedFile> {
    const fileId = this.generateFileId(file);
    const chunks = await this.chunkFile(file);
    
    const sharedFile: SharedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      hash: await this.calculateHash(file),
      owner: this.node.getNodeId(),
      timestamp: Date.now(),
      chunks
    };

    // Store locally
    this.sharedFiles.set(fileId, sharedFile);
    this.saveSharedFiles();
    
    // Broadcast to network
    await this.broadcastFileShare(sharedFile);
    
    return sharedFile;
  }

  // Request a file from another node
  async requestFile(fileId: string, fromNode: string): Promise<SharedFile | null> {
    const transferId = this.generateTransferId();
    
    const transfer: FileTransfer = {
      id: transferId,
      fileId,
      status: 'pending',
      progress: 0,
      sender: fromNode,
      receiver: this.node.getNodeId(),
      chunks: []
    };

    this.activeTransfers.set(transferId, transfer);
    
    // Send request
    await this.node.sendMessage({
      type: 'FILE_REQUEST',
      data: { fileId, transferId },
      target: fromNode
    });

    return new Promise((resolve) => {
      const checkComplete = setInterval(() => {
        const currentTransfer = this.activeTransfers.get(transferId);
        if (currentTransfer?.status === 'completed') {
          clearInterval(checkComplete);
          const file = this.sharedFiles.get(fileId);
          resolve(file || null);
        }
      }, 100);
    });
  }

  // Handle incoming file requests
  async handleFileRequest(request: any): Promise<void> {
    const { fileId, transferId } = request.data;
    const file = this.sharedFiles.get(fileId);
    
    if (!file) {
      await this.node.sendMessage({
        type: 'FILE_NOT_FOUND',
        data: { fileId, transferId },
        target: request.sender
      });
      return;
    }

    // Send file chunks
    for (const chunk of file.chunks) {
      await this.node.sendMessage({
        type: 'FILE_CHUNK',
        data: { 
          fileId, 
          transferId, 
          chunk,
          progress: (chunk.index / file.chunks.length) * 100
        },
        target: request.sender
      });
    }

    // Send completion
    await this.node.sendMessage({
      type: 'FILE_COMPLETE',
      data: { fileId, transferId },
      target: request.sender
    });
  }

  // Handle incoming file chunks
  async handleFileChunk(message: any): Promise<void> {
    const { fileId, transferId, chunk, progress } = message.data;
    const transfer = this.activeTransfers.get(transferId);
    
    if (!transfer) return;
    
    transfer.chunks.push(chunk);
    transfer.progress = progress;
    
    // Check if complete
    if (transfer.status === 'pending') {
      transfer.status = 'transferring';
    }
  }

  // Handle file completion
  async handleFileComplete(message: any): Promise<void> {
    const { fileId, transferId } = message.data;
    const transfer = this.activeTransfers.get(transferId);
    
    if (!transfer) return;
    
    transfer.status = 'completed';
    transfer.progress = 100;
    
    // Reconstruct file
    const file = await this.reconstructFile(transfer.chunks, fileId);
    if (file) {
      this.sharedFiles.set(fileId, file);
      this.saveSharedFiles();
    }
  }

  // Get all shared files
  getSharedFiles(): SharedFile[] {
    return Array.from(this.sharedFiles.values());
  }

  // Get active transfers
  getActiveTransfers(): FileTransfer[] {
    return Array.from(this.activeTransfers.values());
  }

  // Private methods
  private async chunkFile(file: File): Promise<FileChunk[]> {
    const chunkSize = 64 * 1024; // 64KB chunks
    const chunks: FileChunk[] = [];
    
    for (let i = 0; i < file.size; i += chunkSize) {
      const chunk = file.slice(i, i + chunkSize);
      const arrayBuffer = await chunk.arrayBuffer();
      
      chunks.push({
        id: `${file.name}-chunk-${i}`,
        data: arrayBuffer,
        index: i / chunkSize,
        hash: await this.calculateHash(chunk)
      });
    }
    
    return chunks;
  }

  private async reconstructFile(chunks: FileChunk[], fileId: string): Promise<SharedFile | null> {
    // Sort chunks by index
    const sortedChunks = chunks.sort((a, b) => a.index - b.index);
    
    // Combine chunks
    const totalSize = sortedChunks.reduce((sum, chunk) => sum + chunk.data.byteLength, 0);
    const combined = new Uint8Array(totalSize);
    
    let offset = 0;
    for (const chunk of sortedChunks) {
      combined.set(new Uint8Array(chunk.data), offset);
      offset += chunk.data.byteLength;
    }
    
    // Create file info
    const firstChunk = sortedChunks[0];
    if (!firstChunk) return null;
    
    return {
      id: fileId,
      name: firstChunk.id.split('-chunk-')[0],
      size: totalSize,
      type: 'application/octet-stream',
      hash: await this.calculateHash(new Blob([combined])),
      owner: 'unknown',
      timestamp: Date.now(),
      chunks: sortedChunks
    };
  }

  private async calculateHash(data: File | Blob): Promise<string> {
    // Simple hash for demo - in production use crypto.subtle.digest
    const text = data instanceof File ? data.name + data.size : data.size.toString();
    return btoa(text).slice(0, 16);
  }

  private generateFileId(file: File): string {
    return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTransferId(): string {
    return `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async broadcastFileShare(file: SharedFile): Promise<void> {
    await this.node.sendMessage({
      type: 'FILE_SHARED',
      data: { file },
      target: 'broadcast'
    });
  }

  private loadSharedFiles(): void {
    try {
      const stored = this.localStorage.getItem('onusone-shared-files');
      if (stored) {
        const files = JSON.parse(stored);
        for (const file of files) {
          this.sharedFiles.set(file.id, file);
        }
      }
    } catch (error) {
      console.warn('Failed to load shared files:', error);
    }
  }

  private saveSharedFiles(): void {
    try {
      const files = Array.from(this.sharedFiles.values());
      this.localStorage.setItem('onusone-shared-files', JSON.stringify(files));
    } catch (error) {
      console.warn('Failed to save shared files:', error);
    }
  }
}

// Mock storage for SSR
class MockStorage implements Storage {
  private data: Map<string, string> = new Map();
  
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) || null; }
  key(index: number): string | null { return Array.from(this.data.keys())[index] || null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}
