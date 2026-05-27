import { randomBytes, bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';
import { hkdf } from '@noble/hashes/hkdf';

// ─── Key Derivation ───────────────────────────────────────────────────────────

/**
 * Derive a 32-byte symmetric key from a shared secret using HKDF-SHA256.
 */
export function deriveSymKey(
  sharedSecret: Uint8Array,
  salt?: Uint8Array,
  info?: string,
): Uint8Array {
  const infoBytes = new TextEncoder().encode(info ?? 'spirit-relay-v1');
  const saltBytes = salt ?? randomBytes(32);
  return hkdf(sha256, sharedSecret, saltBytes, infoBytes, 32);
}

/**
 * Generate a new random 32-byte symmetric key.
 */
export function generateSymKey(): string {
  return bytesToHex(randomBytes(32));
}

// ─── AES-256-GCM Encryption ───────────────────────────────────────────────────

interface EncryptedPayload {
  iv: string;      // hex
  ciphertext: string; // base64
  tag: string;     // hex (auth tag)
}

/**
 * Encrypt data with AES-256-GCM using a hex-encoded 32-byte key.
 * Returns a JSON-stringified EncryptedPayload base64-encoded.
 */
export async function encrypt(
  plaintext: string,
  symKeyHex: string,
): Promise<string> {
  const key = hexToBytes(symKeyHex);
  const iv = randomBytes(12); // 96-bit IV for GCM

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertextWithTag = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoded,
  );

  // Last 16 bytes are the auth tag
  const ciphertextArr = new Uint8Array(ciphertextWithTag);
  const ciphertext = ciphertextArr.subarray(0, ciphertextArr.length - 16);
  const tag = ciphertextArr.subarray(ciphertextArr.length - 16);

  const payload: EncryptedPayload = {
    iv: bytesToHex(iv),
    ciphertext: uint8ToBase64(ciphertext),
    tag: bytesToHex(tag),
  };

  return btoa(JSON.stringify(payload));
}

/**
 * Decrypt data encrypted with encrypt().
 */
export async function decrypt(
  encryptedBase64: string,
  symKeyHex: string,
): Promise<string> {
  const key = hexToBytes(symKeyHex);
  const payload: EncryptedPayload = JSON.parse(atob(encryptedBase64)) as EncryptedPayload;

  const iv = hexToBytes(payload.iv);
  const ciphertext = base64ToUint8(payload.ciphertext);
  const tag = hexToBytes(payload.tag);

  // Concatenate ciphertext + tag for WebCrypto
  const ciphertextWithTag = new Uint8Array(ciphertext.length + tag.length);
  ciphertextWithTag.set(ciphertext);
  ciphertextWithTag.set(tag, ciphertext.length);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertextWithTag,
  );

  return new TextDecoder().decode(decrypted);
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function uint8ToBase64(arr: Uint8Array): string {
  let binary = '';
  arr.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}

export { uint8ToBase64, base64ToUint8 };
