import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { realSolanaPayments, RealPayment } from '../lib/real-solana-payments';
import Button from './Button';
import { useToast } from './Toast';
import LoadingSpinner from './LoadingSpinner';
import ProgressBar from './ProgressBar';

interface TokenStakingProps {
  postId: string;
  currentStake?: number;
  onStakeSuccess?: (txSig: string, amount: number) => void;
  onStakeError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
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
  className = '',
  isOpen: externalIsOpen,
  onClose
}: TokenStakingProps) {
  const { publicKey, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { showSuccess, showError, showInfo, showLoading, dismissToast } = useToast();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external isOpen if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onClose ? onClose : setInternalIsOpen;
  const [stakeAmount, setStakeAmount] = useState(100);
  const [isStaking, setIsStaking] = useState(false);
  const [walletBalance, setWalletBalance] = useState<{ sol: number; onu: number } | null>(null);
  const [estimatedFee, setEstimatedFee] = useState(0.001);
  const [stakeSteps, setStakeSteps] = useState<StakeStep[]>([]);

  // Fetch balances when wallet connects
  useEffect(() => {
    const fetchBalances = async () => {
      if (!publicKey || !connected) {
        setWalletBalance(null);
        return;
      }

      try {
        const balance = await realSolanaPayments.getWalletBalance(publicKey.toString());
        setWalletBalance({ sol: balance.sol, onu: balance.onu });
      } catch (error) {
        console.error('Failed to fetch balances:', error);
        setWalletBalance({ sol: 0, onu: 0 });
      }
    };

    fetchBalances();
  }, [publicKey, connected]);

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
      
      if (!walletBalance || walletBalance.onu < stakeAmount) {
        updateStepStatus('validation', 'error', `Insufficient balance. Need ${stakeAmount} ONU, have ${walletBalance?.onu || 0}`);
        throw new Error('Insufficient token balance');
      }

      if (!walletBalance || walletBalance.sol < estimatedFee) {
        updateStepStatus('validation', 'error', `Insufficient SOL for fees. Need ${estimatedFee} SOL, have ${walletBalance?.sol || 0}`);
        throw new Error('Insufficient SOL for transaction fees');
      }

      updateStepStatus('validation', 'completed');

      // Step 2: Create Transaction
      updateStepStatus('creation', 'active');
      
      // For staking, we're essentially sending tokens to treasury as a stake
      // This is a real Solana transaction
      updateStepStatus('creation', 'completed');

      // Step 3: Sign Transaction
      updateStepStatus('signing', 'active');

      // Step 4: Broadcasting
      updateStepStatus('signing', 'completed');
      updateStepStatus('broadcasting', 'active');

      // Step 5: Confirmation - Execute the real Solana transaction
      updateStepStatus('broadcasting', 'completed');
      updateStepStatus('confirmation', 'active');

      // Use real Solana payments to stake tokens
      const payment: RealPayment = await realSolanaPayments.stakeForNode(wallet.adapter, stakeAmount);

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
          txSig: payment.signature
        })
      });

      if (!verificationResponse.ok) {
        const error = await verificationResponse.json();
        updateStepStatus('verification', 'error', error.details || 'Verification failed');
        throw new Error(error.details || 'Backend verification failed');
      }

      updateStepStatus('verification', 'completed');

      // Success!
      console.log('✅ Stake transaction completed successfully:', payment.signature);
      
      if (onStakeSuccess) {
        onStakeSuccess(payment.signature, stakeAmount);
      }

      // Update local balance
      if (walletBalance) {
        setWalletBalance({
          sol: walletBalance.sol,
          onu: walletBalance.onu - stakeAmount
        });
      }

      // Close modal after brief delay
      setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          setInternalIsOpen(false);
        }
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

  const canStake = connected && walletBalance !== null && walletBalance.onu >= stakeAmount && 
                   walletBalance.sol >= estimatedFee;

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
      {/* Stake Button - only show if no external control */}
      {externalIsOpen === undefined && (
        <Button
          onClick={() => setInternalIsOpen(true)}
          disabled={disabled || isStaking}
          size="sm"
          variant="primary"
          className={className}
        >
          {isStaking ? 'Processing...' : '💰 Stake'}
        </Button>
      )}

      {/* Stake Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl shadow-black/50">
            <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Stake ONU</h3>
                <button
                  onClick={() => {
                    if (onClose) {
                      onClose();
                    } else {
                      setInternalIsOpen(false);
                    }
                  }}
                  disabled={isStaking}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
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
                    <h4 className="text-lg font-medium text-white mb-2">Connect</h4>
                    <p className="text-gray-400 mb-6">
                      Link your wallet to stake on this post.
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
                          Amount (ONU)
                        </label>
                        <input
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          max={walletBalance?.onu || 1000000}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[100, 500, 1000].map(amount => (
                          <button
                            key={amount}
                            onClick={() => setStakeAmount(amount)}
                            className={`px-3 py-2 border rounded text-white text-sm transition-all duration-200 font-mono ${
                              stakeAmount === amount 
                                ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/25' 
                                : 'bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-gray-500'
                            }`}
                          >
                            {amount}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Balance Information */}
                  <div className="mb-6 p-4 bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition-all duration-300">
                    <h5 className="text-sm font-medium text-white mb-3">Wallet Status</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-400">ONU:</span>
                        <span className="text-white font-mono">
                          {walletBalance !== null ? `${walletBalance.onu.toFixed(2)}` : 'Loading...'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-400">SOL:</span>
                        <span className="text-white font-mono">
                          {walletBalance !== null ? `${walletBalance.sol.toFixed(4)}` : 'Loading...'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-400">Fee:</span>
                        <span className="text-white font-mono">{estimatedFee} SOL</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-400">Stake:</span>
                        <span className="text-white font-mono">{currentStake} ONU</span>
                      </div>
                    </div>
                  </div>

                  {/* Validation Messages */}
                  {!canStake && connected && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                      {walletBalance !== null && walletBalance.onu < stakeAmount && (
                        <div>Insufficient ONU. Need {stakeAmount}, have {walletBalance.onu.toFixed(2)}</div>
                      )}
                      {walletBalance !== null && walletBalance.sol < estimatedFee && (
                        <div>Insufficient SOL for fees. Need {estimatedFee}, have {walletBalance.sol.toFixed(4)}</div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => {
                        if (onClose) {
                          onClose();
                        } else {
                          setInternalIsOpen(false);
                        }
                      }}
                      variant="secondary"
                      className="flex-1 hover:bg-gray-700 transition-all duration-200"
                      disabled={isStaking}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStakeTokens}
                      variant="primary"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 transition-all duration-200"
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