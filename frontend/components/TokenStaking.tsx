import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { getSolanaTransactionManager, SolanaTransactionResult } from '../lib/solana-transactions';
import Button from './Button';

interface TokenStakingProps {
  postId: string;
  currentStake?: number;
  onStakeSuccess?: (txSig: string, amount: number) => void;
  onStakeError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

interface StakeStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  error?: string;
}

export default function TokenStaking({
  postId,
  currentStake = 0,
  onStakeSuccess,
  onStakeError,
  disabled = false,
  className = ''
}: TokenStakingProps) {
  const { publicKey, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [isOpen, setIsOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(100);
  const [isStaking, setIsStaking] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [estimatedFee, setEstimatedFee] = useState(0.001);
  const [stakeSteps, setStakeSteps] = useState<StakeStep[]>([]);

  const solanaManager = getSolanaTransactionManager();

  // Fetch balances when wallet connects
  useEffect(() => {
    const fetchBalances = async () => {
      if (!publicKey || !connected) {
        setTokenBalance(null);
        setSolBalance(null);
        return;
      }

      try {
        const [onuBalance, solBal] = await Promise.all([
          solanaManager.getTokenBalance(publicKey),
          solanaManager.getSolBalance(publicKey)
        ]);

        setTokenBalance(onuBalance);
        setSolBalance(solBal);
      } catch (error) {
        console.error('Failed to fetch balances:', error);
        setTokenBalance(0);
        setSolBalance(0);
      }
    };

    fetchBalances();
  }, [publicKey, connected, solanaManager]);

  // Initialize stake steps
  const initializeStakeSteps = (): StakeStep[] => [
    {
      id: 'validation',
      title: 'Validate Transaction',
      description: 'Checking wallet connection and token balance',
      status: 'pending'
    },
    {
      id: 'creation',
      title: 'Create Transaction',
      description: 'Building Solana transaction for token transfer',
      status: 'pending'
    },
    {
      id: 'signing',
      title: 'Sign Transaction',
      description: 'Approve transaction in your wallet',
      status: 'pending'
    },
    {
      id: 'broadcasting',
      title: 'Submit to Blockchain',
      description: 'Broadcasting transaction to Solana network',
      status: 'pending'
    },
    {
      id: 'confirmation',
      title: 'Confirm Transaction',
      description: 'Waiting for blockchain confirmation',
      status: 'pending'
    },
    {
      id: 'verification',
      title: 'Verify Stake',
      description: 'Recording stake and updating post',
      status: 'pending'
    }
  ];

  const updateStepStatus = (stepId: string, status: StakeStep['status'], error?: string) => {
    setStakeSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, error } : step
    ));
  };

  const handleConnectWallet = () => {
    setVisible(true);
  };

  const handleStakeTokens = async () => {
    if (!connected || !publicKey || !wallet) {
      handleConnectWallet();
      return;
    }

    setIsStaking(true);
    setStakeSteps(initializeStakeSteps());

    try {
      // Step 1: Validation
      updateStepStatus('validation', 'active');
      
      if (tokenBalance === null || tokenBalance < stakeAmount) {
        updateStepStatus('validation', 'error', `Insufficient balance. Need ${stakeAmount} ONU, have ${tokenBalance || 0}`);
        throw new Error('Insufficient token balance');
      }

      if (solBalance === null || solBalance < estimatedFee) {
        updateStepStatus('validation', 'error', `Insufficient SOL for fees. Need ${estimatedFee} SOL, have ${solBalance || 0}`);
        throw new Error('Insufficient SOL for transaction fees');
      }

      updateStepStatus('validation', 'completed');

      // Step 2: Create Transaction
      updateStepStatus('creation', 'active');

      const stakeParams = {
        amount: stakeAmount,
        postId,
        type: 'post' as const
      };

      // Validate parameters
      const validation = solanaManager.validateStakeParams(stakeParams);
      if (!validation.isValid) {
        updateStepStatus('creation', 'error', validation.error);
        throw new Error(validation.error);
      }

      const { transaction } = await solanaManager.createStakeTransaction(
        stakeParams,
        { publicKey, connected, wallet, signTransaction: wallet.adapter.signTransaction }
      );

      updateStepStatus('creation', 'completed');

      // Step 3: Sign Transaction
      updateStepStatus('signing', 'active');

      // Step 4: Broadcasting
      updateStepStatus('signing', 'completed');
      updateStepStatus('broadcasting', 'active');

      // Step 5: Confirmation
      updateStepStatus('broadcasting', 'completed');
      updateStepStatus('confirmation', 'active');

      // Execute the transaction
      const result = await solanaManager.executeStakeTransaction(
        stakeParams,
        { publicKey, connected, wallet, signTransaction: wallet.adapter.signTransaction }
      );

      if (!result.success) {
        updateStepStatus('confirmation', 'error', result.error);
        throw new Error(result.error || 'Transaction failed');
      }

      updateStepStatus('confirmation', 'completed');

      // Step 6: Verification
      updateStepStatus('verification', 'active');

      // Submit transaction to backend for verification
      const verificationResponse = await fetch('/api/stake/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          amount: stakeAmount,
          type: 'post',
          txSig: result.txSig
        })
      });

      if (!verificationResponse.ok) {
        const error = await verificationResponse.json();
        updateStepStatus('verification', 'error', error.details || 'Verification failed');
        throw new Error(error.details || 'Backend verification failed');
      }

      updateStepStatus('verification', 'completed');

      // Success!
      console.log('✅ Stake transaction completed successfully:', result.txSig);
      
      if (onStakeSuccess) {
        onStakeSuccess(result.txSig!, stakeAmount);
      }

      // Update local balance
      if (tokenBalance !== null) {
        setTokenBalance(tokenBalance - stakeAmount);
      }

      // Close modal after brief delay
      setTimeout(() => {
        setIsOpen(false);
        setStakeSteps([]);
      }, 2000);

    } catch (error) {
      console.error('Stake transaction failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (onStakeError) {
        onStakeError(errorMessage);
      }

      // Keep modal open to show error state
    } finally {
      setIsStaking(false);
    }
  };

  const canStake = connected && tokenBalance !== null && tokenBalance >= stakeAmount && 
                   solBalance !== null && solBalance >= estimatedFee;

  const getStepIcon = (status: StakeStep['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'active': return '🔄';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <>
      {/* Stake Button */}
      <Button
        onClick={() => setIsOpen(true)}
        disabled={disabled || isStaking}
        size="sm"
        variant="primary"
        className={className}
      >
        {isStaking ? 'Staking...' : '💰 Stake Tokens'}
      </Button>

      {/* Stake Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Stake ONU Tokens</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isStaking}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {!connected ? (
                /* Wallet Connection */
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔗</span>
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">Connect Wallet</h4>
                    <p className="text-gray-400 mb-6">
                      Connect your Solana wallet to stake ONU tokens on this post.
                    </p>
                  </div>
                  <Button onClick={handleConnectWallet} variant="primary">
                    Connect Wallet
                  </Button>
                </div>
              ) : isStaking && stakeSteps.length > 0 ? (
                /* Transaction Progress */
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Transaction Progress</h4>
                  <div className="space-y-4">
                    {stakeSteps.map((step) => (
                      <div key={step.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 text-lg">
                          {getStepIcon(step.status)}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{step.title}</div>
                          <div className="text-sm text-gray-400">{step.description}</div>
                          {step.error && (
                            <div className="text-sm text-red-400 mt-1">{step.error}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Stake Configuration */
                <div>
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-white mb-2">Stake Amount</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          Amount (ONU tokens)
                        </label>
                        <input
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          max={tokenBalance || 1000000}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[100, 500, 1000].map(amount => (
                          <button
                            key={amount}
                            onClick={() => setStakeAmount(amount)}
                            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-white text-sm transition-colors"
                          >
                            {amount}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Balance Information */}
                  <div className="mb-6 p-4 bg-gray-800 rounded">
                    <h5 className="text-sm font-medium text-white mb-3">Wallet Information</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">ONU Balance:</span>
                        <span className="text-white">
                          {tokenBalance !== null ? `${tokenBalance.toFixed(2)}` : 'Loading...'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">SOL Balance:</span>
                        <span className="text-white">
                          {solBalance !== null ? `${solBalance.toFixed(4)}` : 'Loading...'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Estimated Fee:</span>
                        <span className="text-white">{estimatedFee} SOL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current Post Stake:</span>
                        <span className="text-white">{currentStake} ONU</span>
                      </div>
                    </div>
                  </div>

                  {/* Validation Messages */}
                  {!canStake && connected && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                      {tokenBalance !== null && tokenBalance < stakeAmount && (
                        <div>Insufficient ONU tokens. Need {stakeAmount}, have {tokenBalance.toFixed(2)}</div>
                      )}
                      {solBalance !== null && solBalance < estimatedFee && (
                        <div>Insufficient SOL for transaction fees. Need {estimatedFee}, have {solBalance.toFixed(4)}</div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => setIsOpen(false)}
                      variant="secondary"
                      className="flex-1"
                      disabled={isStaking}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStakeTokens}
                      variant="primary"
                      className="flex-1"
                      disabled={!canStake || isStaking}
                    >
                      {isStaking ? 'Processing...' : `Stake ${stakeAmount} ONU`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}