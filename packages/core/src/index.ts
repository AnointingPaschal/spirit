// Main SDK
export { Spirit, createSpirit } from './sdk.js';

// Types
export type {
  Chain,
  ChainType,
  WalletId,
  WalletInfo,
  WalletAccount,
  WalletAdapter,
  WalletEventType,
  WalletEventHandler,
  ConnectResult,
  AuthSession,
  SIWEMessage,
  NonceResponse,
  SignaturePayload,
  VerifyResponse,
  SpiritConfig,
  PairingSession,
  RelayEnvelope,
  RelayMessageType,
  EVMProvider,
  SolanaProvider,
  NativeCurrency,
} from './types/index.js';

// Chains
export {
  ETHEREUM,
  BASE,
  POLYGON,
  ARBITRUM,
  OPTIMISM,
  BNB_CHAIN,
  AVALANCHE,
  SOLANA,
  BITCOIN,
  CHAIN_REGISTRY,
  EVM_CHAINS,
  getChainById,
  getChainByChainId,
  toHexChainId,
  fromHexChainId,
} from './chains/registry.js';

// Wallet detection
export { WalletDetector, ALL_ADAPTERS } from './wallets/detector.js';

// Wallet adapters (EVM)
export {
  MetaMaskAdapter,
  TrustWalletAdapter,
  CoinbaseWalletAdapter,
  RabbyAdapter,
  OKXWalletAdapter,
  BraveWalletAdapter,
  EVM_ADAPTERS,
} from './wallets/evm/adapters.js';

// Wallet adapters (Solana)
export {
  PhantomAdapter,
  SolflareAdapter,
  BackpackAdapter,
  SOLANA_ADAPTERS,
} from './wallets/solana/adapters.js';

// Wallet adapters (Bitcoin)
export {
  UnisatAdapter,
  XverseAdapter,
  LeatherAdapter,
  BITCOIN_ADAPTERS,
} from './wallets/bitcoin/adapters.js';

// Crypto utilities
export {
  generateNonce,
  generateShortNonce,
  hashNonce,
  createNonceRecord,
  isNonceExpired,
  isNonceValid,
} from './crypto/nonce.js';

export {
  verifySignature,
  verifyEVMSignature,
  verifySolanaSignature,
  verifyBitcoinSignature,
  recoverEVMAddress,
} from './crypto/verify.js';

export {
  encrypt,
  decrypt,
  generateSymKey,
  deriveSymKey,
} from './crypto/encryption.js';

// Auth utilities
export {
  buildAuthMessage,
  buildSIWEMessage,
  buildSolanaMessage,
  buildBitcoinMessage,
  parseSIWEMessage,
} from './auth/message.js';

export { SessionManager, createSession } from './auth/session.js';

// Relay
export { RelayClient } from './relay/client.js';
