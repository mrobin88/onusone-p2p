import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';

export default NextAuth({
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // persist user id in token
        (token as any).uid = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      // expose id on session.user
      if (session?.user) {
        (session.user as any).id = (token as any).uid;
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
        const username = credentials?.username?.trim();
        const password = credentials?.password?.trim();
        if (!username || !password) return null;
        // KV user lookup
        const userKey = `user:${username.toLowerCase()}`;
        const user: any = await kv.hgetall(userKey);
        if (user && user.passwordHash) {
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (ok) return { id: user.id, name: user.username, email: user.email } as any;
        }
        return null;
      }
    })
  ]
});


