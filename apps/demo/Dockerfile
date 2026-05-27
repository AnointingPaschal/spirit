FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/core/package.json ./packages/core/
COPY packages/react/package.json ./packages/react/
COPY apps/demo/package.json ./apps/demo/
RUN pnpm install --frozen-lockfile \
      --filter @spirit-protocol/demo \
      --filter @spirit-protocol/react \
      --filter @spirit-protocol/core

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @spirit-protocol/core build
RUN pnpm --filter @spirit-protocol/react build
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm --filter @spirit-protocol/demo build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup -S spirit && adduser -S spirit -G spirit

COPY --from=builder /app/apps/demo/public ./public
COPY --from=builder --chown=spirit:spirit /app/apps/demo/.next/standalone ./
COPY --from=builder --chown=spirit:spirit /app/apps/demo/.next/static ./.next/static

USER spirit
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
