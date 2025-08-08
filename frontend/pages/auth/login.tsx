import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useLocalAuth } from '../../components/LocalAuth';
import Button from '../../components/Button';

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { login, isAuthenticated } = useLocalAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated || session) {
      router.push('/');
    }
  }, [isAuthenticated, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try NextAuth credentials first
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });
      if (result?.ok) {
        router.push('/');
        return;
      }
      // Fallback to local auth demo
      const success = await login(username, password);
      if (success) router.push('/');
      else setError('Invalid credentials. Try admin/admin');
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = () => {
    setUsername('admin');
    setPassword('admin');
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Already Logged In</h1>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Login - OnusOne P2P</title>
        <meta name="description" content="Login to OnusOne P2P Network" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-400">Login to the P2P Network</p>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-900 border border-red-700 text-red-300 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-3">Demo Account:</p>
                <Button
                  onClick={handleQuickLogin}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  Use admin/admin
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                onClick={() => router.push('/')}
                variant="secondary"
                size="sm"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}