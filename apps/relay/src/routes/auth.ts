import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  createNonceRecord,
  isNonceValid,
  hashNonce,
  verifySignature,
  getChainById,
  type SignaturePayload,
  type AuthSession,
} from '@spirit-protocol/core';
import { query, queryOne, transaction } from '../database.js';
import { issueAccessToken, issueRefreshToken, getTokenExpiry, verifyRefreshToken } from '../jwt.js';
import { getEnv } from '../config.js';

// ─── DB Row Types ─────────────────────────────────────────────────────────────

interface NonceRow {
  id: string;
  address: string | null;
  nonce_hash: string;
  expires_at: Date;
  used: boolean;
}

interface SessionRow {
  id: string;
  address: string;
  wallet_id: string;
  chain_id: string;
  chain_type: string;
  refresh_token: string;
  expires_at: Date;
  revoked: boolean;
}

// ─── Validation Schemas ───────────────────────────────────────────────────────

const NonceRequestSchema = z.object({
  address: z.string().optional(),
});

const VerifyRequestSchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
  address: z.string().min(1),
  chainType: z.enum(['evm', 'solana', 'bitcoin']),
  nonce: z.string().min(1),
  walletId: z.string().min(1),
});

const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const env = getEnv();

  // ── POST /auth/nonce ────────────────────────────────────────────────────────

  fastify.post('/auth/nonce', {
    schema: {
      body: {
        type: 'object',
        properties: { address: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const parsed = NonceRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body' });
    }

    const { address } = parsed.data;

    // Create nonce record
    const record = createNonceRecord(address, env.NONCE_EXPIRY);

    // Persist to DB
    await query(
      `INSERT INTO spirit_nonces (address, nonce_hash, expires_at)
       VALUES ($1, $2, to_timestamp($3 / 1000.0))`,
      [address ?? null, record.hash, record.expiresAt],
    );

    return reply.send({
      nonce: record.nonce,
      expiresAt: record.expiresAt,
    });
  });

  // ── POST /auth/verify ───────────────────────────────────────────────────────

  fastify.post('/auth/verify', async (request, reply) => {
    const parsed = VerifyRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        valid: false,
        error: 'Invalid request: ' + parsed.error.issues[0]?.message,
      });
    }

    const payload = parsed.data as SignaturePayload;
    const { message, signature, address, chainType, nonce, walletId } = payload;

    // 1. Look up nonce in DB
    const nonceHash = hashNonce(nonce);
    const nonceRow = await queryOne<NonceRow>(
      `SELECT id, address, nonce_hash, expires_at, used
       FROM spirit_nonces
       WHERE nonce_hash = $1`,
      [nonceHash],
    );

    if (!nonceRow) {
      return reply.status(400).send({ valid: false, error: 'Nonce not found or already used' });
    }

    // 2. Validate nonce
    const nonceRecord = {
      nonce,
      hash: nonceRow.nonce_hash,
      expiresAt: nonceRow.expires_at.getTime(),
      used: nonceRow.used,
      address: nonceRow.address ?? undefined,
    };

    if (!isNonceValid(nonceRecord, nonce)) {
      return reply.status(400).send({ valid: false, error: 'Nonce is expired or already used' });
    }

    // 3. Validate origin address if nonce was address-bound
    if (nonceRow.address && nonceRow.address.toLowerCase() !== address.toLowerCase()) {
      return reply.status(400).send({ valid: false, error: 'Address mismatch' });
    }

    // 4. Verify cryptographic signature
    const sigValid = await verifySignature({ message, signature, address, chainType });
    if (!sigValid) {
      return reply.status(400).send({ valid: false, error: 'Invalid signature' });
    }

    // 5. Mark nonce as used (atomic to prevent replay)
    const updated = await query<{ id: string }>(
      `UPDATE spirit_nonces SET used = TRUE
       WHERE id = $1 AND used = FALSE
       RETURNING id`,
      [nonceRow.id],
    );

    if (updated.length === 0) {
      // Race condition – nonce was used between SELECT and UPDATE
      return reply.status(400).send({ valid: false, error: 'Nonce already consumed' });
    }

    // 6. Resolve chain
    const chain = getChainById(chainType === 'evm' ? 'ethereum' : chainType) ?? {
      id: chainType,
      name: chainType,
      type: chainType,
      rpcUrls: [],
      nativeCurrency: { name: chainType, symbol: chainType.toUpperCase(), decimals: 18 },
    };

    // 7. Create session and issue tokens
    const session = await transaction(async (client) => {
      const sessionId = uuidv4();

      const accessToken = await issueAccessToken({
        sessionId,
        address,
        walletId: walletId as Parameters<typeof issueAccessToken>[0]['walletId'],
        chain,
      });

      const refreshToken = await issueRefreshToken({ sessionId, address });
      const expiresAt = getTokenExpiry(refreshToken); // use refresh token expiry for session

      await client.query(
        `INSERT INTO spirit_sessions
           (id, address, wallet_id, chain_id, chain_type, refresh_token, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7 / 1000.0))`,
        [sessionId, address, walletId, chain.id, chainType, refreshToken, expiresAt],
      );

      const authSession: AuthSession = {
        id: sessionId,
        address,
        walletId: walletId as AuthSession['walletId'],
        chain,
        token: accessToken,
        refreshToken,
        expiresAt,
        createdAt: Date.now(),
      };

      return authSession;
    });

    return reply.send({ valid: true, session });
  });

  // ── POST /auth/refresh ──────────────────────────────────────────────────────

  fastify.post('/auth/refresh', async (request, reply) => {
    const parsed = RefreshRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request' });
    }

    const { refreshToken } = parsed.data;

    // Verify the refresh JWT
    const tokenPayload = await verifyRefreshToken(refreshToken);
    if (!tokenPayload) {
      return reply.status(401).send({ error: 'Invalid or expired refresh token' });
    }

    // Look up the session
    const sessionRow = await queryOne<SessionRow>(
      `SELECT * FROM spirit_sessions WHERE refresh_token = $1 AND revoked = FALSE`,
      [refreshToken],
    );

    if (!sessionRow || new Date(sessionRow.expires_at) < new Date()) {
      return reply.status(401).send({ error: 'Session not found or expired' });
    }

    // Issue new access token
    const chain = getChainById(sessionRow.chain_id) ?? {
      id: sessionRow.chain_id,
      name: sessionRow.chain_id,
      type: sessionRow.chain_type as 'evm' | 'solana' | 'bitcoin',
      rpcUrls: [],
      nativeCurrency: { name: sessionRow.chain_id, symbol: '', decimals: 18 },
    };

    const newAccessToken = await issueAccessToken({
      sessionId: sessionRow.id,
      address: sessionRow.address,
      walletId: sessionRow.wallet_id as AuthSession['walletId'],
      chain,
    });

    // Update last_seen_at
    await query(
      'UPDATE spirit_sessions SET last_seen_at = NOW() WHERE id = $1',
      [sessionRow.id],
    );

    return reply.send({ token: newAccessToken });
  });

  // ── POST /auth/logout ───────────────────────────────────────────────────────

  fastify.post('/auth/logout', async (request, reply) => {
    const parsed = RefreshRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request' });
    }

    await query(
      'UPDATE spirit_sessions SET revoked = TRUE WHERE refresh_token = $1',
      [parsed.data.refreshToken],
    );

    return reply.send({ success: true });
  });

  // ── GET /auth/session ───────────────────────────────────────────────────────

  fastify.get('/auth/session/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    const sessionRow = await queryOne<SessionRow>(
      `SELECT * FROM spirit_sessions
       WHERE id = $1 AND revoked = FALSE AND expires_at > NOW()`,
      [sessionId],
    );

    if (!sessionRow) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    return reply.send({
      id: sessionRow.id,
      address: sessionRow.address,
      walletId: sessionRow.wallet_id,
      chainId: sessionRow.chain_id,
      chainType: sessionRow.chain_type,
      expiresAt: new Date(sessionRow.expires_at).getTime(),
    });
  });
}
