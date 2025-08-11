import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Button from './Button';
import { useToast } from './Toast';
import LoadingSpinner from './LoadingSpinner';

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentMessage: {
    id: string;
    content: string;
    author: {
      username: string;
      reputation: number;
    };
    timestamp: string;
  };
  onReplySubmit: (replyContent: string, parentMessageId: string) => Promise<void>;
  boardSlug: string;
}

export default function ReplyModal({
  isOpen,
  onClose,
  parentMessage,
  onReplySubmit,
  boardSlug
}: ReplyModalProps) {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { showSuccess, showError, showLoading, dismissToast } = useToast();
  
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const maxCharacters = 1000;

  useEffect(() => {
    if (isOpen) {
      setReplyContent('');
      setCharacterCount(0);
    }
  }, [isOpen]);

  const handleConnectWallet = () => {
    setVisible(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !publicKey) {
      handleConnectWallet();
      return;
    }

    if (!replyContent.trim()) {
      showError('Please enter a reply');
      return;
    }

    if (replyContent.length > maxCharacters) {
      showError(`Reply is too long. Maximum ${maxCharacters} characters allowed.`);
      return;
    }

    setIsSubmitting(true);
    const loadingToast = showLoading('Posting reply...');

    try {
      await onReplySubmit(replyContent, parentMessage.id);
      showSuccess('Reply posted successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to post reply:', error);
      showError('Failed to post reply. Please try again.');
    } finally {
      dismissToast(loadingToast);
      setIsSubmitting(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setReplyContent(content);
    setCharacterCount(content.length);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Reply to Message
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Board: {boardSlug}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Parent Message Preview */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-accent-gold rounded-full flex items-center justify-center text-white text-sm font-medium">
              {parentMessage.author.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {parentMessage.author.username}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {parentMessage.author.reputation} rep
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(parentMessage.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {parentMessage.content}
              </p>
            </div>
          </div>
        </div>

        {/* Reply Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {!connected ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Connect your wallet to reply to this message
              </p>
              <Button onClick={handleConnectWallet} type="button">
                Connect Wallet
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label htmlFor="reply-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Reply
                </label>
                <textarea
                  id="reply-content"
                  value={replyContent}
                  onChange={handleContentChange}
                  placeholder="Write your reply..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-accent-gold dark:bg-gray-700 dark:text-white"
                  rows={6}
                  maxLength={maxCharacters}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Replying as {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                  </span>
                  <span className={`text-xs ${
                    characterCount > maxCharacters * 0.9 
                      ? 'text-red-500' 
                      : characterCount > maxCharacters * 0.7 
                        ? 'text-yellow-500' 
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {characterCount}/{maxCharacters}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!replyContent.trim() || isSubmitting || characterCount > maxCharacters}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Posting...
                    </>
                  ) : (
                    'Post Reply'
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
