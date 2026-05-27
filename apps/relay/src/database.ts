import { Pool, type PoolClient } from 'pg';
import { getEnv } from './config.js';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const env = getEnv();
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on('error', (err) => {
      console.error('[Spirit DB] Unexpected pool error:', err);
    });
  }
  return pool;
}

export async function query<T = unknown>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = unknown>(
  sql: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Migrations ───────────────────────────────────────────────────────────────

export async function runMigrations(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    // Nonces table
    await client.query(`
      CREATE TABLE IF NOT EXISTS spirit_nonces (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        address     TEXT,
        nonce_hash  TEXT NOT NULL UNIQUE,
        expires_at  TIMESTAMPTZ NOT NULL,
        used        BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Index for cleanup
    await client.query(`
      CREATE INDEX IF NOT EXISTS spirit_nonces_expires_at_idx
        ON spirit_nonces (expires_at);
    `);

    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS spirit_sessions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        address         TEXT NOT NULL,
        wallet_id       TEXT NOT NULL,
        chain_id        TEXT NOT NULL,
        chain_type      TEXT NOT NULL,
        refresh_token   TEXT NOT NULL UNIQUE,
        expires_at      TIMESTAMPTZ NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revoked         BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS spirit_sessions_address_idx
        ON spirit_sessions (address);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS spirit_sessions_refresh_token_idx
        ON spirit_sessions (refresh_token);
    `);

    // Relay messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS spirit_relay_messages (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic             TEXT NOT NULL,
        message_type      TEXT NOT NULL,
        encrypted_payload TEXT NOT NULL,
        expires_at        TIMESTAMPTZ NOT NULL,
        delivered         BOOLEAN NOT NULL DEFAULT FALSE,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS spirit_relay_messages_topic_idx
        ON spirit_relay_messages (topic, delivered, expires_at);
    `);

    await client.query('COMMIT');
    console.log('[Spirit DB] Migrations complete');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Cleanup job ──────────────────────────────────────────────────────────────

export function startCleanupJob(intervalMs = 60_000): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      await query('DELETE FROM spirit_nonces WHERE expires_at < NOW()');
      await query('DELETE FROM spirit_sessions WHERE expires_at < NOW() AND revoked = TRUE');
      await query('DELETE FROM spirit_relay_messages WHERE expires_at < NOW()');
    } catch (err) {
      console.error('[Spirit DB] Cleanup error:', err);
    }
  }, intervalMs);
}
