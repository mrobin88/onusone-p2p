import type { AppProps } from 'next/app';
import ClientOnly from '../components/ClientOnly';
import { LocalAuthProvider } from '../components/LocalAuth';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClientOnly>
      <LocalAuthProvider>
        <Component {...pageProps} />
      </LocalAuthProvider>
    </ClientOnly>
  );
} 