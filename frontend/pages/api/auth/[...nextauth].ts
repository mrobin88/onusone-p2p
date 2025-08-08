import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { kv } from '../../../lib/kv-wrapper';
import bcrypt from 'bcryptjs';

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
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        try {
          const username = credentials?.username?.trim();
          const password = credentials?.password?.trim();
          
          if (!username || !password) {
            console.log('Missing credentials');
            return null;
          }

          // Look up user by username
          const userKey = `user:${username.toLowerCase()}`;
          const user: any = await kv.hgetall(userKey);
          
          if (!user || Object.keys(user).length === 0) {
            console.log('User not found:', username);
            return null;
          }

          // Check if user is active
          if (user.isActive === false) {
            console.log('User account disabled:', username);
            return null;
          }

          // Verify password
          if (!user.passwordHash) {
            console.log('No password hash for user:', username);
            return null;
          }

          const passwordValid = await bcrypt.compare(password, user.passwordHash);
          if (!passwordValid) {
            console.log('Invalid password for user:', username);
            return null;
          }

          // Return user data (without sensitive info)
          return {
            id: user.id,
            name: user.username,
            email: user.email,
            username: user.username,
            walletAddress: user.walletAddress,
            reputationScore: user.reputationScore || 0
          } as any;

        } catch (error) {
          console.error('Auth error:', error);
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


