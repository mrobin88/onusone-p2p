/**
 * Simple message store for OnusOne P2P Node
 */

interface Message {
  id: string;
  content: string;
  author: string;
  boardType: string;
  timestamp: number;
  score: number;
  decayRate: number;
}

enum BoardType {
  GENERAL = 'GENERAL',
  TECH = 'TECH',
  POLITICS = 'POLITICS',
  SCIENCE = 'SCIENCE'
}

export class MessageStore {
  private messages: Map<string, Message> = new Map();

  async addMessage(message: Message): Promise<void> {
    this.messages.set(message.id, message);
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  async getMessage(id: string): Promise<Message | null> {
    return this.messages.get(id) || null;
  }

  async deleteMessage(id: string): Promise<boolean> {
    return this.messages.delete(id);
  }

  async getMessagesByBoard(boardType: BoardType): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.boardType === boardType)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // New methods for P2P functionality
  getMessageCount(): number {
    return this.messages.size;
  }

  async storeMessage(message: any): Promise<void> {
    // Convert P2P message format to internal message format
    const internalMessage: Message = {
      id: message.id,
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
      author: message.author || 'anonymous',
      boardType: message.board || BoardType.GENERAL,
      timestamp: new Date(message.timestamp).getTime(),
      score: 100, // Start with full score
      decayRate: 1.0
    };
    
    await this.addMessage(internalMessage);
  }

  async getRecentMessages(since: Date): Promise<any[]> {
    const sinceTimestamp = since.getTime();
    return Array.from(this.messages.values())
      .filter(msg => msg.timestamp >= sinceTimestamp)
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(msg => ({
        id: msg.id,
        type: 'message',
        content: msg.content,
        author: msg.author,
        board: msg.boardType,
        timestamp: new Date(msg.timestamp).toISOString(),
        score: msg.score
      }));
  }
}