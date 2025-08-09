/**
 * Pure Wallet-First Authentication System
 * NO KV STORE, NO PASSWORDS, NO USERNAMES
 * Your wallet IS your identity. Period.
 */

import { PublicKey } from '@solana/web3.js';

export interface WalletProfile {
  walletAddress: string;
  publicKey: string;
  displayName: string;      // Auto-generated from wallet
  joinedAt: number;         // Unix timestamp
  totalPosts: number;
  totalStaked: number;
  networkTime: number;      // Time spent online (ms)
  lastSeen: number;
  reputation: number;
  posts: WalletPost[];
  stakes: WalletStake[];
}

export interface WalletPost {
  id: string;
  content: string;
  boardSlug: string;
  createdAt: number;
  signature: string;        // Signed by wallet
  stakeTotal: number;
  engagements: number;
}

export interface WalletStake {
  postId: string;
  amount: number;
  timestamp: number;
  transactionHash: string;
}

export interface WalletSession {
  walletAddress: string;
  publicKey: string;
  isConnected: boolean;
  sessionStart: number;
  lastActivity: number;
}

/**
 * Wallet Authentication Manager
 * Everything stored in localStorage, synced via P2P later
 */
export class WalletAuthSystem {
  private static readonly PROFILE_KEY = 'onusone-wallet-profile';
  private static readonly SESSION_KEY = 'onusone-wallet-session';
  
  /**
   * Create or load wallet profile
   */
  static getOrCreateProfile(walletAddress: string, publicKey: string): WalletProfile {
    try {
      const existing = localStorage.getItem(this.PROFILE_KEY);
      if (existing) {
        const profile: WalletProfile = JSON.parse(existing);
        if (profile.walletAddress === walletAddress) {
          // Update last seen
          profile.lastSeen = Date.now();
          this.saveProfile(profile);
          return profile;
        }
      }

      // Create new profile
      const profile: WalletProfile = {
        walletAddress,
        publicKey,
        displayName: this.generateDisplayName(walletAddress),
        joinedAt: Date.now(),
        totalPosts: 0,
        totalStaked: 0,
        networkTime: 0,
        lastSeen: Date.now(),
        reputation: 100, // Starting reputation
        posts: [],
        stakes: []
      };

      this.saveProfile(profile);
      console.log(`🔑 Created wallet profile for ${this.truncateWallet(walletAddress)}`);
      return profile;

    } catch (error) {
      console.error('Error loading wallet profile:', error);
      throw new Error('Failed to create wallet profile');
    }
  }

  /**
   * Save profile to localStorage
   */
  static saveProfile(profile: WalletProfile): void {
    try {
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving wallet profile:', error);
    }
  }

  /**
   * Get current wallet profile
   */
  static getCurrentProfile(): WalletProfile | null {
    try {
      const stored = localStorage.getItem(this.PROFILE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading current profile:', error);
      return null;
    }
  }

  /**
   * Create wallet session
   */
  static createSession(walletAddress: string, publicKey: string): WalletSession {
    const session: WalletSession = {
      walletAddress,
      publicKey,
      isConnected: true,
      sessionStart: Date.now(),
      lastActivity: Date.now()
    };

    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      console.log(`✅ Wallet session created for ${this.truncateWallet(walletAddress)}`);
    } catch (error) {
      console.error('Error saving wallet session:', error);
    }

    return session;
  }

  /**
   * Get current session
   */
  static getCurrentSession(): WalletSession | null {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading session:', error);
      return null;
    }
  }

  /**
   * Update session activity
   */
  static updateActivity(): void {
    const session = this.getCurrentSession();
    if (session) {
      session.lastActivity = Date.now();
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      
      // Update network time in profile
      const profile = this.getCurrentProfile();
      if (profile) {
        const timeOnline = session.lastActivity - session.sessionStart;
        profile.networkTime += timeOnline;
        profile.lastSeen = Date.now();
        this.saveProfile(profile);
      }
    }
  }

  /**
   * Add post to profile
   */
  static addPost(content: string, boardSlug: string): WalletPost {
    const profile = this.getCurrentProfile();
    if (!profile) throw new Error('No wallet profile found');

    const post: WalletPost = {
      id: this.generatePostId(),
      content,
      boardSlug,
      createdAt: Date.now(),
      signature: this.generateSignature(content, profile.walletAddress),
      stakeTotal: 0,
      engagements: 0
    };

    profile.posts.unshift(post); // Add to beginning
    profile.totalPosts++;
    profile.lastSeen = Date.now();
    
    this.saveProfile(profile);
    console.log(`📝 Post added to ${this.truncateWallet(profile.walletAddress)}`);
    
    return post;
  }

  /**
   * Add stake to profile
   */
  static addStake(postId: string, amount: number, transactionHash: string): void {
    const profile = this.getCurrentProfile();
    if (!profile) throw new Error('No wallet profile found');

    const stake: WalletStake = {
      postId,
      amount,
      timestamp: Date.now(),
      transactionHash
    };

    profile.stakes.push(stake);
    profile.totalStaked += amount;
    profile.reputation += Math.floor(amount * 0.1); // Stake increases reputation
    
    this.saveProfile(profile);
    console.log(`💰 Stake added: ${amount} ONU`);
  }

  /**
   * Clear session (logout)
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      console.log('🚪 Wallet session cleared');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Check if wallet is authenticated
   */
  static isAuthenticated(): boolean {
    const session = this.getCurrentSession();
    return session?.isConnected === true;
  }

  /**
   * Get wallet display info
   */
  static getDisplayInfo(): { address: string; displayName: string; reputation: number } | null {
    const profile = this.getCurrentProfile();
    if (!profile) return null;

    return {
      address: profile.walletAddress,
      displayName: profile.displayName,
      reputation: profile.reputation
    };
  }

  /**
   * Generate display name from wallet address
   */
  private static generateDisplayName(walletAddress: string): string {
    const prefix = walletAddress.slice(0, 4);
    const suffix = walletAddress.slice(-4);
    return `${prefix}...${suffix}`;
  }

  /**
   * Truncate wallet for logging
   */
  private static truncateWallet(walletAddress: string): string {
    return `${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`;
  }

  /**
   * Generate post ID
   */
  private static generatePostId(): string {
    return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate content signature (mock for now, would use real wallet signing)
   */
  private static generateSignature(content: string, walletAddress: string): string {
    // In real implementation, this would use wallet.signMessage()
    const message = `${content}_${walletAddress}_${Date.now()}`;
    return `sig_${btoa(message).substr(0, 16)}`;
  }

  /**
   * Get user stats for profile display
   */
  static getUserStats(): {
    totalPosts: number;
    totalStaked: number;
    networkTime: string;
    reputation: number;
    joinedAt: string;
  } | null {
    const profile = this.getCurrentProfile();
    if (!profile) return null;

    return {
      totalPosts: profile.totalPosts,
      totalStaked: profile.totalStaked,
      networkTime: this.formatTime(profile.networkTime),
      reputation: profile.reputation,
      joinedAt: new Date(profile.joinedAt).toLocaleDateString()
    };
  }

  /**
   * Format milliseconds to readable time
   */
  private static formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }

  /**
   * Export profile for P2P sync (future feature)
   */
  static exportForP2P(): string {
    const profile = this.getCurrentProfile();
    if (!profile) throw new Error('No profile to export');

    return JSON.stringify({
      ...profile,
      exportedAt: Date.now(),
      signature: this.generateSignature(JSON.stringify(profile), profile.walletAddress)
    });
  }
}

// Auto-update activity every 30 seconds if session exists
setInterval(() => {
  if (WalletAuthSystem.isAuthenticated()) {
    WalletAuthSystem.updateActivity();
  }
}, 30000);

export default WalletAuthSystem;
