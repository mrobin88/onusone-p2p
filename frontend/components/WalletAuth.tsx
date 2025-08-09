/**
 * Pure Wallet Authentication Context
 * NO KV STORE, NO PASSWORDS, NO NEXTAUTH - ONLY WALLET IDENTITY
 * Your wallet IS your account. Period.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletAuthSystem, WalletProfile } from '../lib/wallet-auth-system';

interface WalletUser {
  walletAddress: string;
  publicKey: string;
  displayName: string;
  totalPosts: number;
  totalStaked: number;
  reputation: number;
  networkTime: string;
  joinedAt: string;
}

interface WalletAuthContextType {
  user: WalletUser | null;
  profile: WalletProfile | null;
  isAuthenticated: boolean;
  isConnecting: boolean;
  login: () => Promise<boolean>;
  logout: () => void;
  addPost: (content: string, boardSlug: string) => void;
  addStake: (postId: string, amount: number, txHash: string) => void;
}

const WalletAuthContext = createContext<WalletAuthContextType | undefined>(undefined);

export function WalletAuthProvider({ children }: { children: React.ReactNode }) {
  const { connected, publicKey, disconnect } = useWallet();
  const [user, setUser] = useState<WalletUser | null>(null);
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-login when wallet connects
  useEffect(() => {
    if (connected && publicKey && !user) {
      handleAutoLogin();
    } else if (!connected && user) {
      handleLogout();
    }
  }, [connected, publicKey, user]);

  // Load existing session on page load
  useEffect(() => {
    loadExistingSession();
  }, []);

  const loadExistingSession = () => {
    try {
      const session = WalletAuthSystem.getCurrentSession();
      const profile = WalletAuthSystem.getCurrentProfile();
      
      if (session && profile && session.isConnected) {
        setProfile(profile);
        setUser({
          walletAddress: profile.walletAddress,
          publicKey: profile.publicKey,
          displayName: profile.displayName,
          totalPosts: profile.totalPosts,
          totalStaked: profile.totalStaked,
          reputation: profile.reputation,
          networkTime: formatTime(profile.networkTime),
          joinedAt: new Date(profile.joinedAt).toLocaleDateString()
        });
        console.log(`🔑 Restored wallet session: ${profile.displayName}`);
      }
    } catch (error) {
      console.error('Error loading existing session:', error);
    }
  };

  const handleAutoLogin = async (): Promise<boolean> => {
    if (!connected || !publicKey) return false;

    setIsConnecting(true);
    
    try {
      const walletAddress = publicKey.toString();
      
      // Create or load profile
      const profile = WalletAuthSystem.getOrCreateProfile(walletAddress, walletAddress);
      
      // Create session
      WalletAuthSystem.createSession(walletAddress, walletAddress);
      
      // Set user state
      setProfile(profile);
      setUser({
        walletAddress: profile.walletAddress,
        publicKey: profile.publicKey,
        displayName: profile.displayName,
        totalPosts: profile.totalPosts,
        totalStaked: profile.totalStaked,
        reputation: profile.reputation,
        networkTime: formatTime(profile.networkTime),
        joinedAt: new Date(profile.joinedAt).toLocaleDateString()
      });
      
      console.log(`✅ Wallet authenticated: ${profile.displayName}`);
      return true;
      
    } catch (error) {
      console.error('Auto-login failed:', error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const login = async (): Promise<boolean> => {
    if (!connected || !publicKey) {
      console.warn('Wallet not connected');
      return false;
    }
    
    return handleAutoLogin();
  };

  const handleLogout = () => {
    WalletAuthSystem.clearSession();
    setUser(null);
    setProfile(null);
    disconnect();
    console.log('🚪 Wallet logged out');
  };

  const addPost = (content: string, boardSlug: string) => {
    try {
      const post = WalletAuthSystem.addPost(content, boardSlug);
      
      // Update user state
      const updatedProfile = WalletAuthSystem.getCurrentProfile();
      if (updatedProfile) {
        setProfile(updatedProfile);
        setUser(prev => prev ? {
          ...prev,
          totalPosts: updatedProfile.totalPosts
        } : null);
      }
      
      console.log('📝 Post added successfully');
    } catch (error) {
      console.error('Error adding post:', error);
      throw error;
    }
  };

  const addStake = (postId: string, amount: number, txHash: string) => {
    try {
      WalletAuthSystem.addStake(postId, amount, txHash);
      
      // Update user state
      const updatedProfile = WalletAuthSystem.getCurrentProfile();
      if (updatedProfile) {
        setProfile(updatedProfile);
        setUser(prev => prev ? {
          ...prev,
          totalStaked: updatedProfile.totalStaked,
          reputation: updatedProfile.reputation
        } : null);
      }
      
      console.log(`💰 Stake added: ${amount} ONU`);
    } catch (error) {
      console.error('Error adding stake:', error);
      throw error;
    }
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const value: WalletAuthContextType = {
    user,
    profile,
    isAuthenticated: !!user && connected,
    isConnecting,
    login,
    logout: handleLogout,
    addPost,
    addStake
  };

  return (
    <WalletAuthContext.Provider value={value}>
      {children}
    </WalletAuthContext.Provider>
  );
}

export function useWalletAuth() {
  const context = useContext(WalletAuthContext);
  if (context === undefined) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider');
  }
  return context;
}

export default WalletAuthProvider;
