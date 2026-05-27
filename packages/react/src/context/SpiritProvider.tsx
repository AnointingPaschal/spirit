'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {
  Spirit,
  createSpirit,
  WalletDetector,
  type SpiritConfig,
  type AuthSession,
  type Chain,
  type WalletId,
  type WalletInfo,
  type ConnectResult,
} from '@spirit-protocol/core';

// ─── State ────────────────────────────────────────────────────────────────────

export interface SpiritState {
  wallets: WalletInfo[];
  connectedWalletId: WalletId | null;
  address: string | null;
  chain: Chain | null;
  session: AuthSession | null;
  isConnecting: boolean;
  isAuthenticating: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

type Action =
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; walletId: WalletId; address: string; chain: Chain }
  | { type: 'CONNECT_ERROR'; error: Error }
  | { type: 'DISCONNECT' }
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; session: AuthSession }
  | { type: 'AUTH_ERROR'; error: Error }
  | { type: 'CHAIN_CHANGED'; chain: Chain }
  | { type: 'ADDRESS_CHANGED'; address: string }
  | { type: 'CLEAR_ERROR' };

const initialState: SpiritState = {
  wallets: [],
  connectedWalletId: null,
  address: null,
  chain: null,
  session: null,
  isConnecting: false,
  isAuthenticating: false,
  isConnected: false,
  isAuthenticated: false,
  error: null,
};

function reducer(state: SpiritState, action: Action): SpiritState {
  switch (action.type) {
    case 'CONNECT_START':
      return { ...state, isConnecting: true, error: null };

    case 'CONNECT_SUCCESS':
      return {
        ...state,
        isConnecting: false,
        isConnected: true,
        connectedWalletId: action.walletId,
        address: action.address,
        chain: action.chain,
        error: null,
      };

    case 'CONNECT_ERROR':
      return { ...state, isConnecting: false, error: action.error };

    case 'DISCONNECT':
      return {
        ...initialState,
        wallets: state.wallets,
      };

    case 'AUTH_START':
      return { ...state, isAuthenticating: true, error: null };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticating: false,
        isAuthenticated: true,
        session: action.session,
        error: null,
      };

    case 'AUTH_ERROR':
      return { ...state, isAuthenticating: false, error: action.error };

    case 'CHAIN_CHANGED':
      return { ...state, chain: action.chain };

    case 'ADDRESS_CHANGED':
      return { ...state, address: action.address };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface SpiritContextValue extends SpiritState {
  sdk: Spirit;
  connect: (walletId: WalletId, chain?: Chain) => Promise<ConnectResult>;
  disconnect: () => Promise<void>;
  authenticate: (walletId: WalletId, chain?: Chain) => Promise<AuthSession>;
  switchChain: (chainId: number) => Promise<void>;
  clearError: () => void;
}

const SpiritContext = createContext<SpiritContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface SpiritProviderProps {
  config?: SpiritConfig;
  children: React.ReactNode;
}

export function SpiritProvider({ config, children }: SpiritProviderProps) {
  const sdk = useMemo(() => createSpirit(config), []);

  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    wallets: WalletDetector.detectAll(),
    session: sdk.getSession(),
    isAuthenticated: sdk.isAuthenticated(),
  });

  // Restore address if session exists
  useEffect(() => {
    const session = sdk.getSession();
    if (session) {
      dispatch({
        type: 'CONNECT_SUCCESS',
        walletId: session.walletId,
        address: session.address,
        chain: session.chain,
      });
      dispatch({ type: 'AUTH_SUCCESS', session });
    }
  }, []);

  const connect = useCallback(
    async (walletId: WalletId, chain?: Chain): Promise<ConnectResult> => {
      dispatch({ type: 'CONNECT_START' });
      try {
        const result = await sdk.connect(walletId, chain);
        dispatch({
          type: 'CONNECT_SUCCESS',
          walletId,
          address: result.account.address,
          chain: result.account.chain,
        });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        dispatch({ type: 'CONNECT_ERROR', error });
        throw error;
      }
    },
    [sdk],
  );

  const disconnect = useCallback(async (): Promise<void> => {
    await sdk.disconnect();
    dispatch({ type: 'DISCONNECT' });
  }, [sdk]);

  const authenticate = useCallback(
    async (walletId: WalletId, chain?: Chain): Promise<AuthSession> => {
      dispatch({ type: 'AUTH_START' });
      try {
        const session = await sdk.authenticate(walletId, chain);
        dispatch({
          type: 'CONNECT_SUCCESS',
          walletId,
          address: session.address,
          chain: session.chain,
        });
        dispatch({ type: 'AUTH_SUCCESS', session });
        return session;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        dispatch({ type: 'AUTH_ERROR', error });
        throw error;
      }
    },
    [sdk],
  );

  const switchChain = useCallback(
    async (chainId: number): Promise<void> => {
      if (!state.connectedWalletId) throw new Error('No wallet connected');
      const adapter = WalletDetector.getAdapter(state.connectedWalletId);
      if (!adapter?.switchChain) throw new Error('Chain switching not supported');
      await adapter.switchChain(chainId);
    },
    [state.connectedWalletId],
  );

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      sdk,
      connect,
      disconnect,
      authenticate,
      switchChain,
      clearError,
    }),
    [state, sdk, connect, disconnect, authenticate, switchChain, clearError],
  );

  return <SpiritContext.Provider value={value}>{children}</SpiritContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpiritContext(): SpiritContextValue {
  const ctx = useContext(SpiritContext);
  if (!ctx) {
    throw new Error('useSpiritContext must be used inside <SpiritProvider>');
  }
  return ctx;
}

export { SpiritContext };
