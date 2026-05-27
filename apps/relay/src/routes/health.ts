import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { queryOne } from '../database.js';

interface SessionRow {
  id: string;
  address: string;
  wallet_id: string;
  chain_id: string;
  chain_type: string;
  expires_at: Date;
  created_at: Date;
  last_seen_at: Date;
}

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // ── GET /health ─────────────────────────────────────────────────────────────
  fastify.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      service: 'spirit-relay',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    });
  });

  // ── GET /me ─────────────────────────────────────────────────────────────────
  fastify.get(
    '/me',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const session = await queryOne<SessionRow>(
        `SELECT id, address, wallet_id, chain_id, chain_type, expires_at, created_at, last_seen_at
         FROM spirit_sessions
         WHERE id = $1 AND revoked = FALSE`,
        [request.user.sessionId],
      );

      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      // Update last_seen_at
      await queryOne(
        'UPDATE spirit_sessions SET last_seen_at = NOW() WHERE id = $1',
        [session.id],
      );

      return reply.send({
        address: session.address,
        walletId: session.wallet_id,
        chainId: session.chain_id,
        chainType: session.chain_type,
        sessionId: session.id,
        expiresAt: new Date(session.expires_at).getTime(),
        createdAt: new Date(session.created_at).getTime(),
        lastSeenAt: new Date(session.last_seen_at).getTime(),
      });
    },
  );
}
