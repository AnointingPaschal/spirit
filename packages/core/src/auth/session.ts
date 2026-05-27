import type { AuthSession, Chain, WalletId } from '../types/index.js';

const DEFAULT_STORAGE_KEY = 'spirit:session';

// ─── Session Storage ──────────────────────────────────────────────────────────

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// ─── Session Manager ──────────────────────────────────────────────────────────

export class SessionManager {
  private storageKey: string;
  private currentSession: AuthSession | null = null;

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.currentSession = this.loadFromStorage();
  }

  /**
   * Store a new authenticated session.
   */
  set(session: AuthSession): void {
    this.currentSession = session;
    const storage = getStorage();
    if (storage) {
      try {
        storage.setItem(this.storageKey, JSON.stringify(session));
      } catch (err) {
        console.warn('[Spirit] Failed to persist session:', err);
      }
    }
  }

  /**
   * Get the current session, or null if not authenticated / expired.
   */
  get(): AuthSession | null {
    if (!this.currentSession) return null;
    if (this.isExpired(this.currentSession)) {
      this.clear();
      return null;
    }
    return this.currentSession;
  }

  /**
   * Clear the current session from memory and storage.
   */
  clear(): void {
    this.currentSession = null;
    const storage = getStorage();
    storage?.removeItem(this.storageKey);
  }

  /**
   * Returns true if there is a valid, non-expired session.
   */
  isAuthenticated(): boolean {
    return this.get() !== null;
  }

  /**
   * Returns the JWT access token for the current session.
   */
  getToken(): string | null {
    return this.get()?.token ?? null;
  }

  /**
   * Returns the wallet address for the current session.
   */
  getAddress(): string | null {
    return this.get()?.address ?? null;
  }

  /**
   * Returns seconds until session expiry, or 0 if expired.
   */
  expiresIn(): number {
    const session = this.get();
    if (!session) return 0;
    return Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  }

  /**
   * Update the access token (e.g., after refresh).
   */
  updateToken(token: string, expiresAt: number): void {
    if (!this.currentSession) return;
    this.currentSession = { ...this.currentSession, token, expiresAt };
    this.set(this.currentSession);
  }

  private isExpired(session: AuthSession): boolean {
    return Date.now() >= session.expiresAt;
  }

  private loadFromStorage(): AuthSession | null {
    const storage = getStorage();
    if (!storage) return null;

    try {
      const raw = storage.getItem(this.storageKey);
      if (!raw) return null;

      const session = JSON.parse(raw) as AuthSession;

      // Validate shape
      if (!session.id || !session.address || !session.token) return null;

      // Check expiry
      if (Date.now() >= session.expiresAt) {
        storage.removeItem(this.storageKey);
        return null;
      }

      return session;
    } catch {
      storage.removeItem(this.storageKey);
      return null;
    }
  }
}

// ─── Session Factory ──────────────────────────────────────────────────────────

export function createSession(opts: {
  id: string;
  address: string;
  walletId: WalletId;
  chain: Chain;
  token: string;
  refreshToken: string;
  expiresIn: number; // seconds
}): AuthSession {
  const now = Date.now();
  return {
    id: opts.id,
    address: opts.address,
    walletId: opts.walletId,
    chain: opts.chain,
    token: opts.token,
    refreshToken: opts.refreshToken,
    expiresAt: now + opts.expiresIn * 1000,
    createdAt: now,
  };
}
