import React, { useState, useEffect } from 'react';
import { useWalletAuth } from '../components/WalletAuth';
import { formatDistanceToNow } from 'date-fns';

interface TimeCapsule {
  id: string;
  content: string;
  author: string;
  authorwallet: string;
  unlockAt: number;
  cost: number;
  timestamp: number;
  isUnlocked: boolean;
}

const CapsulesPage: React.FC = () => {
  const { user, isAuthenticated, connectWallet, logout } = useWalletAuth();
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [newCapsule, setNewCapsule] = useState({
    content: '',
    unlockDate: '',
    unlockTime: '',
    cost: 0
  });
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'unlocked' | 'locked'>('create');

  useEffect(() => {
    fetchCapsules();
    
    // Only set up polling in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(fetchCapsules, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, []);

  const fetchCapsules = async () => {
    try {
      const response = await fetch('/api/time-capsules/unlocked');
      if (response.ok) {
        const data = await response.json();
        setCapsules(data.timeCapsules || []);
      }
    } catch (error) {
      console.error('Failed to fetch capsules:', error);
    }
  };

  const createCapsule = async () => {
    if (!isAuthenticated || !user?.walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (!newCapsule.content.trim()) {
      alert('Please enter a message');
      return;
    }

    if (!newCapsule.unlockDate || !newCapsule.unlockTime) {
      alert('Please select unlock date and time');
      return;
    }

    setIsCreating(true);
    try {
      const unlockDateTime = new Date(`${newCapsule.unlockDate}T${newCapsule.unlockTime}`);
      const unlockTimestamp = unlockDateTime.getTime();

      const response = await fetch('/api/time-capsules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newCapsule.content,
          authorwallet: user.walletAddress,
          unlockAt: unlockTimestamp,
          cost: newCapsule.cost
        })
      });

      if (response.ok) {
        setNewCapsule({ content: '', unlockDate: '', unlockTime: '', cost: 0 });
        fetchCapsules();
        alert('Time capsule created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create capsule: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to create time capsule');
    } finally {
      setIsCreating(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 10);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Time Capsules
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Send messages to your future self or loved ones. 
            Unlock them on special dates, anniversaries, or milestones.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            How Time Capsules Work
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Create Your Message</h3>
              <p className="text-gray-600">
                Write a personal message, set an unlock date, and optionally add ONU tokens for premium features.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-green-600">2</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Secure Storage</h3>
              <p className="text-gray-600">
                Your message is encrypted and stored on the blockchain, completely secure and private.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-purple-600">3</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Automatic Unlock</h3>
              <p className="text-gray-600">
                On your chosen date, the message automatically unlocks and becomes accessible.
              </p>
            </div>
          </div>
        </div>

        {/* ONU Token Explanation */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
            What Are ONU Tokens?
          </h2>
          <div className="text-center text-gray-700 space-y-3">
            <p>
              <strong>ONU tokens</strong> are the digital currency of the OnusOne platform. 
              You can earn them by participating in the community or purchase them directly.
            </p>
            <p>
              <strong>Free time capsules</strong> are available to everyone. 
              <strong>Premium capsules</strong> with ONU tokens offer enhanced features like 
              longer storage times, priority unlocking, and special metadata.
            </p>
            <div className="mt-4">
              <a 
                href="/buy-onu" 
                className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                Get ONU Tokens
              </a>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'create'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Create New Capsule
              </button>
              <button
                onClick={() => setActiveTab('unlocked')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'unlocked'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Unlocked Capsules
              </button>
              <button
                onClick={() => setActiveTab('locked')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'locked'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Locked Capsules
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Create Tab */}
            {activeTab === 'create' && (
              <div className="space-y-6">
                {!isAuthenticated ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">Connect your wallet to create time capsules</p>
                    <button
                      onClick={connectWallet}
                      className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Connect Wallet
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Message
                      </label>
                      <textarea
                        value={newCapsule.content}
                        onChange={(e) => setNewCapsule({ ...newCapsule, content: e.target.value })}
                        placeholder="Write a message to your future self..."
                        className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        maxLength={500}
                      />
                      <div className="text-right text-sm text-gray-500 mt-1">
                        {newCapsule.content.length}/500 characters
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unlock Date
                        </label>
                        <input
                          type="date"
                          value={newCapsule.unlockDate}
                          onChange={(e) => setNewCapsule({ ...newCapsule, unlockDate: e.target.value })}
                          min={getMinDate()}
                          max={getMaxDate()}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unlock Time
                        </label>
                        <input
                          type="time"
                          value={newCapsule.unlockTime}
                          onChange={(e) => setNewCapsule({ ...newCapsule, unlockTime: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ONU Token Cost (Optional)
                      </label>
                      <input
                        type="number"
                        value={newCapsule.cost}
                        onChange={(e) => setNewCapsule({ ...newCapsule, cost: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="1000"
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Premium capsules with tokens get enhanced features and longer storage
                      </p>
                    </div>

                    <button
                      onClick={createCapsule}
                      disabled={isCreating}
                      className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCreating ? 'Creating...' : 'Create Time Capsule'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Unlocked Tab */}
            {activeTab === 'unlocked' && (
              <div>
                {capsules.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No unlocked time capsules yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {capsules.map((capsule) => (
                      <div key={capsule.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-gray-900">{capsule.author}</p>
                            <p className="text-sm text-gray-500">
                              Unlocked {formatDistanceToNow(capsule.unlockAt)} ago
                            </p>
                          </div>
                          {capsule.cost > 0 && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                              {capsule.cost} ONU
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{capsule.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Locked Tab */}
            {activeTab === 'locked' && (
              <div className="text-center py-12">
                <p className="text-gray-500">Locked capsules will appear here when they're ready to unlock</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapsulesPage;


