import type {
  WalletId,
  Chain,
  ConnectResult,
  EVMProvider,
} from '../../types/index.js';
import { getChainByChainId } from '../../chains/registry.js';
import { BaseWalletAdapter } from '../base.js';
import {
  findEVMProvider,
  requestAccounts,
  getAccounts,
  getChainId,
  personalSign,
  switchEthereumChain,
  addEthereumChain,
} from './provider.js';

// ─── Generic EVM Adapter ──────────────────────────────────────────────────────

abstract class EVMWalletAdapter extends BaseWalletAdapter {
  readonly type = 'evm' as const;
  protected provider: EVMProvider | null = null;

  protected abstract findProvider(): EVMProvider | undefined;

  isInstalled(): boolean {
    return this.findProvider() !== undefined;
  }

  async connect(chain: Chain): Promise<ConnectResult> {
    const provider = this.findProvider();
    if (!provider) {
      throw new Error(`${this.name} is not installed. Please install the extension.`);
    }

    this.provider = provider;

    // Request accounts
    const accounts = await requestAccounts(provider);
    const address = accounts[0];
    if (!address) throw new Error(`${this.name}: No accounts returned`);

    // Attempt chain switch if needed
    const currentChainId = await getChainId(provider);
    if (chain.chainId && currentChainId !== chain.chainId) {
      await this.switchChain(chain.chainId).catch(async (err: unknown) => {
        // Chain not added – try to add it
        if (
          err instanceof Error &&
          (err.message.includes('4902') || err.message.includes('Unrecognized chain'))
        ) {
          await addEthereumChain(provider, {
            chainId: chain.chainId!,
            chainName: chain.name,
            rpcUrls: chain.rpcUrls,
            nativeCurrency: chain.nativeCurrency,
            blockExplorerUrls: chain.blockExplorerUrl ? [chain.blockExplorerUrl] : [],
          });
        } else {
          throw err;
        }
      });
    }

    this.setConnected(address, chain);
    this.setupListeners(provider);

    return { account: { address, chain, walletId: this.id }, walletId: this.id };
  }

  async disconnect(): Promise<void> {
    this.removeListeners();
    this.setDisconnected();
  }

  async getAddress(): Promise<string> {
    if (!this.provider) throw new Error(`${this.name} is not connected`);
    const accounts = await getAccounts(this.provider);
    return accounts[0] ?? '';
  }

  async signMessage(message: string): Promise<string> {
    if (!this.provider || !this._address) {
      throw new Error(`${this.name} is not connected`);
    }
    return personalSign(this.provider, message, this._address);
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this.provider) throw new Error(`${this.name} is not connected`);
    try {
      await switchEthereumChain(this.provider, chainId);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message.includes('4902') || err.message.includes('Unrecognized'))
      ) {
        const chain = getChainByChainId(chainId);
        if (chain) {
          await addEthereumChain(this.provider, {
            chainId: chain.chainId!,
            chainName: chain.name,
            rpcUrls: chain.rpcUrls,
            nativeCurrency: chain.nativeCurrency,
            blockExplorerUrls: chain.blockExplorerUrl ? [chain.blockExplorerUrl] : [],
          });
        }
      } else {
        throw err;
      }
    }
  }

  private setupListeners(provider: EVMProvider): void {
    provider.on('accountsChanged', (accounts: unknown) => {
      this.handleAccountsChanged(accounts as string[]);
    });
    provider.on('chainChanged', (chainId: unknown) => {
      this.handleChainChanged(chainId as string);
    });
    provider.on('disconnect', () => {
      this.setDisconnected();
    });
  }

  private removeListeners(): void {
    if (!this.provider) return;
    this.provider.removeListener('accountsChanged', () => {});
    this.provider.removeListener('chainChanged', () => {});
    this.provider.removeListener('disconnect', () => {});
  }
}

// ─── MetaMask ─────────────────────────────────────────────────────────────────

export class MetaMaskAdapter extends EVMWalletAdapter {
  readonly id: WalletId = 'metamask';
  readonly name = 'MetaMask';
  readonly icon =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNDcuNSAzNDcuNSI+PHBhdGggZmlsbD0iI0U4ODMxQSIgZD0iTTE3My44IDE3My44TDE3My44IDE3My44TDE3My44IDE3My44TDE3My44IDE3My44WiIvPjwvc3ZnPg==';

  protected findProvider(): EVMProvider | undefined {
    return (
      findEVMProvider((p) => p.isMetaMask === true && !p.isBraveWallet) ??
      (typeof window !== 'undefined' && window.ethereum?.isMetaMask && !window.ethereum.isBraveWallet
        ? window.ethereum
        : undefined)
    );
  }
}

// ─── Trust Wallet ─────────────────────────────────────────────────────────────

export class TrustWalletAdapter extends EVMWalletAdapter {
  readonly id: WalletId = 'trust';
  readonly name = 'Trust Wallet';
  readonly icon = 'https://trustwallet.com/assets/images/favicon.png';

  protected findProvider(): EVMProvider | undefined {
    return (
      findEVMProvider((p) => p.isTrust === true || p.isTrustWallet === true) ??
      (typeof window !== 'undefined' ? window.trustwallet?.ethereum : undefined)
    );
  }
}

// ─── Coinbase Wallet ──────────────────────────────────────────────────────────

export class CoinbaseWalletAdapter extends EVMWalletAdapter {
  readonly id: WalletId = 'coinbase';
  readonly name = 'Coinbase Wallet';
  readonly icon = 'https://www.coinbase.com/favicon.ico';

  protected findProvider(): EVMProvider | undefined {
    return (
      findEVMProvider((p) => p.isCoinbaseWallet === true) ??
      (typeof window !== 'undefined' ? window.coinbaseWalletExtension : undefined)
    );
  }
}

// ─── Rabby ────────────────────────────────────────────────────────────────────

export class RabbyAdapter extends EVMWalletAdapter {
  readonly id: WalletId = 'rabby';
  readonly name = 'Rabby';
  readonly icon = 'https://rabby.io/assets/images/rabby-logo.svg';

  protected findProvider(): EVMProvider | undefined {
    return (
      findEVMProvider((p) => p.isRabby === true) ??
      (typeof window !== 'undefined' ? window.rabby : undefined)
    );
  }
}

// ─── OKX Wallet ───────────────────────────────────────────────────────────────

export class OKXWalletAdapter extends EVMWalletAdapter {
  readonly id: WalletId = 'okx';
  readonly name = 'OKX Wallet';
  readonly icon = 'https://static.okx.com/cdn/assets/imgs/221/7B71D8B748B7ED4A.png';

  protected findProvider(): EVMProvider | undefined {
    return (
      findEVMProvider((p) => p.isOkxWallet === true) ??
      (typeof window !== 'undefined' ? window.okxwallet?.ethereumProvider : undefined)
    );
  }
}

// ─── Brave Wallet ─────────────────────────────────────────────────────────────

export class BraveWalletAdapter extends EVMWalletAdapter {
  readonly id: WalletId = 'brave';
  readonly name = 'Brave Wallet';
  readonly icon = 'https://brave.com/static-assets/images/brave-logo-sans-text.svg';

  protected findProvider(): EVMProvider | undefined {
    return (
      findEVMProvider((p) => p.isBraveWallet === true) ??
      (typeof window !== 'undefined' && window.ethereum?.isBraveWallet
        ? window.ethereum
        : undefined)
    );
  }
}

// ─── Export all EVM adapters ──────────────────────────────────────────────────

export const EVM_ADAPTERS = [
  new MetaMaskAdapter(),
  new TrustWalletAdapter(),
  new CoinbaseWalletAdapter(),
  new RabbyAdapter(),
  new OKXWalletAdapter(),
  new BraveWalletAdapter(),
] as const;
