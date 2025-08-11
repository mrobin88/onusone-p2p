import React from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

interface WalletWrapperProps {
  children: React.ReactNode;
}

export default function WalletWrapper({ children }: WalletWrapperProps) {
  // Always provide the Solana wallet context - no detection needed
  const endpoint = process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY
    ? `https://solana-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY}`
    : 'https://api.mainnet-beta.solana.com';

  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
