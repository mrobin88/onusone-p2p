/**
 * Simple Loading Spinner - For quick operations
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'purple' | 'green';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', color = 'blue', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    green: 'border-green-500'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`} />
      {text && (
        <p className="mt-2 text-sm text-gray-500 animate-pulse">{text}</p>
      )}
    </div>
  );
}
