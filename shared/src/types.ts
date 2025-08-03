/**
 * Core types for OnusOne P2P Network
 * Ported from Django models with Web3 enhancements
 */

// Board Types - Preset discussion categories
export enum BoardType {
  FINANCE = 'finance',
  WORK = 'work', 
  TECH = 'tech',
  CULTURE = 'culture',
  POLITICS = 'politics',
  HEALTH = 'health',
  EDUCATION = 'education',
  ENVIRONMENT = 'environment',
  RELATIONSHIPS = 'relationships',
  GENERAL = 'general'
}

// User Identity (Web3 + traditional)
export interface User {
  id: string;
  walletAddress?: string;  // Solana wallet
  username: string;
  bio?: string;
  avatarHash?: string;     // IPFS hash for avatar
  joinedAt: Date;
  reputationScore: number;
  totalContributions: number;
  isVerified: boolean;
}

// Message with Decay System
export interface Message {
  id: string;
  content: string;
  contentHash: string;      // IPFS hash for content
  authorId: string;
  boardType: BoardType;
  parentId?: string;        // For replies
  
  // Decay System (Core Innovation)
  decayScore: number;       // Current relevance score
  initialScore: number;     // Starting score (usually 100)
  lastEngagement: Date;     // Last time score was boosted
  isVisible: boolean;       // True if decayScore > 0
  
  // Engagement metrics
  replyCount: number;
  reactionCount: number;
  shareCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // P2P metadata
  ipfsHash: string;         // Content stored on IPFS
  authorSignature: string;  // Cryptographic signature
  networkVersion: number;   // Protocol version
}

// Message Reactions
export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  reactionType: ReactionType;
  createdAt: Date;
  signature: string;        // Cryptographic proof
}

export enum ReactionType {
  LIKE = 'like',
  DISLIKE = 'dislike', 
  LAUGH = 'laugh',
  ANGRY = 'angry',
  HEART = 'heart',
  ROCKET = 'rocket'
}

// Friendship System
export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: Date;
  status: FriendshipStatus;
}

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked'
}

// Network Node Information
export interface NetworkNode {
  peerId: string;           // libp2p peer ID
  multiaddrs: string[];     // Network addresses
  walletAddress?: string;   // For rewards
  services: NodeService[];  // What services this node provides
  reputation: number;       // Node reliability score
  uptime: number;          // Percentage uptime
  storageContributed: number; // GB contributed
  computeContributed: number; // Compute hours
  lastSeen: Date;
  version: string;         // Node software version
}

export enum NodeService {
  STORAGE = 'storage',       // IPFS content hosting
  COMPUTE = 'compute',       // Weekly summary generation  
  RELAY = 'relay',          // Message routing
  BOOTSTRAP = 'bootstrap'    // Network entry point
}

// Weekly Bounty System
export interface WeeklyBounty {
  id: string;
  boardType: BoardType;
  weekStart: Date;
  weekEnd: Date;
  totalReward: number;      // Tokens available
  status: BountyStatus;
  submissions: BountySubmission[];
  winner?: string;          // Winning submission ID
}

export enum BountyStatus {
  ACTIVE = 'active',        // Accepting submissions
  VOTING = 'voting',        // Community voting phase
  COMPLETED = 'completed',  // Winner selected, rewards paid
  CANCELLED = 'cancelled'   // No valid submissions
}

export interface BountySubmission {
  id: string;
  bountyId: string;
  authorId: string;
  summary: string;
  analysisHash: string;     // IPFS hash for full analysis
  submittedAt: Date;
  votes: number;
  qualityScore: number;     // Computed quality metric
  signature: string;
}

// P2P Network Messages
export interface NetworkMessage {
  type: NetworkMessageType;
  payload: any;
  timestamp: Date;
  senderId: string;
  signature: string;
  version: number;
}

export enum NetworkMessageType {
  // Content operations
  MESSAGE_CREATE = 'message_create',
  MESSAGE_UPDATE = 'message_update', 
  MESSAGE_REACTION = 'message_reaction',
  
  // Social operations
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPT = 'friend_accept',
  
  // Network operations
  NODE_ANNOUNCE = 'node_announce',
  NODE_HEARTBEAT = 'node_heartbeat',
  CONTENT_REQUEST = 'content_request',
  CONTENT_PROVIDE = 'content_provide',
  
  // Bounty operations
  BOUNTY_SUBMISSION = 'bounty_submission',
  BOUNTY_VOTE = 'bounty_vote'
}

// Storage and Indexing
export interface ContentIndex {
  messageId: string;
  boardType: BoardType;
  contentHash: string;
  decayScore: number;
  lastUpdated: Date;
  replicas: string[];      // Node IDs hosting this content
}

export interface StorageStats {
  totalMessages: number;
  totalStorage: number;    // Bytes
  averageDecayScore: number;
  boardDistribution: Record<BoardType, number>;
  replicationFactor: number;
}