import React, { useState, useEffect } from 'react';
import { useLocalAuth } from './LocalAuth';
import { ReputationActionType } from '../lib/reputation-manager';
import Button from './Button';

interface ReputationData {
  userId: string;
  currentScore: number;
  totalPoints: number;
  rank: string;
  percentile: number;
  actionsCount: number;
  lastActivity: string;
  joinedDate: string;
  badges: string[];
  stats: {
    postsCreated: number;
    postsLiked: number;
    commentsCreated: number;
    tokensStaked: number;
    daysActive: number;
    helpfulReplies: number;
    contentFeatured: number;
    flagsReceived: number;
  };
}

interface ReputationSummary {
  rank: {
    rank: string;
    color: string;
    progress: number;
  };
  badges: string[];
  nextRankPoints: number;
  recentTrend: 'up' | 'down' | 'stable';
  strengths: string[];
  suggestions: string[];
}

interface ReputationAction {
  id: string;
  action: string;
  points: number;
  reason: string;
  timestamp: string;
  relatedContent?: string;
}

interface ReputationDisplayProps {
  userId?: string;
  compact?: boolean;
  showActions?: boolean;
  className?: string;
}

export default function ReputationDisplay({
  userId,
  compact = false,
  showActions = false,
  className = ''
}: ReputationDisplayProps) {
  const { user } = useLocalAuth();
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [summary, setSummary] = useState<ReputationSummary | null>(null);
  const [recentActions, setRecentActions] = useState<ReputationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullActions, setShowFullActions] = useState(false);

  const targetUserId = userId || user?.id;

  // Fetch reputation data
  useEffect(() => {
    const fetchReputation = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/reputation/user/${targetUserId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch reputation data');
        }

        const data = await response.json();
        
        if (data.success) {
          setReputation(data.reputation);
          setSummary(data.summary);
          setRecentActions(data.recentActions || []);
        } else {
          throw new Error(data.error || 'Unknown error');
        }

      } catch (error) {
        console.error('Failed to fetch reputation:', error);
        setError(error instanceof Error ? error.message : 'Failed to load reputation');
      } finally {
        setLoading(false);
      }
    };

    fetchReputation();
  }, [targetUserId]);

  // Track reputation action
  const trackAction = async (action: ReputationActionType, reason: string, relatedContent?: string) => {
    if (!targetUserId) return;

    try {
      const response = await fetch('/api/reputation/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetUserId,
          action,
          reason,
          relatedContent
        })
      });

      if (response.ok) {
        // Refresh reputation data
        window.location.reload(); // Simple refresh for now
      }
    } catch (error) {
      console.error('Failed to track reputation action:', error);
    }
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      'Newcomer': 'text-gray-400',
      'Contributor': 'text-blue-400', 
      'Regular': 'text-green-400',
      'Veteran': 'text-yellow-400',
      'Expert': 'text-red-400',
      'Legend': 'text-purple-400',
      'Pioneer': 'text-orange-400'
    };
    return colors[rank] || 'text-gray-400';
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      'post_create': '📝',
      'post_liked': '👍',
      'post_shared': '🔄',
      'comment_create': '💬',
      'stake_tokens': '💰',
      'daily_login': '📅',
      'content_featured': '⭐',
      'helpful_reply': '🤝',
      'post_flagged': '🚩',
      'spam_detected': '⚠️'
    };
    return icons[action] || '📊';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Recent';
  };

  if (loading) {
    return (
      <div className={`bg-gray-900 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error || !reputation) {
    return (
      <div className={`bg-gray-900 rounded-lg p-4 border border-red-700 ${className}`}>
        <div className="text-red-400 text-sm">
          {error || 'No reputation data available'}
        </div>
      </div>
    );
  }

  // Compact view for inline display
  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <div className={`font-semibold ${getRankColor(reputation.rank)}`}>
          {reputation.currentScore}
        </div>
        <div className="text-xs text-gray-400">
          {reputation.rank}
        </div>
        {reputation.badges.length > 0 && (
          <div className="text-xs">
            {reputation.badges.slice(0, 2).map((badge, index) => (
              <span key={index} className="text-yellow-400">⭐</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full reputation display
  return (
    <div className={`bg-gray-900 rounded-lg p-6 border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Reputation Profile</h3>
        {summary && (
          <div className="text-right">
            <div className={`text-2xl font-bold ${getRankColor(summary.rank.rank)}`}>
              {reputation.currentScore}
            </div>
            <div className="text-sm text-gray-400">{summary.rank.rank}</div>
          </div>
        )}
      </div>

      {/* Rank Progress */}
      {summary && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Rank Progress</span>
            <span className="text-sm text-white">
              {summary.nextRankPoints > 0 
                ? `${summary.nextRankPoints} points to next rank`
                : 'Max rank achieved!'}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${summary.rank.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xl font-semibold text-blue-400">{reputation.stats.postsCreated}</div>
          <div className="text-xs text-gray-400">Posts Created</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold text-green-400">{reputation.stats.postsLiked}</div>
          <div className="text-xs text-gray-400">Posts Liked</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold text-purple-400">{reputation.stats.tokensStaked}</div>
          <div className="text-xs text-gray-400">Tokens Staked</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold text-yellow-400">{reputation.stats.daysActive}</div>
          <div className="text-xs text-gray-400">Days Active</div>
        </div>
      </div>

      {/* Badges */}
      {reputation.badges.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-white mb-3">Badges</h4>
          <div className="flex flex-wrap gap-2">
            {reputation.badges.map((badge, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-yellow-900/50 border border-yellow-700 rounded-full text-yellow-400 text-xs"
              >
                ⭐ {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strengths and Suggestions */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {summary.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {summary.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {summary.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-400 mb-2">Suggestions</h4>
              <ul className="space-y-1">
                {summary.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-center">
                    <span className="text-blue-400 mr-2">→</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recent Actions */}
      {showActions && recentActions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white">Recent Activity</h4>
            {recentActions.length > 5 && (
              <button
                onClick={() => setShowFullActions(!showFullActions)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                {showFullActions ? 'Show Less' : 'Show All'}
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {(showFullActions ? recentActions : recentActions.slice(0, 5)).map((action, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getActionIcon(action.action)}</span>
                  <div>
                    <div className="text-sm text-white">{action.reason}</div>
                    <div className="text-xs text-gray-400">{formatTimeAgo(action.timestamp)}</div>
                  </div>
                </div>
                <div className={`text-sm font-medium ${action.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {action.points > 0 ? '+' : ''}{action.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Actions (only for current user) */}
      {userId === user?.id && process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-800 rounded border border-gray-600">
          <h4 className="text-sm font-medium text-white mb-3">Debug: Test Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => trackAction(ReputationActionType.POST_CREATE, 'Test post creation')}
            >
              +5 Post
            </Button>
            <Button
              size="sm"
              onClick={() => trackAction(ReputationActionType.HELPFUL_REPLY, 'Test helpful reply')}
            >
              +15 Helpful
            </Button>
            <Button
              size="sm"
              onClick={() => trackAction(ReputationActionType.STAKE_TOKENS, 'Test token stake', undefined)}
            >
              +10 Stake
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
