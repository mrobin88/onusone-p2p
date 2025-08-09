import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWalletAuth } from '../../components/WalletAuth';
import Button from '../../components/Button';

interface PostWithDecay {
  id: string;
  content: string;
  authorId: string;
  boardType: string;
  createdAt: string;
  engagements: number;
  decayScore: number;
  isVisible: boolean;
  stakeTotal?: number;
  burnedTotal?: number;
  lastEngagement?: string;
}

export default function DecayDebug() {
  const { user, isAuthenticated } = useWalletAuth();
  const [posts, setPosts] = useState<PostWithDecay[]>([]);
  const [board, setBoard] = useState('general');
  const [includeHidden, setIncludeHidden] = useState(true);
  const [loading, setLoading] = useState(false);

  const boards = ['general', 'technology', 'community', 'p2p-development', 'reputation'];

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const url = `/api/posts?board=${board}${includeHidden ? '&includeHidden=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [board, includeHidden, isAuthenticated]);

  const triggerBurn = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/decay/burn-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`🔥 Burn completed! ${result.totalBurned} ONU burned from ${result.burnEvents} posts`);
        fetchPosts(); // Refresh data
      } else {
        const error = await response.json();
        alert(`❌ Burn failed: ${error.error}`);
      }
    } catch (err) {
      alert(`❌ Burn error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const engagePost = async (postId: string) => {
    try {
      const response = await fetch('/api/posts/engage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          type: 'like',
          userId: user?.id
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`💫 Engagement boost: +${result.boost} decay points`);
        fetchPosts(); // Refresh data
      } else {
        alert('❌ Engagement failed');
      }
    } catch (err) {
      alert(`❌ Engagement error: ${err}`);
    }
  };

  const getDecayColor = (score: number) => {
    if (score <= 15) return 'text-red-400';
    if (score <= 30) return 'text-orange-400';
    if (score <= 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Decay Debug - OnusOne P2P</title>
        <meta name="description" content="Debug content decay system" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold">🔍 Decay Debug Dashboard</h1>
              <Link href="/boards">
                <Button variant="secondary" size="sm">← Back to Boards</Button>
              </Link>
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Board:</label>
                <select 
                  value={board} 
                  onChange={(e) => setBoard(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  {boards.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeHidden"
                  checked={includeHidden}
                  onChange={(e) => setIncludeHidden(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="includeHidden" className="text-sm">Show Hidden Content</label>
              </div>
              
              <Button 
                onClick={fetchPosts} 
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                {loading ? 'Loading...' : '🔄 Refresh'}
              </Button>
              
              <Button 
                onClick={triggerBurn} 
                disabled={loading}
                variant="primary"
                size="sm"
              >
                🔥 Trigger Burn
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-1">Total Posts</h3>
              <p className="text-xl font-bold text-blue-400">{posts.length}</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-1">Visible Posts</h3>
              <p className="text-xl font-bold text-green-400">
                {posts.filter(p => p.isVisible).length}
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-1">Hidden Posts</h3>
              <p className="text-xl font-bold text-red-400">
                {posts.filter(p => !p.isVisible).length}
              </p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-1">Avg Decay Score</h3>
              <p className="text-xl font-bold text-yellow-400">
                {posts.length > 0 ? Math.round(posts.reduce((acc, p) => acc + p.decayScore, 0) / posts.length) : 0}
              </p>
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className={`p-4 rounded-lg border ${
                  post.isVisible 
                    ? 'bg-gray-900 border-gray-700' 
                    : 'bg-gray-800 border-red-700 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-400">ID: {post.id.slice(-8)}</span>
                      <span className="text-sm text-gray-400">Author: {post.authorId}</span>
                      <span className="text-sm text-gray-400">Board: {post.boardType}</span>
                      {!post.isVisible && (
                        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">HIDDEN</span>
                      )}
                    </div>
                    <p className="text-gray-300 mb-2">{post.content}</p>
                    <div className="text-xs text-gray-500">
                      Created: {formatTime(post.createdAt)}
                      {post.lastEngagement && (
                        <span> • Last engagement: {formatTime(post.lastEngagement)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-right">
                    {/* Stake Info */}
                    {(post.stakeTotal && post.stakeTotal > 0) && (
                      <div>
                        <div className="text-xs text-gray-400">Stake</div>
                        <div className="text-purple-400 font-medium">
                          {post.stakeTotal - (post.burnedTotal || 0)} ONU
                        </div>
                        {post.burnedTotal && post.burnedTotal > 0 && (
                          <div className="text-xs text-red-500">-{post.burnedTotal} burned</div>
                        )}
                      </div>
                    )}
                    
                    {/* Decay Score */}
                    <div>
                      <div className="text-xs text-gray-400">Decay</div>
                      <div className={`text-xl font-bold ${getDecayColor(post.decayScore)}`}>
                        {post.decayScore}
                      </div>
                    </div>
                    
                    {/* Engagements */}
                    <div>
                      <div className="text-xs text-gray-400">Engagements</div>
                      <div className="text-blue-400 font-medium">{post.engagements}</div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      <Button
                        onClick={() => engagePost(post.id)}
                        size="sm"
                        variant="secondary"
                      >
                        ❤️ Boost
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {posts.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No posts found for board "{board}"</p>
              <p className="text-gray-500 text-sm mt-2">Create some posts to test the decay system!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
