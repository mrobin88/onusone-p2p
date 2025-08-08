import type { AppProps } from 'next/app';
import { SessionProvider, useSession } from 'next-auth/react';
import Link from 'next/link';
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

const AppContent = ({ Component, pageProps }: AppProps) => {
  const { data: session, status } = useSession();

  return (
    <>
      {status === 'authenticated' && (
        <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            OnusOne
          </Link>
          <nav>
            <Link href="/account" className="text-blue-400 hover:underline">
              My Account
            </Link>
          </nav>
        </header>
      )}
      <Component {...pageProps} />
      <Wallet />
    </>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const endpoint = useMemo(() => {
    const alchemy = process.env.NEXT_PUBLIC_ALCHEMY_SOLANA_API_KEY;
    if (alchemy && /^https?:\/\//.test(alchemy)) return alchemy;
    if (alchemy) return `https://solana-mainnet.g.alchemy.com/v2/${alchemy}`;
    return 'https://api.mainnet-beta.solana.com';
  }, []);

  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <SessionProvider session={pageProps.session}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <ClientOnly>
              <LocalAuthProvider>
                <AppContent Component={Component} pageProps={pageProps} />
              </LocalAuthProvider>
            </ClientOnly>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SessionProvider>
  );
}