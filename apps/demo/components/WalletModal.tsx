'use client';

import { useEffect } from 'react';
import { useWallet, type WalletId, type Chain, type WalletInfo } from '@spirit-protocol/react';

const CHAIN_TYPE_LABELS: Record<string, string> = {
  evm: 'EVM',
  solana: 'Solana',
  bitcoin: 'Bitcoin',
};

interface WalletModalProps {
  selectedChain: Chain;
  onClose: () => void;
}

export function WalletModal({ selectedChain, onClose }: WalletModalProps) {
  const { wallets, isConnecting, connect } = useWallet();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleConnect = async (walletId: WalletId) => {
    try {
      await connect(walletId, selectedChain);
      onClose();
    } catch (err) {
      console.error('Connect failed:', err);
    }
  };

  // Group wallets by chain type
  const grouped = wallets.reduce<Record<string, WalletInfo[]>>((acc, w) => {
    (acc[w.type] ??= []).push(w);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {Object.entries(grouped).map(([type, typeWallets]) => (
            <div key={type}>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
                {CHAIN_TYPE_LABELS[type] ?? type}
              </p>
              <div className="space-y-2">
                {typeWallets.map((wallet) => (
                  <WalletRow
                    key={wallet.id}
                    wallet={wallet}
                    isConnecting={isConnecting}
                    onConnect={() => void handleConnect(wallet.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WalletRow({
  wallet,
  isConnecting,
  onConnect,
}: {
  wallet: WalletInfo;
  isConnecting: boolean;
  onConnect: () => void;
}) {
  return (
    <button
      onClick={wallet.installed ? onConnect : () => window.open(wallet.downloadUrl, '_blank')}
      disabled={isConnecting}
      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
        ${wallet.installed
          ? 'hover:bg-white/10 cursor-pointer'
          : 'opacity-50 cursor-pointer hover:opacity-70'
        }
        border border-white/5 hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img
          src={wallet.icon}
          alt={wallet.name}
          className="w-6 h-6 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{wallet.name}</p>
        <p className="text-xs text-gray-500">
          {wallet.installed ? 'Detected' : 'Not installed – click to install'}
        </p>
      </div>

      {/* Badge */}
      {wallet.installed && (
        <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
          Ready
        </span>
      )}
    </button>
  );
}
