import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { verifyAccessToken } from '../jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      address: string;
      sessionId: string;
      walletId: string;
      chainId: string;
    };
  }
}

/**
 * Fastify hook that validates the Bearer token and attaches user to the request.
 */
export function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
): void {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  verifyAccessToken(token)
    .then((payload) => {
      if (!payload) {
        reply.status(401).send({ error: 'Invalid or expired token' });
        return;
      }
      request.user = {
        address: payload.sub ?? '',
        sessionId: payload.sid,
        walletId: payload.wid,
        chainId: payload.cid,
      };
      done();
    })
    .catch(() => {
      reply.status(401).send({ error: 'Token verification failed' });
    });
}

/**
 * Decorator that requires authentication on a route.
 * Usage: register route with preHandler: [requireAuth]
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  const payload = await verifyAccessToken(token);

  if (!payload) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  request.user = {
    address: payload.sub ?? '',
    sessionId: payload.sid,
    walletId: payload.wid,
    chainId: payload.cid,
  };
}
