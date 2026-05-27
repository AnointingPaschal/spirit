import type { RelayEnvelope, RelayMessageType, PairingSession } from '../types/index.js';
import { encrypt, decrypt, generateSymKey } from '../crypto/encryption.js';
import { generateNonce } from '../crypto/nonce.js';

type RelayEventHandler = (payload: unknown) => void;

// ─── Relay Client ─────────────────────────────────────────────────────────────

export class RelayClient {
  private ws: WebSocket | null = null;
  private relayUrl: string;
  private handlers = new Map<string, Set<RelayEventHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private subscriptions = new Set<string>(); // subscribed topics
  private pairing: PairingSession | null = null;
  private connected = false;

  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private reconnectDelay = 1000;

  constructor(relayUrl: string) {
    this.relayUrl = relayUrl;
  }

  // ─── Connection ─────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.relayUrl);

        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;

          // Re-subscribe to all topics after reconnect
          this.subscriptions.forEach((topic) => this.subscribe(topic));

          this.startPing();
          resolve();
        };

        this.ws.onclose = () => {
          this.connected = false;
          this.stopPing();
          this.scheduleReconnect();
        };

        this.ws.onerror = (err) => {
          if (!this.connected) reject(new Error('WebSocket connection failed'));
          console.error('[Spirit Relay] WebSocket error:', err);
        };

        this.ws.onmessage = (event: MessageEvent<string>) => {
          this.handleMessage(event.data);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  disconnect(): void {
    this.clearReconnect();
    this.stopPing();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  // ─── Pairing ────────────────────────────────────────────────────────────────

  /**
   * Create a new pairing session with a fresh symmetric key.
   * Returns the pairing session (encode as QR code URI on the dApp side).
   */
  createPairing(): PairingSession {
    const pairing: PairingSession = {
      id: generateNonce(),
      topic: generateNonce(),
      symKey: generateSymKey(),
      expiry: Date.now() + 5 * 60 * 1000, // 5 minute pairing window
      relay: this.relayUrl,
    };
    this.pairing = pairing;
    this.subscribe(pairing.topic);
    return pairing;
  }

  /**
   * Encode a pairing into a URI for QR display.
   * Format: spirit:wc?topic=<topic>&symKey=<symKey>&relay=<relay>&expiry=<expiry>
   */
  encodePairingUri(pairing: PairingSession): string {
    const params = new URLSearchParams({
      topic: pairing.topic,
      symKey: pairing.symKey,
      relay: pairing.relay,
      expiry: pairing.expiry.toString(),
    });
    return `spirit:wc?${params.toString()}`;
  }

  /**
   * Decode a pairing URI back into a PairingSession.
   */
  decodePairingUri(uri: string): PairingSession {
    const url = new URL(uri.replace('spirit:wc?', 'spirit://wc?'));
    const topic = url.searchParams.get('topic');
    const symKey = url.searchParams.get('symKey');
    const relay = url.searchParams.get('relay');
    const expiry = url.searchParams.get('expiry');

    if (!topic || !symKey || !relay || !expiry) {
      throw new Error('Invalid pairing URI');
    }

    if (Date.now() > parseInt(expiry, 10)) {
      throw new Error('Pairing URI has expired');
    }

    return {
      id: generateNonce(),
      topic,
      symKey,
      relay,
      expiry: parseInt(expiry, 10),
    };
  }

  // ─── Publish / Subscribe ────────────────────────────────────────────────────

  subscribe(topic: string): void {
    this.subscriptions.add(topic);
    if (this.isConnected()) {
      this.send({ action: 'subscribe', topic });
    }
  }

  unsubscribe(topic: string): void {
    this.subscriptions.delete(topic);
    if (this.isConnected()) {
      this.send({ action: 'unsubscribe', topic });
    }
  }

  /**
   * Publish an encrypted message on a topic.
   */
  async publish(
    topic: string,
    type: RelayMessageType,
    payload: unknown,
    symKey?: string,
  ): Promise<void> {
    const key = symKey ?? this.pairing?.symKey;
    if (!key) throw new Error('No symmetric key available for encryption');

    const encryptedPayload = await encrypt(JSON.stringify(payload), key);

    const envelope: RelayEnvelope = {
      id: generateNonce(),
      type,
      topic,
      encryptedPayload,
      timestamp: Date.now(),
      ttl: 300, // 5 minutes
    };

    this.send({ action: 'publish', envelope });
  }

  /**
   * Register a handler for a specific message type on a topic.
   */
  on(topic: string, type: RelayMessageType, handler: RelayEventHandler): void {
    const key = `${topic}:${type}`;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }
    this.handlers.get(key)!.add(handler);
  }

  off(topic: string, type: RelayMessageType, handler: RelayEventHandler): void {
    const key = `${topic}:${type}`;
    this.handlers.get(key)?.delete(handler);
  }

  // ─── Internals ──────────────────────────────────────────────────────────────

  private send(data: unknown): void {
    if (!this.isConnected()) {
      console.warn('[Spirit Relay] Not connected, cannot send');
      return;
    }
    this.ws!.send(JSON.stringify(data));
  }

  private async handleMessage(raw: string): Promise<void> {
    try {
      const data = JSON.parse(raw) as { envelope?: RelayEnvelope; type?: string };

      if (data.type === 'pong') return;

      const envelope = data.envelope;
      if (!envelope) return;

      // Find the correct sym key (from active pairing or passed externally)
      const symKey = this.pairing?.symKey;
      if (!symKey) return;

      const decryptedStr = await decrypt(envelope.encryptedPayload, symKey);
      const payload: unknown = JSON.parse(decryptedStr);

      const key = `${envelope.topic}:${envelope.type}`;
      const handlers = this.handlers.get(key);
      if (handlers) {
        handlers.forEach((h) => h(payload));
      }
    } catch (err) {
      console.error('[Spirit Relay] Failed to handle message:', err);
    }
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      this.send({ action: 'ping' });
    }, 20_000);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
