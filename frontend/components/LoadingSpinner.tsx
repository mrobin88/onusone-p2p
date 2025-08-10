/**
 * Loading Spinner - Smooth animations for async operations
 * Different sizes and types for various loading states
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: 'spinner' | 'dots' | 'pulse' | 'bars';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  type = 'spinner', 
  text,
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const renderSpinner = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`} />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse`} />
        );
      
      case 'bars':
        return (
          <div className="flex space-x-1">
            <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
            <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
            <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderSpinner()}
      {text && (
        <p className="text-sm text-gray-600 mt-2 animate-pulse">{text}</p>
      )}
    </div>
  );
}

// Specialized loading components
export const ButtonSpinner: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => (
  <div className="flex items-center space-x-2">
    <LoadingSpinner size={size} type="spinner" />
    <span>Loading...</span>
  </div>
);

export const PageSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="xl" type="dots" />
      <p className="text-lg text-gray-600 mt-4">Loading amazing things...</p>
    </div>
  </div>
);

export const InlineSpinner: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex items-center space-x-2">
    <LoadingSpinner size="sm" type="spinner" />
    {text && <span className="text-sm text-gray-600">{text}</span>}
  </div>
);
