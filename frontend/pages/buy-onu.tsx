/**
 * Buy ONU Tokens with Fiat
 * REAL Stripe integration - Credit card to ONU tokens
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { realSolanaPayments, fiatOnRamp } from '../lib/real-solana-payments';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PurchaseOption {
  usd: number;
  onu: number;
  popular?: boolean;
  bonus?: string;
}

const PURCHASE_OPTIONS: PurchaseOption[] = [
  { usd: 25, onu: 50, bonus: 'Best for trying' },
  { usd: 100, onu: 200, popular: true, bonus: '100% bonus ONU' },
  { usd: 500, onu: 1100, bonus: '120% bonus ONU' },
  { usd: 1000, onu: 2500, bonus: '150% bonus ONU' }
];

function BuyONUForm() {
  const { connected, publicKey } = useWallet();
  const [selectedOption, setSelectedOption] = useState<PurchaseOption>(PURCHASE_OPTIONS[1]);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState(0.50);
  
  const stripe = useStripe();
  const elements = useElements();

  // Load wallet balance and current price
  useEffect(() => {
    if (connected && publicKey) {
      loadWalletData();
    }
  }, [connected, publicKey]);

  const loadWalletData = async () => {
    if (!publicKey) return;
    
    try {
      const balance = await realSolanaPayments.getWalletBalance(publicKey.toString());
      const price = await realSolanaPayments.getONUPrice();
      
      setWalletBalance(balance);
      setCurrentPrice(price);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
  };

  const calculateONU = (usdAmount: number): number => {
    const baseONU = usdAmount / currentPrice;
    
    // Bonus structure
    if (usdAmount >= 1000) return baseONU * 2.5; // 150% bonus
    if (usdAmount >= 500) return baseONU * 2.2;  // 120% bonus  
    if (usdAmount >= 100) return baseONU * 2;    // 100% bonus
    return baseONU;
  };

  const handlePurchase = async () => {
    if (!stripe || !elements || !connected || !publicKey) return;

    setIsProcessing(true);

    try {
      const usdAmount = selectedOption ? selectedOption.usd : parseFloat(customAmount);
      const onuAmount = calculateONU(usdAmount);

      // Create payment intent
      const { clientSecret } = await fiatOnRamp.createONUPurchase(
        usdAmount,
        publicKey.toString()
      );

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Verify and deliver tokens
        const response = await fetch('/api/stripe/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id })
        });

        if (response.ok) {
          const result = await response.json();
          alert(`Success! ${result.onuAmount} ONU tokens sent to your wallet.\nTransaction: ${result.signature}`);
          await loadWalletData(); // Refresh balance
        } else {
          throw new Error('Token delivery failed');
        }
      }

    } catch (error) {
      console.error('Purchase failed:', error);
      alert(`Purchase failed: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <a href="/" className="text-xl font-bold text-blue-600">OnusOne P2P</a>
              <a href="/buy-onu" className="text-gray-700 hover:text-blue-600 font-medium">💳 Buy ONU</a>
              <a href="/become-node" className="text-gray-700 hover:text-blue-600">💰 Become Node</a>
            </div>
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">💳 Buy ONU Tokens</h1>
          <p className="text-xl text-gray-600">
            Get ONU tokens instantly with your credit card. Use them to post messages and earn as a node operator.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg inline-block">
            <div className="text-sm text-blue-800">
              <strong>Current Price:</strong> ${currentPrice.toFixed(2)} per ONU
            </div>
          </div>
        </div>

        {!connected ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔐</div>
            <p className="text-gray-600 mb-4">Connect your Solana wallet to buy ONU tokens</p>
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Purchase Options */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">💰 Choose Amount</h2>
                
                <div className="space-y-3 mb-6">
                  {PURCHASE_OPTIONS.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedOption(option)}
                      className={`w-full p-4 border rounded-lg text-left transition-all ${
                        selectedOption === option
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">${option.usd} USD</div>
                          <div className="text-sm text-gray-600">{option.onu} ONU tokens</div>
                          {option.bonus && (
                            <div className="text-xs text-green-600 font-medium">{option.bonus}</div>
                          )}
                        </div>
                        {option.popular && (
                          <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Popular</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-2">Custom Amount</label>
                  <input
                    type="number"
                    placeholder="Enter USD amount (min $10)"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      if (e.target.value) {
                        setSelectedOption({
                          usd: parseFloat(e.target.value) || 0,
                          onu: calculateONU(parseFloat(e.target.value) || 0)
                        });
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  {customAmount && (
                    <div className="text-sm text-gray-600 mt-1">
                      = {calculateONU(parseFloat(customAmount) || 0).toFixed(2)} ONU tokens
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Form */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">💳 Payment Details</h3>
                
                <div className="mb-4">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                      },
                    }}
                    className="p-3 border border-gray-300 rounded"
                  />
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={isProcessing || !selectedOption?.usd}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded font-medium disabled:opacity-50"
                >
                  {isProcessing ? (
                    '⏳ Processing...'
                  ) : (
                    `🚀 Buy ${selectedOption?.onu.toFixed(2) || 0} ONU for $${selectedOption?.usd || 0}`
                  )}
                </button>

                <div className="text-xs text-gray-500 mt-3 text-center">
                  Secure payment processed by Stripe. ONU tokens will be delivered to your Solana wallet.
                </div>
              </div>
            </div>

            {/* Right: Wallet Info */}
            <div className="space-y-6">
              {walletBalance && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">💼 Your Wallet</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>SOL Balance:</span>
                      <span className="font-medium">{walletBalance.sol.toFixed(4)} SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ONU Balance:</span>
                      <span className="font-medium">{walletBalance.onu.toFixed(2)} ONU</span>
                    </div>
                    <div className="flex justify-between">
                      <span>USD Value:</span>
                      <span className="font-medium text-green-600">
                        ${(walletBalance.onu * currentPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                    <div className="font-medium">Wallet Address:</div>
                    <div className="text-gray-600 break-all">
                      {publicKey?.toString()}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">💡 What You Can Do</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500">📝</span>
                    <div>
                      <div className="font-medium">Post Messages</div>
                      <div className="text-gray-600">~10 ONU per message</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-500">🚀</span>
                    <div>
                      <div className="font-medium">Boost Content</div>
                      <div className="text-gray-600">Stake ONU to increase visibility</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-500">💰</span>
                    <div>
                      <div className="font-medium">Run Edge Node</div>
                      <div className="text-gray-600">Earn $4-8/day hosting messages</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm">
                  <div className="font-medium text-yellow-800 mb-1">💡 Pro Tip</div>
                  <div className="text-yellow-700">
                    Buy $100+ to get bonus ONU tokens for posting messages!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuyONU() {
  return (
    <Elements stripe={stripePromise}>
      <BuyONUForm />
    </Elements>
  );
}
