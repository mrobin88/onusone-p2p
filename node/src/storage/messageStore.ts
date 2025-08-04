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
}