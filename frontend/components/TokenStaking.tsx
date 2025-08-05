import React, { useState } from 'react';
import Button from './Button';

interface TokenStakingProps {
  onStake: (amount: number) => Promise<boolean>;
  userBalance: number;
  isPosting: boolean;
}

export default function TokenStaking({ onStake, userBalance, isPosting }: TokenStakingProps) {
  const [stakeAmount, setStakeAmount] = useState(100);
  const [isStaking, setIsStaking] = useState(false);

  const handleStake = async () => {
    if (stakeAmount < 10 || stakeAmount > userBalance) {
      alert('❌ Invalid stake amount');
      return;
    }

    setIsStaking(true);
    try {
      const success = await onStake(stakeAmount);
      if (success) {
        alert(`🎯 ${stakeAmount} ONU staked on your post!`);
      } else {
        alert('❌ Failed to stake tokens');
      }
    } catch (error) {
      console.error('Staking error:', error);
      alert('❌ Staking failed');
    } finally {
      setIsStaking(false);
    }
  };

  const getStakeColor = () => {
    if (stakeAmount < 50) return 'text-red-400';
    if (stakeAmount < 100) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStakeLabel = () => {
    if (stakeAmount < 50) return 'Low Quality';
    if (stakeAmount < 100) return 'Medium Quality';
    if (stakeAmount < 200) return 'High Quality';
    return 'Premium Quality';
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-400">💰 Token Stake</h3>
        <div className={`text-sm font-medium ${getStakeColor()}`}>
          {getStakeLabel()}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Stake Amount:</span>
          <span className="text-sm text-gray-400">Balance: {userBalance} ONU</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="10"
            max={Math.min(1000, userBalance)}
            value={stakeAmount}
            onChange={(e) => setStakeAmount(parseInt(e.target.value))}
            className="flex-1"
            disabled={isPosting || isStaking}
          />
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(parseInt(e.target.value) || 10)}
            className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            min="10"
            max={Math.min(1000, userBalance)}
            disabled={isPosting || isStaking}
          />
          <span className="text-sm text-gray-400">ONU</span>
        </div>
      </div>

      <div className="bg-gray-900 p-3 rounded mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Content Lifespan:</div>
            <div className="text-green-400 font-medium">
              {Math.round(stakeAmount / 2)} hours
            </div>
          </div>
          <div>
            <div className="text-gray-400">Potential Rewards:</div>
            <div className="text-blue-400 font-medium">
              {Math.round(stakeAmount * 1.5)} ONU
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        💡 <strong>How it works:</strong> Stake tokens to post content. High engagement prevents decay. 
        Quality content earns rewards. Poor content burns tokens.
      </div>

      <Button
        onClick={handleStake}
        disabled={isPosting || isStaking || stakeAmount < 10 || stakeAmount > userBalance}
        className="w-full"
        variant="primary"
      >
        {isStaking ? 'Staking...' : `Stake ${stakeAmount} ONU`}
      </Button>

      {stakeAmount < 50 && (
        <div className="mt-2 text-xs text-red-400">
          ⚠️ Low stakes are more likely to burn quickly
        </div>
      )}
    </div>
  );
}