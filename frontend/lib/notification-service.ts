/**
 * Cross-platform Desktop Notification Service
 * Handles notifications for Windows, Mac, and Linux
 * Shows message alerts with staking information
 */

export interface NotificationMessage {
  id: string;
  content: string;
  author: string;
  board: string;
  stakeAmount: number;
  totalStaked: number;
  timestamp: Date;
}

export interface NotificationOptions {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationService {
  private isSupported: boolean;
  private permission: NotificationPermission = 'default';
  private notificationQueue: NotificationMessage[] = [];
  private isProcessing = false;
  private notificationSound?: HTMLAudioElement;
  private notificationCount = 0;

  constructor() {
    this.isSupported = 'Notification' in window;
    this.initialize();
  }

  private async initialize() {
    if (!this.isSupported) {
      console.warn('Desktop notifications not supported in this browser');
      return;
    }

    // Check existing permission
    this.permission = Notification.permission;

    // Create notification sound
    this.createNotificationSound();

    // Request permission if not granted
    if (this.permission === 'default') {
      await this.requestPermission();
    }

    // Set up service worker for PWA notifications
    this.setupServiceWorker();
  }

  private createNotificationSound() {
    try {
      this.notificationSound = new Audio();
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not create notification sound:', error);
    }
  }

  private async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        // Store permission in localStorage
        localStorage.setItem('notificationPermission', 'granted');
        return true;
      } else {
        localStorage.setItem('notificationPermission', permission);
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async showNotification(message: NotificationMessage, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') {
      // Queue the notification for later if permission not granted
      this.notificationQueue.push(message);
      return;
    }

    try {
      // Format the notification
      const notificationOptions = this.formatNotificationOptions(message, options);
      
      // Create and show the notification
      const notification = new Notification(notificationOptions.title!, notificationOptions);
      
      // Handle notification events
      notification.onclick = () => {
        this.handleNotificationClick(message);
        notification.close();
      };

      notification.onclose = () => {
        this.notificationCount = Math.max(0, this.notificationCount - 1);
        this.updateBadge();
      };

      // Play sound if not silent
      if (!notificationOptions.silent && this.notificationSound) {
        this.notificationSound.play().catch(() => {
          // Fallback to simple beep
          this.playFallbackSound();
        });
      }

      // Update badge count
      this.notificationCount++;
      this.updateBadge();

      // Auto-close after 8 seconds unless requireInteraction is true
      if (!notificationOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 8000);
      }

    } catch (error) {
      console.error('Error showing notification:', error);
      // Fallback to simple alert
      this.showFallbackAlert(message);
    }
  }

  private formatNotificationOptions(message: NotificationMessage, options?: NotificationOptions): NotificationOptions {
    const defaultOptions: NotificationOptions = {
      title: `💬 New Message in ${message.board}`,
      body: `${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `message-${message.board}`,
      requireInteraction: false,
      silent: false,
      actions: [
        {
          action: 'view',
          title: 'View Message',
          icon: '/favicon.ico'
        },
        {
          action: 'stake',
          title: `Stake ${message.stakeAmount} ONU`,
          icon: '/favicon.ico'
        }
      ]
    };

    return { ...defaultOptions, ...options };
  }

  private handleNotificationClick(message: NotificationMessage) {
    // Focus the window/tab
    if (window.focus) {
      window.focus();
    }

    // Navigate to the message (you can customize this)
    const url = `/boards/${message.board}#message-${message.id}`;
    window.location.href = url;
  }

  private updateBadge() {
    // Update PWA badge if supported
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(this.notificationCount).catch(() => {
        // Badge not supported
      });
    }

    // Update document title with notification count
    if (this.notificationCount > 0) {
      document.title = `(${this.notificationCount}) OnusOne`;
    } else {
      document.title = 'OnusOne';
    }
  }

  private playFallbackSound() {
    try {
      // Create a simple beep using the Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Fallback sound failed:', error);
    }
  }

  private showFallbackAlert(message: NotificationMessage) {
    // Fallback for when notifications fail
    const alertMessage = `New message in ${message.board}:\n${message.content.substring(0, 200)}...\nStaked: ${message.stakeAmount} ONU\nTotal: ${message.totalStaked} ONU`;
    alert(alertMessage);
  }

  // Public methods
  async notifyNewMessage(message: NotificationMessage): Promise<void> {
    await this.showNotification(message);
  }

  async notifyStakeUpdate(board: string, newStake: number, totalStaked: number): Promise<void> {
    const message: NotificationMessage = {
      id: `stake-${Date.now()}`,
      content: `Stake updated in ${board}`,
      author: 'System',
      board,
      stakeAmount: newStake,
      totalStaked,
      timestamp: new Date()
    };

    await this.showNotification(message, {
      title: `💰 Stake Update in ${board}`,
      body: `New stake: ${newStake} ONU\nTotal staked: ${totalStaked} ONU`,
      tag: `stake-${board}`,
      requireInteraction: false
    });
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  clearNotificationCount(): void {
    this.notificationCount = 0;
    this.updateBadge();
  }

  getNotificationCount(): number {
    return this.notificationCount;
  }

  // Test notification
  async testNotification(): Promise<void> {
    const testMessage: NotificationMessage = {
      id: 'test',
      content: 'This is a test notification to verify the system is working correctly.',
      author: 'Test User',
      board: 'Test Board',
      stakeAmount: 100,
      totalStaked: 1000,
      timestamp: new Date()
    };

    await this.showNotification(testMessage, {
      title: '🧪 Test Notification',
      body: 'If you see this, notifications are working!',
      requireInteraction: true
    });
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Types are already exported at the top of the file
