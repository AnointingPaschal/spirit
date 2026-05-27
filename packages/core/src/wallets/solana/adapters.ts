import type {
  WalletId,
  Chain,
  ConnectResult,
  SolanaProvider,
} from '../../types/index.js';
import { BaseWalletAdapter } from '../base.js';
import { bytesToBase58 } from '../../crypto/verify.js';

// ─── Generic Solana Adapter ───────────────────────────────────────────────────

abstract class SolanaWalletAdapter extends BaseWalletAdapter {
  readonly type = 'solana' as const;
  protected provider: SolanaProvider | null = null;

  protected abstract findProvider(): SolanaProvider | undefined;

  isInstalled(): boolean {
    return this.findProvider() !== undefined;
  }

  async connect(chain: Chain): Promise<ConnectResult> {
    const provider = this.findProvider();
    if (!provider) {
      throw new Error(`${this.name} is not installed. Please install the extension.`);
    }

    this.provider = provider;

    const response = await provider.connect();
    const address = response.publicKey.toString();

    this.setConnected(address, chain);
    this.setupListeners(provider);

    return { account: { address, publicKey: address, chain, walletId: this.id }, walletId: this.id };
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disconnect().catch(() => {});
    }
    this.setDisconnected();
  }

  async getAddress(): Promise<string> {
    if (!this.provider?.publicKey) throw new Error(`${this.name} is not connected`);
    return this.provider.publicKey.toString();
  }

  async signMessage(message: string): Promise<string> {
    if (!this.provider) throw new Error(`${this.name} is not connected`);
    const messageBytes = new TextEncoder().encode(message);
    const { signature } = await this.provider.signMessage(messageBytes, 'utf8');
    return bytesToBase58(signature);
  }

  private setupListeners(provider: SolanaProvider): void {
    provider.on('disconnect', () => this.setDisconnected());
    provider.on('accountChanged', (publicKey: unknown) => {
      if (!publicKey) {
        this.setDisconnected();
      } else {
        const pk = publicKey as { toString: () => string };
        this._address = pk.toString();
        this.emit('accountsChanged', [pk.toString()]);
      }
    });
  }
}

// ─── Phantom ──────────────────────────────────────────────────────────────────

export class PhantomAdapter extends SolanaWalletAdapter {
  readonly id: WalletId = 'phantom';
  readonly name = 'Phantom';
  readonly icon = 'https://phantom.app/img/phantom-logo.svg';

  protected findProvider(): SolanaProvider | undefined {
    if (typeof window === 'undefined') return undefined;
    return window.phantom?.solana ?? window.solana?.isPhantom ? window.solana : undefined;
  }
}

// ─── Solflare ─────────────────────────────────────────────────────────────────

export class SolflareAdapter extends SolanaWalletAdapter {
  readonly id: WalletId = 'solflare';
  readonly name = 'Solflare';
  readonly icon = 'https://solflare.com/assets/logo.svg';

  protected findProvider(): SolanaProvider | undefined {
    if (typeof window === 'undefined') return undefined;
    return window.solflare?.isSolflare ? window.solflare : undefined;
  }
}

// ─── Backpack ─────────────────────────────────────────────────────────────────

export class BackpackAdapter extends SolanaWalletAdapter {
  readonly id: WalletId = 'backpack';
  readonly name = 'Backpack';
  readonly icon = 'https://backpack.app/icon.png';

  protected findProvider(): SolanaProvider | undefined {
    if (typeof window === 'undefined') return undefined;
    return window.backpack?.solana ?? undefined;
  }
}

// ─── Export all Solana adapters ───────────────────────────────────────────────

export const SOLANA_ADAPTERS = [
  new PhantomAdapter(),
  new SolflareAdapter(),
  new BackpackAdapter(),
] as const;
