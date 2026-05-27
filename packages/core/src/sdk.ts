import type {
  SpiritConfig,
  WalletId,
  Chain,
  ConnectResult,
  AuthSession,
  SignaturePayload,
  VerifyResponse,
  WalletAdapter,
  WalletInfo,
  NonceResponse,
} from './types/index.js';
import { WalletDetector } from './wallets/detector.js';
import { SessionManager } from './auth/session.js';
import { buildAuthMessage } from './auth/message.js';
import { RelayClient } from './relay/client.js';
import { ETHEREUM } from './chains/registry.js';

// ─── Spirit SDK ────────────────────────────────────────────────────────────────

export class Spirit {
  private config: Required<SpiritConfig>;
  private sessionManager: SessionManager;
  private relayClient: RelayClient | null = null;
  private activeAdapter: WalletAdapter | null = null;

  constructor(config: SpiritConfig = {}) {
    this.config = {
      relayUrl: config.relayUrl ?? '',
      sessionDuration: config.sessionDuration ?? 86_400,       // 24h
      nonceExpiry: config.nonceExpiry ?? 300,                   // 5min
      domain: config.domain ?? (typeof window !== 'undefined' ? window.location.hostname : 'localhost'),
      appName: config.appName ?? 'Spirit App',
      appUrl: config.appUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost'),
      debug: config.debug ?? false,
      autoReconnect: config.autoReconnect ?? true,
      storageKey: config.storageKey ?? 'spirit:session',
    };

    this.sessionManager = new SessionManager(this.config.storageKey);

    if (this.config.relayUrl) {
      this.relayClient = new RelayClient(this.config.relayUrl);
    }

    // Auto-reconnect if session exists
    if (this.config.autoReconnect && this.sessionManager.isAuthenticated()) {
      this.log('Existing session found, auto-reconnect enabled.');
    }
  }

  // ─── Wallet Detection ────────────────────────────────────────────────────────

  detectWallets(): WalletInfo[] {
    return WalletDetector.detectAll();
  }

  getInstalledWallets(): WalletInfo[] {
    return WalletDetector.detectInstalled();
  }

  // ─── Connection ──────────────────────────────────────────────────────────────

  async connect(walletId: WalletId, chain?: Chain): Promise<ConnectResult> {
    const adapter = WalletDetector.getAdapter(walletId);
    if (!adapter) throw new Error(`Unknown wallet: ${walletId}`);

    if (!adapter.isInstalled()) {
      const wallets = WalletDetector.detectAll();
      const info = wallets.find((w) => w.id === walletId);
      throw new Error(
        `${adapter.name} is not installed. Download at: ${info?.downloadUrl ?? ''}`,
      );
    }

    const targetChain = chain ?? ETHEREUM;
    const result = await adapter.connect(targetChain);

    this.activeAdapter = adapter;
    this.log(`Connected to ${adapter.name} on ${targetChain.name}`);

    return result;
  }

  async disconnect(): Promise<void> {
    if (this.activeAdapter) {
      await this.activeAdapter.disconnect().catch(() => {});
      this.activeAdapter = null;
    }
    this.sessionManager.clear();
    this.log('Disconnected');
  }

  // ─── Authentication ──────────────────────────────────────────────────────────

  /**
   * Full authentication flow:
   * 1. Connect wallet (if not already)
   * 2. Fetch nonce from relay/server
   * 3. Build sign-in message
   * 4. Request wallet signature
   * 5. Verify with server
   * 6. Store session
   */
  async authenticate(
    walletId: WalletId,
    chain?: Chain,
    opts?: { fetchNonce?: () => Promise<NonceResponse>; verify?: (payload: SignaturePayload) => Promise<VerifyResponse> },
  ): Promise<AuthSession> {
    const targetChain = chain ?? ETHEREUM;

    // Step 1: Connect wallet
    const { account } = await this.connect(walletId, targetChain);

    // Step 2: Get nonce
    let nonceResponse: NonceResponse;
    if (opts?.fetchNonce) {
      nonceResponse = await opts.fetchNonce();
    } else if (this.config.relayUrl) {
      nonceResponse = await this.fetchNonceFromRelay(account.address);
    } else {
      // Fallback: generate client-side nonce (for dev / self-hosted)
      const { generateNonce } = await import('./crypto/nonce.js');
      nonceResponse = {
        nonce: generateNonce(),
        expiresAt: Date.now() + this.config.nonceExpiry * 1000,
      };
    }

    // Step 3: Build message
    const message = buildAuthMessage({
      chain: targetChain,
      address: account.address,
      nonce: nonceResponse.nonce,
      domain: this.config.domain,
      uri: this.config.appUrl,
      expiresIn: this.config.nonceExpiry,
    });

    // Step 4: Sign
    const adapter = WalletDetector.getAdapter(walletId);
    if (!adapter) throw new Error(`Adapter not found for ${walletId}`);

    const signature = await adapter.signMessage(message);
    this.log('Message signed successfully');

    // Step 5: Verify
    const signaturePayload: SignaturePayload = {
      message,
      signature,
      address: account.address,
      chainType: targetChain.type,
      nonce: nonceResponse.nonce,
      walletId,
    };

    let session: AuthSession;
    if (opts?.verify) {
      const result = await opts.verify(signaturePayload);
      if (!result.valid || !result.session) {
        throw new Error(result.error ?? 'Signature verification failed');
      }
      session = result.session;
    } else if (this.config.relayUrl) {
      session = await this.verifyWithRelay(signaturePayload);
    } else {
      // Local verification fallback (no server)
      const { verifySignature } = await import('./crypto/verify.js');
      const { v4: uuidv4 } = await import('uuid');

      const valid = await verifySignature({
        message,
        signature,
        address: account.address,
        chainType: targetChain.type,
      });

      if (!valid) throw new Error('Invalid signature');

      session = {
        id: uuidv4(),
        address: account.address,
        walletId,
        chain: targetChain,
        token: `local:${account.address}`,
        refreshToken: `local-refresh:${account.address}`,
        expiresAt: Date.now() + this.config.sessionDuration * 1000,
        createdAt: Date.now(),
      };
    }

    // Step 6: Store session
    this.sessionManager.set(session);
    this.log(`Authenticated: ${session.address}`);

    return session;
  }

  // ─── Session ─────────────────────────────────────────────────────────────────

  getSession(): AuthSession | null {
    return this.sessionManager.get();
  }

  isAuthenticated(): boolean {
    return this.sessionManager.isAuthenticated();
  }

  getToken(): string | null {
    return this.sessionManager.getToken();
  }

  // ─── Relay ───────────────────────────────────────────────────────────────────

  getRelayClient(): RelayClient | null {
    return this.relayClient;
  }

  async connectRelay(): Promise<void> {
    if (!this.relayClient) throw new Error('No relay URL configured');
    await this.relayClient.connect();
  }

  createPairingSession() {
    if (!this.relayClient) throw new Error('No relay URL configured');
    return this.relayClient.createPairing();
  }

  // ─── Internals ───────────────────────────────────────────────────────────────

  private async fetchNonceFromRelay(address: string): Promise<NonceResponse> {
    const resp = await fetch(`${this.config.relayUrl}/auth/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    if (!resp.ok) throw new Error('Failed to fetch nonce from relay');
    return resp.json() as Promise<NonceResponse>;
  }

  private async verifyWithRelay(payload: SignaturePayload): Promise<AuthSession> {
    const resp = await fetch(`${this.config.relayUrl}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const err = await resp.json() as { error?: string };
      throw new Error(err.error ?? 'Verification failed');
    }
    const result = await resp.json() as VerifyResponse;
    if (!result.valid || !result.session) {
      throw new Error(result.error ?? 'Verification failed');
    }
    return result.session;
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) console.log('[Spirit]', ...args);
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createSpirit(config?: SpiritConfig): Spirit {
  return new Spirit(config);
}
