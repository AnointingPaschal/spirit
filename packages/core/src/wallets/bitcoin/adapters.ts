import type {
  WalletId,
  Chain,
  ConnectResult,
  UnisatProvider,
} from '../../types/index.js';
import { BaseWalletAdapter } from '../base.js';

// ─── Unisat Adapter ────────────────────────────────────────────────────────────

export class UnisatAdapter extends BaseWalletAdapter {
  readonly id: WalletId = 'unisat';
  readonly name = 'Unisat';
  readonly icon = 'https://unisat.io/favicon.ico';
  readonly type = 'bitcoin' as const;

  private provider: UnisatProvider | null = null;

  isInstalled(): boolean {
    return typeof window !== 'undefined' && window.unisat !== undefined;
  }

  async connect(chain: Chain): Promise<ConnectResult> {
    if (typeof window === 'undefined' || !window.unisat) {
      throw new Error('Unisat is not installed. Please install the extension.');
    }

    this.provider = window.unisat;
    const accounts = await this.provider.requestAccounts();
    const address = accounts[0];
    if (!address) throw new Error('Unisat: No accounts returned');

    this.setConnected(address, chain);

    this.provider.on?.('accountsChanged', (accounts: unknown) => {
      this.handleAccountsChanged(accounts as string[]);
    });

    return { account: { address, chain, walletId: this.id }, walletId: this.id };
  }

  async disconnect(): Promise<void> {
    this.setDisconnected();
  }

  async getAddress(): Promise<string> {
    if (!this.provider) throw new Error('Unisat is not connected');
    const accounts = await this.provider.getAccounts();
    return accounts[0] ?? '';
  }

  async signMessage(message: string): Promise<string> {
    if (!this.provider) throw new Error('Unisat is not connected');
    // Unisat uses ECDSA signing — returns base64 signature
    return this.provider.signMessage(message, 'ecdsa');
  }
}

// ─── Xverse Adapter ────────────────────────────────────────────────────────────

export class XverseAdapter extends BaseWalletAdapter {
  readonly id: WalletId = 'xverse';
  readonly name = 'Xverse';
  readonly icon = 'https://www.xverse.app/favicon.ico';
  readonly type = 'bitcoin' as const;

  isInstalled(): boolean {
    return (
      typeof window !== 'undefined' &&
      (window.XverseProviders?.BitcoinProvider !== undefined ||
        window.xfi?.bitcoin !== undefined)
    );
  }

  async connect(chain: Chain): Promise<ConnectResult> {
    if (!this.isInstalled()) {
      throw new Error('Xverse is not installed. Please install the extension.');
    }

    // Use Xverse's getAddresses RPC
    const provider = window.XverseProviders?.BitcoinProvider;
    if (!provider) throw new Error('Xverse Bitcoin provider not found');

    const response = await provider.request('getAddresses', {
      purposes: ['payment', 'ordinals'],
      message: 'Spirit Protocol needs access to your Bitcoin address',
    }) as { result: { addresses: Array<{ address: string; purpose: string }> } };

    const paymentAddress = response.result.addresses.find(
      (a) => a.purpose === 'payment',
    )?.address;

    if (!paymentAddress) throw new Error('Xverse: No payment address returned');

    this.setConnected(paymentAddress, chain);

    return { account: { address: paymentAddress, chain, walletId: this.id }, walletId: this.id };
  }

  async disconnect(): Promise<void> {
    this.setDisconnected();
  }

  async getAddress(): Promise<string> {
    return this._address ?? '';
  }

  async signMessage(message: string): Promise<string> {
    if (!this._address) throw new Error('Xverse is not connected');

    const provider = window.XverseProviders?.BitcoinProvider;
    if (!provider) throw new Error('Xverse provider not found');

    const response = await provider.request('signMessage', {
      address: this._address,
      message,
    }) as { result: { signature: string } };

    return response.result.signature;
  }
}

// ─── Leather (Hiro) Adapter ───────────────────────────────────────────────────

export class LeatherAdapter extends BaseWalletAdapter {
  readonly id: WalletId = 'leather';
  readonly name = 'Leather';
  readonly icon = 'https://leather.io/favicon.ico';
  readonly type = 'bitcoin' as const;

  isInstalled(): boolean {
    return typeof window !== 'undefined' && window.LeatherProvider !== undefined;
  }

  async connect(chain: Chain): Promise<ConnectResult> {
    if (!window.LeatherProvider) {
      throw new Error('Leather is not installed. Please install the extension.');
    }

    const response = await window.LeatherProvider.request({
      method: 'getAddresses',
    }) as { result: { addresses: Array<{ address: string; type: string }> } };

    const btcAddress = response.result.addresses.find(
      (a) => a.type === 'p2wpkh' || a.type === 'p2pkh',
    )?.address;

    if (!btcAddress) throw new Error('Leather: No Bitcoin address returned');

    this.setConnected(btcAddress, chain);

    return { account: { address: btcAddress, chain, walletId: this.id }, walletId: this.id };
  }

  async disconnect(): Promise<void> {
    this.setDisconnected();
  }

  async getAddress(): Promise<string> {
    return this._address ?? '';
  }

  async signMessage(message: string): Promise<string> {
    if (!window.LeatherProvider || !this._address) {
      throw new Error('Leather is not connected');
    }

    const response = await window.LeatherProvider.request({
      method: 'signMessage',
      params: { message, paymentType: 'p2wpkh' },
    }) as { result: { signature: string } };

    return response.result.signature;
  }
}

// ─── Export all Bitcoin adapters ──────────────────────────────────────────────

export const BITCOIN_ADAPTERS = [
  new UnisatAdapter(),
  new XverseAdapter(),
  new LeatherAdapter(),
] as const;
