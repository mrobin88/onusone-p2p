import React, { useState, useEffect } from 'react';
import { useWalletAuth } from './WalletAuth';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';

interface WalletData {
  balance: number;
  stakedTokens: number;
  earnedTokens: number;
  burnedTokens: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: 'stake' | 'burn' | 'reward' | 'fee';
  amount: number;
  contentId?: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

export default function Wallet() {
  const { user, isAuthenticated } = useWalletAuth();
  const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'OnU';
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [onuBalance, setOnuBalance] = useState<number>(0);
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 1000, // Starting balance
    stakedTokens: 0,
    earnedTokens: 0,
    burnedTokens: 0,
    transactions: []
  });
  const [isOpen, setIsOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(100);

  // Fetch OnU token balance when wallet changes
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const mint = process.env.NEXT_PUBLIC_TOKEN_MINT;
        if (!connected || !publicKey || !mint) return;
        const endpoint = (process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY && /^https?:\/\//.test(process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY))
          ? process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY!
          : (process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY
              ? `https://solana-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY}`
              : 'https://api.mainnet-beta.solana.com');
        const connection = new Connection(endpoint);
        // Minimal associated token account lookup
        const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
        const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        const mintKey = new PublicKey(mint);
        const [ata] = await PublicKey.findProgramAddress(
          [publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintKey.toBuffer()],
          ATA_PROGRAM_ID
        );
        const acc = await connection.getTokenAccountBalance(ata).catch(() => null);
        const amount = acc?.value?.uiAmount ?? 0;
        setOnuBalance(amount);
      } catch {
        setOnuBalance(0);
      }
    };
    fetchBalance();
  }, [connected, publicKey]);
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      setWalletData(prev => ({
        ...prev,
        // Simulate small token earnings
        earnedTokens: prev.earnedTokens + Math.floor(Math.random() * 5),
        // Simulate small token burns
        burnedTokens: prev.burnedTokens + Math.floor(Math.random() * 2),
        transactions: [
          ...prev.transactions.slice(-9), // Keep last 9
          {
            id: `tx_${Date.now()}`,
            type: (Math.random() > 0.5 ? 'reward' : 'burn') as 'stake' | 'burn' | 'reward' | 'fee',
            amount: Math.floor(Math.random() * 10) + 1,
            contentId: `content_${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date(),
            status: 'confirmed' as 'pending' | 'confirmed' | 'failed'
          }
        ].slice(-10) // Keep last 10 transactions
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const formatTokens = (amount: number) => {
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)}M`;
    } else if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'stake': return '🎯';
      case 'burn': return '🔥';
      case 'reward': return '💰';
      case 'fee': return '💳';
      default: return '📝';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'stake': return 'text-blue-400';
      case 'burn': return 'text-red-400';
      case 'reward': return 'text-green-400';
      case 'fee': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg">
        <button className="text-blue-400 underline mr-3" onClick={() => setVisible(true)}>Connect Wallet</button>
        <span className="text-gray-400">Login to view {TOKEN_SYMBOL} wallet</span>
      </div>
    );
  }

  return (
    <>
      {/* Wallet Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors duration-200 flex items-center space-x-2"
      >
        <span>💰</span>
        <span>{formatTokens(onuBalance)} {TOKEN_SYMBOL}</span>
      </button>

      {/* Wallet Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">OnusOne Wallet</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-1">Temporal Token Balance</p>
            </div>

            {/* Balance Section */}
            <div className="p-6 border-b border-gray-700">
              <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {formatTokens(walletData.balance)}
                  </div>
                <div className="text-sm text-gray-400">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {formatTokens(walletData.stakedTokens)}
                  </div>
                <div className="text-sm text-gray-400">Staked</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-400">
                    +{formatTokens(walletData.earnedTokens)}
                  </div>
                  <div className="text-xs text-gray-500">Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-400">
                    -{formatTokens(walletData.burnedTokens)}
                  </div>
                  <div className="text-xs text-gray-500">Burned</div>
                </div>
              </div>
            </div>

            {/* Stake Section */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(parseInt(e.target.value) || 0)}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                  placeholder={`Amount to stake (${TOKEN_SYMBOL})`}
                  min="10"
                  max="1000"
                />
                <button
                  onClick={() => {
                    if (stakeAmount >= 10 && stakeAmount <= walletData.balance) {
                      setWalletData(prev => ({
                        ...prev,
                        balance: prev.balance - stakeAmount,
                        stakedTokens: prev.stakedTokens + stakeAmount,
                        transactions: [{
                          id: `tx_${Date.now()}`,
                          type: 'stake' as 'stake' | 'burn' | 'reward' | 'fee',
                          amount: stakeAmount,
                          timestamp: new Date(),
                          status: 'confirmed' as 'pending' | 'confirmed' | 'failed'
                        }, ...prev.transactions].slice(0, 10)
                      }));
                      alert(`🎯 ${stakeAmount} ${TOKEN_SYMBOL} staked on next post!`);
                    } else {
                      alert('❌ Invalid stake amount (10-1000 ONU)');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Stake
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Stake tokens to post content (10-1000 {TOKEN_SYMBOL})
              </p>
            </div>

            {/* Transactions */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Recent Transactions</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {walletData.transactions.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No transactions yet</p>
                ) : (
                  walletData.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span>{getTransactionIcon(tx.type)}</span>
                        <span className="text-gray-400">
                          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                        </span>
                      </div>
                      <div className={`font-semibold ${getTransactionColor(tx.type)}`}>
                        {tx.type === 'burn' || tx.type === 'stake' ? '-' : '+'}{tx.amount} {TOKEN_SYMBOL}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-800 text-center">
              <p className="text-xs text-gray-500">
                💡 Tip: Quality content prevents token decay!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}