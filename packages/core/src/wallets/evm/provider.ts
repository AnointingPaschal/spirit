import type { EVMProvider } from '../../types/index.js';
import { fromHexChainId, toHexChainId } from '../../chains/registry.js';

/**
 * Find a specific EVM provider from window.ethereum.
 * Handles multi-wallet injection via window.ethereum.providers array.
 */
export function findEVMProvider(
  predicate: (p: EVMProvider) => boolean,
): EVMProvider | undefined {
  if (typeof window === 'undefined') return undefined;

  const ethereum = window.ethereum;
  if (!ethereum) return undefined;

  // Some wallets inject into window.ethereum.providers[]
  if (ethereum.providers && Array.isArray(ethereum.providers)) {
    return ethereum.providers.find(predicate);
  }

  return predicate(ethereum) ? ethereum : undefined;
}

/**
 * Request account access via EIP-1193.
 */
export async function requestAccounts(provider: EVMProvider): Promise<string[]> {
  const result = await provider.request({ method: 'eth_requestAccounts' });
  if (!Array.isArray(result)) throw new Error('Invalid accounts response');
  return result as string[];
}

/**
 * Get current connected accounts (no popup).
 */
export async function getAccounts(provider: EVMProvider): Promise<string[]> {
  const result = await provider.request({ method: 'eth_accounts' });
  if (!Array.isArray(result)) return [];
  return result as string[];
}

/**
 * Get the current chain ID as a number.
 */
export async function getChainId(provider: EVMProvider): Promise<number> {
  const result = await provider.request({ method: 'eth_chainId' });
  return fromHexChainId(result as string);
}

/**
 * Sign a message via personal_sign (EIP-191).
 * The message is prefixed with "\x19Ethereum Signed Message:\n" + length.
 */
export async function personalSign(
  provider: EVMProvider,
  message: string,
  address: string,
): Promise<string> {
  const hexMessage = messageToHex(message);
  const result = await provider.request({
    method: 'personal_sign',
    params: [hexMessage, address],
  });
  return result as string;
}

/**
 * Switch to a different EVM chain. Throws if the chain is not added to the wallet.
 */
export async function switchEthereumChain(
  provider: EVMProvider,
  chainId: number,
): Promise<void> {
  await provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: toHexChainId(chainId) }],
  });
}

/**
 * Add a new chain to the wallet (wallet_addEthereumChain).
 */
export async function addEthereumChain(
  provider: EVMProvider,
  params: {
    chainId: number;
    chainName: string;
    rpcUrls: string[];
    nativeCurrency: { name: string; symbol: string; decimals: number };
    blockExplorerUrls?: string[];
  },
): Promise<void> {
  await provider.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: toHexChainId(params.chainId),
        chainName: params.chainName,
        rpcUrls: params.rpcUrls,
        nativeCurrency: params.nativeCurrency,
        blockExplorerUrls: params.blockExplorerUrls ?? [],
      },
    ],
  });
}

/**
 * Convert a UTF-8 string to a hex string (0x-prefixed).
 */
function messageToHex(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
}

export { messageToHex };
