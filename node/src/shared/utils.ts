// Utility functions for P2P node
import CryptoJS from 'crypto-js';
import { NetworkMessage, NetworkMessageType } from './types';

export const P2P_CONFIG = {
  DEFAULT_PORT: 8887,
  BOOTSTRAP_NODES: [
    '/dns4/bootstrap1.onusone.network/tcp/8887/p2p/12D3KooWBootstrap1',
    '/dns4/bootstrap2.onusone.network/tcp/8887/p2p/12D3KooWBootstrap2'
  ],
  IPFS_API_URL: 'http://localhost:5001',
  CONTENT_REPLICATION_FACTOR: 3,
  MAX_MESSAGE_SIZE: 10000,
  MAX_MESSAGES_PER_SECOND: 10,
  MAX_STORAGE_PER_NODE: 100,
  SIGNATURE_ALGORITHM: 'ECDSA',
  HASH_ALGORITHM: 'SHA256'
};

export const utils = {
  generateId: (): string => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  },
  
  sleep: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

export function generateContentHash(content: string): string {
  return CryptoJS.SHA256(content).toString();
}

export function createNetworkMessage(
  type: NetworkMessageType,
  payload: any,
  senderId: string,
  privateKey?: string
): NetworkMessage {
  const message: NetworkMessage = {
    type,
    payload,
    timestamp: new Date(),
    senderId,
    signature: '',
    version: 1
  };
  
  const messageString = JSON.stringify({
    type: message.type,
    payload: message.payload,
    timestamp: message.timestamp.toISOString(),
    senderId: message.senderId,
    version: message.version
  });
  
  message.signature = generateContentHash(messageString + (privateKey || 'dev-key'));
  return message;
}

export function verifyNetworkMessage(message: NetworkMessage, publicKey?: string): boolean {
  const messageString = JSON.stringify({
    type: message.type,
    payload: message.payload,
    timestamp: message.timestamp,
    senderId: message.senderId,
    version: message.version
  });
  
  const expectedSignature = generateContentHash(messageString + (publicKey || 'dev-key'));
  return message.signature === expectedSignature;
}

// Simplified IPFS manager
export const ipfsManager = {
  async storeContent(content: string): Promise<string> {
    return generateContentHash(content);
  },
  
  async retrieveContent(hash: string): Promise<string | null> {
    return null;
  }
};

// Simplified network health monitor
export const networkHealthMonitor = {
  updatePeerCount: (count: number) => {
    console.log(`Peer count updated: ${count}`);
  }
};