/**
 * Compact Wallet Widget
 * Shows essential wallet info without blocking the interface
 */

import React, { useState } from 'react';
import { useWalletAuth } from './WalletAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function CompactWalletWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, isAuthenticated, logout } = useWalletAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="compact-wallet-widget">
        <WalletMultiButton className="connect-wallet-btn" />
      </div>
    );
  }

  return (
    <div className="compact-wallet-widget">
      <div className="wallet-info">
        <div className="wallet-summary" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="wallet-avatar">
            {user.username?.slice(0, 2).toUpperCase() || '??'}
          </div>
          <div className="wallet-details">
            <span className="wallet-name">{user.username || 'Anonymous'}</span>
            <span className="wallet-balance">
              {user.tokenBalance ? `${user.tokenBalance.toFixed(1)}K ONU` : '0 ONU'}
            </span>
          </div>
          <div className="expand-icon">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>

        {isExpanded && (
          <div className="wallet-expanded">
            <div className="wallet-stats">
              <div className="stat-row">
                <span className="stat-label">Available:</span>
                <span className="stat-value">
                  {user.tokenBalance ? `${user.tokenBalance.toFixed(1)}K` : '0'} ONU
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Staked:</span>
                <span className="stat-value">
                  {user.totalStaked || 0} ONU
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Earned:</span>
                <span className="stat-value earned">
                  +{user.totalEarned || 0} ONU
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Burned:</span>
                <span className="stat-value burned">
                  -{user.totalBurned || 0} ONU
                </span>
              </div>
            </div>
            
            <div className="wallet-actions">
              <button className="action-btn primary">
                💰 Stake
              </button>
              <button className="action-btn secondary" onClick={logout}>
                🚪 Logout
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .compact-wallet-widget {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          min-width: 280px;
          max-width: 320px;
        }

        .wallet-info {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 2px solid #e94560;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .wallet-summary {
          display: flex;
          align-items: center;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(233, 69, 96, 0.1);
        }

        .wallet-summary:hover {
          background: rgba(233, 69, 96, 0.2);
        }

        .wallet-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e94560, #d63384);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          margin-right: 12px;
        }

        .wallet-details {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .wallet-name {
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .wallet-balance {
          color: #a0a3a8;
          font-size: 12px;
          font-weight: 500;
        }

        .expand-icon {
          color: #e94560;
          font-size: 12px;
          font-weight: bold;
          transition: transform 0.2s ease;
        }

        .wallet-expanded {
          background: rgba(15, 52, 96, 0.9);
          border-top: 1px solid rgba(233, 69, 96, 0.3);
          padding: 16px;
        }

        .wallet-stats {
          margin-bottom: 16px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-row:last-child {
          border-bottom: none;
        }

        .stat-label {
          color: #a0a3a8;
          font-size: 12px;
          font-weight: 500;
        }

        .stat-value {
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
        }

        .stat-value.earned {
          color: #28a745;
        }

        .stat-value.burned {
          color: #dc3545;
        }

        .wallet-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.primary {
          background: #e94560;
          color: white;
        }

        .action-btn.primary:hover {
          background: #d63384;
          transform: translateY(-1px);
        }

        .action-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .action-btn.secondary:hover {
          background: rgba(233, 69, 96, 0.2);
          border-color: #e94560;
        }

        .connect-wallet-btn {
          background: linear-gradient(135deg, #e94560, #d63384) !important;
          color: white !important;
          border: none !important;
          padding: 12px 20px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 4px 12px rgba(233, 69, 96, 0.3) !important;
        }

        .connect-wallet-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 16px rgba(233, 69, 96, 0.4) !important;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .compact-wallet-widget {
            top: 10px;
            right: 10px;
            min-width: 260px;
          }
        }
      `}</style>
    </div>
  );
}
