// ─── Chain Types ────────────────────────────────────────────────────────────

export type ChainType = 'evm' | 'solana' | 'bitcoin';

export type EVMChainId =
  | 1      // Ethereum
  | 8453   // Base
  | 137    // Polygon
  | 42161  // Arbitrum
  | 10     // Optimism
  | 56     // BNB Chain
  | 43114; // Avalanche

export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface Chain {
  id: string;
  name: string;
  type: ChainType;
  rpcUrls: string[];
  blockExplorerUrl?: string;
  nativeCurrency: NativeCurrency;
  // EVM-specific
  chainId?: number;
  testnet?: boolean;
  // Solana-specific
  cluster?: 'mainnet-beta' | 'devnet' | 'testnet';
}

// ─── Wallet Types ────────────────────────────────────────────────────────────

export type WalletId =
  // EVM
  | 'metamask'
  | 'trust'
  | 'coinbase'
  | 'rabby'
  | 'okx'
  | 'brave'
  // Solana
  | 'phantom'
  | 'solflare'
  | 'backpack'
  // Bitcoin
  | 'xverse'
  | 'unisat'
  | 'leather';

export interface WalletInfo {
  id: WalletId;
  name: string;
  icon: string;
  type: ChainType;
  installed: boolean;
  downloadUrl: string;
  deepLink?: string;
}

export interface WalletAccount {
  address: string;
  publicKey?: string;
  chain: Chain;
  walletId: WalletId;
}

export interface ConnectResult {
  account: WalletAccount;
  walletId: WalletId;
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface SIWEMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId?: number | string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  resources?: string[];
}

export interface NonceResponse {
  nonce: string;
  expiresAt: number;
}

export interface SignaturePayload {
  message: string;
  signature: string;
  address: string;
  chainType: ChainType;
  nonce: string;
  walletId: WalletId;
}

export interface AuthSession {
  id: string;
  address: string;
  walletId: WalletId;
  chain: Chain;
  token: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: number;
}

export interface VerifyResponse {
  valid: boolean;
  session?: AuthSession;
  error?: string;
}

// ─── Provider Types ──────────────────────────────────────────────────────────

export interface EVMProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isTrust?: boolean;
  isTrustWallet?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isOkxWallet?: boolean;
  isBraveWallet?: boolean;
  providers?: EVMProvider[];
  selectedAddress?: string | null;
  chainId?: string;
}

export interface SolanaProvider {
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{
    publicKey: { toString: () => string; toBytes: () => Uint8Array };
  }>;
  disconnect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    encoding?: 'utf8' | 'hex',
  ) => Promise<{ signature: Uint8Array }>;
  publicKey: { toString: () => string; toBytes: () => Uint8Array } | null;
  isConnected: boolean;
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
}

export interface XverseProvider {
  request: (method: string, options: unknown) => Promise<unknown>;
}

export interface UnisatProvider {
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  signMessage: (message: string, type?: string) => Promise<string>;
  getNetwork: () => Promise<string>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

export interface LeatherProvider {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
}

// ─── Wallet Adapter Interface ────────────────────────────────────────────────

export type WalletEventType =
  | 'connect'
  | 'disconnect'
  | 'accountsChanged'
  | 'chainChanged'
  | 'error';

export type WalletEventHandler = (...args: unknown[]) => void;

export interface WalletAdapter {
  readonly id: WalletId;
  readonly name: string;
  readonly icon: string;
  readonly type: ChainType;

  connect(chain: Chain): Promise<ConnectResult>;
  disconnect(): Promise<void>;
  getAddress(): Promise<string>;
  signMessage(message: string): Promise<string>;
  switchChain?(chainId: number): Promise<void>;

  on(event: WalletEventType, handler: WalletEventHandler): void;
  off(event: WalletEventType, handler: WalletEventHandler): void;

  isInstalled(): boolean;
  isConnected(): boolean;
}

// ─── SDK Config ──────────────────────────────────────────────────────────────

export interface SpiritConfig {
  relayUrl?: string;
  sessionDuration?: number;   // seconds, default 86400 (24h)
  nonceExpiry?: number;       // seconds, default 300 (5min)
  domain?: string;
  appName?: string;
  appUrl?: string;
  debug?: boolean;
  autoReconnect?: boolean;
  storageKey?: string;
}

// ─── Relay / QR Types ────────────────────────────────────────────────────────

export interface PairingSession {
  id: string;
  topic: string;
  symKey: string; // hex-encoded 32-byte key
  expiry: number;
  relay: string;
}

export type RelayMessageType =
  | 'session_propose'
  | 'session_settle'
  | 'session_request'
  | 'session_delete'
  | 'auth_request'
  | 'auth_response'
  | 'ping'
  | 'pong';

export interface RelayEnvelope {
  id: string;
  type: RelayMessageType;
  topic: string;
  encryptedPayload: string; // AES-256-GCM base64
  timestamp: number;
  ttl: number;
}

// ─── Window augmentations (global browser types) ─────────────────────────────

declare global {
  interface Window {
    ethereum?: EVMProvider;
    solana?: SolanaProvider;
    phantom?: {
      solana?: SolanaProvider;
      ethereum?: EVMProvider;
    };
    solflare?: SolanaProvider;
    backpack?: {
      solana?: SolanaProvider;
      ethereum?: EVMProvider;
    };
    xfi?: {
      bitcoin?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
      ethereum?: EVMProvider;
    };
    XverseProviders?: {
      BitcoinProvider?: XverseProvider;
    };
    unisat?: UnisatProvider;
    LeatherProvider?: LeatherProvider;
    okxwallet?: {
      bitcoin?: UnisatProvider;
      solana?: SolanaProvider;
      ethereumProvider?: EVMProvider;
    };
    trustwallet?: { ethereum?: EVMProvider; solana?: SolanaProvider };
    coinbaseWalletExtension?: EVMProvider;
    rabby?: EVMProvider;
  }
}
