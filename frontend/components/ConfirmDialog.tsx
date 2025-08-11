/**
 * Confirm Dialog - Smooth confirmation modals for important actions
 * Beautiful animations and clear user feedback
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  onClose?: () => void;
  showIcon?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  onConfirm,
  onCancel,
  onClose,
  showIcon = true
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onConfirm();
      onClose?.();
    }, 200);
  };

  const handleCancel = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onCancel();
      onClose?.();
    }, 200);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
          borderClass: 'border-red-200',
          bgClass: 'bg-red-50'
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          borderClass: 'border-yellow-200',
          bgClass: 'bg-yellow-50'
        };
      case 'success':
        return {
          icon: '✅',
          confirmClass: 'bg-green-600 hover:bg-green-700 text-white',
          borderClass: 'border-green-200',
          bgClass: 'bg-green-50'
        };
      default:
        return {
          icon: 'ℹ️',
          confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
          borderClass: 'border-blue-200',
          bgClass: 'bg-blue-50'
        };
    }
  };

  const styles = getTypeStyles();

  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black transition-opacity duration-200
          ${isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}
        `}
        onClick={onClose || onCancel}
      />
      
      {/* Dialog */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className={`
            relative bg-white rounded-lg shadow-xl max-w-md w-full
            transform transition-all duration-200 ease-out
            ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b ${styles.borderClass} ${styles.bgClass}`}>
            <div className="flex items-center space-x-3">
              {showIcon && (
                <span className="text-2xl">{styles.icon}</span>
              )}
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex space-x-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${styles.confirmClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Specialized confirmation dialogs
export const StakingConfirmDialog: React.FC<{
  isOpen: boolean;
  amount: number;
  postId: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, amount, postId, onConfirm, onCancel }) => (
  <ConfirmDialog
    isOpen={isOpen}
    title="Confirm Stake"
    message={`Stake ${amount} ONU on this post?`}
    confirmText="Stake"
    cancelText="Cancel"
    type="warning"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);

export const NodeStartConfirmDialog: React.FC<{
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, onConfirm, onCancel }) => (
  <ConfirmDialog
    isOpen={isOpen}
    title="Start Node"
    message="Begin earning ONU based on uptime and network activity?"
    confirmText="Start"
    cancelText="Later"
    type="success"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);

export const LogoutConfirmDialog: React.FC<{
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, onConfirm, onCancel }) => (
  <ConfirmDialog
    isOpen={isOpen}
    title="Logout"
    message="Exit the network? Your node continues if active."
    confirmText="Exit"
    cancelText="Stay"
    type="info"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);
