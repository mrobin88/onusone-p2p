/**
 * Simplified Account Management System
 * Guest mode + simple wallet connection - no switching confusion
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';

interface SimpleUser {
  id: string;
  username: string;
  walletAddress?: string;
  publicKey?: string;
  isGuest: boolean;
  totalPosts: number;
  joinedAt: string;
}

interface SimpleAuthContextType {
  user: SimpleUser | null;
  isAuthenticated: boolean;
  isConnecting: boolean;
  isGuest: boolean;
  canPost: boolean;
  login: () => Promise<boolean>;
  logout: () => void;
  createGuestAccount: () => void;
  connectWallet: () => Promise<boolean>;
  addPost: (content: string, boardSlug: string) => any;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export function WalletAuthProvider({ children }: { children: React.ReactNode }) {
  const { connected, publicKey, connect, disconnect } = useWallet();
  const router = useRouter();
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load existing session on page load
  useEffect(() => {
    loadExistingSession();
  }, []);

  // Handle wallet connection changes
  useEffect(() => {
    if (connected && publicKey && !user?.walletAddress) {
      handleWalletConnected();
    }
  }, [connected, publicKey, user]);

  const loadExistingSession = () => {
    try {
      const session = localStorage.getItem('onusone-session');
      if (session) {
        const sessionData = JSON.parse(session);
        setUser(sessionData.user);
        console.log(`🔑 Restored session: ${sessionData.user.username}`);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const createGuestAccount = () => {
    const guestId = 'guest_' + Date.now();
    const guestUser: SimpleUser = {
      id: guestId,
      username: `Guest${Math.floor(Math.random() * 1000)}`,
      isGuest: true,
      totalPosts: 0,
      joinedAt: new Date().toLocaleDateString()
    };

    setUser(guestUser);
    saveSession(guestUser);
    console.log(`👤 Created guest account: ${guestUser.username}`);
  };

  const handleWalletConnected = async () => {
    if (!publicKey) return;

    const walletAddress = publicKey.toString();
    const shortAddress = walletAddress.slice(0, 4) + '...' + walletAddress.slice(-4);
    
    // Convert guest to wallet user or create new wallet user
    const newUser: SimpleUser = {
      id: walletAddress,
      username: user?.isGuest ? user.username : `User${Math.floor(Math.random() * 1000)}`,
      walletAddress,
      publicKey: publicKey.toString(),
      isGuest: false,
      totalPosts: user?.totalPosts || 0,
      joinedAt: user?.joinedAt || new Date().toLocaleDateString()
    };

    setUser(newUser);
    saveSession(newUser);
    console.log(`🔗 Wallet connected: ${shortAddress}`);
  };

  const connectWallet = async (): Promise<boolean> => {
    setIsConnecting(true);
    try {
      await connect();
      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const login = async (): Promise<boolean> => {
    // If no user exists, create guest account
    if (!user) {
      createGuestAccount();
      return true;
    }
    
    // If guest user, try to connect wallet
    if (user.isGuest) {
      return await connectWallet();
    }
    
    return true;
  };

  const logout = () => {
    if (user) {
      console.log(`👋 Logging out: ${user.username}`);
      
      // Clear session
      localStorage.removeItem('onusone-session');
      
      // Disconnect wallet if connected
      if (connected) {
        disconnect();
      }
      
      setUser(null);
      router.push('/');
    }
  };

  const saveSession = (userData: SimpleUser) => {
    const session = {
      user: userData,
      timestamp: Date.now()
    };
    localStorage.setItem('onusone-session', JSON.stringify(session));
  };

  const addPost = (content: string, boardSlug: string) => {
    if (!user) return null;
    
    // Update user stats
    const updatedUser = { ...user, totalPosts: user.totalPosts + 1 };
    setUser(updatedUser);
    saveSession(updatedUser);
    
    // Return post data for API call
    return {
      id: Date.now().toString(),
      content,
      author: user.username,
      boardSlug,
      timestamp: Date.now(),
      isGuest: user.isGuest
    };
  };

  return (
    <SimpleAuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isConnecting,
      isGuest: user?.isGuest || false,
      canPost: !!user && (!!user.walletAddress || user.isGuest),
      login,
      logout,
      createGuestAccount,
      connectWallet,
      addPost
    }}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useWalletAuth() {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider');
  }
  return context;
}
