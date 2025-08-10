import type { AppProps } from 'next/app';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { useMemo } from 'react';
import '@solana/wallet-adapter-react-ui/styles.css';
import ClientOnly from '../components/ClientOnly';
import { WalletAuthProvider } from '../components/WalletAuth';
import { ToastProvider } from '../components/Toast';
import Wallet from '../components/Wallet';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const endpoint = useMemo(() => {
    const alchemy = process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY;
    if (alchemy && /^https?:\/\//.test(alchemy)) return alchemy;
    if (alchemy) return `https://solana-mainnet.g.alchemy.com/v2/${alchemy}`;
    return 'https://api.mainnet-beta.solana.com';
  }, []);

  // Remove Solflare since it's auto-registered as a Standard Wallet
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ClientOnly>
            <ToastProvider>
              <WalletAuthProvider>
                <Component {...pageProps} />
                <Wallet />
              </WalletAuthProvider>
            </ToastProvider>
          </ClientOnly>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}