FROM node:20-alpine AS base
RUN corepack enable pnpm

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/core/package.json ./packages/core/
COPY apps/relay/package.json ./apps/relay/
RUN pnpm install --frozen-lockfile --filter @spirit-protocol/relay --filter @spirit-protocol/core

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY . .
RUN pnpm --filter @spirit-protocol/core build
RUN pnpm --filter @spirit-protocol/relay build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S spirit && adduser -S spirit -G spirit

COPY --from=builder --chown=spirit:spirit /app/apps/relay/dist ./dist
COPY --from=builder --chown=spirit:spirit /app/apps/relay/package.json ./
COPY --from=builder --chown=spirit:spirit /app/node_modules ./node_modules

USER spirit

EXPOSE 4000
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
