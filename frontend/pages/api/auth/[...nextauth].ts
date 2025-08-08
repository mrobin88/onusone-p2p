import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

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
        if (username === 'admin' && password === 'admin') {
          return { id: '1', name: 'admin', email: 'admin@onusone.com' };
        }
        return null;
      }
    })
  ]
});


