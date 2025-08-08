import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';

export default NextAuth({
  session: { strategy: 'jwt' },
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
        // Demo fallback
        if (username === 'admin' && password === 'admin') {
          return { id: '1', name: 'admin', email: 'admin@onusone.com' } as any;
        }
        return null;
      }
    })
  ]
});


