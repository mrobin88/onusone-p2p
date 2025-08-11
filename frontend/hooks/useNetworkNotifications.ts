/**
 * Network Notifications Hook
 * Monitors P2P network for new messages and triggers desktop notifications
 */

import { useEffect, useRef, useCallback } from 'react';
import { notificationService, NotificationMessage } from '../lib/notification-service';

interface UseNetworkNotificationsOptions {
  enabled?: boolean;
  boards?: string[];
  includeStakes?: boolean;
  soundEnabled?: boolean;
}

interface NetworkMessage {
  id: string;
  content: string;
  author: string;
  board: string;
  stakeAmount: number;
  totalStaked: number;
  timestamp: Date;
}

export function useNetworkNotifications(options: UseNetworkNotificationsOptions = {}) {
  const {
    enabled = true,
    boards = [],
    includeStakes = true,
    soundEnabled = true
  } = options;

  const lastMessageId = useRef<string>('');
  const isConnected = useRef(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Mock P2P connection - replace with your actual P2P implementation
  const connectToNetwork = useCallback(async () => {
    if (!enabled) return;

    try {
      // Simulate P2P connection
      console.log('🔗 Connecting to P2P network...');
      
      // In a real implementation, this would connect to your P2P network
      // For now, we'll simulate network activity
      isConnected.current = true;
      reconnectAttempts.current = 0;
      
      console.log('✅ Connected to P2P network');
      
      // Start listening for messages
      startMessageListener();
      
    } catch (error) {
      console.error('❌ Failed to connect to P2P network:', error);
      handleReconnect();
    }
  }, [enabled]);

  const startMessageListener = useCallback(() => {
    if (!isConnected.current) return;

    // Simulate receiving messages from the P2P network
    // In a real implementation, this would listen to your P2P message events
    const messageInterval = setInterval(() => {
      if (!isConnected.current) {
        clearInterval(messageInterval);
        return;
      }

      // Simulate random messages (replace with actual P2P message handling)
      simulateNetworkMessage();
    }, 30000); // Check every 30 seconds for demo purposes

    // Cleanup function
    return () => clearInterval(messageInterval);
  }, []);

  const simulateNetworkMessage = useCallback(() => {
    // This is just for demonstration - replace with actual P2P message handling
    const mockBoards = ['general', 'technology', 'community', 'p2p-development'];
    const mockAuthors = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    const mockMessages = [
      'Just discovered an amazing new P2P protocol!',
      'The network is growing faster than expected.',
      'Anyone tried the new staking mechanism?',
      'Great discussion happening in the dev channel.',
      'The community is really coming together on this.'
    ];

    const randomBoard = boards.length > 0 
      ? boards[Math.floor(Math.random() * boards.length)]
      : mockBoards[Math.floor(Math.random() * mockBoards.length)];

    const mockMessage: NetworkMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: mockMessages[Math.floor(Math.random() * mockMessages.length)],
      author: mockAuthors[Math.floor(Math.random() * mockAuthors.length)],
      board: randomBoard,
      stakeAmount: Math.floor(Math.random() * 1000) + 100,
      totalStaked: Math.floor(Math.random() * 10000) + 1000,
      timestamp: new Date()
    };

    // Only process if it's a new message
    if (mockMessage.id !== lastMessageId.current) {
      lastMessageId.current = mockMessage.id;
      handleNewMessage(mockMessage);
    }
  }, [boards]);

  const handleNewMessage = useCallback(async (message: NetworkMessage) => {
    try {
      // Check if we should notify for this board
      if (boards.length > 0 && !boards.includes(message.board)) {
        return;
      }

      // Create notification message
      const notificationMessage: NotificationMessage = {
        id: message.id,
        content: message.content,
        author: message.author,
        board: message.board,
        stakeAmount: message.stakeAmount,
        totalStaked: message.totalStaked,
        timestamp: message.timestamp
      };

      // Show desktop notification
      await notificationService.notifyNewMessage(notificationMessage);

      console.log('🔔 Notification sent for new message:', {
        board: message.board,
        author: message.author,
        stake: message.stakeAmount,
        total: message.totalStaked
      });

    } catch (error) {
      console.error('❌ Failed to send notification:', error);
    }
  }, [boards]);

  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    reconnectAttempts.current++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
    
    setTimeout(() => {
      connectToNetwork();
    }, delay);
  }, []);

  const disconnect = useCallback(() => {
    isConnected.current = false;
    console.log('🔌 Disconnected from P2P network');
  }, []);

  const sendTestMessage = useCallback(async () => {
    const testMessage: NetworkMessage = {
      id: `test-${Date.now()}`,
      content: 'This is a test message to verify notifications are working.',
      author: 'Test User',
      board: 'general',
      stakeAmount: 500,
      totalStaked: 5000,
      timestamp: new Date()
    };

    await handleNewMessage(testMessage);
  }, [handleNewMessage]);

  // Effect to connect/disconnect based on enabled state
  useEffect(() => {
    if (enabled) {
      connectToNetwork();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connectToNetwork, disconnect]);

  // Effect to handle window focus/blur for better notification handling
  useEffect(() => {
    const handleFocus = () => {
      // Clear notification count when user returns to the app
      notificationService.clearNotificationCount();
    };

    const handleBlur = () => {
      // Optionally pause notifications when user is away
      // This could be useful to avoid spam
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return {
    isConnected: isConnected.current,
    connect: connectToNetwork,
    disconnect,
    sendTestMessage,
    lastMessageId: lastMessageId.current
  };
}

// Export for use in components
export default useNetworkNotifications;
