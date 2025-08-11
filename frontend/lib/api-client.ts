/**
 * API Client for Working Backend
 * Handles all communication with the backend API
 */

import { P2P_CONFIG } from '../env.config';

export interface Message {
  id: string;
  content: string;
  author: string;
  boardSlug: string;
  timestamp: number;
  ipfsHash?: string;
  stakeAmount?: number;
  decayScore?: number;
}

export interface Board {
  slug: string;
  name: string;
  description: string;
  createdAt: number;
}

export interface User {
  username: string;
  reputation: number;
  posts: number;
  joinedAt: number;
}

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = P2P_CONFIG.BOOTSTRAP_NODES[0];
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async getHealth(): Promise<any> {
    return this.request('/health');
  }

  // Get all boards
  async getBoards(): Promise<Board[]> {
    return this.request('/api/boards');
  }

  // Get messages for a specific board
  async getBoardMessages(boardSlug: string): Promise<Message[]> {
    return this.request(`/api/boards/${boardSlug}/messages`);
  }

  // Create a new message
  async createMessage(boardSlug: string, content: string, author: string): Promise<Message> {
    return this.request(`/api/boards/${boardSlug}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, author }),
    });
  }

  // Get user profile
  async getUser(username: string): Promise<User> {
    return this.request(`/api/users/${username}`);
  }

  // Test endpoint
  async test(): Promise<any> {
    return this.request('/api/test');
  }

  // Check if backend is available
  async isAvailable(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();
