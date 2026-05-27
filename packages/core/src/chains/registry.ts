import type { Chain } from '../types/index.js';

// ─── EVM Chains ───────────────────────────────────────────────────────────────

export const ETHEREUM: Chain = {
  id: 'ethereum',
  name: 'Ethereum',
  type: 'evm',
  chainId: 1,
  rpcUrls: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://cloudflare-eth.com',
  ],
  blockExplorerUrl: 'https://etherscan.io',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
};

export const BASE: Chain = {
  id: 'base',
  name: 'Base',
  type: 'evm',
  chainId: 8453,
  rpcUrls: [
    'https://mainnet.base.org',
    'https://base.llamarpc.com',
    'https://rpc.ankr.com/base',
  ],
  blockExplorerUrl: 'https://basescan.org',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
};

export const POLYGON: Chain = {
  id: 'polygon',
  name: 'Polygon',
  type: 'evm',
  chainId: 137,
  rpcUrls: [
    'https://polygon.llamarpc.com',
    'https://rpc.ankr.com/polygon',
    'https://polygon-rpc.com',
  ],
  blockExplorerUrl: 'https://polygonscan.com',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
};

export const ARBITRUM: Chain = {
  id: 'arbitrum',
  name: 'Arbitrum One',
  type: 'evm',
  chainId: 42161,
  rpcUrls: [
    'https://arb1.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum',
    'https://arbitrum.llamarpc.com',
  ],
  blockExplorerUrl: 'https://arbiscan.io',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
};

export const OPTIMISM: Chain = {
  id: 'optimism',
  name: 'Optimism',
  type: 'evm',
  chainId: 10,
  rpcUrls: [
    'https://mainnet.optimism.io',
    'https://rpc.ankr.com/optimism',
    'https://optimism.llamarpc.com',
  ],
  blockExplorerUrl: 'https://optimistic.etherscan.io',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
};

export const BNB_CHAIN: Chain = {
  id: 'bnb',
  name: 'BNB Chain',
  type: 'evm',
  chainId: 56,
  rpcUrls: [
    'https://bsc-dataseed.binance.org',
    'https://rpc.ankr.com/bsc',
    'https://binance.llamarpc.com',
  ],
  blockExplorerUrl: 'https://bscscan.com',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
};

export const AVALANCHE: Chain = {
  id: 'avalanche',
  name: 'Avalanche',
  type: 'evm',
  chainId: 43114,
  rpcUrls: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://rpc.ankr.com/avalanche',
    'https://avalanche.llamarpc.com',
  ],
  blockExplorerUrl: 'https://snowtrace.io',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
};

// ─── Solana ───────────────────────────────────────────────────────────────────

export const SOLANA: Chain = {
  id: 'solana',
  name: 'Solana',
  type: 'solana',
  cluster: 'mainnet-beta',
  rpcUrls: [
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
  ],
  blockExplorerUrl: 'https://explorer.solana.com',
  nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
};

// ─── Bitcoin ──────────────────────────────────────────────────────────────────

export const BITCOIN: Chain = {
  id: 'bitcoin',
  name: 'Bitcoin',
  type: 'bitcoin',
  rpcUrls: [],
  blockExplorerUrl: 'https://mempool.space',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
};

// ─── Chain Registry ───────────────────────────────────────────────────────────

export const CHAIN_REGISTRY: Record<string, Chain> = {
  ethereum: ETHEREUM,
  base: BASE,
  polygon: POLYGON,
  arbitrum: ARBITRUM,
  optimism: OPTIMISM,
  bnb: BNB_CHAIN,
  avalanche: AVALANCHE,
  solana: SOLANA,
  bitcoin: BITCOIN,
};

export const EVM_CHAINS = [ETHEREUM, BASE, POLYGON, ARBITRUM, OPTIMISM, BNB_CHAIN, AVALANCHE];

export function getChainById(id: string): Chain | undefined {
  return CHAIN_REGISTRY[id];
}

export function getChainByChainId(chainId: number): Chain | undefined {
  return Object.values(CHAIN_REGISTRY).find(
    (c) => c.type === 'evm' && c.chainId === chainId,
  );
}

export function toHexChainId(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

export function fromHexChainId(hex: string): number {
  return parseInt(hex, 16);
}
