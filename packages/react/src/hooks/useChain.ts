'use client';

import { useSpiritContext } from '../context/SpiritProvider.js';
import {
  CHAIN_REGISTRY,
  EVM_CHAINS,
  SOLANA,
  BITCOIN,
  type Chain,
} from '@spirit-protocol/core';

export interface UseChainReturn {
  chain: Chain | null;
  allChains: Chain[];
  evmChains: Chain[];
  switchChain: (chainId: number) => Promise<void>;
}

/**
 * Hook to manage chain selection and switching.
 */
export function useChain(): UseChainReturn {
  const ctx = useSpiritContext();

  return {
    chain: ctx.chain,
    allChains: Object.values(CHAIN_REGISTRY),
    evmChains: EVM_CHAINS,
    switchChain: ctx.switchChain,
  };
}
