/**
 * Toast Notification System - Smooth alerts for all user actions
 * Beautiful animations with different types and auto-dismiss
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-dismiss
    if (toast.duration !== Infinity) {
      const dismissTimer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
      }, toast.duration || 5000);
      
      return () => clearTimeout(dismissTimer);
    }
    
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'loading': return '⏳';
      default: return '💬';
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-500 border-green-400 text-white';
      case 'error': return 'bg-red-500 border-red-400 text-white';
      case 'warning': return 'bg-yellow-500 border-yellow-400 text-black';
      case 'info': return 'bg-blue-500 border-blue-400 text-white';
      case 'loading': return 'bg-purple-500 border-purple-400 text-white';
      default: return 'bg-gray-500 border-gray-400 text-white';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isExiting ? 'translate-x-full opacity-0 scale-95' : ''}
      `}
    >
      <div className={`
        ${getColors()} rounded-lg shadow-2xl border-2 p-4
        backdrop-blur-sm bg-opacity-95
      `}>
        <div className="flex items-start space-x-3">
          <span className="text-xl flex-shrink-0">{getIcon()}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{toast.title}</h4>
            {toast.message && (
              <p className="text-sm mt-1 opacity-90">{toast.message}</p>
            )}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="text-sm underline mt-2 hover:opacity-80 transition-opacity"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-sm opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
          >
            ✕
          </button>
        </div>
        
        {/* Progress bar for auto-dismiss */}
        {toast.duration !== Infinity && (
          <div className="mt-3 h-1 bg-black bg-opacity-20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300 ease-linear"
              style={{ 
                width: isVisible ? '0%' : '100%',
                transitionDuration: `${toast.duration || 5000}ms`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Toast Context and Hook
interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => string;
  showSuccess: (title: string, message?: string) => string;
  showError: (title: string, message?: string) => string;
  showWarning: (title: string, message?: string) => string;
  showInfo: (title: string, message?: string) => string;
  showLoading: (title: string, message?: string) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showSuccess = (title: string, message?: string) => {
    return showToast({ type: 'success', title, message, duration: 4000 });
  };

  const showError = (title: string, message?: string) => {
    return showToast({ type: 'error', title, message, duration: 6000 });
  };

  const showWarning = (title: string, message?: string) => {
    return showToast({ type: 'warning', title, message, duration: 5000 });
  };

  const showInfo = (title: string, message?: string) => {
    return showToast({ type: 'info', title, message, duration: 4000 });
  };

  const showLoading = (title: string, message?: string) => {
    return showToast({ type: 'loading', title, message, duration: Infinity });
  };

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showLoading,
      dismissToast
    }}>
      {children}
      
      {/* Toast Container */}
      {typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 pointer-events-none z-50">
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onRemove={dismissToast}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
