import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { useWalletAuth } from '../components/WalletAuth';
import ReputationDisplay from '../components/ReputationDisplay';

const AccountPage = () => {
  const { user, isAuthenticated, logout } = useWalletAuth();
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const [onuBalance, setOnuBalance] = useState<number>(0);
  const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'OnU';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

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

        const mintKey = new PublicKey(mint);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: mintKey });
        
        if (tokenAccounts.value.length > 0) {
          const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
          setOnuBalance(balance);
        } else {
          setOnuBalance(0);
        }
      } catch (error) {
        console.error("Failed to fetch token balance:", error);
        setOnuBalance(0);
      }
    };
    fetchBalance();
  }, [connected, publicKey]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Profile</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Account Information */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Identity</h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Name</p>
                    <p className="text-lg font-medium">{user?.displayName || 'Anonymous'}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Address</p>
                    <p className="text-sm font-mono text-blue-400 break-all">{user?.walletAddress || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Network Time</p>
                    <p className="text-lg font-medium text-green-400">
                      {user?.networkTime || '0m'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Posts</p>
                    <p className="text-lg font-medium text-blue-400">
                      {user?.totalPosts || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Staked</p>
                    <p className="text-lg font-medium text-purple-400">
                      {user?.totalStaked || 0} {TOKEN_SYMBOL}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Reputation</p>
                    <p className="text-lg font-medium text-green-400">
                      {user?.reputation || 0} points
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Joined</p>
                    <p className="text-lg font-medium">{user?.joinedAt || 'Recently'}</p>
                  </div>
                </div>
              </div>

              {/* Social Connections */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Social Connections</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Followers</h3>
                    <ul className="space-y-1">
                      <li className="text-gray-500 text-sm">No followers yet</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Following</h3>
                    <ul className="space-y-1">
                      <li className="text-gray-500 text-sm">Not following anyone</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Reputation Profile */}
            <div className="space-y-6">
              <ReputationDisplay 
                userId={user.walletAddress}
                showActions={true}
                className="w-full"
              />
            </div>

            {/* Wallet & Crypto */}
            <div className="space-y-6">
              {/* Connected Wallet */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Connected Wallet</h2>
                
                {connected && publicKey ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm">Wallet Address</p>
                      <p className="text-sm font-mono break-all text-blue-400">
                        {publicKey.toBase58()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 text-sm">Token Balance</p>
                      <p className="text-2xl font-bold text-green-400">
                        {onuBalance.toLocaleString()} {TOKEN_SYMBOL}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">Connect your wallet to view balances and earn rewards</p>
                    <WalletMultiButton />
                  </div>
                )}
              </div>

              {/* Account Actions */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
                
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/boards')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                  >
                    View My Boards
                  </button>
                  
                  <button
                    onClick={() => router.push('/topics')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
                  >
                    View My Topics
                  </button>
                  
                  <button
                    onClick={logout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;

