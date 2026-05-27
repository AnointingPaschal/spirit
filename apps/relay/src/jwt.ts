import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { getEnv } from './config.js';
import type { Chain, WalletId } from '@spirit-protocol/core';

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface AccessTokenPayload extends JWTPayload {
  sub: string;       // wallet address
  sid: string;       // session ID
  wid: WalletId;     // wallet ID
  cid: string;       // chain ID
  ctype: string;     // chain type
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  sid: string;
  type: 'refresh';
}

// ─── Token Service ────────────────────────────────────────────────────────────

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().JWT_SECRET);
}

/**
 * Issue a signed JWT access token.
 */
export async function issueAccessToken(opts: {
  sessionId: string;
  address: string;
  walletId: WalletId;
  chain: Chain;
  expiresIn?: string;
}): Promise<string> {
  const env = getEnv();
  const { sessionId, address, walletId, chain, expiresIn } = opts;

  return new SignJWT({
    sid: sessionId,
    wid: walletId,
    cid: chain.id,
    ctype: chain.type,
  } satisfies Omit<AccessTokenPayload, keyof JWTPayload>)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(address)
    .setIssuedAt()
    .setExpirationTime(expiresIn ?? env.JWT_EXPIRY)
    .setIssuer('spirit-relay')
    .setAudience('spirit-client')
    .sign(getSecretKey());
}

/**
 * Issue a signed JWT refresh token.
 */
export async function issueRefreshToken(opts: {
  sessionId: string;
  address: string;
  expiresIn?: string;
}): Promise<string> {
  const env = getEnv();
  const { sessionId, address, expiresIn } = opts;

  return new SignJWT({
    sid: sessionId,
    type: 'refresh' as const,
  } satisfies Omit<RefreshTokenPayload, keyof JWTPayload>)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(address)
    .setIssuedAt()
    .setExpirationTime(expiresIn ?? env.REFRESH_TOKEN_EXPIRY)
    .setIssuer('spirit-relay')
    .setAudience('spirit-client')
    .sign(getSecretKey());
}

/**
 * Verify and decode an access token. Returns null if invalid or expired.
 */
export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'spirit-relay',
      audience: 'spirit-client',
    });
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify and decode a refresh token. Returns null if invalid or expired.
 */
export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'spirit-relay',
      audience: 'spirit-client',
    });
    const p = payload as RefreshTokenPayload;
    if (p.type !== 'refresh') return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * Extract the expiry timestamp (ms) from a JWT without full verification.
 * Used for setting expiresAt on a session record.
 */
export function getTokenExpiry(token: string): number {
  try {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return 0;
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as { exp?: number };
    return (decoded.exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}
