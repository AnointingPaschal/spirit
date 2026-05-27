import type { WalletAdapter, WalletInfo, WalletId, ChainType } from '../types/index.js';
import { EVM_ADAPTERS } from './evm/adapters.js';
import { SOLANA_ADAPTERS } from './solana/adapters.js';
import { BITCOIN_ADAPTERS } from './bitcoin/adapters.js';

// ─── All adapters registry ────────────────────────────────────────────────────

export const ALL_ADAPTERS: WalletAdapter[] = [
  ...EVM_ADAPTERS,
  ...SOLANA_ADAPTERS,
  ...BITCOIN_ADAPTERS,
];

const ADAPTER_MAP = new Map<WalletId, WalletAdapter>(
  ALL_ADAPTERS.map((a) => [a.id, a]),
);

// ─── Download URLs ────────────────────────────────────────────────────────────

const DOWNLOAD_URLS: Record<WalletId, string> = {
  metamask: 'https://metamask.io/download/',
  trust: 'https://trustwallet.com/download',
  coinbase: 'https://www.coinbase.com/wallet/downloads',
  rabby: 'https://rabby.io/',
  okx: 'https://www.okx.com/web3',
  brave: 'https://brave.com/wallet/',
  phantom: 'https://phantom.app/download',
  solflare: 'https://solflare.com/',
  backpack: 'https://www.backpack.app/',
  xverse: 'https://www.xverse.app/download',
  unisat: 'https://unisat.io/',
  leather: 'https://leather.io/install-extension',
};

const DEEP_LINKS: Partial<Record<WalletId, string>> = {
  metamask: 'metamask://',
  trust: 'trust://',
  coinbase: 'cbwallet://',
  phantom: 'phantom://',
};

// ─── Wallet Detector ──────────────────────────────────────────────────────────

export class WalletDetector {
  /**
   * Returns info for all known wallets, with `installed` flag.
   */
  static detectAll(): WalletInfo[] {
    return ALL_ADAPTERS.map((adapter) => {
      const deepLink = DEEP_LINKS[adapter.id];
      return {
        id: adapter.id,
        name: adapter.name,
        icon: adapter.icon,
        type: adapter.type,
        installed: adapter.isInstalled(),
        downloadUrl: DOWNLOAD_URLS[adapter.id] ?? '',
        ...(deepLink !== undefined && { deepLink }),
      };
    });
  }

  /**
   * Returns only wallets that are installed in the browser.
   */
  static detectInstalled(): WalletInfo[] {
    return WalletDetector.detectAll().filter((w) => w.installed);
  }

  /**
   * Returns installed wallets for a specific chain type.
   */
  static detectForChainType(type: ChainType): WalletInfo[] {
    return WalletDetector.detectAll().filter((w) => w.type === type);
  }

  /**
   * Get the adapter for a specific wallet ID.
   */
  static getAdapter(id: WalletId): WalletAdapter | undefined {
    return ADAPTER_MAP.get(id);
  }

  /**
   * Get the first installed wallet adapter, or undefined.
   */
  static getFirstInstalled(type?: ChainType): WalletAdapter | undefined {
    return ALL_ADAPTERS.find(
      (a) => a.isInstalled() && (type === undefined || a.type === type),
    );
  }

  /**
   * Check if any wallet is installed.
   */
  static hasAnyWallet(): boolean {
    return ALL_ADAPTERS.some((a) => a.isInstalled());
  }

  /**
   * Get all adapters (for iteration).
   */
  static getAllAdapters(): WalletAdapter[] {
    return [...ALL_ADAPTERS];
  }
}

export { ADAPTER_MAP };
