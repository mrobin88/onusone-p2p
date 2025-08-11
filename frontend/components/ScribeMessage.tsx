/**
 * Modern Scribe Message Component
 * The core message/post component with scholarly aesthetic
 */

import React, { useState } from 'react';

interface ScribeMessageProps {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    reputation: number;
  };
  timestamp: string;
  engagements?: number;
  stakeTotal?: number;
  onReact?: (messageId: string, reaction: string) => void;
  onStake?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  isReply?: boolean;
  replyTo?: {
    id: string;
    content: string;
    author: {
      username: string;
    };
  };
}

export default function ScribeMessage({
  id,
  content,
  author,
  timestamp,
  engagements = 0,
  stakeTotal = 0,
  onReact,
  onStake,
  onReply,
  isReply = false,
  replyTo
}: ScribeMessageProps) {
  const [showActions, setShowActions] = useState(false);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getReputationColor = (reputation: number) => {
    if (reputation >= 500) return 'text-accent-gold';
    if (reputation >= 200) return 'text-status-green';
    if (reputation >= 100) return 'text-text-ash';
    return 'text-text-slate';
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={`message-component fade-in ${isReply ? 'reply-message' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Reply Indicator */}
      {isReply && replyTo && (
        <div className="reply-indicator">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Replying to <strong>{replyTo.author.username}</strong>: {replyTo.content}
          </span>
        </div>
      )}

      {/* Message Header */}
      <div className="message-header">
        <div className="message-avatar">
          {getInitials(author.username)}
        </div>
        
        <div className="message-username heading-3">
          {author.username}
        </div>
        
        <div className={`caption ${getReputationColor(author.reputation)}`}>
          {author.reputation} rep
        </div>
        
        <div className="message-timestamp caption">
          {formatTimestamp(timestamp)}
        </div>
      </div>

      {/* Message Content */}
      <div className="message-content body-main">
        {content}
      </div>

      {/* Message Footer */}
      <div className="message-footer">
        <div className="message-reactions">
          {engagements > 0 && (
            <button
              className="reaction-button"
              onClick={() => onReact?.(id, 'like')}
            >
              👍 {engagements}
            </button>
          )}
          
          {stakeTotal > 0 && (
            <div className="reaction-button">
              💰 {stakeTotal} ONU
            </div>
          )}
        </div>

        {/* Actions Menu (visible on hover) */}
        <div className={`message-actions ${showActions ? 'visible' : ''}`}>
          <button
            className="btn-text text-xs"
            onClick={() => onReact?.(id, 'like')}
          >
            👍 React
          </button>
          
          <button
            className="btn-text text-xs"
            onClick={() => onStake?.(id)}
          >
            💰 Stake
          </button>
          
          <button
            className="btn-text text-xs"
            onClick={() => onReply?.(id)}
          >
            💬 Reply
          </button>
        </div>
      </div>

      <style jsx>{`
        .message-actions {
          opacity: 0;
          visibility: hidden;
          transition: all var(--animation-fast);
          display: flex;
          gap: var(--space-xs);
        }

        .message-actions.visible {
          opacity: 1;
          visibility: visible;
        }

        .reaction-button {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 16px;
          padding: 4px 8px;
          font-size: 12px;
          color: var(--text-slate);
          cursor: pointer;
          transition: all var(--animation-fast);
          font-family: var(--font-body);
        }

        .reaction-button:hover {
          background: rgba(212, 175, 55, 0.2);
          border-color: var(--accent-gold);
        }

        .text-xs {
          font-size: 12px;
        }

        .reply-message {
          background: rgba(212, 175, 55, 0.02);
          border-left: 3px solid var(--accent-gold);
        }

        .reply-indicator {
          padding: 8px 12px;
          background: rgba(212, 175, 55, 0.05);
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
