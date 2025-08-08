import React, { createContext, useContext } from 'react';
import { useSession, signIn } from 'next-auth/react';

interface User {
  id: string;
  username: string;
  email?: string;
  walletAddress?: string;
  reputationScore?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const user = status === 'authenticated' && session?.user?.name
    ? { 
        id: (session.user as any).id || session.user.name,
        username: (session.user as any).username || session.user.name,
        email: session.user.email,
        walletAddress: (session.user as any).walletAddress,
        reputationScore: (session.user as any).reputationScore || 0
      }
    : null;

  const login = async (username: string, password: string) => {
    return signIn('credentials', { username, password, redirect: false });
  };

  const logout = () => {
    // NextAuth handles logout automatically
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: status === 'authenticated',
      login,
      logout,
      loading: status === 'loading',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useLocalAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useLocalAuth must be used within a LocalAuthProvider');
  }
  return context;
}