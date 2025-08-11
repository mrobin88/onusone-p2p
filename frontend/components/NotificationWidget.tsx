/**
 * Notification Widget Component
 * Shows notification status and allows users to manage desktop notifications
 */

import React, { useState, useEffect } from 'react';
import { notificationService, NotificationMessage } from '../lib/notification-service';
import Button from './Button';

interface NotificationWidgetProps {
  className?: string;
  showBadge?: boolean;
}

export default function NotificationWidget({ className = '', showBadge = true }: NotificationWidgetProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [notificationCount, setNotificationCount] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Initialize permission status
    setPermissionStatus(notificationService.getPermissionStatus());
    setNotificationCount(notificationService.getNotificationCount());

    // Listen for permission changes
    const checkPermission = () => {
      setPermissionStatus(notificationService.getPermissionStatus());
      setNotificationCount(notificationService.getNotificationCount());
    };

    // Check periodically
    const interval = setInterval(checkPermission, 5000);
    
    // Also check when window gains focus
    window.addEventListener('focus', checkPermission);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkPermission);
    };
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await notificationService.requestPermission();
      setPermissionStatus(notificationService.getPermissionStatus());
      
      if (granted) {
        // Show success message
        console.log('Notification permission granted!');
      } else {
        // Show instructions for manual permission
        console.log('Permission denied. Please enable notifications manually in your browser settings.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.testNotification();
    } catch (error) {
      console.error('Error testing notification:', error);
    }
  };

  const handleClearNotifications = () => {
    notificationService.clearNotificationCount();
    setNotificationCount(0);
  };

  const getPermissionIcon = () => {
    switch (permissionStatus) {
      case 'granted':
        return '🔔';
      case 'denied':
        return '🔕';
      default:
        return '❓';
    }
  };

  const getPermissionText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Blocked';
      default:
        return 'Not Set';
    }
  };

  const getPermissionColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'text-green-400';
      case 'denied':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Widget Button */}
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="relative p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200 hover-lift"
          title="Notification Settings"
        >
          <span className="text-xl">{getPermissionIcon()}</span>
          
          {/* Notification Badge */}
          {showBadge && notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 z-50 fade-in-scale">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Status Section */}
              <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Status:</span>
                  <span className={`text-sm font-medium ${getPermissionColor()}`}>
                    {getPermissionText()}
                  </span>
                </div>
                
                {notificationCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Unread:</span>
                    <span className="text-sm text-white font-medium">{notificationCount}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {permissionStatus === 'default' && (
                  <Button
                    onClick={handleRequestPermission}
                    disabled={isRequesting}
                    variant="primary"
                    className="w-full"
                  >
                    {isRequesting ? 'Requesting...' : 'Enable Notifications'}
                  </Button>
                )}

                {permissionStatus === 'denied' && (
                  <div className="p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-200">
                    <p className="mb-2">Notifications are blocked. To enable:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Click the lock/info icon in your address bar</li>
                      <li>Change "Notifications" to "Allow"</li>
                      <li>Refresh the page</li>
                    </ol>
                  </div>
                )}

                {permissionStatus === 'granted' && (
                  <>
                    <Button
                      onClick={handleTestNotification}
                      variant="secondary"
                      className="w-full"
                    >
                      Test Notification
                    </Button>
                    
                    {notificationCount > 0 && (
                      <Button
                        onClick={handleClearNotifications}
                        variant="secondary"
                        className="w-full"
                      >
                        Clear All
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Info */}
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded text-sm text-blue-200">
                <p className="text-xs">
                  Get notified when new messages arrive with staking information.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {showSettings && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// Export for use in other components
export { NotificationWidget };
