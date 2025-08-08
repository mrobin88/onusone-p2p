import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import ClientOnly from '../components/ClientOnly';
import { LocalAuthProvider } from '../components/LocalAuth';
import Wallet from '../components/Wallet';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider>
      <ClientOnly>
        <LocalAuthProvider>
          <Component {...pageProps} />
          <Wallet />
        </LocalAuthProvider>
      </ClientOnly>
    </SessionProvider>
  );
} 