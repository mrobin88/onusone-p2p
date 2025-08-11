import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { kv } from '../../../lib/kv-wrapper';

export default NextAuth({
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // persist user id in token
        (token as any).uid = (user as any).id;
        (token as any).username = (user as any).username;
        (token as any).walletAddress = (user as any).walletAddress;
      }
      return token;
    },
    async session({ session, token }) {
      // expose user data on session
      if (session?.user) {
        (session.user as any).id = (token as any).uid;
        (session.user as any).username = (token as any).username;
        (session.user as any).walletAddress = (token as any).walletAddress;
      }
      return session;
    }
  },
  providers: [
    Credentials({
      id: 'wallet',
      name: 'Wallet',
      credentials: {
        walletAddress: { label: 'Wallet Address', type: 'text' }
      },
      authorize: async (credentials) => {
        try {
          const walletAddress = credentials?.walletAddress?.trim();
          
          if (!walletAddress) {
            console.log('Missing wallet address');
            return null;
          }

          // Look up user by wallet address
          const userKey = `user:${walletAddress.toLowerCase()}`;
          const user: any = await kv.hgetall(userKey);
          
          if (!user || Object.keys(user).length === 0) {
            console.log('Wallet user not found:', walletAddress);
            return null;
          }

          // Check if user is active
          if (user.isActive === false) {
            console.log('Wallet user account disabled:', walletAddress);
            return null;
          }

          // Return user data for wallet auth
          return {
            id: user.id,
            name: user.username,
            email: user.email,
            username: user.username,
            walletAddress: user.walletAddress,
            reputationScore: user.reputationScore || 0
          } as any;

        } catch (error) {
          console.error('Wallet auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/login'
  },
  secret: process.env.NEXTAUTH_SECRET
});


