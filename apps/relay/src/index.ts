import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { getEnv } from './config.js';
import { runMigrations, startCleanupJob } from './database.js';
import { authRoutes } from './routes/auth.js';
import { healthRoutes } from './routes/health.js';
import { wsRelay } from './websocket/relay.js';

async function buildServer() {
  const env = getEnv();

  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // ── Plugins ──────────────────────────────────────────────────────────────────

  await fastify.register(helmet, {
    contentSecurityPolicy: false, // handled by client
  });

  await fastify.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await fastify.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    errorResponseBuilder: (_req, context) => ({
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}`,
    }),
  });

  await fastify.register(websocket, {
    options: {
      maxPayload: 1024 * 64, // 64KB max WS message
    },
  });

  // ── Routes ────────────────────────────────────────────────────────────────────

  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(wsRelay);

  // ── Error handler ─────────────────────────────────────────────────────────────

  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);
    const status = error.statusCode ?? 500;
    reply.status(status).send({
      error: error.message ?? 'Internal server error',
      code: error.code,
    });
  });

  // ── Not found handler ─────────────────────────────────────────────────────────

  fastify.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: 'Route not found' });
  });

  return fastify;
}

// ─── Startup ──────────────────────────────────────────────────────────────────

async function main() {
  const env = getEnv();

  let server: Awaited<ReturnType<typeof buildServer>>;

  try {
    // Run DB migrations
    await runMigrations();
    console.log('✅ Database migrations complete');

    // Start cleanup job (every 60s)
    startCleanupJob(60_000);

    // Build & start server
    server = await buildServer();

    await server.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Spirit Relay running at http://${env.HOST}:${env.PORT}`);
    console.log(`🔌 WebSocket relay at ws://${env.HOST}:${env.PORT}/relay/ws`);
  } catch (err) {
    console.error('❌ Failed to start Spirit Relay:', err);
    process.exit(1);
  }

  // ── Graceful shutdown ─────────────────────────────────────────────────────────

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received – shutting down gracefully…`);
    try {
      await server.close();
      console.log('✅ Server closed');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void main();
