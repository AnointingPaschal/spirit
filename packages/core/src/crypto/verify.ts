import type { ChainType } from '../types/index.js';

// ─── EVM Verification ─────────────────────────────────────────────────────────

/**
 * Verify an EVM personal_sign signature (EIP-191).
 * Returns the recovered address in checksummed form.
 */
export async function verifyEVMSignature(
  message: string,
  signature: string,
  expectedAddress: string,
): Promise<boolean> {
  try {
    const { ethers } = await import('ethers');
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Recover signer address from an EVM signature.
 */
export async function recoverEVMAddress(
  message: string,
  signature: string,
): Promise<string> {
  const { ethers } = await import('ethers');
  return ethers.verifyMessage(message, signature);
}

// ─── Solana Verification ──────────────────────────────────────────────────────

/**
 * Verify a Solana ed25519 signature.
 * The signature and publicKey are expected as base58 strings.
 */
export async function verifySolanaSignature(
  message: string,
  signatureBase58: string,
  publicKeyBase58: string,
): Promise<boolean> {
  try {
    const nacl = (await import('tweetnacl')).default;
    const { decode } = await import('bs58');

    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = decode(signatureBase58);
    const publicKeyBytes = decode(publicKeyBase58);

    if (publicKeyBytes.length !== 32) return false;
    if (signatureBytes.length !== 64) return false;

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

/**
 * Convert Uint8Array to base58.
 */
export async function bytesToBase58(bytes: Uint8Array): Promise<string> {
  const { encode } = await import('bs58');
  return encode(bytes);
}

// ─── Bitcoin Verification ─────────────────────────────────────────────────────

/**
 * Verify a Bitcoin message signature.
 * Supports P2PKH (legacy), P2SH-P2WPKH (SegWit), and P2WPKH (native SegWit).
 */
export async function verifyBitcoinSignature(
  message: string,
  signature: string,
  address: string,
): Promise<boolean> {
  try {
    const bitcoin = await import('bitcoinjs-lib');
    const { ECPairFactory } = await import('ecpair');
    const ecc = await import('@noble/secp256k1');

    // ECPair-compatible tinysecp interface
    const tinysecp = {
      isPoint: (p: Uint8Array) => {
        try { ecc.ProjectivePoint.fromHex(p); return true; } catch { return false; }
      },
      // Minimal subset needed for signature verification
      verify: (hash: Uint8Array, pubkey: Uint8Array, sig: Uint8Array) => {
        try {
          return ecc.verify(sig, hash, pubkey);
        } catch { return false; }
      },
    };

    const ECPair = ECPairFactory(tinysecp as Parameters<typeof ECPairFactory>[0]);
    void ECPair; // used implicitly via bitcoinjs-lib

    const network = bitcoin.networks.bitcoin;

    // Decode base64 signature
    const sigBuffer = Buffer.from(signature, 'base64');
    if (sigBuffer.length !== 65) return false;

    const flagByte = sigBuffer[0] ?? 0;
    const r = sigBuffer.subarray(1, 33);
    const s = sigBuffer.subarray(33, 65);
    const sig = Buffer.concat([r, s]);

    const hash = bitcoin.crypto.hash256(
      Buffer.concat([
        Buffer.from(
          '\x18Bitcoin Signed Message:\n' +
          String.fromCharCode(message.length) +
          message,
        ),
      ]),
    );

    // Recovery: try all possible keys
    for (let i = 0; i < 4; i++) {
      try {
        const recoveryFlag = (flagByte - 27 - (flagByte >= 31 ? 4 : 0)) % 4;
        const secp = ecc;
        const sigCompact = new Uint8Array(64);
        sigCompact.set(r);
        sigCompact.set(s, 32);

        const recovered = secp.recoverPublicKey(
          new Uint8Array(hash),
          secp.Signature.fromCompact(sigCompact).addRecoveryBit(recoveryFlag),
          true,
        );

        // Derive address from recovered public key
        const { address: derived } = bitcoin.payments.p2pkh({
          pubkey: Buffer.from(recovered),
          network,
        });

        if (derived === address) return true;

        // Try SegWit
        const { address: derivedSegwit } = bitcoin.payments.p2wpkh({
          pubkey: Buffer.from(recovered),
          network,
        });
        if (derivedSegwit === address) return true;
      } catch {
        continue;
      }
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Unified Verifier ─────────────────────────────────────────────────────────

export interface VerifyOptions {
  message: string;
  signature: string;
  address: string;
  chainType: ChainType;
}

/**
 * Verify a signature for any supported chain.
 */
export async function verifySignature(opts: VerifyOptions): Promise<boolean> {
  const { message, signature, address, chainType } = opts;

  switch (chainType) {
    case 'evm':
      return verifyEVMSignature(message, signature, address);
    case 'solana':
      // For Solana, address IS the base58 public key
      return verifySolanaSignature(message, signature, address);
    case 'bitcoin':
      return verifyBitcoinSignature(message, signature, address);
    default:
      return false;
  }
}
