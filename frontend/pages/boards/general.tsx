import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWalletAuth } from '../../components/WalletAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Button from '../../components/Button';

interface Message {
  id: string;
  content: string;
  username: string;
  timestamp: string;
  walletAddress?: string;
}

export default function GeneralBoard() {
  const { user, isAuthenticated } = useWalletAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock messages for now
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Welcome to the main chat. This is where the real conversation happens.',
        username: 'System',
        timestamp: new Date().toLocaleString()
      },
      {
        id: '2',
        content: 'Industrial P2P network is live. No corporate bullshit here.',
        username: 'User001',
        timestamp: new Date().toLocaleString()
      }
    ];
    setMessages(mockMessages);
    setLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAuthenticated) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      username: user?.username || 'Anonymous',
      timestamp: new Date().toLocaleString(),
      walletAddress: user?.walletAddress
    };

    setMessages(prev => [message, ...prev]);
    setNewMessage('');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Main Chat - OnusOne P2P</title>
        <meta name="description" content="Main chat board for the industrial P2P network" />
      </Head>

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-400">
            ← Back to Network
          </Link>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <span className="text-gray-300">Welcome, {user?.username}</span>
            ) : (
              <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Main Chat Board</h1>
          
          {/* Chat Messages */}
          <div className="bg-gray-900 rounded-lg p-6 mb-6 min-h-96">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading messages...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-blue-400">{message.username}</span>
                      <span className="text-sm text-gray-500">{message.timestamp}</span>
                    </div>
                    <p className="text-gray-300">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {newMessage.length}/500 characters
                </span>
                <Button type="submit" disabled={!newMessage.trim()}>
                  Send Message
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 bg-gray-900 rounded-lg">
              <p className="text-gray-400 mb-4">Connect your wallet to participate in the chat</p>
              <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
