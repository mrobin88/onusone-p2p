import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWalletAuth } from '../../components/WalletAuth';
import Button from '../../components/Button';

interface Topic {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    reputation: number;
  };
  createdAt: Date;
  category: string;
  decayScore: number;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    reputation: number;
  };
  createdAt: Date;
  topicId: string;
  decayScore: number;
  engagements: number;
}

// Mock topic data
const mockTopics: Record<string, Topic> = {
  '1': {
    id: '1',
    title: 'Welcome to OnusOne P2P - The Future of Decentralized Social Networks',
    content: `Welcome to OnusOne, the revolutionary P2P social network!

## Why P2P Matters

Traditional social media platforms have fundamental problems:
- **Algorithmic manipulation** - They decide what you see based on profit, not value
- **Data exploitation** - Your content and behavior are harvested for advertising revenue
- **Censorship risk** - You can be banned, silenced, or deleted at any moment
- **Quality decline** - Engagement-driven algorithms promote controversy over quality

## How OnusOne P2P Solves This

Our peer-to-peer approach creates a fundamentally better social experience:

### 🌐 **True Decentralization**
- Your content lives on your node, not corporate servers
- No single point of failure or control
- Censorship-resistant by design

### ⚡ **Content Decay System**
- Content automatically loses relevance over time
- Community engagement keeps quality content alive
- Spam and low-value content naturally disappears
- No manual moderation needed

### 🏆 **Reputation-Based Governance**
- Quality contributors earn reputation through valuable contributions
- Higher reputation = more network influence
- Merit-based system rewards good behavior
- Self-regulating community

### 🔒 **Privacy by Default**
- No tracking or data harvesting
- You control your own data
- Direct peer-to-peer communication
- No corporate intermediaries

## Getting Started

1. **Explore the Network** - Browse different boards and topics
2. **Contribute Quality Content** - Earn reputation through valuable posts
3. **Engage Thoughtfully** - Your interactions help quality content survive
4. **Run Your Own Node** - Become part of the decentralized infrastructure

Welcome to the future of social networking - decentralized, community-driven, and truly yours!`,
    author: {
      id: '1',
      username: 'p2p_pioneer',
      reputation: 350
    },
    createdAt: new Date('2025-01-01'),
    category: 'Welcome',
    decayScore: 98
  },
  '2': {
    id: '2',
    title: 'Technical Deep Dive: How Content Decay Prevents Spam Better Than Moderation',
    content: `The content decay algorithm is the heart of OnusOne's spam prevention system.

## The Problem with Traditional Moderation

Traditional platforms rely on:
- Human moderators (expensive, inconsistent, biased)
- AI filters (easily fooled, false positives)
- User reporting (reactive, not proactive)

## Our Content Decay Solution

Every piece of content starts with a "decay score" of 100. Over time:

1. **Natural Decay** - Score decreases automatically
2. **Engagement Boost** - Likes, comments, shares increase score
3. **Quality Filtering** - Only engaged-with content survives
4. **Automatic Cleanup** - Low-score content is removed

## Technical Implementation

\`\`\`typescript
class ContentDecayEngine {
  recordEngagement(contentId: string, type: 'like' | 'comment' | 'share') {
    const boost = this.getEngagementBoost(type);
    this.updateDecayScore(contentId, boost);
  }
  
  getContentByDecayScore(contentIds: string[]) {
    return contentIds
      .map(id => ({ id, score: this.getDecayScore(id) }))
      .filter(item => item.score > MINIMUM_SCORE)
      .sort((a, b) => b.score - a.score);
  }
}
\`\`\`

## Results

- **99.7% spam reduction** without human moderators
- **Higher quality discussions** - only valuable content survives
- **Self-regulating network** - community naturally curates content
- **Scalable solution** - works better as network grows

This is how we achieve better content quality than any centralized platform!`,
    author: {
      id: '2',
      username: 'tech_researcher',
      reputation: 420
    },
    createdAt: new Date('2025-01-02'),
    category: 'Technology',
    decayScore: 95
  }
};

// Mock comments
const mockComments: Comment[] = [
  {
    id: '1',
    content: 'This is exactly what the internet needs! Finally, a social network that puts users first instead of profits.',
    author: { id: '4', username: 'freedom_lover', reputation: 180 },
    createdAt: new Date('2025-01-02'),
    topicId: '1',
    decayScore: 92,
    engagements: 8
  },
  {
    id: '2',
    content: 'The content decay system is brilliant. I love how it naturally filters out noise while preserving valuable discussions.',
    author: { id: '5', username: 'quality_seeker', reputation: 220 },
    createdAt: new Date('2025-01-02'),
    topicId: '1',
    decayScore: 89,
    engagements: 12
  },
  {
    id: '3',
    content: 'Been running my own node for a week now. The performance is incredible and knowing I own my data feels liberating.',
    author: { id: '6', username: 'node_runner', reputation: 145 },
    createdAt: new Date('2025-01-03'),
    topicId: '1',
    decayScore: 94,
    engagements: 6
  }
];

export default function TopicDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated, logout } = useWalletAuth();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (id && typeof id === 'string') {
      const foundTopic = mockTopics[id];
      if (foundTopic) {
        setTopic(foundTopic);
        setComments(mockComments.filter(comment => comment.topicId === id)
          .sort((a, b) => b.decayScore - a.decayScore));
      } else {
        router.push('/topics');
      }
    }
  }, [id, isAuthenticated, router]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !user || !topic) return;

    setSubmitting(true);
    
    try {
      const comment: Comment = {
        id: `new-${Date.now()}`,
        content: newComment,
        author: {
          id: user.id,
          username: user.username,
          reputation: 100 + Math.floor(Math.random() * 150)
        },
        createdAt: new Date(),
        topicId: topic.id,
        decayScore: 100,
        engagements: 0
      };

      setComments([comment, ...comments]);
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEngageComment = (commentId: string) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { 
            ...comment, 
            engagements: comment.engagements + 1,
            decayScore: Math.min(comment.decayScore + 3, 100)
          }
        : comment
    ).sort((a, b) => b.decayScore - a.decayScore));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDecayColor = (score: number) => {
    if (score >= 95) return 'text-green-400';
    if (score >= 85) return 'text-yellow-400';
    if (score >= 75) return 'text-orange-400';
    return 'text-red-400';
  };

  const getReputationColor = (rep: number) => {
    if (rep >= 400) return 'text-purple-400';
    if (rep >= 300) return 'text-blue-400';
    if (rep >= 200) return 'text-green-400';
    return 'text-gray-400';
  };

  if (!isAuthenticated || !topic) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{topic.title} - OnusOne P2P</title>
        <meta name="description" content={topic.content.substring(0, 150)} />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-2xl font-bold text-white">
                  OnusOne P2P
                </Link>
                <nav className="flex space-x-4">
                  <Link href="/topics" className="text-blue-400 px-3 py-2 rounded-md text-sm font-medium">
                    Topics
                  </Link>
                  <Link href="/boards" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Boards
                  </Link>
                  <Link href="/p2p-demo" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    P2P Demo
                  </Link>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">Welcome, {user?.username}!</span>
                <Button onClick={() => logout()} variant="secondary" size="sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/topics" className="text-blue-400 hover:text-blue-300 flex items-center space-x-2">
              <span>←</span>
              <span>Back to Topics</span>
            </Link>
          </div>

          {/* Topic Content */}
          <article className="bg-gray-900 rounded-xl p-8 mb-8 border border-gray-800">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                  {topic.category}
                </span>
                <div className="flex items-center space-x-1 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">P2P Active</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-400">Decay Score</div>
                <div className={`text-2xl font-bold ${getDecayColor(topic.decayScore)}`}>
                  {topic.decayScore}
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-6">
              {topic.title}
            </h1>
            
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-gray-400">by</span>
              <span className="text-white font-medium">{topic.author.username}</span>
              <span className={`font-medium ${getReputationColor(topic.author.reputation)}`}>
                {topic.author.reputation} reputation
              </span>
              <span className="text-gray-400">{formatDate(topic.createdAt)}</span>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                {topic.content}
              </div>
            </div>
          </article>

          {/* Comments Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                P2P Comments ({comments.length})
              </h2>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add your thoughts to the P2P discussion
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Share your insights with the decentralized community..."
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Comments are distributed across the P2P network • Quality contributions earn reputation
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Broadcasting...' : 'Broadcast Comment'}
                </Button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No comments yet. Be the first to share your thoughts on this P2P topic!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-white">{comment.author.username}</span>
                        <span className={`text-sm font-medium ${getReputationColor(comment.author.reputation)}`}>
                          {comment.author.reputation} rep
                        </span>
                        <span className="text-gray-400 text-sm">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Decay</div>
                          <div className={`text-sm font-bold ${getDecayColor(comment.decayScore)}`}>
                            {comment.decayScore}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEngageComment(comment.id)}
                          className="text-gray-400 hover:text-red-400 transition duration-200 flex items-center space-x-1"
                          title="Engage with this comment"
                        >
                          <span className="text-lg">❤️</span>
                          <span className="text-sm">{comment.engagements}</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-gray-300 leading-relaxed mb-3">
                      {comment.content}
                    </div>
                    
                    <div className="text-xs text-blue-400">
                      Distributed via P2P Network
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}