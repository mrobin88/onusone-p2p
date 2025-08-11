/**
 * Core types for OnusOne P2P Network
 * Ported from Django models with Web3 enhancements
 */

export interface Peer {
  id: string;
  address: string;
  port: number;
  lastSeen: Date;
  reputation: number;
  isConnected: boolean;
}

export interface Message {
  id: string;
  content: string;
  author: string;
  stake: number;
  timestamp: Date;
  boardId: string;
  engagement: Engagement;
  decayScore: number;
  isExpired: boolean;
  ipfsHash?: string;
  transactionHash?: string;
}

export interface Engagement {
  likes: number;
  comments: number;
  shares: number;
  totalStakes: number;
  lastEngagement: Date;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  minStake: number;
  maxStake: number;
  messageCount: number;
  totalStakes: number;
  createdAt: Date;
}

export interface User {
  walletAddress: string;
  username?: string;
  reputation: number;
  totalStakes: number;
  dailyStakes: number;
  lastActive: Date;
  isNodeOperator: boolean;
}

export interface NodeStatus {
  nodeId: string;
  isOnline: boolean;
  peerCount: number;
  messageCount: number;
  storageUsed: number;
  lastSync: Date;
  version: string;
}

export interface P2PConnection {
  isConnected: boolean;
  peerCount: number;
  networkHealth: 'excellent' | 'good' | 'poor' | 'offline';
  lastMessage: Date;
  error?: string;
}

export interface TokenTransaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  type: 'stake' | 'reward' | 'burn' | 'transfer';
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface DecayCalculation {
  baseStake: number;
  engagementMultiplier: number;
  timeFactor: number;
  reputationMultiplier: number;
  finalScore: number;
  willExpire: boolean;
  estimatedExpiry: Date;
}

export interface NetworkMetrics {
  totalPeers: number;
  totalMessages: number;
  totalStakes: number;
  averageDecayTime: number;
  networkUptime: number;
  lastUpdate: Date;
}

export interface ContentMarketplace {
  messageId: string;
  currentPrice: number;
  totalBids: number;
  highestBid: number;
  auctionEndTime: Date;
  isActive: boolean;
}

export interface CrossChainBridge {
  sourceChain: 'solana' | 'ethereum';
  targetChain: 'solana' | 'ethereum';
  tokenAmount: number;
  bridgeFee: number;
  estimatedTime: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface SecurityMetrics {
  failedAttempts: number;
  blockedAddresses: number;
  lastSecurityScan: Date;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeProtections: string[];
}

export interface EmergencyControls {
  isActive: boolean;
  reason: string;
  activatedAt: Date;
  affectedFeatures: string[];
  estimatedResolution: Date;
}

export interface IPFSContent {
  hash: string;
  size: number;
  type: string;
  timestamp: Date;
  pinStatus: 'pinned' | 'unpinned' | 'pinning';
  replicationFactor: number;
}

export interface LibP2PConfig {
  peerId: string;
  listenAddresses: string[];
  bootstrapPeers: string[];
  enableWebRTC: boolean;
  enableTCP: boolean;
  enableWebSockets: boolean;
  maxConnections: number;
  connectionTimeout: number;
}

export interface SolanaConfig {
  network: 'mainnet-beta' | 'devnet' | 'testnet';
  rpcEndpoint: string;
  wsEndpoint: string;
  programId: string;
  tokenMint: string;
  treasuryAddress: string;
}

export interface EnvironmentConfig {
  nodeEnv: 'development' | 'staging' | 'production';
  port: number;
  host: string;
  corsOrigins: string[];
  rateLimitWindow: number;
  rateLimitMax: number;
  enableMetrics: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}