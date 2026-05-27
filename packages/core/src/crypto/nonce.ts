import { randomBytes } from '@noble/hashes/utils';
import { bytesToHex } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';

/**
 * Generate a cryptographically secure random nonce.
 * Returns a 32-byte hex string (64 chars).
 */
export function generateNonce(): string {
  const bytes = randomBytes(32);
  return bytesToHex(bytes);
}

/**
 * Generate a short human-readable nonce for display (e.g., QR pairing codes).
 * Returns an 8-character uppercase alphanumeric string.
 */
export function generateShortNonce(): string {
  const bytes = randomBytes(6);
  return Array.from(bytes)
    .map((b) => b.toString(36).toUpperCase().padStart(1, '0'))
    .join('')
    .slice(0, 8);
}

/**
 * Hash a nonce to store a fingerprint rather than the raw value.
 * Prevents replay if storage is compromised.
 */
export function hashNonce(nonce: string): string {
  const encoder = new TextEncoder();
  const hash = sha256(encoder.encode(nonce));
  return bytesToHex(hash);
}

/**
 * Create a nonce record with expiry for server-side storage.
 */
export interface NonceRecord {
  nonce: string;
  hash: string;
  expiresAt: number;
  used: boolean;
  address?: string;
}

export function createNonceRecord(
  address?: string,
  ttlSeconds = 300,
): NonceRecord {
  const nonce = generateNonce();
  return {
    nonce,
    hash: hashNonce(nonce),
    expiresAt: Date.now() + ttlSeconds * 1000,
    used: false,
    address,
  };
}

export function isNonceExpired(record: NonceRecord): boolean {
  return Date.now() > record.expiresAt;
}

export function isNonceValid(record: NonceRecord, nonce: string): boolean {
  if (record.used) return false;
  if (isNonceExpired(record)) return false;
  return hashNonce(nonce) === record.hash;
}
