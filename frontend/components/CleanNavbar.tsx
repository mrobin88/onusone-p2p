import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletAuth } from './WalletAuth';

export default function CleanNavbar() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { user, isAuthenticated, logout } = useWalletAuth();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/capsules', label: 'Time Capsules' },
    { href: '/buy-onu', label: 'Buy ONU' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/profile', label: 'Profile' },
  ];

  const isActive = (href: string) => router.pathname === href;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <Link href="/" className="navbar-brand">
          ONUSONE P2P
        </Link>

        {/* Navigation Links */}
        <ul className="navbar-nav">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href} 
                className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Wallet Section */}
        <div className="wallet-section">
          {connected && publicKey ? (
            <div className="wallet-info">
              {/* Wallet Address */}
              <div className="wallet-address">
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </div>
              
              {/* User Info */}
              {isAuthenticated && user && (
                <div className="user-info">
                  <span className="text-secondary">👤 {user.username}</span>
                  <span className="text-success ml-2">Rep: {user.reputation}</span>
                </div>
              )}
              
              {/* Logout Button */}
              {isAuthenticated && (
                <button 
                  onClick={logout}
                  className="btn btn-secondary"
                >
                  Logout
                </button>
              )}
            </div>
          ) : (
            <WalletMultiButton className="btn btn-primary" />
          )}
        </div>
      </div>
    </nav>
  );
}
