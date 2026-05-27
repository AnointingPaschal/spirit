import EventEmitter from 'eventemitter3';
import type {
  WalletAdapter,
  WalletId,
  WalletEventType,
  WalletEventHandler,
  ChainType,
  Chain,
  ConnectResult,
} from '../types/index.js';

/**
 * Abstract base class for all wallet adapters.
 * Provides event emission and common state tracking.
 */
export abstract class BaseWalletAdapter
  extends EventEmitter<Record<WalletEventType, WalletEventHandler[]>>
  implements WalletAdapter
{
  abstract readonly id: WalletId;
  abstract readonly name: string;
  abstract readonly icon: string;
  abstract readonly type: ChainType;

  protected _address: string | null = null;
  protected _connected = false;
  protected _chain: Chain | null = null;

  abstract connect(chain: Chain): Promise<ConnectResult>;
  abstract disconnect(): Promise<void>;
  abstract getAddress(): Promise<string>;
  abstract signMessage(message: string): Promise<string>;
  abstract isInstalled(): boolean;

  switchChain?(_chainId: number): Promise<void>;

  isConnected(): boolean {
    return this._connected;
  }

  protected setConnected(address: string, chain: Chain): void {
    this._address = address;
    this._chain = chain;
    this._connected = true;
    this.emit('connect', { address, chain });
  }

  protected setDisconnected(): void {
    this._address = null;
    this._chain = null;
    this._connected = false;
    this.emit('disconnect');
  }

  protected handleAccountsChanged(accounts: string[]): void {
    const address = accounts[0];
    if (!address) {
      this.setDisconnected();
    } else {
      this._address = address;
      this.emit('accountsChanged', accounts);
    }
  }

  protected handleChainChanged(chainId: string | number): void {
    this.emit('chainChanged', chainId);
  }

  // EventEmitter compatibility shims for WalletAdapter interface
  override on(event: WalletEventType, handler: WalletEventHandler): this {
    super.on(event, handler as EventEmitter.ListenerFn);
    return this;
  }

  override off(event: WalletEventType, handler: WalletEventHandler): this {
    super.off(event, handler as EventEmitter.ListenerFn);
    return this;
  }
}
