import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { query } from '../database.js';
import { getEnv } from '../config.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RelayClient {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
  connectedAt: number;
  lastPing: number;
}

interface IncomingMessage {
  action: 'subscribe' | 'unsubscribe' | 'publish' | 'ping';
  topic?: string;
  envelope?: {
    id: string;
    type: string;
    topic: string;
    encryptedPayload: string;
    timestamp: number;
    ttl: number;
  };
}

// ─── In-Memory Relay Store ────────────────────────────────────────────────────

class RelayStore {
  private clients = new Map<string, RelayClient>();
  private topicClients = new Map<string, Set<string>>(); // topic -> client IDs

  addClient(client: RelayClient): void {
    this.clients.set(client.id, client);
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from all topic subscriptions
      client.subscriptions.forEach((topic) => {
        this.topicClients.get(topic)?.delete(clientId);
      });
    }
    this.clients.delete(clientId);
  }

  subscribe(clientId: string, topic: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const env = getEnv();
    if (client.subscriptions.size >= env.RELAY_MAX_SUBSCRIPTIONS) {
      throw new Error('Subscription limit reached');
    }

    client.subscriptions.add(topic);

    if (!this.topicClients.has(topic)) {
      this.topicClients.set(topic, new Set());
    }
    this.topicClients.get(topic)!.add(clientId);
  }

  unsubscribe(clientId: string, topic: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.delete(topic);
    }
    this.topicClients.get(topic)?.delete(clientId);
  }

  /**
   * Publish a message to all subscribers of a topic.
   * Returns the number of clients that received the message.
   */
  publish(topic: string, message: unknown): number {
    const clientIds = this.topicClients.get(topic);
    if (!clientIds || clientIds.size === 0) return 0;

    const payload = JSON.stringify({ envelope: message });
    let delivered = 0;

    clientIds.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === 1 /* OPEN */) {
        try {
          client.ws.send(payload);
          delivered++;
        } catch {
          this.removeClient(clientId);
        }
      }
    });

    return delivered;
  }

  updatePing(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastPing = Date.now();
    }
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      totalTopics: this.topicClients.size,
    };
  }

  /**
   * Clean up stale connections (no ping in 60s).
   */
  cleanup(maxIdleMs = 60_000): void {
    const now = Date.now();
    this.clients.forEach((client, id) => {
      if (now - client.lastPing > maxIdleMs) {
        try { client.ws.close(1001, 'Idle timeout'); } catch { /* ignore */ }
        this.removeClient(id);
      }
    });
  }
}

// ─── Singleton store ──────────────────────────────────────────────────────────

const store = new RelayStore();

// ─── Cleanup interval ─────────────────────────────────────────────────────────

setInterval(() => store.cleanup(), 30_000);

// ─── WebSocket Route Plugin ───────────────────────────────────────────────────

export async function wsRelay(fastify: FastifyInstance): Promise<void> {
  fastify.get('/relay/ws', { websocket: true }, async (socket, request) => {
    const clientId = crypto.randomUUID();
    const client: RelayClient = {
      id: clientId,
      ws: socket,
      subscriptions: new Set(),
      connectedAt: Date.now(),
      lastPing: Date.now(),
    };

    store.addClient(client);
    fastify.log.info({ clientId }, 'Relay client connected');

    // Send welcome
    socket.send(JSON.stringify({ type: 'connected', clientId }));

    socket.on('message', async (rawData: Buffer | string) => {
      let msg: IncomingMessage;

      try {
        msg = JSON.parse(rawData.toString()) as IncomingMessage;
      } catch {
        socket.send(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      try {
        switch (msg.action) {
          case 'ping': {
            store.updatePing(clientId);
            socket.send(JSON.stringify({ type: 'pong' }));
            break;
          }

          case 'subscribe': {
            if (!msg.topic) {
              socket.send(JSON.stringify({ error: 'topic is required' }));
              return;
            }
            store.subscribe(clientId, msg.topic);
            socket.send(JSON.stringify({ type: 'subscribed', topic: msg.topic }));

            // Deliver any pending messages for this topic
            await deliverPendingMessages(msg.topic, socket);
            break;
          }

          case 'unsubscribe': {
            if (!msg.topic) {
              socket.send(JSON.stringify({ error: 'topic is required' }));
              return;
            }
            store.unsubscribe(clientId, msg.topic);
            socket.send(JSON.stringify({ type: 'unsubscribed', topic: msg.topic }));
            break;
          }

          case 'publish': {
            const { envelope } = msg;
            if (!envelope || !envelope.topic) {
              socket.send(JSON.stringify({ error: 'envelope with topic is required' }));
              return;
            }

            const env = getEnv();
            const ttl = Math.min(envelope.ttl ?? 300, env.RELAY_MAX_MESSAGE_TTL);
            const expiresAt = new Date(Date.now() + ttl * 1_000);

            // Persist message
            await query(
              `INSERT INTO spirit_relay_messages
                 (topic, message_type, encrypted_payload, expires_at)
               VALUES ($1, $2, $3, $4)`,
              [envelope.topic, envelope.type, envelope.encryptedPayload, expiresAt],
            );

            // Fan-out to subscribers
            const delivered = store.publish(envelope.topic, envelope);

            socket.send(
              JSON.stringify({ type: 'published', id: envelope.id, delivered }),
            );
            break;
          }

          default: {
            socket.send(JSON.stringify({ error: `Unknown action: ${msg.action as string}` }));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal error';
        socket.send(JSON.stringify({ error: message }));
      }
    });

    socket.on('close', () => {
      store.removeClient(clientId);
      fastify.log.info({ clientId }, 'Relay client disconnected');
    });

    socket.on('error', (err) => {
      fastify.log.error({ clientId, err }, 'Relay socket error');
      store.removeClient(clientId);
    });
  });

  // ── REST stats endpoint ─────────────────────────────────────────────────────
  fastify.get('/relay/stats', async (_request, reply) => {
    return reply.send(store.getStats());
  });
}

// ─── Deliver pending (persisted) messages ─────────────────────────────────────

async function deliverPendingMessages(
  topic: string,
  socket: WebSocket,
): Promise<void> {
  try {
    const rows = await query<{
      id: string;
      message_type: string;
      encrypted_payload: string;
      expires_at: Date;
    }>(
      `SELECT id, message_type, encrypted_payload, expires_at
       FROM spirit_relay_messages
       WHERE topic = $1 AND delivered = FALSE AND expires_at > NOW()
       ORDER BY created_at ASC
       LIMIT 50`,
      [topic],
    );

    for (const row of rows) {
      socket.send(
        JSON.stringify({
          envelope: {
            id: row.id,
            type: row.message_type,
            topic,
            encryptedPayload: row.encrypted_payload,
            timestamp: new Date(row.expires_at).getTime(),
            ttl: 0,
          },
        }),
      );
    }

    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      await query(
        `UPDATE spirit_relay_messages SET delivered = TRUE WHERE id = ANY($1)`,
        [ids],
      );
    }
  } catch (err) {
    console.error('[Spirit Relay] Failed to deliver pending messages:', err);
  }
}
