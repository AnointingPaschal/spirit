'use client';

import { useSpiritContext } from '../context/SpiritProvider.js';
import type { WalletInfo, WalletId, Chain, ConnectResult } from '@spirit-protocol/core';

export interface UseWalletReturn {
  wallets: WalletInfo[];
  installedWallets: WalletInfo[];
  connectedWalletId: WalletId | null;
  address: string | null;
  chain: Chain | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: (walletId: WalletId, chain?: Chain) => Promise<ConnectResult>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook to manage wallet connection state.
 */
export function useWallet(): UseWalletReturn {
  const ctx = useSpiritContext();

  return {
    wallets: ctx.wallets,
    installedWallets: ctx.wallets.filter((w) => w.installed),
    connectedWalletId: ctx.connectedWalletId,
    address: ctx.address,
    chain: ctx.chain,
    isConnected: ctx.isConnected,
    isConnecting: ctx.isConnecting,
    error: ctx.error,
    connect: ctx.connect,
    disconnect: ctx.disconnect,
    switchChain: ctx.switchChain,
    clearError: ctx.clearError,
  };
}
