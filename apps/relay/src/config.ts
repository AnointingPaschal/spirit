import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/spirit'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('1h'),
  REFRESH_TOKEN_EXPIRY: z.string().default('30d'),

  // Session
  SESSION_DURATION: z.coerce.number().default(86400),  // 24h in seconds
  NONCE_EXPIRY: z.coerce.number().default(300),         // 5min in seconds

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().default(60),
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000), // 1 minute

  // Relay
  RELAY_MAX_MESSAGE_TTL: z.coerce.number().default(300),
  RELAY_MAX_SUBSCRIPTIONS: z.coerce.number().default(100),
});

type Env = z.infer<typeof envSchema>;

let _env: Env;

export function getEnv(): Env {
  if (!_env) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
      process.exit(1);
    }
    _env = parsed.data;
  }
  return _env;
}

export const isDev = () => getEnv().NODE_ENV === 'development';
export const isProd = () => getEnv().NODE_ENV === 'production';
