// Copy of shared types for standalone operation
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

export interface Message {
  id: string;
  content: string;
  contentHash: string;
  authorId: string;
  boardType: BoardType;
  parentId?: string;
  
  decayScore: number;
  initialScore: number;
  lastEngagement: Date;
  isVisible: boolean;
  
  replyCount: number;
  reactionCount: number;
  shareCount: number;
  
  createdAt: Date;
  updatedAt: Date;
  
  ipfsHash: string;
  authorSignature: string;
  networkVersion: number;
}

export interface NetworkMessage {
  type: NetworkMessageType;
  payload: any;
  timestamp: Date;
  senderId: string;
  signature: string;
  version: number;
}

export enum NetworkMessageType {
  MESSAGE_CREATE = 'message_create',
  MESSAGE_UPDATE = 'message_update', 
  MESSAGE_REACTION = 'message_reaction',
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPT = 'friend_accept',
  NODE_ANNOUNCE = 'node_announce',
  NODE_HEARTBEAT = 'node_heartbeat',
  CONTENT_REQUEST = 'content_request',
  CONTENT_PROVIDE = 'content_provide',
  BOUNTY_SUBMISSION = 'bounty_submission',
  BOUNTY_VOTE = 'bounty_vote'
}