// Context & Provider
export { SpiritProvider, useSpiritContext } from './context/SpiritProvider.js';
export type { SpiritProviderProps, SpiritContextValue, SpiritState } from './context/SpiritProvider.js';

// Hooks
export { useWallet } from './hooks/useWallet.js';
export type { UseWalletReturn } from './hooks/useWallet.js';

export { useSession } from './hooks/useSession.js';
export type { UseSessionReturn } from './hooks/useSession.js';

export { useChain } from './hooks/useChain.js';
export type { UseChainReturn } from './hooks/useChain.js';

// Re-export core for convenience
export {
  ETHEREUM, BASE, POLYGON, ARBITRUM, OPTIMISM, BNB_CHAIN, AVALANCHE, SOLANA, BITCOIN,
  CHAIN_REGISTRY, EVM_CHAINS,
  WalletDetector,
  createSpirit,
} from '@spirit-protocol/core';

export type {
  Chain,
  ChainType,
  WalletId,
  WalletInfo,
  WalletAdapter,
  AuthSession,
  SpiritConfig,
  ConnectResult,
} from '@spirit-protocol/core';
