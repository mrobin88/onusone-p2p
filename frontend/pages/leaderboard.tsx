import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useLocalAuth } from '../components/LocalAuth';
import ReputationDisplay from '../components/ReputationDisplay';

interface LeaderboardUser {
  position: number;
  userId: string;
  username: string;
  walletAddress?: string;
  currentScore: number;
  rank: string;
  rankColor: string;
  badges: string[];
  stats: {
    postsCreated: number;
    postsLiked: number;
    commentsCreated: number;
    tokensStaked: number;
    daysActive: number;
  };
  lastActivity: string;
  joinedDate: string;
}

interface TrendingUser {
  userId: string;
  username: string;
  currentScore: number;
  recentPoints: number;
  rank: string;
}

interface GlobalStats {
  totalUsers: number;
  totalActions: number;
  totalPoints: number;
  actionsToday: number;
  pointsToday: number;
  actionsYesterday: number;
  averageScore: number;
}

export default function Leaderboard() {
  const { user, isAuthenticated } = useLocalAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [trending, setTrending] = useState<TrendingUser[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const USERS_PER_PAGE = 25;

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/reputation/leaderboard?limit=${USERS_PER_PAGE}&offset=${currentPage * USERS_PER_PAGE}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const data = await response.json();
        
        if (data.success) {
          if (currentPage === 0) {
            setLeaderboard(data.leaderboard);
          } else {
            setLeaderboard(prev => [...prev, ...data.leaderboard]);
          }
          setTrending(data.trending);
          setGlobalStats(data.globalStats);
          setHasMore(data.pagination.hasMore);
        } else {
          throw new Error(data.error || 'Unknown error');
        }

      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setError(error instanceof Error ? error.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentPage]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const getRankIcon = (rank: string) => {
    const icons: Record<string, string> = {
      'Newcomer': '🆕',
      'Contributor': '📝',
      'Regular': '⭐',
      'Veteran': '🎖️',
      'Expert': '🏆',
      'Legend': '👑',
      'Pioneer': '🚀'
    };
    return icons[rank] || '📊';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffDays = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <>
      <Head>
        <title>Reputation Leaderboard - OnusOne</title>
        <meta name="description" content="Top contributors on OnusOne ranked by reputation score" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🏆 Reputation Leaderboard
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Discover the most valued contributors in the OnusOne community. 
              Reputation is earned through quality posts, helpful engagement, and token staking.
            </p>
          </div>

          {/* Global Stats */}
          {globalStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{globalStats.totalUsers.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{globalStats.totalActions.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Actions</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{globalStats.actionsToday}</div>
                <div className="text-sm text-gray-400">Actions Today</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{globalStats.averageScore}</div>
                <div className="text-sm text-gray-400">Average Score</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Leaderboard */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-6">Top Contributors</h2>
                
                {error ? (
                  <div className="text-center py-8">
                    <div className="text-red-400 mb-4">{error}</div>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaderboard.map((user, index) => (
                      <div
                        key={user.userId}
                        className={`flex items-center p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                          user.position <= 3
                            ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-600'
                            : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        {/* Position */}
                        <div className="w-12 text-center">
                          {user.position <= 3 ? (
                            <span className="text-2xl">
                              {user.position === 1 ? '🥇' : user.position === 2 ? '🥈' : '🥉'}
                            </span>
                          ) : (
                            <span className="text-xl font-bold text-gray-400">#{user.position}</span>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 ml-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <Link href={`/users/${user.username}`} className="hover:text-blue-400 transition-colors">
                              <span className="font-semibold text-lg">{user.username}</span>
                            </Link>
                            <span className="text-lg">{getRankIcon(user.rank)}</span>
                            <span className={`text-sm px-2 py-1 rounded`} style={{ color: user.rankColor }}>
                              {user.rank}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-400">
                            <span>{user.stats.postsCreated} posts</span>
                            <span>{user.stats.tokensStaked} ONU staked</span>
                            <span>{user.stats.daysActive} days active</span>
                            <span>Last seen {formatTimeAgo(user.lastActivity)}</span>
                          </div>

                          {/* Badges */}
                          {user.badges.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              {user.badges.slice(0, 3).map((badge, badgeIndex) => (
                                <span
                                  key={badgeIndex}
                                  className="px-2 py-1 bg-yellow-900/50 border border-yellow-700 rounded text-xs text-yellow-400"
                                >
                                  ⭐ {badge}
                                </span>
                              ))}
                              {user.badges.length > 3 && (
                                <span className="text-xs text-gray-500">+{user.badges.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className="text-2xl font-bold" style={{ color: user.rankColor }}>
                            {user.currentScore.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400">reputation</div>
                        </div>
                      </div>
                    ))}

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="text-center pt-6">
                        <button
                          onClick={loadMore}
                          disabled={loading}
                          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Loading...' : 'Load More'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* User's Reputation */}
              {isAuthenticated && user && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Your Reputation</h3>
                  <ReputationDisplay userId={user.id} compact={false} />
                </div>
              )}

              {/* Trending Users */}
              {trending.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">🔥 Trending</h3>
                  <div className="space-y-3">
                    {trending.map((user, index) => (
                      <div key={user.userId} className="flex items-center justify-between">
                        <div>
                          <Link href={`/users/${user.username}`} className="hover:text-blue-400 transition-colors">
                            <span className="font-medium">{user.username}</span>
                          </Link>
                          <div className="text-xs text-gray-400">{user.rank}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-medium">+{user.recentPoints}</div>
                          <div className="text-xs text-gray-400">24h</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reputation Guide */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">📈 How to Earn Reputation</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Create posts</span>
                    <span className="text-green-400">+5 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Helpful replies</span>
                    <span className="text-green-400">+15 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stake tokens</span>
                    <span className="text-green-400">+10 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Get featured</span>
                    <span className="text-green-400">+50 points</span>
                  </div>
                </div>
              </div>

              {/* Quick Navigation */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/boards" className="block text-blue-400 hover:text-blue-300 transition-colors">
                    📝 Create Posts
                  </Link>
                  <Link href="/tokenomics-real" className="block text-purple-400 hover:text-purple-300 transition-colors">
                    💰 Token Dashboard
                  </Link>
                  <Link href="/account" className="block text-green-400 hover:text-green-300 transition-colors">
                    👤 Your Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
