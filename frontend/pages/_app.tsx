import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { useMemo } from 'react';
import '@solana/wallet-adapter-react-ui/styles.css';
import ClientOnly from '../components/ClientOnly';
import { LocalAuthProvider } from '../components/LocalAuth';
import Wallet from '../components/Wallet';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const endpoint = useMemo(() => {
    const alchemy = process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY;
    if (alchemy && /^https?:\/\//.test(alchemy)) return alchemy;
    if (alchemy) return `https://solana-mainnet.g.alchemy.com/v2/${alchemy}`;
    return 'https://api.mainnet-beta.solana.com';
  }, []);

  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <SessionProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <ClientOnly>
              <LocalAuthProvider>
                <Component {...pageProps} />
                <Wallet />
              </LocalAuthProvider>
            </ClientOnly>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SessionProvider>
  );
}