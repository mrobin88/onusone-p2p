import type { AppProps } from 'next/app';
import '@solana/wallet-adapter-react-ui/styles.css';
import ClientOnly from '../components/ClientOnly';
import WalletWrapper from '../components/WalletWrapper';
import { WalletAuthProvider } from '../components/WalletAuth';
import { ToastProvider } from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary';
import '../styles/globals.css';
import '../styles/industrial-punk.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ClientOnly>
        <WalletWrapper>
          <ToastProvider>
            <WalletAuthProvider>
              <Component {...pageProps} />
            </WalletAuthProvider>
          </ToastProvider>
        </WalletWrapper>
      </ClientOnly>
    </ErrorBoundary>
  );
}