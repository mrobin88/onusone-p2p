/**
 * Gaming-Style Chat Component
 * Inspired by modern video game chat interfaces with better UX
 */

import React, { useState, useRef, useEffect } from 'react';
import { useWalletAuth } from './WalletAuth';

interface GamingChatProps {
  boardSlug: string;
  boardName: string;
  messages: any[];
  onSubmitMessage: (content: string) => void;
  onStake: (messageId: string) => void;
  onReply: (messageId: string) => void;
  isAuthenticated: boolean;
}

export default function GamingChat({
  boardSlug,
  boardName,
  messages,
  onSubmitMessage,
  onStake,
  onReply,
  isAuthenticated
}: GamingChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useWalletAuth();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmitMessage(newMessage.trim());
      setNewMessage('');
      setShowComposer(false);
    } catch (error) {
      console.error('Failed to submit message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getReputationColor = (reputation: number) => {
    if (reputation >= 100) return 'text-yellow-400';
    if (reputation >= 50) return 'text-green-400';
    if (reputation >= 25) return 'text-blue-400';
    return 'text-gray-400';
  };

  const getReputationIcon = (reputation: number) => {
    if (reputation >= 100) return '👑';
    if (reputation >= 50) return '⭐';
    if (reputation >= 25) return '🔰';
    return '👤';
  };

  return (
    <div className="gaming-chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title">
          <h2 className="text-xl font-bold text-white">{boardName}</h2>
          <span className="text-sm text-gray-400">{messages.length} messages</span>
        </div>
        <div className="chat-controls">
          {isAuthenticated && (
            <button
              onClick={() => setShowComposer(!showComposer)}
              className="compose-toggle-btn"
            >
              {showComposer ? '✕' : '✏️'}
            </button>
          )}
        </div>
      </div>

      {/* Message Composer */}
      {showComposer && isAuthenticated && (
        <div className="message-composer">
          <form onSubmit={handleSubmit} className="composer-form">
            <div className="composer-header">
              <div className="user-info">
                <div className="user-avatar">
                  {user?.displayName?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div className="user-details">
                  <span className="username">{user?.displayName || 'Anonymous'}</span>
                  <span className={`reputation ${getReputationColor(user?.reputation || 0)}`}>
                    {getReputationIcon(user?.reputation || 0)} {user?.reputation || 0} rep
                  </span>
                </div>
              </div>
            </div>
            <div className="composer-input">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Share your thoughts in ${boardName}...`}
                className="message-textarea"
                rows={3}
                disabled={submitting}
                autoFocus
              />
              <div className="composer-actions">
                <div className="input-info">
                  <span className="text-xs text-gray-400">
                    {newMessage.length}/500 characters
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || submitting || newMessage.length > 500}
                  className="submit-btn"
                >
                  {submitting ? (
                    <span className="loading-spinner">⏳</span>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Messages Container */}
      <div className="messages-container">
        {messages.length > 0 ? (
          <div className="messages-list">
            {messages
              .filter(message => !message.parentMessageId)
              .map((message) => (
                <div key={message.id} className="message-item">
                  <div className="message-header">
                    <div className="message-author">
                      <div className="author-avatar">
                        {message.author.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="author-info">
                        <span className="author-name">{message.author.username}</span>
                        <span className={`author-reputation ${getReputationColor(message.author.reputation)}`}>
                          {getReputationIcon(message.author.reputation)} {message.author.reputation}
                        </span>
                      </div>
                    </div>
                    <div className="message-meta">
                      <span className="timestamp">{formatTimestamp(message.createdAt)}</span>
                      <div className="message-actions">
                        <button
                          onClick={() => onReply(message.id)}
                          className="action-btn reply-btn"
                          title="Reply"
                        >
                          💬
                        </button>
                        <button
                          onClick={() => onStake(message.id)}
                          className="action-btn stake-btn"
                          title="Stake"
                        >
                          💰
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-stats">
                    <span className="stat-item">
                      💬 {message.replies || 0} replies
                    </span>
                    <span className="stat-item">
                      💰 {message.stakeTotal || 0} ONU staked
                    </span>
                    <span className="stat-item">
                      🔥 {message.burnedTotal || 0} ONU burned
                    </span>
                  </div>

                  {/* Show replies */}
                  {message.replies > 0 && (
                    <div className="replies-container">
                      {messages
                        .filter(reply => reply.parentMessageId === message.id)
                        .map((reply) => (
                          <div key={reply.id} className="reply-item">
                            <div className="reply-header">
                              <div className="reply-author">
                                <div className="reply-avatar">
                                  {reply.author.username.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="reply-username">{reply.author.username}</span>
                                <span className={`reply-reputation ${getReputationColor(reply.author.reputation)}`}>
                                  {getReputationIcon(reply.author.reputation)} {reply.author.reputation}
                                </span>
                              </div>
                              <span className="reply-timestamp">{formatTimestamp(reply.createdAt)}</span>
                            </div>
                            <div className="reply-content">
                              {reply.content}
                            </div>
                            <div className="reply-actions">
                              <button
                                onClick={() => onStake(reply.id)}
                                className="action-btn stake-btn"
                                title="Stake"
                              >
                                💰
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3 className="empty-title">No messages yet</h3>
            <p className="empty-description">
              Be the first to start the conversation in {boardName}
            </p>
            {isAuthenticated && (
              <button
                onClick={() => setShowComposer(true)}
                className="start-conversation-btn"
              >
                Start Conversation
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions Bar */}
      {isAuthenticated && (
        <div className="quick-actions">
          <button
            onClick={() => setShowComposer(!showComposer)}
            className="quick-action-btn primary"
          >
            {showComposer ? '✕ Close' : '✏️ New Message'}
          </button>
          <button className="quick-action-btn secondary">
            🔍 Search
          </button>
          <button className="quick-action-btn secondary">
            📊 Stats
          </button>
        </div>
      )}

      <style jsx>{`
        .gaming-chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(90deg, #0f3460 0%, #16213e 100%);
          border-bottom: 2px solid #e94560;
        }

        .chat-title h2 {
          margin: 0;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .chat-title span {
          color: #a0a3a8;
          font-size: 12px;
        }

        .compose-toggle-btn {
          background: #e94560;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .compose-toggle-btn:hover {
          background: #d63384;
          transform: scale(1.05);
        }

        .message-composer {
          background: rgba(15, 52, 96, 0.8);
          border-bottom: 1px solid #e94560;
          padding: 20px;
        }

        .composer-header {
          margin-bottom: 16px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e94560, #d63384);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .username {
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
        }

        .reputation {
          font-size: 12px;
          font-weight: 500;
        }

        .composer-input {
          position: relative;
        }

        .message-textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid #e94560;
          border-radius: 8px;
          padding: 16px;
          color: #ffffff;
          font-size: 14px;
          resize: vertical;
          min-height: 80px;
          backdrop-filter: blur(10px);
        }

        .message-textarea:focus {
          outline: none;
          border-color: #d63384;
          box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.3);
        }

        .message-textarea::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .composer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
        }

        .submit-btn {
          background: linear-gradient(135deg, #e94560, #d63384);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(233, 69, 96, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .message-item {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(233, 69, 96, 0.2);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
        }

        .message-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(233, 69, 96, 0.4);
          transform: translateY(-1px);
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .message-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .author-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e94560, #d63384);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        }

        .author-info {
          display: flex;
          flex-direction: column;
        }

        .author-name {
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
        }

        .author-reputation {
          font-size: 11px;
          font-weight: 500;
        }

        .message-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .timestamp {
          color: #a0a3a8;
          font-size: 11px;
        }

        .message-actions {
          display: flex;
          gap: 4px;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          padding: 4px 8px;
          color: #ffffff;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: rgba(233, 69, 96, 0.3);
          border-color: #e94560;
          transform: scale(1.1);
        }

        .message-content {
          color: #ffffff;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .message-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }

        .stat-item {
          color: #a0a3a8;
          font-size: 11px;
          font-weight: 500;
        }

        .replies-container {
          margin-top: 12px;
          padding-left: 20px;
          border-left: 2px solid rgba(233, 69, 96, 0.3);
        }

        .reply-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(233, 69, 96, 0.1);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
        }

        .reply-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .reply-author {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .reply-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e94560, #d63384);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 10px;
        }

        .reply-username {
          color: #ffffff;
          font-weight: 500;
          font-size: 12px;
        }

        .reply-reputation {
          font-size: 10px;
          font-weight: 500;
        }

        .reply-timestamp {
          color: #a0a3a8;
          font-size: 10px;
        }

        .reply-content {
          color: #e0e0e0;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .reply-actions {
          display: flex;
          justify-content: flex-end;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #a0a3a8;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-title {
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .empty-description {
          font-size: 14px;
          margin-bottom: 20px;
        }

        .start-conversation-btn {
          background: linear-gradient(135deg, #e94560, #d63384);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .start-conversation-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(233, 69, 96, 0.4);
        }

        .quick-actions {
          display: flex;
          gap: 8px;
          padding: 16px 20px;
          background: rgba(15, 52, 96, 0.8);
          border-top: 1px solid #e94560;
        }

        .quick-action-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .quick-action-btn.primary {
          background: #e94560;
          color: white;
        }

        .quick-action-btn.primary:hover {
          background: #d63384;
          transform: scale(1.05);
        }

        .quick-action-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .quick-action-btn.secondary:hover {
          background: rgba(233, 69, 96, 0.2);
          border-color: #e94560;
        }

        /* Scrollbar Styling */
        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(233, 69, 96, 0.5);
          border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(233, 69, 96, 0.7);
        }
      `}</style>
    </div>
  );
}
