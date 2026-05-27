'use client';

import { useSpiritContext } from '../context/SpiritProvider.js';
import type { AuthSession, WalletId, Chain } from '@spirit-protocol/core';

export interface UseSessionReturn {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  token: string | null;
  address: string | null;
  authenticate: (walletId: WalletId, chain?: Chain) => Promise<AuthSession>;
  logout: () => Promise<void>;
  error: Error | null;
}

/**
 * Hook to manage authentication sessions.
 */
export function useSession(): UseSessionReturn {
  const ctx = useSpiritContext();

  return {
    session: ctx.session,
    isAuthenticated: ctx.isAuthenticated,
    isAuthenticating: ctx.isAuthenticating,
    token: ctx.session?.token ?? null,
    address: ctx.session?.address ?? null,
    authenticate: ctx.authenticate,
    logout: ctx.disconnect,
    error: ctx.error,
  };
}
